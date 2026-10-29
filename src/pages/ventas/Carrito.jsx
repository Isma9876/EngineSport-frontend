import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import ImagenProducto from '../../components/ImagenProducto.jsx'
import PasosCompra from '../../components/PasosCompra.jsx'
import TarjetaProducto from '../../components/TarjetaProducto.jsx'
import { formatoPrecio } from '../../utils/formato.js'

const MAX_CANTIDAD = 99

function avisoDeLinea(item) {
  if (item.estado === 'agotado') return 'Agotado. Quítalo para continuar.'
  if (item.estado === 'no_disponible') return 'Ya no está disponible. Quítalo para continuar.'
  if (item.estado === 'stock_insuficiente') {
    return `Solo quedan ${item.stock_disponible} unidades. Ajusta la cantidad.`
  }
  return null
}

function IconoPapelera() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function IconoCarritoGrande() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-20 w-20"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
    </svg>
  )
}

export default function Carrito() {
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [cupon, setCupon] = useState('')
  const [override, setOverride] = useState(null)
  const [ocupado, setOcupado] = useState(null)
  const [errorAccion, setErrorAccion] = useState(null)

  const sufijo = cupon ? `?cupon=${encodeURIComponent(cupon)}` : ''
  const ruta = `/api/carrito${sufijo}`
  const { datos, error, cargando, recargar } = useApi(ruta)

  // PUT y DELETE devuelven el carrito completo: se usa esa respuesta sin volver a pedirlo.
  const carrito = override?.ruta === ruta ? override.datos : datos

  // Productos sugeridos: solo se piden cuando el carrito está vacío.
  const vacio = Boolean(carrito) && (carrito.items ?? []).length === 0
  const { datos: datosSugeridos } = useApi(vacio ? '/api/productos?limit=4&disponible=true' : null)
  const sugeridos = datosSugeridos?.productos ?? []

  async function ejecutar(clave, accion) {
    setOcupado(clave)
    setErrorAccion(null)
    try {
      const nuevo = await accion()
      setOverride({ ruta, datos: nuevo })
    } catch (e) {
      setErrorAccion(e.message)
    } finally {
      setOcupado(null)
    }
  }

  const cambiarCantidad = (item, nueva) => {
    if (nueva < 1 || nueva > MAX_CANTIDAD) return
    ejecutar(item.id_variante, () =>
      api.put(`/api/carrito/items/${item.id_variante}${sufijo}`, { cantidad: nueva }),
    )
  }

  const quitar = (item) =>
    ejecutar(item.id_variante, () => api.delete(`/api/carrito/items/${item.id_variante}${sufijo}`))

  const vaciar = () => ejecutar('todo', () => api.delete('/api/carrito'))

  const aplicarCupon = (e) => {
    e.preventDefault()
    setErrorAccion(null)
    setCupon(codigo.trim())
  }

  const quitarCupon = () => {
    setErrorAccion(null)
    setCodigo('')
    setCupon('')
  }

  if (cargando && !carrito) return <Cargando texto="Cargando tu carrito..." />

  if (error && !carrito) {
    return (
      <section>
        <h1 className="font-titulo text-2xl font-extrabold uppercase">Carrito</h1>
        <p className="mt-4 text-texto">{error.message}</p>
        <button
          onClick={recargar}
          className="mt-4 rounded bg-primario px-4 py-2 font-semibold text-white hover:bg-primario-oscuro"
        >
          Reintentar
        </button>
      </section>
    )
  }

  const items = carrito?.items ?? []

  if (items.length === 0) {
    return (
      <section>
        <h1 className="font-titulo text-2xl font-extrabold uppercase">Carrito</h1>

        <div className="mt-8 flex flex-col items-center text-center">
          <div className="rounded-full bg-superficie p-8 text-texto-suave">
            <IconoCarritoGrande />
          </div>
          <h2 className="mt-6 font-titulo text-2xl font-extrabold uppercase">Tu carrito está vacío</h2>
          <p className="mt-2 text-texto-suave">Agrega productos y aparecerán aquí.</p>
          <Link
            to="/productos"
            className="mt-5 inline-block rounded bg-primario px-5 py-2 font-semibold text-white hover:bg-primario-oscuro"
          >
            Ver productos
          </Link>
        </div>

        {sugeridos.length > 0 && (
          <div className="mt-12">
            <h2 className="font-titulo text-xl font-bold uppercase">Productos disponibles</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sugeridos.map((p) => (
                <li key={p.id}>
                  <TarjetaProducto producto={p} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    )
  }

  const r = carrito.resumen
  const hayProblemas = r.lineas_con_problema > 0

  // Envío gratis: el backend compara (subtotal - descuento), sin IVA, contra el umbral.
  const meta = Number(r.envio_gratis_desde) || 0
  const baseEnvio = Number(r.subtotal) - Number(r.descuento)
  const falta = meta - baseEnvio
  const progreso = meta > 0 ? Math.min(100, Math.max(0, (baseEnvio / meta) * 100)) : 0

  return (
    <section>
      <h1 className="font-titulo text-2xl font-extrabold uppercase">Carrito</h1>
      <PasosCompra actual={1} />

      {errorAccion && (
        <p role="alert" className="mt-4 rounded border border-primario px-3 py-2 text-sm">
          {errorAccion}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const aviso = avisoDeLinea(item)
            const trabajando = ocupado === item.id_variante || ocupado === 'todo'
            const detalle = [item.talla, item.color].filter(Boolean).join(' · ')
            const nombre = item.producto?.nombre ?? 'Producto no disponible'
            return (
              <li key={item.id_variante} className="flex gap-4 rounded border border-borde p-3">
                <ImagenProducto
                  src={item.imagen_url}
                  alt={item.producto?.nombre}
                  className="h-24 w-24 shrink-0 rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold">{nombre}</p>
                  {detalle && <p className="text-sm text-texto-suave">{detalle}</p>}
                  <p className="text-sm text-texto-suave">{formatoPrecio(item.precio_unitario)} c/u</p>

                  {item.precio_anterior !== undefined && (
                    <p className="text-sm text-estado-pocas">
                      El precio cambió (antes {formatoPrecio(item.precio_anterior)}).
                    </p>
                  )}
                  {aviso && <p className="text-sm font-semibold text-primario-oscuro">{aviso}</p>}

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => cambiarCantidad(item, item.cantidad - 1)}
                      disabled={trabajando || item.cantidad <= 1}
                      aria-label="Disminuir cantidad"
                      className="h-8 w-8 rounded border border-borde disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(item, item.cantidad + 1)}
                      disabled={trabajando || item.cantidad >= MAX_CANTIDAD}
                      aria-label="Aumentar cantidad"
                      className="h-8 w-8 rounded border border-borde disabled:opacity-40"
                    >
                      +
                    </button>
                    <button
                      onClick={() => quitar(item)}
                      disabled={trabajando}
                      aria-label={`Quitar ${nombre}`}
                      title="Quitar"
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded border border-borde text-texto-suave hover:border-primario hover:text-primario disabled:opacity-40"
                    >
                      <IconoPapelera />
                    </button>
                  </div>
                </div>
                <p className="font-semibold">{formatoPrecio(item.subtotal)}</p>
              </li>
            )
          })}
          <li>
            <button
              onClick={vaciar}
              disabled={ocupado !== null}
              className="text-sm text-texto-suave underline disabled:opacity-40"
            >
              Vaciar carrito
            </button>
          </li>
        </ul>

        <aside className="h-fit rounded bg-superficie p-4 lg:sticky lg:top-4">
          <h2 className="font-titulo text-xl font-bold uppercase">Resumen</h2>

          <form onSubmit={aplicarCupon} className="mt-3 flex gap-2">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código de cupón"
              className="min-w-0 flex-1 rounded border border-borde bg-fondo px-2 py-1"
            />
            <button type="submit" className="rounded border border-secundario px-3 py-1 text-sm font-semibold">
              Aplicar
            </button>
          </form>
          {carrito.cupon && !carrito.cupon.valido && (
            <p className="mt-1 text-sm text-primario-oscuro">{carrito.cupon.mensaje}</p>
          )}
          {carrito.cupon?.valido && (
            <p className="mt-1 text-sm text-estado-disponible">
              Cupón {carrito.cupon.codigo} aplicado. Ahorras {formatoPrecio(r.descuento)}.
            </p>
          )}
          {cupon && (
            <button type="button" onClick={quitarCupon} className="mt-1 text-sm text-texto-suave underline">
              Quitar cupón
            </button>
          )}

          <dl className="mt-4 space-y-1 text-sm">
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

          {meta > 0 && (
            <div role="status" className="mt-3 rounded bg-fondo p-3 text-sm">
              {falta > 0 ? (
                <p>
                  Te faltan <strong>{formatoPrecio(falta)}</strong> para envío gratis.
                </p>
              ) : (
                <p className="font-semibold text-estado-disponible">¡Tienes envío gratis!</p>
              )}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-borde">
                <div
                  className={`h-full rounded-full transition-all ${falta > 0 ? 'bg-primario' : 'bg-estado-disponible'}`}
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          )}

          {hayProblemas && (
            <p className="mt-3 text-sm text-primario-oscuro">
              Resuelve los productos con aviso para continuar.
            </p>
          )}
          <button
            onClick={() =>
              navigate('/checkout', { state: { cupon: carrito.cupon?.valido ? carrito.cupon.codigo : null } })
            }
            disabled={hayProblemas || ocupado !== null}
            className="mt-4 w-full rounded bg-primario px-4 py-2 font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40"
          >
            Continuar al pago
          </button>
        </aside>
      </div>
    </section>
  )
}