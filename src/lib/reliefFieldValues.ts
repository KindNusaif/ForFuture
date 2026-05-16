export interface ReliefFieldValues {
  blood_group: string
  hospital_or_organizer: string
  urgency_level: string
  donors_needed: string
  needed_by_date: string
  item_category: string
  items_needed: string
  quantity_needed: string
  beneficiary_group: string
  collection_location: string
  relief_deadline: string
  organizer_transparency_note: string
  contact_note: string
  fundraising_goal_amount: string
  fundraising_purpose: string
  beneficiary_description: string
}

export function emptyReliefFields(): ReliefFieldValues {
  return {
    blood_group: '',
    hospital_or_organizer: '',
    urgency_level: 'urgent_today',
    donors_needed: '',
    needed_by_date: '',
    item_category: 'other_essentials',
    items_needed: '',
    quantity_needed: '',
    beneficiary_group: '',
    collection_location: '',
    relief_deadline: '',
    organizer_transparency_note: '',
    contact_note: '',
    fundraising_goal_amount: '',
    fundraising_purpose: '',
    beneficiary_description: '',
  }
}
