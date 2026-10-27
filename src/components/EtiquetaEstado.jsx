// Disponibilidad: solo se muestra el campo `estado`, nunca el stock exacto.
const ESTADOS = {
  disponible: { texto: 'Disponible', clases: 'border-estado-disponible text-estado-disponible' },
  pocas_unidades: { texto: '¡Pocas unidades!', clases: 'border-estado-pocas text-estado-pocas' },
  agotado: { texto: 'Agotado', clases: 'border-estado-agotado text-estado-agotado' },
}

export default function EtiquetaEstado({ estado, className = '' }) {
  const info = ESTADOS[estado]
  if (!info) return null
  return (
    <span
      className={`inline-block rounded-full border bg-fondo px-2 py-0.5 text-xs font-semibold ${info.clases} ${className}`}
    >
      {info.texto}
    </span>
  )
}
