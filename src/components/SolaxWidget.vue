<template>
  <div class="container general-background" sy>
    <div class="header">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="font-size:26px; font-weight:700;">Енергосистема коледжу · Live</div>
        <span v-if="demoMode" class="chip">DEMO</span>
      </div>
      <div class="muted" style="display:flex; align-items:center; gap:10px; font-size:13px;">
        <span>Оновлено {{ lastUpdatedText }}</span>
        <button class="btn" @click="toggleDemo()">{{ demoMode ? 'Вимкнути DEMО' : 'Увімкнути DEMО' }}</button>
      </div>
    </div>

    <div class="grid grid-cols-1 grid-cols-2 grid-cols-4">
      <div class="card">
        <div style="display:flex; justify-content:space-between;">
          <div class="muted" style="font-size:13px;">PV (генерація DC)</div>
          <div class="accent">☀️</div>
        </div>
        <div class="kpi" style="margin-top:8px;">{{ formatWatt(pvPower) }}</div>
        <div class="muted" style="font-size:12px; margin-top:4px;">MPPT1–4 сумарно</div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between;">
          <div class="muted" style="font-size:13px;">Battery</div>
          <div class="accent">{{ batteryPower > 0 ? '🔋↘️' : (batteryPower < 0 ? '🔋↗️' : '🔋') }}</div>
        </div>
        <div class="kpi" style="margin-top:8px;">{{ formatWatt(batteryPower) }}</div>
        <div class="muted" style="font-size:12px; margin-top:4px;">SOC: {{ data?.soc ?? '—' }}% · {{ batteryPower < 0 ? 'заряд' : (batteryPower > 0 ? 'розряд' : '—') }}</div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between;">
          <div class="muted" style="font-size:13px;">Grid</div>
          <div class="accent">{{ gridPower > 0 ? '↗️' : (gridPower < 0 ? '↘️' : '•') }}</div>
        </div>
        <div class="kpi" :class="gridPower>0 ? 'ok' : (gridPower<0 ? 'bad' : '')" style="margin-top:8px;">
          {{ formatWatt(Math.abs(gridPower)) }}
        </div>
        <div class="muted" style="font-size:12px; margin-top:4px;">{{ gridPower>0 ? 'експорт у мережу' : (gridPower<0 ? 'імпорт з мережі' : 'баланс = 0') }}</div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between;">
          <div class="muted" style="font-size:13px;">Inverter</div>
          <div class="accent">⚙️</div>
        </div>
        <div style="margin-top:8px; font-weight:600;">{{ statusText }}</div>
        <div class="muted" style="font-size:12px; margin-top:4px;">Сьогодні: {{ toFixed(data?.yieldtoday,1) }} kWh · Всього: {{ toFixed(data?.yieldtotal,1) }} kWh</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="muted" style="font-size:13px; margin-bottom:8px;">15 хв тренд ({{ demoMode ? 'демо кожні 2с' : 'кожні 15с' }})</div>
      <v-chart class="chart" :option="chartOption" autoresize style="height:320px; width:100%;" />
    </div>

    <div class="muted" style="font-size:12px; margin-top:12px;">
      <template v-if="demoMode">Режим демонстрації: синтетичні дані. Додайте ?tokenId=...&sn=... до URL або налаштуйте .env і використовуйте /api/solax/realtime.</template>
      <template v-else>Джерело: SolaX Cloud API v6.1 — LIVE.</template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDebounceFn } from './composables/useDebounceFn.js'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'

// register
const vChart = VChart
</script>

<script>
export default {
  components: { 'v-chart': (await import('vue-echarts')).default },
}
</script>

<script setup>
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
  const base = { load:2300, soc:62, yieldtoday:23.4, yieldtotal:17280, status:102 }
  const tick = () => {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes()/60
    const daylight = Math.max(0, Math.sin(((hour-6)/12)*Math.PI))
    const pv = Math.round(500 + 4500*daylight + (Math.random()-0.5)*200)
    const load = Math.max(500, Math.round(base.load + (Math.random()-0.5)*300))
    let bat=0, grid=0
    if (pv > load) {
      bat = -Math.min(1400, Math.round((pv-load)*0.5))
      grid = Math.round((pv-load) - Math.abs(bat))
    } else {
      bat = Math.min(1500, Math.round((load-pv)*0.4))
      grid = -Math.round((load-pv) - Math.max(0, bat))
    }
    base.soc = Math.max(10, Math.min(95, base.soc - bat/5000))
    const result = {
      inverterSN: 'DEMO123456',
      sn: 'DEMO-DONGLE-001',
      acpower: Math.max(0, pv - Math.max(0,-grid) - Math.max(0,-bat) + Math.max(0,grid) + Math.max(0,bat)),
      yieldtoday: base.yieldtoday + Math.max(0, pv)/100000,
      yieldtotal: base.yieldtotal + Math.max(0, pv)/100000,
      feedinpower: grid,
      soc: Math.round(base.soc),
      inverterStatus: base.status,
      uploadTime: now.toISOString().slice(0,19).replace('T',' '),
      batPower: bat,
      powerdc1: Math.round(pv*0.55),
      powerdc2: Math.round(pv*0.35),
      powerdc3: Math.round(pv*0.07),
      powerdc4: Math.round(pv*0.03),
    }
    data.value = result
    lastUpdated.value = now
    pushPoint(now, pv, load, grid, bat)
    loading.value = false
  }
  tick()
  intervalDemo.value = setInterval(tick, 2000)
}

async function fetchOnce() {
  try {
    error.value = null
    const url = `/api/solax/realtime`
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
  if (demoMode.value) startDemo() else startLive()
}

onMounted(() => {
  if (demoMode.value) startDemo() else startLive()
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
