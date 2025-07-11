'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function ToastNotification({
  message,
  type,
  isVisible,
  onClose,
  duration = 5000
}: ToastProps) {
  const [isShowing, setIsShowing] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true)
      const timer = setTimeout(() => {
        setIsShowing(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-green-600',
          icon: 'text-green-100',
          iconComponent: CheckCircle
        }
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          icon: 'text-red-100',
          iconComponent: XCircle
        }
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
          icon: 'text-orange-100',
          iconComponent: AlertCircle
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          icon: 'text-blue-100',
          iconComponent: AlertCircle
        }
    }
  }

  const styles = getTypeStyles()
  const IconComponent = styles.iconComponent

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`${styles.bg} text-white px-6 py-4 rounded-lg shadow-lg max-w-sm flex items-center space-x-3`}>
        <IconComponent className={`w-5 h-5 ${styles.icon}`} />
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setIsShowing(false)
            setTimeout(onClose, 300)
          }}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
} 