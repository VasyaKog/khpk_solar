<template>
    <template v-if="!loading && data.inverters.length == 2">
      <DashboardLayout
          :line1SolarPower="data.inverters[0]?.pvPower"
          :line2SolarPower="data.inverters[1]?.pvPower"
          :line1GridFlow="data.inverters[0]?.gridFlow"
          :line1GridAvailable="data.inverters[0].gridStatus"
          :line2GridFlow="data.inverters[1].gridFlow"
          :line2GridAvailable="data.inverters[1].gridStatus"
          :line1LoadPower="data.inverters[0].consumption"
          :line2LoadPower="data.inverters[1].consumption"
          :line1BatterySoc="data.inverters[0].soc"
          :line1BatteryFlow="data.inverters[0].batteryFlow"
          :line2BatterySoc="data.inverters[1].soc"
          :line2BatteryFlow="data.inverters[1].batteryFlow"
          :khpkTotalLoad="10000"
          :khkp-b-g-url="'/images/HPK.png'"
          />
    </template>
    <div v-else class="loading">
      <div class="loading-text">Loading data...</div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import VChart from 'vue-echarts'
import LogoHPK from "./components/LogoHPK.vue";
import DashboardLayout from "./components/DashboardLayout.vue";

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

const data = ref({})
const error = ref(null)
const loading = ref(true)
const lastUpdated = ref(null)
const series = ref([]) // {t,pv,load,grid,bat}

const { tokenId, sn } = useQuery()
const demoMode = ref(false)

const intervalDemo = ref(null)
const intervalLive = ref(null)


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
    loading.value = false
  }

  tick()
  intervalDemo.value = setInterval(tick, 2000)
}

async function fetchOnce() {
  try {
    const url = `http://localhost:8787/api/solax/realtime`
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) throw new Error('HTTP '+r.status)
    const json = await r.json();
    data.value = json;
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
