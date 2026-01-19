<template>
  <div class="grid-mini glass" :class="modeClass" role="group" aria-label="Grid status">
    <!-- status -->
    <div class="status" :title="modeLabel">
      <span class="dot" aria-hidden="true"></span>
      <span class="text">{{ modeLabel }}</span>
    </div>

    <!-- glyph -->
    <div class="glyph">
      <div class="grid-card">
        <!-- icon -->
        <svg class="grid-ico" viewBox="0 0 120 120" aria-hidden="true">
          <path
              d="M60 14 L78 92 H70 L66 76 H54 L50 92 H42 Z
               M52 44 H68
               M49 56 H71
               M46 68 H74"
              class="g-tower"
          />
          <path d="M18 40 C35 30, 85 30, 102 40" class="g-wire" />
          <path d="M20 52 C38 42, 82 42, 100 52" class="g-wire" />

          <!-- broken plug for offline -->
          <path
              v-if="mode === 'offline'"
              d="M90 78 l8 -8 M98 78 l-8 -8"
              class="g-off"
          />
        </svg>

        <!-- power -->
        <div class="power">
          <span v-if="mode !== 'offline'">{{ powerDisplay }}</span>
          <span v-else class="offline">NO GRID</span>
        </div>

        <div v-if="mode === 'import' || mode === 'export'" class="shine"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type GridMode = "import" | "export" | "idle" | "offline";

const props = defineProps<{
  gridFlow: number | string;       // W (+ import, - export)
  gridAvailable: boolean;          // true/false
  deadbandW?: number;              // default 80
  labels?: Partial<Record<GridMode, string>>;
}>();

const toNum = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

const labels = computed<Record<GridMode, string>>(() => ({
  import: props.labels?.import ?? "Import",
  export: props.labels?.export ?? "Export",
  idle: props.labels?.idle ?? "Grid",
  offline: props.labels?.offline ?? "No grid",
}));

const deadbandW = computed(() =>
    Number.isFinite(props.deadbandW) ? props.deadbandW! : 80
);

const flowW = computed(() => toNum(props.gridFlow));

const mode = computed<GridMode>(() => {
  if (!props.gridAvailable) return "offline";

  const f = flowW.value;
  const db = deadbandW.value;

  if (f > db) return "import";
  if (f < -db) return "export";
  return "idle";
});

const modeLabel = computed(() => labels.value[mode.value]);
const modeClass = computed(() => `mode-${mode.value}`);

/**
 * Показуємо зі знаком:
 *  + => імпорт
 *  - => експорт
 *  0.0 => idle
 */
const powerDisplay = computed(() => {
  const f = flowW.value;
  const db = deadbandW.value;

  // якщо idle — спеціально показуємо 0.0 без "мінус нуля" та без знака
  if (Math.abs(f) <= db) return `0.0 kW`;

  let p = f / 1000; // зберігаємо знак!
  if (Object.is(p, -0)) p = 0;

  const sign = p > 0 ? "+" : ""; // мінус автоматично буде
  return `${sign}${p.toFixed(1)} kW`;
});
</script>

<style scoped>
.grid-mini {
  --w: 150px;
  width: var(--w);
  display: grid;
  grid-template-rows: 28px auto;
  gap: 8px;
  user-select: none;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

/* glass container */
.glass {
  padding: 12px 10px 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18),
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
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.text {
  white-space: nowrap;
}

/* glyph */
.glyph {
  display: grid;
  justify-items: center;
}

.grid-card {
  width: 118px;
  height: 118px;
  border-radius: 18px;
  border: 3px solid rgba(15, 23, 42, 0.18);
  background: rgba(226, 232, 240, 0.55);
  position: relative;
  overflow: hidden;
}

/* icon */
.grid-ico {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 14px;
  height: 70px;
  opacity: 0.95;
  z-index: 2;
}

.g-tower {
  fill: rgba(15, 23, 42, 0.10);
  stroke: rgba(15, 23, 42, 0.38);
  stroke-width: 2;
  stroke-linejoin: round;
}

.g-wire {
  stroke: rgba(15, 23, 42, 0.22);
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
}

/* power at bottom */
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
  text-shadow: 0 2px 6px rgba(255, 255, 255, 0.9),
  0 0 1px rgba(255, 255, 255, 0.8);
}

/* shimmer */
.shine {
  position: absolute;
  inset: -40%;
  background: linear-gradient(
      120deg,
      rgba(59, 130, 246, 0) 35%,
      rgba(59, 130, 246, 0.16) 50%,
      rgba(59, 130, 246, 0) 65%
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
.mode-import .dot { background: #3b82f6; } /* blue */
.mode-export .dot { background: #a855f7; } /* purple */
.mode-idle .dot { background: #94a3b8; }   /* gray */

/* offline visuals */
.mode-offline .dot { background: #ef4444; }
.mode-offline .grid-card { background: rgba(226, 232, 240, 0.35); }

.g-off {
  stroke: #ef4444;
  stroke-width: 3;
  stroke-linecap: round;
}

.power .offline {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #ef4444;
}

@media (prefers-reduced-motion: reduce) {
  .shine { animation: none; display: none; }
}
</style>
