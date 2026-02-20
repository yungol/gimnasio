/**
 * Export functions for schedule data
 */
import { DAYS, DAY_LABELS } from './time-utils.js'

/**
 * Export a day's grid as styled HTML (opens in Excel with colors)
 * @param {Object} cuadrante - Full schedule result
 * @param {string} dia - Day to export
 */
export function exportGridHTML(cuadrante, dia) {
  const rejilla = cuadrante.rejillas[dia]
  if (!rejilla) return

  let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cuadrante ${dia}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h2 { color: #333; }
    table { border-collapse: collapse; font-size: 10pt; margin-top: 20px; }
    th, td { border: 1px solid #000; padding: 6px 10px; text-align: center; min-width: 50px; }
    th { background-color: #4472C4; color: white; font-weight: bold; }
    .header-col { background-color: #D9E1F2; font-weight: bold; text-align: left; min-width: 150px; }
    .direccion { background-color: #FFFF00; }
    .recepcion { background-color: #ADD8E6; }
    .sala { background-color: #D3D3D3; }
    .especialista { background-color: #90EE90; }
    .leyenda { margin-top: 30px; display: flex; gap: 20px; flex-wrap: wrap; }
    .leyenda-item { display: flex; align-items: center; gap: 8px; }
    .leyenda-color { width: 30px; height: 20px; border: 1px solid #000; }
  </style>
</head>
<body>
  <h2>Cuadrante ${dia}</h2>
  <p><strong>Fecha de generacion:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
  <table>
    <thead>
      <tr>
        <th class="header-col">Empleado</th>
        ${rejilla.franjas.map(f => `<th>${f}</th>`).join('')}
      </tr>
    </thead>
    <tbody>`

  rejilla.empleados.forEach(emp => {
    htmlContent += `<tr><td class="header-col">${emp.nombre}</td>`
    emp.celdas.forEach(celda => {
      let clase = ''
      if (celda === 'REC') clase = 'recepcion'
      else if (celda === 'SALA') clase = 'sala'
      else if (celda !== '') clase = 'especialista'
      htmlContent += `<td class="${clase}">${celda}</td>`
    })
    htmlContent += '</tr>'
  })

  htmlContent += `
    </tbody>
  </table>
  <div class="leyenda">
    <h3 style="width: 100%;">Leyenda de Colores:</h3>
    <div class="leyenda-item">
      <div class="leyenda-color" style="background-color: #ADD8E6;"></div>
      <span>Recepcion</span>
    </div>
    <div class="leyenda-item">
      <div class="leyenda-color" style="background-color: #D3D3D3;"></div>
      <span>Sala</span>
    </div>
    <div class="leyenda-item">
      <div class="leyenda-color" style="background-color: #90EE90;"></div>
      <span>Actividades Dirigidas (AADD)</span>
    </div>
  </div>
  <p style="margin-top: 30px; color: #666; font-size: 11pt;">
    <strong>Nota:</strong> Para importar en Excel: Archivo > Abrir > Seleccionar este archivo HTML.
    Excel lo convertira automaticamente manteniendo los colores.
  </p>
</body>
</html>`

  downloadFile(htmlContent, `cuadrante_${dia}_${dateStamp()}.html`, 'text/html;charset=utf-8')
}

/**
 * Export all assignments as CSV
 * @param {Object} cuadrante - Full schedule result
 */
export function exportAssignmentsCSV(cuadrante) {
  let csvContent = 'Dia,Empleado_ID,Nombre,Inicio,Fin,Tipo,Actividad,Espacio\n'
  cuadrante.asignaciones.forEach(a => {
    csvContent += `${a.dia},${a.empleado_id},${a.nombre},${a.inicio},${a.fin},${a.tipo_necesidad},${a.actividad || ''},${a.espacio || ''}\n`
  })

  downloadFile(csvContent, `asignaciones_${dateStamp()}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Generate and download sample Tabla A CSV
 */
export function downloadSampleTablaA() {
  const csv = `dia,inicio,fin,tipo_necesidad,actividad,espacio,personas_requeridas,permite_compartido
LUNES,6:00,9:00,SALA,,GIMNASIO,1,SI
LUNES,9:00,13:00,SALA,,GIMNASIO,2,NO
LUNES,17:00,21:00,SALA,,GIMNASIO,2,NO
LUNES,9:00,13:00,RECEPCION,,RECEPCION,1,NO
LUNES,17:00,21:00,RECEPCION,,RECEPCION,1,NO
LUNES,9:30,10:15,AADD,PUMP,ESTUDIO_2,1,NO
LUNES,10:30,11:15,AADD,YOGA,ESTUDIO_4,1,NO
LUNES,18:00,19:00,AADD,COMBAT,ESTUDIO_2,1,NO
MARTES,6:00,9:00,SALA,,GIMNASIO,1,SI
MARTES,9:00,13:00,SALA,,GIMNASIO,2,NO
MARTES,17:00,21:00,SALA,,GIMNASIO,2,NO
MARTES,9:00,13:00,RECEPCION,,RECEPCION,1,NO
MARTES,17:00,21:00,RECEPCION,,RECEPCION,1,NO
MARTES,10:00,11:00,AADD,CROSS,ZONA_CROSS,1,NO
MARTES,18:30,19:15,AADD,BALANCE,ESTUDIO_4,1,NO`

  downloadFile(csv, 'ejemplo_tabla_a_demanda.csv', 'text/csv;charset=utf-8;')
}

/**
 * Generate and download sample Tabla B CSV
 */
export function downloadSampleTablaB() {
  const csv = `empleado_id,nombre_mostrado,horas_semanales_contrato,tipo_jornada,permite_turno_partido,puede_fin_de_semana,solo_aadd,hora_no_disp_inicio,hora_no_disp_fin,max_aadd_semana,PUMP,COMBAT,BALANCE,YOGA,CROSS
E01,Ana Garcia,37.00,COMPLETA,SI,NO,NO,23:15,5:45,6,SI,SI,SI,SI,SI
E02,Carlos Lopez,37.00,COMPLETA,SI,NO,NO,23:15,5:45,,NO,NO,NO,NO,SI
E03,Maria Torres,19.00,PARCIAL,NO,SI,NO,23:15,5:45,,SI,NO,NO,SI,NO
E04,Pedro Ruiz,10.00,PARCIAL,NO,NO,SI,23:15,5:45,4,SI,SI,NO,NO,NO`

  downloadFile(csv, 'ejemplo_tabla_b_plantilla.csv', 'text/csv;charset=utf-8;')
}

/**
 * Export full schedule as styled Excel workbook with two sheets:
 *   Sheet 1 "Horario Base" - Visual grid matching the app view (one section per day)
 *   Sheet 2 "Base de Datos" - Flat database table with all assignments
 * @param {Object} cuadrante - Full schedule result
 */
export async function exportScheduleExcel(cuadrante) {
  if (!cuadrante || !cuadrante.rejillas) return

  const workbook = new window.ExcelJS.Workbook()
  workbook.creator = 'Gimnasio - Generador de Cuadrantes'
  workbook.created = new Date()

  buildVisualSheet(workbook, cuadrante)
  buildDatabaseSheet(workbook, cuadrante)

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `horario_base_${dateStamp()}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// --- Excel sheet builders ---

const FILL_SALA = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }
const FILL_REC = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } }
const FILL_AADD = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }
const FILL_HEADER = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
const FILL_EMP_COL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
const FILL_DAY_TITLE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } }

const BORDER_THIN = {
  top: { style: 'thin', color: { argb: 'FF999999' } },
  left: { style: 'thin', color: { argb: 'FF999999' } },
  bottom: { style: 'thin', color: { argb: 'FF999999' } },
  right: { style: 'thin', color: { argb: 'FF999999' } }
}

const FONT_HEADER = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9, name: 'Arial' }
const FONT_EMP = { bold: true, size: 9, name: 'Arial' }
const FONT_CELL = { size: 8, name: 'Arial' }
const FONT_DAY_TITLE = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Arial' }

/**
 * Build the visual grid sheet replicating the app's ScheduleGrid view.
 * Each day is rendered as a separate table section with a gap between them.
 */
function buildVisualSheet(workbook, cuadrante) {
  const ws = workbook.addWorksheet('Horario Base', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 0 }]
  })

  // Set narrow column widths for time slots
  ws.getColumn(1).width = 20 // Employee name column

  let currentRow = 1

  DAYS.forEach((dia, dayIndex) => {
    const rejilla = cuadrante.rejillas[dia]
    if (!rejilla) return

    const franjas = rejilla.franjas
    const empleados = rejilla.empleados

    // Ensure enough columns exist and set widths for time slots
    for (let c = 2; c <= franjas.length + 1; c++) {
      ws.getColumn(c).width = 5
    }

    // --- Day title row ---
    const titleRow = ws.getRow(currentRow)
    const titleCell = titleRow.getCell(1)
    titleCell.value = DAY_LABELS[dia] ? `${DAY_LABELS[dia].toUpperCase()} (${dia})` : dia
    titleCell.font = FONT_DAY_TITLE
    titleCell.fill = FILL_DAY_TITLE
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' }
    // Merge title across all columns
    ws.mergeCells(currentRow, 1, currentRow, franjas.length + 1)
    titleRow.height = 26
    currentRow++

    // --- Header row (hour labels) ---
    const headerRow = ws.getRow(currentRow)
    const empHeaderCell = headerRow.getCell(1)
    empHeaderCell.value = 'Empleado'
    empHeaderCell.fill = FILL_HEADER
    empHeaderCell.font = FONT_HEADER
    empHeaderCell.border = BORDER_THIN
    empHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Group by hours (every 4 slots = 1 hour)
    for (let i = 0; i < franjas.length; i += 4) {
      const hour = Math.floor(i / 4) + 6
      const startCol = i + 2
      const endCol = Math.min(i + 5, franjas.length + 1)

      // Merge 4 cells for each hour
      if (endCol > startCol) {
        ws.mergeCells(currentRow, startCol, currentRow, endCol)
      }
      const hCell = headerRow.getCell(startCol)
      hCell.value = `${hour}:00`
      hCell.fill = FILL_HEADER
      hCell.font = FONT_HEADER
      hCell.border = BORDER_THIN
      hCell.alignment = { horizontal: 'center', vertical: 'middle' }
    }
    headerRow.height = 22
    currentRow++

    // --- Employee rows ---
    empleados.forEach(emp => {
      const row = ws.getRow(currentRow)
      row.height = 20

      // Employee name cell
      const nameCell = row.getCell(1)
      nameCell.value = emp.nombre
      nameCell.fill = FILL_EMP_COL
      nameCell.font = FONT_EMP
      nameCell.border = BORDER_THIN
      nameCell.alignment = { horizontal: 'left', vertical: 'middle' }

      // Get consecutive groups for merging (same logic as ScheduleGrid.vue)
      const groups = getConsecutiveGroups(emp.celdas)
      let colOffset = 2

      groups.forEach(group => {
        const startCol = colOffset
        const endCol = colOffset + group.length - 1

        if (group.length > 1) {
          ws.mergeCells(currentRow, startCol, currentRow, endCol)
        }

        const cell = row.getCell(startCol)
        cell.border = BORDER_THIN
        cell.font = FONT_CELL
        cell.alignment = { horizontal: 'center', vertical: 'middle' }

        if (group.value) {
          cell.value = group.value
          if (group.value === 'SALA') {
            cell.fill = FILL_SALA
          } else if (group.value === 'REC') {
            cell.fill = FILL_REC
          } else {
            cell.fill = FILL_AADD
          }
        }

        // Apply border to all cells in group (merged cells lose individual borders)
        for (let c = startCol; c <= endCol; c++) {
          row.getCell(c).border = BORDER_THIN
        }

        colOffset += group.length
      })

      currentRow++
    })

    // --- Legend after last day only ---
    if (dayIndex === DAYS.length - 1) {
      currentRow++
      const legendTitleRow = ws.getRow(currentRow)
      legendTitleRow.getCell(1).value = 'Leyenda:'
      legendTitleRow.getCell(1).font = { bold: true, size: 10, name: 'Arial' }
      currentRow++

      const legendItems = [
        { label: 'Sala', fill: FILL_SALA },
        { label: 'Recepcion', fill: FILL_REC },
        { label: 'Actividades Dirigidas (AADD)', fill: FILL_AADD }
      ]

      legendItems.forEach(item => {
        const lRow = ws.getRow(currentRow)
        const colorCell = lRow.getCell(1)
        colorCell.fill = item.fill
        colorCell.border = BORDER_THIN
        const labelCell = lRow.getCell(2)
        labelCell.value = item.label
        labelCell.font = { size: 9, name: 'Arial' }
        ws.mergeCells(currentRow, 2, currentRow, 6)
        currentRow++
      })
    } else {
      // Add a blank row between days
      currentRow++
    }
  })
}

/**
 * Build a flat database-style sheet with all assignments.
 * Columns: Dia, Empleado_ID, Nombre, Inicio, Fin, Tipo, Actividad, Espacio
 */
function buildDatabaseSheet(workbook, cuadrante) {
  const ws = workbook.addWorksheet('Base de Datos', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  })

  const columns = [
    { header: 'Dia', key: 'dia', width: 14 },
    { header: 'Empleado ID', key: 'empleado_id', width: 14 },
    { header: 'Nombre', key: 'nombre', width: 22 },
    { header: 'Inicio', key: 'inicio', width: 10 },
    { header: 'Fin', key: 'fin', width: 10 },
    { header: 'Tipo', key: 'tipo', width: 14 },
    { header: 'Actividad', key: 'actividad', width: 18 },
    { header: 'Espacio', key: 'espacio', width: 16 }
  ]

  ws.columns = columns

  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = FILL_HEADER
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Arial' }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = BORDER_THIN
  })

  // Sort assignments by day order, then by start time, then by employee name
  const dayOrder = {}
  DAYS.forEach((d, i) => { dayOrder[d] = i })

  const sorted = [...cuadrante.asignaciones].sort((a, b) => {
    const dayDiff = (dayOrder[a.dia] || 0) - (dayOrder[b.dia] || 0)
    if (dayDiff !== 0) return dayDiff
    if (a.nombre < b.nombre) return -1
    if (a.nombre > b.nombre) return 1
    if (a.inicio < b.inicio) return -1
    if (a.inicio > b.inicio) return 1
    return 0
  })

  sorted.forEach(a => {
    const row = ws.addRow({
      dia: a.dia,
      empleado_id: a.empleado_id,
      nombre: a.nombre,
      inicio: a.inicio,
      fin: a.fin,
      tipo: a.tipo_necesidad,
      actividad: a.actividad || '',
      espacio: a.espacio || ''
    })

    // Apply type-based fill color
    row.eachCell((cell) => {
      cell.border = BORDER_THIN
      cell.font = { size: 9, name: 'Arial' }
      cell.alignment = { vertical: 'middle' }
    })

    // Color the type cell
    const tipoCell = row.getCell(6)
    if (a.tipo_necesidad === 'SALA') {
      tipoCell.fill = FILL_SALA
    } else if (a.tipo_necesidad === 'RECEPCION') {
      tipoCell.fill = FILL_REC
    } else if (a.tipo_necesidad === 'AADD') {
      tipoCell.fill = FILL_AADD
    }
  })

  // Add autofilter
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: sorted.length + 1, column: columns.length }
  }
}

/**
 * Get consecutive groups of identical cell values (mirrors ScheduleGrid.vue logic)
 * @param {string[]} celdas - Array of cell values
 * @returns {Array<{value: string|null, start: number, length: number}>}
 */
function getConsecutiveGroups(celdas) {
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
}

// --- Internal helpers ---

function dateStamp() {
  return new Date().toISOString().split('T')[0]
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
