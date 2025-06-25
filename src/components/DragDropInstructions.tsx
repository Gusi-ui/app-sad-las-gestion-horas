'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Mouse, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Save, 
  Eye,
  Lightbulb,
  X
} from 'lucide-react'
import { useState } from 'react'

interface DragDropInstructionsProps {
  onClose?: () => void
  autoShow?: boolean
}

export default function DragDropInstructions({ onClose, autoShow = false }: DragDropInstructionsProps) {
  const [isVisible, setIsVisible] = useState(autoShow)

  if (!isVisible) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="flex items-center"
      >
        <Lightbulb className="w-4 h-4 mr-2" />
        ¿Cómo usar el Drag & Drop?
      </Button>
    )
  }

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-blue-900">
            <Mouse className="w-5 h-5 mr-2" />
            🖱️ Guía de Drag & Drop
          </CardTitle>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Step 1 */}
        <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
          <div className="p-1 bg-blue-100 rounded-full text-blue-600 font-bold text-sm w-6 h-6 flex items-center justify-center">
            1
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Seleccionar Asignación</h4>
            <p className="text-sm text-blue-700">
              Haz clic y mantén presionado sobre cualquier bloque de asignación (de color) en el calendario.
            </p>
          </div>
          <Mouse className="w-5 h-5 text-blue-600" />
        </div>

        {/* Step 2 */}
        <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
          <div className="p-1 bg-blue-100 rounded-full text-blue-600 font-bold text-sm w-6 h-6 flex items-center justify-center">
            2
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Arrastrar</h4>
            <p className="text-sm text-blue-700">
              Sin soltar, arrastra el bloque hacia el nuevo día y/o horario deseado. Verás indicadores visuales.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-600" />
        </div>

        {/* Step 3 */}
        <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
          <div className="p-1 bg-blue-100 rounded-full text-blue-600 font-bold text-sm w-6 h-6 flex items-center justify-center">
            3
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Soltar</h4>
            <p className="text-sm text-blue-700">
              Suelta el ratón en la nueva posición. El sistema validará automáticamente y guardará el cambio.
            </p>
          </div>
          <Save className="w-5 h-5 text-blue-600" />
        </div>

        {/* Visual Indicators */}
        <div className="border-t border-blue-200 pt-4">
          <h4 className="font-medium text-blue-900 mb-3">🎨 Indicadores Visuales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Verde: Movimiento válido</span>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-red-50 rounded border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">Rojo: Conflicto de horarios</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="border-t border-blue-200 pt-4">
          <h4 className="font-medium text-blue-900 mb-3">💡 Consejos</h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>El sistema detecta automáticamente conflictos entre trabajadoras</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Los cambios se guardan inmediatamente sin necesidad de botón "Guardar"</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Si hay un error, el movimiento se revierte automáticamente</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Haz clic en cualquier asignación para ver más detalles</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-end pt-3">
          <Button onClick={handleClose} className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            ¡Entendido, empezar a usar!
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 