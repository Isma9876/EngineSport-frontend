import { useState } from 'react'

const VACIA = { direccion: '', ciudad: '', estado: '', codigo_postal: '', pais: 'Guatemala' }
const campo = 'w-full rounded border border-borde bg-fondo px-2 py-1'

// Formulario de dirección, reutilizable para crear y para editar.
// - inicial: dirección existente al editar (los campos null se muestran vacíos).
// - onGuardar(datos): función async que guarda. Si lanza un error, se muestra su mensaje.
// - onCancelar: si se pasa, aparece el botón "Cancelar".
export default function FormularioDireccion({
  inicial,
  onGuardar,
  onCancelar,
  textoGuardar = 'Guardar dirección',
}) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(Object.keys(VACIA).map((k) => [k, inicial?.[k] ?? VACIA[k]])),
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cambiar = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    setError('')
    if (!form.direccion.trim() || !form.ciudad.trim() || !form.estado.trim()) {
      setError('Completa dirección, ciudad y departamento.')
      return
    }
    setGuardando(true)
    try {
      await onGuardar({
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        estado: form.estado.trim(),
        codigo_postal: form.codigo_postal.trim() || null,
        pais: form.pais.trim() || 'Guatemala',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="mt-3 grid gap-3 rounded bg-superficie p-4 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">
        Dirección
        <input value={form.direccion} onChange={cambiar('direccion')} className={campo} />
      </label>
      <label className="text-sm">
        Ciudad
        <input value={form.ciudad} onChange={cambiar('ciudad')} className={campo} />
      </label>
      <label className="text-sm">
        Departamento
        <input value={form.estado} onChange={cambiar('estado')} className={campo} />
      </label>
      <label className="text-sm">
        Código postal (opcional)
        <input value={form.codigo_postal} onChange={cambiar('codigo_postal')} className={campo} />
      </label>
      <label className="text-sm">
        País
        <input value={form.pais} onChange={cambiar('pais')} className={campo} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-primario-oscuro sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={guardando}
          className="rounded bg-primario px-4 py-2 font-semibold text-white hover:bg-primario-oscuro disabled:opacity-40"
        >
          {guardando ? 'Guardando...' : textoGuardar}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="text-sm underline">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}