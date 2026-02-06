import { z } from 'zod'

// Basic schemas
export const phoneSchema = z.string()
  .optional()
  .transform(val => val?.replace(/\D/g, '') || '')

export const dateSchema = z.string()
  .optional()
  .refine(val => {
    if (!val) return true
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, { message: 'Invalid date' })

// Defendant schema
export const defendantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  ssn: z.string().optional(),
  driversLicense: z.string().optional(),
  dlState: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  homePhone: phoneSchema,
  cellPhone: phoneSchema,
  workPhone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  employer: z.string().optional(),
  occupation: z.string().optional(),
}).passthrough()

// Indemnitor schema  
export const indemnitorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  relationshipToDefendant: z.string().min(1, 'Relationship is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  cellPhone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
}).passthrough()

// Reference schema
export const referenceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(1, 'Phone is required'),
  workPhone: z.string().optional(),
  address: z.string().optional(),
})

// Signatures schema - requires all 5 document signatures
// Document IDs: preApplication, referenceForm, immigrationWaiver, indemnitorApplication, immigrationBondAgreement
export const signaturesSchema = z.object({
  // Pre-Application - Co-Signer signature (required)
  preApplication_coSigner: z.string().min(1, 'Pre-Application signature is required'),
  // Reference Form - Applicant signature (required)
  referenceForm_applicant: z.string().min(1, 'Reference Form signature is required'),
  // Immigration Waiver - Co-Signer signature (required)
  immigrationWaiver_coSigner: z.string().min(1, 'Immigration Waiver signature is required'),
  // Indemnitor Application - Indemnitor signature (required)
  indemnitorApplication_indemnitor: z.string().min(1, 'Bail Bond Application signature is required'),
  // Immigration Bond Agreement - Indemnitor signature (required)
  immigrationBondAgreement_indemnitor: z.string().min(1, 'Immigration Bond Agreement signature is required'),
}).passthrough() // Allow optional signatures like defendant

// Complete intake schema
export const intakeSchema = z.object({
  defendant: defendantSchema,
  indemnitor: indemnitorSchema,
  references: z.array(referenceSchema).min(3, 'At least 3 references required'),
  bond: z.object({}).passthrough().optional(),
  signatures: signaturesSchema,
})

// Get schema for specific step
export function getStepSchema(stepIndex) {
  switch (stepIndex) {
    case 0: // Basic Info
      return z.object({
        defendant: z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          dob: z.string().min(1, 'Date of birth is required'),
        }).passthrough(),
        indemnitor: z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          relationshipToDefendant: z.string().min(1, 'Relationship is required'),
        }).passthrough(),
      }).passthrough()
    case 1: // Defendant
      return z.object({
        defendant: defendantSchema,
      }).passthrough()
    case 2: // Indemnitor
      return z.object({
        indemnitor: indemnitorSchema,
      }).passthrough()
    case 3: // References
      return z.object({
        references: z.array(referenceSchema).min(3),
      }).passthrough()
    case 5: // Signatures
      return z.object({
        signatures: signaturesSchema,
      }).passthrough()
    default:
      return z.object({}).passthrough()
  }
}

