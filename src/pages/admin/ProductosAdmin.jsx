import { useEffect, useRef, useState } from 'react'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'
import VariantesPanel from './VariantesPanel.jsx'
import MenuAcciones from '../../components/MenuAcciones.jsx'

const LIMITE = 10
const campo = 'w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm'
const boton = 'rounded-lg border border-borde px-3 py-1 text-sm font-semibold hover:bg-superficie disabled:opacity-40'
const VACIO = { nombre: '', descripcion: '', marca: '', categoria: '', proveedor: '', costo: '', venta: '' }
const VARIANTE_VACIA = { sku: '', talla: '', color: '', imagen_url: '', stock: '0', stock_minimo: '0' }

const ESTADOS = {
  disponible: { texto: 'Disponible', clase: 'bg-green-100 text-green-700' },
  pocas_unidades: { texto: 'Pocas unidades', clase: 'bg-amber-100 text-amber-800' },
  agotado: { texto: 'Agotado', clase: 'bg-red-100 text-red-700' },
}

// Igual que cleanText del servidor: recorta y colapsa espacios; vacío = null
const limpiar = (v) => {
  const t = String(v ?? '').trim().replace(/\s+/g, ' ')
  return t === '' ? null : t
}

const esPrecioValido = (v) => String(v).trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0

// Ordena las categorías como árbol (cada hija bajo su padre) y calcula su nivel de sangría.
// Una categoría cuyo padre no está en la lista se trata como raíz.
function ordenarComoArbol(lista) {
  const ids = new Set(lista.map((c) => c.id))
  const hijas = new Map()
  const raices = []
  for (const c of lista) {
    const padre = c.id_categoria_padre
    if (padre != null && padre !== c.id && ids.has(padre)) hijas.set(padre, [...(hijas.get(padre) ?? []), c])
    else raices.push(c)
  }
  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es')
  const resultado = []
  const visitadas = new Set()
  const recorrer = (c, nivel) => {
    if (visitadas.has(c.id)) return
    visitadas.add(c.id)
    resultado.push({ ...c, nivel })
    for (const h of (hijas.get(c.id) ?? []).sort(porNombre)) recorrer(h, nivel + 1)
  }
  for (const r of raices.sort(porNombre)) recorrer(r, 0)
  return resultado
}

const etiquetaCategoria = (c) => '\u00A0\u00A0\u00A0'.repeat(c.nivel) + c.nombre

function Etiqueta({ texto, ayuda, children }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{texto}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-texto-suave">{ayuda}</span>}
    </label>
  )
}

