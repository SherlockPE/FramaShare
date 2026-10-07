import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface RegisterCredentials {
  name: string
  email: string
  password: string
}

interface SiginProps {
  onSubmit?: (credentials: RegisterCredentials) => Promise<void> | void
}

export default function Sigin({ onSubmit }: SiginProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validaciones
    if (!name.trim()) {
      setErrorMessage('Por favor, ingresa tu nombre de usuario.')
      return
    }

    if (!email.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    const credentials: RegisterCredentials = {
      name: name.trim(),
      email: email.trim(),
      password,
    }

    try {
      setIsLoading(true)

      if (onSubmit) {
        await onSubmit(credentials)
      } else {
        // Petición al backend (ajustar la URL si es necesario)
        /*
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.message || 'Error al registrar la cuenta')
        }
        const data = await response.json()
        login({ email: credentials.email, name: credentials.name }, data.token)
        */

        // Simulación de registro exitoso, inicia sesión automáticamente
        login({ email: credentials.email, name: credentials.name })
      }

      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo...')
      setTimeout(() => {
        navigate('/home')
      }, 700)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Ocurrió un error inesperado al registrarse.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl transition-all">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Crear una Cuenta
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Completa el formulario para registrarte en la plataforma
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3.5 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1.5"
          >
            Nombre de Usuario
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Perez"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1.5"
          >
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1.5"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-2.5 pr-11 bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1.5"
          >
            Confirmar Contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 dark:disabled:bg-purple-800 text-white font-medium rounded-lg shadow-sm hover:shadow transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isLoading ? 'Registrando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        ¿Ya tienes una cuenta?{' '}
        <Link
          to="/login"
          className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
        >
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  )
}
