<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Limits -->
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition-colors duration-300 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div class="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
            <span class="material-icons text-[18px]">schedule</span>
          </div>
          <h3 class="font-semibold text-slate-800 tracking-tight">Límites de Jornada</h3>
        </div>
        <div class="p-5 space-y-4">
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Máximo horas diarias</span>
            <input
              type="number"
              v-model.number="localConfig.max_horas_diarias"
              class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Mínimo horas diarias (jornada completa)</span>
            <input
              type="number"
              v-model.number="localConfig.min_horas_diarias_completa"
              class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Máximo horas semanales</span>
            <input
              type="number"
              v-model.number="localConfig.horas_semanales_maximas"
              class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </label>
        </div>
      </div>

      <!-- Breaks -->
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors duration-300 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div class="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
            <span class="material-icons text-[18px]">free_breakfast</span>
          </div>
          <h3 class="font-semibold text-slate-800 tracking-tight">Descansos</h3>
        </div>
        <div class="p-5 space-y-4">
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Descanso entre jornadas (horas)</span>
            <input
              type="number"
              v-model.number="localConfig.descanso_entre_jornadas_horas"
              class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Descanso en jornada >5h (minutos)</span>
            <input
              type="number"
              v-model.number="localConfig.descanso_jornada_continuada_minutos"
              class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Días descanso semanal consecutivos</span>
            <input
              type="number"
              v-model.number="localConfig.dias_descanso_semanal_consecutivos"
              class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </label>
        </div>
      </div>

      <!-- Peak hours -->
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-300 transition-colors duration-300 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div class="bg-amber-100 p-1.5 rounded-lg text-amber-600">
            <span class="material-icons text-[18px]">whatshot</span>
          </div>
          <h3 class="font-semibold text-slate-800 tracking-tight">Hora Punta (L-J tardes)</h3>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Inicio</span>
              <input
                type="text"
                v-model="localConfig.hora_punta_inicio"
                placeholder="18:00"
                class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none placeholder-slate-300"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Fin</span>
              <input
                type="text"
                v-model="localConfig.hora_punta_fin"
                placeholder="21:30"
                class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none placeholder-slate-300"
              />
            </label>
          </div>
          <div class="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Min. personas</span>
              <input
                type="number"
                v-model.number="localConfig.min_personas_sala_punta"
                class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Max. personas</span>
              <input
                type="number"
                v-model.number="localConfig.max_personas_sala_punta"
                class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- Coverage -->
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-sky-300 transition-colors duration-300 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div class="bg-sky-100 p-1.5 rounded-lg text-sky-600">
            <span class="material-icons text-[18px]">verified_user</span>
          </div>
          <h3 class="font-semibold text-slate-800 tracking-tight">Cobertura Sala</h3>
        </div>
        <div class="p-5 space-y-5">
          <div>
            <h4 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Hora Valle (L-V resto)</h4>
            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-xs font-medium text-slate-600">Mínimo</span>
                <input
                  type="number"
                  v-model.number="localConfig.min_personas_sala_valle"
                  class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none"
                />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-600">Máximo</span>
                <input
                  type="number"
                  v-model.number="localConfig.max_personas_sala_valle"
                  class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none"
                />
              </label>
            </div>
          </div>
          <div class="pt-5 border-t border-slate-100">
            <h4 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Fin de Semana</h4>
            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-xs font-medium text-slate-600">Mínimo</span>
                <input
                  type="number"
                  v-model.number="localConfig.min_personas_sala_finde"
                  class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none"
                />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-600">Máximo</span>
                <input
                  type="number"
                  v-model.number="localConfig.max_personas_sala_finde"
                  class="mt-1.5 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation errors -->
    <div v-if="errors.length > 0" class="bg-rose-50 border border-rose-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2">
      <div class="flex items-start gap-3">
        <span class="material-icons text-rose-500 mt-0.5">error_outline</span>
        <div>
          <h3 class="font-semibold text-rose-900 mb-2">Por favor corrige los siguientes errores:</h3>
          <ul class="text-rose-700 text-sm space-y-1.5">
            <li v-for="(err, i) in errors" :key="i" class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
              {{ err }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex justify-end pt-4">
      <button
        @click="handleSubmit"
        class="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        <span class="material-icons text-[18px]">save</span>
        Guardar y Continuar
      </button>
    </div>
  </div>
</template>

<script>
import { validateConfig } from '../utils/validators.js'

const DEFAULT_CONFIG = {
  max_horas_diarias: 9,
  min_horas_diarias_completa: 6,
  descanso_entre_jornadas_horas: 12,
  descanso_jornada_continuada_minutos: 30,
  horas_semanales_maximas: 37,
  dias_descanso_semanal_consecutivos: 2,
  hora_punta_inicio: '18:00',
  hora_punta_fin: '21:30',
  min_personas_sala_punta: 2,
  max_personas_sala_punta: 3,
  min_personas_sala_valle: 1,
  max_personas_sala_valle: 2,
  min_personas_sala_finde: 1,
  max_personas_sala_finde: 2
}

export default {
  name: 'ConfigForm',
  emits: ['config-saved'],
  data() {
    return {
      localConfig: { ...DEFAULT_CONFIG },
      errors: []
    }
  },
  mounted() {
    this.loadFromStorage()
  },
  methods: {
    loadFromStorage() {
      try {
        const saved = localStorage.getItem('gimnasio_config')
        if (saved) {
          const parsed = JSON.parse(saved)
          this.localConfig = { ...DEFAULT_CONFIG, ...parsed }
        }
      } catch (e) {
        console.error('Error loading config from localStorage:', e)
      }
    },
    saveToStorage() {
      try {
        localStorage.setItem('gimnasio_config', JSON.stringify(this.localConfig))
      } catch (e) {
        console.error('Error saving config to localStorage:', e)
      }
    },
    handleSubmit() {
      const validationErrors = validateConfig(this.localConfig)
      if (validationErrors.length > 0) {
        this.errors = validationErrors
      } else {
        this.errors = []
        this.saveToStorage()
        this.$emit('config-saved', { ...this.localConfig })
      }
    }
  }
}
</script>