// Field labels for error messages
const fieldLabels = {
  'defendant.firstName': 'Defendant first name',
  'defendant.lastName': 'Defendant last name',
  'defendant.dob': 'Defendant date of birth',
  'defendant.ssn': 'Defendant SSN',
  'defendant.address': 'Defendant address',
  'defendant.city': 'Defendant city',
  'defendant.state': 'Defendant state',
  'defendant.zip': 'Defendant ZIP code',
  'defendant.cellPhone': 'Defendant cell phone',
  'defendant.homePhone': 'Defendant home phone',
  'defendant.email': 'Defendant email',
  'defendant.employer': 'Defendant employer',
  'defendant.driversLicense': 'Defendant driver\'s license',
  'indemnitor.firstName': 'Indemnitor first name',
  'indemnitor.lastName': 'Indemnitor last name',
  'indemnitor.dob': 'Indemnitor date of birth',
  'indemnitor.ssn': 'Indemnitor SSN',
  'indemnitor.address': 'Indemnitor address',
  'indemnitor.city': 'Indemnitor city',
  'indemnitor.state': 'Indemnitor state',
  'indemnitor.zip': 'Indemnitor ZIP code',
  'indemnitor.cellPhone': 'Indemnitor cell phone',
  'indemnitor.homePhone': 'Indemnitor home phone',
  'indemnitor.email': 'Indemnitor email',
  'indemnitor.relationshipToDefendant': 'Relationship to defendant',
  'indemnitor.employer': 'Indemnitor employer',
  'indemnitor.driversLicense': 'Indemnitor driver\'s license',
  'references.0.name': 'Reference 1 name',
  'references.0.phone': 'Reference 1 phone',
  'references.0.relationship': 'Reference 1 relationship',
  'references.1.name': 'Reference 2 name',
  'references.1.phone': 'Reference 2 phone',
  'references.1.relationship': 'Reference 2 relationship',
  'references.2.name': 'Reference 3 name',
  'references.2.phone': 'Reference 3 phone',
  'references.2.relationship': 'Reference 3 relationship',
}

/**
 * Build a dynamic Zod schema based on company's requiredFields configuration
 * @param {string[]} requiredFields - Array of field paths like ["defendant.firstName", "indemnitor.email"]
 * @param {string} wizardType - The wizard type (basic, medium, full)
 * @returns {z.ZodObject} - A Zod schema with the specified fields marked as required
 */
