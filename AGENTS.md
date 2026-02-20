# AGENTS.md - Gimnasio Project

## Project Overview

Self-contained HTML application for gym schedule management. Built with Vue 3 (Option API), Tailwind CSS, Material Icons, Chart.js, and Excel libraries.

## Tech Stack

- **Framework**: Vue 3 with Option API
- **Styling**: Tailwind CSS
- **Icons**: Material Icons (NO emojis)
- **Charts**: Chart.js
- **Excel**: Libraries for reading/creating Excel with styles (e.g., xlsx with styling)
- **Language**: Functions/code in English, UI text in Spanish

---

## Build & Development Commands

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Lint & Type Check
```bash
npm run lint
npm run typecheck
```

### Run Tests
```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:e2e          # E2E tests only
npm run test -- --watch   # Watch mode
```

### Run a Single Test
```bash
npm test -- --testNamePattern="test name"
# or with vitest
npm test -- -t "test name"
# or with jest
npm test -- -t "test name"
```

### Other Commands
```bash
npm run preview           # Preview production build
npm run build:css         # Build Tailwind CSS
```

---

## Code Style Guidelines

### General Principles

- **Language**: All code (functions, variables, comments) in English
- **UI Text**: All user-facing text in Spanish
- **Icons**: Use Material Icons only - NO emojis
- **Self-contained**: Output should be a single HTML file when possible

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `ScheduleGenerator.vue` |
| Props | camelCase | `employeeId`, `configData` |
| Methods | camelCase | `generateSchedule()`, `validateData()` |
| Events | kebab-case | `@schedule-updated`, `@error-occurred` |
| Variables | camelCase | `currentStep`, `tableData` |
| Constants | UPPER_SNAKE | `MAX_HOURS_DAILY`, `DEFAULT_CONFIG` |
| CSS Classes | kebab-case | `.schedule-grid`, `.btn-primary` |
| Files | kebab-case | `schedule-utils.js`, `excel-handler.ts` |

### Vue 3 Option API Structure

```vue
<template>
  <!-- Spanish text in UI -->
  <div class="schedule-container">
    <h1>Generador de Cuadrantes</h1>
  </div>
</template>

<script>
export default {
  name: 'ScheduleGenerator',
  
  // Props with type validation
  props: {
    configData: {
      type: Object,
      required: true,
      default: () => ({})
    },
    initialStep: {
      type: Number,
      default: 0
    }
  },

  // Reactive data
  data() {
    return {
      currentStep: 0,
      tableData: null,
      errors: []
    }
  },

  // Computed properties
  computed: {
    isValid() {
      return this.errors.length === 0
    },
    progressPercentage() {
      return (this.currentStep / 3) * 100
    }
  },

  // Methods - all in English
  methods: {
    validateConfig() {
      // Implementation in English
    },
    
    generateSchedule() {
      // Implementation in English
    },
    
    handleFileUpload(event) {
      // Implementation in English
    }
  },

  // Lifecycle hooks
  mounted() {
    this.initializeData()
  }
}
</script>

<style scoped>
.schedule-container {
  @apply p-4 bg-white rounded-lg;
}
</style>
```

### Import Order

1. Vue core imports
2. External libraries (Chart.js, xlsx, etc.)
3. Internal components
4. Utils/helpers
5. Types/interfaces (if using TypeScript)

```javascript
// 1. Vue core
import { ref, computed, onMounted } from 'vue'

// 2. External libraries
import Chart from 'chart.js/auto'
import * as XLSX from 'xlsx'
import 'material-icons/iconfont/material-icons.css'

// 3. Internal components
import ScheduleGrid from './components/ScheduleGrid.vue'
import DataUploader from './components/DataUploader.vue'

// 4. Utils/helpers
import { parseCSV, validateTime } from '@/utils/parsers'
import { generateSchedule } from '@/utils/scheduler'

// 5. Types
import type { Employee, ScheduleConfig } from '@/types'
```

### TypeScript Usage

- Use TypeScript for all new files
- Define interfaces for data structures
- Avoid `any` - use `unknown` when type is uncertain

```typescript
interface Employee {
  id: string
  name: string
  weeklyHours: number
  skills: string[]
}

interface ScheduleConfig {
  maxHoursDaily: number
  minHoursComplete: number
  restBetweenShifts: number
}

function generateSchedule(
  employees: Employee[],
  config: ScheduleConfig
): ScheduleResult {
  // Implementation
}
```

### Error Handling

- Use try/catch for async operations
- Display user-friendly error messages in Spanish
- Log detailed errors to console for debugging

```javascript
async function loadExcelFile(file) {
  try {
    const data = await readExcelFile(file)
    return data
  } catch (error) {
    console.error('Error loading Excel:', error)
    this.errors.push('Error al cargar el archivo. Verifique el formato.')
    throw error
  }
}
```

### Component Guidelines

- Keep components focused and single-purpose
- Use props for data input, events for output
- Emit events for parent communication
- Use provide/inject for deeply nested shared state

### Tailwind CSS

- Use Tailwind utility classes for styling
- Custom classes only when necessary
- Keep responsive design in mind

```vue
<div class="flex flex-col md:flex-row gap-4 p-4">
  <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Aceptar
  </button>
</div>
```

### File Organization

```
src/
├── components/
│   ├── ScheduleGrid.vue
│   ├── DataUploader.vue
│   └── ChartDisplay.vue
├── utils/
│   ├── parsers.js
│   ├── scheduler.js
│   └── excel-handler.js
├── types/
│   └── index.ts
├── assets/
│   └── styles/
├── App.vue
└── main.js
```

---

## Specific Guidelines for This Project

### CSV/Excel Handling

- Support both CSV and Excel formats
- Validate column headers on import
- Handle encoding issues (UTF-8 BOM)
- Support both comma and semicolon delimiters

### Schedule Algorithm

- Prioritize: AADD > RECEPCION > SALA
- Respect employee availability windows
- Minimize split shifts
- Balance hours across employees

### Chart.js Integration

- Use Chart.js for statistics visualization
- Spanish labels and tooltips
- Responsive charts
- Consistent color palette

### Excel Export

- Include styling (colors, borders)
- Support multiple sheets
- Proper column widths

### Material Icons Usage

```html
<!-- Correct -->
<span class="material-icons">schedule</span>
<button><i class="material-icons">download</i></button>

<!-- Incorrect - NO emojis -->
<button>📅</button>
```

---

## Testing Guidelines

- Write unit tests for utility functions
- Test CSV/Excel parsing edge cases
- Test schedule algorithm with various inputs
- Mock external dependencies

---

## Best Practices

1. **Performance**: Use `computed` for derived data, `watch` for side effects
2. **Accessibility**: Use semantic HTML, ARIA labels where needed
3. **i18n**: All visible text in Spanish, code in English
4. **Error Handling**: Graceful degradation with user-friendly messages
5. **Code Review**: Follow Vue 3 best practices and style guide
