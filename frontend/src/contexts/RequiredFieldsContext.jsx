import { createContext, useContext } from 'react'

/**
 * Context for providing company-configured required field paths to form components
 */
const RequiredFieldsContext = createContext(new Set())

export function RequiredFieldsProvider({ requiredFields, children }) {
  // Ensure requiredFields is a Set
  const fieldSet = requiredFields instanceof Set
    ? requiredFields
    : new Set(requiredFields || [])

  return (
    <RequiredFieldsContext.Provider value={fieldSet}>
      {children}
    </RequiredFieldsContext.Provider>
  )
}

/**
 * Hook to check if a field is required
 * @param {string} fieldPath - Field path like "defendant.firstName"
 * @returns {boolean} - Whether the field is required
 */
export function useIsFieldRequired(fieldPath) {
  const requiredFields = useContext(RequiredFieldsContext)
  return requiredFields.has(fieldPath)
}

/**
 * Hook to get all required field paths
 * @returns {Set<string>} - Set of required field paths
 */
export function useRequiredFields() {
  return useContext(RequiredFieldsContext)
}

export default RequiredFieldsContext
