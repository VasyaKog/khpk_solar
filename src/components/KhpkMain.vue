<template>
  <div class="college-center" role="group" aria-label="College total load">
    <!-- building (crisp, no blur) -->
    <div class="stage" :style="bgStyle" aria-hidden="true"></div>

    <!-- metric under image -->
    <div class="metric">
      <div class="kw">{{ loadDisplay }}</div>
      <div class="hint">
        <span v-if="todayKwh != null">{{ todayDisplay }}</span>
        <span v-if="todayKwh != null && peakKw != null" class="sep">•</span>
        <span v-if="peakKw != null">Peak {{ peakDisplay }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  /** Background image URL */
  backgroundUrl: string;

  /** Total load in Watts (W) */
  loadW: number | string;

  /** Optional: daily consumption in kWh */
  todayKwh?: number | string | null;

  /** Optional: peak load in kW */
  peakKw?: number | string | null;
}>();

const toNum = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

const loadW = computed(() => toNum(props.loadW));
const loadKw = computed(() => loadW.value / 1000);

const loadDisplay = computed(() => {
  let p = loadKw.value;
  if (Object.is(p, -0)) p = 0;
  return `${p.toFixed(2)} kW`;
});

const todayKwh = computed(() =>
    props.todayKwh == null ? null : toNum(props.todayKwh)
);
const todayDisplay = computed(() => `${todayKwh.value!.toFixed(1)} kWh today`);

const peakKw = computed(() =>
    props.peakKw == null ? null : toNum(props.peakKw)
);
const peakDisplay = computed(() => `${peakKw.value!.toFixed(1)} kW`);

const bgStyle = computed(() => ({
  "--bg-image": `url(${props.backgroundUrl})`,
}));
</script>

<style scoped>
.college-center {
  --w: 360px;
  --stage-h: 190px;

  width: var(--w);
  display: grid;
  grid-template-rows: var(--stage-h) auto;
  gap: 10px;

  user-select: none;
  font-variant-numeric: tabular-nums;
}

/* crisp building image (no blur, no glass) */
.stage {
  height: var(--stage-h);
  border-radius: 18px;

  background-image: var(--bg-image);
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: contain;

  /* optional subtle frame (does not blur the image) */
  border: 1px solid rgba(15, 23, 42, 0.10);
  background-color: rgba(255, 255, 255, 0.0);
}

/* metric under image */
.metric {
  border-radius: 18px;
  padding: 12px 14px;

  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);

  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow:
      0 10px 30px rgba(15, 23, 42, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);

  text-align: center;
  color: #0f172a;
}

.kw {
  font-size: 44px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow:
      0 2px 10px rgba(255, 255, 255, 0.9),
      0 1px 0 rgba(255, 255, 255, 0.8);
}

.hint {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 900;
  opacity: 0.85;
  text-shadow: 0 1px 6px rgba(255, 255, 255, 0.85);
}

.sep {
  margin: 0 8px;
  opacity: 0.55;
}
</style>
