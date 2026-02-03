import { useFormContext } from 'react-hook-form'
import FormField from '../FormFields/FormField'
import SelectField from '../FormFields/SelectField'

const RELATIONSHIPS = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Employer',
  'Other Family',
  'Other'
]

export default function StepBasicInfo() {
  const { register, formState: { errors } } = useFormContext()
  
  return (
    <div className="space-y-6">
      {/* Defendant Section */}
      <section className="form-section">
        <h2 className="section-title">Who needs to be bonded out?</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter the basic information about the person in custody (the defendant).
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="First Name"
            name="defendant.firstName"
            required
            error={errors.defendant?.firstName}
            {...register('defendant.firstName', { required: 'First name is required' })}
          />
          
          <FormField
            label="Last Name"
            name="defendant.lastName"
            required
            error={errors.defendant?.lastName}
            {...register('defendant.lastName', { required: 'Last name is required' })}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Date of Birth"
            name="defendant.dob"
            type="date"
            required
            error={errors.defendant?.dob}
            {...register('defendant.dob', { required: 'Date of birth is required' })}
          />
          
          <FormField
            label="Phone Number"
            name="defendant.cellPhone"
            type="tel"
            placeholder="(555) 555-5555"
            {...register('defendant.cellPhone')}
          />
        </div>
      </section>
      
      {/* Indemnitor Section */}
      <section className="form-section">
        <h2 className="section-title">Your Information (Co-Signer)</h2>
        <p className="text-sm text-gray-500 mb-4">
          You are the indemnitor (co-signer) who will be responsible for the bond.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Your First Name"
            name="indemnitor.firstName"
            required
            error={errors.indemnitor?.firstName}
            {...register('indemnitor.firstName', { required: 'Your first name is required' })}
          />
          
          <FormField
            label="Your Last Name"
            name="indemnitor.lastName"
            required
            error={errors.indemnitor?.lastName}
            {...register('indemnitor.lastName', { required: 'Your last name is required' })}
          />
        </div>
        
        <div className="mt-4">
          <SelectField
            label="Your Relationship to Defendant"
            name="indemnitor.relationshipToDefendant"
            required
            options={RELATIONSHIPS}
            error={errors.indemnitor?.relationshipToDefendant}
            {...register('indemnitor.relationshipToDefendant', { 
              required: 'Please select your relationship' 
            })}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Your Phone Number"
            name="indemnitor.cellPhone"
            type="tel"
            required
            placeholder="(555) 555-5555"
            error={errors.indemnitor?.cellPhone}
            {...register('indemnitor.cellPhone', { required: 'Phone number is required' })}
          />
          
          <FormField
            label="Your Email"
            name="indemnitor.email"
            type="email"
            required
            placeholder="you@example.com"
            error={errors.indemnitor?.email}
            {...register('indemnitor.email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
        </div>
      </section>
    </div>
  )
}
