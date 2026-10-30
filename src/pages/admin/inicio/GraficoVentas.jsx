import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatoPrecio } from '../../../utils/formato.js'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const NARANJA = 'var(--color-primario)'
const NARANJA_SUAVE = 'color-mix(in srgb, var(--color-primario) 35%, white)'
const GRIS_TEXTO = 'var(--color-texto-suave)'
const GRIS_LINEA = 'var(--color-borde)'

// Se carga con React.lazy desde Admin.jsx para no meter recharts en el bundle principal
export default function GraficoVentas({ filas }) {
  // Postgres devuelve SUM/COUNT como texto y solo los meses con ventas: se rellena con 0
  const serie = MESES.map((mes, i) => {
    const f = filas.find((r) => Number(r.mes) === i + 1)
    return { mes, total: Number(f?.total_vendido ?? 0), pedidos: Number(f?.cantidad_pedidos ?? 0) }
  })
  const maximo = Math.max(...serie.map((m) => m.total))

  return (
    <div className="h-56 w-full" role="img" aria-label="Gráfico de barras de ventas por mes del año actual">
      <ResponsiveContainer>
        <BarChart data={serie} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRIS_LINEA} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="mes"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: GRIS_LINEA }}
            tick={{ fill: GRIS_TEXTO, fontSize: 11 }}
          />
          <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: GRIS_TEXTO, fontSize: 11 }} tickFormatter={(v) => `Q${v}`} />
          <Tooltip
            cursor={{ fill: 'color-mix(in srgb, var(--color-primario) 8%, transparent)' }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-borde bg-white px-3 py-2 text-sm shadow-lg">
                  <p className="font-semibold">{payload[0].payload.mes}</p>
                  <p>{formatoPrecio(payload[0].payload.total)}</p>
                  <p className="text-xs text-texto-suave">
                    {payload[0].payload.pedidos} {payload[0].payload.pedidos === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {serie.map((m) => (
              <Cell key={m.mes} fill={maximo > 0 && m.total === maximo ? NARANJA : NARANJA_SUAVE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
