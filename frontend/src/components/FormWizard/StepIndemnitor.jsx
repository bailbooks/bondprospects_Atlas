import { useFormContext } from 'react-hook-form'
import FormField from '../FormFields/FormField'
import SelectField from '../FormFields/SelectField'
import AddressAutocomplete from '../AddressAutocomplete'
import { US_STATES, MARITAL_STATUSES } from '../../utils/constants'

export default function StepIndemnitor() {
  const { register, formState: { errors }, watch, setValue } = useFormContext()
  const ownershipStatus = watch('indemnitor.ownershipStatus')
  const usCitizen = watch('indemnitor.usCitizen')
  const address = watch('indemnitor.address')
  
  // Handle address selection from autocomplete
  const handleAddressSelect = (addressData) => {
    setValue('indemnitor.address', addressData.address)
    setValue('indemnitor.city', addressData.city)
    setValue('indemnitor.state', addressData.stateShort)
    setValue('indemnitor.zip', addressData.zip)
    setValue('indemnitor.county', addressData.county)
    setValue('indemnitor.fullAddress', addressData.fullAddress)
  }
  
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <section className="form-section">
        <h2 className="section-title">Your Personal Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Nickname (Friends/Family Know Me As)"
            name="indemnitor.nickname"
            {...register('indemnitor.nickname')}
          />
          
          <FormField
            label="Date of Birth"
            name="indemnitor.dob"
            type="date"
            required
            error={errors.indemnitor?.dob}
            {...register('indemnitor.dob', { required: 'Date of birth is required' })}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Social Security Number"
            name="indemnitor.ssn"
            type="password"
            placeholder="XXX-XX-XXXX"
            {...register('indemnitor.ssn')}
          />
          
          <FormField
            label="Birth Place"
            name="indemnitor.birthPlace"
            {...register('indemnitor.birthPlace')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Driver's License / ID Number"
            name="indemnitor.driversLicense"
            {...register('indemnitor.driversLicense')}
          />
          
          <SelectField
            label="State Issued"
            name="indemnitor.dlState"
            options={US_STATES}
            {...register('indemnitor.dlState')}
          />
        </div>
        
        {/* Gender */}
        <div className="mt-4">
          <label className="label">Gender</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="M"
                className="w-4 h-4 text-brand-600"
                {...register('indemnitor.gender')}
              />
              <span>Male</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="F"
                className="w-4 h-4 text-brand-600"
                {...register('indemnitor.gender')}
              />
              <span>Female</span>
            </label>
          </div>
        </div>
        
        {/* US Citizen */}
        <div className="mt-4">
          <label className="label">Are you a U.S. Citizen?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="true"
                className="w-4 h-4 text-brand-600"
                {...register('indemnitor.usCitizen')}
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="false"
                className="w-4 h-4 text-brand-600"
                {...register('indemnitor.usCitizen')}
              />
              <span>No</span>
            </label>
          </div>
        </div>
        
        {usCitizen === 'false' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              label="Alien Number"
              name="indemnitor.alienNumber"
              {...register('indemnitor.alienNumber')}
            />
            
            <FormField
              label="How Long in US?"
              name="indemnitor.yearsInUS"
              {...register('indemnitor.yearsInUS')}
            />
          </div>
        )}
      </section>
      
      {/* Current Address */}
      <section className="form-section">
        <h2 className="section-title">Your Current Address</h2>
        
        <AddressAutocomplete
          label="Street Address"
          value={address}
          onChange={(value) => setValue('indemnitor.address', value)}
          onAddressSelect={handleAddressSelect}
          required
          error={errors.indemnitor?.address?.message}
          placeholder="Start typing your address..."
        />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="col-span-2">
            <FormField
              label="City"
              name="indemnitor.city"
              required
              {...register('indemnitor.city', { required: 'City is required' })}
            />
          </div>
          
          <SelectField
            label="State"
            name="indemnitor.state"
            options={US_STATES}
            required
            {...register('indemnitor.state', { required: 'State is required' })}
          />
          
          <FormField
            label="ZIP Code"
            name="indemnitor.zip"
            required
            {...register('indemnitor.zip', { required: 'ZIP is required' })}
          />
        </div>
        
        <div className="mt-4">
          <label className="label">Do you own or rent?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="Own"
                className="w-4 h-4 text-brand-600"
                {...register('indemnitor.ownershipStatus')}
              />
              <span>Own</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="Rent"
                className="w-4 h-4 text-brand-600"
                {...register('indemnitor.ownershipStatus')}
              />
              <span>Rent</span>
            </label>
          </div>
        </div>
        
        {ownershipStatus === 'Rent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              label="Landlord Name"
              name="indemnitor.landlordName"
              {...register('indemnitor.landlordName')}
            />
            
            <FormField
              label="Landlord Phone"
              name="indemnitor.landlordPhone"
              type="tel"
              {...register('indemnitor.landlordPhone')}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="How Long at This Address?"
            name="indemnitor.addressDuration"
            placeholder="e.g., 2 years"
            {...register('indemnitor.addressDuration')}
          />
          
          <SelectField
            label="Marital Status"
            name="indemnitor.maritalStatus"
            options={MARITAL_STATUSES}
            {...register('indemnitor.maritalStatus')}
          />
        </div>
      </section>
      
      {/* Employment */}
      <section className="form-section">
        <h2 className="section-title">Your Employment</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Employer"
            name="indemnitor.employer"
            {...register('indemnitor.employer')}
          />
          
          <FormField
            label="Position"
            name="indemnitor.position"
            {...register('indemnitor.position')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Supervisor's Name"
            name="indemnitor.supervisorName"
            {...register('indemnitor.supervisorName')}
          />
          
          <FormField
            label="Work Phone"
            name="indemnitor.workPhone"
            type="tel"
            {...register('indemnitor.workPhone')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="How Long Employed?"
            name="indemnitor.employmentDuration"
            {...register('indemnitor.employmentDuration')}
          />
          
          <FormField
            label="Monthly Income"
            name="indemnitor.monthlyIncome"
            type="number"
            placeholder="$"
            {...register('indemnitor.monthlyIncome', { valueAsNumber: true })}
          />
        </div>
      </section>
      
      {/* Financial (Optional) */}
      <section className="form-section">
        <h2 className="section-title">Financial Information (Optional)</h2>
        <p className="text-sm text-gray-500 mb-4">
          This information helps determine bond eligibility.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Cash on Hand"
            name="indemnitor.cashOnHand"
            type="number"
            placeholder="$"
            {...register('indemnitor.cashOnHand', { valueAsNumber: true })}
          />
          
          <FormField
            label="Cash in Bank"
            name="indemnitor.cashInBank"
            type="number"
            placeholder="$"
            {...register('indemnitor.cashInBank', { valueAsNumber: true })}
          />
          
          <FormField
            label="Monthly Salary"
            name="indemnitor.monthlySalary"
            type="number"
            placeholder="$"
            {...register('indemnitor.monthlySalary', { valueAsNumber: true })}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Real Estate Value"
            name="indemnitor.realEstateValue"
            type="number"
            placeholder="$"
            {...register('indemnitor.realEstateValue', { valueAsNumber: true })}
          />
          
          <FormField
            label="Real Estate Mortgage Owed"
            name="indemnitor.realEstateMortgage"
            type="number"
            placeholder="$"
            {...register('indemnitor.realEstateMortgage', { valueAsNumber: true })}
          />
        </div>
      </section>
      
      {/* Vehicle (Optional) */}
      <section className="form-section">
        <h2 className="section-title">Vehicle Information (Optional)</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            label="Year"
            name="indemnitor.vehicleYear"
            {...register('indemnitor.vehicleYear')}
          />
          
          <FormField
            label="Make"
            name="indemnitor.vehicleMake"
            {...register('indemnitor.vehicleMake')}
          />
          
          <FormField
            label="Model"
            name="indemnitor.vehicleModel"
            {...register('indemnitor.vehicleModel')}
          />
          
          <FormField
            label="Color"
            name="indemnitor.vehicleColor"
            {...register('indemnitor.vehicleColor')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <FormField
            label="License Plate"
            name="indemnitor.vehiclePlate"
            {...register('indemnitor.vehiclePlate')}
          />
          
          <SelectField
            label="Plate State"
            name="indemnitor.vehicleState"
            options={US_STATES}
            {...register('indemnitor.vehicleState')}
          />
          
          <FormField
            label="Balance Owed"
            name="indemnitor.vehicleBalanceOwed"
            type="number"
            placeholder="$"
            {...register('indemnitor.vehicleBalanceOwed', { valueAsNumber: true })}
          />
        </div>
      </section>
    </div>
  )
}