export function buildDynamicSchema(requiredFields, wizardType = 'medium') {
  // Default required fields by wizard type if no custom config
  const defaultRequired = {
    basic: [
      'defendant.firstName',
      'defendant.lastName',
      'defendant.dob',
      'indemnitor.firstName',
      'indemnitor.lastName',
      'indemnitor.cellPhone',
    ],
    medium: [
      'defendant.firstName',
      'defendant.lastName',
      'defendant.dob',
      'defendant.address',
      'defendant.city',
      'defendant.state',
      'defendant.zip',
      'defendant.cellPhone',
      'indemnitor.firstName',
      'indemnitor.lastName',
      'indemnitor.relationshipToDefendant',
      'indemnitor.dob',
      'indemnitor.cellPhone',
      'indemnitor.email',
      'indemnitor.address',
      'indemnitor.city',
      'indemnitor.state',
      'indemnitor.zip',
      'references.0.name',
      'references.0.phone',
      'references.0.relationship',
      'references.1.name',
      'references.1.phone',
      'references.1.relationship',
      'references.2.name',
      'references.2.phone',
      'references.2.relationship',
    ],
    full: [
      'defendant.firstName',
      'defendant.lastName',
      'defendant.dob',
      'defendant.ssn',
      'defendant.address',
      'defendant.city',
      'defendant.state',
      'defendant.zip',
      'defendant.cellPhone',
      'defendant.email',
      'indemnitor.firstName',
      'indemnitor.lastName',
      'indemnitor.relationshipToDefendant',
      'indemnitor.dob',
      'indemnitor.ssn',
      'indemnitor.cellPhone',
      'indemnitor.email',
      'indemnitor.address',
      'indemnitor.city',
      'indemnitor.state',
      'indemnitor.zip',
      'references.0.name',
      'references.0.phone',
      'references.0.relationship',
      'references.1.name',
      'references.1.phone',
      'references.1.relationship',
      'references.2.name',
      'references.2.phone',
      'references.2.relationship',
    ],
  }

  // Use provided requiredFields if valid, otherwise use defaults
  const fields = Array.isArray(requiredFields) && requiredFields.length > 0
    ? requiredFields
    : defaultRequired[wizardType] || defaultRequired.medium

  // Parse requiredFields into structured object
  const required = {
    defendant: new Set(),
    indemnitor: new Set(),
    references: [new Set(), new Set(), new Set()],
  }

  fields.forEach(fieldPath => {
    const parts = fieldPath.split('.')
    if (parts[0] === 'defendant' && parts[1]) {
      required.defendant.add(parts[1])
    } else if (parts[0] === 'indemnitor' && parts[1]) {
      required.indemnitor.add(parts[1])
    } else if (parts[0] === 'references' && parts[1] !== undefined && parts[2]) {
      const idx = parseInt(parts[1], 10)
      if (idx >= 0 && idx < 3) {
        required.references[idx].add(parts[2])
      }
    }
  })

  // Build defendant schema
  const defendantFields = {
    firstName: required.defendant.has('firstName')
      ? z.string().min(1, 'First name is required')
      : z.string().optional(),
    lastName: required.defendant.has('lastName')
      ? z.string().min(1, 'Last name is required')
      : z.string().optional(),
    dob: required.defendant.has('dob')
      ? z.string().min(1, 'Date of birth is required')
      : z.string().optional(),
    ssn: required.defendant.has('ssn')
      ? z.string().min(1, 'SSN is required')
      : z.string().optional(),
    address: required.defendant.has('address')
      ? z.string().min(1, 'Address is required')
      : z.string().optional(),
    city: required.defendant.has('city')
      ? z.string().min(1, 'City is required')
      : z.string().optional(),
    state: required.defendant.has('state')
      ? z.string().min(1, 'State is required')
      : z.string().optional(),
    zip: required.defendant.has('zip')
      ? z.string().min(1, 'ZIP code is required')
      : z.string().optional(),
    cellPhone: required.defendant.has('cellPhone')
      ? z.string().min(1, 'Cell phone is required')
      : z.string().optional(),
    homePhone: required.defendant.has('homePhone')
      ? z.string().min(1, 'Home phone is required')
      : z.string().optional(),
    email: required.defendant.has('email')
      ? z.string().email('Valid email is required').min(1, 'Email is required')
      : z.string().optional().or(z.literal('')),
    employer: required.defendant.has('employer')
      ? z.string().min(1, 'Employer is required')
      : z.string().optional(),
    driversLicense: required.defendant.has('driversLicense')
      ? z.string().min(1, 'Driver\'s license is required')
      : z.string().optional(),
  }

  // Build indemnitor schema
  const indemnitorFields = {
    firstName: required.indemnitor.has('firstName')
      ? z.string().min(1, 'First name is required')
      : z.string().optional(),
    lastName: required.indemnitor.has('lastName')
      ? z.string().min(1, 'Last name is required')
      : z.string().optional(),
    relationshipToDefendant: required.indemnitor.has('relationshipToDefendant')
      ? z.string().min(1, 'Relationship is required')
      : z.string().optional(),
    dob: required.indemnitor.has('dob')
      ? z.string().min(1, 'Date of birth is required')
      : z.string().optional(),
    ssn: required.indemnitor.has('ssn')
      ? z.string().min(1, 'SSN is required')
      : z.string().optional(),
    address: required.indemnitor.has('address')
      ? z.string().min(1, 'Address is required')
      : z.string().optional(),
    city: required.indemnitor.has('city')
      ? z.string().min(1, 'City is required')
      : z.string().optional(),
    state: required.indemnitor.has('state')
      ? z.string().min(1, 'State is required')
      : z.string().optional(),
    zip: required.indemnitor.has('zip')
      ? z.string().min(1, 'ZIP code is required')
      : z.string().optional(),
    cellPhone: required.indemnitor.has('cellPhone')
      ? z.string().min(1, 'Cell phone is required')
      : z.string().optional(),
    homePhone: required.indemnitor.has('homePhone')
      ? z.string().min(1, 'Home phone is required')
      : z.string().optional(),
    email: required.indemnitor.has('email')
      ? z.string().email('Valid email is required').min(1, 'Email is required')
      : z.string().optional().or(z.literal('')),
    employer: required.indemnitor.has('employer')
      ? z.string().min(1, 'Employer is required')
      : z.string().optional(),
    driversLicense: required.indemnitor.has('driversLicense')
      ? z.string().min(1, 'Driver\'s license is required')
      : z.string().optional(),
  }

  // Build reference schemas (one for each of 3 references)
  const buildReferenceSchema = (requiredSet) => {
    return z.object({
      name: requiredSet.has('name')
        ? z.string().min(1, 'Name is required')
        : z.string().optional(),
      phone: requiredSet.has('phone')
        ? z.string().min(1, 'Phone is required')
        : z.string().optional(),
      relationship: requiredSet.has('relationship')
        ? z.string().min(1, 'Relationship is required')
        : z.string().optional(),
      address: requiredSet.has('address')
        ? z.string().min(1, 'Address is required')
        : z.string().optional(),
      workPhone: z.string().optional(),
    }).passthrough()
  }

  // Create the dynamic schema
  return z.object({
    defendant: z.object(defendantFields).passthrough(),
    indemnitor: z.object(indemnitorFields).passthrough(),
    references: z.tuple([
      buildReferenceSchema(required.references[0]),
      buildReferenceSchema(required.references[1]),
      buildReferenceSchema(required.references[2]),
    ]),
    bond: z.object({}).passthrough().optional(),
    signatures: signaturesSchema,
  })
}

