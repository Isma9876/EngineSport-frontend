import { useState } from 'react'

// Imagen con recuadro de relleno si falta la URL o falla al cargar.
export default function ImagenProducto({ src, alt, className = '' }) {
  const [fallida, setFallida] = useState(null)
  const sinImagen = !src || fallida === src

  if (sinImagen) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt} (sin imagen)` : 'Sin imagen'}
        className={`flex items-center justify-center bg-superficie text-texto-suave ${className}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 opacity-50" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m21 16-5-5-8 8" />
        </svg>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFallida(src)}
      className={`object-cover ${className}`}
    />
  )
}
