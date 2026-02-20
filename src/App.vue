<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <span class="text-xl font-semibold text-gray-900">Gimnasio</span>
          </div>
          <div class="flex items-center space-x-2">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="currentTab = tab.id"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                currentTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Horario Base Tab -->
      <div v-if="currentTab === 'horario-base'">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <!-- Day Selector -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Horario Base</h2>
            <div class="flex gap-2">
              <button
                v-for="day in days"
                :key="day.value"
                @click="selectedDay = day.value"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedDay === day.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ day.label }}
              </button>
            </div>
          </div>

          <!-- Schedule Grid -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th class="sticky left-0 bg-gray-50 border border-r-2 border-b border-gray-300 p-2 text-left text-sm font-medium text-gray-600 min-w-[150px] z-20">
                    Empleado
                  </th>
                  <th 
                    v-for="hour in hours" 
                    :key="hour"
                    colspan="4"
                    class="border border-r border-b border-gray-200 p-1 text-center text-xs font-semibold text-gray-700 bg-gray-100"
                  >
                    {{ hour }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="employee in employees" :key="employee.id">
                  <td class="sticky left-0 bg-white border-r-2 border-b border-gray-200 p-2 text-sm font-medium text-gray-900 min-w-[150px] z-10">
                    {{ employee.name }}
                  </td>
                  <template v-for="(group, groupIndex) in getConsecutiveGroups(employee.schedule[selectedDay])" :key="groupIndex">
                    <td 
                      v-if="group.slot"
                      :colspan="group.length"
                      :class="[
                        'border-r border-b border-gray-200 p-0 text-center text-[10px]',
                        getSlotClass(group.slot)
                      ]"
                      :title="`${group.slot.activity} (${formatTime(group.start)} - ${formatTime(group.end)})`"
                    >
                      <span v-if="group.length >= 4" class="text-white text-xs font-medium">
                        {{ group.slot.activity }}
                      </span>
                      <span v-else class="text-white text-[9px] font-medium">
                        {{ getActivityAbbrev(group.slot.activity) }}
                      </span>
                    </td>
                    <td 
                      v-else
                      :colspan="group.length"
                      class="border-r border-b border-gray-200 bg-gray-50"
                    ></td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Legend -->
          <div class="mt-6 flex gap-6">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-blue-500 rounded"></div>
              <span class="text-sm text-gray-600">PUMP</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-500 rounded"></div>
              <span class="text-sm text-gray-600">CROSS</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-purple-500 rounded"></div>
              <span class="text-sm text-gray-600">LATIN</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Other tabs placeholder -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p class="text-gray-500">Sección "{{ currentTab }}" en construcción...</p>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      currentTab: 'horario-base',
      tabs: [
        { id: 'horario-base', label: 'Horario Base' },
        { id: 'configuracion', label: 'Configuración' },
        { id: 'generar', label: 'Generar Cuadrante' },
        { id: 'estadisticas', label: 'Estadísticas' }
      ],
      selectedDay: 'LUNES',
      days: [
        { value: 'LUNES', label: 'Lun' },
        { value: 'MARTES', label: 'Mar' },
        { value: 'MIERCOLES', label: 'Mié' },
        { value: 'JUEVES', label: 'Jue' },
        { value: 'VIERNES', label: 'Vie' },
        { value: 'SABADO', label: 'Sáb' },
        { value: 'DOMINGO', label: 'Dom' }
      ],
      hours: ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'],
      employees: [
        {
          id: 'EMP001',
          name: 'Juan García',
          schedule: {
            LUNES: this.generateSchedule([{ activity: 'CROSS', start: 0, end: 8 }, { activity: 'PUMP', start: 32, end: 40 }]),
            MARTES: this.generateSchedule([{ activity: 'LATIN', start: 16, end: 24 }]),
            MIERCOLES: this.generateSchedule([{ activity: 'CROSS', start: 0, end: 8 }, { activity: 'PUMP', start: 32, end: 40 }]),
            JUEVES: this.generateSchedule([{ activity: 'LATIN', start: 16, end: 24 }]),
            VIERNES: this.generateSchedule([{ activity: 'CROSS', start: 0, end: 8 }]),
            SABADO: this.generateSchedule([{ activity: 'PUMP', start: 40, end: 48 }]),
            DOMINGO: []
          }
        },
        {
          id: 'EMP002',
          name: 'María López',
          schedule: {
            LUNES: this.generateSchedule([{ activity: 'PUMP', start: 24, end: 32 }]),
            MARTES: this.generateSchedule([{ activity: 'CROSS', start: 8, end: 16 }, { activity: 'LATIN', start: 40, end: 48 }]),
            MIERCOLES: this.generateSchedule([{ activity: 'PUMP', start: 24, end: 32 }]),
            JUEVES: this.generateSchedule([{ activity: 'CROSS', start: 8, end: 16 }]),
            VIERNES: this.generateSchedule([{ activity: 'LATIN', start: 16, end: 24 }]),
            SABADO: this.generateSchedule([]),
            DOMINGO: []
          }
        },
        {
          id: 'EMP003',
          name: 'Carlos Ruiz',
          schedule: {
            LUNES: this.generateSchedule([{ activity: 'LATIN', start: 40, end: 48 }]),
            MARTES: this.generateSchedule([{ activity: 'PUMP', start: 24, end: 32 }]),
            MIERCOLES: this.generateSchedule([{ activity: 'LATIN', start: 40, end: 48 }]),
            JUEVES: this.generateSchedule([{ activity: 'PUMP', start: 24, end: 32 }]),
            VIERNES: this.generateSchedule([{ activity: 'CROSS', start: 32, end: 40 }]),
            SABADO: this.generateSchedule([{ activity: 'CROSS', start: 32, end: 40 }]),
            DOMINGO: this.generateSchedule([{ activity: 'LATIN', start: 40, end: 48 }])
          }
        },
        {
          id: 'EMP004',
          name: 'Ana Martínez',
          schedule: {
            LUNES: this.generateSchedule([{ activity: 'CROSS', start: 56, end: 64 }]),
            MARTES: this.generateSchedule([{ activity: 'LATIN', start: 56, end: 64 }]),
            MIERCOLES: this.generateSchedule([{ activity: 'CROSS', start: 56, end: 64 }]),
            JUEVES: this.generateSchedule([{ activity: 'LATIN', start: 56, end: 64 }]),
            VIERNES: this.generateSchedule([{ activity: 'PUMP', start: 56, end: 64 }]),
            SABADO: this.generateSchedule([{ activity: 'PUMP', start: 56, end: 64 }]),
            DOMINGO: []
          }
        }
      ]
    }
  },
  methods: {
    generateSchedule(assignments) {
      const schedule = new Array(68).fill(null)
      assignments.forEach(({ activity, start, end }) => {
        for (let i = start; i < end; i++) {
          schedule[i] = { activity }
        }
      })
      return schedule
    },
    getSlotClass(slot) {
      if (!slot) return 'bg-gray-50'
      const colors = {
        PUMP: 'bg-blue-500',
        CROSS: 'bg-green-500',
        LATIN: 'bg-purple-500'
      }
      return colors[slot.activity] || 'bg-gray-200'
    },
    getActivityAbbrev(activity) {
      const abbrevs = { PUMP: 'P', CROSS: 'C', LATIN: 'L' }
      return abbrevs[activity] || ''
    },
    formatTime(index) {
      const hour = Math.floor(index / 4) + 6
      const min = (index % 4) * 15
      return `${hour}:${min.toString().padStart(2, '0')}`
    },
    getConsecutiveGroups(schedule) {
      if (!schedule || schedule.length === 0) return []
      
      const groups = []
      let currentGroup = {
        slot: schedule[0],
        start: 0,
        end: 1,
        length: 1
      }
      
      for (let i = 1; i < schedule.length; i++) {
        const currentSlot = schedule[i]
        const prevSlot = currentGroup.slot
        
        if (currentSlot && prevSlot && currentSlot.activity === prevSlot.activity) {
          currentGroup.end = i + 1
          currentGroup.length++
        } else {
          groups.push(currentGroup)
          currentGroup = {
            slot: currentSlot,
            start: i,
            end: i + 1,
            length: 1
          }
        }
      }
      groups.push(currentGroup)
      return groups
    }
  }
}
</script>

<style scoped>
td {
  width: 24px;
  height: 32px;
}
</style>
