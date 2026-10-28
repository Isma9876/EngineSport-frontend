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

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Paleta: naranja de marca como protagonista; el resto acompaña
const NARANJA = '#F4511E'
const NARANJA_SUAVE = '#FBC2AC'
const GRIS_TEXTO = '#6B7280'
const GRIS_LINEA = '#E5E7EB'
const PALETA = ['#F4511E', '#1F2937', '#F59E0B', '#0EA5E9', '#16A34A', '#8B5CF6', '#EC4899', '#64748B', '#14B8A6', '#EAB308']

const campo = 'rounded-lg border border-borde bg-white px-3 py-1.5 text-sm'

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

function Indicador({ etiqueta, valor, nota, color = '#1F2937' }) {
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

  return (
    <Tarjeta
      titulo="Ventas mensuales"
      descripcion="Solo cuentan los pedidos pagados y enviados."
      accion={
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
      }
    >
      <Estado cargando={cargando} error={error} recargar={recargar} datos={datos} />

      {datos && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador etiqueta="Total vendido" valor={formatoPrecio(totalAnio)} color={NARANJA} />
            <Indicador etiqueta="Pedidos" valor={pedidosAnio} color="#1F2937" />
            <Indicador etiqueta="Ticket promedio" valor={formatoPrecio(ticket)} color="#0EA5E9" />
            <Indicador
              etiqueta="Mejor mes"
              valor={mejor.total > 0 ? MESES_LARGO[mejor.indice] : '-'}
              nota={mejor.total > 0 ? formatoPrecio(mejor.total) : 'Sin ventas'}
              color="#16A34A"
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
                  cursor={{ fill: 'rgba(244, 81, 30, 0.08)' }}
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

  return (
    <Tarjeta titulo="Productos más vendidos" descripcion="Top 10 por unidades vendidas.">
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
                tick={{ fill: '#1F2937', fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(31, 41, 55, 0.05)' }}
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
                <LabelList dataKey="unidades" position="right" style={{ fill: '#1F2937', fontWeight: 600, fontSize: 13 }} />
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

function Existencias() {
  const [todo, setTodo] = useState(false)
  const { datos, error, cargando, recargar } = useApi('/api/reportes/estado-existencias')

  const completo = datos?.inventario_completo ?? []
  const agotadas = completo.filter((v) => v.stock <= 0).length
  const filas = (todo ? completo : datos?.detalle_bajo_minimo) ?? []

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
            <Indicador etiqueta="Variantes activas" valor={datos.total_variantes} color="#1F2937" />
            <Indicador etiqueta="Necesitan reposición" valor={datos.variantes_bajo_stock_minimo} color="#F59E0B" />
            <Indicador etiqueta="Agotadas" valor={agotadas} color="#DC2626" />
          </div>

          {filas.length === 0 ? (
            <p className="mt-6 text-texto-suave">Todo el inventario está sobre el mínimo.</p>
          ) : (
            <div className="mt-6 max-h-[28rem] overflow-auto rounded-lg border border-borde">
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

export default function ReportesAdmin() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-titulo text-3xl font-extrabold uppercase">Reportes</h1>
        <p className="mt-1 text-sm text-texto-suave">Ventas, productos destacados y estado del inventario.</p>
      </header>
      <VentasMensuales />
      <MasVendidos />
      <Existencias />
    </div>
  )
}
