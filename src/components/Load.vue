<template>
  <div class="load-mini glass" :class="[modeClass, {'is-disabled': isDisabled}]" role="group" aria-label="Load status">
    <!-- status (always present) -->
    <div class="status" :title="statusLabel">
      <span class="dot" aria-hidden="true"></span>
      <span class="text">{{ statusLabel }}</span>
    </div>

    <div class="glyph" :aria-label="`Load ${powerDisplay}`">
      <div class="card">
        <!-- icon set: lamp + laptop + router -->
        <svg class="ico pc" viewBox="0 0 160 120" aria-hidden="true">
          <!-- Monitor -->
          <rect x="16" y="14" width="88" height="54" rx="6" class="pc-screen"/>
          <rect x="52" y="70" width="16" height="10" class="pc-stand"/>
          <rect x="40" y="80" width="40" height="6" rx="3" class="pc-base"/>

          <!-- System unit -->
          <rect x="112" y="18" width="32" height="68" rx="4" class="pc-case"/>
          <rect x="118" y="24" width="20" height="36" rx="2" class="pc-vent"/>
          <circle cx="128" cy="66" r="2.5" class="pc-led"/>
        </svg>

        <!-- optional small title -->
        <div v-if="titleText" class="title" aria-hidden="true">{{ titleText }}</div>

        <!-- power -->
        <div class="power" aria-hidden="true">
          <span v-if="mode !== 'offline'">{{ powerDisplay }}</span>
          <span v-else class="offline">{{ offlineText }}</span>
        </div>

        <div v-if="mode !== 'offline'" class="shine" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type LoadMode = "online" | "offline";

const props = defineProps<{
  isDisabled?: boolean | null;
  /** Load power in Watts (W) */
  loadPower: number | string;

  /** Optional title inside tile */
  title?: string;

  /** Status label (default "Load") */
  statusLabel?: string;

  /** Offline text on tile */
  offlineText?: string;
}>();

const toNum = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

const available = computed(() => true);

const mode = computed<LoadMode>(() => (available.value ? "online" : "offline"));
const modeClass = computed(() => `mode-${mode.value}`);

const statusLabel = computed(() => props.statusLabel ?? "Навантаження");
const offlineText = computed(() => props.offlineText ?? "Вимкнено");

const titleText = computed(() => (props.title ?? "").trim());

const powerW = computed(() => toNum(props.loadPower));
const powerDisplay = computed(() => {
  let p = Math.abs(powerW.value) / 1000;
  if (Object.is(p, -0)) p = 0;
  return `${p.toFixed(1)} kW`;
});
</script>

<style scoped>
.load-mini {
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
.glyph { display: grid; justify-items: center; }

/* icon */


/* monitor */
.pc-screen {
  fill: rgba(15, 23, 42, 0.08);
  stroke: rgba(15, 23, 42, 0.40);
  stroke-width: 2.5;
}
.pc-stand {
  fill: rgba(15, 23, 42, 0.35);
}
.pc-base {
  fill: rgba(15, 23, 42, 0.25);
}

/* system unit */
.pc-case {
  fill: rgba(15, 23, 42, 0.10);
  stroke: rgba(15, 23, 42, 0.40);
  stroke-width: 2.5;
}
.pc-vent {
  fill: rgba(15, 23, 42, 0.15);
}
.pc-led {
  fill: #22c55e;
  opacity: 0.85;
}


/* title */
.title {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  text-align: center;
  font-size: 11px;
  font-weight: 900;
  opacity: 0.7;
  z-index: 4;
}

/* power */

.power .offline {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #ef4444;
}

/* shimmer (always when online) */
.shine {
  position: absolute;
  inset: -40%;
  background: linear-gradient(
      120deg,
      rgba(34, 197, 94, 0) 35%,
      rgba(34, 197, 94, 0.12) 50%,
      rgba(34, 197, 94, 0) 65%
  );
  animation: shineMove 3.2s linear infinite;
  z-index: 1;
  opacity: 0.9;
}
@keyframes shineMove {
  from { transform: translateX(-20%); }
  to { transform: translateX(20%); }
}

/* mode colors */
.mode-online .dot { background: #22c55e; }  /* green */
.mode-offline .dot { background: #ef4444; } /* red */
.mode-offline .load-card { background: rgba(226, 232, 240, 0.35); }

@media (prefers-reduced-motion: reduce) {
  .shine { animation: none; display: none; }
}
</style>
