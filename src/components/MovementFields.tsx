import { FormField, inputClass, inputErrorClass } from './AuthForm'
import MapPicker from './MapPicker'
import type { MovementFieldValues } from '../lib/movementFieldValues'
import type { MapLocation } from '../lib/googleMaps'
import { POST_LIMITS } from '../lib/validation'
import type { MovementType } from '../types'
import type { CreatePostFieldErrors } from '../lib/validation'

interface MovementFieldsProps {
  movementType: MovementType
  values: MovementFieldValues
  onChange: (key: keyof MovementFieldValues, value: string) => void
  mapLocation?: MapLocation
  onMapChange?: (value: MapLocation) => void
  errors: CreatePostFieldErrors
  disabled?: boolean
  /** Hides fields already collected in the create wizard story step. */
  wizardMode?: boolean
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <FormField label={label} id={id} error={error}>
      {children}
    </FormField>
  )
}

export default function MovementFields({
  movementType,
  values,
  onChange,
  mapLocation,
  onMapChange,
  errors,
  disabled,
  wizardMode = false,
}: MovementFieldsProps) {
  const ta = (id: keyof MovementFieldValues, label: string, placeholder: string) => (
    <Field label={label} id={id} error={errors[id]}>
      <textarea
        id={id}
        value={values[id]}
        onChange={(e) => onChange(id, e.target.value)}
        rows={3}
        maxLength={POST_LIMITS.fieldMax}
        placeholder={placeholder}
        className={`${inputClass} resize-y min-h-20`}
      />
    </Field>
  )

  const inp = (id: keyof MovementFieldValues, label: string, placeholder: string, type = 'text') => (
    <Field label={label} id={id} error={errors[id]}>
      <input
        id={id}
        type={type}
        value={values[id]}
        onChange={(e) => onChange(id, e.target.value)}
        maxLength={POST_LIMITS.fieldMax}
        placeholder={placeholder}
        className={`${inputClass} ${errors[id] ? inputErrorClass : ''}`}
      />
    </Field>
  )

  switch (movementType) {
    case 'idea_for_change':
      return (
        <div className="space-y-4 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Idea details
          </p>
          {ta('proposed_solution', 'Proposed solution', 'What practical solution do you propose?')}
          {!wizardMode &&
            ta('expected_impact', 'Expected impact', 'What positive change could this create?')}
        </div>
      )
    case 'raise_voice':
      if (wizardMode) {
        return (
          <p className="text-sm leading-relaxed text-secondary">
            Your story is captured in the previous step. You can continue when ready.
          </p>
        )
      }
      return (
        <div className="space-y-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">Your voice</p>
          {ta('issue_summary', 'Issue summary', 'What problem or injustice are you highlighting?')}
          {ta('desired_change', 'Desired change', 'What change do you want to see?')}
        </div>
      )
    case 'volunteer_drive':
      return (
        <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            Volunteer event
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {inp('event_date', 'Event date', '', 'date')}
            {inp('event_time', 'Event time', 'e.g. 10:00 AM')}
          </div>
          {inp('location', 'Location name', 'Where will volunteers meet?')}
          {onMapChange && mapLocation && (
            <MapPicker
              value={{
                ...mapLocation,
                location_name: values.location || mapLocation.location_name,
              }}
              onChange={(loc) => {
                onMapChange(loc)
                if (loc.location_name && !values.location) {
                  onChange('location', loc.location_name)
                }
              }}
              disabled={disabled}
            />
          )}
          {inp('volunteer_slots', 'Available slots', 'e.g. 20', 'number')}
          {ta('contact_note', 'Contact note', 'How can volunteers reach you? (optional)')}
        </div>
      )
    case 'fundraising':
      return (
        <div className="space-y-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
            Campaign details
          </p>
          <p className="text-xs text-violet-700/90">
            Support intent only — payments are not processed on ForFuture yet. Progress shown is for
            demonstration.
          </p>
          {inp('fundraising_goal_amount', 'Fundraising goal ($)', '5000', 'number')}
          {ta('fundraising_purpose', 'Fundraising purpose', 'What will funds be used for?')}
          {ta(
            'beneficiary_description',
            'Who benefits',
            'Who or what community will this campaign help?',
          )}
        </div>
      )
    case 'youth_petition':
      return (
        <div className="space-y-4 rounded-xl border border-fuchsia-100 bg-fuchsia-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-900">
            Youth Petition
          </p>
          <p className="text-xs leading-relaxed text-fuchsia-800/90">
            Gather youth support for a clear call for change. This is community advocacy on
            ForFuture — not a government-verified or legally binding signature system.
          </p>
          {ta(
            'petition_issue',
            'Issue / problem',
            'Explain the problem that needs attention.',
          )}
          {ta(
            'petition_requested_change',
            'Requested change',
            'Clearly state what action or change is being requested.',
          )}
          {inp(
            'petition_target_authority',
            'Target authority or audience',
            'e.g. Local Council, School Administration, Transport Authority',
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {inp('petition_support_goal', 'Support goal (optional)', 'e.g. 500', 'number')}
            {inp('petition_closing_date', 'Closing date (optional)', '', 'date')}
          </div>
          {ta(
            'petition_impact_note',
            'Why this matters (optional)',
            'A short note on why this change is important.',
          )}
        </div>
      )
    case 'peaceful_civic_action':
      return (
        <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
            Peaceful civic action
          </p>
          <p className="text-xs text-indigo-700/90">
            ForFuture supports lawful, peaceful civic participation only.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {inp('action_date', 'Action date', '', 'date')}
            {inp('action_time', 'Action time', 'e.g. 2:00 PM')}
          </div>
          {inp('action_location', 'Location name', 'Where will this take place?')}
          {onMapChange && mapLocation && (
            <MapPicker
              value={{
                ...mapLocation,
                location_name: values.action_location || mapLocation.location_name,
              }}
              onChange={(loc) => {
                onMapChange(loc)
                if (loc.location_name && !values.action_location) {
                  onChange('action_location', loc.location_name)
                }
              }}
              disabled={disabled}
              label="Action location on map"
            />
          )}
          {ta('action_purpose', 'Purpose', 'What is the goal of this peaceful action?')}
          {ta(
            'safety_note',
            'Safety & conduct note (optional)',
            'Remind participants to stay peaceful and follow local laws.',
          )}
        </div>
      )
    default:
      return null
  }
}
