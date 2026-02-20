<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-14">
          <div class="flex items-center gap-2">
            <span class="material-icons text-blue-600">fitness_center</span>
            <span class="text-lg font-semibold text-gray-900">Gimnasio</span>
          </div>
          <div class="flex items-center space-x-1">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="handleTabClick(tab)"
              :disabled="tab.disabled"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                currentTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : tab.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
              ]"
            >
              <span class="material-icons text-sm">{{ tab.icon }}</span>
              <span class="hidden md:inline">{{ tab.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- ==================== WIZARD TAB ==================== -->
      <div v-if="currentTab === 'wizard'">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-2xl font-bold text-gray-800">Generador de Cuadrantes Semanales</h1>
          </div>
          <p class="text-gray-600 mb-6">Sistema automatizado de planificacion de turnos</p>

          <StepIndicator :current-step="wizardStep" />

          <!-- Step 0: Config -->
          <div v-if="wizardStep === 0">
            <h2 class="text-xl font-semibold mb-4">Paso 0: Configuracion de Restricciones</h2>
            <p class="text-gray-600 mb-6">
              Define las reglas y limites que aplicaran a la planificacion de turnos
            </p>
            <ConfigForm @config-saved="handleConfigSaved" />
          </div>

          <!-- Step 1: Tabla A -->
          <div v-if="wizardStep === 1">
            <h2 class="text-xl font-semibold mb-4">Paso 1: Cargar Tabla A (Demanda del Centro)</h2>
            <p class="text-gray-600 mb-2">
              Define que necesidades hay que cubrir cada dia (actividades dirigidas, sala, recepcion)
            </p>
            <div class="mb-4 flex items-center gap-2">
              <p class="text-sm text-gray-500">
                <strong>Columnas:</strong> dia, inicio, fin, tipo_necesidad, actividad, espacio, personas_requeridas, permite_compartido
              </p>
              <button
                @click="downloadSampleA"
                class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                <span class="material-icons text-sm">download</span>
                Ejemplo CSV
              </button>
            </div>

            <FileUploader
              ref="uploaderA"
              label="Seleccionar archivo CSV de demanda"
              success-label="Tabla A validada correctamente"
              :validate-fn="validateTablaAFn"
              @file-loaded="handleTablaALoaded"
            />

            <div v-if="tablaA" class="flex gap-3 mt-4">
              <button
                @click="wizardStep = 0"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Volver
              </button>
              <button
                @click="wizardStep = 2"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Continuar al Paso 2
              </button>
            </div>
          </div>

          <!-- Step 2: Tabla B -->
          <div v-if="wizardStep === 2">
            <h2 class="text-xl font-semibold mb-4">Paso 2: Cargar Tabla B (Empleados + Habilitaciones)</h2>
            <p class="text-gray-600 mb-2">
              <strong>Columnas obligatorias:</strong> empleado_id, nombre_mostrado, horas_semanales_contrato, tipo_jornada,
              permite_turno_partido, puede_fin_de_semana, solo_aadd, hora_no_disp_inicio, hora_no_disp_fin, max_aadd_semana
            </p>
            <div class="mb-2 flex items-center gap-2">
              <p class="text-sm text-gray-500">
                <strong>Columnas de actividades:</strong> Anade una columna por cada actividad (PUMP, COMBAT, etc.) con valores SI/NO
              </p>
              <button
                @click="downloadSampleB"
                class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                <span class="material-icons text-sm">download</span>
                Ejemplo CSV
              </button>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
              <h3 class="font-semibold text-blue-800 mb-1 flex items-center gap-1">
                <span class="material-icons text-sm">info</span>
                Campo importante: solo_aadd
              </h3>
              <ul class="text-blue-700 space-y-1 ml-5">
                <li><strong>SI</strong> = Especialista que SOLO hace sus clases (AADD). No hara SALA ni RECEPCION.</li>
                <li><strong>NO</strong> = Polivalente. Puede hacer AADD, SALA y RECEPCION.</li>
              </ul>
            </div>

            <FileUploader
              ref="uploaderB"
              label="Seleccionar archivo CSV de plantilla"
              success-label="Tabla B validada correctamente"
              :validate-fn="validateTablaBFn"
              highlight-field="solo_aadd"
              @file-loaded="handleTablaBLoaded"
            />

            <div v-if="tablaB" class="flex gap-3 mt-4">
              <button
                @click="wizardStep = 1"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Volver al Paso 1
              </button>
              <button
                @click="generateSchedule"
                :disabled="processing || !tablaA || !tablaB || !config"
                class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-sm"
              >
                <span v-if="processing" class="material-icons text-sm animate-spin">autorenew</span>
                <span class="material-icons text-sm" v-else>play_arrow</span>
                {{ processing ? 'Generando cuadrante...' : 'Generar Cuadrante' }}
              </button>
            </div>
          </div>

          <!-- Step 3: Results -->
          <div v-if="wizardStep === 3 && cuadrante">
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
              <span class="material-icons text-green-600">assessment</span>
              Resultados del Cuadrante
            </h2>

            <!-- Stats overview -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span class="material-icons text-sm">insights</span>
                Estadisticas de Optimizacion
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div class="bg-white rounded p-3">
                  <div class="text-sm text-gray-600">Cobertura de Necesidades</div>
                  <div class="text-2xl font-bold text-blue-600">{{ cuadrante.estadisticas.cobertura.porcentaje }}%</div>
                  <div class="text-xs text-gray-500">
                    {{ cuadrante.estadisticas.cobertura.cubiertas }} de {{ cuadrante.estadisticas.cobertura.total_necesidades }}
                  </div>
                </div>
                <div class="bg-white rounded p-3">
                  <div class="text-sm text-gray-600">Total Asignaciones</div>
                  <div class="text-2xl font-bold text-green-600">{{ cuadrante.asignaciones.length }}</div>
                </div>
                <div class="bg-white rounded p-3">
                  <div class="text-sm text-gray-600">Empleados Activos</div>
                  <div class="text-2xl font-bold text-purple-600">
                    {{ cuadrante.estadisticas.empleados.filter(e => parseFloat(e.horas_asignadas) > 0).length }}
                  </div>
                </div>
              </div>

              <!-- Hours per employee -->
              <div class="bg-white rounded p-3">
                <h4 class="font-semibold text-gray-800 mb-2">Horas por Empleado</h4>
                <div class="space-y-2 max-h-60 overflow-y-auto">
                  <div
                    v-for="(emp, i) in cuadrante.estadisticas.empleados"
                    :key="i"
                    class="flex items-center justify-between text-sm border-b border-gray-100 pb-2"
                  >
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ emp.nombre }}</span>
                      <span
                        v-if="emp.es_especialista"
                        class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                      >Especialista</span>
                      <span class="text-xs text-gray-400">({{ emp.empleado_id }})</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span :class="emp.cumple_minimo ? 'text-green-600' : 'text-orange-600'">
                        {{ emp.horas_asignadas }}h / {{ emp.horas_contrato }}h
                      </span>
                      <span class="text-xs bg-gray-100 px-2 py-1 rounded">{{ emp.porcentaje_uso }}%</span>
                      <span
                        v-if="emp.aadd_count > 0"
                        class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >{{ emp.aadd_count }} AADD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Capacity analysis -->
            <div v-if="cuadrante.analisis_capacidad" class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 class="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <span class="material-icons text-sm">group</span>
                Analisis de Capacidad de Plantilla
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div class="bg-white rounded p-2 text-center">
                  <div class="text-xs text-gray-600">Total Empleados</div>
                  <div class="text-xl font-bold text-purple-600">{{ cuadrante.analisis_capacidad.total_empleados }}</div>
                </div>
                <div class="bg-white rounded p-2 text-center">
                  <div class="text-xs text-gray-600">Especialistas</div>
                  <div class="text-xl font-bold text-orange-600">{{ cuadrante.analisis_capacidad.especialistas }}</div>
                  <div class="text-xs text-gray-500">Solo AADD</div>
                </div>
                <div class="bg-white rounded p-2 text-center">
                  <div class="text-xs text-gray-600">Polivalentes</div>
                  <div class="text-xl font-bold text-green-600">{{ cuadrante.analisis_capacidad.polivalentes }}</div>
                  <div class="text-xs text-gray-500">AADD+SALA+REC</div>
                </div>
                <div class="bg-white rounded p-2 text-center">
                  <div class="text-xs text-gray-600">Fines de Semana</div>
                  <div class="text-xl font-bold text-blue-600">{{ cuadrante.analisis_capacidad.pueden_finde }}</div>
                </div>
              </div>
              <div class="bg-white rounded p-3">
                <h4 class="font-semibold text-gray-800 mb-2 text-sm">Empleados Habilitados por Actividad:</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div
                    v-for="(count, act) in cuadrante.analisis_capacidad.actividades_habilitadas"
                    :key="act"
                    class="flex justify-between items-center bg-gray-50 px-2 py-1 rounded"
                  >
                    <span class="font-medium">{{ act }}:</span>
                    <span
                      :class="count === 0 ? 'text-red-600 font-bold' : count < 2 ? 'text-orange-600' : 'text-green-600'"
                    >{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Suggestions -->
            <div v-if="cuadrante.sugerencias && cuadrante.sugerencias.length > 0" class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
              <h3 class="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <span class="material-icons text-sm">lightbulb</span>
                Sugerencias para Resolver Problemas ({{ cuadrante.sugerencias.length }})
              </h3>
              <div class="space-y-3">
                <div
                  v-for="(sug, i) in cuadrante.sugerencias"
                  :key="i"
                  class="bg-white border border-yellow-300 rounded p-3"
                >
                  <div class="flex items-start gap-2">
                    <span
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-bold',
                        sug.tipo === 'CRITICO' ? 'bg-red-100 text-red-700'
                          : sug.tipo === 'AADD' ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      ]"
                    >{{ sug.tipo }}</span>
                    <div class="flex-1">
                      <div class="text-sm text-gray-800 mb-1">{{ sug.mensaje }}</div>
                      <div class="text-sm text-green-700 font-medium">{{ sug.solucion }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Warnings -->
            <div v-if="cuadrante.warnings.length > 0" class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div class="flex items-start gap-2">
                <span class="material-icons text-orange-600 mt-0.5">warning</span>
                <div class="flex-1">
                  <h3 class="font-semibold text-orange-800 mb-2">Advertencias ({{ cuadrante.warnings.length }}):</h3>
                  <div class="text-orange-700 text-sm space-y-1">
                    <div
                      v-for="(warn, i) in cuadrante.warnings"
                      :key="i"
                      class="border-l-2 border-orange-400 pl-2"
                    >
                      <strong>{{ warn.tipo }}</strong> - {{ warn.empleado }}: {{ warn.mensaje }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Errors (uncovered needs) -->
            <div v-if="cuadrante.errores.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div class="flex items-start gap-2">
                <span class="material-icons text-red-600 mt-0.5">cancel</span>
                <div class="flex-1">
                  <h3 class="font-semibold text-red-800 mb-3">
                    Necesidades No Cubiertas ({{ cuadrante.errores.length }})
                  </h3>
                  <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="bg-white rounded p-2 text-center">
                      <div class="text-xs text-gray-600">AADD</div>
                      <div class="text-lg font-bold text-red-600">
                        {{ cuadrante.errores.filter(e => e.tipo === 'AADD').length }}
                      </div>
                    </div>
                    <div class="bg-white rounded p-2 text-center">
                      <div class="text-xs text-gray-600">SALA</div>
                      <div class="text-lg font-bold text-red-600">
                        {{ cuadrante.errores.filter(e => e.tipo === 'SALA').length }}
                      </div>
                    </div>
                    <div class="bg-white rounded p-2 text-center">
                      <div class="text-xs text-gray-600">RECEPCION</div>
                      <div class="text-lg font-bold text-red-600">
                        {{ cuadrante.errores.filter(e => e.tipo === 'RECEPCION').length }}
                      </div>
                    </div>
                  </div>
                  <div class="text-red-700 text-sm space-y-2 max-h-60 overflow-y-auto">
                    <div
                      v-for="(err, i) in cuadrante.errores"
                      :key="i"
                      class="bg-white border border-red-200 rounded p-2"
                    >
                      <div class="font-medium mb-1">{{ err.dia }} {{ err.hora }} - {{ err.tipo }} {{ err.actividad }}</div>
                      <div class="text-xs text-gray-700 pl-2 border-l-2 border-red-400">{{ err.razon }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Day selector + grid -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Seleccionar dia para ver cuadrante:</label>
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  v-for="dia in daysList"
                  :key="dia"
                  @click="selectedResultDay = dia"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedResultDay === dia
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >{{ dayLabels[dia] }}</button>

                <button
                  v-if="selectedResultDay"
                  @click="handleExportGrid"
                  class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm ml-2"
                >
                  <span class="material-icons text-sm">download</span>
                  Exportar dia (Excel)
                </button>
              </div>
            </div>

            <ScheduleGrid
              v-if="selectedResultDay && cuadrante.rejillas[selectedResultDay]"
              :rejilla="cuadrante.rejillas[selectedResultDay]"
            />

            <!-- Export buttons -->
            <div class="flex gap-3 my-6">
              <button
                @click="handleExportCSV"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <span class="material-icons text-sm">download</span>
                Exportar Asignaciones (CSV)
              </button>
            </div>

            <!-- Assignments table -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 class="font-semibold text-gray-800 mb-3">
                Lista de Asignaciones ({{ cuadrante.asignaciones.length }})
              </h3>
              <div class="overflow-x-auto max-h-96">
                <table class="w-full text-sm">
                  <thead class="bg-gray-200 sticky top-0">
                    <tr>
                      <th class="px-3 py-2 text-left">Dia</th>
                      <th class="px-3 py-2 text-left">Empleado</th>
                      <th class="px-3 py-2 text-left">Inicio</th>
                      <th class="px-3 py-2 text-left">Fin</th>
                      <th class="px-3 py-2 text-left">Tipo</th>
                      <th class="px-3 py-2 text-left">Actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(a, i) in cuadrante.asignaciones"
                      :key="i"
                      class="border-b border-gray-200"
                    >
                      <td class="px-3 py-2">{{ a.dia }}</td>
                      <td class="px-3 py-2">{{ a.nombre }}</td>
                      <td class="px-3 py-2">{{ a.inicio }}</td>
                      <td class="px-3 py-2">{{ a.fin }}</td>
                      <td class="px-3 py-2">{{ a.tipo_necesidad }}</td>
                      <td class="px-3 py-2">{{ a.actividad }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button
              @click="resetWizard"
              class="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <span class="material-icons text-sm">refresh</span>
              Nuevo Cuadrante
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== HORARIO BASE TAB ==================== -->
      <div v-if="currentTab === 'horario-base'">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Horario Base</h2>
            <div class="flex gap-1">
              <button
                v-for="dia in daysList"
                :key="dia"
                @click="selectedGridDay = dia"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedGridDay === dia
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >{{ dayLabels[dia] }}</button>
            </div>
          </div>

          <div v-if="cuadrante && cuadrante.rejillas[selectedGridDay]">
            <ScheduleGrid :rejilla="cuadrante.rejillas[selectedGridDay]" />
            <!-- Legend -->
            <div class="mt-4 flex gap-6">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 bg-gray-300 rounded"></div>
                <span class="text-sm text-gray-600">SALA</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 bg-blue-200 rounded"></div>
                <span class="text-sm text-gray-600">RECEPCION</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 bg-green-200 rounded"></div>
                <span class="text-sm text-gray-600">AADD</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 text-gray-500">
            <span class="material-icons text-4xl mb-2 block">event_busy</span>
            <p>No hay cuadrante generado. Ve a "Generar Cuadrante" para crear uno.</p>
          </div>
        </div>
      </div>

      <!-- ==================== ESTADISTICAS TAB ==================== -->
      <div v-if="currentTab === 'estadisticas'">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="material-icons">bar_chart</span>
            Estadisticas
          </h2>

          <div v-if="cuadrante">
            <!-- Hours chart -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-800 mb-4">Horas Contratadas vs Asignadas</h3>
              <div class="max-w-3xl">
                <canvas ref="hoursChart"></canvas>
              </div>
            </div>

            <!-- Coverage by day -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-800 mb-4">Asignaciones por Dia</h3>
              <div class="max-w-2xl">
                <canvas ref="dayChart"></canvas>
              </div>
            </div>

            <!-- Activity distribution -->
            <div>
              <h3 class="text-lg font-medium text-gray-800 mb-4">Distribucion por Tipo de Necesidad</h3>
              <div class="max-w-sm mx-auto">
                <canvas ref="typeChart"></canvas>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 text-gray-500">
            <span class="material-icons text-4xl mb-2 block">show_chart</span>
            <p>No hay datos para mostrar. Genera un cuadrante primero.</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import StepIndicator from './components/StepIndicator.vue'
import ConfigForm from './components/ConfigForm.vue'
import FileUploader from './components/FileUploader.vue'
import ScheduleGrid from './components/ScheduleGrid.vue'
import { validateTablaA, validateTablaB } from './utils/validators.js'
import { schedulerAlgorithm } from './utils/scheduler.js'
import { exportGridHTML, exportAssignmentsCSV, downloadSampleTablaA, downloadSampleTablaB } from './utils/export.js'
import { DAYS, DAY_LABELS } from './utils/time-utils.js'

export default {
  name: 'App',
  components: {
    StepIndicator,
    ConfigForm,
    FileUploader,
    ScheduleGrid
  },
  data() {
    return {
      currentTab: 'wizard',
      tabs: [
        { id: 'wizard', label: 'Generar Cuadrante', icon: 'auto_fix_high', disabled: false },
        { id: 'horario-base', label: 'Horario Base', icon: 'calendar_month', disabled: false },
        { id: 'estadisticas', label: 'Estadisticas', icon: 'bar_chart', disabled: false }
      ],
      wizardStep: 0,
      config: null,
      tablaA: null,
      tablaB: null,
      cuadrante: null,
      processing: false,
      selectedResultDay: '',
      selectedGridDay: 'LUNES',
      daysList: DAYS,
      dayLabels: DAY_LABELS,
      chartInstances: []
    }
  },
  beforeUnmount() {
    this.chartInstances.forEach(c => c.destroy())
    this.chartInstances = []
  },
  methods: {
    handleTabClick(tab) {
      if (tab.disabled) return
      this.currentTab = tab.id

      if (tab.id === 'estadisticas' && this.cuadrante) {
        this.$nextTick(() => this.renderCharts())
      }
    },

    // Validation functions passed to FileUploader components
    validateTablaAFn(data) {
      return validateTablaA(data)
    },
    validateTablaBFn(data) {
      return validateTablaB(data)
    },

    handleConfigSaved(config) {
      this.config = config
      this.wizardStep = 1
    },

    handleTablaALoaded(data) {
      this.tablaA = data
    },

    handleTablaBLoaded(data) {
      this.tablaB = data
    },

    generateSchedule() {
      this.processing = true
      // Use setTimeout to allow UI to update (show spinner)
      setTimeout(() => {
        try {
          const result = schedulerAlgorithm(
            this.tablaA.data,
            this.tablaB.data,
            this.config
          )
          this.cuadrante = result
          this.wizardStep = 3
          this.selectedResultDay = ''
        } catch (error) {
          console.error('Error generando cuadrante:', error)
          alert('Error al generar el cuadrante: ' + error.message)
        }
        this.processing = false
      }, 100)
    },

    resetWizard() {
      this.wizardStep = 0
      this.tablaA = null
      this.tablaB = null
      this.cuadrante = null
      this.selectedResultDay = ''
      if (this.$refs.uploaderA) this.$refs.uploaderA.reset()
      if (this.$refs.uploaderB) this.$refs.uploaderB.reset()
    },

    handleExportGrid() {
      if (this.selectedResultDay && this.cuadrante) {
        exportGridHTML(this.cuadrante, this.selectedResultDay)
      }
    },

    handleExportCSV() {
      if (this.cuadrante) {
        exportAssignmentsCSV(this.cuadrante)
      }
    },

    downloadSampleA() {
      downloadSampleTablaA()
    },

    downloadSampleB() {
      downloadSampleTablaB()
    },

    // Chart.js rendering
    renderCharts() {
      // Destroy previous instances
      this.chartInstances.forEach(c => c.destroy())
      this.chartInstances = []

      if (!this.cuadrante || typeof window.Chart === 'undefined') return

      this.renderHoursChart()
      this.renderDayChart()
      this.renderTypeChart()
    },

    renderHoursChart() {
      const canvas = this.$refs.hoursChart
      if (!canvas) return

      const empleados = this.cuadrante.estadisticas.empleados
      const chart = new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels: empleados.map(e => e.nombre),
          datasets: [
            {
              label: 'Horas Contrato',
              data: empleados.map(e => e.horas_contrato),
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            },
            {
              label: 'Horas Asignadas',
              data: empleados.map(e => e.horas_asignadas),
              backgroundColor: 'rgba(34, 197, 94, 0.5)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                afterBody: (items) => {
                  const idx = items[0].dataIndex
                  const emp = empleados[idx]
                  return `Uso: ${emp.porcentaje_uso}% | AADD: ${emp.aadd_count}`
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Horas' }
            }
          }
        }
      })
      this.chartInstances.push(chart)
    },

    renderDayChart() {
      const canvas = this.$refs.dayChart
      if (!canvas) return

      const dayCounts = DAYS.map(dia => {
        return this.cuadrante.asignaciones.filter(a => a.dia === dia).length
      })

      const chart = new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels: DAYS.map(d => DAY_LABELS[d]),
          datasets: [{
            label: 'Asignaciones',
            data: dayCounts,
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Asignaciones' } }
          }
        }
      })
      this.chartInstances.push(chart)
    },

    renderTypeChart() {
      const canvas = this.$refs.typeChart
      if (!canvas) return

      const types = ['AADD', 'SALA', 'RECEPCION']
      const counts = types.map(t =>
        this.cuadrante.asignaciones.filter(a => a.tipo_necesidad === t).length
      )

      const chart = new window.Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: types,
          datasets: [{
            data: counts,
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(156, 163, 175, 0.7)',
              'rgba(59, 130, 246, 0.7)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      })
      this.chartInstances.push(chart)
    }
  }
}
</script>

<style scoped>
td {
  height: 28px;
}
</style>
