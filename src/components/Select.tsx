import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: { label: string; value: string }[] | string[]
    placeholder?: string
    className?: string
}

export default function Select({
    label,
    value,
    onChange,
    options,
    placeholder = 'Selecteer...',
    className = ''
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    // Helper to get display label
    const getDisplayLabel = (val: string) => {
        if (!val) return ''
        const found = options.find(opt =>
            (typeof opt === 'string' ? opt : opt.value) === val
        )
        if (!found) return val
        return typeof found === 'string' ? found : found.label
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 text-left rounded-xl border-2 border-gray-300 bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all flex items-center justify-between"
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {getDisplayLabel(value) || placeholder}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    <ul className="py-1">
                        {options.map((option, index) => {
                            const optValue = typeof option === 'string' ? option : option.value
                            const optLabel = typeof option === 'string' ? option : option.label
                            const isSelected = optValue === value

                            return (
                                <li
                                    key={`${optValue}-${index}`}
                                    onClick={() => handleSelect(optValue)}
                                    className={`px-4 py-2 hover:bg-emerald-50 cursor-pointer flex items-center justify-between group ${isSelected ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700'}`}
                                >
                                    {optLabel}
                                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}
