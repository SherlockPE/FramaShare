import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/login/Login'
import Sigin from './pages/sigin/Sigin'
import Home from './pages/home/Home'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex-1 w-full flex flex-col items-center justify-center p-4">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/sigin" element={<Sigin />} />
            <Route path="/signin" element={<Navigate to="/sigin" replace />} />
            <Route path="/register" element={<Navigate to="/sigin" replace />} />

            {/* Ruta protegida: el usuario no puede acceder a /home sin iniciar sesión */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
