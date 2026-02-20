/**
 * CSV Parser with BOM handling and auto-delimiter detection
 */

/**
 * Parse CSV text into headers and data array
 * @param {string} text - Raw CSV text
 * @returns {{ headers: string[], data: Object[] }}
 */
export function parseCSV(text) {
  // Remove BOM and normalize line endings
  text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const lines = text.trim().split('\n').filter(line => line.trim())
  if (lines.length === 0) return { headers: [], data: [] }

  // Auto-detect separator
  const firstLine = lines[0]
  const separator = firstLine.includes(';') ? ';' : ','

  const headers = lines[0]
    .split(separator)
    .map(h => h.trim().replace(/^["']|["']$/g, ''))

  const data = lines.slice(1).map(line => {
    const values = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''))
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = values[i] || ''
    })
    return obj
  })

  return { headers, data }
}

/**
 * Normalize time format to HH:MM (e.g., "9:00" -> "09:00")
 * @param {string} time
 * @returns {string}
 */
export function normalizeTime(time) {
  if (!time) return time
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return time
  const [, hours, minutes] = match
  return `${hours.padStart(2, '0')}:${minutes}`
}
