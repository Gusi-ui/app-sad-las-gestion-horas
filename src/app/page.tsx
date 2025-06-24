import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
            Gestión de Servicios
            <span className="block text-sky-600">a Domicilio</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Aplicación profesional para trabajadoras de ayuda a domicilio. 
            Gestiona usuarios, horarios y seguimiento de horas de manera eficiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card hover>
            <CardHeader>
                             <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                 <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <CardTitle>Gestión de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Da de alta, edita y gestiona la información de tus usuarios de manera sencilla y organizada.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle>Control de Horas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Seguimiento preciso de horas trabajadas, horas restantes y planificación mensual de servicios.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <CardTitle>Horarios Flexibles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Configura días de la semana, horarios especiales, festivos y fines de semana por usuario.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">¿Lista para empezar?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                Únete a las trabajadoras que ya están optimizando su gestión diaria con nuestra aplicación.
              </p>
              <Link href="/register">
                <Button size="lg">
                  Crear cuenta gratuita
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
