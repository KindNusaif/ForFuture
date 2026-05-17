import { FormField, inputClass, inputErrorClass } from '../AuthForm'
import MapPicker from '../MapPicker'
import { BLOOD_GROUPS, ITEM_CATEGORIES, URGENCY_LEVELS } from '../../lib/reliefHub'
import type { ReliefFieldValues } from '../../lib/reliefFieldValues'
import type { MapLocation } from '../../lib/googleMaps'
import type { ReliefCreateSubtype } from '../../lib/reliefHub'
import { POST_LIMITS } from '../../lib/validation'
import { useTranslation } from 'react-i18next'

interface ReliefHubFieldsProps {
  subtype: ReliefCreateSubtype
  values: ReliefFieldValues
  onChange: (key: keyof ReliefFieldValues, value: string) => void
  mapLocation?: MapLocation
  onMapChange?: (value: MapLocation) => void
  errors: Record<string, string | undefined>
  disabled?: boolean
}

export default function ReliefHubFields({
  subtype,
  values,
  onChange,
  mapLocation,
  onMapChange,
  errors,
  disabled,
}: ReliefHubFieldsProps) {
  const { t } = useTranslation()

  const inp = (
    id: keyof ReliefFieldValues,
    label: string,
    placeholder: string,
    type = 'text',
  ) => (
    <FormField label={label} id={id} error={errors[id]}>
      <input
        id={id}
        type={type}
        value={values[id]}
        onChange={(e) => onChange(id, e.target.value)}
        maxLength={POST_LIMITS.fieldMax}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClass} ${errors[id] ? inputErrorClass : ''}`}
      />
    </FormField>
  )

  const ta = (id: keyof ReliefFieldValues, label: string, placeholder: string) => (
    <FormField label={label} id={id} error={errors[id]}>
      <textarea
        id={id}
        value={values[id]}
        onChange={(e) => onChange(id, e.target.value)}
        rows={3}
        maxLength={POST_LIMITS.fieldMax}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClass} min-h-[80px] resize-y`}
      />
    </FormField>
  )

  if (subtype === 'blood_donation') {
    return (
      <div className="space-y-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
        <FormField label={t('relief.fields.bloodGroup')} id="blood_group" error={errors.blood_group}>
          <select
            id="blood_group"
            value={values.blood_group}
            onChange={(e) => onChange('blood_group', e.target.value)}
            disabled={disabled}
            className={`${inputClass} ${errors.blood_group ? inputErrorClass : ''}`}
            aria-invalid={Boolean(errors.blood_group)}
          >
            <option value="">{t('relief.fields.selectBloodGroup')}</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {t(g.labelKey)}
              </option>
            ))}
          </select>
        </FormField>
        {inp('hospital_or_organizer', t('relief.fields.hospital'), t('relief.fields.hospitalPh'))}
        <FormField label={t('relief.fields.urgency')} id="urgency_level" error={errors.urgency_level}>
          <select
            id="urgency_level"
            value={values.urgency_level}
            onChange={(e) => onChange('urgency_level', e.target.value)}
            disabled={disabled}
            className={`${inputClass} ${errors.urgency_level ? inputErrorClass : ''}`}
          >
            {URGENCY_LEVELS.map((u) => (
              <option key={u.value} value={u.value}>
                {t(u.labelKey)}
              </option>
            ))}
          </select>
        </FormField>
        {inp('donors_needed', t('relief.fields.donorsNeeded'), '5', 'number')}
        {inp('needed_by_date', t('relief.fields.neededBy'), '', 'date')}
        {ta('contact_note', t('relief.fields.contact'), t('relief.fields.contactPh'))}
        {mapLocation && onMapChange && (
          <MapPicker value={mapLocation} onChange={onMapChange} disabled={disabled} />
        )}
        <p className="text-[11px] leading-relaxed text-slate-500">{t('relief.bloodSafetyNote')}</p>
      </div>
    )
  }

  if (subtype === 'item_donation') {
    return (
      <div className="space-y-4 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
        <FormField label={t('relief.fields.itemCategory')} id="item_category" error={errors.item_category}>
          <select
            id="item_category"
            value={values.item_category}
            onChange={(e) => onChange('item_category', e.target.value)}
            disabled={disabled}
            className={inputClass}
          >
            {ITEM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.labelKey)}
              </option>
            ))}
          </select>
        </FormField>
        {ta('items_needed', t('relief.fields.itemsNeeded'), t('relief.fields.itemsNeededPh'))}
        {inp('quantity_needed', t('relief.fields.quantity'), '', 'number')}
        {ta('beneficiary_group', t('relief.fields.beneficiary'), t('relief.fields.beneficiaryPh'))}
        {inp(
          'collection_location',
          t('relief.fields.collectionLocation'),
          t('relief.fields.collectionPh'),
        )}
        {inp('relief_deadline', t('relief.fields.deadline'), '', 'date')}
        {ta('contact_note', t('relief.fields.contact'), t('relief.fields.contactPh'))}
        {mapLocation && onMapChange && (
          <MapPicker value={mapLocation} onChange={onMapChange} disabled={disabled} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-sky-100 bg-sky-50/40 p-4">
      {ta('fundraising_purpose', t('relief.fields.purpose'), t('relief.fields.purposePh'))}
      {ta(
        'beneficiary_description',
        t('relief.fields.beneficiaryDesc'),
        t('relief.fields.beneficiaryDescPh'),
      )}
      {inp('fundraising_goal_amount', t('relief.fields.goalAmount'), '1000', 'number')}
      {ta(
        'organizer_transparency_note',
        t('relief.fields.transparency'),
        t('relief.fields.transparencyPh'),
      )}
      {inp('relief_deadline', t('relief.fields.deadline'), '', 'date')}
      <p className="text-[11px] leading-relaxed text-slate-500">{t('relief.fundraisingDisclaimer')}</p>
    </div>
  )
}
