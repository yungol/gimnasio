<template>
  <div class="w-full">
    <div class="mb-6 relative group">
      <label
        class="flex flex-col items-center justify-center gap-3 w-full py-10 px-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400 transition-all duration-300 group-hover:shadow-sm"
      >
        <div class="bg-white p-3 rounded-full shadow-sm border border-slate-200 text-indigo-500 group-hover:text-indigo-600 group-hover:scale-110 transition-transform duration-300">
          <span class="material-icons text-3xl">cloud_upload</span>
        </div>
        <div class="text-center">
          <span class="text-slate-700 font-medium text-lg block mb-1">{{ label }}</span>
          <span class="text-slate-500 text-sm">Soporta formato .csv (separado por comas o punto y coma)</span>
        </div>
        <input
          type="file"
          accept=".csv"
          class="hidden"
          @change="handleFile"
        />
      </label>
    </div>

    <!-- Validation errors -->
    <div v-if="errors.length > 0" class="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 mb-6 animate-in fade-in slide-in-from-top-2">
      <div class="flex items-start gap-3">
        <span class="material-icons text-rose-500 mt-0.5">error_outline</span>
        <div class="flex-1">
          <h3 class="font-semibold text-rose-900 mb-2 text-sm uppercase tracking-wider">Errores detectados en el archivo:</h3>
          <ul class="text-rose-700 text-sm space-y-1.5 max-h-48 overflow-y-auto pr-2">
            <li v-for="(err, i) in errors" :key="i" class="flex items-start gap-2 bg-white/50 px-3 py-2 rounded-lg border border-rose-100">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5"></span>
              <span class="leading-snug">{{ err }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Success + Preview -->
    <div v-if="parsedData && errors.length === 0" class="animate-in fade-in slide-in-from-top-2">
      <div class="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-4 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="bg-white p-1 rounded-full shadow-sm">
              <span class="material-icons text-emerald-500 text-[20px] block">check_circle</span>
            </div>
            <div>
              <div class="text-emerald-800 font-semibold">{{ successLabel }}</div>
              <div class="text-emerald-600/80 text-xs font-medium uppercase tracking-wider mt-0.5">
                <span class="font-mono">{{ parsedData.data.length }}</span> registros validados
              </div>
            </div>
          </div>
          <button
            @click="showPreview = !showPreview"
            class="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-white text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-sm w-full sm:w-auto"
          >
            <span class="material-icons text-[18px]">{{ showPreview ? 'visibility_off' : 'visibility' }}</span>
            {{ showPreview ? 'Ocultar previsualización' : 'Ver previsualización' }}
          </button>
        </div>
      </div>

      <div v-if="showPreview" class="bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 overflow-hidden animate-in fade-in">
        <div class="px-5 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 class="text-sm font-semibold text-slate-700">Muestra de datos (primeras 10 filas)</h3>
          <span class="text-xs text-slate-400 font-mono">{{ parsedData.headers.length }} columnas</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left whitespace-nowrap font-mono">
            <thead class="text-slate-500 bg-white border-b border-slate-200">
              <tr>
                <th
                  v-for="(h, i) in parsedData.headers"
                  :key="i"
                  class="px-4 py-2.5 font-semibold tracking-tight"
                >{{ h }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600">
              <tr
                v-for="(row, i) in parsedData.data.slice(0, 10)"
                :key="i"
                class="hover:bg-slate-50 transition-colors"
              >
                <td
                  v-for="(h, j) in parsedData.headers"
                  :key="j"
                  class="px-4 py-2"
                >
                  <span
                    v-if="highlightField && h === highlightField && row[h]?.toUpperCase() === 'SI'"
                    class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-semibold tracking-wider text-[10px] uppercase"
                  >{{ row[h] }}</span>
                  <span v-else>{{ row[h] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { parseCSV } from '../utils/csv-parser.js'

export default {
  name: 'FileUploader',
  props: {
    label: {
      type: String,
      default: 'Seleccionar archivo CSV'
    },
    successLabel: {
      type: String,
      default: 'Archivo validado correctamente'
    },
    validateFn: {
      type: Function,
      required: true
    },
    highlightField: {
      type: String,
      default: null
    }
  },
  emits: ['file-loaded'],
  data() {
    return {
      parsedData: null,
      errors: [],
      showPreview: false
    }
  },
  methods: {
    handleFile(event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        const parsed = parseCSV(text)

        const validationErrors = this.validateFn(parsed)

        if (validationErrors.length === 0) {
          this.parsedData = parsed
          this.errors = []
          this.showPreview = false
          this.$emit('file-loaded', parsed)
        } else {
          this.parsedData = null
          this.errors = validationErrors
          this.$emit('file-loaded', null)
        }
      }
      reader.readAsText(file)
    },
    reset() {
      this.parsedData = null
      this.errors = []
      this.showPreview = false
    }
  }
}
</script>
