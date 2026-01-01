import { ReactNode } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string | ReactNode
  id?: string
  disabled?: boolean
}

export default function ToggleSwitch({ 
  checked, 
  onChange, 
  label, 
  description, 
  id,
  disabled = false 
}: ToggleSwitchProps) {
  const generatedId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label 
          htmlFor={generatedId} 
          className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'} cursor-pointer`}
        >
          {label}
        </label>
        {description && (
          <div className="text-xs text-gray-600 mt-0.5">
            {description}
          </div>
        )}
      </div>
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={generatedId}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${checked 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
            : 'bg-gray-300'
          }
        `}
      >
        <span
          className={`
            ${checked ? 'translate-x-6' : 'translate-x-1'}
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-200 ease-in-out
            shadow-md
          `}
        />
      </button>
    </div>
  )
}
