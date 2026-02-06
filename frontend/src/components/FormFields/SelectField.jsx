import { forwardRef } from 'react'
import { useFormContext } from 'react-hook-form'
import clsx from 'clsx'

// Get nested error from errors object using dot notation path
const getNestedError = (errors, path) => {
  if (!path || !errors) return null
  const parts = path.split('.')
  let current = errors
  for (const part of parts) {
    if (!current) return null
    current = current[part]
  }
  return current
}

const SelectField = forwardRef(function SelectField(
  { label, name, options, required, error: propError, placeholder = 'Select...', className, ...props },
  ref
) {
  // Get errors from form context if not explicitly provided
  const formContext = useFormContext()
  const contextError = formContext ? getNestedError(formContext.formState.errors, name) : null
  const error = propError || contextError

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        id={name}
        name={name}
        className={clsx('input', error && 'input-error')}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value
          const label = typeof option === 'string' ? option : option.label
          return (
            <option key={value} value={value}>
              {label}
            </option>
          )
        })}
      </select>
      
      {error && (
        <p className="error-text">{error.message}</p>
      )}
    </div>
  )
})

export default SelectField
