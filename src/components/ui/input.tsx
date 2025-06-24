import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helpText?: string
  size?: 'md' | 'lg'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, size = 'md', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            'input',
            {
              'input-lg': size === 'lg',
              'border-red-300 focus:border-red-500 focus:ring-red-500': error,
            },
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helpText && !error && <p className="text-sm text-slate-500">{helpText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input } 