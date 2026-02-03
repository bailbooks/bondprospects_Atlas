import { forwardRef } from 'react'
import clsx from 'clsx'

const SelectField = forwardRef(function SelectField(
  { label, name, options, required, error, placeholder = 'Select...', className, ...props },
  ref
) {
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
