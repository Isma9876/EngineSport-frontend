import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../api.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'

const INTERVALO = 2000
const MAX_INTENTOS = 30 // ~60 segundos esperando el webhook
const titulo = 'font-titulo text-2xl font-extrabold uppercase'
const botonPrimario =
  'inline-block rounded bg-primario px-4 py-2 font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40'

export default function Confirmacion() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState(null)
  const [agotado, setAgotado] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [errorPdf, setErrorPdf] = useState('')

  // El pedido pasa a "pagado" cuando llega el webhook de Stripe: se consulta hasta verlo.
  useEffect(() => {
    let vigente = true
    let intentos = 0
    let temporizador = null

    async function consultar() {
      try {
        const datos = await api.get(`/api/pedidos/${id}`)
        if (!vigente) return
        setPedido(datos)
        setError(null)
        if (datos.estado !== 'pendiente') return
      } catch (e) {
        if (!vigente) return
        setError(e)
        if (e.status === 403 || e.status === 404) return
      }
      intentos += 1
      if (intentos >= MAX_INTENTOS) {
        setAgotado(true)
        return
      }
      temporizador = setTimeout(consultar, INTERVALO)
    }

    consultar()
    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [id])

  const pagado = Boolean(pedido) && ['pagado', 'enviado'].includes(pedido.estado)

  // Al confirmarse el pago se quitan del carrito solo las variantes compradas (una vez por pedido).
  useEffect(() => {
    if (!pagado) return
    const clave = `carrito-limpio-${id}`
    try {
      if (sessionStorage.getItem(clave)) return
      sessionStorage.setItem(clave, '1')
    } catch {
      // sin sessionStorage: se limpia igual
    }
    Promise.allSettled(
      (pedido.detalles ?? []).map((d) => api.delete(`/api/carrito/items/${d.id_variante}`)),
    )
  }, [pagado, pedido, id])

  async function descargarComprobante() {
    setDescargando(true)
    setErrorPdf('')
    try {
      const blob = await api.descargar(`/api/pedidos/${id}/comprobante`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comprobante-pedido-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setErrorPdf(e.message)
    } finally {
      setDescargando(false)
    }
  }

  if (!pedido && (error?.status === 403 || error?.status === 404)) {
    return (
      <section>
        <h1 className={titulo}>Pedido no encontrado</h1>
        <p className="mt-4 text-texto-suave">Este pedido no existe o no es tuyo.</p>
        <Link to="/mis-pedidos" className={`mt-4 ${botonPrimario}`}>
          Ver mis pedidos
        </Link>
      </section>
    )
  }

  if (!pedido) return <Cargando texto="Consultando tu pedido..." />

  if (pedido.estado === 'pendiente') {
    if (agotado) {
      return (
        <section>
          <h1 className={titulo}>Seguimos procesando tu pago</h1>
          <p className="mt-4 text-texto-suave">
            Tu pago del pedido #{id} todavía no se confirma. No vuelvas a pagar: revisa el estado en Mis pedidos
            en unos minutos.
          </p>
          <Link to="/mis-pedidos" className={`mt-4 ${botonPrimario}`}>
            Ir a mis pedidos
          </Link>
        </section>
      )
    }
    return <Cargando texto="Confirmando tu pago, no cierres esta página..." />
  }

  if (pedido.estado === 'cancelado') {
    return (
      <section>
        <h1 className={titulo}>Pedido cancelado</h1>
        <p className="mt-4 text-texto-suave">
          El pedido #{id} fue cancelado. Si se te cobró, el pago se reembolsa automáticamente.
        </p>
        <Link to="/carrito" className={`mt-4 ${botonPrimario}`}>
          Volver al carrito
        </Link>
      </section>
    )
  }

  return (
    <section>
      <h1 className={titulo}>¡Pago confirmado!</h1>
      <p className="mt-2 text-texto-suave">Tu pedido #{id} está {pedido.estado}.</p>

      <div className="mt-6 max-w-xl rounded bg-superficie p-4">
        <ul className="space-y-1 text-sm">
          {(pedido.detalles ?? []).map((d) => {
            const v = d.variante
            const extra = [v?.talla, v?.color].filter(Boolean).join(', ')
            return (
              <li key={d.id_variante} className="flex justify-between gap-2">
                <span>
                  {v?.producto?.nombre ?? `Variante ${d.id_variante}`}
                  {extra ? ` (${extra})` : ''} × {d.cantidad}
                </span>
                <span>{formatoPrecio(d.subtotal)}</span>
              </li>
            )
          })}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-borde pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatoPrecio(pedido.subtotal)}</dd>
          </div>
          {Number(pedido.descuento) > 0 && (
            <div className="flex justify-between">
              <dt>Descuento</dt>
              <dd>−{formatoPrecio(pedido.descuento)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Impuestos</dt>
            <dd>{formatoPrecio(pedido.impuestos)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd>{Number(pedido.costo_envio) > 0 ? formatoPrecio(pedido.costo_envio) : 'Gratis'}</dd>
          </div>
          <div className="flex justify-between border-t border-borde pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatoPrecio(pedido.total)}</dd>
          </div>
        </dl>
      </div>

      {errorPdf && (
        <p role="alert" className="mt-3 text-sm text-primario-oscuro">
          {errorPdf}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button onClick={descargarComprobante} disabled={descargando} className={botonPrimario}>
          {descargando ? 'Generando...' : 'Descargar comprobante'}
        </button>
        <Link to="/mis-pedidos" className="text-sm underline">
          Ver mis pedidos
        </Link>
        <Link to="/productos" className="text-sm underline">
          Seguir comprando
        </Link>
      </div>
    </section>
  )
}