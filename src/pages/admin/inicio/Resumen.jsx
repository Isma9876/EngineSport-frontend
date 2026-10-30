import Cargando from '../../../components/Cargando.jsx'

// Aviso de error con Reintentar, compartido por las tarjetas y la lista
export function ErrorFuente({ error, recargar }) {
  return (
    <p className="rounded-lg border border-primario px-3 py-2 text-sm" role="alert">
      {error.message}{' '}
      <button type="button" onClick={recargar} className="font-semibold underline">
        Reintentar
      </button>
    </p>
  )
}

// Tarjeta de resumen. `fuente` es el resultado de useApi (se comparte con otras secciones).
// `esValido` (opcional) revisa la forma de la respuesta; si no cumple, se trata como error.
export default function Resumen({ titulo, fuente, esValido, children }) {
  const { datos, cargando, recargar } = fuente
  const error =
    fuente.error ?? (!cargando && esValido && !esValido(datos) ? { message: 'Respuesta inesperada del servidor.' } : null)
  return (
    <section className="rounded-xl border border-borde border-t-4 border-t-primario bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-texto-suave">{titulo}</h2>
      <div className="mt-2">
        {cargando ? (
          <Cargando texto="Cargando..." />
        ) : error ? (
          <ErrorFuente error={error} recargar={recargar} />
        ) : (
          children(datos)
        )}
      </div>
    </section>
  )
}
