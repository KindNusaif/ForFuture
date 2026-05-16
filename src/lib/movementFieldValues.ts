export interface MovementFieldValues {
  proposed_solution: string
  expected_impact: string
  issue_summary: string
  desired_change: string
  event_date: string
  event_time: string
  location: string
  volunteer_slots: string
  contact_note: string
  fundraising_goal_amount: string
  fundraising_purpose: string
  beneficiary_description: string
  action_date: string
  action_time: string
  action_location: string
  action_purpose: string
  safety_note: string
}

export function emptyMovementFields(): MovementFieldValues {
  return {
    proposed_solution: '',
    expected_impact: '',
    issue_summary: '',
    desired_change: '',
    event_date: '',
    event_time: '',
    location: '',
    volunteer_slots: '',
    contact_note: '',
    fundraising_goal_amount: '',
    fundraising_purpose: '',
    beneficiary_description: '',
    action_date: '',
    action_time: '',
    action_location: '',
    action_purpose: '',
    safety_note: '',
  }
}
