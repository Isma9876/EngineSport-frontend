// Descarga un CSV. columnas: [{ titulo, valor: (fila) => ... }]
// - La primera línea "sep=;" le dice a Excel qué separador usar, sin importar su configuración regional.
// - El BOM inicial hace que Excel respete tildes y la ñ.
export function descargarCSV(nombreArchivo, columnas, filas) {
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lineas = [
    'sep=;',
    columnas.map((c) => esc(c.titulo)).join(';'),
    ...filas.map((f) => columnas.map((c) => esc(c.valor(f))).join(';')),
  ]
  const blob = new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}