import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'

const LIMITE = 10
const titulo = 'font-titulo text-2xl font-extrabold uppercase'
const boton = 'rounded border border-borde px-3 py-1 text-sm disabled:opacity-40'

const FILTROS = [
  { valor: '', texto: 'Todos' },
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'pagado', texto: 'Pagados' },
  { valor: 'enviado', texto: 'Enviados' },
  { valor: 'cancelado', texto: 'Cancelados' },
]

// Texto, color de la píldora y color de la barra lateral de cada estado (colores del tema acordado).
const ESTADOS = {
  pendiente: { texto: 'Pendiente de pago', pildora: 'bg-estado-pocas text-white', barra: 'border-l-estado-pocas' },
  pagado: { texto: 'Pagado', pildora: 'bg-estado-disponible text-white', barra: 'border-l-estado-disponible' },
  enviado: { texto: 'Enviado', pildora: 'bg-secundario text-texto-claro', barra: 'border-l-secundario' },
  cancelado: { texto: 'Cancelado', pildora: 'bg-estado-agotado text-white', barra: 'border-l-estado-agotado' },
  reembolsado: { texto: 'Reembolsado', pildora: 'bg-estado-agotado text-white', barra: 'border-l-estado-agotado' },
}

function infoEstado(pedido) {
  const clave = pedido.pago?.estado_pago === 'reembolsado' ? 'reembolsado' : pedido.estado
  return ESTADOS[clave] ?? { texto: clave, pildora: 'bg-borde text-texto', barra: 'border-l-borde' }
}

const fecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

export default function MisPedidos() {
  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [ocupado, setOcupado] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  const filtro = estado ? `&estado=${estado}` : ''
  const { datos, error, cargando, recargar } = useApi(
    `/api/pedidos/mis-pedidos?page=${pagina}&limit=${LIMITE}${filtro}`,
  )

  const cambiarFiltro = (valor) => {
    setEstado(valor)
    setPagina(1)
  }

  async function descargar(id) {
    setOcupado(id)
    setErrorAccion('')
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
      setErrorAccion(e.message)
    } finally {
      setOcupado(null)
    }
  }

  async function cancelar(id) {
    setOcupado(id)
    setErrorAccion('')
    try {
      await api.put(`/api/pedidos/${id}/estado`, { estado: 'cancelado' })
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    } finally {
      setOcupado(null)
    }
  }

  const pedidos = datos?.pedidos ?? []

  return (
    <section>
      <h1 className={titulo}>Mis pedidos</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => cambiarFiltro(f.valor)}
            aria-pressed={estado === f.valor}
            className={`rounded border px-3 py-1 text-sm ${
              estado === f.valor ? 'border-primario bg-primario text-secundario' : 'border-borde'
            }`}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {errorAccion && (
        <p role="alert" className="mt-4 rounded border border-primario px-3 py-2 text-sm">
          {errorAccion}
        </p>
      )}

      {cargando && !datos && <Cargando texto="Cargando tus pedidos..." />}

      {error && (
        <p className="mt-4">
          {error.message}{' '}
          <button onClick={recargar} className="underline">
            Reintentar
          </button>
        </p>
      )}

      {datos && pedidos.length === 0 && (
        <div className="mt-6">
          <p className="text-texto-suave">
            {estado ? 'No tienes pedidos con ese estado.' : 'Todavía no tienes pedidos.'}
          </p>
          <Link
            to="/productos"
            className="mt-4 inline-block rounded bg-primario px-4 py-2 font-semibold text-secundario hover:bg-primario-oscuro"
          >
            Ver productos
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {pedidos.map((p) => {
          const info = infoEstado(p)
          return (
            <li key={p.id_pedido} className={`rounded border border-borde border-l-4 p-4 ${info.barra}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold">Pedido #{p.id_pedido}</p>
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${info.pildora}`}
                    >
                      {info.texto}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-texto-suave">{fecha(p.fecha_pedido)}</p>
                </div>
                <p className="text-lg font-bold">{formatoPrecio(p.total)}</p>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm underline">Ver detalle</summary>
                <ul className="mt-2 space-y-1 text-sm">
                  {(p.detalles ?? []).map((d) => {
                    const v = d.variante
                    const extra = [v?.talla, v?.color].filter(Boolean).join(', ')
                    return (
                      <li key={d.id_detalle} className="flex justify-between gap-2">
                        <span>
                          {v?.producto?.nombre ?? `Variante ${d.id_variante}`}
                          {extra ? ` (${extra})` : ''} × {d.cantidad}
                        </span>
                        <span>{formatoPrecio(d.subtotal)}</span>
                      </li>
                    )
                  })}
                </ul>
                <dl className="mt-2 space-y-1 border-t border-borde pt-2 text-sm">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd>{formatoPrecio(p.subtotal)}</dd>
                  </div>
                  {Number(p.descuento) > 0 && (
                    <div className="flex justify-between">
                      <dt>Descuento</dt>
                      <dd>−{formatoPrecio(p.descuento)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Impuestos</dt>
                    <dd>{formatoPrecio(p.impuestos)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Envío</dt>
                    <dd>{Number(p.costo_envio) > 0 ? formatoPrecio(p.costo_envio) : 'Gratis'}</dd>
                  </div>
                </dl>
                {p.numero_guia && (
                  <p className="mt-2 text-sm">
                    Envío con {p.transportista ?? '-'}, guía {p.numero_guia}.
                  </p>
                )}
              </details>

              <div className="mt-3 flex flex-wrap gap-3">
                {['pagado', 'enviado'].includes(p.estado) && (
                  <button onClick={() => descargar(p.id_pedido)} disabled={ocupado === p.id_pedido} className={boton}>
                    {ocupado === p.id_pedido ? 'Generando...' : 'Descargar comprobante'}
                  </button>
                )}
                {p.estado === 'pendiente' && (
                  <button onClick={() => cancelar(p.id_pedido)} disabled={ocupado === p.id_pedido} className={boton}>
                    Cancelar pedido
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {datos && datos.totalPages > 1 && (
        <div className="mt-6 flex items-center gap-4">
          <button onClick={() => setPagina((n) => n - 1)} disabled={pagina <= 1 || cargando} className={boton}>
            Anterior
          </button>
          <span className="text-sm">
            Página {datos.page} de {datos.totalPages}
          </span>
          <button
            onClick={() => setPagina((n) => n + 1)}
            disabled={pagina >= datos.totalPages || cargando}
            className={boton}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  )
}