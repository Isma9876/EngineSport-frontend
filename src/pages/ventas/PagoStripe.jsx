import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { formatoPrecio } from '../../utils/formato.js'

export default function PagoStripe({ idPedido, total, onCancelar, bloqueado }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function pagar(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setEnviando(true)
    setError('')
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/confirmacion/${idPedido}` },
      redirect: 'if_required', // el 3D Secure con ventana emergente lo maneja Stripe
    })
    if (err) {
      setError(err.message ?? 'No se pudo procesar el pago.')
      setEnviando(false)
      return
    }
    // Pago aceptado por Stripe: la confirmación espera al webhook y muestra el resultado real.
    navigate(`/confirmacion/${idPedido}`, { replace: true })
  }

  return (
    <form onSubmit={pagar} className="space-y-4">
      <PaymentElement />
      {error && (
        <p role="alert" className="text-sm text-primario-oscuro">
          {error}
        </p>
      )}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!stripe || enviando || bloqueado}
          className="rounded bg-primario px-5 py-2 font-semibold text-secundario hover:bg-primario-oscuro disabled:opacity-40"
        >
          {enviando ? 'Procesando...' : `Pagar ${formatoPrecio(total)}`}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando || bloqueado}
          className="text-sm underline disabled:opacity-40"
        >
          Cancelar y volver
        </button>
      </div>
    </form>
  )
}