import { useState } from 'react'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'

const campo = 'w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm'
const boton = 'rounded-lg border border-borde px-3 py-1 text-sm font-semibold hover:bg-superficie disabled:opacity-40'
const VACIO = { codigo: '', descripcion: '', tipo: 'porcentaje', valor: '', inicio: '', fin: '', usos: '', minimo: '' }

const fecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT', { dateStyle: 'medium' }) : '-')

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

export default function CuponesAdmin() {
  const { datos, error, cargando, recargar } = useApi('/api/cupones')
  const [abierto, setAbierto] = useState(false)
  const [f, setF] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [ocupado, setOcupado] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const cupones = Array.isArray(datos) ? datos : []
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function crear(e) {
    e.preventDefault()
    setMensaje(null)
    const codigo = f.codigo.trim().toUpperCase()
    const valor = Number(f.valor)
    if (!/^[A-Z0-9_-]{3,50}$/.test(codigo))
      return setMensaje({ ok: false, texto: 'El código debe tener de 3 a 50 caracteres: letras, números, - o _.' })
    if (!(valor > 0)) return setMensaje({ ok: false, texto: 'El valor debe ser mayor que 0.' })
    if (f.tipo === 'porcentaje' && valor > 100)
      return setMensaje({ ok: false, texto: 'Un porcentaje no puede ser mayor que 100.' })
    if (f.usos && !(Number.isInteger(Number(f.usos)) && Number(f.usos) > 0))
      return setMensaje({ ok: false, texto: 'Los usos máximos deben ser un entero mayor que 0.' })
    if (f.inicio && f.fin && f.fin < f.inicio)
      return setMensaje({ ok: false, texto: 'La fecha final debe ser posterior a la inicial.' })

    setGuardando(true)
    try {
      await api.post('/api/cupones', {
        codigo,
        descripcion: f.descripcion.trim() || null,
        tipo: f.tipo,
        valor,
        // La fecha final incluye todo ese día (hora local)
        vigencia_inicio: f.inicio ? new Date(`${f.inicio}T00:00:00`).toISOString() : null,
        vigencia_fin: f.fin ? new Date(`${f.fin}T23:59:59`).toISOString() : null,
        usos_maximos: f.usos ? Number(f.usos) : null,
        monto_minimo: f.minimo ? Number(f.minimo) : 0,
      })
      setMensaje({ ok: true, texto: `Cupón ${codigo} creado.` })
      setF(VACIO)
      setAbierto(false)
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
          onClick={() => setAbierto(!abierto)}
          className="rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-white hover:bg-primario-oscuro"
        >
          {abierto ? 'Cerrar formulario' : 'Nuevo cupón'}
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
        <form onSubmit={crear} className="rounded-xl border border-borde border-t-4 border-t-primario bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-titulo text-xl font-extrabold uppercase">Nuevo cupón</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Etiqueta texto="Código" ayuda="Se guarda en mayúsculas. Ej.: VERANO10">
              <input value={f.codigo} onChange={cambiar('codigo')} className={`${campo} mt-1 uppercase`} maxLength={50} />
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
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primario px-5 py-2 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : 'Crear cupón'}
            </button>
            <button type="button" onClick={() => setAbierto(false)} className={boton}>
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
                  <th className="px-4 py-3 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cupones.map((c) => {
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
                      <td className="px-4 py-3">
                        {c.usos_actuales} / {c.usos_maximos ?? '∞'}
                      </td>
                      <td className="px-4 py-3">{Number(c.monto_minimo) > 0 ? formatoPrecio(c.monto_minimo) : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${est.clase}`}>{est.texto}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => alternar(c)} disabled={ocupado === c.id_cupon} className={boton}>
                          {c.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