/**
 * Get the list of required field paths for a company
 * @param {Object} company - Company object with requiredFields and wizardType
 * @returns {string[]} - Array of required field paths
 */
export function getRequiredFieldPaths(company) {
  if (Array.isArray(company?.requiredFields) && company.requiredFields.length > 0) {
    return company.requiredFields
  }

  // Default required fields based on wizard type
  const wizardType = company?.wizardType?.toLowerCase() || 'medium'

  const defaults = {
    basic: [
      'defendant.firstName',
      'defendant.lastName',
      'defendant.dob',
      'indemnitor.firstName',
      'indemnitor.lastName',
      'indemnitor.cellPhone',
    ],
    medium: [
      'defendant.firstName',
      'defendant.lastName',
      'defendant.dob',
      'defendant.address',
      'defendant.city',
      'defendant.state',
      'defendant.zip',
      'defendant.cellPhone',
      'indemnitor.firstName',
      'indemnitor.lastName',
      'indemnitor.relationshipToDefendant',
      'indemnitor.dob',
      'indemnitor.cellPhone',
      'indemnitor.email',
      'indemnitor.address',
      'indemnitor.city',
      'indemnitor.state',
      'indemnitor.zip',
      'references.0.name',
      'references.0.phone',
      'references.0.relationship',
      'references.1.name',
      'references.1.phone',
      'references.1.relationship',
      'references.2.name',
      'references.2.phone',
      'references.2.relationship',
    ],
    full: [
      'defendant.firstName',
      'defendant.lastName',
      'defendant.dob',
      'defendant.ssn',
      'defendant.address',
      'defendant.city',
      'defendant.state',
      'defendant.zip',
      'defendant.cellPhone',
      'defendant.email',
      'indemnitor.firstName',
      'indemnitor.lastName',
      'indemnitor.relationshipToDefendant',
      'indemnitor.dob',
      'indemnitor.ssn',
      'indemnitor.cellPhone',
      'indemnitor.email',
      'indemnitor.address',
      'indemnitor.city',
      'indemnitor.state',
      'indemnitor.zip',
      'references.0.name',
      'references.0.phone',
      'references.0.relationship',
      'references.1.name',
      'references.1.phone',
      'references.1.relationship',
      'references.2.name',
      'references.2.phone',
      'references.2.relationship',
    ],
  }

  return defaults[wizardType] || defaults.medium
}
