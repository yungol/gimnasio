<template>
  <div>
    <div class="flex items-center justify-between relative max-w-3xl mx-auto z-0">
      <!-- Background line -->
      <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10"></div>
      
      <!-- Active line fill -->
      <div 
        class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10 transition-all duration-500 ease-in-out"
        :style="{ width: `${(currentStep / 3) * 100}%` }"
      ></div>

      <div v-for="(s, idx) in steps" :key="s.number" class="flex flex-col items-center">
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2',
            currentStep > s.number ? 'bg-indigo-600 border-indigo-600 text-white' : 
            currentStep === s.number ? 'bg-white border-indigo-600 text-indigo-700 shadow-md ring-4 ring-indigo-50' : 
            'bg-white border-slate-200 text-slate-400'
          ]"
        >
          <span v-if="currentStep > s.number || s.number === 3 && currentStep === 3" class="material-icons text-[20px]">check</span>
          <span v-else>{{ s.number }}</span>
        </div>
      </div>
    </div>
    <div class="text-center mt-6">
      <span class="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-100 text-sm font-medium text-slate-700 tracking-wide border border-slate-200/60 shadow-sm">
        {{ stepLabel }}
      </span>
    </div>
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
        0: 'Paso 0: Configuración Base',
        1: 'Paso 1: Demanda (Tabla A)',
        2: 'Paso 2: Plantilla (Tabla B)',
        3: 'Paso 3: Resultados'
      }
      return labels[this.currentStep] || ''
    }
  }
}
</script>
