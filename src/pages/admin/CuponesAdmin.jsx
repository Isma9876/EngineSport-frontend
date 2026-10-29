import { useEffect, useRef, useState } from 'react'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'

const campo = 'w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm'
const boton = 'rounded-lg border border-borde px-3 py-1 text-sm font-semibold hover:bg-superficie disabled:opacity-40'
const VACIO = { codigo: '', descripcion: '', tipo: 'porcentaje', valor: '', inicio: '', fin: '', usos: '', minimo: '' }
const ESTADOS = ['Activo', 'Programado', 'Vencido', 'Agotado', 'Inactivo']

const fecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT', { dateStyle: 'medium' }) : '-')

// ISO -> "aaaa-mm-dd" en hora local, para los <input type="date">
function aFechaLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function estadoCupon(c) {
  const ahora = new Date()
  if (!c.activo) return { texto: 'Inactivo', clase: 'bg-gray-100 text-gray-700' }
  if (c.vigencia_fin && new Date(c.vigencia_fin) < ahora) return { texto: 'Vencido', clase: 'bg-red-100 text-red-700' }
  if (c.vigencia_inicio && new Date(c.vigencia_inicio) > ahora)
    return { texto: 'Programado', clase: 'bg-sky-100 text-sky-700' }
  if (c.usos_maximos != null && c.usos_actuales >= c.usos_maximos)
    return { texto: 'Agotado', clase: 'bg-amber-100 text-amber-800' }
  return { texto: 'Activo', clase: 'bg-green-100 text-green-700' }
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

function MenuAcciones({ cupon, ocupado, onEditar, onAlternar }) {
  const [pos, setPos] = useState(null) // null = cerrado
  const botonRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!pos) return
    const cerrar = () => setPos(null)
    const fuera = (e) => {
      if (!menuRef.current?.contains(e.target) && !botonRef.current?.contains(e.target)) cerrar()
    }
    const tecla = (e) => {
      if (e.key === 'Escape') {
        cerrar()
        botonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    window.addEventListener('scroll', cerrar, true)
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
      window.removeEventListener('scroll', cerrar, true)
      window.removeEventListener('resize', cerrar)
    }
  }, [pos])

  function alternarMenu() {
    if (pos) return setPos(null)
    const r = botonRef.current.getBoundingClientRect()
    const derecha = window.innerWidth - r.right
    // Si no cabe abajo, se abre hacia arriba
    if (r.bottom + 110 > window.innerHeight) setPos({ right: derecha, bottom: window.innerHeight - r.top + 4 })
    else setPos({ right: derecha, top: r.bottom + 4 })
  }

  const item = 'block w-full px-4 py-2 text-left text-sm hover:bg-superficie'

  return (
    <>
      <button
        ref={botonRef}
        onClick={alternarMenu}
        disabled={ocupado}
        aria-haspopup="menu"
        aria-expanded={Boolean(pos)}
        className={`${boton} whitespace-nowrap`}      >
        {ocupado ? 'Procesando...' : 'Acciones ▾'}
      </button>
      {pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', ...pos }}
          className="z-50 w-40 rounded-lg border border-borde bg-white py-1 shadow-lg"
        >
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              setPos(null)
              onEditar()
            }}
          >
            Editar
          </button>
          <button
            role="menuitem"
            className={`${item} ${cupon.activo ? 'text-primario-oscuro' : ''}`}
            onClick={() => {
              setPos(null)
              onAlternar()
            }}
          >
            {cupon.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      )}
    </>
  )
}

export default function CuponesAdmin() {
  const { datos, error, cargando, recargar } = useApi('/api/cupones')
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(null) // cupón que se edita, o null si es nuevo
  const [f, setF] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [ocupado, setOcupado] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  const cupones = Array.isArray(datos) ? datos : []
  const visibles = filtro === 'todos' ? cupones : cupones.filter((c) => estadoCupon(c).texto === filtro)
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  function cerrarFormulario() {
    setAbierto(false)
    setEditando(null)
    setF(VACIO)
  }

  function nuevo() {
    if (abierto && !editando) return cerrarFormulario()
    setEditando(null)
    setF(VACIO)
    setMensaje(null)
    setAbierto(true)
  }

  function editar(c) {
    setEditando(c)
    setF({
      codigo: c.codigo,
      descripcion: c.descripcion ?? '',
      tipo: c.tipo,
      valor: String(Number(c.valor)),
      inicio: aFechaLocal(c.vigencia_inicio),
      fin: aFechaLocal(c.vigencia_fin),
      usos: c.usos_maximos != null ? String(c.usos_maximos) : '',
      minimo: Number(c.monto_minimo) > 0 ? String(Number(c.monto_minimo)) : '',
    })
    setMensaje(null)
    setAbierto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardar(e) {
    e.preventDefault()
    setMensaje(null)
    const codigo = f.codigo.trim().toUpperCase()
    const valor = Number(f.valor)
    if (!editando && !/^[A-Z0-9_-]{3,50}$/.test(codigo))
      return setMensaje({ ok: false, texto: 'El código debe tener de 3 a 50 caracteres: letras, números, - o _.' })
    if (!(valor > 0)) return setMensaje({ ok: false, texto: 'El valor debe ser mayor que 0.' })
    if (f.tipo === 'porcentaje' && valor > 100)
      return setMensaje({ ok: false, texto: 'Un porcentaje no puede ser mayor que 100.' })
    if (f.usos && !(Number.isInteger(Number(f.usos)) && Number(f.usos) > 0))
      return setMensaje({ ok: false, texto: 'Los usos máximos deben ser un entero mayor que 0.' })
    if (editando && f.usos && Number(f.usos) < editando.usos_actuales)
      return setMensaje({
        ok: false,
        texto: `Este cupón ya se usó ${editando.usos_actuales} vez/veces: los usos máximos no pueden ser menores.`,
      })
    if (f.inicio && f.fin && f.fin < f.inicio)
      return setMensaje({ ok: false, texto: 'La fecha final debe ser posterior a la inicial.' })

    const cuerpo = {
      descripcion: f.descripcion.trim() || null,
      tipo: f.tipo,
      valor,
      // La fecha final incluye todo ese día (hora local)
      vigencia_inicio: f.inicio ? new Date(`${f.inicio}T00:00:00`).toISOString() : null,
      vigencia_fin: f.fin ? new Date(`${f.fin}T23:59:59`).toISOString() : null,
      usos_maximos: f.usos ? Number(f.usos) : null,
      monto_minimo: f.minimo ? Number(f.minimo) : 0,
    }

    setGuardando(true)
    try {
      if (editando) {
        await api.put(`/api/cupones/${editando.id_cupon}`, cuerpo)
        setMensaje({ ok: true, texto: `Cupón ${editando.codigo} actualizado.` })
      } else {
        await api.post('/api/cupones', { codigo, ...cuerpo })
        setMensaje({ ok: true, texto: `Cupón ${codigo} creado.` })
      }
      cerrarFormulario()
      recargar()
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  async function alternar(c) {
    const activar = !c.activo
    if (!activar && !window.confirm(`¿Desactivar el cupón ${c.codigo}? Los pedidos anteriores no se afectan.`)) return
    setOcupado(c.id_cupon)
    setMensaje(null)
    try {
      await api.put(`/api/cupones/${c.id_cupon}`, { activo: activar })
      setMensaje({ ok: true, texto: `Cupón ${c.codigo} ${activar ? 'activado' : 'desactivado'}.` })
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
          <h1 className="font-titulo text-3xl font-extrabold uppercase">Cupones</h1>
          <p className="mt-1 text-sm text-texto-suave">Códigos de descuento para el carrito. El servidor valida y calcula siempre.</p>
        </div>
        <button
          onClick={nuevo}
          className="rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-white hover:bg-primario-oscuro"
        >
          {abierto && !editando ? 'Cerrar formulario' : 'Nuevo cupón'}
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
            {editando ? `Editar cupón ${editando.codigo}` : 'Nuevo cupón'}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Etiqueta
              texto="Código"
              ayuda={editando ? 'El código no se puede cambiar.' : 'Se guarda en mayúsculas. Ej.: VERANO10'}
            >
              <input
                value={f.codigo}
                onChange={cambiar('codigo')}
                disabled={Boolean(editando)}
                className={`${campo} mt-1 uppercase disabled:bg-superficie disabled:text-texto-suave`}
                maxLength={50}
              />
            </Etiqueta>
            <Etiqueta texto="Tipo de descuento">
              <select value={f.tipo} onChange={cambiar('tipo')} className={`${campo} mt-1`}>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto">Monto fijo (Q)</option>
              </select>
            </Etiqueta>
            <Etiqueta texto={f.tipo === 'porcentaje' ? 'Valor (%)' : 'Valor (Q)'}>
              <input type="number" min="0" step="0.01" value={f.valor} onChange={cambiar('valor')} className={`${campo} mt-1`} />
            </Etiqueta>
            <Etiqueta texto="Válido desde" ayuda="Opcional">
              <input type="date" value={f.inicio} onChange={cambiar('inicio')} className={`${campo} mt-1`} />
            </Etiqueta>
            <Etiqueta texto="Válido hasta" ayuda="Opcional. Incluye todo ese día.">
              <input type="date" value={f.fin} onChange={cambiar('fin')} className={`${campo} mt-1`} />
            </Etiqueta>
            <Etiqueta texto="Usos máximos" ayuda="Vacío = ilimitado">
              <input type="number" min="1" step="1" value={f.usos} onChange={cambiar('usos')} className={`${campo} mt-1`} />
            </Etiqueta>
            <Etiqueta texto="Compra mínima (Q)" ayuda="Vacío = sin mínimo">
              <input type="number" min="0" step="0.01" value={f.minimo} onChange={cambiar('minimo')} className={`${campo} mt-1`} />
            </Etiqueta>
            <div className="sm:col-span-2">
              <Etiqueta texto="Descripción" ayuda="Opcional. Solo la ven los empleados.">
                <input value={f.descripcion} onChange={cambiar('descripcion')} className={`${campo} mt-1`} maxLength={200} />
              </Etiqueta>
            </div>
          </div>
          {editando && (
            <p className="mt-4 text-xs text-texto-suave">
              Los cambios aplican a compras nuevas. Los pedidos que ya usaron este cupón no se modifican.
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primario px-5 py-2 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cupón'}
            </button>
            <button type="button" onClick={cerrarFormulario} className={boton}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="rounded-xl border border-borde bg-white p-6 shadow-sm sm:p-8">
        {cargando && !datos && <Cargando texto="Cargando cupones..." />}
        {error && (
          <p role="alert">
            {error.message}{' '}
            <button onClick={recargar} className="font-semibold underline">
              Reintentar
            </button>
          </p>
        )}
        {datos && cupones.length === 0 && (
          <p className="text-texto-suave">Aún no hay cupones. Crea el primero con "Nuevo cupón".</p>
        )}

        {cupones.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                aria-label="Filtrar por estado"
                className="rounded-lg border border-borde bg-white px-3 py-1.5 text-sm"
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              {filtro !== 'todos' && (
                <button onClick={() => setFiltro('todos')} className="text-sm underline">
                  Limpiar filtro
                </button>
              )}
              <span className="text-sm text-texto-suave">{visibles.length} cupón(es)</span>
            </div>

            {visibles.length === 0 ? (
              <p className="text-texto-suave">Ningún cupón está en estado «{filtro}».</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-borde">
                <table className="w-full text-left text-sm">
                  <thead className="bg-superficie">
                    <tr className="border-b border-borde">
                      <th className="px-4 py-3 font-semibold">Código</th>
                      <th className="px-4 py-3 font-semibold">Descuento</th>
                      <th className="px-4 py-3 font-semibold">Vigencia</th>
                      <th className="px-4 py-3 font-semibold">Usos</th>
                      <th className="px-4 py-3 font-semibold">Mínimo</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((c) => {
                      const est = estadoCupon(c)
                      return (
                        <tr key={c.id_cupon} className="border-b border-borde align-top last:border-0 hover:bg-superficie">
                          <td className="px-4 py-3">
                            <p className="font-semibold">{c.codigo}</p>
                            {c.descripcion && <p className="text-xs text-texto-suave">{c.descripcion}</p>}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {c.tipo === 'porcentaje' ? `${Number(c.valor)} %` : formatoPrecio(c.valor)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {c.vigencia_inicio || c.vigencia_fin
                              ? `${fecha(c.vigencia_inicio)} a ${fecha(c.vigencia_fin)}`
                              : 'Sin límite'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {c.usos_actuales} / {c.usos_maximos ?? '∞'}
                          </td>
                          <td className="px-4 py-3">{Number(c.monto_minimo) > 0 ? formatoPrecio(c.monto_minimo) : '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${est.clase}`}>{est.texto}</span>
                          </td>
                          <td className="px-4 py-3">
                          <MenuAcciones
                            cupon={c}
                            ocupado={ocupado === c.id_cupon}
                            onEditar={() => editar(c)}
                            onAlternar={() => alternar(c)}
                          />
                        </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}