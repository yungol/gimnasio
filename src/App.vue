<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Navbar -->
    <nav class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-2">
            <div class="bg-indigo-600 p-1.5 rounded-lg flex items-center justify-center shadow-sm">
              <span class="material-icons text-white text-xl">fitness_center</span>
            </div>
            <span class="text-xl font-bold tracking-tight text-slate-900">Gimnasio</span>
          </div>
          <div class="flex items-center space-x-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="handleTabClick(tab)"
              :disabled="tab.disabled"
              :class="[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
                currentTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5'
                  : tab.disabled
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              ]"
            >
              <span class="material-icons text-[18px]">{{ tab.icon }}</span>
              <span class="hidden md:inline">{{ tab.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- ==================== WIZARD TAB ==================== -->
      <div v-if="currentTab === 'wizard'" class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-6 py-8 sm:p-10 border-b border-slate-100 bg-slate-50/50">
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
              Generador de Cuadrantes Semanales
            </h1>
            <p class="text-slate-500 max-w-2xl">
              Sistema automatizado para la planificación de turnos y clases dirigidas. Sigue los pasos para configurar, subir datos y generar un cuadrante óptimo.
            </p>
          </div>

          <div class="px-6 py-6 sm:px-10">
            <StepIndicator :current-step="wizardStep" class="mb-10" />

            <!-- Step 0: Config -->
            <div v-if="wizardStep === 0" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="mb-6">
                <h2 class="text-xl font-semibold text-slate-900 tracking-tight">Paso 0: Configuración de Restricciones</h2>
                <p class="text-slate-500 text-sm mt-1">
                  Establece los límites operativos, descansos y necesidades de cobertura para la generación del cuadrante.
                </p>
              </div>
              <ConfigForm @config-saved="handleConfigSaved" />
            </div>

            <!-- Step 1: Tabla A -->
            <div v-if="wizardStep === 1" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="mb-6">
                <h2 class="text-xl font-semibold text-slate-900 tracking-tight">Paso 1: Demanda del Centro (Tabla A)</h2>
                <p class="text-slate-500 text-sm mt-1 mb-4">
                  Sube el archivo CSV con las necesidades a cubrir cada día (actividades dirigidas, sala, recepción).
                </p>
                <div class="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span class="text-xs font-mono text-slate-600 bg-slate-200/50 px-2 py-1 rounded">dia, inicio, fin, tipo_necesidad, actividad, espacio, personas_requeridas, permite_compartido</span>
                  <button
                    @click="downloadSampleA"
                    class="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <span class="material-icons text-[16px]">file_download</span>
                    Descargar ejemplo CSV
                  </button>
                </div>
              </div>

              <FileUploader
                ref="uploaderA"
                label="Arrastra o selecciona el CSV de Demanda"
                success-label="Demanda validada correctamente"
                :validate-fn="validateTablaAFn"
                @file-loaded="handleTablaALoaded"
              />

              <div v-if="tablaA" class="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  @click="wizardStep = 0"
                  class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                >
                  Volver a Configuración
                </button>
                <button
                  @click="wizardStep = 2"
                  class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  Continuar al Paso 2
                </button>
              </div>
            </div>

            <!-- Step 2: Tabla B -->
            <div v-if="wizardStep === 2" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="mb-6">
                <h2 class="text-xl font-semibold text-slate-900 tracking-tight">Paso 2: Plantilla y Habilitaciones (Tabla B)</h2>
                <p class="text-slate-500 text-sm mt-1 mb-4">
                  Sube el archivo CSV con los datos del personal, sus horarios y actividades permitidas.
                </p>
                <div class="flex flex-col gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-semibold text-slate-700">Columnas base:</span>
                    <span class="text-xs font-mono text-slate-600 bg-slate-200/50 px-2 py-1 rounded">empleado_id, nombre_mostrado, horas_semanales_contrato, tipo_jornada, permite_turno_partido, puede_fin_de_semana, solo_aadd, hora_no_disp_inicio, hora_no_disp_fin, max_aadd_semana</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-semibold text-slate-700">Actividades:</span>
                    <span class="text-xs text-slate-600">Añade una columna por cada actividad (PUMP, COMBAT, etc.) con valores SI/NO</span>
                  </div>
                  <div class="mt-2">
                    <button
                      @click="downloadSampleB"
                      class="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <span class="material-icons text-[16px]">file_download</span>
                      Descargar ejemplo CSV
                    </button>
                  </div>
                </div>

                <div class="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
                  <h3 class="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-1.5">
                    <span class="material-icons text-[18px]">info</span>
                    El campo "solo_aadd"
                  </h3>
                  <ul class="text-sm text-indigo-800 space-y-1.5 ml-6 list-disc">
                    <li><strong class="font-medium">SI</strong>: Especialista (sólo imparte sus clases, sin sala ni recepción).</li>
                    <li><strong class="font-medium">NO</strong>: Polivalente (clases + sala + recepción).</li>
                  </ul>
                </div>
              </div>

              <FileUploader
                ref="uploaderB"
                label="Arrastra o selecciona el CSV de Plantilla"
                success-label="Plantilla validada correctamente"
                :validate-fn="validateTablaBFn"
                highlight-field="solo_aadd"
                @file-loaded="handleTablaBLoaded"
              />

              <div v-if="tablaB" class="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  @click="wizardStep = 1"
                  class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                >
                  Volver al Paso 1
                </button>
                <button
                  @click="generateSchedule"
                  :disabled="processing || !tablaA || !tablaB || !config"
                  class="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-medium transition-all shadow-sm hover:shadow-md text-sm active:scale-[0.98]"
                >
                  <span v-if="processing" class="material-icons text-[18px] animate-spin">autorenew</span>
                  <span v-else class="material-icons text-[18px]">auto_awesome</span>
                  {{ processing ? 'Procesando algoritmo...' : 'Generar Cuadrante Óptimo' }}
                </button>
              </div>
            </div>

            <!-- Step 3: Results -->
            <div v-if="wizardStep === 3 && cuadrante" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span class="material-icons text-emerald-500">check_circle</span>
                  Resultados Generados
                </h2>
                <button
                  @click="resetWizard"
                  class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                >
                  <span class="material-icons text-[18px]">refresh</span>
                  Nuevo
                </button>
              </div>

              <!-- Stats overview -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div class="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10"></div>
                  <div class="text-sm font-medium text-slate-500 mb-1">Cobertura de Necesidades</div>
                  <div class="text-4xl font-mono font-semibold text-indigo-600 mb-1">
                    {{ cuadrante.estadisticas.cobertura.porcentaje }}%
                  </div>
                  <div class="text-xs text-slate-400">
                    <span class="font-mono">{{ cuadrante.estadisticas.cobertura.cubiertas }}</span> de <span class="font-mono">{{ cuadrante.estadisticas.cobertura.total_necesidades }}</span> cubiertas
                  </div>
                </div>
                <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div class="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10"></div>
                  <div class="text-sm font-medium text-slate-500 mb-1">Total Asignaciones</div>
                  <div class="text-4xl font-mono font-semibold text-emerald-600 mb-1">
                    {{ cuadrante.asignaciones.length }}
                  </div>
                  <div class="text-xs text-slate-400">Bloques programados</div>
                </div>
                <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div class="absolute right-0 top-0 w-24 h-24 bg-sky-50 rounded-bl-full -z-10"></div>
                  <div class="text-sm font-medium text-slate-500 mb-1">Empleados Activos</div>
                  <div class="text-4xl font-mono font-semibold text-sky-600 mb-1">
                    {{ cuadrante.estadisticas.empleados.filter(e => parseFloat(e.horas_asignadas) > 0).length }}
                  </div>
                  <div class="text-xs text-slate-400">Con al menos un turno</div>
                </div>
              </div>

              <!-- Capacity analysis & Hours -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                  <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-t-2xl">
                    <span class="material-icons text-slate-400 text-[18px]">group</span>
                    <h3 class="font-semibold text-slate-800">Análisis de Capacidad</h3>
                  </div>
                  <div class="p-5 flex-1" v-if="cuadrante.analisis_capacidad">
                    <div class="grid grid-cols-2 gap-3 mb-6">
                      <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                        <div class="text-xs font-medium text-slate-500 mb-1">Especialistas</div>
                        <div class="text-2xl font-mono text-slate-700">{{ cuadrante.analisis_capacidad.especialistas }}</div>
                      </div>
                      <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                        <div class="text-xs font-medium text-slate-500 mb-1">Polivalentes</div>
                        <div class="text-2xl font-mono text-slate-700">{{ cuadrante.analisis_capacidad.polivalentes }}</div>
                      </div>
                    </div>
                    <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Habilitaciones AADD</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div
                        v-for="(count, act) in cuadrante.analisis_capacidad.actividades_habilitadas"
                        :key="act"
                        class="flex justify-between items-center bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg"
                      >
                        <span class="font-medium text-slate-600 truncate mr-2">{{ act }}</span>
                        <span
                          class="font-mono"
                          :class="count === 0 ? 'text-rose-600 font-bold' : count < 2 ? 'text-amber-600' : 'text-emerald-600'"
                        >{{ count }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                  <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-t-2xl">
                    <span class="material-icons text-slate-400 text-[18px]">schedule</span>
                    <h3 class="font-semibold text-slate-800">Horas por Empleado</h3>
                  </div>
                  <div class="p-0 flex-1 overflow-hidden flex flex-col">
                    <div class="overflow-y-auto max-h-[300px] p-5 space-y-3">
                      <div
                        v-for="(emp, i) in cuadrante.estadisticas.empleados"
                        :key="i"
                        class="flex items-center justify-between text-sm"
                      >
                        <div class="flex items-center gap-2 overflow-hidden mr-3">
                          <span class="font-medium text-slate-700 truncate">{{ emp.nombre }}</span>
                          <span
                            v-if="emp.es_especialista"
                            class="text-[10px] uppercase tracking-wider font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md flex-shrink-0"
                          >Esp</span>
                        </div>
                        <div class="flex items-center gap-3 flex-shrink-0">
                          <div class="font-mono text-right w-16" :class="emp.cumple_minimo ? 'text-emerald-600' : 'text-amber-600'">
                            {{ emp.horas_asignadas }}<span class="text-slate-400">/{{ emp.horas_contrato }}</span>
                          </div>
                          <div class="w-12 text-right">
                            <span class="text-xs font-mono font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">{{ emp.porcentaje_uso }}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Alerts: Errors, Warnings, Suggestions -->
              <div class="space-y-4 mb-8">
                <div v-if="cuadrante.errores?.length > 0" class="bg-rose-50/50 border border-rose-200 rounded-2xl p-5">
                  <div class="flex items-start gap-3">
                    <span class="material-icons text-rose-500 mt-0.5">error_outline</span>
                    <div class="flex-1">
                      <h3 class="font-semibold text-rose-900 mb-3">
                        Necesidades No Cubiertas ({{ cuadrante.errores.length }})
                      </h3>
                      <div class="bg-white/50 rounded-xl p-3 border border-rose-100 mb-3 grid grid-cols-3 gap-2">
                        <div class="text-center">
                          <div class="text-xs text-rose-600 mb-0.5 font-medium">AADD</div>
                          <div class="text-lg font-mono font-bold text-rose-700">{{ cuadrante.errores.filter(e => e.tipo === 'AADD').length }}</div>
                        </div>
                        <div class="text-center border-x border-rose-100">
                          <div class="text-xs text-rose-600 mb-0.5 font-medium">SALA</div>
                          <div class="text-lg font-mono font-bold text-rose-700">{{ cuadrante.errores.filter(e => e.tipo === 'SALA').length }}</div>
                        </div>
                        <div class="text-center">
                          <div class="text-xs text-rose-600 mb-0.5 font-medium">RECEPCIÓN</div>
                          <div class="text-lg font-mono font-bold text-rose-700">{{ cuadrante.errores.filter(e => e.tipo === 'RECEPCION').length }}</div>
                        </div>
                      </div>
                      <div class="space-y-2 max-h-48 overflow-y-auto pr-2">
                        <div v-for="(err, i) in cuadrante.errores" :key="i" class="bg-white border border-rose-100 rounded-lg p-2.5 text-sm">
                          <div class="font-medium text-slate-800 mb-0.5 flex justify-between">
                            <span>{{ err.tipo }} <span class="text-slate-500 mx-1">•</span> {{ err.actividad }}</span>
                            <span class="font-mono text-slate-500 text-xs">{{ err.dia }} {{ err.hora }}</span>
                          </div>
                          <div class="text-rose-600 text-xs">{{ err.razon }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="cuadrante.sugerencias?.length > 0" class="bg-amber-50/50 border border-amber-200 rounded-2xl p-5">
                  <div class="flex items-start gap-3">
                    <span class="material-icons text-amber-500 mt-0.5">lightbulb</span>
                    <div class="flex-1">
                      <h3 class="font-semibold text-amber-900 mb-3">Sugerencias Operativas</h3>
                      <div class="space-y-2">
                        <div v-for="(sug, i) in cuadrante.sugerencias" :key="i" class="bg-white border border-amber-100 rounded-lg p-3 text-sm flex gap-3">
                          <span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider h-fit mt-0.5"
                                :class="sug.tipo === 'CRITICO' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">
                            {{ sug.tipo }}
                          </span>
                          <div>
                            <div class="text-slate-700 mb-1">{{ sug.mensaje }}</div>
                            <div class="text-emerald-700 font-medium text-xs flex items-center gap-1">
                              <span class="material-icons text-[14px]">check</span> {{ sug.solucion }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="cuadrante.warnings?.length > 0" class="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div class="flex items-start gap-3">
                    <span class="material-icons text-slate-400 mt-0.5">info</span>
                    <div class="flex-1">
                      <h3 class="font-semibold text-slate-700 mb-2">Avisos ({{ cuadrante.warnings.length }})</h3>
                      <div class="space-y-1.5 text-sm text-slate-600 max-h-32 overflow-y-auto">
                        <div v-for="(warn, i) in cuadrante.warnings" :key="i" class="flex gap-2">
                          <span class="font-medium text-slate-800 shrink-0">{{ warn.empleado }}:</span>
                          <span>{{ warn.mensaje }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Day selector + grid -->
              <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 class="text-lg font-semibold text-slate-900">Vista Diaria</h3>
                    <p class="text-sm text-slate-500">Selecciona un día para visualizar la parrilla.</p>
                  </div>
                  <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
                    <button
                      v-for="dia in daysList"
                      :key="dia"
                      @click="selectedResultDay = dia"
                      :class="[
                        'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                        selectedResultDay === dia
                          ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      ]"
                    >{{ dayLabels[dia] }}</button>
                  </div>
                </div>

                <div v-if="selectedResultDay && cuadrante.rejillas[selectedResultDay]" class="overflow-x-auto rounded-xl border border-slate-200">
                  <ScheduleGrid :rejilla="cuadrante.rejillas[selectedResultDay]" />
                </div>
                
                <div class="mt-6 flex flex-wrap gap-3 items-center">
                  <button
                    v-if="selectedResultDay"
                    @click="handleExportGrid"
                    class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium border border-indigo-200/50"
                  >
                    <span class="material-icons text-[18px]">table_view</span>
                    Exportar día actual (HTML/Excel)
                  </button>
                  <button
                    @click="handleExportCSV"
                    class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
                  >
                    <span class="material-icons text-[18px]">download</span>
                    Exportar todas las asignaciones (CSV)
                  </button>
                </div>
              </div>

              <!-- Assignments table -->
              <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 class="font-semibold text-slate-800">
                    Lista Completa de Asignaciones <span class="ml-2 font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{{ cuadrante.asignaciones.length }}</span>
                  </h3>
                </div>
                <div class="overflow-x-auto max-h-96">
                  <table class="w-full text-sm text-left whitespace-nowrap">
                    <thead class="text-xs text-slate-500 uppercase bg-white sticky top-0 border-b border-slate-200 shadow-sm z-10">
                      <tr>
                        <th class="px-6 py-3 font-semibold">Día</th>
                        <th class="px-6 py-3 font-semibold">Empleado</th>
                        <th class="px-6 py-3 font-semibold">Horario</th>
                        <th class="px-6 py-3 font-semibold">Tipo</th>
                        <th class="px-6 py-3 font-semibold">Actividad</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr v-for="(a, i) in cuadrante.asignaciones" :key="i" class="hover:bg-slate-50/50 transition-colors group">
                        <td class="px-6 py-2.5 font-medium text-slate-900">{{ a.dia }}</td>
                        <td class="px-6 py-2.5 text-slate-700">{{ a.nombre }}</td>
                        <td class="px-6 py-2.5 font-mono text-slate-500 text-xs bg-slate-50 group-hover:bg-white">{{ a.inicio }} - {{ a.fin }}</td>
                        <td class="px-6 py-2.5">
                          <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                                :class="a.tipo_necesidad === 'AADD' ? 'bg-emerald-100 text-emerald-700' : a.tipo_necesidad === 'SALA' ? 'bg-slate-200 text-slate-700' : 'bg-sky-100 text-sky-700'">
                            {{ a.tipo_necesidad }}
                          </span>
                        </td>
                        <td class="px-6 py-2.5 text-slate-600">{{ a.actividad }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== HORARIO BASE TAB ==================== -->
      <div v-if="currentTab === 'horario-base'" class="animate-in fade-in duration-300">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div class="flex items-center gap-4">
              <div>
                <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Horario Base</h2>
                <p class="text-slate-500 mt-1">Visualización interactiva del cuadrante por días.</p>
              </div>
              <button
                v-if="cuadrante"
                @click="handleExportExcel"
                class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
              >
                <span class="material-icons text-lg">download</span>
                Descargar Excel
              </button>
            </div>
            <div class="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl overflow-x-auto w-full sm:w-auto">
              <button
                v-for="dia in daysList"
                :key="dia"
                @click="selectedGridDay = dia"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0',
                  selectedGridDay === dia
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                ]"
              >{{ dayLabels[dia] }}</button>
            </div>
          </div>

          <div v-if="cuadrante && cuadrante.rejillas[selectedGridDay]" class="animate-in fade-in">
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <ScheduleGrid :rejilla="cuadrante.rejillas[selectedGridDay]" />
            </div>
            
            <!-- Modern Legend -->
            <div class="mt-6 flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></div>
                <span class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Sala</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-sky-200 border border-sky-300"></div>
                <span class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Recepción</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-300"></div>
                <span class="text-xs font-semibold text-slate-600 uppercase tracking-wider">AADD</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-20 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <div class="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <span class="material-icons text-3xl text-slate-300">event_busy</span>
            </div>
            <h3 class="text-lg font-medium text-slate-900 mb-1">Sin Cuadrante</h3>
            <p class="text-slate-500">Ve a "Generar Cuadrante" para crear la planificación semanal.</p>
          </div>
        </div>
      </div>

      <!-- ==================== ESTADÍSTICAS TAB ==================== -->
      <div v-if="currentTab === 'estadisticas'" class="animate-in fade-in duration-300">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span class="material-icons text-indigo-500">bar_chart</span>
              Análisis y Estadísticas
            </h2>
            <p class="text-slate-500 mt-1">Métricas de rendimiento de la planificación.</p>
          </div>

          <div v-if="cuadrante">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Hours chart -->
              <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 col-span-1 lg:col-span-2">
                <h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-6">Horas Contratadas vs Asignadas</h3>
                <div class="w-full" style="height: 350px;">
                  <canvas ref="hoursChart"></canvas>
                </div>
              </div>

              <!-- Coverage by day -->
              <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-6">Asignaciones por Día</h3>
                <div class="w-full" style="height: 250px;">
                  <canvas ref="dayChart"></canvas>
                </div>
              </div>

              <!-- Activity distribution -->
              <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-6">Distribución por Tipo</h3>
                <div class="w-full flex justify-center" style="height: 250px;">
                  <canvas ref="typeChart"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-20 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <div class="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <span class="material-icons text-3xl text-slate-300">pie_chart_outline</span>
            </div>
            <h3 class="text-lg font-medium text-slate-900 mb-1">Sin Datos</h3>
            <p class="text-slate-500">Genera un cuadrante para visualizar las métricas.</p>
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
import { exportGridHTML, exportAssignmentsCSV, exportScheduleExcel, downloadSampleTablaA, downloadSampleTablaB } from './utils/export.js'
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

    async handleExportExcel() {
      if (this.cuadrante) {
        await exportScheduleExcel(this.cuadrante)
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
