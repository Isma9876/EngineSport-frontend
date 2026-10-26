const moneda = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  currencyDisplay: 'narrowSymbol',
})

// Los DECIMAL llegan como texto ("150.00"): convertir con Number().
export function formatoPrecio(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return 'Q0.00'
  return moneda.format(n)
}
