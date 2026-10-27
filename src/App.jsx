import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/auth/Login.jsx'
import Registro from './pages/auth/Registro.jsx'
import Productos from './pages/catalogo/Productos.jsx'
import ProductoDetalle from './pages/catalogo/ProductoDetalle.jsx'
import Carrito from './pages/ventas/Carrito.jsx'
import Checkout from './pages/ventas/Checkout.jsx'
import MisPedidos from './pages/ventas/MisPedidos.jsx'
import Admin from './pages/admin/Admin.jsx'
import Confirmacion from './pages/ventas/Confirmacion.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/productos/:id" element={<ProductoDetalle />} />

        <Route element={<RutaProtegida tipo="cliente" />}>
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route path="/confirmacion/:id" element={<Confirmacion />} />
        </Route>

        <Route element={<RutaProtegida tipo="empleado" />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
    </Routes>
  )
}
