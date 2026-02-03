import { useFormContext, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import FormField from '../FormFields/FormField'
import SelectField from '../FormFields/SelectField'
import AddressAutocomplete from '../AddressAutocomplete'

const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Spouse',
  'Friend',
  'Employer',
  'Coworker',
  'Neighbor',
  'Other'
]

export default function StepReferences() {
  const { register, control, formState: { errors }, watch, setValue } = useFormContext()
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'references'
  })
  
  const addReference = () => {
    if (fields.length < 5) {
      append({ name: '', relationship: '', phone: '', address: '', city: '', state: '', zip: '' })
    }
  }
  
  // Handle address selection for a specific reference
  const handleAddressSelect = (index, addressData) => {
    setValue(`references.${index}.address`, addressData.address)
    setValue(`references.${index}.city`, addressData.city)
    setValue(`references.${index}.state`, addressData.stateShort)
    setValue(`references.${index}.zip`, addressData.zip)
    setValue(`references.${index}.fullAddress`, addressData.fullAddress)
  }
  
  return (
    <div className="space-y-6">
      <section className="form-section">
        <h2 className="section-title">References</h2>
        <p className="text-sm text-gray-500 mb-4">
          Please provide at least 3 references who can vouch for the defendant. 
          These should be people who know the defendant well (family, friends, employers).
        </p>
        
        {fields.map((field, index) => (
          <ReferenceCard
            key={field.id}
            index={index}
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            onRemove={() => remove(index)}
            onAddressSelect={(addressData) => handleAddressSelect(index, addressData)}
            canRemove={index >= 3}
            isRequired={index < 3}
          />
        ))}
        
        {fields.length < 5 && (
          <button
            type="button"
            onClick={addReference}
            className="btn-secondary w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Reference
          </button>
        )}
        
        <p className="text-xs text-gray-500 mt-4">
          * At least 3 references are required
        </p>
      </section>
    </div>
  )
}

// Separate component for each reference card
function ReferenceCard({ index, register, errors, watch, setValue, onRemove, onAddressSelect, canRemove, isRequired }) {
  const address = watch(`references.${index}.address`)
  
  return (
    <div className="border rounded-lg p-4 mb-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">
          Reference #{index + 1}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Full Name"
          name={`references.${index}.name`}
          required={isRequired}
          error={errors.references?.[index]?.name}
          {...register(`references.${index}.name`, {
            required: isRequired ? 'Name is required' : false
          })}
        />
        
        <SelectField
          label="Relationship"
          name={`references.${index}.relationship`}
          options={RELATIONSHIPS}
          required={isRequired}
          error={errors.references?.[index]?.relationship}
          {...register(`references.${index}.relationship`, {
            required: isRequired ? 'Relationship is required' : false
          })}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FormField
          label="Phone Number"
          name={`references.${index}.phone`}
          type="tel"
          required={isRequired}
          placeholder="(555) 555-5555"
          error={errors.references?.[index]?.phone}
          {...register(`references.${index}.phone`, {
            required: isRequired ? 'Phone is required' : false
          })}
        />
        
        <FormField
          label="Work Phone (Optional)"
          name={`references.${index}.workPhone`}
          type="tel"
          placeholder="(555) 555-5555"
          {...register(`references.${index}.workPhone`)}
        />
      </div>
      
      <div className="mt-4">
        <AddressAutocomplete
          label="Address"
          value={address}
          onChange={(value) => setValue(`references.${index}.address`, value)}
          onAddressSelect={onAddressSelect}
          placeholder="Start typing reference's address..."
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <FormField
          label="City"
          name={`references.${index}.city`}
          {...register(`references.${index}.city`)}
        />
        
        <FormField
          label="State"
          name={`references.${index}.state`}
          {...register(`references.${index}.state`)}
        />
        
        <FormField
          label="ZIP"
          name={`references.${index}.zip`}
          {...register(`references.${index}.zip`)}
        />
      </div>
    </div>
  )
}
