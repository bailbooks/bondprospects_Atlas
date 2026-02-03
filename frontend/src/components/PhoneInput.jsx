/**
 * PhoneInput - Formatted phone number input
 * - Only allows numeric input
 * - Auto-formats as XXX-XXX-XXXX
 * - Validates 10 digits
 */
import { forwardRef } from 'react'

const PhoneInput = forwardRef(({ 
  value, 
  onChange, 
  onBlur,
  name,
  placeholder = '303-269-8547',
  className = '',
  required = false,
  ...props 
}, ref) => {
  
  // Format phone number as user types
  const formatPhoneNumber = (input) => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limited = numbers.slice(0, 10)
    
    // Format as XXX-XXX-XXXX
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`
    }
  }
  
  // Get raw digits count for validation
  const getDigitCount = (input) => {
    return (input || '').replace(/\D/g, '').length
  }
  
  const handleChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    
    // Create a synthetic event with the formatted value
    const syntheticEvent = {
      target: {
        name: name,
        value: formatted,
      },
    }
    
    onChange(syntheticEvent)
  }
  
  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter, arrows
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ]
    
    if (allowedKeys.includes(e.key)) {
      return
    }
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) {
      return
    }
    
    // Block non-numeric characters
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
    
    // Block if already at 10 digits (unless selecting text)
    const currentDigits = getDigitCount(value)
    if (currentDigits >= 10 && e.target.selectionStart === e.target.selectionEnd) {
      e.preventDefault()
    }
  }
  
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const formatted = formatPhoneNumber(pastedText)
    
    const syntheticEvent = {
      target: {
        name: name,
        value: formatted,
      },
    }
    
    onChange(syntheticEvent)
  }
  
  const digitCount = getDigitCount(value)
  const isComplete = digitCount === 10
  const isPartial = digitCount > 0 && digitCount < 10
  
  return (
    <div className="relative">
      <input
        ref={ref}
        type="tel"
        name={name}
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={`${className} ${isPartial ? 'border-yellow-400' : ''} ${isComplete ? 'border-green-400' : ''}`}
        inputMode="numeric"
        autoComplete="tel"
        maxLength={12} // XXX-XXX-XXXX = 12 chars
        {...props}
      />
      {isPartial && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-600">
          {digitCount}/10
        </span>
      )}
    </div>
  )
})

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput
