import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import {EventEmitter} from 'events';

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8787
const SOLAX_TOKEN_ID = process.env.SOLAX_TOKEN_ID || ''
const SOLAX_SN_1 = process.env.SOLAX_SN_1 || ''
const SOLAX_NAME_1 = process.env.SOLAX_NAME_1 || ''
const SOLAX_SN_2 = process.env.SOLAX_SN_2 || ''
const SOLAX_NAME_2 = process.env.SOLAX_NAME_2 || ''
const SOLAX_UPDATE_INTERVAL_SECONDS = process.env.SOLAX_UPDATE_INTERVAL_SECONDS || 30;


class InverterData {
    constructor(raw, inverterName) {
        console.log(`Creating InverterData for ${inverterName} with SN: ${raw.sn}`, JSON.stringify(raw, null, 2))
        this.sn = raw.sn;
        this.inverterName = inverterName;
        this.inverterSN = raw.inverterSN;
        this.inverterType = raw.inverterType;

        this.uploadTime = raw.uploadTime;
        this.utcDateTime = raw.utcDateTime;

        this.acPower = Number(raw.acpower || 0);
        this.yieldToday = Number(raw.yieldtoday || 0);
        this.yieldTotal = Number(raw.yieldtotal || 0);

        this.feedInPower = Number(raw.feedinpower || 0);
        this.feedInEnergy = Number(raw.feedinenergy || 0);
        this.consumeEnergy = Number(raw.consumeenergy || 0);
        this.feedInPowerM2 = Number(raw.feedinpowerM2 || 0);

        this.soc = Number(raw.soc || 0);
        this.batPower = Number(raw.batPower || 0);
        this.batStatus = raw.batStatus; // 0: Idle, 1: Charge, 2: Discharge

        this.peps1 = Number(raw.peps1 || 0);
        this.peps2 = Number(raw.peps2 || 0);
        this.peps3 = Number(raw.peps3 || 0);
        this.epsTotal = this.peps1 + this.peps2 + this.peps3;

        this.powerdc1 = raw.powerdc1 !== null ? Number(raw.powerdc1) : null;
        this.powerdc2 = raw.powerdc2 !== null ? Number(raw.powerdc2) : null;
        this.powerdc3 = raw.powerdc3 !== null ? Number(raw.powerdc3) : null;
        this.powerdc4 = raw.powerdc4 !== null ? Number(raw.powerdc4) : null;

        this.pvPowerTotal = [this.powerdc1, this.powerdc2, this.powerdc3, this.powerdc4]
            .reduce((sum, val) => sum + (val || 0), 0);

        this.status = raw.inverterStatus;
    }

    get estimatedLoad() {
        // Якщо ми в режимі EPS (107), навантаження дорівнює сумі потужностей по фазах EPS
        if (this.status === '107') {
            return Math.max(0, Math.round(this.epsTotal));
        }

        // В нормальному режимі (102) рахуємо через баланс:
        // Те, що видає інвертор мінус те, що пішло в мережу (або плюс те, що прийшло)
        const load = this.acPower - this.feedInPower;

        // Якщо результат підозріло малий, а ми бачимо активність на EPS фазах,
        // можливо інвертор частково живить виділену лінію
        if (load < 10 && this.epsTotal > 10) {
            return Math.round(this.epsTotal);
        }

        return Math.max(0, Math.round(load));
    }

    toJSON() {
        const pvPowerTotal = this.pvPowerTotal;

        const batteryPowerFixed = this.batPower;

        const gridPresence = this.status === '102' ? 1 : 0;

        // Споживання зовнішньої мережі: +імпорт (беремо), -експорт (віддаємо)
        const externalGridPower = this.feedInPower * -1;

        // Загальне споживання
        const totalConsumption = this.estimatedLoad;

        // Розрахунок Daily self-use rate: який % від генерації ми спожили самі
        // Формула: ((Генерація - Експорт) / Генерація) * 100
        let selfUseRate = 0;
        if (this.yieldToday > 0) {
            const actualExport = Math.min(this.yieldToday, this.feedInEnergy);
            selfUseRate = ((this.yieldToday - actualExport) / this.yieldToday) * 100;
        }



        return {
            name: this.inverterName,

            pvPower: this.pvPowerTotal,
            batteryFlow: batteryPowerFixed,
            gridStatus: gridPresence,
            gridFlow: externalGridPower,
            consumption: this.estimatedLoad,

            // Статистика за день (kWh)
            yieldToday: this.yieldToday,       // Скільки всього згенеровано
            importToday: this.consumeEnergy,   // Скільки взято з мережі
            exportToday: this.feedInEnergy,    // Скільки віддано в мережу
            selfUseRate: Math.round(selfUseRate) // % власного споживання
        };
    }
}

async function fetchSolaxData(tokenId, sn) {
    const url = 'https://global.solaxcloud.com/api/v2/dataAccess/realtimeInfo/get';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'tokenId': tokenId,
        },
        body: JSON.stringify({ wifiSn: sn }),
    });

    if (!response.ok) {
        throw new Error(`SolaX API error: ${response.statusText}`);
    }

    return await response.json();
}

class SolarManager extends EventEmitter {
    constructor() {
        super();
        this.states = new Map(); // Останні дані
        this.history = new Map(); // Історія за 10 хв: Map<sn, Array<{t, data}>>
        this.errors = new Map();  // Помилки зв'язку
        this.MAX_HISTORY_MS = 10 * 60 * 1000; // 10 хвилин
    }

    updateInverter(sn, data, name) {
        const now = Date.now();
        const previous = this.states.get(sn);
        const current = new InverterData(data, name);

        console.log(JSON.stringify(current));

        // Оновлюємо поточний стан та очищуємо помилки
        this.states.set(sn, current);
        this.errors.delete(sn);

        // Зберігаємо в історію
        if (!this.history.has(sn)) this.history.set(sn, []);
        const snHistory = this.history.get(sn);
        snHistory.push({t: now, data: current});

        const cutoff = now - this.MAX_HISTORY_MS;
        while (snHistory.length > 0 && snHistory[0].t < cutoff) {
            snHistory.shift();
        }

        // Аналітика та реактивність
        // if (previous) {
        //     this.checkAnomalies(previous, current);
        // }


        this.emit('update', {sn, current});
    }

    setInverterError(sn, name, error) {
        this.errors.set(sn, {
            name,
            message: error,
            timestamp: new Date().toISOString()
        });

        this.emit('alert', {
            type: 'CONNECTION_LOST',
            message: `Втрачено зв'язок з інвертором ${name} (${sn}): ${error}`
        });
    }

    getAnalytics(sn) {
        const snHistory = this.history.get(sn) || [];
        if (snHistory.length < 2) return null;

        const first = snHistory[0].data;
        const last = snHistory[snHistory.length - 1].data;

        return {
            pointsCount: snHistory.length,
            loadTrend: last.estimatedLoad - first.estimatedLoad, // Різниця споживання
            socChange: last.soc - first.soc, // Як змінився заряд
            isCharging: last.soc > first.soc
        };
    }
}

const solarManager = new SolarManager();

setInterval(async () => {
    const data1 = await fetchSolaxData(SOLAX_TOKEN_ID, SOLAX_SN_1)

    solarManager.updateInverter(SOLAX_SN_1, data1.result, SOLAX_NAME_1);

    const data2 = await fetchSolaxData(SOLAX_TOKEN_ID, SOLAX_SN_2)

    solarManager.updateInverter(SOLAX_SN_2, data2.result, SOLAX_NAME_2);

}, SOLAX_UPDATE_INTERVAL_SECONDS * 1000);

app.get('/api/solax/realtime',
    async (req, res) => {
        try {
            const invertersData = Array.from(solarManager.states.values()).map(data => data.toJSON());
            //
            // const totalStats = invertersData.reduce((acc, inv) => {
            //     acc.pvPower += inv.pvPower;
            //     acc.consumption += inv.consumption;
            //     acc.batteryFlow += inv.batteryFlow;
            //     acc.gridFlow += inv.gridFlow;
            //
            //     acc.yieldToday += inv.yieldToday;
            //     acc.importToday += inv.importToday;
            //     acc.exportToday += inv.exportToday;
            //
            //     acc.count++;
            //     return acc;
            // }, {
            //     pvPower: 0, consumption: 0, batteryFlow: 0, gridFlow: 0,
            //     yieldToday: 0, importToday: 0, exportToday: 0, avgSoc: 0, count: 0
            // });
            //
            // let totalSelfUseRate = 0;
            // if (totalStats.yieldToday > 0) {
            //     const totalActualExport = Math.min(totalStats.yieldToday, totalStats.exportToday);
            //     totalSelfUseRate = ((totalStats.yieldToday - totalActualExport) / totalStats.yieldToday) * 100;
            // }

            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                total: {
                    // pvPower: totalStats.pvPower,
                    // consumption: totalStats.consumption,
                    // batteryFlow: totalStats.batteryFlow,
                    // gridFlow: totalStats.gridFlow,
                    //
                    // yieldToday: Number(totalStats.yieldToday.toFixed(2)),
                    // importToday: Number(totalStats.importToday.toFixed(2)),
                    // exportToday: Number(totalStats.exportToday.toFixed(2)),
                    //
                    // selfUseRate: Math.round(totalSelfUseRate)
                },
                inverters: invertersData
            });
        } catch (e) {
            res.status(500).json({success: false, exception: String(e)})
        }
    });
// Serve built files if present
const distDir = path.join(__dirname, 'dist')
app.use(express.static(distDir))

const publicDir = path.join(__dirname, 'public')
app.use(express.static(publicDir))

app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, () => {
    console.log('Server listening on http://0.0.0.0:' + PORT)
})
