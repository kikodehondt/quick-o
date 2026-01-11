import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Plus } from 'lucide-react'

interface ComboboxProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: string[]
    placeholder?: string
    className?: string
}

export default function Combobox({
    label,
    value,
    onChange,
    options,
    placeholder = 'Selecteer of typ...',
    className = ''
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [filteredOptions, setFilteredOptions] = useState<string[]>([])
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Filter options based on query
        if (!query) {
            setFilteredOptions(options.slice(0, 50)) // Show more initial options
            return
        }

        const q = query.toLowerCase()
        const filtered = options
            .filter(opt => opt.toLowerCase().includes(q))
            .slice(0, 20) // Limit to keep UI snappy
        setFilteredOptions(filtered)
    }, [query, options, isOpen])

    // Initial query matches value if present and we are not typing
    useEffect(() => {
        if (!isOpen) {
            setQuery(value)
        }
    }, [value, isOpen])

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                // Reset query to actual value if we didn't select anything
                setQuery(value)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [value])

    const handleSelect = (option: string) => {
        onChange(option)
        setQuery(option)
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                        onChange(e.target.value) // Propagate typed value immediately
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        <ul className="py-1">
                            {filteredOptions.map((option, index) => (
                                <li
                                    key={`${option}-${index}`}
                                    onClick={() => handleSelect(option)}
                                    className={`px-4 py-2 hover:bg-emerald-50 cursor-pointer flex items-center justify-between group ${option === value ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700'}`}
                                >
                                    {option}
                                    {option === value && <Check className="w-4 h-4 text-emerald-600" />}
                                </li>
                            ))}
                            {/* If query fits no option exactly, show "Add new" option at bottom visually distinct */}
                            {query && !filteredOptions.includes(query) && (
                                <li
                                    onClick={() => handleSelect(query)}
                                    className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-emerald-600 border-t border-gray-100 font-medium flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Gebruik "{query}"
                                </li>
                            )}
                        </ul>
                    ) : (
                        query ? (
                            <div
                                className="px-4 py-3 text-sm text-gray-500 cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2"
                                onClick={() => handleSelect(query)}
                            >
                                <Plus className="w-4 h-4" />
                                Nieuw: "{query}"
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 italic">
                                Geen opties gevonden
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}
