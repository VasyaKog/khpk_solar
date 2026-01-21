<template>
  <div class="title" v-if="inverterName">
    {{ inverterName }}
  </div>
  <div class="solar-mini glass" :class="[modeClass, {'is-disabled': isDisabled}]" role="group" aria-label="Solar status">
    <!-- status row (fixed height) -->
    <div class="status" :title="modeLabel">
      <span class="dot" aria-hidden="true"></span>
      <span class="text">{{ modeLabel }}</span>
    </div>

    <!-- glyph -->
    <div class="glyph" :aria-label="`Solar power ${powerDisplay}`">
      <div class="card">
        <!-- BIG sun (clear meaning) -->
        <div class="sun" aria-hidden="true">
          <span class="sun-emoji">☀️</span>
          <span v-if="isActive" class="sun-glow" aria-hidden="true"></span>
        </div>

        <!-- panels pictogram -->
        <svg class="ico" viewBox="0 0 120 90" aria-hidden="true">
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
  isDisabled?: boolean | null;
  inverterName?: string | null;
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
  active: props.labels?.active ?? "Сонце",
  idle: props.labels?.idle ?? "Без сонця",
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
  --w: clamp(140px, 22vw, 200px);
  width: var(--w);
  display: grid;
  grid-template-rows: 28px auto;
  gap: 8px;
  user-select: none;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
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

/* Big sun */
.sun {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  display: grid;
  place-items: end;
  z-index: 4;
}
.sun-emoji {
  font-size: 60px;
  text-align: left;
  line-height: 1;
  : end;
}
.sun-glow {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.28);
  z-index: -1;
}

/* panels pictogram */
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
  z-index: 1;
  opacity: 0.9;
}

/* mode colors */
.mode-active .dot { background: #f59e0b; } /* amber */
.mode-idle .dot { background: #94a3b8; }   /* gray */

</style>
