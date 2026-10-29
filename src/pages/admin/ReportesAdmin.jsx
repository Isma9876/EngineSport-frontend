import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'
import { descargarCSV } from '../../utils/csv.js'
import { useSearchParams } from 'react-router-dom'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Colores: todos salen de las variables del @theme de index.css
const NARANJA = 'var(--color-primario)'
const NARANJA_SUAVE = 'color-mix(in srgb, var(--color-primario) 35%, white)'
const OSCURO = 'var(--color-secundario)'
const GRIS_TEXTO = 'var(--color-texto-suave)'
const GRIS_LINEA = 'var(--color-borde)'
const VERDE = 'var(--color-estado-disponible)'
const AMBAR = 'var(--color-estado-pocas)'
const ROJO = 'var(--color-primario-oscuro)'
const PALETA = [NARANJA, OSCURO, AMBAR, VERDE, ROJO, GRIS_TEXTO]

const campo = 'rounded-lg border border-borde bg-white px-3 py-1.5 text-sm'
const POR_PAGINA = 25

function Tarjeta({ titulo, descripcion, accion, children }) {
  return (
    <section className="rounded-xl border border-borde border-t-4 border-t-primario bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-titulo text-xl font-extrabold uppercase">{titulo}</h2>
          {descripcion && <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>}
        </div>
        {accion}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Indicador({ etiqueta, valor, nota, color = OSCURO }) {
  return (
    <div className="rounded-lg border border-borde bg-superficie p-4" style={{ borderLeft: `4px solid ${color}` }}>
      <p className="text-sm text-texto-suave">{etiqueta}</p>
      <p className="mt-1 font-titulo text-2xl font-extrabold" style={{ color }}>
        {valor}
      </p>
      {nota && <p className="mt-0.5 text-xs text-texto-suave">{nota}</p>}
    </div>
  )
}

function Estado({ cargando, error, recargar, datos }) {
  if (cargando && !datos) return <Cargando texto="Cargando..." />
  if (error)
    return (
      <p className="rounded-lg border border-primario px-3 py-2 text-sm" role="alert">
        {error.message}{' '}
        <button onClick={recargar} className="font-semibold underline">
          Reintentar
        </button>
      </p>
    )
  return null
}

function Globo({ active, payload, children }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-borde bg-white px-3 py-2 text-sm shadow-lg">
      {children(payload[0].payload)}
    </div>
  )
}

function BotonCSV({ onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`${campo} font-semibold hover:bg-superficie disabled:opacity-40`}>
      Descargar CSV
    </button>
  )
}

const anioActual = new Date().getFullYear()

