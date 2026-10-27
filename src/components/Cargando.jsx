export default function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-texto-suave" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primario border-t-transparent" />
      <span>{texto}</span>
    </div>
  )
}
