import { Fragment, useState } from 'react'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'
import MenuAcciones from '../../components/MenuAcciones.jsx'

const POR_PAGINA = 15
const titulo = 'font-titulo text-2xl font-extrabold uppercase'
const boton = 'rounded border border-borde px-3 py-1 text-sm disabled:opacity-40'
const campo = 'rounded border border-borde bg-fondo px-2 py-1 text-sm'

const FILTROS = [
  { valor: '', texto: 'Todos' },
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'pagado', texto: 'Pagados' },
  { valor: 'enviado', texto: 'Enviados' },
  { valor: 'cancelado', texto: 'Cancelados' },
]

const fecha = (f) =>
  f ? new Date(f).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }) : '-'

export default function PedidosAdmin() {
  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [ocupado, setOcupado] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [envio, setEnvio] = useState(null) // { id, transportista, guia }
  const [abierto, setAbierto] = useState(null)
  const [detalles, setDetalles] = useState({})

  const { datos, error, cargando, recargar } = useApi('/api/pedidos')

  const todos = Array.isArray(datos) ? datos : []
  const filtrados = todos.filter((p) => !estado || p.estado === estado)
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  async function ejecutar(id, accion, textoOk) {
    setOcupado(id)
    setMensaje(null)
    try {
      await accion()
      setMensaje({ ok: true, texto: textoOk })
      setEnvio(null)
      setDetalles((d) => {
        const copia = { ...d }
        delete copia[id]
        return copia
      })
      recargar()
    } catch (e) {
      setMensaje({ ok: false, texto: e.message })
    } finally {
      setOcupado(null)
    }
  }

  function enviar(e) {
    e.preventDefault()
    const transportista = envio.transportista.trim()
    const numero_guia = envio.guia.trim()
    if (!transportista || !numero_guia) {
      setMensaje({ ok: false, texto: 'Indica el transportista y el número de guía.' })
      return
    }
    ejecutar(
      envio.id,
      () => api.put(`/api/pedidos/${envio.id}/estado`, { estado: 'enviado', transportista, numero_guia }),
      `Pedido #${envio.id} marcado como enviado.`,
    )
  }

  function cancelar(id) {
    if (!window.confirm(`¿Cancelar el pedido #${id}? Se libera el stock reservado.`)) return
    ejecutar(id, () => api.put(`/api/pedidos/${id}/estado`, { estado: 'cancelado' }), `Pedido #${id} cancelado.`)
  }

  function reembolsar(id) {
    if (!window.confirm(`¿Reembolsar el pedido #${id}? Se devuelve el pago y el pedido queda cancelado.`)) return
    ejecutar(id, () => api.post(`/api/pedidos/${id}/reembolso`), `Pedido #${id} reembolsado y cancelado.`)
  }

  async function verDetalle(id) {
    if (abierto === id) {
      setAbierto(null)
      return
    }
    setAbierto(id)
    if (detalles[id]) return
    try {
      const p = await api.get(`/api/pedidos/${id}`)
      setDetalles((d) => ({ ...d, [id]: p }))
    } catch (e) {
      setMensaje({ ok: false, texto: e.message })
    }
  }

  return (
    <section>
      <h1 className={titulo}>Pedidos</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => {
              setEstado(f.valor)
              setPagina(1)
            }}
            aria-pressed={estado === f.valor}
            className={`rounded border px-3 py-1 text-sm ${
              estado === f.valor ? 'border-primario bg-primario text-secundario' : 'border-borde'
            }`}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {mensaje && (
        <p
          role={mensaje.ok ? 'status' : 'alert'}
          className={`mt-4 rounded border px-3 py-2 text-sm ${mensaje.ok ? 'border-estado-disponible' : 'border-primario'}`}
        >
          {mensaje.texto}
        </p>
      )}

      {cargando && !datos && <Cargando texto="Cargando pedidos..." />}
      {error && (
        <p className="mt-4">
          {error.message}{' '}
          <button onClick={recargar} className="underline">
            Reintentar
          </button>
        </p>
      )}
      {datos && filtrados.length === 0 && <p className="mt-6 text-texto-suave">No hay pedidos con ese filtro.</p>}

      {visibles.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-borde">
                <th className="py-2 pr-3">Pedido</th>
                <th className="pr-3">Fecha</th>
                <th className="pr-3">Cliente</th>
                <th className="pr-3">Estado</th>
                <th className="pr-3">Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => {
                const id = p.id_pedido
                const trabajando = ocupado === id
                const det = detalles[id]
                return (
                  <Fragment key={id}>
                    <tr className="border-b border-borde align-top">
                      <td className="py-2 pr-3 font-semibold">#{id}</td>
                      <td className="pr-3">{fecha(p.fecha_pedido)}</td>
                      <td className="pr-3">#{p.id_cliente}</td>
                      <td className="pr-3 capitalize">{p.estado}</td>
                      <td className="pr-3">{formatoPrecio(p.total)}</td>
                      <td className="py-1">
                      <MenuAcciones
                        opciones={[
                          {
                            etiqueta: abierto === id ? 'Ocultar detalle' : 'Ver detalle',
                            onClick: () => verDetalle(id),
                          },
                          ...(p.estado === 'pagado'
                            ? [
                                {
                                  etiqueta: 'Marcar como enviado',
                                  deshabilitada: trabajando,
                                  onClick: () => setEnvio({ id, transportista: '', guia: '' }),
                                },
                                {
                                  etiqueta: 'Reembolsar',
                                  peligrosa: true,
                                  deshabilitada: trabajando,
                                  onClick: () => reembolsar(id),
                                },
                              ]
                            : []),
                          ...(p.estado === 'pendiente'
                            ? [
                                {
                                  etiqueta: 'Cancelar pedido',
                                  peligrosa: true,
                                  deshabilitada: trabajando,
                                  onClick: () => cancelar(id),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                    </tr>

                    {envio?.id === id && (
                      <tr className="border-b border-borde bg-superficie">
                        <td colSpan={6} className="p-3">
                          <form onSubmit={enviar} className="flex flex-wrap items-end gap-3">
                            <label className="text-sm">
                              Transportista
                              <input
                                value={envio.transportista}
                                onChange={(e) => setEnvio({ ...envio, transportista: e.target.value })}
                                className={`${campo} block`}
                              />
                            </label>
                            <label className="text-sm">
                              Número de guía
                              <input
                                value={envio.guia}
                                onChange={(e) => setEnvio({ ...envio, guia: e.target.value })}
                                className={`${campo} block`}
                              />
                            </label>
                            <button
                              type="submit"
                              disabled={trabajando}
                              className="rounded bg-primario px-4 py-1 font-semibold text-secundario hover:bg-primario-oscuro disabled:opacity-40"
                            >
                              {trabajando ? 'Guardando...' : 'Marcar como enviado'}
                            </button>
                            <button type="button" onClick={() => setEnvio(null)} className="text-sm underline">
                              Cancelar
                            </button>
                          </form>
                        </td>
                      </tr>
                    )}

                    {abierto === id && (
                      <tr className="border-b border-borde bg-superficie">
                        <td colSpan={6} className="p-3">
                          {!det ? (
                            <Cargando texto="Cargando detalle..." />
                          ) : (
                            <div className="text-sm">
                              <ul className="space-y-1">
                                {(det.detalles ?? []).map((d) => {
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
                              {det.numero_guia && (
                                <p className="mt-2">
                                  Envío con {det.transportista ?? '-'}, guía {det.numero_guia}.
                                </p>
                              )}
                              {det.pago && <p className="mt-1 text-texto-suave">Pago: {det.pago.estado_pago}</p>}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtrados.length > POR_PAGINA && (
        <div className="mt-6 flex items-center gap-4">
          <button onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual <= 1} className={boton}>
            Anterior
          </button>
          <span className="text-sm">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(paginaActual + 1)}
            disabled={paginaActual >= totalPaginas}
            className={boton}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  )
}