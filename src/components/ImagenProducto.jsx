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
        className={`flex items-center justify-center bg-superficie text-sm text-texto-suave ${className}`}
      >
        Sin imagen
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
