/**
 * Schedule generation algorithm
 * Ported from shift-scheduler.tsx reference implementation
 */

import { timeToMinutes, DAYS } from './time-utils.js'

/**
 * Run the scheduling algorithm
 * @param {Object[]} demanda - Parsed Tabla A rows
 * @param {Object[]} plantilla - Parsed Tabla B rows
 * @param {Object} configObj - Configuration parameters
 * @returns {Object} Schedule result with rejillas, asignaciones, errores, warnings, estadisticas
 */
export function schedulerAlgorithm(demanda, plantilla, configObj) {
  const resultado = {
    rejillas: {},
    asignaciones: [],
    errores: [],
    warnings: [],
    estadisticas: {
      cobertura: { total_necesidades: 0, cubiertas: 0, porcentaje: 0 },
      empleados: []
    },
    analisis_capacidad: null,
    sugerencias: []
  }

  const MAX_HORAS_DIARIAS = parseFloat(configObj.max_horas_diarias) || 9
  const MIN_HORAS_DIARIAS_COMPLETA = parseFloat(configObj.min_horas_diarias_completa) || 6
  const HORAS_SEMANALES_MAX = parseFloat(configObj.horas_semanales_maximas) || 37

  // Build certifications map from Tabla B columns
  const requiredCols = [
    'empleado_id', 'nombre_mostrado', 'horas_semanales_contrato',
    'tipo_jornada', 'permite_turno_partido', 'puede_fin_de_semana',
    'solo_aadd', 'hora_no_disp_inicio', 'hora_no_disp_fin', 'max_aadd_semana'
  ]

  const habilMap = {}
  plantilla.forEach(row => {
    habilMap[row.empleado_id] = {}
    Object.keys(row).forEach(key => {
      if (!requiredCols.includes(key)) {
        habilMap[row.empleado_id][key.toUpperCase()] = row[key]?.toUpperCase() === 'SI'
      }
    })
  })

  // Initialize employee state
  const empleadoState = {}
  plantilla.forEach(emp => {
    const soloAaddRaw = emp.solo_aadd || ''
    const esEspecialista = soloAaddRaw.toString().trim().toUpperCase() === 'SI'

    empleadoState[emp.empleado_id] = {
      info: emp,
      horasSemanales: 0,
      aadd_count: 0,
      asignaciones: [],
      horasPorDia: {},
      esEspecialista
    }
    DAYS.forEach(dia => {
      empleadoState[emp.empleado_id].horasPorDia[dia] = []
    })
  })

  // --- Constraint checking helpers ---

  function checkOverlap(emp, dia, inicio, fin) {
    const inicioMin = timeToMinutes(inicio)
    const finMin = timeToMinutes(fin)

    return empleadoState[emp].horasPorDia[dia].some(asig => {
      const asigInicioMin = timeToMinutes(asig.inicio)
      const asigFinMin = timeToMinutes(asig.fin)
      return !(finMin <= asigInicioMin || inicioMin >= asigFinMin)
    })
  }

  function tieneDescansoMinimo(emp, dia, inicio, fin) {
    const DESCANSO_MINIMO = 15
    const inicioMin = timeToMinutes(inicio)
    const finMin = timeToMinutes(fin)

    return empleadoState[emp].horasPorDia[dia].every(asig => {
      const asigInicioMin = timeToMinutes(asig.inicio)
      const asigFinMin = timeToMinutes(asig.fin)

      if (finMin <= asigInicioMin) {
        return (asigInicioMin - finMin) >= DESCANSO_MINIMO
      }
      if (inicioMin >= asigFinMin) {
        return (inicioMin - asigFinMin) >= DESCANSO_MINIMO
      }
      return true
    })
  }

  function estaDisponible(emp, inicio, fin) {
    const empInfo = empleadoState[emp].info
    if (!empInfo.hora_no_disp_inicio || !empInfo.hora_no_disp_fin) return true

    const inicioMin = timeToMinutes(inicio)
    const finMin = timeToMinutes(fin)
    const noDispInicioMin = timeToMinutes(empInfo.hora_no_disp_inicio)
    const noDispFinMin = timeToMinutes(empInfo.hora_no_disp_fin)

    return finMin <= noDispInicioMin || inicioMin >= noDispFinMin
  }

  function creaTurnoPartido(emp, dia, inicio, fin) {
    const asignacionesDia = empleadoState[emp].horasPorDia[dia]
    if (asignacionesDia.length === 0) return false

    const inicioMin = timeToMinutes(inicio)
    const finMin = timeToMinutes(fin)

    const intervalos = [
      ...asignacionesDia.map(a => ({
        inicio: timeToMinutes(a.inicio),
        fin: timeToMinutes(a.fin)
      })),
      { inicio: inicioMin, fin: finMin }
    ]

    intervalos.sort((a, b) => a.inicio - b.inicio)

    for (let i = 0; i < intervalos.length - 1; i++) {
      const gap = intervalos[i + 1].inicio - intervalos[i].fin
      if (gap >= 90) return true
    }

    return false
  }

  function calcularPuntuacionContinuidad(emp, dia, inicio, fin) {
    const asignacionesDia = empleadoState[emp].horasPorDia[dia]
    if (asignacionesDia.length === 0) return 0

    const inicioMin = timeToMinutes(inicio)
    const finMin = timeToMinutes(fin)

    let minDistancia = Infinity

    asignacionesDia.forEach(asig => {
      const asigInicioMin = timeToMinutes(asig.inicio)
      const asigFinMin = timeToMinutes(asig.fin)

      const distanciaInicio = Math.abs(inicioMin - asigFinMin)
      const distanciaFin = Math.abs(finMin - asigInicioMin)

      minDistancia = Math.min(minDistancia, distanciaInicio, distanciaFin)
    })

    return minDistancia
  }

  // --- Sort demand by priority ---
  const prioridades = { 'AADD': 1, 'RECEPCION': 2, 'SALA': 3 }
  const demandaOrdenada = [...demanda].sort((a, b) => {
    const prioDiff = (prioridades[a.tipo_necesidad?.toUpperCase()] || 99) -
                     (prioridades[b.tipo_necesidad?.toUpperCase()] || 99)
    if (prioDiff !== 0) return prioDiff

    const diaDiff = DAYS.indexOf(a.dia?.toUpperCase()) - DAYS.indexOf(b.dia?.toUpperCase())
    if (diaDiff !== 0) return diaDiff

    return timeToMinutes(a.inicio) - timeToMinutes(b.inicio)
  })

  // Count total needs
  resultado.estadisticas.cobertura.total_necesidades = demandaOrdenada.reduce(
    (sum, nec) => sum + (parseInt(nec.personas_requeridas) || 1), 0
  )

  // --- Main assignment loop ---
  demandaOrdenada.forEach(necesidad => {
    const dia = necesidad.dia?.toUpperCase()
    const tipo = necesidad.tipo_necesidad?.toUpperCase()
    const actividad = necesidad.actividad?.toUpperCase() || ''
    const personas = parseInt(necesidad.personas_requeridas) || 1

    for (let p = 0; p < personas; p++) {
      const candidatos = plantilla.filter(emp => {
        const state = empleadoState[emp.empleado_id]

        // Specialist restriction
        if (state.esEspecialista && (tipo === 'SALA' || tipo === 'RECEPCION')) {
          return false
        }

        // Weekend availability
        if (['SABADO', 'DOMINGO'].includes(dia) && emp.puede_fin_de_semana?.toUpperCase() !== 'SI') {
          return false
        }

        // Time overlap
        if (checkOverlap(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
          return false
        }

        // Minimum rest
        if (!tieneDescansoMinimo(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
          return false
        }

        // Availability window
        if (!estaDisponible(emp.empleado_id, necesidad.inicio, necesidad.fin)) {
          return false
        }

        // Split shift
        if (emp.permite_turno_partido?.toUpperCase() === 'NO') {
          if (creaTurnoPartido(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
            return false
          }
        }

        // AADD certification
        if (tipo === 'AADD') {
          if (!habilMap[emp.empleado_id] || !habilMap[emp.empleado_id][actividad]) {
            return false
          }
          if (emp.max_aadd_semana && state.aadd_count >= parseInt(emp.max_aadd_semana)) {
            return false
          }
        }

        // Weekly hours limit
        const duracion = (timeToMinutes(necesidad.fin) - timeToMinutes(necesidad.inicio)) / 60
        if (state.horasSemanales + duracion > HORAS_SEMANALES_MAX + 0.25) {
          return false
        }

        // Daily hours limit
        const horasDia = state.horasPorDia[dia].reduce((sum, a) => {
          return sum + (timeToMinutes(a.fin) - timeToMinutes(a.inicio)) / 60
        }, 0)
        if (horasDia + duracion > MAX_HORAS_DIARIAS) {
          return false
        }

        return true
      })

      if (candidatos.length === 0) {
        // Detailed diagnostics
        const diagnostico = {
          total_empleados: plantilla.length,
          razones: {
            es_especialista_sala: 0,
            fin_semana: 0,
            solapamiento: 0,
            sin_descanso: 0,
            no_disponible: 0,
            turno_partido: 0,
            sin_habilitacion: 0,
            limite_aadd: 0,
            limite_horas_semanales: 0,
            limite_horas_diarias: 0
          }
        }

        plantilla.forEach(emp => {
          const state = empleadoState[emp.empleado_id]

          if (state.esEspecialista && (tipo === 'SALA' || tipo === 'RECEPCION')) {
            diagnostico.razones.es_especialista_sala++
            return
          }
          if (['SABADO', 'DOMINGO'].includes(dia) && emp.puede_fin_de_semana?.toUpperCase() !== 'SI') {
            diagnostico.razones.fin_semana++
            return
          }
          if (checkOverlap(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
            diagnostico.razones.solapamiento++
            return
          }
          if (!tieneDescansoMinimo(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
            diagnostico.razones.sin_descanso++
            return
          }
          if (!estaDisponible(emp.empleado_id, necesidad.inicio, necesidad.fin)) {
            diagnostico.razones.no_disponible++
            return
          }
          if (emp.permite_turno_partido?.toUpperCase() === 'NO' &&
              creaTurnoPartido(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
            diagnostico.razones.turno_partido++
            return
          }
          if (tipo === 'AADD') {
            if (!habilMap[emp.empleado_id] || !habilMap[emp.empleado_id][actividad]) {
              diagnostico.razones.sin_habilitacion++
              return
            }
            if (emp.max_aadd_semana && state.aadd_count >= parseInt(emp.max_aadd_semana)) {
              diagnostico.razones.limite_aadd++
              return
            }
          }
          const duracion = (timeToMinutes(necesidad.fin) - timeToMinutes(necesidad.inicio)) / 60
          if (state.horasSemanales + duracion > HORAS_SEMANALES_MAX + 0.25) {
            diagnostico.razones.limite_horas_semanales++
            return
          }
          const horasDia = state.horasPorDia[dia].reduce((sum, a) => {
            return sum + (timeToMinutes(a.fin) - timeToMinutes(a.inicio)) / 60
          }, 0)
          if (horasDia + duracion > MAX_HORAS_DIARIAS) {
            diagnostico.razones.limite_horas_diarias++
            return
          }
        })

        // Build detailed reason message
        let razonDetallada = 'No disponibles: '
        const razonesList = []

        if (diagnostico.razones.es_especialista_sala > 0)
          razonesList.push(`${diagnostico.razones.es_especialista_sala} son especialistas (solo AADD)`)
        if (diagnostico.razones.sin_habilitacion > 0)
          razonesList.push(`${diagnostico.razones.sin_habilitacion} sin habilitacion en ${actividad}`)
        if (diagnostico.razones.solapamiento > 0)
          razonesList.push(`${diagnostico.razones.solapamiento} ocupados`)
        if (diagnostico.razones.limite_horas_semanales > 0)
          razonesList.push(`${diagnostico.razones.limite_horas_semanales} limite horas semanales`)
        if (diagnostico.razones.limite_horas_diarias > 0)
          razonesList.push(`${diagnostico.razones.limite_horas_diarias} limite horas diarias`)
        if (diagnostico.razones.fin_semana > 0)
          razonesList.push(`${diagnostico.razones.fin_semana} no trabajan fines de semana`)
        if (diagnostico.razones.limite_aadd > 0)
          razonesList.push(`${diagnostico.razones.limite_aadd} limite AADD alcanzado`)
        if (diagnostico.razones.turno_partido > 0)
          razonesList.push(`${diagnostico.razones.turno_partido} crearia turno partido`)
        if (diagnostico.razones.sin_descanso > 0)
          razonesList.push(`${diagnostico.razones.sin_descanso} sin descanso minimo`)
        if (diagnostico.razones.no_disponible > 0)
          razonesList.push(`${diagnostico.razones.no_disponible} no disponibles (horario)`)

        razonDetallada += razonesList.join(', ') || 'ninguno cumple requisitos'

        resultado.errores.push({
          dia,
          hora: necesidad.inicio,
          tipo,
          actividad,
          razon: razonDetallada,
          diagnostico
        })
        continue
      }

      // Sort candidates
      candidatos.sort((a, b) => {
        const stateA = empleadoState[a.empleado_id]
        const stateB = empleadoState[b.empleado_id]

        const continuidadA = calcularPuntuacionContinuidad(a.empleado_id, dia, necesidad.inicio, necesidad.fin)
        const continuidadB = calcularPuntuacionContinuidad(b.empleado_id, dia, necesidad.inicio, necesidad.fin)

        if (continuidadA !== continuidadB) return continuidadA - continuidadB
        if (stateA.horasSemanales !== stateB.horasSemanales) return stateA.horasSemanales - stateB.horasSemanales
        if (stateA.aadd_count !== stateB.aadd_count) return stateA.aadd_count - stateB.aadd_count
        return a.empleado_id.localeCompare(b.empleado_id)
      })

      // Assign top candidate
      const seleccionado = candidatos[0]
      const duracion = (timeToMinutes(necesidad.fin) - timeToMinutes(necesidad.inicio)) / 60

      const asignacion = {
        dia,
        empleado_id: seleccionado.empleado_id,
        nombre: seleccionado.nombre_mostrado,
        inicio: necesidad.inicio,
        fin: necesidad.fin,
        tipo_necesidad: tipo,
        actividad: actividad || '',
        espacio: necesidad.espacio,
        es_relleno: false
      }

      empleadoState[seleccionado.empleado_id].horasSemanales += duracion
      empleadoState[seleccionado.empleado_id].horasPorDia[dia].push(asignacion)
      if (tipo === 'AADD') {
        empleadoState[seleccionado.empleado_id].aadd_count++
      }
      resultado.asignaciones.push(asignacion)
      resultado.estadisticas.cobertura.cubiertas++
    }
  })

  // --- Statistics ---
  resultado.estadisticas.cobertura.porcentaje = resultado.estadisticas.cobertura.total_necesidades > 0
    ? Math.round((resultado.estadisticas.cobertura.cubiertas / resultado.estadisticas.cobertura.total_necesidades) * 100)
    : 0

  // Capacity analysis
  resultado.analisis_capacidad = {
    total_empleados: plantilla.length,
    especialistas: plantilla.filter(e => e.solo_aadd?.toUpperCase() === 'SI').length,
    polivalentes: plantilla.filter(e => e.solo_aadd?.toUpperCase() !== 'SI').length,
    pueden_finde: plantilla.filter(e => e.puede_fin_de_semana?.toUpperCase() === 'SI').length,
    permiten_turno_partido: plantilla.filter(e => e.permite_turno_partido?.toUpperCase() === 'SI').length,
    actividades_habilitadas: {}
  }

  Object.keys(habilMap).forEach(empId => {
    Object.keys(habilMap[empId]).forEach(act => {
      if (habilMap[empId][act]) {
        if (!resultado.analisis_capacidad.actividades_habilitadas[act]) {
          resultado.analisis_capacidad.actividades_habilitadas[act] = 0
        }
        resultado.analisis_capacidad.actividades_habilitadas[act]++
      }
    })
  })

  // Suggestions based on errors
  const erroresPorTipo = {
    AADD: resultado.errores.filter(e => e.tipo === 'AADD'),
    SALA: resultado.errores.filter(e => e.tipo === 'SALA'),
    RECEPCION: resultado.errores.filter(e => e.tipo === 'RECEPCION')
  }

  if (erroresPorTipo.SALA.length > 0) {
    const especialistas = resultado.analisis_capacidad.especialistas
    const polivalentes = resultado.analisis_capacidad.polivalentes
    resultado.sugerencias.push({
      tipo: 'CRITICO',
      mensaje: `Hay ${erroresPorTipo.SALA.length} turnos de SALA sin cubrir. Tienes ${especialistas} especialistas que NO pueden hacer SALA (solo AADD) y ${polivalentes} polivalentes.`,
      solucion: polivalentes < 3
        ? 'SOLUCION: Necesitas mas empleados polivalentes (solo_aadd=NO) o cambiar algunos especialistas a polivalentes.'
        : 'SOLUCION: Los polivalentes estan sobrecargados. Aumenta las horas de contrato o contrata mas personal.'
    })
  }

  if (erroresPorTipo.AADD.length > 0) {
    const actividadesSinCubrir = {}
    erroresPorTipo.AADD.forEach(e => {
      if (!actividadesSinCubrir[e.actividad]) actividadesSinCubrir[e.actividad] = 0
      actividadesSinCubrir[e.actividad]++
    })

    Object.keys(actividadesSinCubrir).forEach(act => {
      const habilitados = resultado.analisis_capacidad.actividades_habilitadas[act] || 0
      resultado.sugerencias.push({
        tipo: 'AADD',
        mensaje: `${actividadesSinCubrir[act]} clases de ${act} sin cubrir. Empleados habilitados: ${habilitados}`,
        solucion: habilitados === 0
          ? `SOLUCION: NADIE tiene habilitacion en ${act}. Habilita empleados en la Tabla B.`
          : `SOLUCION: Los ${habilitados} empleados habilitados en ${act} estan ocupados o han alcanzado limites. Aumenta su disponibilidad o contrata mas instructores.`
      })
    })
  }

  if (erroresPorTipo.RECEPCION.length > 0) {
    resultado.sugerencias.push({
      tipo: 'RECEPCION',
      mensaje: `${erroresPorTipo.RECEPCION.length} turnos de RECEPCION sin cubrir.`,
      solucion: 'SOLUCION: Los empleados polivalentes estan sobrecargados. Revisa sus horarios o anade mas personal.'
    })
  }

  // Per-employee statistics
  plantilla.forEach(emp => {
    const state = empleadoState[emp.empleado_id]
    const horasContrato = parseFloat(emp.horas_semanales_contrato)
    const horasAsignadas = Math.round(state.horasSemanales * 100) / 100
    const porcentajeUso = horasContrato > 0 ? Math.round((horasAsignadas / horasContrato) * 100) : 0
    const cumpleMinimo = emp.tipo_jornada?.toUpperCase() === 'PARCIAL' || horasAsignadas >= MIN_HORAS_DIARIAS_COMPLETA

    resultado.estadisticas.empleados.push({
      empleado_id: emp.empleado_id,
      nombre: emp.nombre_mostrado,
      horas_contrato: horasContrato,
      horas_asignadas: horasAsignadas,
      porcentaje_uso: porcentajeUso,
      aadd_count: state.aadd_count,
      cumple_minimo: cumpleMinimo,
      es_especialista: state.esEspecialista
    })

    if (!cumpleMinimo && horasAsignadas > 0) {
      resultado.warnings.push({
        tipo: 'HORAS_INSUFICIENTES',
        empleado: emp.nombre_mostrado,
        mensaje: `Solo tiene ${horasAsignadas}h asignadas (contrato: ${horasContrato}h)`
      })
    }

    if (horasAsignadas === 0) {
      resultado.warnings.push({
        tipo: 'SIN_ASIGNACIONES',
        empleado: emp.nombre_mostrado,
        mensaje: 'No tiene ninguna asignacion en la semana'
      })
    }
  })

  // Generate time grids (rejillas)
  DAYS.forEach(dia => {
    const franjas = []
    for (let h = 6; h <= 23; h++) {
      franjas.push(`${h.toString().padStart(2, '0')}:00`)
      franjas.push(`${h.toString().padStart(2, '0')}:15`)
      franjas.push(`${h.toString().padStart(2, '0')}:30`)
      franjas.push(`${h.toString().padStart(2, '0')}:45`)
    }

    const rejilla = { dia, franjas, empleados: [] }

    plantilla.forEach(emp => {
      const fila = {
        nombre: emp.nombre_mostrado,
        celdas: franjas.map(franja => {
          const asig = empleadoState[emp.empleado_id].horasPorDia[dia].find(a => {
            const franjaMins = timeToMinutes(franja)
            const inicioMins = timeToMinutes(a.inicio)
            const finMins = timeToMinutes(a.fin)
            return franjaMins >= inicioMins && franjaMins < finMins
          })

          if (!asig) return ''
          if (asig.tipo_necesidad === 'SALA') return 'SALA'
          if (asig.tipo_necesidad === 'RECEPCION') return 'REC'
          return asig.actividad
        })
      }
      rejilla.empleados.push(fila)
    })

    resultado.rejillas[dia] = rejilla
  })

  return resultado
}
