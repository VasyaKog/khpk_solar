<template>
  <div class="energy-node-container" :class="{'is-disabled': isDisabled}">
    <!-- SVG для ліній потоку -->
    <svg class="flow-lines" viewBox="0 0 200 200">
      <line x1="100" y1="-74" x2="100" y2="100" :class="['line', { 'active': solarPower > 0 }]" />
      <text v-if="solarPower > 0" x="100" y="15" class="flow-arrow flow-in vertical">>>>>></text>

      <template v-if="isRight">
      <line x1="-38" y1="100" x2="100" y2="100" :class="['line', 'active', 'flow-out']" />
      <text x="24" y="92" class="flow-arrow flow-out">>>>>></text>
<!---->
      <line x2="265" y2="100" x1="100" y1="100" :class="['line', { 'flow-in': gridFlow < 0, 'flow-out': gridFlow > 0, 'disabled': !gridAvailable}]" />
      <text v-if="gridFlow !== 0 && gridAvailable" x="128" y="92" class="flow-arrow" :class="gridFlow > 0 ? 'flow-out' : 'flow-in'">
        {{ gridFlow > 0 ? '>>>>>' : '<<<<<' }}
      </text>
      </template>
      <template v-else>
        <line x1="265" y1="100" x2="100" y2="100" :class="['line', 'active', 'flow-out']" />
        <text x="140" y="92" class="flow-arrow flow-out"><<<<<</text>
<!---->
        <line x2="-38" y2="100" x1="100" y1="100" :class="['line' , { 'flow-out': gridFlow > 0, 'flow-in': gridFlow < 0, 'disabled': !gridAvailable }]" />
        <text v-if="gridFlow !== 0 && gridAvailable" x="18" y="92" class="flow-arrow" :class="gridFlow > 0 ? 'flow-out' : 'flow-in'">
          {{ gridFlow > 0 ? '<<<<<' : '>>>>>' }}
        </text>
      </template>

      <line x1="100" y1="100" x2="100" y2="365" :class="{'line':1, 'active': batteryFlow != 0, 'flow-in': batteryFlow > 0, 'flow-out': batteryFlow < 0 }" />
      <text v-if="batteryFlow !== 0" x="100" y="210" class="flow-arrow vertical" :class="batteryFlow > 0 ? 'flow-in' : 'flow-out'">
        {{ batteryFlow > 0 ? '>>>>>' : '<<<<<' }}
      </text>
    </svg>

    <div class="node-center" :class="{ 'emergency': !gridAvailable }">
      <div class="pulse"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isDisabled: Boolean,
  solarPower: Number,
  batteryFlow: Number, // + заряд (в батарею), - розряд (з батареї)
  gridFlow: Number,    // + імпорт (з мережі), - експорт (в мережу)
  gridAvailable: Number, // 1 або 0
  consumption: Number,
  isRight: Number,
});
</script>

<style scoped>
.energy-node-container {
  position: relative;
  width: clamp(120px, 18vw, 180px);
  height: clamp(120px, 18vw, 180px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-lines {
  position: absolute;
  overflow: visible;
  width: 100%;
  height: 100%;
}

.line {
  stroke: #1d2733;
  stroke-width: 3;
  stroke-linecap: round;
}

.line.active, .line.flow-in, .line.flow-out {
  stroke: #4caf50;
}

.line.flow-out {
  stroke: #ff9800; /* Колір розряду/експорту */
}

.line.disabled {
  stroke: #f44336;
  opacity: 0.3;
}

.node-center {
  width: 16px;
  height: 16px;
  background: #4caf50;
  border-radius: 50%;
  z-index: 2;
  position: relative;
}

.node-center.emergency {
  background: #f44336;
}

.pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  background: inherit;
  border-radius: 50%;
  opacity: 0.6;
}

.flow-arrow {
  font-size: 14px;
  font-weight: 800;
  text-anchor: middle;
}

.flow-arrow.vertical {
  transform: rotate(90deg);
  transform-origin: 100px 100px;
}

.flow-arrow.flow-in {
  fill: #4caf50;
}

.flow-arrow.flow-out {
  fill: #ff9800;
}
</style>
