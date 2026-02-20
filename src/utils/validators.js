/**
 * Validation functions for Tabla A (demand) and Tabla B (employees)
 */

import { normalizeTime } from './csv-parser.js'

const VALID_DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']
const VALID_TYPES = ['AADD', 'SALA', 'RECEPCION']
const VALID_SPACES = ['GIMNASIO', 'RECEPCION', 'ESTUDIO_2', 'ESTUDIO_3', 'ESTUDIO_4', 'ZONA_CROSS']

/**
 * Validate Tabla A (demand) data
 * @param {{ headers: string[], data: Object[] }} parsedData
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateTablaA(parsedData) {
  const errors = []
  const requiredCols = [
    'dia', 'inicio', 'fin', 'tipo_necesidad',
    'actividad', 'espacio', 'personas_requeridas', 'permite_compartido'
  ]

  const missingCols = requiredCols.filter(col => !parsedData.headers.includes(col))
  if (missingCols.length > 0) {
    errors.push(`Faltan columnas: ${missingCols.join(', ')}`)
    return errors
  }

  parsedData.data.forEach((row, idx) => {
    if (!VALID_DAYS.includes(row.dia?.toUpperCase())) {
      errors.push(`Fila ${idx + 2}: dia invalido "${row.dia}"`)
    }

    row.inicio = normalizeTime(row.inicio)
    row.fin = normalizeTime(row.fin)

    if (!/^\d{1,2}:\d{2}$/.test(row.inicio)) {
      errors.push(`Fila ${idx + 2}: formato de inicio invalido "${row.inicio}"`)
    }
    if (!/^\d{1,2}:\d{2}$/.test(row.fin)) {
      errors.push(`Fila ${idx + 2}: formato de fin invalido "${row.fin}"`)
    }
    if (!VALID_TYPES.includes(row.tipo_necesidad?.toUpperCase())) {
      errors.push(`Fila ${idx + 2}: tipo_necesidad invalido "${row.tipo_necesidad}"`)
    }
    if (!VALID_SPACES.includes(row.espacio?.toUpperCase())) {
      errors.push(`Fila ${idx + 2}: espacio invalido "${row.espacio}"`)
    }
    if (isNaN(parseInt(row.personas_requeridas)) || parseInt(row.personas_requeridas) < 1) {
      errors.push(`Fila ${idx + 2}: personas_requeridas debe ser numero >= 1`)
    }
    if (row.tipo_necesidad?.toUpperCase() === 'AADD' && !row.actividad) {
      errors.push(`Fila ${idx + 2}: AADD requiere actividad`)
    }
  })

  return errors
}

/**
 * Validate Tabla B (employees + certifications) data
 * @param {{ headers: string[], data: Object[] }} parsedData
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateTablaB(parsedData) {
  const errors = []
  const requiredCols = [
    'empleado_id', 'nombre_mostrado', 'horas_semanales_contrato',
    'tipo_jornada', 'permite_turno_partido', 'puede_fin_de_semana',
    'solo_aadd', 'hora_no_disp_inicio', 'hora_no_disp_fin', 'max_aadd_semana'
  ]

  const missingCols = requiredCols.filter(col => !parsedData.headers.includes(col))
  if (missingCols.length > 0) {
    errors.push(`Faltan columnas obligatorias: ${missingCols.join(', ')}`)
    return errors
  }

  const activityCols = parsedData.headers.filter(h => !requiredCols.includes(h))
  if (activityCols.length === 0) {
    errors.push('Debe haber al menos una columna de actividad (PUMP, COMBAT, BALANCE, etc.)')
  }

  const ids = new Set()
  parsedData.data.forEach((row, idx) => {
    if (!row.empleado_id) {
      errors.push(`Fila ${idx + 2}: empleado_id vacio`)
    } else if (ids.has(row.empleado_id)) {
      errors.push(`Fila ${idx + 2}: empleado_id duplicado "${row.empleado_id}"`)
    } else {
      ids.add(row.empleado_id)
    }

    if (isNaN(parseFloat(row.horas_semanales_contrato))) {
      errors.push(`Fila ${idx + 2}: horas_semanales_contrato debe ser numerico`)
    }

    if (!['COMPLETA', 'PARCIAL'].includes(row.tipo_jornada?.toUpperCase())) {
      errors.push(`Fila ${idx + 2}: tipo_jornada debe ser COMPLETA o PARCIAL`)
    }

    for (const field of ['permite_turno_partido', 'puede_fin_de_semana', 'solo_aadd']) {
      if (!['SI', 'NO'].includes(row[field]?.toUpperCase())) {
        errors.push(`Fila ${idx + 2}: ${field} debe ser SI o NO`)
      }
    }

    activityCols.forEach(actCol => {
      const val = row[actCol]?.toUpperCase()
      if (val && !['SI', 'NO', ''].includes(val)) {
        errors.push(`Fila ${idx + 2}, columna ${actCol}: debe ser SI, NO o vacio`)
      }
    })
  })

  return errors
}

/**
 * Validate configuration object
 * @param {Object} config
 * @returns {string[]} Array of error messages
 */
export function validateConfig(config) {
  const errors = []

  if (isNaN(parseFloat(config.max_horas_diarias)) || parseFloat(config.max_horas_diarias) <= 0) {
    errors.push('Maximo horas diarias debe ser un numero positivo')
  }
  if (isNaN(parseFloat(config.min_horas_diarias_completa)) || parseFloat(config.min_horas_diarias_completa) <= 0) {
    errors.push('Minimo horas diarias debe ser un numero positivo')
  }
  if (!/^\d{1,2}:\d{2}$/.test(config.hora_punta_inicio)) {
    errors.push('Hora punta inicio debe tener formato HH:MM')
  }
  if (!/^\d{1,2}:\d{2}$/.test(config.hora_punta_fin)) {
    errors.push('Hora punta fin debe tener formato HH:MM')
  }

  return errors
}
