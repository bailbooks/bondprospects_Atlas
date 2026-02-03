import { forwardRef, useState, useCallback } from 'react'
import clsx from 'clsx'

// Format phone number as user types
const formatPhoneNumber = (input) => {
  const numbers = (input || '').replace(/\D/g, '')
  const limited = numbers.slice(0, 10)
  
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`
  }
}

const FormField = forwardRef(function FormField(
  { label, name, type = 'text', required, error, hint, className, onChange, ...props },
  ref
) {
  const isPhone = type === 'tel'
  
  const handleChange = useCallback((e) => {
    if (isPhone) {
      const formatted = formatPhoneNumber(e.target.value)
      e.target.value = formatted
    }
    if (onChange) {
      onChange(e)
    }
  }, [isPhone, onChange])
  
  const handleKeyDown = useCallback((e) => {
    if (!isPhone) return
    
    // Allow: backspace, delete, tab, escape, enter, arrows
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ]
    
    if (allowedKeys.includes(e.key)) return
    if (e.ctrlKey || e.metaKey) return
    
    // Block non-numeric
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
    
    // Block if already 10 digits
    const currentDigits = (e.target.value || '').replace(/\D/g, '').length
    if (currentDigits >= 10 && e.target.selectionStart === e.target.selectionEnd) {
      e.preventDefault()
    }
  }, [isPhone])
  
  const handlePaste = useCallback((e) => {
    if (!isPhone) return
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const formatted = formatPhoneNumber(pastedText)
    e.target.value = formatted
    if (onChange) {
      onChange({ target: { name, value: formatted } })
    }
  }, [isPhone, name, onChange])
  
  const digitCount = isPhone ? (props.value || '').replace(/\D/g, '').length : 0
  const isPartial = isPhone && digitCount > 0 && digitCount < 10
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          className={clsx('input', error && 'input-error', isPartial && 'border-yellow-400')}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isPhone ? '303-269-8547' : props.placeholder}
          inputMode={isPhone ? 'numeric' : undefined}
          maxLength={isPhone ? 12 : undefined}
          {...props}
        />
        {isPartial && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-600">
            {digitCount}/10
          </span>
        )}
      </div>
      
      {hint && !error && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
      
      {error && (
        <p className="error-text">{error.message}</p>
      )}
    </div>
  )
})

export default FormField
