<template>
  <div class="container">
    <LogoHPK/>
    <div v-if="!loading" class="error">
      <BatteryStatus :soc="85" :battery-flow="+2540"/>
      <Solar :solar-power="28000"/>
      <Grid :grid-flow-w="-2000"/>

    </div>
    <div>

    </div>
    <div class="header">
      <template v-if="demoMode">Режим демонстрації: синтетичні дані. Додайте ?tokenId=...&sn=... до URL або налаштуйте .env і використовуйте /api/solax/realtime.</template>
      <template v-else>Джерело: SolaX Cloud API v6.1 — LIVE.</template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import VChart from 'vue-echarts'
import LogoHPK from "./components/LogoHPK.vue";
import BatteryStatus from "./components/BatteryStatus.vue";
import Solar from "./components/Solar.vue";
import Grid from "./components/Grid.vue";

// register
const vChart = VChart;


const STATUS_MAP = {
  100: 'Wait Mode',
  102: 'Normal Mode',
  103: 'Fault Mode',
  107: 'EPS Mode',
  109: 'Idle Mode',
  110: 'Standby Mode',
}

function useQuery() {
  const p = new URLSearchParams(location.search)
  return {
    tokenId: p.get('tokenId'),
    sn: p.get('sn'),
  }
}

const data = ref(null)
const error = ref(null)
const loading = ref(true)
const lastUpdated = ref(null)
const series = ref([]) // {t,pv,load,grid,bat}

const { tokenId, sn } = useQuery()
const demoMode = ref(!(tokenId && sn))

const intervalDemo = ref(null)
const intervalLive = ref(null)

const pvPower = computed(() => {
  if (!data.value) return 0
  return (data.value.powerdc1||0)+(data.value.powerdc2||0)+(data.value.powerdc3||0)+(data.value.powerdc4||0)
})
const gridPower = computed(() => data.value?.feedinpower ?? 0)
const batteryPower = computed(() => data.value?.batPower ?? 0)

const statusText = computed(() => {
  const code = data.value?.inverterStatus
  return code==null ? '—' : (STATUS_MAP[code] || `Status ${code}`)
})

const lastUpdatedText = computed(() => lastUpdated.value
    ? lastUpdated.value.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})
    : '—'
)

function toFixed(v, n=1) {
  if (v==null || isNaN(v)) return '0.0'
  try { return Number(v).toFixed(n) } catch { return String(v) }
}

function formatWatt(w) {
  if (w==null) return '—'
  const aw = Math.abs(w)
  if (aw < 1000) return `${Math.round(w)} W`
  return `${(w/1000).toFixed(2)} kW`
}

function pushPoint(now, pv, load, grid, bat) {
  series.value.push({ t: now.getTime(), pv, load, grid, bat })
  if (series.value.length > 60) series.value.shift()
}

function startDemo() {
  stopAll()

  // Базові стани для двох інверторів
  const base1 = { load: 2300, soc: 65, yieldtoday: 12.4, status: 102 }
  const base2 = { load: 1800, soc: 45, yieldtoday: 8.2, status: 102 }

  const tick = () => {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI))

    const generateInverterDemo = (base, name) => {
      const pv = Math.round((500 + 4500 * daylight + (Math.random() - 0.5) * 200))
      const load = Math.max(500, Math.round(base.load + (Math.random() - 0.5) * 300))

      let bat = 0, grid = 0
      if (pv > load) {
        bat = Math.min(1400, Math.round((pv - load) * 0.5))
        grid = Math.round((pv - load) - Math.abs(bat))
      } else {
        bat = Math.min(1500, Math.round((load - pv) * 0.4))
        grid = Math.round((load - pv) - Math.max(0, bat))
      }

      base.soc = Math.max(10, Math.min(95, base.soc - bat / 5000))
      base.yieldtoday += pv / 100000 // Симуляція приросту за день

      // Формуємо об'єкт згідно з новим InverterData.toJSON()
      return {
        name: name,
        pvPower: pv,
        batteryFlow: -bat, // +заряд, -розряд (як у вашому бекенді)
        gridStatus: 1,
        gridFlow: -grid,   // +імпорт, -експорт
        consumption: load,
        soc: Math.round(base.soc),
        yieldToday: Number(base.yieldtoday.toFixed(2)),
        importToday: Number((base.yieldtoday * 0.4).toFixed(2)),
        exportToday: Number((base.yieldtoday * 0.1).toFixed(2)),
        selfUseRate: 90
      }
    }

    const inv1 = generateInverterDemo(base1, 'Лінія 1')
    const inv2 = generateInverterDemo(base2, 'Лінія 2')
    const inverters = [inv1, inv2]

    // Розрахунок total
    const total = {
      pvPower: inv1.pvPower + inv2.pvPower,
      consumption: inv1.consumption + inv2.consumption,
      batteryFlow: inv1.batteryFlow + inv2.batteryFlow,
      gridFlow: inv1.gridFlow + inv2.gridFlow,
      soc: Math.round((inv1.soc + inv2.soc) / 2),
      yieldToday: Number((inv1.yieldToday + inv2.yieldToday).toFixed(2)),
      importToday: Number((inv1.importToday + inv2.importToday).toFixed(2)),
      exportToday: Number((inv1.exportToday + inv2.exportToday).toFixed(2)),
      selfUseRate: 90
    }

    data.value = {
      success: true,
      timestamp: now.toISOString(),
      total: total,
      inverters: inverters,
    }

    console.log('Fetched data:', data.value)

    lastUpdated.value = now
    pushPoint(now, total.pvPower, total.consumption, total.gridFlow, total.batteryFlow)
    loading.value = false
  }

  tick()
  intervalDemo.value = setInterval(tick, 2000)
}

async function fetchOnce() {
  try {
    error.value = null
    const url = `/api/solax/realtime?tokenId=${encodeURIComponent(tokenId||'')}&sn=${encodeURIComponent(sn||'')}`
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) throw new Error('HTTP '+r.status)
    const json = await r.json()
    if (!json.success) throw new Error(json.exception||'SolaX response not successful')
    if (!json.result) throw new Error('Empty result')
    data.value = json.result
    const now = new Date()
    lastUpdated.value = now
    const pv = (json.result.powerdc1||0)+(json.result.powerdc2||0)+(json.result.powerdc3||0)+(json.result.powerdc4||0)
    const grid = json.result.feedinpower ?? 0
    const ac = json.result.acpower ?? 0
    const bat = json.result.batPower ?? 0
    const estimatedLoad = ac + Math.max(0, -grid) + Math.max(0, bat) - Math.max(0, grid) + Math.max(0, -bat)
    pushPoint(now, pv, Math.max(0, estimatedLoad), grid, bat)
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

function startLive() {
  stopAll()
  fetchOnce()
  intervalLive.value = setInterval(fetchOnce, 15000)
}

function stopAll() {
  if (intervalDemo.value) { clearInterval(intervalDemo.value); intervalDemo.value = null }
  if (intervalLive.value) { clearInterval(intervalLive.value); intervalLive.value = null }
}

function toggleDemo() {
  demoMode.value = !demoMode.value
  if (demoMode.value) startDemo(); else startLive()
}

onMounted(() => {
  if (demoMode.value) startDemo(); else startLive()
})

onBeforeUnmount(() => stopAll())

// Chart Option
const chartOption = computed(() => ({
  animation: true,
  backgroundColor: 'transparent',
  grid: { left: 30, right: 10, top: 10, bottom: 25 },
  tooltip: { trigger: 'axis', valueFormatter: (v) => formatWatt(v) },
  xAxis: {
    type: 'category',
    data: series.value.map(s => new Date(s.t)).map(t => t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})),
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#1d2733' } },
    axisLabel: { color: '#9fb0c3' },
  },
  yAxis: { type:'value', axisLine:{show:false}, splitLine:{ lineStyle:{ color:'#1d2733' } }, axisLabel:{ color:'#9fb0c3' } },
  series: [
    { name:'PV', type:'line', smooth:true, symbol:'none', areaStyle:{ opacity:0.15 }, data: series.value.map(s=>s.pv) },
    { name:'Load', type:'line', smooth:true, symbol:'none', areaStyle:{ opacity:0.12 }, data: series.value.map(s=>s.load) },
    { name:'Grid (±)', type:'line', smooth:true, symbol:'none', areaStyle:{ opacity:0.10 }, data: series.value.map(s=>s.grid) },
    { name:'Battery (±)', type:'line', smooth:true, symbol:'none', areaStyle:{ opacity:0.10 }, data: series.value.map(s=>s.bat) },
  ]
}))
</script>

<style scoped>
.chart { width: 100%; }
</style>
