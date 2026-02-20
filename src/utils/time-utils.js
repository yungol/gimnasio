/**
 * Time utility functions for schedule operations
 */

/**
 * Convert "HH:MM" string to total minutes
 * @param {string} time - Time in "HH:MM" format
 * @returns {number} Total minutes from midnight
 */
export function timeToMinutes(time) {
  if (!time || typeof time !== 'string') return NaN
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convert slot index (0-67) to time string
 * Each slot is 15 minutes, starting at 6:00
 * @param {number} index - Slot index
 * @returns {string} Time in "H:MM" format
 */
export function formatSlotTime(index) {
  const hour = Math.floor(index / 4) + 6
  const min = (index % 4) * 15
  return `${hour}:${min.toString().padStart(2, '0')}`
}

/**
 * Generate 15-minute time slots from 06:00 to 23:45
 * @returns {string[]} Array of time strings
 */
export function generateTimeSlots() {
  const slots = []
  for (let h = 6; h <= 23; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
    slots.push(`${h.toString().padStart(2, '0')}:15`)
    slots.push(`${h.toString().padStart(2, '0')}:30`)
    slots.push(`${h.toString().padStart(2, '0')}:45`)
  }
  return slots
}

/**
 * Days of the week constant
 */
export const DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

/**
 * Day labels for UI (Spanish abbreviations)
 */
export const DAY_LABELS = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mie',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sab',
  DOMINGO: 'Dom'
}
