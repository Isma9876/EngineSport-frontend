import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api.js'
import useApi from '../../hooks/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Cargando from '../../components/Cargando.jsx'
import FormularioDireccion from '../../components/FormularioDireccion.jsx'

const titulo = 'font-titulo text-3xl font-extrabold uppercase'
const subtitulo = 'border-l-4 border-primario pl-3 font-titulo text-xl font-bold uppercase'
const tarjeta = 'rounded-xl border border-borde bg-fondo p-5 shadow-sm'
const campo =
  'mt-1 w-full rounded-lg border border-borde bg-fondo px-3 py-2 transition-colors hover:border-texto-suave focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/40 disabled:bg-superficie'
const botonPrimario =
  'rounded-lg bg-primario px-4 py-2 font-semibold text-secundario transition-colors hover:bg-primario-oscuro hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:opacity-60'
const botonChico =
  'rounded-lg border border-borde px-3 py-1 text-sm transition-colors hover:border-primario hover:bg-superficie disabled:opacity-40'
const botonPeligro =
  'rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-40'
const idDe = (d) => d.id ?? d.id_direccion

function ErrorReintento({ mensaje, onReintentar }) {
  return (
    <p role="alert" className="mt-3 text-sm text-primario-oscuro">
      {mensaje}{' '}
      <button onClick={onReintentar} className="underline">
        Reintentar
      </button>
    </p>
  )
}

// ---------- Datos personales ----------

function FormDatos({ cliente }) {
  const [form, setForm] = useState({
    nombre: cliente.nombre ?? '',
    apellido: cliente.apellido ?? '',
    telefono: cliente.telefono ?? '',
  })
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setGuardado(false)
  }

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setGuardado(false)
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Completa nombre y apellido.')
      return
    }
    setEnviando(true)
    try {
      await api.put(`/api/clientes/${cliente.id}`, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
      })
      setGuardado(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="mt-3 grid gap-3 sm:grid-cols-2" noValidate>
      <label className="block sm:col-span-2">
        <span className="text-sm font-medium">Correo electrónico</span>
        <input value={cliente.usuario?.email ?? ''} readOnly disabled className={`${campo} opacity-70`} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Nombre</span>
        <input name="nombre" value={form.nombre} onChange={cambiar} autoComplete="given-name" className={campo} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Apellido</span>
        <input name="apellido" value={form.apellido} onChange={cambiar} autoComplete="family-name" className={campo} />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm font-medium">Teléfono</span>
        <input name="telefono" type="tel" value={form.telefono} onChange={cambiar} autoComplete="tel" className={campo} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-primario-oscuro sm:col-span-2">
          {error}
        </p>
      )}
      {guardado && (
        <p role="status" className="rounded-lg bg-primario/15 px-3 py-2 text-sm font-medium text-secundario sm:col-span-2">
          ✓ Datos guardados.
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={enviando} className={botonPrimario}>
          {enviando ? 'Guardando...' : 'Guardar datos'}
        </button>
      </div>
    </form>
  )
}

function DatosPersonales({ idCliente }) {
  const { datos, error, cargando, recargar } = useApi(`/api/clientes/${idCliente}`)
  return (
    <div className={tarjeta}>
      <h2 className={subtitulo}>Mis datos</h2>
      {cargando && <Cargando texto="Cargando tus datos..." />}
      {error && <ErrorReintento mensaje={error.message} onReintentar={recargar} />}
      {datos && <FormDatos cliente={datos} />}
    </div>
  )
}

// ---------- Direcciones ----------

