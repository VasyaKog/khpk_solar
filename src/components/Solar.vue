<template>
  <div class="mini glass" role="group" aria-label="Solar status">
    <div class="status" :title="statusLabel">
      <span class="dot" aria-hidden="true"></span>
      <span class="text">{{ statusLabel }}</span>
    </div>

    <div class="glyph" aria-hidden="true">
      <div class="circle">
        <div class="sun">☀️</div>

        <div class="overlay">
          <div class="main">{{ powerDisplay }}</div>
        </div>

        <div v-if="isActive" class="rays"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";

const props = defineProps<{
  solarPowerW: number | string;      // W
  todayKwh?: number | string | null; // kWh (опц.)
  deadbandW?: number;                // default 30
  labels?: Partial<{ active: string; idle: string }>;
}>();

const toNum = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

const labels = computed(() => ({
  active: props.labels?.active ?? "Solar",
  idle: props.labels?.idle ?? "No sun",
}));

const deadbandW = computed(() => (Number.isFinite(props.deadbandW) ? props.deadbandW! : 30));

const powerW = computed(() => toNum(props.solarPowerW));
const powerKw = computed(() => powerW.value / 1000);

const isActive = computed(() => powerW.value > deadbandW.value);

const statusLabel = computed(() => (isActive.value ? labels.value.active : labels.value.idle));

const powerDisplay = computed(() => {
  let p = powerKw.value;
  if (Object.is(p, -0)) p = 0;
  return `${p.toFixed(1)} kW`;
});

const todayKwh = computed(() => (props.todayKwh == null ? null : toNum(props.todayKwh)));
const todayDisplay = computed(() => `${todayKwh.value!.toFixed(1)} kWh`);
</script>

<style scoped>
.mini {
  --w: 150px;
  width: var(--w);
  display: grid;
  grid-template-rows: 28px auto;
  gap: 8px;
  color: #0f172a;
  user-select: none;
  font-variant-numeric: tabular-nums;
}

.glass {
  padding: 12px 10px 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.status {
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-size: 12px;
  font-weight: 800;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #f59e0b;
}

/* amber */
.text {
  white-space: nowrap;
}

.glyph {
  display: grid;
  justify-items: center;
}

.circle {
  width: 118px;
  height: 118px;
  border-radius: 999px;
  border: 3px solid rgba(15, 23, 42, 0.18);
  background: rgba(226, 232, 240, 0.55);
  position: relative;
  overflow: hidden;
}

.sun {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 22px;
  opacity: 0.9;
}

.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding-top: 12px;
}

.main {
  font-size: 22px;
  font-weight: 900;
  text-shadow: 0 2px 6px rgba(255, 255, 255, 0.9);
}

.sub {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  opacity: 0.85;
  text-shadow: 0 1px 4px rgba(255, 255, 255, 0.85);
}

.rays {
  position: absolute;
  inset: -20%;
  background: conic-gradient(from 0deg, rgba(245, 158, 11, 0.0), rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.0));
  animation: spin 3.5s linear infinite;
  filter: blur(0.5px);
  opacity: 0.7;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rays {
    animation: none;
    display: none;
  }
}
</style>
