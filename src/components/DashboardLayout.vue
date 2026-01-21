<template>
  <div class="main">
    <div class="dash">
    <!-- top: solar L/R -->
    <div class="cell solar-left">
      <Solar
          :isDisabled="line1Disabled"
          :solarPower="line1SolarPower"
          :inverterName="line1Name"
      />
    </div>

    <div class="cell logo-center">
      <LogoHPK />
    </div>

    <div class="cell solar-right">
      <Solar
          :isDisabled="line2Disabled"
          :solarPower="line2SolarPower"
          :inverterName="line2Name"
      />
    </div>

    <!-- middle: grid L/R + load L/R + center -->
    <div class="cell grid-left">
      <Grid
          :isDisabled="line1Disabled"
          :gridAvailable="!!line1GridAvailable"
          :gridFlow="line1GridFlow"
      />
    </div>

    <div class="cell node-left">
      <EnergyFlowNode
          :isDisabled="line1Disabled"
          :isRight="0"
          :gridAvailable="line1GridAvailable"
          :gridFlow="line1GridFlow"
          :batteryFlow="line1BatteryFlow"
          :solarPower="line1SolarPower"
      />
    </div>

    <div class="cell load-left">
      <Load :isDisabled="line1Disabled"
           :loadPower="line1LoadPower"
      />
    </div>

    <div class="cell center">
      <KhpkMain :backgroundUrl="khkpBGUrl" :totalLoad="khpkTotalLoad" />
    </div>

    <div class="cell load-right">
      <Load
          :isDisabled="line2Disabled"
          :loadPower="line2LoadPower"
      />
    </div>

    <div class="cell node-right">
      <EnergyFlowNode
          :isDisabled="line2Disabled"
          :isRight="1"
          :gridAvailable="line2GridAvailable"
          :gridFlow="line2GridFlow"
          :batteryFlow="line2BatteryFlow"
          :solarPower="line2SolarPower"
      />
    </div>

    <div class="cell grid-right">
      <Grid
          :isDisabled="line2Disabled"
          :gridAvailable="!!line2GridAvailable"
          :gridFlow="line2GridFlow"
      />
    </div>

    <!-- bottom: battery L/R -->
    <div class="cell bat-left">
      <BatteryStatus
          :isDisabled="line1Disabled"
          :soc="line1BatterySoc"
          :batteryFlow="line1BatteryFlow"
      />
    </div>

    <div class="cell bat-right">
      <BatteryStatus
          :isDisabled="line2Disabled"
          :soc="line2BatterySoc"
          :batteryFlow="line2BatteryFlow"
      />
    </div>
  </div>
  </div>
<!--  <div class="footer">-->

<!--  </div>-->
</template>

<script setup lang="ts">
import Solar from "./Solar.vue";
import Grid from "./Grid.vue";
import Load from "./Load.vue";
import BatteryStatus from "./BatteryStatus.vue";
import KhpkMain from "./KhpkMain.vue";
import LogoHPK from "./LogoHPK.vue";
import EnergyFlowNode from "./EnergyFlowNode.vue";
import {computed} from "vue";


const props = defineProps<{
  line1Enabled?: boolean;
  line2Enabled?: boolean;
  line1Name?: string | null;
  line2Name?: string | null;
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

const line1Disabled = computed(() => !props.line1Enabled);
const line2Disabled = computed(() => !props.line2Enabled);

</script>

<style scoped>
/**
Твердження: це “стабільний” grid-макет, який не залежить від контенту всередині плиток.
Твердження: ширини маленьких плиток керуються через --tile.
*/
.dash {
  height: 100%;
  margin: auto;
  align-content: space-evenly; /* розносить ряди по висоті */
  row-gap: clamp(24px, 4vh, 64px);
  --tile: 180px; /* бажано щоб Solar/Grid/Load/Battery теж мали таку ширину */
  --centerW: clamp(320px, 34vw, 520px);

  --gapX: clamp(18px, 3vw, 48px);
  --gapY: clamp(14px, 2.2vw, 36px);

  width: max-content;

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
    ".  solar-left . logo-center . solar-right  ."
    "grid-left node-left load-left center load-right node-right grid-right"
    ". bat-left .     center .     bat-right .";
}

/* assign areas */
.solar-left  { grid-area: solar-left; }
.solar-right { grid-area: solar-right; }

.grid-left   { grid-area: grid-left; }
.grid-right  { grid-area: grid-right; }

.load-left   { grid-area: load-left; }
.load-right  { grid-area: load-right; }

.node-left   { grid-area: node-left; }
.node-right  { grid-area: node-right; }

.bat-left    { grid-area: bat-left; }
.bat-right   { grid-area: bat-right; }

.logo-center { grid-area: logo-center; }
.center      { grid-area: center; }


.center  {
  width: 150%;
}

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
      "logo-center"
      "node-left"
      "node-right"
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

.main {
  height: 100%;
  width: 100%;
}
</style>