function Direcciones({ idCliente }) {
  const { datos, error, cargando, recargar } = useApi(`/api/direcciones/cliente/${idCliente}`)
  const [modo, setModo] = useState(null) // null | 'nueva' | id de la dirección en edición
  const [confirmar, setConfirmar] = useState(null) // id de la dirección que se va a eliminar
  const [ocupado, setOcupado] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  const lista = Array.isArray(datos) ? datos : []

  async function ejecutar(id, accion) {
    setOcupado(id)
    setErrorAccion('')
    try {
      await accion()
      setConfirmar(null)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    } finally {
      setOcupado(null)
    }
  }

  const hacerPredeterminada = (id) =>
    ejecutar(id, () => api.put(`/api/direcciones/${id}`, { es_predeterminada: true }))
  const eliminar = (id) => ejecutar(id, () => api.delete(`/api/direcciones/${id}`))

  async function guardarNueva(campos) {
    await api.post('/api/direcciones', { id_cliente: idCliente, ...campos })
    setModo(null)
    recargar()
  }

  const guardarEdicion = (id) => async (campos) => {
    await api.put(`/api/direcciones/${id}`, campos)
    setModo(null)
    recargar()
  }

  return (
    <div className={tarjeta}>
      <h2 className={subtitulo}>Mis direcciones</h2>
      {cargando && <Cargando texto="Cargando direcciones..." />}
      {error && <ErrorReintento mensaje={error.message} onReintentar={recargar} />}
      {errorAccion && (
        <p role="alert" className="mt-3 text-sm text-primario-oscuro">
          {errorAccion}
        </p>
      )}

      {datos && lista.length === 0 && modo !== 'nueva' && (
        <p className="mt-3 text-sm text-texto-suave">Aún no tienes direcciones guardadas.</p>
      )}

      {lista.length > 0 && (
        <ul className="mt-3 space-y-2">
          {lista.map((d) => {
            const id = idDe(d)
            if (modo === id) {
              return (
                <li key={id}>
                  <FormularioDireccion
                    inicial={d}
                    onGuardar={guardarEdicion(id)}
                    onCancelar={() => setModo(null)}
                    textoGuardar="Guardar cambios"
                  />
                </li>
              )
            }
            return (
              <li
                key={id}
                className={`rounded-lg border p-3 ${d.es_predeterminada ? 'border-primario bg-primario/10' : 'border-borde'}`}
              >
                <p className="text-sm">
                  <span className="font-semibold">{d.direccion}</span>
                  {d.es_predeterminada && (
                    <span className="ml-2 rounded-full bg-primario px-2 py-0.5 text-xs font-semibold text-secundario">
                      Predeterminada
                    </span>
                  )}
                  <br />
                  {[d.ciudad, d.estado, d.pais].filter(Boolean).join(', ')}
                  {d.codigo_postal ? ` · ${d.codigo_postal}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!d.es_predeterminada && (
                    <button disabled={ocupado === id} onClick={() => hacerPredeterminada(id)} className={botonChico}>
                      Hacer predeterminada
                    </button>
                  )}
                  <button disabled={ocupado === id} onClick={() => setModo(id)} className={botonChico}>
                    Editar
                  </button>
                  {confirmar === id ? (
                    <>
                      <span className="text-sm">¿Eliminar esta dirección?</span>
                      <button disabled={ocupado === id} onClick={() => eliminar(id)} className={botonPeligro}>
                        Sí, eliminar
                      </button>
                      <button onClick={() => setConfirmar(null)} className="text-sm underline">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button disabled={ocupado === id} onClick={() => setConfirmar(id)} className={botonPeligro}>
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {datos && modo === 'nueva' && (
        <FormularioDireccion onGuardar={guardarNueva} onCancelar={() => setModo(null)} />
      )}
      {datos && modo !== 'nueva' && (
        <button onClick={() => setModo('nueva')} className={`mt-3 ${botonChico} font-semibold`}>
          + Agregar dirección
        </button>
      )}
    </div>
  )
}

// ---------- Desactivar cuenta ----------

function DesactivarCuenta() {
  const { logout } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function desactivar(e) {
    e.preventDefault()
    setError('')
    if (!password) {
      setError('Escribe tu contraseña para confirmar.')
      return
    }
    setEnviando(true)
    try {
      await api.post('/api/clientes/me/eliminar-cuenta', { password })
      logout()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <h2 className="border-l-4 border-red-600 pl-3 font-titulo text-xl font-bold uppercase text-red-800">
        Desactivar mi cuenta
      </h2>
      <p className="mt-2 text-sm text-texto-suave">
        Tu cuenta quedará desactivada y se cerrará tu sesión. Tus pedidos se conservan, y un empleado puede
        reactivarla si lo necesitas.
      </p>
      {!abierto ? (
        <button onClick={() => setAbierto(true)} className={`mt-3 ${botonPeligro} bg-white`}>
          Desactivar mi cuenta
        </button>
      ) : (
        <form onSubmit={desactivar} className="mt-3 max-w-sm space-y-3" noValidate>
          <label className="block">
            <span className="text-sm font-medium">Confirma tu contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={campo}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-primario-oscuro">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
            >
              {enviando ? 'Desactivando...' : 'Desactivar cuenta'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                setPassword('')
                setError('')
              }}
              className="text-sm underline"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ---------- Página ----------

export default function MiCuenta() {
  const { cliente } = useAuth()
  const idCliente = cliente?.id ?? null

  if (!idCliente) {
    return (
      <section>
        <h1 className={titulo}>Mi cuenta</h1>
        <p className="mt-4">No pudimos identificar tu cuenta de cliente. Cierra sesión y vuelve a entrar.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-secundario px-6 py-5 text-texto-claro">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primario font-titulo text-2xl font-extrabold text-secundario"
          >
            {`${cliente?.nombre?.[0] ?? ''}${cliente?.apellido?.[0] ?? ''}`.toUpperCase() || '?'}
          </span>
          <div>
            <h1 className={`${titulo} text-white`}>Mi cuenta</h1>
            <p className="text-sm">{[cliente?.nombre, cliente?.apellido].filter(Boolean).join(' ')}</p>
          </div>
        </div>
        <Link
          to="/mis-pedidos"
          className="rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-secundario hover:bg-primario-oscuro hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          Ver mis pedidos
        </Link>
      </div>
      <DatosPersonales idCliente={idCliente} />
      <Direcciones idCliente={idCliente} />
      <DesactivarCuenta />
    </section>
  )
}
