<template>
  <div class="flex items-center justify-between mb-8">
    <div v-for="(s, idx) in steps" :key="s.number" class="flex items-center">
      <div
        :class="[
          'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors',
          currentStep >= s.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
        ]"
      >
        <span v-if="s.number === 3" class="material-icons text-sm">check</span>
        <span v-else>{{ s.number }}</span>
      </div>
      <div
        v-if="idx < steps.length - 1"
        :class="[
          'w-16 md:w-24 h-1 transition-colors',
          currentStep > s.number ? 'bg-blue-600' : 'bg-gray-200'
        ]"
      ></div>
    </div>
  </div>
  <div class="text-center text-sm text-gray-600 mb-6">
    {{ stepLabel }}
  </div>
</template>

<script>
export default {
  name: 'StepIndicator',
  props: {
    currentStep: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      steps: [
        { number: 0 },
        { number: 1 },
        { number: 2 },
        { number: 3 }
      ]
    }
  },
  computed: {
    stepLabel() {
      const labels = {
        0: 'Paso 0: Configuracion de Restricciones',
        1: 'Paso 1: Cargar Demanda del Centro',
        2: 'Paso 2: Cargar Plantilla de Empleados',
        3: 'Cuadrante Generado'
      }
      return labels[this.currentStep] || ''
    }
  }
}
</script>
