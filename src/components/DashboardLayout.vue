<template>
  <div class="main">
    <div class="dash">
      <!-- top: solar L/R -->
      <div class="row row-top">
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
      </div>

      <!-- middle: grid L/R + load L/R + center -->
      <div class="row row-middle">
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
      </div>

      <!-- bottom: battery L/R -->
      <div class="row row-bottom">
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
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 3.5vh, 48px);
}

.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: clamp(14px, 2.4vw, 36px);
}

.row-middle {
  gap: clamp(12px, 2vw, 28px);
}

.cell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: clamp(140px, 22vw, 200px);
  flex: 0 1 auto;
}

.cell.center {
  width: clamp(240px, 52vw, 560px);
  flex: 1 1 clamp(240px, 52vw, 560px);
}

.cell.logo-center {
  width: clamp(140px, 22vw, 200px);
}

.cell > * {
  width: 100%;
  max-width: 100%;
}

.main {
  height: 100%;
  width: 100%;
}
</style>
