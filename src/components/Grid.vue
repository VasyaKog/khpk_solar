<template>
  <div class="mini glass" :class="modeClass" role="group" aria-label="Grid status">
    <div class="status" :title="modeLabel">
      <span class="dot" aria-hidden="true"></span>
      <span class="text">{{ modeLabel }}</span>
    </div>

    <div class="glyph" aria-hidden="true">
      <div class="circle">
        <div class="icon">⚡</div>

        <div class="overlay">
          <div class="main">{{ powerDisplay }}</div>
          <div v-if="todayKwh != null" class="sub">{{ todayDisplay }}</div>
        </div>

        <div v-if="mode !== 'idle'" class="arrow" aria-hidden="true">
          {{ mode === "import" ? "↓" : "↑" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type GridMode = "import" | "export" | "idle";

const props = defineProps<{
  gridFlowW: number | string;        // W (+import, -export)
  todayKwh?: number | string | null; // kWh (опц. або роби 2 окремі — import/export)
  deadbandW?: number;                // default 80
  labels?: Partial<{ import: string; export: string; idle: string }>;
}>();

const toNum = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

const labels = computed(() => ({
  import: props.labels?.import ?? "Import",
  export: props.labels?.export ?? "Export",
  idle: props.labels?.idle ?? "Grid idle",
}));

const deadbandW = computed(() => (Number.isFinite(props.deadbandW) ? props.deadbandW! : 80));

const flowW = computed(() => toNum(props.gridFlowW));
const powerKwAbs = computed(() => Math.abs(flowW.value) / 1000);

const mode = computed<GridMode>(() => {
  const f = flowW.value;
  const db = deadbandW.value;
  if (f > db) return "import";
  if (f < -db) return "export";
  return "idle";
});

const modeLabel = computed(() => labels.value[mode.value]);

const modeClass = computed(() => `mode-${mode.value}`);

const powerDisplay = computed(() => {
  let p = powerKwAbs.value;
  if (Object.is(p, -0)) p = 0;
  // показуємо абсолют (бо напрямок вже є в статусі/стрілці)
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
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-size: 12px;
  font-weight: 800;
}
.dot { width: 9px; height: 9px; border-radius: 50%; }
.text { white-space: nowrap; }

.glyph { display: grid; justify-items: center; }
.circle {
  width: 118px;
  height: 118px;
  border-radius: 999px;
  border: 3px solid rgba(15, 23, 42, 0.18);
  background: rgba(226, 232, 240, 0.55);
  position: relative;
  overflow: hidden;
}

.icon {
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
  text-shadow: 0 2px 6px rgba(255,255,255,0.9);
}
.sub {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  opacity: 0.85;
  text-shadow: 0 1px 4px rgba(255,255,255,0.85);
}

.arrow {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 18px;
  font-weight: 900;
  opacity: 0.85;
}

/* mode colors */
.mode-import .dot { background: #3b82f6; }  /* blue */
.mode-export .dot { background: #a855f7; }  /* purple */
.mode-idle .dot { background: #94a3b8; }    /* gray */
</style>
