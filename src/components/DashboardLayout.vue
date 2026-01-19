<template>
  <div class="dash">
    <!-- top: solar L/R -->
    <div class="cell solar-left">
      <Solar :solarPower="line1SolarPower" />
    </div>

    <div class="cell solar-right">
      <Solar :solarPower="line2SolarPower" />
    </div>

    <!-- middle: grid L/R + load L/R + center -->
    <div class="cell grid-left">
      <Grid :gridAvailable="!!line1GridAvailable" :gridFlow="line1GridFlow" />
    </div>

    <div class="cell load-left">
      <Load :loadPower="line1LoadPower" />
    </div>

    <div class="cell center">
      <KhpkMain :backgroundUrl="khkpBGUrl" :totalLoad="khpkTotalLoad" />
    </div>

    <div class="cell load-right">
      <Load :loadPower="line2LoadPower" />
    </div>

    <div class="cell grid-right">
      <Grid :gridAvailable="!!line2GridAvailable" :gridFlow="line2GridFlow" />
    </div>

    <!-- bottom: battery L/R -->
    <div class="cell bat-left">
      <BatteryStatus :soc="line1BatterySoc" :batteryFlow="line1BatteryFlow" />
    </div>

    <div class="cell bat-right">
      <BatteryStatus :soc="line2BatterySoc" :batteryFlow="line2BatteryFlow" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Solar from "./Solar.vue";
import Grid from "./Grid.vue";
import Load from "./Load.vue";
import BatteryStatus from "./BatteryStatus.vue";
import KhpkMain from "./KhpkMain.vue";


defineProps<{
  line1SolarPower: number;
  line2SolarPower: number;

  line1GridFlow: number;
  line1GridAvailable: number;
  line2GridFlow: number;
  line2GridAvailable: number;

  line1LoadPower: number;
  line2LoadPower: number;

  line1BatterySoc: number;
  line1BatteryFlow: number;
  line2BatterySoc: number;
  line2BatteryFlow: number;

  khpkTotalLoad: number;
  khkpBGUrl: string;
}>();
</script>

<style scoped>
/**
Твердження: це “стабільний” grid-макет, який не залежить від контенту всередині плиток.
Твердження: ширини маленьких плиток керуються через --tile.
*/
.dash {
  --tile: 150px; /* бажано щоб Solar/Grid/Load/Battery теж мали таку ширину */
  --centerW: clamp(320px, 34vw, 520px);

  --gapX: clamp(18px, 3vw, 48px);
  --gapY: clamp(14px, 2.2vw, 36px);

  width: max-content;
  height: 100%;
  min-height: 520px;

  display: grid;
  align-items: center;
  justify-items: center;

  gap: var(--gapY) var(--gapX);

  grid-template-columns:
    minmax(0, var(--tile))
    minmax(0, var(--tile))
    minmax(0, var(--tile))
    minmax(0, var(--centerW))
    minmax(0, var(--tile))
    minmax(0, var(--tile))
    minmax(0, var(--tile));

  grid-template-rows: auto auto auto;

  grid-template-areas:
    ".  solar-left . center . solar-right  ."
    "grid-left . load-left center load-right . grid-right"
    ". bat-left .     center .     bat-right .";
}

/* assign areas */
.solar-left  { grid-area: solar-left; }
.solar-right { grid-area: solar-right; }

.grid-left   { grid-area: grid-left; }
.grid-right  { grid-area: grid-right; }

.load-left   { grid-area: load-left; }
.load-right  { grid-area: load-right; }

.bat-left    { grid-area: bat-left; }
.bat-right   { grid-area: bat-right; }

.center      { grid-area: center; }

/* стабілізуємо поведінку елементів */
.cell {
  width: 100%;
  display: grid;
  place-items: center;
}

/* Твердження: елемент не має розпирати клітинку, лише вписуватись */
.cell > * {
  max-width: 100%;
}

/* Mobile fallback */
@media (max-width: 980px) {
  .dash {
    grid-template-columns: 1fr;
    grid-template-areas:
      "center"
      "solar-left"
      "solar-right"
      "load-left"
      "load-right"
      "bat-left"
      "bat-right"
      "grid-left"
      "grid-right";
  }
}
</style>
