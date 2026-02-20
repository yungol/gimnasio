import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle, XCircle, Download, AlertCircle, Eye, RefreshCw } from 'lucide-react';

const ShiftScheduler = () => {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    max_horas_diarias: '9',
    min_horas_diarias_completa: '6',
    descanso_entre_jornadas_horas: '12',
    descanso_jornada_continuada_minutos: '30',
    horas_semanales_maximas: '37',
    dias_descanso_semanal_consecutivos: '2',
    hora_punta_inicio: '18:00',
    hora_punta_fin: '21:30',
    min_personas_sala_punta: '2',
    max_personas_sala_punta: '3',
    min_personas_sala_valle: '1',
    max_personas_sala_valle: '2',
    min_personas_sala_finde: '1',
    max_personas_sala_finde: '2'
  });
  const [tablaA, setTablaA] = useState(null);
  const [tablaB, setTablaB] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [cuadrante, setCuadrante] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');

  const parseCSV = (text) => {
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };
    
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || '';
      });
      return obj;
    });
    return { headers, data };
  };

  const normalizeTime = (time) => {
    if (!time) return time;
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return time;
    const [, hours, minutes] = match;
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const validateConfig = () => {
    const errors = [];
    if (isNaN(parseFloat(config.max_horas_diarias)) || parseFloat(config.max_horas_diarias) <= 0) {
      errors.push('Máximo horas diarias debe ser un número positivo');
    }
    if (isNaN(parseFloat(config.min_horas_diarias_completa)) || parseFloat(config.min_horas_diarias_completa) <= 0) {
      errors.push('Mínimo horas diarias debe ser un número positivo');
    }
    if (!/^\d{1,2}:\d{2}$/.test(config.hora_punta_inicio)) {
      errors.push('Hora punta inicio debe tener formato HH:MM');
    }
    if (!/^\d{1,2}:\d{2}$/.test(config.hora_punta_fin)) {
      errors.push('Hora punta fin debe tener formato HH:MM');
    }
    return errors;
  };

  const handleConfigSubmit = () => {
    const errors = validateConfig();
    if (errors.length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
      setStep(1);
    }
  };

  const validateTablaA = (data) => {
    const errors = [];
    const requiredCols = ['dia', 'inicio', 'fin', 'tipo_necesidad', 'actividad', 'espacio', 'personas_requeridas', 'permite_compartido'];
    const validDias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const validTipos = ['AADD', 'SALA', 'RECEPCION'];
    const validEspacios = ['GIMNASIO', 'RECEPCION', 'ESTUDIO_2', 'ESTUDIO_3', 'ESTUDIO_4', 'ZONA_CROSS'];

    const missingCols = requiredCols.filter(col => !data.headers.includes(col));
    if (missingCols.length > 0) {
      errors.push(`Faltan columnas: ${missingCols.join(', ')}`);
      return errors;
    }

    data.data.forEach((row, idx) => {
      if (!validDias.includes(row.dia?.toUpperCase())) {
        errors.push(`Fila ${idx + 2}: día inválido "${row.dia}"`);
      }
      
      row.inicio = normalizeTime(row.inicio);
      row.fin = normalizeTime(row.fin);
      
      if (!/^\d{1,2}:\d{2}$/.test(row.inicio)) {
        errors.push(`Fila ${idx + 2}: formato de inicio inválido "${row.inicio}"`);
      }
      if (!/^\d{1,2}:\d{2}$/.test(row.fin)) {
        errors.push(`Fila ${idx + 2}: formato de fin inválido "${row.fin}"`);
      }
      if (!validTipos.includes(row.tipo_necesidad?.toUpperCase())) {
        errors.push(`Fila ${idx + 2}: tipo_necesidad inválido "${row.tipo_necesidad}"`);
      }
      if (!validEspacios.includes(row.espacio?.toUpperCase())) {
        errors.push(`Fila ${idx + 2}: espacio inválido "${row.espacio}"`);
      }
      if (isNaN(parseInt(row.personas_requeridas)) || parseInt(row.personas_requeridas) < 1) {
        errors.push(`Fila ${idx + 2}: personas_requeridas debe ser número >= 1`);
      }
      if (row.tipo_necesidad?.toUpperCase() === 'AADD' && !row.actividad) {
        errors.push(`Fila ${idx + 2}: AADD requiere actividad`);
      }
    });

    return errors;
  };

  const validateTablaB = (data) => {
    const errors = [];
    const requiredCols = ['empleado_id', 'nombre_mostrado', 'horas_semanales_contrato', 'tipo_jornada', 'permite_turno_partido', 'puede_fin_de_semana', 'solo_aadd', 'hora_no_disp_inicio', 'hora_no_disp_fin', 'max_aadd_semana'];

    const missingCols = requiredCols.filter(col => !data.headers.includes(col));
    if (missingCols.length > 0) {
      errors.push(`Faltan columnas obligatorias: ${missingCols.join(', ')}`);
      return errors;
    }

    const activityCols = data.headers.filter(h => !requiredCols.includes(h));
    if (activityCols.length === 0) {
      errors.push('Debe haber al menos una columna de actividad (PUMP, COMBAT, BALANCE, etc.)');
    }

    const ids = new Set();
    data.data.forEach((row, idx) => {
      if (!row.empleado_id) {
        errors.push(`Fila ${idx + 2}: empleado_id vacío`);
      } else if (ids.has(row.empleado_id)) {
        errors.push(`Fila ${idx + 2}: empleado_id duplicado "${row.empleado_id}"`);
      } else {
        ids.add(row.empleado_id);
      }

      if (isNaN(parseFloat(row.horas_semanales_contrato))) {
        errors.push(`Fila ${idx + 2}: horas_semanales_contrato debe ser numérico`);
      }

      if (!['COMPLETA', 'PARCIAL'].includes(row.tipo_jornada?.toUpperCase())) {
        errors.push(`Fila ${idx + 2}: tipo_jornada debe ser COMPLETA o PARCIAL`);
      }

      ['permite_turno_partido', 'puede_fin_de_semana', 'solo_aadd'].forEach(field => {
        if (!['SI', 'NO'].includes(row[field]?.toUpperCase())) {
          errors.push(`Fila ${idx + 2}: ${field} debe ser SI o NO`);
        }
      });

      activityCols.forEach(actCol => {
        const val = row[actCol]?.toUpperCase();
        if (val && !['SI', 'NO', ''].includes(val)) {
          errors.push(`Fila ${idx + 2}, columna ${actCol}: debe ser SI, NO o vacío`);
        }
      });
    });

    return errors;
  };

  const handleFileUpload = (e, tableType) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseCSV(text);
      
      let errors = [];
      if (tableType === 'A') {
        errors = validateTablaA(parsed);
        if (errors.length === 0) {
          setTablaA(parsed);
          setValidationErrors([]);
          setShowPreview(false);
        }
      } else if (tableType === 'B') {
        errors = validateTablaB(parsed);
        if (errors.length === 0) {
          setTablaB(parsed);
          setValidationErrors([]);
          setShowPreview(false);
        }
      }
      
      setValidationErrors(errors);
    };
    reader.readAsText(file);
  };

  const generarCuadrante = () => {
    setProcessing(true);
    setValidationErrors([]);
    
    setTimeout(() => {
      try {
        const requiredCols = ['empleado_id', 'nombre_mostrado', 'horas_semanales_contrato', 'tipo_jornada', 'permite_turno_partido', 'puede_fin_de_semana', 'solo_aadd', 'hora_no_disp_inicio', 'hora_no_disp_fin', 'max_aadd_semana'];
        const habilitaciones = tablaB.data.map(row => {
          const habil = { empleado_id: row.empleado_id, nombre_mostrado: row.nombre_mostrado };
          Object.keys(row).forEach(key => {
            if (!requiredCols.includes(key)) {
              habil[key] = row[key];
            }
          });
          return habil;
        });
        
        const result = schedulerAlgorithm(tablaA.data, tablaB.data, habilitaciones, config);
        setCuadrante(result);
        setStep(3);
        setSelectedDay('');
      } catch (error) {
        console.error('Error generando cuadrante:', error);
        setValidationErrors([`Error: ${error.message}`]);
        setProcessing(false);
      }
      setProcessing(false);
    }, 500);
  };

  const schedulerAlgorithm = (demanda, plantilla, habilitaciones, configObj) => {
    const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const resultado = {
      rejillas: {},
      asignaciones: [],
      errores: [],
      warnings: [],
      estadisticas: {
        cobertura: { total_necesidades: 0, cubiertas: 0, porcentaje: 0 },
        empleados: []
      }
    };

    const MAX_HORAS_DIARIAS = parseFloat(configObj.max_horas_diarias) || 9;
    const MIN_HORAS_DIARIAS_COMPLETA = parseFloat(configObj.min_horas_diarias_completa) || 6;
    const HORAS_SEMANALES_MAX = parseFloat(configObj.horas_semanales_maximas) || 37;

    // Transformar habilitaciones
    const habilMap = {};
    habilitaciones.forEach(row => {
      habilMap[row.empleado_id] = {};
      Object.keys(row).forEach(key => {
        if (key !== 'empleado_id' && key !== 'nombre_mostrado') {
          habilMap[row.empleado_id][key.toUpperCase()] = row[key]?.toUpperCase() === 'SI';
        }
      });
    });

    // Estado de empleados
    const empleadoState = {};
    plantilla.forEach(emp => {
      const soloAaddRaw = emp.solo_aadd || '';
      const esEspecialista = soloAaddRaw.toString().trim().toUpperCase() === 'SI';
      
      empleadoState[emp.empleado_id] = {
        info: emp,
        horasSemanales: 0,
        aadd_count: 0,
        asignaciones: [],
        horasPorDia: {},
        esEspecialista: esEspecialista
      };
      dias.forEach(dia => {
        empleadoState[emp.empleado_id].horasPorDia[dia] = [];
      });
    });

    const timeToMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const checkOverlap = (emp, dia, inicio, fin) => {
      const inicioMin = timeToMinutes(inicio);
      const finMin = timeToMinutes(fin);
      
      return empleadoState[emp].horasPorDia[dia].some(asig => {
        const asigInicioMin = timeToMinutes(asig.inicio);
        const asigFinMin = timeToMinutes(asig.fin);
        return !(finMin <= asigInicioMin || inicioMin >= asigFinMin);
      });
    };

    const tieneDescansoMinimo = (emp, dia, inicio, fin) => {
      const DESCANSO_MINIMO = 15;
      const inicioMin = timeToMinutes(inicio);
      const finMin = timeToMinutes(fin);
      
      return empleadoState[emp].horasPorDia[dia].every(asig => {
        const asigInicioMin = timeToMinutes(asig.inicio);
        const asigFinMin = timeToMinutes(asig.fin);
        
        if (finMin <= asigInicioMin) {
          return (asigInicioMin - finMin) >= DESCANSO_MINIMO;
        }
        
        if (inicioMin >= asigFinMin) {
          return (inicioMin - asigFinMin) >= DESCANSO_MINIMO;
        }
        
        return true;
      });
    };

    // MEJORA: Verificar disponibilidad horaria del empleado
    const estaDisponible = (emp, inicio, fin) => {
      const empInfo = empleadoState[emp].info;
      if (!empInfo.hora_no_disp_inicio || !empInfo.hora_no_disp_fin) return true;
      
      const inicioMin = timeToMinutes(inicio);
      const finMin = timeToMinutes(fin);
      const noDispInicioMin = timeToMinutes(empInfo.hora_no_disp_inicio);
      const noDispFinMin = timeToMinutes(empInfo.hora_no_disp_fin);
      
      // Verificar que no haya solapamiento con horario no disponible
      return finMin <= noDispInicioMin || inicioMin >= noDispFinMin;
    };

    const creaTurnoPartido = (emp, dia, inicio, fin) => {
      const asignacionesDia = empleadoState[emp].horasPorDia[dia];
      if (asignacionesDia.length === 0) return false;

      const inicioMin = timeToMinutes(inicio);
      const finMin = timeToMinutes(fin);

      const intervalos = [...asignacionesDia.map(a => ({
        inicio: timeToMinutes(a.inicio),
        fin: timeToMinutes(a.fin)
      })), { inicio: inicioMin, fin: finMin }];

      intervalos.sort((a, b) => a.inicio - b.inicio);

      for (let i = 0; i < intervalos.length - 1; i++) {
        const gap = intervalos[i + 1].inicio - intervalos[i].fin;
        if (gap >= 90) return true;
      }

      return false;
    };

    const calcularPuntuacionContinuidad = (emp, dia, inicio, fin) => {
      const asignacionesDia = empleadoState[emp].horasPorDia[dia];
      if (asignacionesDia.length === 0) return 0;

      const inicioMin = timeToMinutes(inicio);
      const finMin = timeToMinutes(fin);

      let minDistancia = Infinity;
      
      asignacionesDia.forEach(asig => {
        const asigInicioMin = timeToMinutes(asig.inicio);
        const asigFinMin = timeToMinutes(asig.fin);
        
        const distanciaInicio = Math.abs(inicioMin - asigFinMin);
        const distanciaFin = Math.abs(finMin - asigInicioMin);
        
        minDistancia = Math.min(minDistancia, distanciaInicio, distanciaFin);
      });

      return minDistancia;
    };

    // Ordenar demanda
    const prioridades = { 'AADD': 1, 'RECEPCION': 2, 'SALA': 3 };
    const demandaOrdenada = [...demanda].sort((a, b) => {
      const prioDiff = prioridades[a.tipo_necesidad?.toUpperCase()] - prioridades[b.tipo_necesidad?.toUpperCase()];
      if (prioDiff !== 0) return prioDiff;
      
      const diaDiff = dias.indexOf(a.dia?.toUpperCase()) - dias.indexOf(b.dia?.toUpperCase());
      if (diaDiff !== 0) return diaDiff;
      
      return timeToMinutes(a.inicio) - timeToMinutes(b.inicio);
    });

    // Contar total de necesidades para estadísticas
    resultado.estadisticas.cobertura.total_necesidades = demandaOrdenada.reduce((sum, nec) => 
      sum + (parseInt(nec.personas_requeridas) || 1), 0
    );

    // Asignar cada necesidad
    demandaOrdenada.forEach(necesidad => {
      const dia = necesidad.dia?.toUpperCase();
      const tipo = necesidad.tipo_necesidad?.toUpperCase();
      const actividad = necesidad.actividad?.toUpperCase();
      const personas = parseInt(necesidad.personas_requeridas) || 1;

      for (let p = 0; p < personas; p++) {
        const candidatos = plantilla.filter(emp => {
          const state = empleadoState[emp.empleado_id];
          
          // CORRECCIÓN CRÍTICA: Verificar si es especialista y el tipo de necesidad
          if (state.esEspecialista && (tipo === 'SALA' || tipo === 'RECEPCION')) {
            return false;
          }

          if (['SABADO', 'DOMINGO'].includes(dia) && emp.puede_fin_de_semana?.toUpperCase() !== 'SI') {
            return false;
          }

          if (checkOverlap(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
            return false;
          }

          if (!tieneDescansoMinimo(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
            return false;
          }

          // MEJORA: Verificar disponibilidad horaria
          if (!estaDisponible(emp.empleado_id, necesidad.inicio, necesidad.fin)) {
            return false;
          }

          if (emp.permite_turno_partido?.toUpperCase() === 'NO') {
            if (creaTurnoPartido(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
              return false;
            }
          }

          if (tipo === 'AADD') {
            if (!habilMap[emp.empleado_id] || !habilMap[emp.empleado_id][actividad]) {
              return false;
            }
            if (emp.max_aadd_semana && state.aadd_count >= parseInt(emp.max_aadd_semana)) {
              return false;
            }
          }

          const duracion = (timeToMinutes(necesidad.fin) - timeToMinutes(necesidad.inicio)) / 60;
          if (state.horasSemanales + duracion > HORAS_SEMANALES_MAX + 0.25) {
            return false;
          }

          const horasDia = state.horasPorDia[dia].reduce((sum, a) => {
            return sum + (timeToMinutes(a.fin) - timeToMinutes(a.inicio)) / 60;
          }, 0);
          if (horasDia + duracion > MAX_HORAS_DIARIAS) {
            return false;
          }

          return true;
        });

        if (candidatos.length === 0) {
          // DIAGNÓSTICO DETALLADO: Analizar por qué no hay candidatos
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
          };

          plantilla.forEach(emp => {
            const state = empleadoState[emp.empleado_id];
            
            // Verificar cada restricción
            if (state.esEspecialista && (tipo === 'SALA' || tipo === 'RECEPCION')) {
              diagnostico.razones.es_especialista_sala++;
              return;
            }
            
            if (['SABADO', 'DOMINGO'].includes(dia) && emp.puede_fin_de_semana?.toUpperCase() !== 'SI') {
              diagnostico.razones.fin_semana++;
              return;
            }
            
            if (checkOverlap(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
              diagnostico.razones.solapamiento++;
              return;
            }
            
            if (!tieneDescansoMinimo(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
              diagnostico.razones.sin_descanso++;
              return;
            }
            
            if (!estaDisponible(emp.empleado_id, necesidad.inicio, necesidad.fin)) {
              diagnostico.razones.no_disponible++;
              return;
            }
            
            if (emp.permite_turno_partido?.toUpperCase() === 'NO' && 
                creaTurnoPartido(emp.empleado_id, dia, necesidad.inicio, necesidad.fin)) {
              diagnostico.razones.turno_partido++;
              return;
            }
            
            if (tipo === 'AADD') {
              if (!habilMap[emp.empleado_id] || !habilMap[emp.empleado_id][actividad]) {
                diagnostico.razones.sin_habilitacion++;
                return;
              }
              if (emp.max_aadd_semana && state.aadd_count >= parseInt(emp.max_aadd_semana)) {
                diagnostico.razones.limite_aadd++;
                return;
              }
            }
            
            const duracion = (timeToMinutes(necesidad.fin) - timeToMinutes(necesidad.inicio)) / 60;
            if (state.horasSemanales + duracion > HORAS_SEMANALES_MAX + 0.25) {
              diagnostico.razones.limite_horas_semanales++;
              return;
            }
            
            const horasDia = state.horasPorDia[dia].reduce((sum, a) => {
              return sum + (timeToMinutes(a.fin) - timeToMinutes(a.inicio)) / 60;
            }, 0);
            if (horasDia + duracion > MAX_HORAS_DIARIAS) {
              diagnostico.razones.limite_horas_diarias++;
              return;
            }
          });

          // Construir mensaje detallado
          let razonDetallada = 'No disponibles: ';
          const razonesList = [];
          
          if (diagnostico.razones.es_especialista_sala > 0) {
            razonesList.push(`${diagnostico.razones.es_especialista_sala} son especialistas (solo AADD)`);
          }
          if (diagnostico.razones.sin_habilitacion > 0) {
            razonesList.push(`${diagnostico.razones.sin_habilitacion} sin habilitación en ${actividad}`);
          }
          if (diagnostico.razones.solapamiento > 0) {
            razonesList.push(`${diagnostico.razones.solapamiento} ocupados`);
          }
          if (diagnostico.razones.limite_horas_semanales > 0) {
            razonesList.push(`${diagnostico.razones.limite_horas_semanales} límite horas semanales`);
          }
          if (diagnostico.razones.limite_horas_diarias > 0) {
            razonesList.push(`${diagnostico.razones.limite_horas_diarias} límite horas diarias`);
          }
          if (diagnostico.razones.fin_semana > 0) {
            razonesList.push(`${diagnostico.razones.fin_semana} no trabajan fines de semana`);
          }
          if (diagnostico.razones.limite_aadd > 0) {
            razonesList.push(`${diagnostico.razones.limite_aadd} límite AADD alcanzado`);
          }
          if (diagnostico.razones.turno_partido > 0) {
            razonesList.push(`${diagnostico.razones.turno_partido} crearía turno partido`);
          }
          if (diagnostico.razones.sin_descanso > 0) {
            razonesList.push(`${diagnostico.razones.sin_descanso} sin descanso mínimo`);
          }
          if (diagnostico.razones.no_disponible > 0) {
            razonesList.push(`${diagnostico.razones.no_disponible} no disponibles (horario)`);
          }

          razonDetallada += razonesList.join(', ') || 'ninguno cumple requisitos';

          resultado.errores.push({
            dia,
            hora: necesidad.inicio,
            tipo,
            actividad,
            razon: razonDetallada,
            diagnostico: diagnostico
          });
          continue;
        }

        candidatos.sort((a, b) => {
          const stateA = empleadoState[a.empleado_id];
          const stateB = empleadoState[b.empleado_id];
          
          const continuidadA = calcularPuntuacionContinuidad(a.empleado_id, dia, necesidad.inicio, necesidad.fin);
          const continuidadB = calcularPuntuacionContinuidad(b.empleado_id, dia, necesidad.inicio, necesidad.fin);
          
          if (continuidadA !== continuidadB) {
            return continuidadA - continuidadB;
          }
          
          if (stateA.horasSemanales !== stateB.horasSemanales) {
            return stateA.horasSemanales - stateB.horasSemanales;
          }
          
          if (stateA.aadd_count !== stateB.aadd_count) {
            return stateA.aadd_count - stateB.aadd_count;
          }
          
          return a.empleado_id.localeCompare(b.empleado_id);
        });

        const seleccionado = candidatos[0];
        const duracion = (timeToMinutes(necesidad.fin) - timeToMinutes(necesidad.inicio)) / 60;

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
        };

        empleadoState[seleccionado.empleado_id].horasSemanales += duracion;
        empleadoState[seleccionado.empleado_id].horasPorDia[dia].push(asignacion);
        if (tipo === 'AADD') {
          empleadoState[seleccionado.empleado_id].aadd_count++;
        }
        resultado.asignaciones.push(asignacion);
        resultado.estadisticas.cobertura.cubiertas++;
      }
    });

    // MEJORA: Generar estadísticas completas
    resultado.estadisticas.cobertura.porcentaje = Math.round(
      (resultado.estadisticas.cobertura.cubiertas / resultado.estadisticas.cobertura.total_necesidades) * 100
    );

    // NUEVO: Análisis de capacidad de la plantilla
    resultado.analisis_capacidad = {
      total_empleados: plantilla.length,
      especialistas: plantilla.filter(e => e.solo_aadd?.toUpperCase() === 'SI').length,
      polivalentes: plantilla.filter(e => e.solo_aadd?.toUpperCase() !== 'SI').length,
      pueden_finde: plantilla.filter(e => e.puede_fin_de_semana?.toUpperCase() === 'SI').length,
      permiten_turno_partido: plantilla.filter(e => e.permite_turno_partido?.toUpperCase() === 'SI').length,
      actividades_habilitadas: {}
    };

    // Contar habilitaciones por actividad
    Object.keys(habilMap).forEach(empId => {
      Object.keys(habilMap[empId]).forEach(act => {
        if (habilMap[empId][act]) {
          if (!resultado.analisis_capacidad.actividades_habilitadas[act]) {
            resultado.analisis_capacidad.actividades_habilitadas[act] = 0;
          }
          resultado.analisis_capacidad.actividades_habilitadas[act]++;
        }
      });
    });

    // NUEVO: Generar sugerencias basadas en errores
    resultado.sugerencias = [];
    
    const erroresPorTipo = {
      AADD: resultado.errores.filter(e => e.tipo === 'AADD'),
      SALA: resultado.errores.filter(e => e.tipo === 'SALA'),
      RECEPCION: resultado.errores.filter(e => e.tipo === 'RECEPCION')
    };

    if (erroresPorTipo.SALA.length > 0) {
      const especialistas = resultado.analisis_capacidad.especialistas;
      const polivalentes = resultado.analisis_capacidad.polivalentes;
      resultado.sugerencias.push({
        tipo: 'CRITICO',
        mensaje: `Hay ${erroresPorTipo.SALA.length} turnos de SALA sin cubrir. Tienes ${especialistas} especialistas que NO pueden hacer SALA (solo AADD) y ${polivalentes} polivalentes.`,
        solucion: polivalentes < 3 ? 
          'SOLUCIÓN: Necesitas más empleados polivalentes (solo_aadd=NO) o cambiar algunos especialistas a polivalentes.' :
          'SOLUCIÓN: Los polivalentes están sobrecargados. Aumenta las horas de contrato o contrata más personal.'
      });
    }

    if (erroresPorTipo.AADD.length > 0) {
      const actividadesSinCubrir = {};
      erroresPorTipo.AADD.forEach(e => {
        if (!actividadesSinCubrir[e.actividad]) {
          actividadesSinCubrir[e.actividad] = 0;
        }
        actividadesSinCubrir[e.actividad]++;
      });

      Object.keys(actividadesSinCubrir).forEach(act => {
        const habilitados = resultado.analisis_capacidad.actividades_habilitadas[act] || 0;
        resultado.sugerencias.push({
          tipo: 'AADD',
          mensaje: `${actividadesSinCubrir[act]} clases de ${act} sin cubrir. Empleados habilitados: ${habilitados}`,
          solucion: habilitados === 0 ? 
            `SOLUCIÓN: NADIE tiene habilitación en ${act}. Habilita empleados en la Tabla B.` :
            `SOLUCIÓN: Los ${habilitados} empleados habilitados en ${act} están ocupados o han alcanzado límites. Aumenta su disponibilidad o contrata más instructores.`
        });
      });
    }

    if (erroresPorTipo.RECEPCION.length > 0) {
      resultado.sugerencias.push({
        tipo: 'RECEPCION',
        mensaje: `${erroresPorTipo.RECEPCION.length} turnos de RECEPCION sin cubrir.`,
        solucion: 'SOLUCIÓN: Los empleados polivalentes están sobrecargados. Revisa sus horarios o añade más personal.'
      });
    }

    plantilla.forEach(emp => {
      const state = empleadoState[emp.empleado_id];
      const horasContrato = parseFloat(emp.horas_semanales_contrato);
      const horasAsignadas = Math.round(state.horasSemanales * 100) / 100;
      const porcentajeUso = Math.round((horasAsignadas / horasContrato) * 100);
      const cumpleMinimo = emp.tipo_jornada?.toUpperCase() === 'PARCIAL' || horasAsignadas >= MIN_HORAS_DIARIAS_COMPLETA;

      resultado.estadisticas.empleados.push({
        empleado_id: emp.empleado_id,
        nombre: emp.nombre_mostrado,
        horas_contrato: horasContrato,
        horas_asignadas: horasAsignadas,
        porcentaje_uso: porcentajeUso,
        aadd_count: state.aadd_count,
        cumple_minimo: cumpleMinimo,
        es_especialista: state.esEspecialista
      });

      // MEJORA: Generar warnings
      if (!cumpleMinimo && horasAsignadas > 0) {
        resultado.warnings.push({
          tipo: 'HORAS_INSUFICIENTES',
          empleado: emp.nombre_mostrado,
          mensaje: `Solo tiene ${horasAsignadas}h asignadas (contrato: ${horasContrato}h)`
        });
      }

      if (horasAsignadas === 0) {
        resultado.warnings.push({
          tipo: 'SIN_ASIGNACIONES',
          empleado: emp.nombre_mostrado,
          mensaje: 'No tiene ninguna asignación en la semana'
        });
      }
    });

    // Generar rejillas
    dias.forEach(dia => {
      const franjas = [];
      for (let h = 6; h <= 23; h++) {
        franjas.push(`${h.toString().padStart(2, '0')}:00`);
        franjas.push(`${h.toString().padStart(2, '0')}:15`);
        franjas.push(`${h.toString().padStart(2, '0')}:30`);
        franjas.push(`${h.toString().padStart(2, '0')}:45`);
      }

      const rejilla = {
        dia,
        franjas,
        empleados: []
      };

      plantilla.forEach(emp => {
        const fila = {
          nombre: emp.nombre_mostrado,
          celdas: franjas.map(franja => {
            const asig = empleadoState[emp.empleado_id].horasPorDia[dia].find(a => {
              const franjaMins = timeToMinutes(franja);
              const inicioMins = timeToMinutes(a.inicio);
              const finMins = timeToMinutes(a.fin);
              return franjaMins >= inicioMins && franjaMins < finMins;
            });
            
            if (!asig) return '';
            if (asig.tipo_necesidad === 'SALA') return 'SALA';
            if (asig.tipo_necesidad === 'RECEPCION') return 'REC';
            return asig.actividad;
          })
        };
        rejilla.empleados.push(fila);
      });

      resultado.rejillas[dia] = rejilla;
    });

    return resultado;
  };

  const exportarCSV = (tipo, dia = null) => {
    if (tipo === 'rejilla' && dia) {
      const rejilla = cuadrante.rejillas[dia];
      const excepcionesDia = cuadrante.excepciones.filter(e => e.dia === dia);
      
      let htmlContent = `
<!DOCTYPE html>
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
    .excepcion { background-color: #FFA500; border: 2px solid #FF6600; }
    .leyenda { margin-top: 30px; display: flex; gap: 20px; flex-wrap: wrap; }
    .leyenda-item { display: flex; align-items: center; gap: 8px; }
    .leyenda-color { width: 30px; height: 20px; border: 1px solid #000; }
    .alert { background-color: #FFF3CD; border: 1px solid #FFC107; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <h2>Cuadrante ${dia}</h2>
  <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
  ${excepcionesDia.length > 0 ? `
  <div class="alert">
    <strong>⚠️ ATENCIÓN: Este día tiene ${excepcionesDia.length} asignación(es) con excepciones</strong>
    <ul>
      ${excepcionesDia.map(e => `<li>${e.empleado} (${e.hora}, ${e.tipo}): ${e.razon}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  
  <table>
    <thead>
      <tr>
        <th class="header-col">Empleado</th>
        ${rejilla.franjas.map(f => `<th>${f}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
`;

      rejilla.empleados.forEach(emp => {
        htmlContent += `<tr><td class="header-col">${emp.nombre}</td>`;
        emp.celdas.forEach(celda => {
          let clase = '';
          if (celda === 'REC') {
            clase = 'recepcion';
          } else if (celda === 'SALA') {
            clase = 'sala';
          } else if (celda && celda !== '') {
            clase = 'especialista';
          }
          htmlContent += `<td class="${clase}">${celda}</td>`;
        });
        htmlContent += '</tr>';
      });

      htmlContent += `
    </tbody>
  </table>
  
  <div class="leyenda">
    <h3 style="width: 100%;">Leyenda de Colores:</h3>
    <div class="leyenda-item">
      <div class="leyenda-color" style="background-color: #FFFF00;"></div>
      <span>Dirección y Coordinación</span>
    </div>
    <div class="leyenda-item">
      <div class="leyenda-color" style="background-color: #ADD8E6;"></div>
      <span>Recepción</span>
    </div>
    <div class="leyenda-item">
      <div class="leyenda-color" style="background-color: #D3D3D3;"></div>
      <span>Sala</span>
    </div>
    <div class="leyenda-item">
      <div class="leyenda-color" style="background-color: #90EE90;"></div>
      <span>Especialistas (AADD)</span>
    </div>
    ${excepcionesDia.length > 0 ? `
    <div class="leyenda-item">
      <div class="leyenda-color" style="background-color: #FFA500; border: 2px solid #FF6600;"></div>
      <span>⚠️ Con Excepción (revisar)</span>
    </div>
    ` : ''}
  </div>
  
  <p style="margin-top: 30px; color: #666; font-size: 11pt;">
    <strong>Nota:</strong> Para importar este cuadrante en Excel:<br>
    1. Abre Excel<br>
    2. Ve a Archivo → Abrir<br>
    3. Selecciona este archivo HTML<br>
    4. Excel lo convertirá automáticamente manteniendo los colores
  </p>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cuadrante_${dia}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (tipo === 'asignaciones') {
      let csvContent = 'Dia,Empleado_ID,Nombre,Inicio,Fin,Tipo,Actividad,Espacio,Estado\n';
      cuadrante.asignaciones.forEach(a => {
        const actividad = a.actividad || '';
        const espacio = a.espacio || '';
        const estado = a.tiene_excepcion ? 'EXCEPCION' : 'NORMAL';
        csvContent += `${a.dia},${a.empleado_id},${a.nombre},${a.inicio},${a.fin},${a.tipo_necesidad},${actividad},${espacio},${estado}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asignaciones_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const RejillaDisplay = useCallback(({ dia }) => {
    if (!cuadrante || !cuadrante.rejillas[dia]) return null;
    
    const rejilla = cuadrante.rejillas[dia];
    
    return (
      <div className="bg-white rounded-lg border border-gray-300 overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-2 py-2 sticky left-0 bg-blue-600 z-20 min-w-[150px] border-r-2 border-blue-700">
                Empleado
              </th>
              {rejilla.franjas.map((franja, idx) => {
                if (idx % 4 === 0) {
                  const hora = Math.floor(idx / 4) + 6;
                  return (
                    <th key={idx} colSpan="4" className="px-2 py-1 border-l border-blue-500 text-center">
                      {hora}h
                    </th>
                  );
                }
                return null;
              })}
            </tr>
          </thead>
          <tbody>
            {rejilla.empleados.map((emp, empIdx) => (
              <tr key={empIdx} className={empIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className={`px-2 py-2 font-medium sticky left-0 ${empIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} z-10 border-r-2 border-gray-300 min-w-[150px]`}>
                  {emp.nombre}
                </td>
                {emp.celdas.map((celda, celdaIdx) => {
                  let bgColor = '';
                  if (celda === 'SALA') bgColor = 'bg-gray-300';
                  else if (celda === 'REC') bgColor = 'bg-blue-200';
                  else if (celda) bgColor = 'bg-green-200';
                  
                  return (
                    <td key={celdaIdx} className={`px-1 py-2 text-center border-l border-gray-200 min-w-[40px] ${bgColor}`}>
                      {celda}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [cuadrante]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800">Generador de Cuadrantes Semanales</h1>
            <span className="text-xs bg-gradient-to-r from-green-100 to-blue-100 text-green-700 px-3 py-1 rounded-full font-medium border border-green-300">
              v2.1 Optimizado ⚡
            </span>
          </div>
          <p className="text-gray-600 mb-8">Sistema automatizado con optimización inteligente y redistribución de turnos</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[0, 1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s === 3 ? '✓' : s}
                  </div>
                  {s < 3 && <div className={`w-24 h-1 transition-colors ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
              </React.Fragment>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-600 mb-6">
            {step === 0 && "Paso 0: Configuración de Restricciones"}
            {step === 1 && "Paso 1: Cargar Demanda del Centro"}
            {step === 2 && "Paso 2: Cargar Plantilla de Empleados"}
            {step === 3 && "✅ Cuadrante Generado"}
          </div>

          {/* Step 0: Configuración */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Paso 0: Configuración de Restricciones</h2>
              <p className="text-gray-600 mb-6">
                Define las reglas y límites que aplicarán a la planificación de turnos
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">⏱️ Límites de Jornada</h3>
                  
                  <label className="block mb-3">
                    <span className="text-sm font-medium text-gray-700">Máximo horas diarias</span>
                    <input 
                      type="number" 
                      value={config.max_horas_diarias}
                      onChange={(e) => setConfig({...config, max_horas_diarias: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </label>
                  
                  <label className="block mb-3">
                    <span className="text-sm font-medium text-gray-700">Mínimo horas diarias (jornada completa)</span>
                    <input 
                      type="number" 
                      value={config.min_horas_diarias_completa}
                      onChange={(e) => setConfig({...config, min_horas_diarias_completa: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </label>
                  
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Máximo horas semanales</span>
                    <input 
                      type="number" 
                      value={config.horas_semanales_maximas}
                      onChange={(e) => setConfig({...config, horas_semanales_maximas: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </label>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">☕ Descansos</h3>
                  
                  <label className="block mb-3">
                    <span className="text-sm font-medium text-gray-700">Descanso entre jornadas (horas)</span>
                    <input 
                      type="number" 
                      value={config.descanso_entre_jornadas_horas}
                      onChange={(e) => setConfig({...config, descanso_entre_jornadas_horas: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </label>
                  
                  <label className="block mb-3">
                    <span className="text-sm font-medium text-gray-700">Descanso en jornada >5h (minutos)</span>
                    <input 
                      type="number" 
                      value={config.descanso_jornada_continuada_minutos}
                      onChange={(e) => setConfig({...config, descanso_jornada_continuada_minutos: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </label>
                  
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Días descanso semanal consecutivos</span>
                    <input 
                      type="number" 
                      value={config.dias_descanso_semanal_consecutivos}
                      onChange={(e) => setConfig({...config, dias_descanso_semanal_consecutivos: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-3">🔥 Hora Punta (L-J tardes)</h3>
                  
                  <label className="block mb-3">
                    <span className="text-sm font-medium text-gray-700">Inicio (HH:MM)</span>
                    <input 
                      type="text" 
                      value={config.hora_punta_inicio}
                      onChange={(e) => setConfig({...config, hora_punta_inicio: e.target.value})}
                      placeholder="18:00"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </label>
                  
                  <label className="block mb-3">
                    <span className="text-sm font-medium text-gray-700">Fin (HH:MM)</span>
                    <input 
                      type="text" 
                      value={config.hora_punta_fin}
                      onChange={(e) => setConfig({...config, hora_punta_fin: e.target.value})}
                      placeholder="21:30"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Mín personas</span>
                      <input 
                        type="number" 
                        value={config.min_personas_sala_punta}
                        onChange={(e) => setConfig({...config, min_personas_sala_punta: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </label>
                    
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Máx personas</span>
                      <input 
                        type="number" 
                        value={config.max_personas_sala_punta}
                        onChange={(e) => setConfig({...config, max_personas_sala_punta: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3">📊 Cobertura Sala</h3>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Hora Valle (L-V resto)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-gray-600">Mín</span>
                        <input 
                          type="number" 
                          value={config.min_personas_sala_valle}
                          onChange={(e) => setConfig({...config, min_personas_sala_valle: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </label>
                      
                      <label className="block">
                        <span className="text-xs text-gray-600">Máx</span>
                        <input 
                          type="number" 
                          value={config.max_personas_sala_valle}
                          onChange={(e) => setConfig({...config, max_personas_sala_valle: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Fin de Semana</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-gray-600">Mín</span>
                        <input 
                          type="number" 
                          value={config.min_personas_sala_finde}
                          onChange={(e) => setConfig({...config, min_personas_sala_finde: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </label>
                      
                      <label className="block">
                        <span className="text-xs text-gray-600">Máx</span>
                        <input 
                          type="number" 
                          value={config.max_personas_sala_finde}
                          onChange={(e) => setConfig({...config, max_personas_sala_finde: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">Errores de validación:</h3>
                      <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                        {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={handleConfigSubmit}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Guardar Configuración y Continuar
              </button>
            </div>
          )}

          {/* Step 1: Tabla A */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Paso 1: Cargar Tabla A (Demanda del Centro)</h2>
              <p className="text-gray-600 mb-4">
                Define qué necesidades hay que cubrir cada día (actividades dirigidas, sala, recepción)
              </p>
              <p className="text-sm text-gray-500 mb-4">
                <strong>Columnas:</strong> dia, inicio, fin, tipo_necesidad, actividad, espacio, personas_requeridas, permite_compartido
              </p>
              
              <label className="block mb-4">
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700 font-medium">Seleccionar archivo CSV</span>
                </div>
                <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'A')} />
              </label>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">Errores de validación:</h3>
                      <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                        {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {tablaA && validationErrors.length === 0 && (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">Tabla A validada correctamente ({tablaA.data.length} registros)</span>
                      </div>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {showPreview ? 'Ocultar' : 'Ver'} Preview
                      </button>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-auto">
                      <h3 className="font-semibold mb-2">Preview de Tabla A (primeras 10 filas)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-gray-200">
                            <tr>
                              {tablaA.headers.map((h, i) => <th key={i} className="px-2 py-1 border text-left">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {tablaA.data.slice(0, 10).map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {tablaA.headers.map((h, j) => <td key={j} className="px-2 py-1 border">{row[h]}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setStep(0);
                        setValidationErrors([]);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Volver
                    </button>
                    <button 
                      onClick={() => setStep(2)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continuar al Paso 2
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Tabla B */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Paso 2: Cargar Tabla B (Empleados + Habilitaciones)</h2>
              <p className="text-gray-600 mb-4">
                <strong>Columnas obligatorias:</strong> empleado_id, nombre_mostrado, horas_semanales_contrato, tipo_jornada, permite_turno_partido, puede_fin_de_semana, <strong className="text-blue-600">solo_aadd</strong>, hora_no_disp_inicio, hora_no_disp_fin, max_aadd_semana
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Columnas de actividades:</strong> Añade una columna por cada actividad (PUMP, COMBAT, BALANCE, YOGA, PILATES, DANCE, FUERZA, CROSS, HYROX, BOXEO, REACTIVATE, CORE, FUNCIONAL, etc.) con valores SI/NO
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">⚠️ Campo importante: solo_aadd (CORREGIDO)</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>SI</strong> = Especialista que SOLO hace sus clases (AADD). No hará SALA ni RECEPCIÓN.</li>
                  <li>• <strong>NO</strong> = Polivalente. Puede hacer AADD, SALA y RECEPCIÓN.</li>
                  <li className="text-green-700 font-medium">✅ Ahora el algoritmo respeta correctamente esta restricción</li>
                </ul>
              </div>
              
              <label className="block mb-4">
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700 font-medium">Seleccionar archivo CSV</span>
                </div>
                <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'B')} />
              </label>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">Errores de validación:</h3>
                      <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                        {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {tablaB && validationErrors.length === 0 && (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Tabla B validada correctamente ({tablaB.data.length} empleados)
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {showPreview ? 'Ocultar' : 'Ver'} Preview
                      </button>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-auto">
                      <h3 className="font-semibold mb-2">Preview de Tabla B (primeras 10 filas)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-gray-200">
                            <tr>
                              {tablaB.headers.map((h, i) => <th key={i} className="px-2 py-1 border text-left">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {tablaB.data.slice(0, 10).map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {tablaB.headers.map((h, j) => (
                                  <td key={j} className="px-2 py-1 border">
                                    {h === 'solo_aadd' && row[h]?.toUpperCase() === 'SI' ? (
                                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                                        {row[h]}
                                      </span>
                                    ) : row[h]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setStep(1);
                        setValidationErrors([]);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Volver al Paso 1
                    </button>
                    <button 
                      onClick={generarCuadrante}
                      disabled={processing || !tablaA || !tablaB}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Generando cuadrante...
                        </>
                      ) : (
                        '✨ Generar Cuadrante'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Resultados */}
          {step === 3 && cuadrante && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">📊 Resultados del Cuadrante Optimizado</h2>

              {/* Estadísticas */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">📊 Estadísticas de Optimización</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded p-3">
                    <div className="text-sm text-gray-600">Cobertura de Necesidades</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {cuadrante.estadisticas.cobertura.porcentaje}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {cuadrante.estadisticas.cobertura.cubiertas} de {cuadrante.estadisticas.cobertura.total_necesidades}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <div className="text-sm text-gray-600">Total Asignaciones</div>
                    <div className="text-2xl font-bold text-green-600">
                      {cuadrante.asignaciones.length}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <div className="text-sm text-gray-600">Empleados Activos</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {cuadrante.estadisticas.empleados.filter(e => parseFloat(e.horas_asignadas) > 0).length}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded p-3">
                  <h4 className="font-semibold text-gray-800 mb-2">Horas por Empleado</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cuadrante.estadisticas.empleados.map((emp, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{emp.nombre}</span>
                          {emp.es_especialista && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              Especialista
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            ({emp.empleado_id})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={emp.cumple_minimo ? 'text-green-600' : 'text-orange-600'}>
                            {emp.horas_asignadas}h / {emp.horas_contrato}h
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {emp.porcentaje_uso}%
                          </span>
                          {emp.aadd_count > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {emp.aadd_count} AADD
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Análisis de Viabilidad */}
              {cuadrante.analisis_viabilidad && (
                <div className={`border-2 rounded-lg p-4 mb-6 ${
                  cuadrante.analisis_viabilidad.es_viable ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                }`}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-xl">
                      {cuadrante.analisis_viabilidad.es_viable ? '✅' : '❌'}
                    </span>
                    <span className={cuadrante.analisis_viabilidad.es_viable ? 'text-green-900' : 'text-red-900'}>
                      Análisis de Viabilidad Matemática
                    </span>
                  </h3>
                  
                  <div className={`text-sm font-medium mb-4 ${
                    cuadrante.analisis_viabilidad.es_viable ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {cuadrante.analisis_viabilidad.mensaje}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-gray-600">Capacidad Polivalentes</div>
                      <div className="text-lg font-bold text-blue-600">
                        {cuadrante.analisis_viabilidad.detalles.capacidad_polivalentes}h
                      </div>
                      <div className="text-xs text-gray-500">
                        {cuadrante.analisis_capacidad.polivalentes} empleados × {config.horas_semanales_maximas}h
                      </div>
                    </div>

                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-gray-600">Demanda SALA</div>
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round(cuadrante.analisis_viabilidad.detalles.demanda_sala)}h
                      </div>
                    </div>

                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-gray-600">Demanda RECEPCIÓN</div>
                      <div className="text-lg font-bold text-cyan-600">
                        {Math.round(cuadrante.analisis_viabilidad.detalles.demanda_recepcion)}h
                      </div>
                    </div>

                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-gray-600">Uso Polivalentes</div>
                      <div className={`text-lg font-bold ${
                        cuadrante.analisis_viabilidad.detalles.porcentaje_uso_polivalentes > 95 ? 'text-red-600' :
                        cuadrante.analisis_viabilidad.detalles.porcentaje_uso_polivalentes > 85 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {cuadrante.analisis_viabilidad.detalles.porcentaje_uso_polivalentes}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(cuadrante.analisis_viabilidad.detalles.demanda_total_polivalentes)}h demandadas
                      </div>
                    </div>
                  </div>

                  {cuadrante.analisis_viabilidad.detalles.horas_faltantes > 0 && (
                    <div className="mt-3 bg-red-100 border border-red-300 rounded p-3 text-sm">
                      <strong className="text-red-800">Déficit:</strong> Faltan <strong>{Math.round(cuadrante.analisis_viabilidad.detalles.horas_faltantes)}h</strong> de capacidad de polivalentes para cubrir toda la demanda de SALA y RECEPCIÓN.
                    </div>
                  )}
                </div>
              )}

              {/* Excepciones aplicadas */}
              {cuadrante.excepciones && cuadrante.excepciones.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Optimización Activada: {cuadrante.excepciones.length} Turnos Cubiertos con Excepciones
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    El algoritmo ha aplicado relajaciones controladas para cubrir turnos críticos que no podían asignarse normalmente.
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cuadrante.excepciones.map((exc, i) => (
                      <div key={i} className="bg-white border border-blue-300 rounded p-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">
                            {exc.empleado} - {exc.dia} {exc.hora}
                          </span>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                            {exc.tipo}: {exc.razon}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-3 italic">
                    💡 Estas asignaciones están marcadas con ⚠️ en la lista de asignaciones. Revísalas antes de aplicar el cuadrante.
                  </p>
                </div>
              )}

              {/* Análisis de Capacidad */}
              {cuadrante.analisis_capacidad && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-purple-900 mb-3">📋 Análisis de Capacidad de Plantilla</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded p-2 text-center">
                      <div className="text-xs text-gray-600">Total Empleados</div>
                      <div className="text-xl font-bold text-purple-600">{cuadrante.analisis_capacidad.total_empleados}</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <div className="text-xs text-gray-600">Especialistas</div>
                      <div className="text-xl font-bold text-orange-600">{cuadrante.analisis_capacidad.especialistas}</div>
                      <div className="text-xs text-gray-500">Solo AADD</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <div className="text-xs text-gray-600">Polivalentes</div>
                      <div className="text-xl font-bold text-green-600">{cuadrante.analisis_capacidad.polivalentes}</div>
                      <div className="text-xs text-gray-500">AADD+SALA+REC</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <div className="text-xs text-gray-600">Fines de Semana</div>
                      <div className="text-xl font-bold text-blue-600">{cuadrante.analisis_capacidad.pueden_finde}</div>
                    </div>
                  </div>

                  <div className="bg-white rounded p-3">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">Empleados Habilitados por Actividad:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {Object.entries(cuadrante.analisis_capacidad.actividades_habilitadas).map(([act, count]) => (
                        <div key={act} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                          <span className="font-medium">{act}:</span>
                          <span className={count === 0 ? 'text-red-600 font-bold' : count < 2 ? 'text-orange-600' : 'text-green-600'}>
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sugerencias de Solución */}
              {cuadrante.sugerencias && cuadrante.sugerencias.length > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    Sugerencias para Resolver Problemas ({cuadrante.sugerencias.length})
                  </h3>
                  <div className="space-y-3">
                    {cuadrante.sugerencias.map((sug, i) => (
                      <div key={i} className="bg-white border border-yellow-300 rounded p-3">
                        <div className="flex items-start gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            sug.tipo === 'CRITICO' ? 'bg-red-100 text-red-700' :
                            sug.tipo === 'AADD' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {sug.tipo}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm text-gray-800 mb-1">{sug.mensaje}</div>
                            <div className="text-sm text-green-700 font-medium">{sug.solucion}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {cuadrante.warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-800 mb-2">⚠️ Advertencias ({cuadrante.warnings.length}):</h3>
                      <div className="text-orange-700 text-sm space-y-1">
                        {cuadrante.warnings.map((warn, i) => (
                          <div key={i} className="border-l-2 border-orange-400 pl-2">
                            <strong>{warn.tipo}</strong> - {warn.empleado}: {warn.mensaje}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Errores */}
              {cuadrante.errores.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800 mb-3">
                        ❌ Necesidades No Cubiertas ({cuadrante.errores.length})
                      </h3>
                      
                      {/* Resumen por tipo */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-600">AADD</div>
                          <div className="text-lg font-bold text-red-600">
                            {cuadrante.errores.filter(e => e.tipo === 'AADD').length}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-600">SALA</div>
                          <div className="text-lg font-bold text-red-600">
                            {cuadrante.errores.filter(e => e.tipo === 'SALA').length}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-600">RECEPCIÓN</div>
                          <div className="text-lg font-bold text-red-600">
                            {cuadrante.errores.filter(e => e.tipo === 'RECEPCION').length}
                          </div>
                        </div>
                      </div>

                      <div className="text-red-700 text-sm space-y-2 max-h-60 overflow-y-auto">
                        {cuadrante.errores.map((err, i) => (
                          <div key={i} className="bg-white border border-red-200 rounded p-2">
                            <div className="font-medium mb-1">
                              {err.dia} {err.hora} - {err.tipo} {err.actividad}
                            </div>
                            <div className="text-xs text-gray-700 pl-2 border-l-2 border-red-400">
                              {err.razon}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selector de día */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar día para ver cuadrante:</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <select 
                    value={selectedDay}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    <option value="">-- Seleccionar --</option>
                    {Object.keys(cuadrante.rejillas).map(dia => (
                      <option key={dia} value={dia}>{dia}</option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={() => {
                      if (selectedDay) {
                        exportarCSV('rejilla', selectedDay);
                      } else {
                        alert('Por favor, selecciona un día primero');
                      }
                    }}
                    disabled={!selectedDay}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exportar día con colores (Excel)
                  </button>
                </div>
              </div>

              {selectedDay && <RejillaDisplay dia={selectedDay} />}

              {/* Botones de exportación */}
              <div className="flex gap-3 my-6">
                <button 
                  onClick={() => exportarCSV('asignaciones')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar Asignaciones (CSV)
                </button>
              </div>

              {/* Tabla de asignaciones */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Lista de Asignaciones ({cuadrante.asignaciones.length})
                  {cuadrante.excepciones && cuadrante.excepciones.length > 0 && (
                    <span className="text-sm font-normal text-orange-600 ml-2">
                      ({cuadrante.excepciones.length} con excepciones ⚠️)
                    </span>
                  )}
                </h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Día</th>
                        <th className="px-3 py-2 text-left">Empleado</th>
                        <th className="px-3 py-2 text-left">Inicio</th>
                        <th className="px-3 py-2 text-left">Fin</th>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Actividad</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuadrante.asignaciones.map((a, i) => (
                        <tr key={i} className={`border-b border-gray-200 ${a.tiene_excepcion ? 'bg-orange-50' : ''}`}>
                          <td className="px-3 py-2">{a.dia}</td>
                          <td className="px-3 py-2">{a.nombre}</td>
                          <td className="px-3 py-2">{a.inicio}</td>
                          <td className="px-3 py-2">{a.fin}</td>
                          <td className="px-3 py-2">{a.tipo_necesidad}</td>
                          <td className="px-3 py-2">{a.actividad}</td>
                          <td className="px-3 py-2">
                            {a.tiene_excepcion ? (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                                ⚠️ Excepción
                              </span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✓ Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button 
                onClick={() => {
                  setStep(0);
                  setTablaA(null);
                  setTablaB(null);
                  setCuadrante(null);
                  setValidationErrors([]);
                  setSelectedDay('');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Nuevo Cuadrante
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftScheduler;