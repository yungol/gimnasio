<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm relative">
    <table class="w-full text-xs text-left border-collapse">
      <thead class="text-slate-500 uppercase bg-slate-50 sticky top-0 z-20">
        <tr>
          <th class="px-4 py-3 sticky left-0 bg-slate-50 z-30 min-w-[160px] border-r border-b border-slate-200 font-semibold tracking-wider shadow-[1px_0_0_0_rgba(226,232,240,1)]">
            Empleado
          </th>
          <template v-for="(franja, idx) in rejilla.franjas" :key="idx">
            <th
              v-if="idx % 4 === 0"
              colspan="4"
              class="px-2 py-3 border-l border-b border-slate-200 text-center font-mono font-medium tracking-tight text-slate-400"
            >
              {{ Math.floor(idx / 4) + 6 }}:00
            </th>
          </template>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr
          v-for="(emp, empIdx) in rejilla.empleados"
          :key="empIdx"
          class="hover:bg-slate-50/50 transition-colors group"
        >
          <td
            class="px-4 py-2 font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200 min-w-[160px] text-sm bg-white group-hover:bg-slate-50 shadow-[1px_0_0_0_rgba(226,232,240,1)]"
          >
            {{ emp.nombre }}
          </td>
          <template v-for="(group, gIdx) in getConsecutiveGroups(emp.celdas)" :key="gIdx">
            <td
              v-if="group.value"
              :colspan="group.length"
              class="border-l border-slate-100 p-0.5"
            >
              <div 
                :class="[
                  'w-full h-full flex items-center justify-center rounded-md text-[10px] font-bold uppercase tracking-wider font-mono px-1 py-1.5 shadow-sm border',
                  getCellClass(group.value)
                ]"
                :title="`${group.value}`"
              >
                <span v-if="group.length >= 2" class="truncate">{{ group.value }}</span>
                <span v-else>{{ getAbbrev(group.value) }}</span>
              </div>
            </td>
            <td
              v-else
              :colspan="group.length"
              class="border-l border-slate-100"
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
      if (value === 'SALA') return 'bg-slate-100 text-slate-600 border-slate-200'
      if (value === 'REC') return 'bg-sky-50 text-sky-700 border-sky-100'
      if (value) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
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
