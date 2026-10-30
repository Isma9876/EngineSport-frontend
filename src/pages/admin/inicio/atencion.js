// Arma la lista priorizada de "Requiere atención" a partir de las respuestas de la API.
// Orden: pedidos pagados (más antiguos primero) > agotadas > pocas unidades > cupones por vencer > cupones casi agotados.
import { formatoPrecio } from '../../../utils/formato.js'

export const RUTAS = {
  pedido: '/admin/pedidos',
  existencia: '/admin/reportes?seccion=existencias',
  cupon: '/admin/cupones',
}
const DIA = 24 * 60 * 60 * 1000
const DIAS_AVISO = 3
const UMBRAL_USOS = 0.8

const fechaHora = (f) => (f ? new Date(f).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }) : null)
const fecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT', { dateStyle: 'medium' }) : '-')
const inicioDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function itemsPedidos(pedidos) {
  return pedidos
    .filter((p) => p.estado === 'pagado')
    .sort((a, b) => new Date(a.fecha_pedido) - new Date(b.fecha_pedido))
    .map((p) => ({
      clave: `pedido-${p.id_pedido}`,
      tipo: 'pedido',
      etiqueta: 'Pedido',
      texto: `Pedido #${p.id_pedido} pagado, listo para enviar`,
      detalle: [`Cliente #${p.id_cliente}`, fechaHora(p.fecha_pedido), formatoPrecio(p.total)].filter(Boolean).join(' · '),
      ruta: RUTAS.pedido,
    }))
}

export function itemsExistencias(datos) {
  const variantes = datos?.inventario_completo ?? []
  const nombre = (v) => {
    const opciones = [v.talla, v.color].filter(Boolean).join(' / ')
    return `${v.producto?.nombre ?? 'Producto'}${opciones ? ` (${opciones})` : ''}`
  }
  const item = (v, agotada) => ({
    clave: `existencia-${v.id}`,
    tipo: 'existencia',
    etiqueta: agotada ? 'Agotado' : 'Pocas unidades',
    texto: agotada ? `${nombre(v)} está agotado` : `${nombre(v)}: quedan pocas unidades`,
    detalle: `SKU ${v.sku ?? '-'} · stock mínimo ${v.stock_minimo}`,
    ruta: RUTAS.existencia,
  })
  const agotadas = variantes.filter((v) => Number(v.stock) <= 0)
  const pocas = variantes
    .filter((v) => Number(v.stock) > 0 && Number(v.stock) <= Number(v.stock_minimo))
    .sort((a, b) => Number(a.stock) - Number(b.stock))
  return [...agotadas.map((v) => item(v, true)), ...pocas.map((v) => item(v, false))]
}

export function itemsCupones(cupones, ahora = new Date()) {
  const porVencer = []
  const porAgotar = []
  const limite = new Date(ahora.getTime() + DIAS_AVISO * DIA)
  for (const c of cupones) {
    // Solo cupones vigentes: se ignoran inactivos, programados, vencidos y agotados
    if (!c.activo) continue
    const fin = c.vigencia_fin ? new Date(c.vigencia_fin) : null
    if (fin && fin < ahora) continue
    if (c.vigencia_inicio && new Date(c.vigencia_inicio) > ahora) continue
    const max = c.usos_maximos != null ? Number(c.usos_maximos) : null
    const usos = Number(c.usos_actuales ?? 0)
    if (max != null && usos >= max) continue

    const vence = fin && fin <= limite
    const casiAgotado = max != null && max > 0 && usos / max >= UMBRAL_USOS
    if (!vence && !casiAgotado) continue

    const usosTexto = `${usos} de ${max} usos`
    if (vence) {
      const dias = Math.round((inicioDia(fin) - inicioDia(ahora)) / DIA)
      const cuando = dias <= 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`
      porVencer.push({
        orden: fin,
        item: {
          clave: `cupon-${c.id_cupon}`,
          tipo: 'cupon',
          etiqueta: 'Cupón',
          texto: `Cupón ${c.codigo} vence ${cuando}`,
          detalle: `Vigente hasta ${fecha(c.vigencia_fin)}${casiAgotado ? ` · ${usosTexto}` : ''}`,
          ruta: RUTAS.cupon,
        },
      })
    } else {
      porAgotar.push({
        orden: -(usos / max),
        item: {
          clave: `cupon-${c.id_cupon}`,
          tipo: 'cupon',
          etiqueta: 'Cupón',
          texto: `Cupón ${c.codigo} está por agotarse`,
          detalle: usosTexto,
          ruta: RUTAS.cupon,
        },
      })
    }
  }
  porVencer.sort((a, b) => a.orden - b.orden)
  porAgotar.sort((a, b) => a.orden - b.orden)
  return [...porVencer, ...porAgotar].map((x) => x.item)
}
