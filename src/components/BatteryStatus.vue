<template>
  <div class="battery-mini glass" :class="[modeClass, {'is-disabled': isDisabled}]" role="group" aria-label="Battery status">
    <!-- status row (fixed height) -->
    <div class="status" :title="modeLabel">
      <span class="dot" aria-hidden="true"></span>
      <span class="text">{{ modeLabel }}</span>
    </div>

    <!-- battery glyph -->
    <div class="glyph" :aria-label="`State of charge ${socClamped}%`">
      <div class="body">
        <div class="level" :style="levelStyle">
          <div v-if="isCharging" class="wave" aria-hidden="true"></div>
          <div v-if="isCharging" class="wave wave2" aria-hidden="true"></div>
        </div>

        <!-- overlay texts (SOC + kW on battery) -->
        <div class="overlay" aria-hidden="true">
          <div class="soc">{{ socClamped }}%</div>
          <div class="pwr">{{ powerDisplay }}</div>
        </div>

        <div v-if="showBolt" class="bolt" aria-hidden="true">
          {{ isCharging ? "⚡" : "↯" }}
        </div>

        <div class="ticks" aria-hidden="true">
          <span v-for="t in 4" :key="t" class="tick"></span>
        </div>
      </div>

      <div class="cap" aria-hidden="true"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type BatteryMode = "charge" | "discharge" | "idle";

const props = defineProps<{
  /** SOC in % */
  soc: number;
  isDisabled?: boolean;

  /**
   * batteryFlow in Watts (W)
   * +W => charging battery, -W => discharging
   */
  batteryFlow: number;

  /** Deadband in W (default 80) to avoid state flicker */
  deadbandW?: number;

  /**
   * Optional: labels (for UA/EN), defaults to EN.
   * Example:
   * { charge: "Заряд", discharge: "Розряд", idle: "Очікування" }
   */
  labels?: Partial<Record<BatteryMode, string>>;
}>();

const labels = computed<Record<BatteryMode, string>>(() => ({
  charge: props.labels?.charge ?? "Зарядка",
  discharge: props.labels?.discharge ?? "Розряд",
  idle: props.labels?.idle ?? "Очікування",
}));

const socClamped = computed(() => {
  const n = Number.isFinite(props.soc) ? props.soc : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
});

const deadbandW = computed(() =>
    Number.isFinite(props.deadbandW) ? (props.deadbandW as number) : 80
);

const flowW = computed(() => (Number.isFinite(props.batteryFlow) ? props.batteryFlow : 0));
const powerKw = computed(() => flowW.value / 1000);

const mode = computed<BatteryMode>(() => {
  const f = flowW.value;
  const db = deadbandW.value;

  if (f > db) return "charge";
  if (f < -db) return "discharge";
  return "idle";
});

const isCharging = computed(() => mode.value === "charge");
const showBolt = computed(() => mode.value !== "idle");

const modeLabel = computed(() => labels.value[mode.value]);
const modeClass = computed(() => `mode-${mode.value}`);

const powerDisplay = computed(() => {
  const p = powerKw.value;
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(1)} kW`;
});

const levelStyle = computed(() => ({
  height: `${socClamped.value}%`,
}));
</script>

<style scoped>
/* compact, controllable sizes */
.battery-mini {
  --w: clamp(140px, 22vw, 200px);      /* overall width */
  --body-w: clamp(80px, 12vw, 96px);  /* battery width */
  --body-h: clamp(120px, 18vw, 150px); /* battery height */
  --cap-w: 44px;
  --cap-h: 10px;

  width: var(--w);
  display: grid;
  grid-template-rows: 28px auto; /* fixed status row */
  gap: 8px;
  user-select: none;
  color: #0f172a;
}

/* glassmorphism container */
.battery-mini.glass {
  padding: 12px 10px 14px;
  border-radius: 22px;

  background: rgba(255, 255, 255, 0.28);

  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow:
      0 10px 30px rgba(15, 23, 42, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

/* status row */
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

  font-weight: 800;
  letter-spacing: 0.01em;
}
.status .dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.status .text {
  white-space: nowrap;
}

/* battery glyph */
.glyph {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.body {
  width: var(--body-w);
  height: var(--body-h);
  border-radius: 14px;
  border: 3px solid rgba(15, 23, 42, 0.75);
  background: rgba(226, 232, 240, 0.6);
  position: relative;
  overflow: hidden;
}

/* subtle contrast layer for better overlay readability */
.body::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.06),
      rgba(0, 0, 0, 0.02)
  );
  pointer-events: none;
  z-index: 2;
}

.cap {
  width: var(--cap-w);
  height: var(--cap-h);
  border-radius: 0 0 10px 10px;
  background: rgba(15, 23, 42, 0.75);
}

/* fill */
.level {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  transition: height 650ms ease;
  z-index: 1;
}

/* overlay (SOC + kW) */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 3;
}

.overlay .soc {
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
  color: #0f172a;
  text-shadow:
      0 2px 6px rgba(255, 255, 255, 0.9),
      0 0 1px rgba(255, 255, 255, 0.8);
}

.overlay .pwr {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  opacity: 0.88;
  text-shadow: 0 1px 4px rgba(255, 255, 255, 0.85);
}

/* optional bolt */
.bolt {
  position: absolute;
  left: 0;
  right: 0;
  top: 10px;
  display: grid;
  place-items: center;
  font-size: 22px;
  opacity: 0.85;
  pointer-events: none;
  z-index: 4;
}

/* ticks */
.ticks {
  position: absolute;
  inset: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  z-index: 4;
}
.tick {
  height: 2px;
  background: rgba(15, 23, 42, 0.12);
  border-radius: 2px;
}

/* themes */
.mode-charge .status .dot { background: #22c55e; }
.mode-discharge .status .dot { background: #ef4444; }
.mode-idle .status .dot { background: #94a3b8; }

.mode-charge .level {
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.85));
}
.mode-discharge .level {
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.95), rgba(244, 63, 94, 0.85));
}
.mode-idle .level {
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.85), rgba(148, 163, 184, 0.65));
}

/* charging wave */
.wave {
  position: absolute;
  left: -30%;
  right: -30%;
  top: 22%;
  height: 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  animation: waveMove 2.2s linear infinite;
}
.wave2 {
  top: 58%;
  opacity: 0.18;
  animation-duration: 3.2s;
}
@keyframes waveMove {
  from { transform: translateX(-20%); }
  to { transform: translateX(20%); }
}

@media (prefers-reduced-motion: reduce) {
  .level { transition: none; }
  .wave { animation: none; display: none; }
}
</style>
