<template>
  <div class="solar-mini glass" :class="modeClass" role="group" aria-label="Solar status">
    <!-- status row (fixed height) -->
    <div class="status" :title="modeLabel">
      <span class="dot" aria-hidden="true"></span>
      <span class="text">{{ modeLabel }}</span>
    </div>

    <!-- glyph -->
    <div class="glyph" :aria-label="`Solar power ${powerDisplay}`">
      <div class="panel-card">
        <!-- BIG sun (clear meaning) -->
        <div class="sun" aria-hidden="true">
          <span class="sun-emoji">☀️</span>
          <span v-if="isActive" class="sun-glow" aria-hidden="true"></span>
        </div>

        <!-- panels pictogram -->
        <svg class="panel-ico" viewBox="0 0 120 90" aria-hidden="true">
          <rect x="10" y="18" width="100" height="48" rx="10" class="p-frame" />
          <path d="M20 28H100 M20 38H100 M20 48H100 M20 58H100" class="p-grid" />
          <path d="M30 18V66 M45 18V66 M60 18V66 M75 18V66 M90 18V66" class="p-grid" />
          <path d="M42 66L28 78H92L78 66" class="p-stand" />
          <path d="M60 66V78" class="p-stand" />
        </svg>

        <!-- Power moved lower -->
        <div class="power" aria-hidden="true">
          {{ powerDisplay }}
        </div>

        <!-- subtle shimmer when active -->
        <div v-if="isActive" class="shine" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type SolarMode = "active" | "idle";

const props = defineProps<{
  /** Solar power in Watts (W) */
  solarPower: number | string;

  /** Deadband in W (default 30) */
  deadbandW?: number;

  /** Labels */
  labels?: Partial<Record<SolarMode, string>>;
}>();

const toNum = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

const labels = computed<Record<SolarMode, string>>(() => ({
  active: props.labels?.active ?? "Solar",
  idle: props.labels?.idle ?? "No sun",
}));

const deadbandW = computed(() => (Number.isFinite(props.deadbandW) ? props.deadbandW! : 30));

const powerW = computed(() => toNum(props.solarPower));
const powerKw = computed(() => powerW.value / 1000);

const mode = computed<SolarMode>(() => (powerW.value > deadbandW.value ? "active" : "idle"));
const isActive = computed(() => mode.value === "active");

const modeLabel = computed(() => labels.value[mode.value]);
const modeClass = computed(() => `mode-${mode.value}`);

const powerDisplay = computed(() => {
  let p = powerKw.value;
  if (Object.is(p, -0)) p = 0;
  return `${p.toFixed(1)} kW`;
});
</script>

<style scoped>
.solar-mini {
  --w: 150px;
  width: var(--w);
  display: grid;
  grid-template-rows: 28px auto;
  gap: 8px;
  user-select: none;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

/* glass container (same as BatteryMini) */
.glass {
  padding: 12px 10px 14px;
  border-radius: 22px;

  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);

  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow:
      0 10px 30px rgba(15, 23, 42, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

/* status */
.status {
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 999px;

  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);

  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.01em;
}
.dot { width: 9px; height: 9px; border-radius: 50%; }
.text { white-space: nowrap; }

/* glyph */
.glyph {
  display: grid;
  justify-items: center;
}

.panel-card {
  width: 118px;
  height: 118px;
  border-radius: 18px;
  border: 3px solid rgba(15, 23, 42, 0.18);
  background: rgba(226, 232, 240, 0.55);
  position: relative;
  overflow: hidden;
}

/* Big sun */
.sun {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  display: grid;
  place-items: center;
  z-index: 4;
}
.sun-emoji {
  font-size: 26px;
  line-height: 1;
}
.sun-glow {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.28);
  filter: blur(6px);
  z-index: -1;
}

/* panels pictogram */
.panel-ico {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 25px;   /* leave space for big sun */
  height: 58px;
  opacity: 0.95;
  z-index: 2;
}
.p-frame {
  fill: rgba(15, 23, 42, 0.08);
  stroke: rgba(15, 23, 42, 0.35);
  stroke-width: 2;
}
.p-grid {
  stroke: rgba(15, 23, 42, 0.22);
  stroke-width: 1.6;
  stroke-linecap: round;
}
.p-stand {
  fill: rgba(15, 23, 42, 0.25);
}

/* power moved lower */
.power {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 20px;
  font-weight: 900;
  z-index: 5;

  color: #0f172a;
  text-shadow:
      0 2px 6px rgba(255, 255, 255, 0.9),
      0 0 1px rgba(255, 255, 255, 0.8);
}

/* subtle shimmer when active */
.shine {
  position: absolute;
  inset: -40%;
  background: linear-gradient(
      120deg,
      rgba(245, 158, 11, 0) 35%,
      rgba(245, 158, 11, 0.18) 50%,
      rgba(245, 158, 11, 0) 65%
  );
  animation: shineMove 2.8s linear infinite;
  z-index: 1;
  opacity: 0.9;
}
@keyframes shineMove {
  from { transform: translateX(-20%); }
  to { transform: translateX(20%); }
}

/* mode colors */
.mode-active .dot { background: #f59e0b; } /* amber */
.mode-idle .dot { background: #94a3b8; }   /* gray */

@media (prefers-reduced-motion: reduce) {
  .shine { animation: none; display: none; }
}
</style>
