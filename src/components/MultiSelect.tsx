import { useState, useEffect, useRef } from 'react'
import { X, Plus } from 'lucide-react'

interface MultiSelectProps {
    label: string
    value: string[] // Array of selected tags
    onChange: (value: string[]) => void
    options: string[]
    placeholder?: string
    className?: string
}

export default function MultiSelect({
    label,
    value,
    onChange,
    options,
    placeholder = 'Selecteer of typ...',
    className = ''
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [filteredOptions, setFilteredOptions] = useState<string[]>([])
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Filter options based on query and exclude used ones
    useEffect(() => {
        const q = query.toLowerCase()
        const filtered = options
            .filter(opt =>
                !value.includes(opt) &&
                opt.toLowerCase().includes(q)
            )
            .slice(0, 10)
        setFilteredOptions(filtered)
    }, [query, options, value])

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setQuery('') // Clear pending query
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const addTag = (tag: string) => {
        const trimmed = tag.trim()
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed])
        }
        setQuery('')
        inputRef.current?.focus()
    }

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            if (query.trim()) {
                addTag(query)
            }
        }
        if (e.key === 'Backspace' && !query && value.length > 0) {
            // Remove last tag if backspace pressed on empty input
            removeTag(value[value.length - 1])
        }
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>

            <div
                className="min-h-[50px] w-full px-3 py-2 rounded-xl border-2 border-gray-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all flex flex-wrap gap-2 items-center cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {value.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium animate-fade-in"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                removeTag(tag)
                            }}
                            className="text-emerald-600 hover:text-emerald-900 rounded-full hover:bg-emerald-200 p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 bg-transparent min-w-[100px] outline-none text-gray-900 placeholder:text-gray-400 py-1"
                />
            </div>

            {isOpen && (filteredOptions.length > 0 || query) && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    <ul className="py-1">
                        {filteredOptions.map((option) => (
                            <li
                                key={option}
                                onClick={() => addTag(option)}
                                className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-gray-700 flex items-center justify-between"
                            >
                                {option}
                            </li>
                        ))}

                        {query && !filteredOptions.includes(query) && !value.includes(query) && (
                            <li
                                onClick={() => addTag(query)}
                                className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-emerald-600 border-t border-gray-100 font-medium flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Voeg toe: "{query}"
                            </li>
                        )}
                    </ul>
                </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Typ een komma of Enter om een tag toe te voegen.</p>
        </div>
    )
}
