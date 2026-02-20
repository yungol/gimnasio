<template>
  <div>
    <div class="mb-4">
      <label
        class="flex items-center gap-2 px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
      >
        <span class="material-icons text-blue-600">upload_file</span>
        <span class="text-blue-700 font-medium">{{ label }}</span>
        <input
          type="file"
          accept=".csv"
          class="hidden"
          @change="handleFile"
        />
      </label>
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

    <!-- Success + Preview -->
    <div v-if="parsedData && errors.length === 0">
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-icons text-green-600">check_circle</span>
            <span class="text-green-800 font-medium">
              {{ successLabel }} ({{ parsedData.data.length }} registros)
            </span>
          </div>
          <button
            @click="showPreview = !showPreview"
            class="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
          >
            <span class="material-icons text-sm">{{ showPreview ? 'visibility_off' : 'visibility' }}</span>
            {{ showPreview ? 'Ocultar' : 'Ver' }} Preview
          </button>
        </div>
      </div>

      <div v-if="showPreview" class="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-auto">
        <h3 class="font-semibold mb-2">Preview (primeras 10 filas)</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-xs border-collapse">
            <thead class="bg-gray-200">
              <tr>
                <th
                  v-for="(h, i) in parsedData.headers"
                  :key="i"
                  class="px-2 py-1 border text-left"
                >{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in parsedData.data.slice(0, 10)"
                :key="i"
                :class="i % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
              >
                <td
                  v-for="(h, j) in parsedData.headers"
                  :key="j"
                  class="px-2 py-1 border"
                >
                  <span
                    v-if="highlightField && h === highlightField && row[h]?.toUpperCase() === 'SI'"
                    class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs"
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
