<template>
  <div class="bg-white rounded-lg border border-gray-300 overflow-x-auto">
    <table class="text-xs border-collapse w-full">
      <thead class="bg-blue-600 text-white">
        <tr>
          <th class="px-2 py-2 sticky left-0 bg-blue-600 z-20 min-w-[140px] border-r-2 border-blue-700 text-left">
            Empleado
          </th>
          <template v-for="(franja, idx) in rejilla.franjas" :key="idx">
            <th
              v-if="idx % 4 === 0"
              colspan="4"
              class="px-2 py-1 border-l border-blue-500 text-center"
            >
              {{ Math.floor(idx / 4) + 6 }}h
            </th>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(emp, empIdx) in rejilla.empleados"
          :key="empIdx"
          :class="empIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'"
        >
          <td
            :class="[
              'px-2 py-2 font-medium sticky left-0 z-10 border-r-2 border-gray-300 min-w-[140px] text-sm',
              empIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
            ]"
          >
            {{ emp.nombre }}
          </td>
          <template v-for="(group, gIdx) in getConsecutiveGroups(emp.celdas)" :key="gIdx">
            <td
              v-if="group.value"
              :colspan="group.length"
              :class="[
                'border-l border-gray-200 text-center text-[10px] font-medium',
                getCellClass(group.value)
              ]"
              :title="`${group.value}`"
            >
              <span v-if="group.length >= 2">{{ group.value }}</span>
              <span v-else>{{ getAbbrev(group.value) }}</span>
            </td>
            <td
              v-else
              :colspan="group.length"
              class="border-l border-gray-200"
            ></td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'ScheduleGrid',
  props: {
    rejilla: {
      type: Object,
      required: true
    }
  },
  methods: {
    getConsecutiveGroups(celdas) {
      if (!celdas || celdas.length === 0) return []

      const groups = []
      let current = { value: celdas[0] || null, start: 0, length: 1 }

      for (let i = 1; i < celdas.length; i++) {
        const val = celdas[i] || null
        if (val === current.value) {
          current.length++
        } else {
          groups.push(current)
          current = { value: val, start: i, length: 1 }
        }
      }
      groups.push(current)
      return groups
    },
    getCellClass(value) {
      if (value === 'SALA') return 'bg-gray-300 text-gray-800'
      if (value === 'REC') return 'bg-blue-200 text-blue-800'
      if (value) return 'bg-green-200 text-green-800'
      return ''
    },
    getAbbrev(value) {
      if (!value) return ''
      if (value === 'SALA') return 'S'
      if (value === 'REC') return 'R'
      return value.substring(0, 2)
    }
  }
}
</script>