function VentasMensuales() {
  const [anio, setAnio] = useState(anioActual)
  const { datos, error, cargando, recargar } = useApi(`/api/reportes/ventas-mensuales?anio=${anio}`)

  // Postgres devuelve COUNT/SUM como texto y solo los meses con ventas: se convierte y se rellena con 0
  const filas = datos?.ventas_por_mes ?? []
  const serie = MESES.map((nombre, i) => {
    const f = filas.find((r) => Number(r.mes) === i + 1)
    return { mes: nombre, indice: i, total: Number(f?.total_vendido ?? 0), pedidos: Number(f?.cantidad_pedidos ?? 0) }
  })
  const totalAnio = serie.reduce((s, m) => s + m.total, 0)
  const pedidosAnio = serie.reduce((s, m) => s + m.pedidos, 0)
  const mejor = serie.reduce((a, b) => (b.total > a.total ? b : a), serie[0])
  const ticket = pedidosAnio > 0 ? totalAnio / pedidosAnio : 0

  function exportar() {
    descargarCSV(`ventas-mensuales-${anio}.csv`, [
      { titulo: 'Mes', valor: (m) => MESES_LARGO[m.indice] },
      { titulo: 'Pedidos', valor: (m) => m.pedidos },
    ], serie)
  }

  return (
    <Tarjeta
      titulo="Ventas mensuales"
      descripcion="Solo cuentan los pedidos pagados y enviados."
      accion={
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Año{' '}
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className={campo}>
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={anioActual - n}>
                  {anioActual - n}
                </option>
              ))}
            </select>
          </label>
          <BotonCSV onClick={exportar} disabled={!datos} />
        </div>
      }
    >
      <Estado cargando={cargando} error={error} recargar={recargar} datos={datos} />

      {datos && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador etiqueta="Total vendido" valor={formatoPrecio(totalAnio)} color={NARANJA} />
            <Indicador etiqueta="Pedidos" valor={pedidosAnio} color={OSCURO} />
            <Indicador etiqueta="Ticket promedio" valor={formatoPrecio(ticket)} color={AMBAR} />
            <Indicador
              etiqueta="Mejor mes"
              valor={mejor.total > 0 ? MESES_LARGO[mejor.indice] : '-'}
              nota={mejor.total > 0 ? formatoPrecio(mejor.total) : 'Sin ventas'}
              color={VERDE}
            />
          </div>

          <div className="mt-8 h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRIS_LINEA} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: GRIS_LINEA }} tick={{ fill: GRIS_TEXTO, fontSize: 13 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fill: GRIS_TEXTO, fontSize: 13 }}
                  tickFormatter={(v) => `Q${v}`}
                />
                <Tooltip
                  cursor={{ fill: 'color-mix(in srgb, var(--color-primario) 8%, transparent)' }}
                  content={
                    <Globo>
                      {(d) => (
                        <>
                          <p className="font-semibold">{MESES_LARGO[d.indice]}</p>
                          <p>{formatoPrecio(d.total)}</p>
                          <p className="text-texto-suave">{d.pedidos} pedido(s)</p>
                        </>
                      )}
                    </Globo>
                  }
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {serie.map((m) => (
                    <Cell key={m.mes} fill={m.indice === mejor.indice && m.total > 0 ? NARANJA : NARANJA_SUAVE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-texto-suave">El mes con más ventas aparece en naranja intenso.</p>
        </>
      )}
    </Tarjeta>
  )
}

function MasVendidos() {
  const { datos, error, cargando, recargar } = useApi('/api/reportes/productos-mas-vendidos?limite=10')
  const serie = (Array.isArray(datos) ? datos : []).map((p) => ({
    nombre: p.nombre,
    unidades: Number(p.unidades_vendidas),
    total: Number(p.total_generado),
  }))

  function exportar() {
    descargarCSV('productos-mas-vendidos.csv', [
      { titulo: 'Producto', valor: (p) => p.nombre },
      { titulo: 'Unidades vendidas', valor: (p) => p.unidades },
    ], serie)
  }

  return (
    <Tarjeta
      titulo="Productos más vendidos"
      descripcion="Top 10 por unidades vendidas."
      accion={<BotonCSV onClick={exportar} disabled={serie.length === 0} />}
    >
      <Estado cargando={cargando} error={error} recargar={recargar} datos={datos} />
      {datos && serie.length === 0 && <p className="text-texto-suave">Aún no hay ventas registradas.</p>}

      {serie.length > 0 && (
        <div className="w-full" style={{ height: serie.length * 56 + 30 }}>
          <ResponsiveContainer>
            <BarChart data={serie} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid stroke={GRIS_LINEA} strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: GRIS_TEXTO, fontSize: 13 }} />
              <YAxis
                type="category"
                dataKey="nombre"
                width={170}
                tickLine={false}
                axisLine={false}
                tick={{ fill: OSCURO, fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--color-secundario) 5%, transparent)' }}
                content={
                  <Globo>
                    {(d) => (
                      <>
                        <p className="font-semibold">{d.nombre}</p>
                        <p>{d.unidades} unidad(es)</p>
                        <p className="text-texto-suave">{formatoPrecio(d.total)} generados</p>
                      </>
                    )}
                  </Globo>
                }
              />
              <Bar dataKey="unidades" radius={[0, 6, 6, 0]} maxBarSize={30}>
                {serie.map((p, i) => (
                  <Cell key={p.nombre} fill={PALETA[i % PALETA.length]} />
                ))}
                <LabelList dataKey="unidades" position="right" style={{ fill: OSCURO, fontWeight: 600, fontSize: 13 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Tarjeta>
  )
}

function Insignia({ stock, minimo }) {
  const base = 'rounded-full px-2.5 py-0.5 text-xs font-semibold'
  if (stock <= 0) return <span className={`${base} bg-red-100 text-red-700`}>Agotado</span>
  if (stock <= minimo) return <span className={`${base} bg-amber-100 text-amber-800`}>Stock bajo</span>
  return <span className={`${base} bg-green-100 text-green-700`}>Normal</span>
}

function estadoDe(v) {
  if (v.stock <= 0) return 'agotado'
  if (v.stock <= v.stock_minimo) return 'bajo'
  return 'normal'
}

function Existencias() {
  const [todo, setTodo] = useState(false)
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState('todos')
  const { datos, error, cargando, recargar } = useApi('/api/reportes/estado-existencias')

  const completo = datos?.inventario_completo ?? []
  const agotadas = completo.filter((v) => v.stock <= 0).length
  const base = (todo ? completo : datos?.detalle_bajo_minimo) ?? []

  const q = texto.trim().toLowerCase()
  const filas = base.filter((v) => {
    if (estado !== 'todos' && estadoDe(v) !== estado) return false
    if (!q) return true
    return `${v.producto?.nombre ?? ''} ${v.sku ?? ''}`.toLowerCase().includes(q)
  })
  const hayFiltros = q !== '' || estado !== 'todos'

  function exportar() {
    descargarCSV('existencias.csv', [
      { titulo: 'Producto', valor: (v) => v.producto?.nombre },
      { titulo: 'SKU', valor: (v) => v.sku },
      { titulo: 'Talla', valor: (v) => v.talla },
      { titulo: 'Color', valor: (v) => v.color },
      { titulo: 'Stock', valor: (v) => v.stock },
      { titulo: 'Mínimo', valor: (v) => v.stock_minimo },
      { titulo: 'Estado', valor: (v) => estadoDe(v) },
    ], filas)
  }

  return (
    <Tarjeta
      titulo="Estado de existencias"
      descripcion="Variantes en o bajo su stock mínimo, ordenadas de menor a mayor stock."
      accion={
        <button onClick={() => setTodo(!todo)} className={`${campo} font-semibold hover:bg-superficie`}>
          {todo ? 'Ver solo reposición' : 'Ver inventario completo'}
        </button>
      }
    >
      <Estado cargando={cargando} error={error} recargar={recargar} datos={datos} />

      {datos && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Indicador etiqueta="Variantes activas" valor={datos.total_variantes} color={OSCURO} />
            <Indicador etiqueta="Necesitan reposición" valor={datos.variantes_bajo_stock_minimo} color={AMBAR} />
            <Indicador etiqueta="Agotadas" valor={agotadas} color={ROJO} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar producto o SKU"
              aria-label="Buscar producto o SKU"
              className={`${campo} w-64`}
            />
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              aria-label="Filtrar por estado"
              className={campo}
            >
              <option value="todos">Todos los estados</option>
              <option value="agotado">Agotado</option>
              <option value="bajo">Stock bajo</option>
              <option value="normal">Normal</option>
            </select>
            {hayFiltros && (
              <button
                onClick={() => {
                  setTexto('')
                  setEstado('todos')
                }}
                className="text-sm underline"
              >
                Limpiar filtros
              </button>
            )}
            <span className="text-sm text-texto-suave">{filas.length} variante(s)</span>
            <div className="ml-auto">
              <BotonCSV onClick={exportar} disabled={filas.length === 0} />
            </div>
          </div>

          {filas.length === 0 ? (
            <p className="mt-6 text-texto-suave">
              {hayFiltros ? 'Ninguna variante coincide con los filtros.' : 'Todo el inventario está sobre el mínimo.'}
            </p>
          ) : (
            <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border border-borde">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-superficie">
                  <tr className="border-b border-borde">
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">SKU</th>
                    <th className="px-4 py-3 font-semibold">Talla / color</th>
                    <th className="px-4 py-3 text-right font-semibold">Stock</th>
                    <th className="px-4 py-3 text-right font-semibold">Mínimo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((v) => (
                    <tr key={v.id} className="border-b border-borde last:border-0 hover:bg-superficie">
                      <td className="px-4 py-3 font-medium">{v.producto?.nombre}</td>
                      <td className="px-4 py-3 text-texto-suave">{v.sku}</td>
                      <td className="px-4 py-3">{[v.talla, v.color].filter(Boolean).join(', ') || '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold">{v.stock}</td>
                      <td className="px-4 py-3 text-right text-texto-suave">{v.stock_minimo}</td>
                      <td className="px-4 py-3">
                        <Insignia stock={v.stock} minimo={v.stock_minimo} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Tarjeta>
  )
}

const formatoFecha = (f) =>
  new Date(f).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })

function MovimientosInventario() {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('todos')
  const [visibles, setVisibles] = useState(POR_PAGINA)
  const { datos, error, cargando, recargar } = useApi('/api/reportes/movimientos-inventario')

  const lista = Array.isArray(datos) ? datos : []
  const q = texto.trim().toLowerCase()
  const filas = lista.filter((m) => {
    if (tipo !== 'todos' && m.tipo_movimiento !== tipo) return false
    if (!q) return true
    const v = m.variante
    return `${v?.producto?.nombre ?? ''} ${v?.sku ?? ''} ${m.motivo ?? ''}`.toLowerCase().includes(q)
  })
  const hayFiltros = q !== '' || tipo !== 'todos'

  function exportar() {
    descargarCSV('movimientos-inventario.csv', [
      { titulo: 'Fecha', valor: (m) => new Date(m.fecha).toISOString() },
      { titulo: 'Producto', valor: (m) => m.variante?.producto?.nombre },
      { titulo: 'SKU', valor: (m) => m.variante?.sku },
      { titulo: 'Talla', valor: (m) => m.variante?.talla },
      { titulo: 'Color', valor: (m) => m.variante?.color },
      { titulo: 'Tipo', valor: (m) => m.tipo_movimiento },
      { titulo: 'Cantidad', valor: (m) => m.cantidad },
      { titulo: 'Motivo', valor: (m) => m.motivo },
      { titulo: 'Pedido', valor: (m) => m.id_pedido },
    ], filas)
  }

  return (
    <Tarjeta
      titulo="Movimientos de inventario"
      descripcion="Entradas y salidas de stock, de la más reciente a la más antigua."
    >
      <Estado cargando={cargando} error={error} recargar={recargar} datos={datos} />

      {datos && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                setVisibles(POR_PAGINA)
              }}
              placeholder="Buscar producto, SKU o motivo"
              aria-label="Buscar producto, SKU o motivo"
              className={`${campo} w-64`}
            />
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value)
                setVisibles(POR_PAGINA)
              }}
              aria-label="Filtrar por tipo"
              className={campo}
            >
              <option value="todos">Entradas y salidas</option>
              <option value="entrada">Solo entradas</option>
              <option value="salida">Solo salidas</option>
            </select>
            {hayFiltros && (
              <button
                onClick={() => {
                  setTexto('')
                  setTipo('todos')
                  setVisibles(POR_PAGINA)
                }}
                className="text-sm underline"
              >
                Limpiar filtros
              </button>
            )}
            <span className="text-sm text-texto-suave">{filas.length} movimiento(s)</span>
            <div className="ml-auto">
              <BotonCSV onClick={exportar} disabled={filas.length === 0} />
            </div>
          </div>

          {filas.length === 0 ? (
            <p className="mt-6 text-texto-suave">
              {hayFiltros ? 'Ningún movimiento coincide con los filtros.' : 'Aún no hay movimientos.'}
            </p>
          ) : (
            <>
              <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border border-borde">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-superficie">
                    <tr className="border-b border-borde">
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Producto</th>
                      <th className="px-4 py-3 font-semibold">Talla / color</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                      <th className="px-4 py-3 font-semibold">Motivo</th>
                      <th className="px-4 py-3 font-semibold">Pedido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.slice(0, visibles).map((m) => (
                      <tr key={m.id_movimiento} className="border-b border-borde last:border-0 hover:bg-superficie">
                        <td className="whitespace-nowrap px-4 py-3 text-texto-suave">{formatoFecha(m.fecha)}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{m.variante?.producto?.nombre ?? '-'}</span>
                          <br />
                          <span className="text-xs text-texto-suave">{m.variante?.sku}</span>
                        </td>
                        <td className="px-4 py-3">
                          {[m.variante?.talla, m.variante?.color].filter(Boolean).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              m.tipo_movimiento === 'entrada'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{m.cantidad}</td>
                        <td className="px-4 py-3">{m.motivo}</td>
                        <td className="px-4 py-3 text-texto-suave">{m.id_pedido ? `#${m.id_pedido}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visibles < filas.length && (
                <button
                  onClick={() => setVisibles((n) => n + POR_PAGINA)}
                  className={`${campo} mt-4 font-semibold hover:bg-superficie`}
                >
                  Ver más ({filas.length - visibles} restantes)
                </button>
              )}
            </>
          )}
        </>
      )}
    </Tarjeta>
  )
}

const SECCIONES = [
  { id: 'ventas', etiqueta: 'Ventas mensuales', Componente: VentasMensuales },
  { id: 'mas-vendidos', etiqueta: 'Más vendidos', Componente: MasVendidos },
  { id: 'existencias', etiqueta: 'Existencias', Componente: Existencias },
  { id: 'movimientos', etiqueta: 'Movimientos', Componente: MovimientosInventario },
]

export default function ReportesAdmin() {
  const [params, setParams] = useSearchParams()
  const activa = SECCIONES.find((s) => s.id === params.get('seccion')) ?? SECCIONES[0]
  const Activa = activa.Componente

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-extrabold uppercase">Reportes</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Ventas, productos destacados, estado del inventario y sus movimientos.
        </p>
      </header>

      <div role="tablist" aria-label="Reportes" className="flex gap-1 overflow-x-auto border-b border-borde">
        {SECCIONES.map((s) => {
          const seleccionada = s.id === activa.id
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={seleccionada}
              onClick={() => setParams({ seccion: s.id }, { replace: true })}
              className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-semibold ${
                seleccionada
                  ? 'border-primario text-primario'
                  : 'border-transparent text-texto-suave hover:text-texto'
              }`}
            >
              {s.etiqueta}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">
        <Activa />
      </div>
    </div>
  )
}