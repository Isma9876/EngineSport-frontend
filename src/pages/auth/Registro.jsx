import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const CAMPOS = [
  { name: 'nombre', label: 'Nombre', type: 'text', auto: 'given-name' },
  { name: 'apellido', label: 'Apellido', type: 'text', auto: 'family-name' },
  { name: 'telefono', label: 'Teléfono', type: 'tel', auto: 'tel' },
  { name: 'email', label: 'Correo electrónico', type: 'email', auto: 'email' },
  { name: 'password', label: 'Contraseña (mínimo 6 caracteres)', type: 'password', auto: 'new-password' },
]

export default function Registro() {
  const { registrar, aviso } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('El correo y la contraseña son obligatorios.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await registrar({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro.')
      setEnviando(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="font-titulo text-2xl font-extrabold uppercase">Crear cuenta</h1>
      {aviso && <p className="mt-4 rounded border border-estado-pocas bg-superficie p-3 text-estado-pocas" role="alert">{aviso}</p>}
      <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
        {CAMPOS.map((c) => (
          <label key={c.name} className="block">
            <span className="text-sm font-medium">{c.label}</span>
            <input
              name={c.name}
              type={c.type}
              value={form[c.name]}
              onChange={cambiar}
              autoComplete={c.auto}
              className="mt-1 w-full rounded border border-borde bg-fondo px-3 py-2"
            />
          </label>
        ))}
        {error && <p className="text-sm text-primario-oscuro" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-primario px-4 py-2 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white disabled:opacity-60"
        >
          {enviando ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        ¿Ya tienes cuenta? <Link to="/login" className="text-primario-oscuro underline">Inicia sesión</Link>
      </p>
    </section>
  )
}
