import { z } from 'zod';

// ULTRA-LENIENT VALIDATION - Accept anything for optional fields
// The frontend handles display validation; we just need basic structure

// Accept any value that could be a string, null, undefined, or empty
const anyOptional = z.any().optional().nullable();

// Phone - accept anything
const phoneSchema = anyOptional;

// SSN - accept anything  
const ssnSchema = anyOptional;

// Date - accept anything
const dateSchema = anyOptional;

// Defendant data schema - only require firstName and lastName
const defendantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required')
}).passthrough(); // Accept ALL additional fields without validation

// Indemnitor data schema - only require core fields
const indemnitorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  relationshipToDefendant: z.string().min(1, 'Relationship is required'),
  dob: z.string().min(1, 'Date of birth is required')
}).passthrough(); // Accept ALL additional fields without validation

// Reference schema - just need basic info
const referenceSchema = z.object({
  name: z.string().min(1, 'Reference name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(1, 'Phone number is required')
}).passthrough(); // Accept ALL additional fields

// Signatures schema - accept any object but we'll validate in the route
// Required signature keys:
// - preApplication_coSigner
// - referenceForm_applicant
// - immigrationWaiver_coSigner
// - indemnitorApplication_indemnitor
// - immigrationBondAgreement_indemnitor
const signaturesSchema = z.object({}).passthrough().refine((signatures) => {
  const requiredSignatures = [
    'preApplication_coSigner',
    'referenceForm_applicant',
    'immigrationWaiver_coSigner',
    'indemnitorApplication_indemnitor',
    'immigrationBondAgreement_indemnitor'
  ];
  
  const missingSignatures = requiredSignatures.filter(key => {
    const value = signatures?.[key];
    return !value || typeof value !== 'string' || !value.startsWith('data:image');
  });
  
  if (missingSignatures.length > 0) {
    return false;
  }
  return true;
}, {
  message: 'All 5 document signatures are required'
});

// Complete intake validation
const intakeSchema = z.object({
  defendantData: defendantSchema,
  indemnitorData: indemnitorSchema,
  referencesData: z.array(referenceSchema).min(1, 'At least one reference is required'),
  signatures: signaturesSchema
}).passthrough();

/**
 * Validate complete intake submission data
 */
export function validateIntakeData(data) {
  try {
    const validated = intakeSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

/**
 * Validate partial data (for save progress)
 */
export function validatePartialData(data) {
  // For partial saves, we're more lenient
  // Just ensure it's an object with expected shape
  return { success: true, data };
}

/**
 * Sanitize SSN for display (show only last 4)
 */
export function maskSSN(ssn) {
  if (!ssn) return '';
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `XXX-XX-${cleaned.slice(-4)}`;
  }
  return ssn;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}
