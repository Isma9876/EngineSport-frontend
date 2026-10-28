import { useEffect, useState } from 'react'
import api from '../api.js'
import useApi from '../hooks/useApi.js'
import Cargando from './Cargando.jsx'
import FormularioDireccion from './FormularioDireccion.jsx'

const idDe = (d) => d.id ?? d.id_direccion

// Selector de dirección de envío del cliente: lista sus direcciones, deja elegir una
// y agregar otra sin salir de la página.
//
// Props:
// - idCliente: id del cliente (cliente.id de useAuth()).
// - valor: id de la dirección elegida, o null si aún no se ha elegido.
// - onChange(id): se llama al elegir una, al crear una nueva y, la primera vez, con la
//   sugerida (la predeterminada, o la primera) si valor es null.
// - deshabilitado: bloquea el cambio (p. ej. cuando ya se creó el pedido).
export default function SelectorDireccion({ idCliente, valor, onChange, deshabilitado = false }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const { datos, error, cargando, recargar } = useApi(
    idCliente ? `/api/direcciones/cliente/${idCliente}` : null,
  )

  const lista = Array.isArray(datos) ? datos : []
  const sugerida = lista.find((d) => d.es_predeterminada) ?? lista[0]
  const sugeridaId = sugerida ? idDe(sugerida) : null
  const elegidaId = valor ?? sugeridaId
  const verForm = !deshabilitado && (mostrarForm || (lista.length === 0 && !cargando && !error))

  useEffect(() => {
    if (valor == null && sugeridaId != null) onChange(sugeridaId)
  }, [valor, sugeridaId, onChange])

  async function guardar(datosNuevos) {
    const nueva = await api.post('/api/direcciones', {
      id_cliente: idCliente,
      ...datosNuevos,
      es_predeterminada: lista.length === 0,
    })
    onChange(idDe(nueva))
    setMostrarForm(false)
    recargar()
  }

  if (!idCliente) {
    return <p className="mt-2 text-sm">No pudimos identificar tu cuenta de cliente.</p>
  }
  if (cargando && !datos) return <Cargando texto="Cargando direcciones..." />

  return (
    <div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-primario-oscuro">
          {error.message}{' '}
          <button onClick={recargar} className="underline">
            Reintentar
          </button>
        </p>
      )}

      {lista.length > 0 && (
        <ul className="mt-3 space-y-2">
          {lista.map((d) => (
            <li key={idDe(d)}>
              <label className="flex cursor-pointer gap-3 rounded border border-borde p-3 has-[:checked]:border-primario">
                <input
                  type="radio"
                  name="direccion-envio"
                  disabled={deshabilitado}
                  checked={elegidaId === idDe(d)}
                  onChange={() => onChange(idDe(d))}
                />
                <span className="text-sm">
                  <span className="font-semibold">{d.direccion}</span>
                  <br />
                  {[d.ciudad, d.estado, d.pais].filter(Boolean).join(', ')}
                  {d.es_predeterminada && (
                    <span className="ml-2 text-xs text-texto-suave">(predeterminada)</span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {lista.length > 0 && !verForm && !deshabilitado && (
        <button onClick={() => setMostrarForm(true)} className="mt-3 text-sm underline">
          Agregar otra dirección
        </button>
      )}

      {verForm && (
        <FormularioDireccion
          onGuardar={guardar}
          onCancelar={lista.length > 0 ? () => setMostrarForm(false) : undefined}
        />
      )}
    </div>
  )
}