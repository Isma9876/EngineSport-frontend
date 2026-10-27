import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PagoStripe from './PagoStripe.jsx'

const idDe = (d) => d.id ?? d.id_direccion
const VACIA = { direccion: '', ciudad: '', estado: '', codigo_postal: '', pais: 'Guatemala' }
const campo = 'w-full rounded border border-borde bg-fondo px-2 py-1'
const titulo = 'font-titulo text-2xl font-extrabold uppercase'
const clavePublica = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = clavePublica ? loadStripe(clavePublica) : null

// TEMPORAL: se quita cuando el login devuelva el cliente.
function idClienteLocal() {
  try {
    return JSON.parse(localStorage.getItem('cliente'))?.id ?? null
  } catch {
    return null
  }
}

export default function Checkout() {
  const { state } = useLocation()
  const { cliente } = useAuth()
  const idCliente = cliente?.id ?? idClienteLocal()
  const cupon = typeof state?.cupon === 'string' ? state.cupon : null

  const [elegida, setElegida] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(VACIA)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
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
  const {
    datos: direcciones,
    error: errDir,
    cargando: cargandoDir,
    recargar: recargarDir,
  } = useApi(idCliente ? `/api/direcciones/cliente/${idCliente}` : null)

  const lista = Array.isArray(direcciones) ? direcciones : []
  const sugerida = lista.find((d) => d.es_predeterminada) ?? lista[0]
  const elegidaId = elegida ?? (sugerida ? idDe(sugerida) : null)
  const verForm = mostrarForm || (lista.length === 0 && !cargandoDir)
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
  const cambiar = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function guardarDireccion(e) {
    e.preventDefault()
    setErrorForm('')
    if (!form.direccion.trim() || !form.ciudad.trim() || !form.estado.trim()) {
      setErrorForm('Completa dirección, ciudad y departamento.')
      return
    }
    setGuardando(true)
    try {
      const nueva = await api.post('/api/direcciones', {
        id_cliente: idCliente,
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        estado: form.estado.trim(),
        codigo_postal: form.codigo_postal.trim() || null,
        pais: form.pais.trim() || 'Guatemala',
        es_predeterminada: lista.length === 0,
      })
      setElegida(idDe(nueva))
      setForm(VACIA)
      setMostrarForm(false)
      recargarDir()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
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
  if (cargandoCarrito || (cargandoDir && !direcciones)) return <Cargando texto="Preparando tu compra..." />

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

            {errDir && (
              <p role="alert" className="mt-2 text-sm text-primario-oscuro">
                {errDir.message}{' '}
                <button onClick={recargarDir} className="underline">
                  Reintentar
                </button>
              </p>
            )}

            {lista.length > 0 && (
              <ul className="mt-3 space-y-2">
                {lista.map((d) => (
                  <li key={idDe(d)}>
                    <label className="flex cursor-pointer gap-3 rounded border border-borde p-3 has-[:checked]:border-primario">
                      <input
                        type="radio" disabled={Boolean(pedidoId)}
                        name="direccion"
                        checked={elegidaId === idDe(d)}
                        onChange={() => setElegida(idDe(d))}
                      />
                      <span className="text-sm">
                        <span className="font-semibold">{d.direccion}</span>
                        <br />
                        {[d.ciudad, d.estado, d.pais].filter(Boolean).join(', ')}
                        {d.es_predeterminada && (
                          <span className="ml-2 text-xs text-texto-suave">(predeterminada)</span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {lista.length > 0 && !verForm && (
              <button onClick={() => setMostrarForm(true)} className="mt-3 text-sm underline">
                Agregar otra dirección
              </button>
            )}

            {verForm && (
              <form onSubmit={guardarDireccion} className="mt-3 grid gap-3 rounded bg-superficie p-4 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  Dirección
                  <input value={form.direccion} onChange={cambiar('direccion')} className={campo} />
                </label>
                <label className="text-sm">
                  Ciudad
                  <input value={form.ciudad} onChange={cambiar('ciudad')} className={campo} />
                </label>
                <label className="text-sm">
                  Departamento
                  <input value={form.estado} onChange={cambiar('estado')} className={campo} />
                </label>
                <label className="text-sm">
                  Código postal (opcional)
                  <input value={form.codigo_postal} onChange={cambiar('codigo_postal')} className={campo} />
                </label>
                <label className="text-sm">
                  País
                  <input value={form.pais} onChange={cambiar('pais')} className={campo} />
                </label>
                {errorForm && (
                  <p role="alert" className="text-sm text-primario-oscuro sm:col-span-2">
                    {errorForm}
                  </p>
                )}
                <div className="flex gap-3 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="rounded bg-primario px-4 py-2 font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40"
                  >
                    {guardando ? 'Guardando...' : 'Guardar dirección'}
                  </button>
                  {lista.length > 0 && (
                    <button type="button" onClick={() => setMostrarForm(false)} className="text-sm underline">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}
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