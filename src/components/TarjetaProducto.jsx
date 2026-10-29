import { Link, useLocation } from 'react-router-dom'
import { formatoPrecio } from '../utils/formato.js'
import EtiquetaEstado from './EtiquetaEstado.jsx'
import ImagenProducto from './ImagenProducto.jsx'

// Solo lee los campos públicos; precio_costo, stock, etc. nunca se muestran.
// "Disponible" es lo normal, así que no se etiqueta: solo se avisa de lo que importa
// (pocas unidades / agotado).
export default function TarjetaProducto({ producto, indice = 0 }) {
  const { pathname, search } = useLocation()
  const agotado = producto.estado === 'agotado'

  return (
    <Link
      to={`/productos/${producto.id}`}
      state={{ desde: `${pathname}${search}` }}
      style={{ '--i': indice }}
      className="t-card t-rise group flex h-full flex-col overflow-hidden rounded-xl border border-borde bg-fondo hover:border-primario focus-visible:outline-2 focus-visible:outline-primario"
    >
      <div className="relative overflow-hidden bg-superficie">
        <ImagenProducto
          src={producto.imagen_url}
          alt={producto.nombre}
          className={`t-card-img aspect-[4/5] w-full ${agotado ? 'opacity-60 grayscale' : ''}`}
        />
        {producto.estado !== 'disponible' && (
          <EtiquetaEstado estado={producto.estado} className="absolute left-3 top-3" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {producto.marca && (
          <p className="text-xs font-semibold uppercase tracking-widest text-texto-suave">{producto.marca}</p>
        )}
        <h3 className="mt-1 font-titulo text-xl font-bold uppercase leading-tight">{producto.nombre}</h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="text-lg font-bold">{formatoPrecio(producto.precio_venta)}</p>
          <span className="text-sm font-semibold text-primario-oscuro opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Ver →
          </span>
        </div>
      </div>
    </Link>
  )
}
