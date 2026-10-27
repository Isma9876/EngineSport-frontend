import { Link, useLocation } from 'react-router-dom'
import { formatoPrecio } from '../utils/formato.js'
import EtiquetaEstado from './EtiquetaEstado.jsx'
import ImagenProducto from './ImagenProducto.jsx'

// Solo lee los campos públicos; precio_costo, stock, etc. nunca se muestran.
export default function TarjetaProducto({ producto }) {
  const { pathname, search } = useLocation()

  return (
    <Link
      to={`/productos/${producto.id}`}
      state={{ desde: `${pathname}${search}` }}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-borde bg-fondo transition hover:border-primario focus-visible:outline-2 focus-visible:outline-primario"
    >
      <div className="relative">
        <ImagenProducto
          src={producto.imagen_url}
          alt={producto.nombre}
          className="aspect-square w-full"
        />
        <EtiquetaEstado estado={producto.estado} className="absolute left-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-titulo text-lg font-bold uppercase leading-tight group-hover:text-primario">{producto.nombre}</h3>
        {producto.marca && <p className="text-sm text-texto-suave">{producto.marca}</p>}
        <p className="mt-auto pt-2 text-lg font-bold">{formatoPrecio(producto.precio_venta)}</p>
      </div>
    </Link>
  )
}
