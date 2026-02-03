import { useFormContext } from 'react-hook-form'
import FormField from '../FormFields/FormField'
import SelectField from '../FormFields/SelectField'
import AddressAutocomplete from '../AddressAutocomplete'
import { US_STATES } from '../../utils/constants'

export default function StepDefendant() {
  const { register, formState: { errors }, watch, setValue } = useFormContext()
  const supervisionStatus = watch('defendant.supervisionStatus')
  const address = watch('defendant.address')
  const employerAddress = watch('defendant.employerAddress')
  
  // Handle defendant address selection from autocomplete
  const handleAddressSelect = (addressData) => {
    setValue('defendant.address', addressData.address)
    setValue('defendant.city', addressData.city)
    setValue('defendant.state', addressData.stateShort)
    setValue('defendant.zip', addressData.zip)
    setValue('defendant.county', addressData.county)
    setValue('defendant.fullAddress', addressData.fullAddress)
  }
  
  // Handle employer address selection
  const handleEmployerAddressSelect = (addressData) => {
    setValue('defendant.employerAddress', addressData.fullAddress)
  }
  
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <section className="form-section">
        <h2 className="section-title">Defendant Personal Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Also Known As (AKA)"
            name="defendant.aka"
            placeholder="Nicknames or aliases"
            {...register('defendant.aka')}
          />
          
          <FormField
            label="Social Security Number"
            name="defendant.ssn"
            type="password"
            placeholder="XXX-XX-XXXX"
            {...register('defendant.ssn')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Driver's License / ID Number"
            name="defendant.driversLicense"
            {...register('defendant.driversLicense')}
          />
          
          <SelectField
            label="State Issued"
            name="defendant.dlState"
            options={US_STATES}
            {...register('defendant.dlState')}
          />
        </div>
      </section>
      
      {/* Address */}
      <section className="form-section">
        <h2 className="section-title">Defendant Address</h2>
        
        <AddressAutocomplete
          label="Street Address"
          value={address}
          onChange={(value) => setValue('defendant.address', value)}
          onAddressSelect={handleAddressSelect}
          placeholder="Start typing defendant's address..."
        />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="col-span-2">
            <FormField
              label="City"
              name="defendant.city"
              {...register('defendant.city')}
            />
          </div>
          
          <SelectField
            label="State"
            name="defendant.state"
            options={US_STATES}
            {...register('defendant.state')}
          />
          
          <FormField
            label="ZIP Code"
            name="defendant.zip"
            {...register('defendant.zip')}
          />
        </div>
        
        <div className="mt-4">
          <FormField
            label="How Long at This Address?"
            name="defendant.addressDuration"
            placeholder="e.g., 2 years"
            {...register('defendant.addressDuration')}
          />
        </div>
      </section>
      
      {/* Employment */}
      <section className="form-section">
        <h2 className="section-title">Defendant Employment</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Employer"
            name="defendant.employer"
            {...register('defendant.employer')}
          />
          
          <FormField
            label="Occupation"
            name="defendant.occupation"
            {...register('defendant.occupation')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <AddressAutocomplete
            label="Employer Address"
            value={employerAddress}
            onChange={(value) => setValue('defendant.employerAddress', value)}
            onAddressSelect={handleEmployerAddressSelect}
            placeholder="Start typing employer's address..."
          />
          
          <FormField
            label="How Long Employed?"
            name="defendant.employmentDuration"
            {...register('defendant.employmentDuration')}
          />
        </div>
        
        <div className="mt-4">
          <FormField
            label="Monthly Income"
            name="defendant.monthlyIncome"
            type="number"
            placeholder="$"
            {...register('defendant.monthlyIncome', { valueAsNumber: true })}
          />
        </div>
      </section>
      
      {/* Arrest Information */}
      <section className="form-section">
        <h2 className="section-title">Arrest Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Date Arrested"
            name="defendant.arrestDate"
            type="date"
            {...register('defendant.arrestDate')}
          />
          
          <FormField
            label="Arresting Agency"
            name="defendant.arrestingAgency"
            placeholder="e.g., ICE, Local PD"
            {...register('defendant.arrestingAgency')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Where Arrested"
            name="defendant.arrestLocation"
            {...register('defendant.arrestLocation')}
          />
          
          <FormField
            label="Co-Defendants"
            name="defendant.coDefendants"
            placeholder="Names of any co-defendants"
            {...register('defendant.coDefendants')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Jail Location"
            name="defendant.jailLocation"
            {...register('defendant.jailLocation')}
          />
          
          <FormField
            label="Booking Number"
            name="defendant.bookingNumber"
            {...register('defendant.bookingNumber')}
          />
        </div>
        
        <div className="mt-4">
          <FormField
            label="Alien Number (if applicable)"
            name="defendant.alienNumber"
            placeholder="A-Number"
            {...register('defendant.alienNumber')}
          />
        </div>
      </section>
      
      {/* Supervision Status */}
      <section className="form-section">
        <h2 className="section-title">Supervision Status</h2>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="None"
              className="w-4 h-4 text-brand-600"
              {...register('defendant.supervisionStatus')}
            />
            <span>None</span>
          </label>
          
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="Probation"
              className="w-4 h-4 text-brand-600"
              {...register('defendant.supervisionStatus')}
            />
            <span>Currently on Probation</span>
          </label>
          
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="Parole"
              className="w-4 h-4 text-brand-600"
              {...register('defendant.supervisionStatus')}
            />
            <span>Currently on Parole</span>
          </label>
        </div>
        
        {(supervisionStatus === 'Probation' || supervisionStatus === 'Parole') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              label="Officer Name"
              name="defendant.supervisionOfficer"
              {...register('defendant.supervisionOfficer')}
            />
            
            <FormField
              label="Officer Phone"
              name="defendant.supervisionOfficerPhone"
              type="tel"
              {...register('defendant.supervisionOfficerPhone')}
            />
          </div>
        )}
      </section>
    </div>
  )
}
