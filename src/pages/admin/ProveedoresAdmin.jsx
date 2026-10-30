import { useState } from 'react'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import MenuAcciones from '../../components/MenuAcciones.jsx'

const campo = 'w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm'
const boton = 'rounded-lg border border-borde px-3 py-1 text-sm font-semibold hover:bg-superficie disabled:opacity-40'
const VACIO = { nombre: '', contacto: '', telefono: '', email: '', direccion: '' }

function Etiqueta({ texto, ayuda, children }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{texto}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-texto-suave">{ayuda}</span>}
    </label>
  )
}

export default function ProveedoresAdmin() {
  const { datos, error, cargando, recargar } = useApi('/api/proveedores')
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [f, setF] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [ocupado, setOcupado] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const proveedores = Array.isArray(datos)
    ? [...datos].sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa, 'es'))
    : []
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  function abrirNuevo() {
    if (abierto && editando === null) return setAbierto(false)
    setEditando(null)
    setF(VACIO)
    setAbierto(true)
  }

  function abrirEdicion(p) {
    setMensaje(null)
    setEditando(p.id)
    setF({
      nombre: p.nombre_empresa,
      contacto: p.contacto ?? '',
      telefono: p.telefono ?? '',
      email: p.email ?? '',
      direccion: p.direccion ?? '',
    })
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
    if (!nombre) return setMensaje({ ok: false, texto: 'El nombre de la empresa es obligatorio.' })

    const cuerpo = {
      nombre_empresa: nombre,
      contacto: f.contacto.trim() || null,
      telefono: f.telefono.trim() || null,
      email: f.email.trim() || null,
      direccion: f.direccion.trim() || null,
    }
    setGuardando(true)
    try {
      if (editando === null) {
        await api.post('/api/proveedores', cuerpo)
        setMensaje({ ok: true, texto: `Proveedor ${nombre} creado.` })
      } else {
        await api.put(`/api/proveedores/${editando}`, cuerpo)
        setMensaje({ ok: true, texto: `Proveedor ${nombre} actualizado.` })
      }
      cerrar()
      recargar()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(p) {
    if (!window.confirm(`¿Eliminar el proveedor ${p.nombre_empresa}? Esta acción no se puede deshacer.`)) return
    setOcupado(p.id)
    setMensaje(null)
    try {
      await api.delete(`/api/proveedores/${p.id}`)
      setMensaje({ ok: true, texto: `Proveedor ${p.nombre_empresa} eliminado.` })
      if (editando === p.id) cerrar()
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
          <h1 className="font-titulo text-3xl font-extrabold uppercase">Proveedores</h1>
          <p className="mt-1 text-sm text-texto-suave">Empresas que abastecen el catálogo.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-secundario hover:bg-primario-oscuro"
        >
          {abierto && editando === null ? 'Cerrar formulario' : 'Nuevo proveedor'}
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
            {editando === null ? 'Nuevo proveedor' : 'Editar proveedor'}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Etiqueta texto="Nombre de la empresa">
              <input value={f.nombre} onChange={cambiar('nombre')} className={`${campo} mt-1`} maxLength={255} />
            </Etiqueta>
            <Etiqueta texto="Contacto" ayuda="Opcional. Persona de contacto.">
              <input value={f.contacto} onChange={cambiar('contacto')} className={`${campo} mt-1`} maxLength={255} />
            </Etiqueta>
            <Etiqueta texto="Teléfono" ayuda="Opcional.">
              <input type="tel" value={f.telefono} onChange={cambiar('telefono')} className={`${campo} mt-1`} maxLength={255} />
            </Etiqueta>
            <Etiqueta texto="Correo electrónico" ayuda="Opcional.">
              <input type="email" value={f.email} onChange={cambiar('email')} className={`${campo} mt-1`} maxLength={255} />
            </Etiqueta>
            <div className="sm:col-span-2">
              <Etiqueta texto="Dirección" ayuda="Opcional.">
                <input value={f.direccion} onChange={cambiar('direccion')} className={`${campo} mt-1`} maxLength={255} />
              </Etiqueta>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primario px-5 py-2 text-sm font-semibold text-secundario hover:bg-primario-oscuro disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : editando === null ? 'Crear proveedor' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={cerrar} className={boton}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="rounded-xl border border-borde bg-white p-6 shadow-sm sm:p-8">
        {cargando && !datos && <Cargando texto="Cargando proveedores..." />}
        {error && (
          <p role="alert">
            {error.message}{' '}
            <button onClick={recargar} className="font-semibold underline">
              Reintentar
            </button>
          </p>
        )}
        {datos && proveedores.length === 0 && (
          <p className="text-texto-suave">Aún no hay proveedores. Crea el primero con "Nuevo proveedor".</p>
        )}

        {proveedores.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-borde">
            <table className="w-full text-left text-sm">
              <thead className="bg-superficie">
                <tr className="border-b border-borde">
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Correo</th>
                  <th className="px-4 py-3 font-semibold">Dirección</th>
                  <th className="w-px whitespace-nowrap px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr key={p.id} className="border-b border-borde align-top last:border-0 hover:bg-superficie">
                    <td className="px-4 py-3 font-semibold">{p.nombre_empresa}</td>
                    <td className="px-4 py-3">{p.contacto || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3">{p.telefono || '-'}</td>
                    <td className="px-4 py-3">{p.email || '-'}</td>
                    <td className="px-4 py-3">{p.direccion || '-'}</td>
                    <td className="w-px whitespace-nowrap px-4 py-3 text-right">
                      <MenuAcciones
                        opciones={[
                          { etiqueta: 'Editar', onClick: () => abrirEdicion(p), deshabilitada: ocupado === p.id },
                          { etiqueta: 'Eliminar', onClick: () => eliminar(p), deshabilitada: ocupado === p.id, peligrosa: true },
                        ]}
                      />
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
