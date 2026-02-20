/**
 * Export functions for schedule data
 */

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
