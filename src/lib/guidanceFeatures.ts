import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  Fingerprint,
  HandHeart,
  Map,
  Megaphone,
  ScrollText,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react'

export interface GuidanceFeature {
  id: string
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
  ctaKey: string
  to: string
  titleDefault: string
  descriptionDefault: string
  ctaDefault: string
}

export const GUIDANCE_FEATURES: GuidanceFeature[] = [
  {
    id: 'movements',
    icon: Megaphone,
    titleKey: 'guidance.features.movements.title',
    descriptionKey: 'guidance.features.movements.description',
    ctaKey: 'guidance.features.movements.cta',
    to: '/explore',
    titleDefault: 'Youth Movements',
    descriptionDefault:
      'Organized civic actions created by young people to raise issues, gather support, and create change.',
    ctaDefault: 'Explore Movements',
  },
  {
    id: 'voice',
    icon: Sparkles,
    titleKey: 'guidance.features.voice.title',
    descriptionKey: 'guidance.features.voice.description',
    ctaKey: 'guidance.features.voice.cta',
    to: '/how-it-works#youth-voice',
    titleDefault: 'Raise Your Voice',
    descriptionDefault:
      'Share an issue, concern, or idea that your community needs to hear.',
    ctaDefault: 'Create a Voice Post',
  },
  {
    id: 'petitions',
    icon: ScrollText,
    titleKey: 'guidance.features.petitions.title',
    descriptionKey: 'guidance.features.petitions.description',
    ctaKey: 'guidance.features.petitions.cta',
    to: '/create',
    titleDefault: 'Petitions',
    descriptionDefault:
      'Turn a public demand into a structured campaign that people can sign and share.',
    ctaDefault: 'Launch a Petition',
  },
  {
    id: 'volunteer',
    icon: Users,
    titleKey: 'guidance.features.volunteer.title',
    descriptionKey: 'guidance.features.volunteer.description',
    ctaKey: 'guidance.features.volunteer.cta',
    to: '/create',
    titleDefault: 'Volunteer Drives',
    descriptionDefault:
      'Organize people for real-world community action, events, and support work.',
    ctaDefault: 'Start a Volunteer Drive',
  },
  {
    id: 'polls',
    icon: BarChart3,
    titleKey: 'guidance.features.polls.title',
    descriptionKey: 'guidance.features.polls.description',
    ctaKey: 'guidance.features.polls.cta',
    to: '/polls',
    titleDefault: 'Community Polls',
    descriptionDefault:
      'Ask focused questions and let the community vote on priorities, ideas, and decisions.',
    ctaDefault: 'Create a Poll',
  },
  {
    id: 'relief',
    icon: HandHeart,
    titleKey: 'guidance.features.relief.title',
    descriptionKey: 'guidance.features.relief.description',
    ctaKey: 'guidance.features.relief.cta',
    to: '/relief',
    titleDefault: 'Donation & Relief',
    descriptionDefault:
      'Support verified relief needs through funds, supplies, volunteering, or sharing.',
    ctaDefault: 'View Relief Campaigns',
  },
  {
    id: 'map',
    icon: Map,
    titleKey: 'guidance.features.map.title',
    descriptionKey: 'guidance.features.map.description',
    ctaKey: 'guidance.features.map.cta',
    to: '/impact-map',
    titleDefault: 'Impact Map',
    descriptionDefault:
      'Discover civic issues, volunteer drives, and relief needs by location.',
    ctaDefault: 'Open Map',
  },
  {
    id: 'actionpath',
    icon: Wand2,
    titleKey: 'guidance.features.actionpath.title',
    descriptionKey: 'guidance.features.actionpath.description',
    ctaKey: 'guidance.features.actionpath.cta',
    to: '/create',
    titleDefault: 'ActionPath AI',
    descriptionDefault:
      'Turn a rough concern into a clear action plan with suggested movement type, title, summary, and next steps.',
    ctaDefault: 'Generate Action Path',
  },
  {
    id: 'inspire',
    icon: BookOpen,
    titleKey: 'guidance.features.inspire.title',
    descriptionKey: 'guidance.features.inspire.description',
    ctaKey: 'guidance.features.inspire.cta',
    to: '/inspire',
    titleDefault: 'Inspire Hub',
    descriptionDefault:
      'Share achievements, success stories, lessons, innovation ideas, entrepreneurship journeys, and book insights.',
    ctaDefault: 'Explore Inspire Hub',
  },
  {
    id: 'youthVoiceId',
    icon: Fingerprint,
    titleKey: 'guidance.features.youthVoiceId.title',
    descriptionKey: 'guidance.features.youthVoiceId.description',
    ctaKey: 'guidance.features.youthVoiceId.cta',
    to: '/how-it-works#youth-voice',
    titleDefault: 'Youth Voice ID',
    descriptionDefault:
      'Speak publicly while keeping your personal profile identity protected.',
    ctaDefault: 'Learn More',
  },
]

export const GUIDANCE_STEPS = [
  {
    titleKey: 'guidance.steps.discover.title',
    descriptionKey: 'guidance.steps.discover.description',
    titleDefault: 'Discover',
    descriptionDefault:
      'Explore public movements, petitions, polls, volunteer drives, and relief needs shared by the community.',
  },
  {
    titleKey: 'guidance.steps.join.title',
    descriptionKey: 'guidance.steps.join.description',
    titleDefault: 'Join',
    descriptionDefault:
      'Create an account to follow movements, sign petitions, vote in polls, volunteer, and support causes.',
  },
  {
    titleKey: 'guidance.steps.create.title',
    descriptionKey: 'guidance.steps.create.description',
    titleDefault: 'Create',
    descriptionDefault:
      'Start a Youth Movement by raising an issue, launching a petition, organizing volunteers, posting relief needs, or creating a poll.',
  },
  {
    titleKey: 'guidance.steps.track.title',
    descriptionKey: 'guidance.steps.track.description',
    titleDefault: 'Track Impact',
    descriptionDefault:
      'Use dashboards, the Impact Map, and Youth Impact Pulse to see how civic action grows over time.',
  },
] as const

