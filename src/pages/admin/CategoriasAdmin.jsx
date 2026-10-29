import { useState } from 'react'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'

const campo = 'w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm'
const boton = 'rounded-lg border border-borde px-3 py-1 text-sm font-semibold hover:bg-superficie disabled:opacity-40'
const VACIO = { nombre: '', descripcion: '', padre: '' }

function Etiqueta({ texto, ayuda, children }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{texto}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-texto-suave">{ayuda}</span>}
    </label>
  )
}

export default function CategoriasAdmin() {
  const { datos, error, cargando, recargar } = useApi('/api/categorias')
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [f, setF] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [ocupado, setOcupado] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const categorias = Array.isArray(datos)
    ? [...datos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    : []
  const nombrePorId = new Map(categorias.map((c) => [c.id, c.nombre]))
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  // La propia categoría y todos sus descendientes no pueden ser su padre (con protección contra ciclos).
  const excluidas = new Set()
  if (editando !== null) {
    excluidas.add(editando)
    const pendientes = [editando]
    while (pendientes.length > 0) {
      const actual = pendientes.pop()
      for (const c of categorias) {
        if (c.id_categoria_padre === actual && !excluidas.has(c.id)) {
          excluidas.add(c.id)
          pendientes.push(c.id)
        }
      }
    }
  }

  function abrirNueva() {
    if (abierto && editando === null) return setAbierto(false)
    setMensaje(null)
    setEditando(null)
    setF(VACIO)
    setAbierto(true)
  }

  function abrirEdicion(c) {
    setMensaje(null)
    setEditando(c.id)
    setF({ nombre: c.nombre, descripcion: c.descripcion ?? '', padre: c.id_categoria_padre ? String(c.id_categoria_padre) : '' })
    setAbierto(true)
  }

  function cerrar() {
    setAbierto(false)
    setEditando(null)
    setF(VACIO)
  }

  async function guardar(e) {
    e.preventDefault()
    setMensaje(null)
    const nombre = f.nombre.trim()
    if (!nombre) return setMensaje({ ok: false, texto: 'El nombre es obligatorio.' })

    const cuerpo = {
      nombre,
      descripcion: f.descripcion.trim() || null,
      id_categoria_padre: f.padre ? Number(f.padre) : null,
    }
    setGuardando(true)
    try {
      if (editando === null) {
        await api.post('/api/categorias', cuerpo)
        setMensaje({ ok: true, texto: `Categoría ${nombre} creada.` })
      } else {
        await api.put(`/api/categorias/${editando}`, cuerpo)
        setMensaje({ ok: true, texto: `Categoría ${nombre} actualizada.` })
      }
      cerrar()
      recargar()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(c) {
    if (!window.confirm(`¿Eliminar la categoría ${c.nombre}? Esta acción no se puede deshacer.`)) return
    setOcupado(c.id)
    setMensaje(null)
    try {
      await api.delete(`/api/categorias/${c.id}`)
      setMensaje({ ok: true, texto: `Categoría ${c.nombre} eliminada.` })
      if (editando === c.id) cerrar()
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
          <h1 className="font-titulo text-3xl font-extrabold uppercase">Categorías</h1>
          <p className="mt-1 text-sm text-texto-suave">Organiza el catálogo en categorías y subcategorías.</p>
        </div>
        <button
          onClick={abrirNueva}
          className="rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-secundario hover:bg-primario-oscuro"
        >
          {abierto && editando === null ? 'Cerrar formulario' : 'Nueva categoría'}
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
        <form onSubmit={guardar} className="rounded-xl border border-borde border-t-4 border-t-primario bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-titulo text-xl font-extrabold uppercase">
            {editando === null ? 'Nueva categoría' : 'Editar categoría'}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Etiqueta texto="Nombre">
              <input value={f.nombre} onChange={cambiar('nombre')} className={`${campo} mt-1`} maxLength={255} />
            </Etiqueta>
            <Etiqueta texto="Categoría padre" ayuda="Opcional. Vacío = categoría principal.">
              <select value={f.padre} onChange={cambiar('padre')} className={`${campo} mt-1`}>
                <option value="">Sin padre</option>
                {categorias
                  .filter((c) => !excluidas.has(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </Etiqueta>
            <div className="sm:col-span-2">
              <Etiqueta texto="Descripción" ayuda="Opcional.">
                <input value={f.descripcion} onChange={cambiar('descripcion')} className={`${campo} mt-1`} />
              </Etiqueta>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primario px-5 py-2 text-sm font-semibold text-secundario hover:bg-primario-oscuro disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : editando === null ? 'Crear categoría' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={cerrar} className={boton}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="rounded-xl border border-borde bg-white p-6 shadow-sm sm:p-8">
        {cargando && !datos && <Cargando texto="Cargando categorías..." />}
        {error && (
          <p role="alert">
            {error.message}{' '}
            <button onClick={recargar} className="font-semibold underline">
              Reintentar
            </button>
          </p>
        )}
        {datos && categorias.length === 0 && (
          <p className="text-texto-suave">Aún no hay categorías. Crea la primera con "Nueva categoría".</p>
        )}

        {categorias.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-borde">
            <table className="w-full text-left text-sm">
              <thead className="bg-superficie">
                <tr className="border-b border-borde">
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold">Padre</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.id} className="border-b border-borde align-top last:border-0 hover:bg-superficie">
                    <td className="px-4 py-3 font-semibold">{c.nombre}</td>
                    <td className="px-4 py-3">{c.descripcion || '-'}</td>
                    <td className="px-4 py-3">
                      {c.categoriaPadre?.nombre ?? nombrePorId.get(c.id_categoria_padre) ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => abrirEdicion(c)} disabled={ocupado === c.id} className={boton}>
                          Editar
                        </button>
                        <button onClick={() => eliminar(c)} disabled={ocupado === c.id} className={boton}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
