import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Cargando from '../../components/Cargando.jsx'
import SelectorDireccion from '../../components/SelectorDireccion.jsx'
import { formatoPrecio } from '../../utils/formato.js'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PagoStripe from './PagoStripe.jsx'

const titulo = 'font-titulo text-2xl font-extrabold uppercase'
const clavePublica = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = clavePublica ? loadStripe(clavePublica) : null

export default function Checkout() {
  const { state } = useLocation()
  const { cliente } = useAuth()
  const idCliente = cliente?.id ?? null
  const cupon = typeof state?.cupon === 'string' ? state.cupon : null

  const [elegida, setElegida] = useState(null)
  const [pedidoId, setPedidoId] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [totalPedido, setTotalPedido] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [errorPago, setErrorPago] = useState('')

  const rutaCarrito = `/api/carrito${cupon ? `?cupon=${encodeURIComponent(cupon)}` : ''}`
  const {
    datos: carrito,
    error: errCarrito,
    cargando: cargandoCarrito,
    recargar: recargarCarrito,
  } = useApi(rutaCarrito)

  const elegidaId = elegida

  async function iniciarPago() {
    setErrorPago('')
    if (!elegidaId) {
      setErrorPago('Elige una dirección de envío.')
      return
    }
    setProcesando(true)
    try {
      let id = pedidoId
      if (!id) {
        const pedido = await api.post('/api/pedidos', {
          id_cliente: idCliente,
          id_direccion_envio: Number(elegidaId),
          items: carrito.items.map((i) => ({ id_variante: i.id_variante, cantidad: i.cantidad })),
          codigo_cupon: cupon || undefined,
        })
        id = pedido.id ?? pedido.id_pedido
        setPedidoId(id)
      }
      const intent = await api.post('/api/pagos/intent', { id_pedido: id })
      setClientSecret(intent.client_secret)
      setTotalPedido(intent.monto)
    } catch (e) {
      setErrorPago(e.message)
    } finally {
      setProcesando(false)
    }
  }

  async function cancelarPedido() {
    setProcesando(true)
    setErrorPago('')
    try {
      if (pedidoId) await api.put(`/api/pedidos/${pedidoId}/estado`, { estado: 'cancelado' })
      setPedidoId(null)
      setClientSecret(null)
    } catch (e) {
      setErrorPago(e.message)
    } finally {
      setProcesando(false)
    }
  }

  if (!idCliente) {
    return (
      <section>
        <h1 className={titulo}>Checkout</h1>
        <p className="mt-4">No pudimos identificar tu cuenta de cliente. Cierra sesión y vuelve a entrar.</p>
      </section>
    )
  }
  if (cargandoCarrito) return <Cargando texto="Preparando tu compra..." />

  if (errCarrito) {
    return (
      <section>
        <h1 className={titulo}>Checkout</h1>
        <p className="mt-4">{errCarrito.message}</p>
        <button
          onClick={recargarCarrito}
          className="mt-4 rounded bg-primario px-4 py-2 font-semibold text-white hover:bg-primario-oscuro"
        >
          Reintentar
        </button>
      </section>
    )
  }

  const items = carrito?.items ?? []
  if (items.length === 0 || carrito.resumen.lineas_con_problema > 0) {
    return (
      <section>
        <h1 className={titulo}>Checkout</h1>
        <p className="mt-4 text-texto-suave">
          {items.length === 0
            ? 'Tu carrito está vacío.'
            : 'Hay productos con aviso en tu carrito. Resuélvelos antes de pagar.'}
        </p>
        <Link
          to={items.length === 0 ? '/productos' : '/carrito'}
          className="mt-4 inline-block rounded bg-primario px-4 py-2 font-semibold text-white hover:bg-primario-oscuro"
        >
          {items.length === 0 ? 'Ver productos' : 'Volver al carrito'}
        </Link>
      </section>
    )
  }

  const r = carrito.resumen

  return (
    <section>
      <h1 className={titulo}>Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="font-titulo text-xl font-bold uppercase">Dirección de envío</h2>
            <SelectorDireccion
              idCliente={idCliente}
              valor={elegida}
              onChange={setElegida}
              deshabilitado={Boolean(pedidoId)}
            />
          </div>

          <div>
            <h2 className="font-titulo text-xl font-bold uppercase">Pago</h2>
            {errorPago && (
              <p role="alert" className="mt-2 text-sm text-primario-oscuro">
                {errorPago}
              </p>
            )}
            {!stripePromise ? (
              <p className="mt-2 text-sm">Falta VITE_STRIPE_PUBLISHABLE_KEY en tu .env.</p>
            ) : !clientSecret ? (
              <button
                onClick={iniciarPago}
                disabled={procesando || !elegidaId}
                className="mt-3 rounded bg-primario px-5 py-2 font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40"
              >
                {procesando ? 'Preparando pago...' : `Pagar ${formatoPrecio(r.total)}`}
              </button>
            ) : (
              <div className="mt-3">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PagoStripe
                    idPedido={pedidoId}
                    total={totalPedido}
                    onCancelar={cancelarPedido}
                    bloqueado={procesando}
                  />
                </Elements>
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded bg-superficie p-4">
          <h2 className="font-titulo text-xl font-bold uppercase">Tu pedido</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {items.map((it) => (
              <li key={it.id_variante} className="flex justify-between gap-2">
                <span>
                  {it.producto?.nombre} × {it.cantidad}
                </span>
                <span>{formatoPrecio(it.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-borde pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatoPrecio(r.subtotal)}</dd>
            </div>
            {Number(r.descuento) > 0 && (
              <div className="flex justify-between">
                <dt>Descuento</dt>
                <dd>−{formatoPrecio(r.descuento)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Impuestos</dt>
              <dd>{formatoPrecio(r.impuestos)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd>{Number(r.costo_envio) > 0 ? formatoPrecio(r.costo_envio) : 'Gratis'}</dd>
            </div>
            <div className="flex justify-between border-t border-borde pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatoPrecio(r.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  )
}