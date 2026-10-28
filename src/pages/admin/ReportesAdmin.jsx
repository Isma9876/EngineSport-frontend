import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'

const titulo = 'font-titulo text-2xl font-extrabold uppercase'
const subtitulo = 'font-titulo text-xl font-extrabold uppercase'
const campo = 'rounded border border-borde bg-fondo px-2 py-1 text-sm'
const COLOR = '#F4511E' // ajusta al color primario de tu tema

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function Estado({ cargando, error, recargar, datos }) {
  if (cargando && !datos) return <Cargando texto="Cargando..." />
  if (error)
    return (
      <p className="mt-4">
        {error.message}{' '}
        <button onClick={recargar} className="underline">
          Reintentar
        </button>
      </p>
    )
  return null
}

function VentasMensuales() {
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual)
  const { datos, error, cargando, recargar } = useApi(`/api/reportes/ventas-mensuales?anio=${anio}`)

  // Postgres devuelve COUNT/SUM como texto y solo los meses con ventas: se convierte y se rellena con 0
  const filas = datos?.ventas_por_mes ?? []
  const serie = MESES.map((nombre, i) => {
    const f = filas.find((r) => Number(r.mes) === i + 1)
    return {
      mes: nombre,
      total: Number(f?.total_vendido ?? 0),
      pedidos: Number(f?.cantidad_pedidos ?? 0),
    }
  })
  const totalAnio = serie.reduce((s, m) => s + m.total, 0)

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={subtitulo}>Ventas mensuales</h2>
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
      </div>

      <Estado cargando={cargando} error={error} recargar={recargar} datos={datos} />

      {datos && (
        <>
          <p className="mt-2 text-sm text-texto-suave">
            Total del año: <strong>{formatoPrecio(totalAnio)}</strong> (pedidos pagados y enviados)
          </p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={serie}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `Q${v}`} width={70} />
                <Tooltip
                  formatter={(v, nombre) => (nombre === 'Total vendido' ? formatoPrecio(v) : v)}
                />
                <Bar dataKey="total" name="Total vendido" fill={COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

function MasVendidos() {
  const { datos, error, cargando, recargar } = useApi('/api/reportes/productos-mas-vendidos?limite=10')
  const serie = (Array.isArray(datos) ? datos : []).map((p) => ({
    nombre: p.nombre,
    unidades: Number(p.unidades_vendidas),
  }))

  return (
    <div className="mt-12">
      <h2 className={subtitulo}>Productos más vendidos</h2>
      <Estado cargando={cargando} error={error} recargar={recargar} datos={datos} />
      {datos && serie.length === 0 && <p className="mt-4 text-texto-suave">Aún no hay ventas.</p>}
      {serie.length > 0 && (
        <div className="mt-4 w-full" style={{ height: serie.length * 40 + 40 }}>
          <ResponsiveContainer>
            <BarChart data={serie} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="nombre" width={160} />
              <Tooltip />
              <Bar dataKey="unidades" name="Unidades vendidas" fill={COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function Existencias() {
  const [todo, setTodo] = useState(false)
  const { datos, error, cargando, recargar } = useApi('/api/reportes/estado-existencias')
  const filas = todo ? datos?.inventario_completo : datos?.detalle_bajo_minimo

  return (
    <div className="mt-12">
      <h2 className={subtitulo}>Estado de existencias</h2>
      <Estado cargando={cargando} error={error} recargar={recargar} datos={datos} />

      {datos && (
        <>
          <p className="mt-2 text-sm">
            {datos.variantes_bajo_stock_minimo} de {datos.total_variantes} variantes están en o bajo su
            stock mínimo.
          </p>
          <button onClick={() => setTodo(!todo)} className="mt-2 text-sm underline">
            {todo ? 'Ver solo las que necesitan reposición' : 'Ver inventario completo'}
          </button>

          {(filas ?? []).length === 0 ? (
            <p className="mt-4 text-texto-suave">Todo el inventario está sobre el mínimo.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-borde">
                    <th className="py-2 pr-3">Producto</th>
                    <th className="pr-3">SKU</th>
                    <th className="pr-3">Talla / color</th>
                    <th className="pr-3">Stock</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((v) => {
                    const bajo = v.stock <= v.stock_minimo
                    return (
                      <tr key={v.id} className="border-b border-borde">
                        <td className="py-2 pr-3">{v.producto?.nombre}</td>
                        <td className="pr-3">{v.sku}</td>
                        <td className="pr-3">{[v.talla, v.color].filter(Boolean).join(', ') || '-'}</td>
                        <td className={`pr-3 ${bajo ? 'font-bold text-primario' : ''}`}>{v.stock}</td>
                        <td>{v.stock_minimo}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ReportesAdmin() {
  return (
    <section>
      <h1 className={titulo}>Reportes</h1>
      <VentasMensuales />
      <MasVendidos />
      <Existencias />
    </section>
  )
}