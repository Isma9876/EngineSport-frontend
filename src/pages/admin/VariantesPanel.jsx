import { useEffect, useRef, useState } from 'react'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'

const campo = 'w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm'
const boton = 'rounded-lg border border-borde px-3 py-1 text-sm font-semibold hover:bg-superficie disabled:opacity-40'
const VARIANTE_VACIA = { sku: '', talla: '', color: '', imagen_url: '', stock: '0', stock_minimo: '0', activo: true }
const AJUSTE_VACIO = { tipo: 'entrada', cantidad: '', motivo: '' }

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

// Entero >= 0; el campo vacío cuenta como 0, igual que al crear el producto
const esEnteroNoNegativo = (v) => {
  const n = Number(String(v).trim() === '' ? 0 : v)
  return Number.isInteger(n) && n >= 0
}

function Etiqueta({ texto, ayuda, children }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{texto}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-texto-suave">{ayuda}</span>}
    </label>
  )
}

const nombreVariante = (v) => [v.talla, v.color].filter(Boolean).join(' / ') || 'Única'

// Mismas reglas que el servidor. `hermanas` son las demás variantes del producto.
function validarVariante(f, hermanas) {
  const sku = limpiar(f.sku)
  if (!sku) return 'El SKU es obligatorio.'
  if (hermanas.some((v) => v.sku === sku)) return `Ya existe una variante con el SKU ${sku}.`
  if (!esEnteroNoNegativo(f.stock) || !esEnteroNoNegativo(f.stock_minimo))
    return 'El stock y el stock mínimo deben ser enteros no negativos.'
  const talla = limpiar(f.talla) || ''
  const color = limpiar(f.color) || ''
  if (hermanas.some((v) => (v.talla || '') === talla && (v.color || '') === color))
    return 'Este producto ya tiene una variante con esa combinación de talla y color.'
  return null
}

