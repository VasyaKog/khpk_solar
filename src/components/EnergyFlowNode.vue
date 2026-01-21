<template>
  <div class="energy-node-container" :class="{'is-disabled blur': isDisabled}">
    <!-- SVG для ліній потоку -->
    <svg class="flow-lines" viewBox="0 0 200 200">
      <line x1="100" y1="-138" x2="100" y2="100" :class="['line', { 'active': solarPower > 0 }]" />

      <template v-if="isRight">
      <line x1="-38" y1="100" x2="100" y2="100" :class="['line', 'active', 'flow-out']" />
<!---->
      <line x2="265" y2="100" x1="100" y1="100" :class="['line', { 'flow-in': gridFlow > 0, 'flow-out': gridFlow < 0, 'disabled': !gridAvailable }]" />
      </template>
      <template v-else>
        <line x1="265" y1="100" x2="100" y2="100" :class="['line', 'active', 'flow-out']" />
<!---->
        <line x1="100" y1="100" x2="-38" y2="100" :class="['line' , { 'flow-in': gridFlow > 0, 'flow-out': gridFlow < 0, 'disabled': !gridAvailable }]" />
      </template>

      <line x1="100" y1="100" x2="100" y2="365" :class="{'line':1, 'active': 1, 'flow-in': batteryFlow > 0, 'flow-out': batteryFlow < 0 }" />
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
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -25px;
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
  transition: stroke 0.3s;
}

/* Анімація потоку */
.line.active, .line.flow-in, .line.flow-out {
  stroke: #4caf50;
  stroke-dasharray: 8;
  animation: flow 2s linear infinite;
}

.line.flow-out {
  animation-direction: reverse;
  stroke: #ff9800; /* Колір розряду/експорту */
}

.line.disabled {
  stroke: #f44336;
  stroke-dasharray: none;
  animation: none;
  opacity: 0.3;
}

@keyframes flow {
  to { stroke-dashoffset: -16; }
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
  animation: pulse 1.5s ease-out infinite;
}

@keyframes pulse {
  to { transform: scale(3); opacity: 0; }
}
</style>
