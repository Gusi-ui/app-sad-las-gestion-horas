'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

// =====================================================
// TIPOS DE NOTIFICACIÓN
// =====================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

// =====================================================
// CONTEXTO DE NOTIFICACIONES
// =====================================================

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  }
  return context
}

// =====================================================
// PROVEEDOR DE NOTIFICACIONES
// =====================================================

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove si no es persistente
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

// =====================================================
// CONTENEDOR DE NOTIFICACIONES
// =====================================================

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// =====================================================
// COMPONENTE DE NOTIFICACIÓN INDIVIDUAL
// =====================================================

interface NotificationToastProps {
  notification: Notification
  onRemove: () => void
}

function NotificationToast({ notification, onRemove }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(onRemove, 300) // Esperar a que termine la animación
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out shadow-lg rounded-lg border-l-4 p-4 bg-white"
    
    switch (notification.type) {
      case 'success':
        return `${baseStyles} border-l-green-400 bg-green-50`
      case 'error':
        return `${baseStyles} border-l-red-400 bg-red-50`
      case 'warning':
        return `${baseStyles} border-l-yellow-400 bg-yellow-50`
      case 'info':
        return `${baseStyles} border-l-blue-400 bg-blue-50`
      default:
        return `${baseStyles} border-l-gray-400 bg-gray-50`
    }
  }

  return (
    <div
      className={`${getStyles()} ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="mt-1 text-sm text-gray-600">
              {notification.message}
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={handleRemove}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// HOOKS DE CONVENIENCIA
// =====================================================

export function useNotificationHelpers() {
  const { addNotification } = useNotifications()

  return {
    success: (title: string, message?: string) => 
      addNotification({ type: 'success', title, message }),
    
    error: (title: string, message?: string) => 
      addNotification({ type: 'error', title, message }),
    
    warning: (title: string, message?: string) => 
      addNotification({ type: 'warning', title, message }),
    
    info: (title: string, message?: string) => 
      addNotification({ type: 'info', title, message }),
    
    persistent: (type: NotificationType, title: string, message?: string) =>
      addNotification({ type, title, message, persistent: true })
  }
} 