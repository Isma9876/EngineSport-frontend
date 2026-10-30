import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Cargando from '../../components/Cargando.jsx'
import EtiquetaEstado from '../../components/EtiquetaEstado.jsx'
import ImagenProducto from '../../components/ImagenProducto.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import useApi from '../../hooks/useApi.js'
import { formatoPrecio } from '../../utils/formato.js'
import { agregarAlCarrito } from '../../utils/carrito.js'

const boton = 'rounded border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40'
const opcion = (activa) =>
  `${boton} ${activa ? 'border-primario bg-primario text-secundario' : 'border-borde bg-fondo hover:border-primario'}`

const GENEROS = { hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex' }

function unicos(valores) {
  return [...new Set(valores.filter((v) => v != null))]
}

export default function ProductoDetalle() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  // Entrar a un detalle es una navegación nueva: empieza arriba.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const idValido = /^[1-9]\d*$/.test(id)
  const { datos: producto, error, cargando, recargar } = useApi(idValido ? `/api/productos/${id}` : null)

  const [colorElegido, setColorElegido] = useState(null)
  const [tallaElegida, setTallaElegida] = useState(null)
  // Texto mientras se escribe; se normaliza al salir del campo.
  const [cantidad, setCantidad] = useState('1')
  const [aviso, setAviso] = useState('')
  const [agregando, setAgregando] = useState(false)

  // Vuelve al listado con los mismos filtros si se llegó desde él.
  const desde = typeof state?.desde === 'string' && state.desde.startsWith('/productos') ? state.desde : '/productos'
  const volver = (
    <Link to={desde} className="text-primario-oscuro underline hover:opacity-80">
      ← Volver al catálogo
    </Link>
  )

  if (!idValido || error?.status === 400 || error?.status === 404) {
    return (
      <section className="rounded-lg bg-superficie p-6 text-center shadow-sm" role="alert">
        <h1 className="font-titulo text-xl font-extrabold uppercase">Producto no encontrado</h1>
        <p className="mt-2 text-texto-suave">
          {!idValido || error?.status === 400
            ? 'El enlace del producto no es válido.'
            : 'Este producto no existe o ya no está disponible.'}
        </p>
        <p className="mt-4">
          <Link to="/productos" className="text-primario-oscuro underline">
            Volver al catálogo
          </Link>
        </p>
      </section>
    )
  }
  if (cargando || (!producto && !error)) return <Cargando texto="Cargando producto..." />
  if (error) {
    return (
      <section className="rounded-lg bg-superficie p-6 text-center shadow-sm" role="alert">
        <p>{error.message}</p>
        <button
          type="button"
          onClick={recargar}
          className="mt-3 rounded bg-primario px-4 py-2 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white"
        >
          Reintentar
        </button>
        <p className="mt-4">{volver}</p>
      </section>
    )
  }

  // --- Variantes: primero color, luego talla. null = el atributo no aplica ---
  const variantes = Array.isArray(producto.variantes) ? producto.variantes : []
  const colores = unicos(variantes.map((v) => v.color))
  const hayColor = colores.length > 0
  const hayTalla = variantes.some((v) => v.talla != null)

  const agotada = (v) => v.estado === 'agotado'
  const delColor = (c) => variantes.filter((v) => !hayColor || v.color === c)

  // Color vigente: el elegido; si no, el primero con alguna talla disponible.
  const color = hayColor
    ? colores.includes(colorElegido)
      ? colorElegido
      : (colores.find((c) => delColor(c).some((v) => !agotada(v))) ?? colores[0])
    : null
  const variantesColor = delColor(color)

  // La talla elegida solo vale si existe y hay unidades en este color.
  const tallaValida = hayTalla && variantesColor.some((v) => v.talla === tallaElegida && !agotada(v))
  const variante = hayTalla
    ? tallaValida
      ? variantesColor.find((v) => v.talla === tallaElegida)
      : null
    : (variantesColor.find((v) => !agotada(v)) ?? variantesColor[0] ?? null)

  const imagen = variante?.imagen_url ?? variantesColor[0]?.imagen_url ?? null
  const estado = variante ? variante.estado : producto.estado
  const puedeAgregar = Boolean(variante) && !agotada(variante)

    const agregar = async () => {
    // Primero la selección: sin variante válida no se hace nada, haya sesión o no.
    if (!puedeAgregar || agregando) return
    if (usuario?.tipo !== 'cliente') {
      navigate('/login')
      return
    }
    setAgregando(true)
    setAviso('')
    try {
      await agregarAlCarrito(variante.id, Math.max(1, parseInt(cantidad, 10) || 1))
      setAviso('Agregado al carrito.')
    } catch (e) {
      setAviso(e.message)
    } finally {
      setAgregando(false)
    }
  }

  const cambiarCantidad = (valor) => {
    setCantidad(valor.replace(/\D/g, '')) // solo dígitos: sin "-", "." ni "e"
    setAviso('')
  }

  const normalizarCantidad = () => {
    const n = parseInt(cantidad, 10)
    setCantidad(String(n >= 1 ? n : 1))
  }

  return (
    <section>
      <p className="mb-4 text-sm">{volver}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <ImagenProducto
          src={imagen}
          alt={producto.nombre}
          className="aspect-square w-full rounded-lg"
        />

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-titulo text-2xl font-extrabold uppercase">{producto.nombre}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-texto-suave">
              <p>{[producto.marca, producto.categoria?.nombre].filter(Boolean).join(' · ')}</p>
              {GENEROS[producto.genero] && (
                <Link
                  to={`/productos?genero=${producto.genero}`}
                  className="rounded-full border border-borde px-2.5 py-0.5 text-xs font-semibold hover:border-primario"
                >
                  {GENEROS[producto.genero]}
                </Link>
              )}
            </div>
          </div>
          <p className="text-3xl font-bold">{formatoPrecio(producto.precio_venta)}</p>
          {producto.descripcion && <p className="text-texto-suave">{producto.descripcion}</p>}

          {hayColor && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Color: {color}</legend>
              <div className="flex flex-wrap gap-2">
                {colores.map((c) => {
                  const grupo = delColor(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={c === color}
                      disabled={grupo.every(agotada)}
                      onClick={() => {
                        setColorElegido(c)
                        setAviso('')
                      }}
                      className={`flex items-center gap-2 ${opcion(c === color)}`}
                    >
                      <ImagenProducto
                        src={grupo[0]?.imagen_url}
                        alt=""
                        className="h-8 w-8 rounded"
                      />
                      {c}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}

          {hayTalla && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">
                Talla{tallaValida ? `: ${tallaElegida}` : ''}
              </legend>
              <div className="flex flex-wrap gap-2">
                {variantesColor
                  .filter((v) => v.talla != null)
                  .map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={tallaValida && v.talla === tallaElegida}
                      disabled={agotada(v)}
                      onClick={() => {
                        setTallaElegida(v.talla)
                        setAviso('')
                      }}
                      className={opcion(tallaValida && v.talla === tallaElegida)}
                    >
                      {v.talla}
                    </button>
                  ))}
              </div>
            </fieldset>
          )}

          <div className="flex items-center gap-2" aria-live="polite">
            <EtiquetaEstado estado={estado} />
            {hayTalla && !variante && (
              <span className="text-sm text-texto-suave">Elige una talla</span>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Cantidad
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={cantidad}
                onChange={(e) => cambiarCantidad(e.target.value)}
                onBlur={normalizarCantidad}
                className="w-24 rounded border border-borde bg-fondo px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={agregar}
              disabled={!puedeAgregar || agregando}
              className="rounded bg-primario px-5 py-2 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primario disabled:hover:text-secundario"
            >
              Agregar al carrito
            </button>
          </div>
          {aviso && (
            <p role="status" className="text-sm font-medium text-texto-suave">
              {aviso}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}