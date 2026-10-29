// Descarga un archivo que Excel abre directo, con tildes, ñ y columnas bien separadas.
// - UTF-16 con BOM: Excel lo reconoce siempre (UTF-8 + "sep=" falla en varias versiones).
// - Tabuladores como separador: funcionan sin importar la configuración regional.
// - Los números usan el decimal de la configuración regional para que Excel los lea como número.
// columnas: [{ titulo, valor: (fila) => ... }]
export function descargarCSV(nombreArchivo, columnas, filas) {
  const formatear = (v) =>
    typeof v === 'number'
      ? v.toLocaleString(undefined, { useGrouping: false, maximumFractionDigits: 2 })
      : v
  const esc = (v) => {
    const s = v == null ? '' : String(formatear(v))
    return /["\t\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lineas = [
    columnas.map((c) => esc(c.titulo)).join('\t'),
    ...filas.map((f) => columnas.map((c) => esc(c.valor(f))).join('\t')),
  ]
  const texto = lineas.join('\r\n')

  const datos = new Uint16Array(texto.length + 1)
  datos[0] = 0xfeff // BOM UTF-16
  for (let i = 0; i < texto.length; i++) datos[i + 1] = texto.charCodeAt(i)

  const blob = new Blob([datos], { type: 'text/csv;charset=utf-16le' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}