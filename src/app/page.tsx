'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Users, 
  Clock, 
  Calendar, 
  Shield, 
  Heart, 
  Star,
  ArrowRight,
  CheckCircle,
  Phone,
  MapPin
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">App SAD</h1>
                <p className="text-xs text-slate-600">Servicios de Ayuda a Domicilio</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">Características</a>
              <a href="#contact" className="text-slate-600 hover:text-blue-600 transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-4 sm:mb-6">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6">
              Gestión Profesional de
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                Servicios Domiciliarios
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Optimiza la gestión de trabajadoras, usuarios y horarios con nuestra plataforma integral 
              diseñada específicamente para servicios de ayuda a domicilio.
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center items-center mb-8 sm:mb-12 px-4">
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 w-full sm:w-auto">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                  Acceso al Sistema
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto px-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg mb-2 sm:mb-3 mx-auto">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Gestión</h3>
                <p className="text-slate-600 text-sm">Completa de personal</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg mb-2 sm:mb-3 mx-auto">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Horarios</h3>
                <p className="text-slate-600 text-sm">Optimizados</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg mb-2 sm:mb-3 mx-auto">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Seguridad</h3>
                <p className="text-slate-600 text-sm">Total garantizada</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              Características Principales
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto px-4">
              Todo lo que necesitas para gestionar eficientemente tu servicio de ayuda a domicilio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Gestión de Usuarios */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 sm:p-8 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-green-900 mb-3">Gestión de Usuarios</h3>
              <p className="text-green-700 mb-4 text-sm sm:text-base">
                Administra perfiles completos de usuarios con información detallada, 
                historial médico y preferencias de atención.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-green-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                  Perfiles completos
                </li>
                <li className="flex items-center text-green-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                  Historial médico
                </li>
                <li className="flex items-center text-green-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                  Preferencias personalizadas
                </li>
              </ul>
            </div>

            {/* Gestión de Trabajadoras */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 sm:p-8 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3">Gestión de Trabajadoras</h3>
              <p className="text-blue-700 mb-4 text-sm sm:text-base">
                Gestiona el personal con perfiles detallados, certificaciones, 
                horarios y asignaciones específicas.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-blue-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                  Perfiles profesionales
                </li>
                <li className="flex items-center text-blue-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                  Certificaciones
                </li>
                <li className="flex items-center text-blue-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                  Disponibilidad
                </li>
              </ul>
            </div>

            {/* Planning y Horarios */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 sm:p-8 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-orange-900 mb-3">Planning y Horarios</h3>
              <p className="text-orange-700 mb-4 text-sm sm:text-base">
                Optimiza la asignación de horarios con un sistema inteligente 
                que considera disponibilidad y necesidades específicas.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-orange-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-orange-600 flex-shrink-0" />
                  Asignación automática
                </li>
                <li className="flex items-center text-orange-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-orange-600 flex-shrink-0" />
                  Calendario visual
                </li>
                <li className="flex items-center text-orange-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-orange-600 flex-shrink-0" />
                  Gestión de conflictos
                </li>
              </ul>
            </div>

            {/* Dashboard Administrativo */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 sm:p-8 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-purple-900 mb-3">Dashboard Administrativo</h3>
              <p className="text-purple-700 mb-4 text-sm sm:text-base">
                Panel de control completo con estadísticas, reportes y 
                herramientas de gestión avanzadas.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-purple-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                  Estadísticas en tiempo real
                </li>
                <li className="flex items-center text-purple-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                  Reportes detallados
                </li>
                <li className="flex items-center text-purple-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                  Gestión centralizada
                </li>
              </ul>
            </div>

            {/* Acceso Móvil */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 sm:p-8 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-yellow-900 mb-3">Acceso Móvil</h3>
              <p className="text-yellow-700 mb-4 text-sm sm:text-base">
                Interfaz optimizada para dispositivos móviles que permite 
                a las trabajadoras gestionar sus horarios desde cualquier lugar.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-yellow-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-yellow-600 flex-shrink-0" />
                  Diseño responsive
                </li>
                <li className="flex items-center text-yellow-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-yellow-600 flex-shrink-0" />
                  Acceso desde móvil
                </li>
                <li className="flex items-center text-yellow-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-yellow-600 flex-shrink-0" />
                  Notificaciones
                </li>
              </ul>
            </div>

            {/* Seguridad y Privacidad */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 sm:p-8 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Star className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-3">Seguridad y Privacidad</h3>
              <p className="text-red-700 mb-4 text-sm sm:text-base">
                Protección total de datos con encriptación avanzada y 
                cumplimiento de normativas de protección de datos.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-red-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                  Encriptación SSL
                </li>
                <li className="flex items-center text-red-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                  Cumplimiento GDPR
                </li>
                <li className="flex items-center text-red-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                  Copias de seguridad
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            ¿Necesitas más información?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Déjanos tu email y nos pondremos en contacto contigo para resolver 
            cualquier duda sobre nuestra plataforma.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                  Contacta con nosotros
                </h3>
                <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base">
                  Nuestro equipo está aquí para ayudarte a implementar la mejor 
                  solución para tu servicio de ayuda a domicilio.
                </p>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">Atención Personalizada</p>
                      <p className="text-sm text-blue-100">Asesoramiento experto</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">Respuesta Rápida</p>
                      <p className="text-sm text-blue-100">En menos de 24 horas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">Soporte Técnico</p>
                      <p className="text-sm text-blue-100">Implementación completa</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg w-full">
                <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
                  Solicita información
                </h4>
                <form className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                      Organización
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre de tu organización"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                      Mensaje (opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Cuéntanos sobre tus necesidades..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
                    ></textarea>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base">
                    Enviar Solicitud
                  </Button>
                </form>
                
                <p className="text-xs text-slate-500 mt-3 sm:mt-4 text-center">
                  Te contactaremos en menos de 24 horas
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">App SAD</h3>
                  <p className="text-sm text-slate-400">Servicios de Ayuda a Domicilio</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4 max-w-md">
                Plataforma integral para la gestión profesional de servicios 
                de ayuda a domicilio. Optimiza tu organización con tecnología avanzada.
              </p>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">España</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Características</h4>
              <ul className="space-y-2 text-slate-400">
                <li>• Gestión de usuarios</li>
                <li>• Gestión de trabajadoras</li>
                <li>• Planning y horarios</li>
                <li>• Dashboard administrativo</li>
                <li>• Acceso móvil</li>
                <li>• Seguridad avanzada</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Información</h4>
              <ul className="space-y-2 text-slate-400">
                <li>• Plataforma web</li>
                <li>• Soporte técnico</li>
                <li>• Formación incluida</li>
                <li>• Actualizaciones</li>
                <li>• Copias de seguridad</li>
                <li>• Cumplimiento GDPR</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              &copy; {new Date().getFullYear()} App SAD. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
