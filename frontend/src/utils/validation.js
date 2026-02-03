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
