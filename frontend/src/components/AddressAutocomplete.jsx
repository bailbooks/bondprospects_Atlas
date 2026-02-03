import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

/**
 * AddressAutocomplete Component
 * Uses Google Places API to autocomplete addresses
 * 
 * Props:
 * - value: current address value
 * - onChange: callback when address changes (receives full address string)
 * - onAddressSelect: callback when address is selected (receives parsed address object)
 * - label: field label
 * - required: whether field is required
 * - error: error message
 * - placeholder: input placeholder
 * - className: additional CSS classes
 */
export default function AddressAutocomplete({
  value = '',
  onChange,
  onAddressSelect,
  label,
  required = false,
  error,
  placeholder = 'Start typing an address...',
  className = ''
}) {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  // Load Google Places script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          setIsLoaded(true)
          clearInterval(checkLoaded)
        }
      }, 100)
      return () => clearInterval(checkLoaded)
    }

    // Load the script
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      console.warn('Google Places API key not configured. Set VITE_GOOGLE_PLACES_API_KEY in environment.')
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => console.error('Failed to load Google Places API')
    document.head.appendChild(script)

    return () => {
      // Don't remove script on unmount as other components may use it
    }
  }, [])

  // Initialize autocomplete when script is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (!place.address_components) {
        return
      }

      // Parse address components
      const addressData = parseAddressComponents(place.address_components)
      addressData.fullAddress = place.formatted_address
      
      // Update input value
      setInputValue(place.formatted_address)
      
      // Call callbacks
      if (onChange) {
        onChange(place.formatted_address)
      }
      
      if (onAddressSelect) {
        onAddressSelect(addressData)
      }
    })

    autocompleteRef.current = autocomplete
  }, [isLoaded, onChange, onAddressSelect])

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Handle manual input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={clsx(
            'input w-full',
            error && 'border-red-500 focus:ring-red-500'
          )}
          autoComplete="off"
        />
        {isLoaded && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="error-text">{error}</p>
      )}
      {!isLoaded && !import.meta.env.VITE_GOOGLE_PLACES_API_KEY && (
        <p className="text-xs text-gray-400 mt-1">Address autocomplete unavailable</p>
      )}
    </div>
  )
}

/**
 * Parse Google Places address_components into a structured object
 */
function parseAddressComponents(components) {
  const result = {
    streetNumber: '',
    street: '',
    address: '',
    city: '',
    county: '',
    state: '',
    stateShort: '',
    zip: '',
    country: '',
    countryShort: '',
    fullAddress: ''
  }

  for (const component of components) {
    const types = component.types

    if (types.includes('street_number')) {
      result.streetNumber = component.long_name
    }
    if (types.includes('route')) {
      result.street = component.long_name
    }
    if (types.includes('locality')) {
      result.city = component.long_name
    }
    if (types.includes('administrative_area_level_2')) {
      result.county = component.long_name.replace(' County', '')
    }
    if (types.includes('administrative_area_level_1')) {
      result.state = component.long_name
      result.stateShort = component.short_name
    }
    if (types.includes('postal_code')) {
      result.zip = component.long_name
    }
    if (types.includes('country')) {
      result.country = component.long_name
      result.countryShort = component.short_name
    }
  }

  // Combine street number and street name
  result.address = [result.streetNumber, result.street].filter(Boolean).join(' ')

  return result
}

/**
 * Hook to use address autocomplete in form context
 */
export function useAddressAutocomplete(setValue, prefix = '') {
  const handleAddressSelect = (addressData) => {
    const setField = (field, value) => {
      const fullField = prefix ? `${prefix}.${field}` : field
      setValue(fullField, value)
    }

    setField('address', addressData.address)
    setField('city', addressData.city)
    setField('state', addressData.stateShort)
    setField('zip', addressData.zip)
    setField('county', addressData.county)
    setField('fullAddress', addressData.fullAddress)
  }

  return { handleAddressSelect }
}
