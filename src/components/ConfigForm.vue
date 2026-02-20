<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Limits -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <span class="material-icons text-sm">schedule</span>
          Limites de Jornada
        </h3>
        <label class="block mb-3">
          <span class="text-sm font-medium text-gray-700">Maximo horas diarias</span>
          <input
            type="number"
            v-model.number="localConfig.max_horas_diarias"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </label>
        <label class="block mb-3">
          <span class="text-sm font-medium text-gray-700">Minimo horas diarias (jornada completa)</span>
          <input
            type="number"
            v-model.number="localConfig.min_horas_diarias_completa"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-gray-700">Maximo horas semanales</span>
          <input
            type="number"
            v-model.number="localConfig.horas_semanales_maximas"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </label>
      </div>

      <!-- Breaks -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 class="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <span class="material-icons text-sm">free_breakfast</span>
          Descansos
        </h3>
        <label class="block mb-3">
          <span class="text-sm font-medium text-gray-700">Descanso entre jornadas (horas)</span>
          <input
            type="number"
            v-model.number="localConfig.descanso_entre_jornadas_horas"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </label>
        <label class="block mb-3">
          <span class="text-sm font-medium text-gray-700">Descanso en jornada >5h (minutos)</span>
          <input
            type="number"
            v-model.number="localConfig.descanso_jornada_continuada_minutos"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-gray-700">Dias descanso semanal consecutivos</span>
          <input
            type="number"
            v-model.number="localConfig.dias_descanso_semanal_consecutivos"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </label>
      </div>

      <!-- Peak hours -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 class="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
          <span class="material-icons text-sm">whatshot</span>
          Hora Punta (L-J tardes)
        </h3>
        <label class="block mb-3">
          <span class="text-sm font-medium text-gray-700">Inicio (HH:MM)</span>
          <input
            type="text"
            v-model="localConfig.hora_punta_inicio"
            placeholder="18:00"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </label>
        <label class="block mb-3">
          <span class="text-sm font-medium text-gray-700">Fin (HH:MM)</span>
          <input
            type="text"
            v-model="localConfig.hora_punta_fin"
            placeholder="21:30"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-sm font-medium text-gray-700">Min personas</span>
            <input
              type="number"
              v-model.number="localConfig.min_personas_sala_punta"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700">Max personas</span>
            <input
              type="number"
              v-model.number="localConfig.max_personas_sala_punta"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </label>
        </div>
      </div>

      <!-- Coverage -->
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 class="font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <span class="material-icons text-sm">bar_chart</span>
          Cobertura Sala
        </h3>
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Hora Valle (L-V resto)</p>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-xs text-gray-600">Min</span>
              <input
                type="number"
                v-model.number="localConfig.min_personas_sala_valle"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </label>
            <label class="block">
              <span class="text-xs text-gray-600">Max</span>
              <input
                type="number"
                v-model.number="localConfig.max_personas_sala_valle"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </label>
          </div>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">Fin de Semana</p>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-xs text-gray-600">Min</span>
              <input
                type="number"
                v-model.number="localConfig.min_personas_sala_finde"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </label>
            <label class="block">
              <span class="text-xs text-gray-600">Max</span>
              <input
                type="number"
                v-model.number="localConfig.max_personas_sala_finde"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation errors -->
    <div v-if="errors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div class="flex items-start gap-2">
        <span class="material-icons text-red-600 mt-0.5">error</span>
        <div>
          <h3 class="font-semibold text-red-800 mb-2">Errores de validacion:</h3>
          <ul class="list-disc list-inside text-red-700 text-sm space-y-1">
            <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
          </ul>
        </div>
      </div>
    </div>

    <button
      @click="handleSubmit"
      class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
    >
      <span class="material-icons text-sm">save</span>
      Guardar Configuracion y Continuar
    </button>
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