export default function ProductosAdmin() {
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [q, setQ] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  const params = new URLSearchParams({ page: String(pagina), limit: String(LIMITE) })
  if (q) params.set('q', q)
  if (categoriaFiltro) params.set('categoria', categoriaFiltro)
  const { datos, error, cargando, recargar } = useApi(`/api/productos?${params}`)
  const { datos: datosCategorias } = useApi('/api/categorias')
  const { datos: datosProveedores } = useApi('/api/proveedores')

  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [f, setF] = useState(VACIO)
  const [variantes, setVariantes] = useState([{ ...VARIANTE_VACIA }])
  const [guardando, setGuardando] = useState(false)
  const [ocupado, setOcupado] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [panelVariantes, setPanelVariantes] = useState(null)

  const productos = Array.isArray(datos?.productos) ? datos.productos : []
  const totalPaginas = datos?.total_pages ?? 1
  const categorias = Array.isArray(datosCategorias) ? ordenarComoArbol(datosCategorias) : []
  const nombreCategoriaFiltro = categorias.find((c) => String(c.id) === categoriaFiltro)?.nombre
  const partesFiltro = [
    q && `que coincidan con "${q}"`,
    categoriaFiltro && `en la categoría ${nombreCategoriaFiltro ? `"${nombreCategoriaFiltro}"` : 'seleccionada'}`,
  ].filter(Boolean)
  const mensajeSinResultados =
    partesFiltro.length > 0
      ? `No hay productos ${partesFiltro.join(' ')}.`
      : 'Aún no hay productos. Crea el primero con "Nuevo producto".'
  const proveedores = Array.isArray(datosProveedores)
    ? [...datosProveedores].sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa, 'es'))
    : []

  const formRef = useRef(null)
  const copiaInicial = useRef('')

  // Lleva la vista al formulario cuando se abre o cambia de producto
  useEffect(() => {
    if (abierto) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [abierto, editando])

  const hayCambios = () => abierto && JSON.stringify({ f, variantes }) !== copiaInicial.current
  const confirmarDescarte = () => !hayCambios() || window.confirm('Tienes cambios sin guardar. ¿Descartarlos?')

  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const cambiarVariante = (i, k) => (e) =>
    setVariantes(variantes.map((v, j) => (j === i ? { ...v, [k]: e.target.value } : v)))

  function buscar(e) {
    e.preventDefault()
    setPagina(1)
    setQ(busqueda.trim())
  }

  function limpiarFiltros() {
    setBusqueda('')
    setQ('')
    setCategoriaFiltro('')
    setPagina(1)
  }

  function quitarFiltroCategoria() {
    setCategoriaFiltro('')
    setPagina(1)
  }

  function abrirNuevo() {
    if (!confirmarDescarte()) return
    if (abierto && editando === null) return setAbierto(false)
    copiaInicial.current = JSON.stringify({ f: VACIO, variantes: [{ ...VARIANTE_VACIA }] })
    setEditando(null)
    setF(VACIO)
    setVariantes([{ ...VARIANTE_VACIA }])
    setAbierto(true)
  }

  async function abrirEdicion(p) {
    if (abierto && editando === p.id) return formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (!confirmarDescarte()) return
    setMensaje(null)
    setOcupado(p.id)
    try {
      // El listado no trae la descripción: se pide el detalle
      const d = await api.get(`/api/productos/${p.id}`)
      const datosForm = {
        nombre: d.nombre ?? '',
        descripcion: d.descripcion ?? '',
        marca: d.marca ?? '',
        categoria: d.categoria?.id ? String(d.categoria.id) : '',
        proveedor: d.proveedor?.id ? String(d.proveedor.id) : '',
        costo: String(Number(d.precio_costo)),
        venta: String(Number(d.precio_venta)),
      }
      copiaInicial.current = JSON.stringify({ f: datosForm, variantes: [{ ...VARIANTE_VACIA }] })
      setEditando(p.id)
      setF(datosForm)
      setVariantes([{ ...VARIANTE_VACIA }])
      setAbierto(true)
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setOcupado(null)
    }
  }

  function cerrar() {
    setAbierto(false)
    setEditando(null)
    setF(VACIO)
    setVariantes([{ ...VARIANTE_VACIA }])
  }

  // Devuelve el texto del primer error de validación, o null (mismas reglas que el servidor)
  function validar() {
    if (!limpiar(f.nombre)) return 'El nombre es obligatorio.'
    if (!esPrecioValido(f.costo)) return 'El precio de costo debe ser un número no negativo.'
    if (!esPrecioValido(f.venta)) return 'El precio de venta debe ser un número no negativo.'
    if (Number(f.venta) <= Number(f.costo)) return 'El precio de venta debe ser mayor que el precio de costo.'
    if (editando !== null) return null

    if (variantes.length === 0) return 'El producto debe tener al menos una variante.'
    const skus = new Set()
    const combinaciones = new Set()
    for (const [i, v] of variantes.entries()) {
      const n = i + 1
      const sku = limpiar(v.sku)
      if (!sku) return `La variante ${n} necesita un SKU.`
      const stock = Number(v.stock === '' ? 0 : v.stock)
      const minimo = Number(v.stock_minimo === '' ? 0 : v.stock_minimo)
      if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(minimo) || minimo < 0)
        return `El stock y el stock mínimo de la variante ${n} deben ser enteros no negativos.`
      if (skus.has(sku)) return `El SKU ${sku} está repetido.`
      const combinacion = `${limpiar(v.talla) || ''}|${limpiar(v.color) || ''}`
      if (combinaciones.has(combinacion)) return `La variante ${n} repite una combinación de talla y color.`
      skus.add(sku)
      combinaciones.add(combinacion)
    }
    return null
  }

  async function guardar(e) {
    e.preventDefault()
    setMensaje(null)
    const fallo = validar()
    if (fallo) return setMensaje({ ok: false, texto: fallo })

    const nombre = limpiar(f.nombre)
    const cuerpo = {
      nombre,
      descripcion: f.descripcion.trim() || null,
      marca: limpiar(f.marca),
      precio_costo: Number(f.costo),
      precio_venta: Number(f.venta),
      id_categoria: f.categoria ? Number(f.categoria) : null,
      id_proveedor: f.proveedor ? Number(f.proveedor) : null,
    }
    setGuardando(true)
    try {
      if (editando === null) {
        await api.post('/api/productos', {
          ...cuerpo,
          variantes: variantes.map((v) => ({
            sku: limpiar(v.sku),
            talla: limpiar(v.talla),
            color: limpiar(v.color),
            imagen_url: limpiar(v.imagen_url),
            stock: Number(v.stock === '' ? 0 : v.stock),
            stock_minimo: Number(v.stock_minimo === '' ? 0 : v.stock_minimo),
          })),
        })
        setMensaje({ ok: true, texto: `Producto ${nombre} creado.` })
      } else {
        await api.put(`/api/productos/${editando}`, cuerpo)
        setMensaje({ ok: true, texto: `Producto ${nombre} actualizado.` })
      }
      cerrar()
      recargar()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  function alternarVariantes(p) {
    if (panelVariantes?.id === p.id) return cerrarVariantes()
    setPanelVariantes({ id: p.id, nombre: p.nombre })
  }

  // Al cerrar se recarga el listado para actualizar stock_total y total_variantes
  function cerrarVariantes() {
    setPanelVariantes(null)
    recargar()
  }

  async function alternar(p) {
    const activar = !p.activo
    if (!activar && !window.confirm(`¿Desactivar el producto ${p.nombre}? Dejará de verse en la tienda.`)) return
    setOcupado(p.id)
    setMensaje(null)
    try {
      await api.put(`/api/productos/${p.id}`, { activo: activar })
      setMensaje({ ok: true, texto: `Producto ${p.nombre} ${activar ? 'activado' : 'desactivado'}.` })
      recargar()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setOcupado(null)
    }
  }

  async function eliminar(p) {
    if (!window.confirm(`¿Eliminar el producto ${p.nombre}? Esta acción no se puede deshacer.`)) return
    setOcupado(p.id)
    setMensaje(null)
    try {
      await api.delete(`/api/productos/${p.id}`)
      setMensaje({ ok: true, texto: `Producto ${p.nombre} eliminado.` })
      if (editando === p.id) cerrar()
      if (panelVariantes?.id === p.id) setPanelVariantes(null)
      if (productos.length === 1 && pagina > 1) setPagina(pagina - 1)
      recargar()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titulo text-3xl font-extrabold uppercase">Productos</h1>
          <p className="mt-1 text-sm text-texto-suave">Catálogo completo, incluidos los productos inactivos.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-secundario hover:bg-primario-oscuro"
        >
          {abierto && editando === null ? 'Cerrar formulario' : 'Nuevo producto'}
        </button>
      </header>

      {mensaje && (
        <p
          role={mensaje.ok ? 'status' : 'alert'}
          className={`rounded-lg border px-3 py-2 text-sm ${mensaje.ok ? 'border-estado-disponible' : 'border-primario'}`}
        >
          {mensaje.texto}
        </p>
      )}

      {abierto && (
        <form ref={formRef} onSubmit={guardar} className="scroll-mt-4 rounded-xl border border-borde border-t-4 border-t-primario bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-titulo text-xl font-extrabold uppercase">
            {editando === null ? 'Nuevo producto' : 'Editar producto'}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Etiqueta texto="Nombre">
              <input value={f.nombre} onChange={cambiar('nombre')} className={`${campo} mt-1`} maxLength={255} />
            </Etiqueta>
            <Etiqueta texto="Marca" ayuda="Opcional.">
              <input value={f.marca} onChange={cambiar('marca')} className={`${campo} mt-1`} maxLength={100} />
            </Etiqueta>
            <Etiqueta texto="Categoría" ayuda="Opcional.">
              <select value={f.categoria} onChange={cambiar('categoria')} className={`${campo} mt-1`}>
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {etiquetaCategoria(c)}
                  </option>
                ))}
              </select>
            </Etiqueta>
            <Etiqueta texto="Proveedor" ayuda="Opcional.">
              <select value={f.proveedor} onChange={cambiar('proveedor')} className={`${campo} mt-1`}>
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_empresa}
                  </option>
                ))}
              </select>
            </Etiqueta>
            <Etiqueta texto="Precio de costo (Q)">
              <input type="number" min="0" step="0.01" value={f.costo} onChange={cambiar('costo')} className={`${campo} mt-1`} />
            </Etiqueta>
            <Etiqueta texto="Precio de venta (Q)" ayuda="Debe ser mayor que el costo.">
              <input type="number" min="0" step="0.01" value={f.venta} onChange={cambiar('venta')} className={`${campo} mt-1`} />
            </Etiqueta>
            <div className="sm:col-span-2 lg:col-span-3">
              <Etiqueta texto="Descripción" ayuda="Opcional.">
                <textarea value={f.descripcion} onChange={cambiar('descripcion')} rows={3} className={`${campo} mt-1`} />
              </Etiqueta>
            </div>
          </div>

          {editando === null ? (
            <fieldset className="mt-8 space-y-4">
              <legend className="font-titulo text-lg font-extrabold uppercase">Variantes</legend>
              <p className="text-xs text-texto-suave">
                Al menos una. El SKU no puede repetirse y cada combinación de talla y color debe ser única.
              </p>
              {variantes.map((v, i) => (
                <div key={i} className="rounded-lg border border-borde p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Etiqueta texto="SKU">
                      <input value={v.sku} onChange={cambiarVariante(i, 'sku')} className={`${campo} mt-1`} maxLength={255} />
                    </Etiqueta>
                    <Etiqueta texto="Talla" ayuda="Opcional.">
                      <input value={v.talla} onChange={cambiarVariante(i, 'talla')} className={`${campo} mt-1`} maxLength={20} />
                    </Etiqueta>
                    <Etiqueta texto="Color" ayuda="Opcional.">
                      <input value={v.color} onChange={cambiarVariante(i, 'color')} className={`${campo} mt-1`} maxLength={50} />
                    </Etiqueta>
                    <Etiqueta texto="Stock inicial">
                      <input type="number" min="0" step="1" value={v.stock} onChange={cambiarVariante(i, 'stock')} className={`${campo} mt-1`} />
                    </Etiqueta>
                    <Etiqueta texto="Stock mínimo" ayuda="Igual o debajo de este valor se marca como pocas unidades.">
                      <input type="number" min="0" step="1" value={v.stock_minimo} onChange={cambiarVariante(i, 'stock_minimo')} className={`${campo} mt-1`} />
                    </Etiqueta>
                    <Etiqueta texto="URL de la imagen" ayuda="Opcional.">
                      <input type="url" value={v.imagen_url} onChange={cambiarVariante(i, 'imagen_url')} className={`${campo} mt-1`} />
                    </Etiqueta>
                  </div>
                  {variantes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVariantes(variantes.filter((_, j) => j !== i))}
                      className={`${boton} mt-4`}
                    >
                      Quitar variante
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setVariantes([...variantes, { ...VARIANTE_VACIA }])} className={boton}>
                Agregar variante
              </button>
            </fieldset>
          ) : (
            <p className="mt-6 text-xs text-texto-suave">Las variantes y el stock no se editan desde aquí.</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primario px-5 py-2 text-sm font-semibold text-secundario hover:bg-primario-oscuro disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : editando === null ? 'Crear producto' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={cerrar} className={boton}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {panelVariantes && (
        <VariantesPanel key={panelVariantes.id} producto={panelVariantes} onCambio={recargar} onCerrar={cerrarVariantes} />
      )}

      <section className="space-y-5 rounded-xl border border-borde bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={buscar} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Etiqueta texto="Buscar por nombre">
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${campo} mt-1`} />
            </Etiqueta>
          </div>
          <div className="min-w-48">
            <Etiqueta texto="Categoría">
              <select
                value={categoriaFiltro}
                onChange={(e) => {
                  setPagina(1)
                  setCategoriaFiltro(e.target.value)
                }}
                className={`${campo} mt-1`}
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {etiquetaCategoria(c)}
                  </option>
                ))}
              </select>
            </Etiqueta>
          </div>
          <button type="submit" className={`${boton} py-2`}>
            Buscar
          </button>
          {(q || categoriaFiltro) && (
            <button type="button" onClick={limpiarFiltros} className={`${boton} py-2`}>
              Limpiar filtros
            </button>
          )}
        </form>

        {cargando && !datos && <Cargando texto="Cargando productos..." />}
        {error && (
          <p role="alert">
            {error.message}{' '}
            <button onClick={recargar} className="font-semibold underline">
              Reintentar
            </button>
          </p>
        )}
        {datos && productos.length === 0 && (
          <div className="space-y-3">
            <p className="text-texto-suave">{mensajeSinResultados}</p>
            {categoriaFiltro && (
              <button type="button" onClick={quitarFiltroCategoria} className={boton}>
                Quitar filtro de categoría
              </button>
            )}
          </div>
        )}

        {productos.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-borde">
            <table className="w-full text-left text-sm">
              <thead className="bg-superficie">
                <tr className="border-b border-borde">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Categoría y proveedor</th>
                  <th className="px-4 py-3 font-semibold">Venta y costo</th>
                  <th className="px-4 py-3 font-semibold">Disponibilidad y stock</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="w-px whitespace-nowrap px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const est = ESTADOS[p.estado] ?? ESTADOS.agotado
                  return (
                    <tr key={p.id} className="border-b border-borde align-top last:border-0 hover:bg-superficie">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{p.nombre}</p>
                        {p.marca && <p className="text-xs text-texto-suave">{p.marca}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p>{p.categoria?.nombre ?? '-'}</p>
                        <p className="text-xs text-texto-suave">{p.proveedor?.nombre_empresa ?? '-'}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-semibold">{formatoPrecio(p.precio_venta)}</p>
                        <p className="text-xs text-texto-suave">Costo: {formatoPrecio(p.precio_costo)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${est.clase}`}>{est.texto}</span>
                          <span className="text-xs text-texto-suave">
                            {p.total_variantes} {Number(p.total_variantes) === 1 ? 'variante' : 'variantes'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-texto-suave">Stock total: {p.stock_total}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="w-px whitespace-nowrap px-4 py-3 text-right">
                        <MenuAcciones
                          opciones={[
                            { etiqueta: 'Editar', onClick: () => abrirEdicion(p), deshabilitada: ocupado === p.id },
                            {
                              etiqueta: panelVariantes?.id === p.id ? 'Cerrar variantes' : 'Variantes',
                              onClick: () => alternarVariantes(p),
                            },
                            {
                              etiqueta: p.activo ? 'Desactivar' : 'Activar',
                              onClick: () => alternar(p),
                              deshabilitada: ocupado === p.id,
                            },
                            { etiqueta: 'Eliminar', onClick: () => eliminar(p), deshabilitada: ocupado === p.id, peligrosa: true },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {datos && totalPaginas > 1 && (
          <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Paginación">
            <button onClick={() => setPagina(pagina - 1)} disabled={pagina <= 1} className={boton}>
              Anterior
            </button>
            <span className="text-texto-suave">
              Página {datos.page} de {totalPaginas} · {datos.total} productos
            </span>
            <button onClick={() => setPagina(pagina + 1)} disabled={pagina >= totalPaginas} className={boton}>
              Siguiente
            </button>
          </nav>
        )}
      </section>
    </div>
  )
}
