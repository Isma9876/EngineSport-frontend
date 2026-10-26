import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const { login, aviso } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('El correo y la contraseña son obligatorios.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      const usuario = await login(email.trim(), password)
      navigate(usuario.tipo === 'empleado' ? '/admin' : '/', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
      setEnviando(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="font-titulo text-2xl font-bold">Iniciar sesión</h1>
      {aviso && <p className="mt-4 rounded bg-amber-100 p-3 text-amber-900" role="alert">{aviso}</p>}
      <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
        <label className="block">
          <span className="text-sm font-medium">Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-primario px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {enviando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        ¿No tienes cuenta? <Link to="/registro" className="text-primario underline">Regístrate</Link>
      </p>
    </section>
  )
}