export default function VariantesPanel({ producto, onCambio, onCerrar }) {
  const { datos, error, cargando, recargar } = useApi(`/api/productos/${producto.id}`)
  // null | { modo: 'nueva' } | { modo: 'editar', id } | { modo: 'stock', id }
  const [accion, setAccion] = useState(null)
  const [f, setF] = useState(VARIANTE_VACIA)
  const [ajuste, setAjuste] = useState(AJUSTE_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [ocupado, setOcupado] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const panelRef = useRef(null)
  const formRef = useRef(null)

  const variantes = Array.isArray(datos?.variantes) ? datos.variantes : []
  const seleccionada = accion?.id != null ? variantes.find((v) => v.id === accion.id) : null

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    if (accion) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [accion])

  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const cambiarAjuste = (k) => (e) => setAjuste({ ...ajuste, [k]: e.target.value })

  // Refresca el detalle del panel y avisa al listado de productos
  function huboCambio() {
    recargar()
    onCambio()
  }

  function abrirNueva() {
    if (accion?.modo === 'nueva') return setAccion(null)
    setMensaje(null)
    setF(VARIANTE_VACIA)
    setAccion({ modo: 'nueva' })
  }

  function abrirEdicion(v) {
    setMensaje(null)
    setF({
      sku: v.sku ?? '',
      talla: v.talla ?? '',
      color: v.color ?? '',
      imagen_url: v.imagen_url ?? '',
      stock: '0',
      stock_minimo: String(v.stock_minimo ?? 0),
      activo: Boolean(v.activo),
    })
    setAccion({ modo: 'editar', id: v.id })
  }

  function abrirStock(v) {
    setMensaje(null)
    setAjuste(AJUSTE_VACIO)
    setAccion({ modo: 'stock', id: v.id })
  }

  async function guardar(e) {
    e.preventDefault()
    setMensaje(null)
    const editando = accion.modo === 'editar'
    const hermanas = variantes.filter((v) => !editando || v.id !== accion.id)
    const fallo = validarVariante(f, hermanas)
    if (fallo) return setMensaje({ ok: false, texto: fallo })

    const sku = limpiar(f.sku)
    const cuerpo = {
      sku,
      talla: limpiar(f.talla),
      color: limpiar(f.color),
      imagen_url: limpiar(f.imagen_url),
      stock_minimo: Number(f.stock_minimo === '' ? 0 : f.stock_minimo),
    }
    setGuardando(true)
    try {
      if (editando) {
        await api.put(`/api/variantes/${accion.id}`, { ...cuerpo, activo: f.activo })
        setMensaje({ ok: true, texto: `Variante ${sku} actualizada.` })
      } else {
        await api.post(`/api/productos/${producto.id}/variantes`, {
          ...cuerpo,
          stock: Number(f.stock === '' ? 0 : f.stock),
        })
        setMensaje({ ok: true, texto: `Variante ${sku} agregada.` })
      }
      setAccion(null)
      huboCambio()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  async function ajustar(e) {
    e.preventDefault()
    setMensaje(null)
    const cantidad = Number(ajuste.cantidad)
    const motivo = limpiar(ajuste.motivo)
    if (ajuste.cantidad.trim() === '' || !Number.isInteger(cantidad) || cantidad < 1)
      return setMensaje({ ok: false, texto: 'La cantidad debe ser un entero mayor que 0.' })
    if (!motivo) return setMensaje({ ok: false, texto: 'El motivo es obligatorio.' })
    if (motivo.length > 150) return setMensaje({ ok: false, texto: 'El motivo no puede pasar de 150 caracteres.' })
    if (ajuste.tipo === 'salida' && cantidad > seleccionada.stock)
      return setMensaje({
        ok: false,
        texto: `No se puede sacar ${cantidad} unidades: el stock actual es ${seleccionada.stock}.`,
      })

    setGuardando(true)
    try {
      const r = await api.post(`/api/variantes/${accion.id}/stock`, {
        tipo_movimiento: ajuste.tipo,
        cantidad,
        motivo,
      })
      const sku = r?.variante?.sku ?? seleccionada.sku
      setMensaje({
        ok: true,
        texto: `Stock ajustado (${ajuste.tipo === 'entrada' ? '+' : '-'}${cantidad}). Stock resultante de ${sku}: ${r?.variante?.stock}.`,
      })
      setAccion(null)
      huboCambio()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  async function alternar(v) {
    const activar = !v.activo
    if (!activar && !window.confirm(`¿Desactivar la variante ${v.sku}? Dejará de verse en la tienda.`)) return
    setOcupado(v.id)
    setMensaje(null)
    try {
      await api.put(`/api/variantes/${v.id}`, { activo: activar })
      setMensaje({ ok: true, texto: `Variante ${v.sku} ${activar ? 'activada' : 'desactivada'}.` })
      huboCambio()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setOcupado(null)
    }
  }

  async function eliminar(v) {
    setMensaje(null)
    if (variantes.length <= 1)
      return setMensaje({
        ok: false,
        texto: 'No se puede eliminar la última variante de un producto. Desactívala con activo: false.',
      })
    if (!window.confirm(`¿Eliminar la variante ${v.sku}? Esta acción no se puede deshacer.`)) return
    setOcupado(v.id)
    try {
      await api.delete(`/api/variantes/${v.id}`)
      setMensaje({ ok: true, texto: `Variante ${v.sku} eliminada.` })
      if (accion?.id === v.id) setAccion(null)
      huboCambio()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setOcupado(null)
    }
  }

  return (
    <section ref={panelRef} className="scroll-mt-4 space-y-5 rounded-xl border border-borde border-t-4 border-t-primario bg-white p-6 shadow-sm sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-titulo text-xl font-extrabold uppercase">Variantes</h2>
          <p className="mt-1 text-sm text-texto-suave">{producto.nombre}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={abrirNueva} className={boton}>
            {accion?.modo === 'nueva' ? 'Cancelar' : 'Agregar variante'}
          </button>
          <button onClick={onCerrar} className={boton}>
            Cerrar
          </button>
        </div>
      </header>

      {mensaje && (
        <p
          role={mensaje.ok ? 'status' : 'alert'}
          className={`rounded-lg border px-3 py-2 text-sm ${mensaje.ok ? 'border-estado-disponible' : 'border-primario'}`}
        >
          {mensaje.texto}
        </p>
      )}

      {accion && accion.modo !== 'stock' && (
        <form ref={formRef} onSubmit={guardar} className="scroll-mt-4 rounded-lg border border-borde p-4">
          <h3 className="font-semibold">{accion.modo === 'nueva' ? 'Nueva variante' : 'Editar variante'}</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Etiqueta texto="SKU">
              <input value={f.sku} onChange={cambiar('sku')} className={`${campo} mt-1`} maxLength={255} />
            </Etiqueta>
            <Etiqueta texto="Talla" ayuda="Opcional.">
              <input value={f.talla} onChange={cambiar('talla')} className={`${campo} mt-1`} maxLength={20} />
            </Etiqueta>
            <Etiqueta texto="Color" ayuda="Opcional.">
              <input value={f.color} onChange={cambiar('color')} className={`${campo} mt-1`} maxLength={50} />
            </Etiqueta>
            {accion.modo === 'nueva' && (
              <Etiqueta
                texto="Stock inicial"
                ayuda="Si es mayor que 0 se registra una entrada y la variante ya no podrá eliminarse."
              >
                <input type="number" min="0" step="1" value={f.stock} onChange={cambiar('stock')} className={`${campo} mt-1`} />
              </Etiqueta>
            )}
            <Etiqueta texto="Stock mínimo" ayuda="Igual o debajo de este valor se marca como pocas unidades.">
              <input type="number" min="0" step="1" value={f.stock_minimo} onChange={cambiar('stock_minimo')} className={`${campo} mt-1`} />
            </Etiqueta>
            <Etiqueta texto="URL de la imagen" ayuda="Opcional.">
              <input type="url" value={f.imagen_url} onChange={cambiar('imagen_url')} className={`${campo} mt-1`} />
            </Etiqueta>
          </div>
          {accion.modo === 'editar' && (
            <>
              <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />
                Activa
              </label>
              <p className="mt-3 text-xs text-texto-suave">El stock no se edita aquí: usa "Ajustar stock".</p>
            </>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primario px-5 py-2 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : accion.modo === 'nueva' ? 'Agregar variante' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setAccion(null)} className={boton}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {accion?.modo === 'stock' && seleccionada && (
        <form ref={formRef} onSubmit={ajustar} className="scroll-mt-4 rounded-lg border border-borde p-4">
          <h3 className="font-semibold">
            Ajustar stock de {seleccionada.sku} ({nombreVariante(seleccionada)})
          </h3>
          <p className="mt-1 text-sm text-texto-suave">Stock actual: {seleccionada.stock}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Etiqueta texto="Tipo de movimiento">
              <select value={ajuste.tipo} onChange={cambiarAjuste('tipo')} className={`${campo} mt-1`}>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </Etiqueta>
            <Etiqueta texto="Cantidad" ayuda="Entero, mínimo 1.">
              <input type="number" min="1" step="1" value={ajuste.cantidad} onChange={cambiarAjuste('cantidad')} className={`${campo} mt-1`} />
            </Etiqueta>
            <Etiqueta texto="Motivo" ayuda="Obligatorio, hasta 150 caracteres.">
              <input value={ajuste.motivo} onChange={cambiarAjuste('motivo')} className={`${campo} mt-1`} maxLength={150} />
            </Etiqueta>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primario px-5 py-2 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : 'Registrar ajuste'}
            </button>
            <button type="button" onClick={() => setAccion(null)} className={boton}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando && !datos && <Cargando texto="Cargando variantes..." />}
      {error && (
        <p role="alert">
          {error.message}{' '}
          <button onClick={recargar} className="font-semibold underline">
            Reintentar
          </button>
        </p>
      )}
      {datos && variantes.length === 0 && <p className="text-texto-suave">Este producto no tiene variantes.</p>}

      {variantes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-borde">
          <table className="w-full text-left text-sm">
            <thead className="bg-superficie">
              <tr className="border-b border-borde">
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Talla y color</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {variantes.map((v) => {
                const est = ESTADOS[v.estado] ?? ESTADOS.agotado
                return (
                  <tr key={v.id} className="border-b border-borde align-top last:border-0 hover:bg-superficie">
                    <td className="px-4 py-3 font-semibold">{v.sku}</td>
                    <td className="px-4 py-3">
                      <p>{nombreVariante(v)}</p>
                      {v.imagen_url && (
                        <a href={v.imagen_url} target="_blank" rel="noreferrer" className="text-xs text-texto-suave underline">
                          Ver imagen
                        </a>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-semibold">{v.stock}</p>
                      <p className="text-xs text-texto-suave">Mínimo: {v.stock_minimo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${est.clase}`}>{est.texto}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {v.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => abrirEdicion(v)} disabled={ocupado === v.id} className={boton}>
                          Editar
                        </button>
                        <button onClick={() => abrirStock(v)} disabled={ocupado === v.id} className={boton}>
                          Ajustar stock
                        </button>
                        <button onClick={() => alternar(v)} disabled={ocupado === v.id} className={boton}>
                          {v.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => eliminar(v)} disabled={ocupado === v.id} className={boton}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
