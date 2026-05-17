-- Fix: public.posts insert/update facade must forward Donation & Relief columns.
-- Without this, donation_subtype is dropped and triggers raise:
--   "Donation & Relief posts require a donation subtype"
-- Run in Supabase SQL Editor (safe to re-run).

create or replace function public.posts_facade_insert()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
declare inserted private.posts%rowtype;
begin
  insert into private.posts (
    user_id, title, description, category, author_name, posting_identity, youth_voice_id,
    movement_type,
    donation_subtype, relief_status, blood_group, hospital_or_organizer, urgency_level,
    donors_needed, needed_by_date, item_category, items_needed, quantity_needed,
    beneficiary_group, collection_location, relief_deadline, organizer_transparency_note,
    proposed_solution, expected_impact, issue_summary, desired_change,
    event_date, event_time, location, volunteer_slots, contact_note,
    fundraising_goal_amount, fundraising_purpose, beneficiary_description, current_raised_amount,
    action_date, action_time, action_location, action_purpose, safety_note,
    petition_issue, petition_requested_change, petition_target_authority,
    petition_support_goal, petition_closing_date, petition_impact_note,
    location_name, latitude, longitude
  ) values (
    new.user_id, new.title, new.description, new.category, new.author_name,
    new.posting_identity, new.youth_voice_id, new.movement_type,
    new.donation_subtype, coalesce(new.relief_status, 'open'), new.blood_group, new.hospital_or_organizer,
    new.urgency_level, new.donors_needed, new.needed_by_date, new.item_category, new.items_needed,
    new.quantity_needed, new.beneficiary_group, new.collection_location, new.relief_deadline,
    new.organizer_transparency_note,
    new.proposed_solution, new.expected_impact, new.issue_summary, new.desired_change,
    new.event_date, new.event_time, new.location, new.volunteer_slots, new.contact_note,
    new.fundraising_goal_amount, new.fundraising_purpose, new.beneficiary_description,
    coalesce(new.current_raised_amount, 0),
    new.action_date, new.action_time, new.action_location, new.action_purpose, new.safety_note,
    new.petition_issue, new.petition_requested_change, new.petition_target_authority,
    new.petition_support_goal, new.petition_closing_date, new.petition_impact_note,
    new.location_name, new.latitude, new.longitude
  )
  returning * into inserted;
  return inserted;
end;
$$;

create or replace function public.posts_facade_update()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
declare updated private.posts%rowtype;
begin
  update private.posts set
    title = new.title,
    description = new.description,
    category = new.category,
    author_name = new.author_name,
    posting_identity = new.posting_identity,
    youth_voice_id = new.youth_voice_id,
    movement_type = new.movement_type,
    donation_subtype = new.donation_subtype,
    relief_status = coalesce(new.relief_status, relief_status),
    blood_group = new.blood_group,
    hospital_or_organizer = new.hospital_or_organizer,
    urgency_level = new.urgency_level,
    donors_needed = new.donors_needed,
    needed_by_date = new.needed_by_date,
    item_category = new.item_category,
    items_needed = new.items_needed,
    quantity_needed = new.quantity_needed,
    beneficiary_group = new.beneficiary_group,
    collection_location = new.collection_location,
    relief_deadline = new.relief_deadline,
    organizer_transparency_note = new.organizer_transparency_note,
    proposed_solution = new.proposed_solution,
    expected_impact = new.expected_impact,
    issue_summary = new.issue_summary,
    desired_change = new.desired_change,
    event_date = new.event_date,
    event_time = new.event_time,
    location = new.location,
    volunteer_slots = new.volunteer_slots,
    contact_note = new.contact_note,
    fundraising_goal_amount = new.fundraising_goal_amount,
    fundraising_purpose = new.fundraising_purpose,
    beneficiary_description = new.beneficiary_description,
    current_raised_amount = coalesce(new.current_raised_amount, 0),
    action_date = new.action_date,
    action_time = new.action_time,
    action_location = new.action_location,
    action_purpose = new.action_purpose,
    safety_note = new.safety_note,
    petition_issue = new.petition_issue,
    petition_requested_change = new.petition_requested_change,
    petition_target_authority = new.petition_target_authority,
    petition_support_goal = new.petition_support_goal,
    petition_closing_date = new.petition_closing_date,
    petition_impact_note = new.petition_impact_note,
    location_name = new.location_name,
    latitude = new.latitude,
    longitude = new.longitude
  where id = old.id
  returning * into updated;

  if updated.id is null then
    raise exception 'Post not found or not authorized';
  end if;

  return updated;
end;
$$;

notify pgrst, 'reload schema';
