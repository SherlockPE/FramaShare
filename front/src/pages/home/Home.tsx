import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header / Navbar superior */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mb-8 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
            FS
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white m-0 leading-tight">
              FramaShare
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 m-0">
              Plataforma de archivos compartidos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 m-0">
              {user?.name || user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 m-0">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors cursor-pointer border border-red-200 dark:border-red-900/50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="space-y-6">
        <section className="p-8 text-center bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10 border border-purple-500/20 rounded-2xl shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Sesión activa
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            ¡Bienvenido a tu panel, {user?.name || user?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto text-sm sm:text-base">
            Esta es una ruta protegida (<code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-purple-600 dark:text-purple-400">/home</code>). Solo los usuarios autenticados pueden ver este contenido.
          </p>
        </section>

        {/* Tarjetas de estado / acciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-xl text-left">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Subir Archivos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Comparte archivos rápidamente con tu equipo.</p>
          </div>

          <div className="p-5 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-xl text-left">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Archivos Recientes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Accede a tus últimos documentos sincronizados.</p>
          </div>

          <div className="p-5 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-xl text-left">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Seguridad</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Protección de acceso y cifrado de datos.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
