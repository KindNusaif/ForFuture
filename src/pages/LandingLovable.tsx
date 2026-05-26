import { Link } from 'react-router-dom'
import {
  Megaphone,
  Users,
  TrendingUp,
  ArrowRight,
  MapPin,
  HandHeart,
  FileSignature,
  Vote,
  ShieldCheck,
  Zap,
  Quote,
  Heart,
  Coins,
  Eye,
  Flag,
  BarChart3,
  Wand2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

export default function LandingLovable() {
  return (
    <div className="landing-lovable">
      <Hero />
      <Marquee />
      <Problem />
      <Pillars />
      <HowItWorks />
      <Features />
      <TrustSafety />
      <Movements />
      <Impact />
      <ProtectedVoice />
      <ActionPathAI />
      <Voices />
      <CTA />
      <LovableFooter />
    </div>
  )
}

function Hero() {
  const { t } = useTranslation()
  const { isMember, loading, loggingOut, configured } = useAuth()
  const authReady = !configured || (!loading && !loggingOut)
  const signedIn = authReady && isMember
  const hasSplitHeadline = Boolean(t('landing.heroTitleThrough') || t('landing.heroTitleAccent'))

  return (
    <section className="landing-hero landing-section-reveal landing-section-reveal--hero relative overflow-hidden bg-hero">
      <div className="landing-hero-glow landing-hero-glow--mint landing-motion-deco landing-hero-glow-drift" aria-hidden />
      <div className="landing-hero-glow landing-hero-glow--indigo landing-motion-deco landing-hero-glow-drift landing-hero-glow-drift--delay" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grain opacity-50" aria-hidden />
      <div className="landing-hero-inner">
        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <div className="landing-hero-badge inline-flex items-center gap-2">
              <span className="landing-hero-badge-dot landing-motion-deco" aria-hidden />
              <span>{t('landing.eyebrow')}</span>
            </div>
            <h1 className="landing-hero-headline">
              <span className="block">{t('landing.heroTitleLine1')}</span>
              {hasSplitHeadline ? (
                <span className="mt-0.5 block">
                  {t('landing.heroTitleThrough')}{' '}
                  <em className="text-gradient not-italic">{t('landing.heroTitleAccent')}</em>
                </span>
              ) : null}
            </h1>
            <p className="landing-hero-subcopy">{t('landing.heroSubtitle')}</p>
            <p className="landing-hero-positioning">{t('landing.heroPositioning')}</p>
            <div className="landing-hero-ctas" aria-busy={!authReady}>
              {!authReady ? (
                <div className="landing-hero-cta-placeholder" aria-hidden />
              ) : (
                <>
                  <Link
                    to={signedIn ? '/feed' : '/signup'}
                    className="landing-hero-cta-primary"
                  >
                    {signedIn ? t('landing.heroMyFeed') : t('landing.joinCta')}
                    <ArrowRight className="landing-hero-cta-arrow h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                  <Link to="/explore" className="landing-hero-cta-secondary">
                    {t('nav.exploreMovements')}
                  </Link>
                </>
              )}
            </div>
            <div className="landing-hero-social">
              <p className="landing-hero-social-title">{t('landing.socialProof')}</p>
              <p className="landing-hero-social-subtext">{t('landing.socialProofSubtext')}</p>
            </div>
            <div className="landing-hero-avatars-row" aria-hidden>
              <div className="landing-hero-avatars shrink-0">
                {['from-indigo to-mint', 'from-mint to-cream', 'from-navy to-indigo', 'from-indigo to-navy', 'from-mint to-indigo'].map(
                  (g) => (
                    <span key={g} className={`landing-hero-avatar bg-gradient-to-br ${g}`} />
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="landing-hero-visual">
            <PreviewCard />
          </div>
        </div>
      </div>
    </section>
  )
}

function PreviewCard() {
  const { t } = useTranslation()

  const items = [
    {
      icon: Vote,
      tag: t('landing.heroPreviewTagPoll'),
      title: t('landing.previewPollExample'),
      color: 'from-indigo to-mint',
    },
    {
      icon: Megaphone,
      tag: t('landing.heroPreviewTagVoice'),
      title: t('landing.previewVoiceExample'),
      color: 'from-mint to-indigo',
    },
    {
      icon: HandHeart,
      tag: t('landing.heroPreviewTagVolunteer'),
      title: t('landing.previewVolunteerExample'),
      color: 'from-navy to-indigo',
    },
  ]

  return (
    <div className="landing-hero-preview-wrap relative" role="img" aria-label={t('landing.heroPreviewDecorative')}>
      <div className="landing-hero-preview-halo landing-motion-deco landing-hero-halo-pulse" aria-hidden />
      <div className="landing-hero-preview-card landing-motion-deco animate-float">
        <div className="landing-hero-preview-header">
          <div className="landing-hero-preview-label">{t('landing.heroVisualLabel')}</div>
          <span className="landing-hero-preview-pill">{t('landing.heroVisualLive')}</span>
        </div>
        <div className="mt-5 space-y-3">
          {items.map((it) => (
            <div key={it.tag} className="landing-hero-preview-row">
              <div className={`landing-hero-preview-icon bg-gradient-to-br ${it.color}`}>
                <it.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="landing-hero-preview-tag">{it.tag}</div>
                <div className="landing-hero-preview-title">{it.title}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="landing-hero-preview-stats">
          {[
            [t('landing.heroMetricMovements'), t('landing.heroMetricMovementsTrend')],
            [t('landing.heroMetricPetitions'), t('landing.heroMetricPetitionsTrend')],
            [t('landing.heroMetricRelief'), t('landing.heroMetricReliefTrend')],
          ].map(([k, v]) => (
            <div key={k} className="landing-hero-preview-stat">
              <div className="landing-hero-preview-stat-label">{k}</div>
              <div className="landing-hero-preview-stat-value">{v}</div>
            </div>
          ))}
        </div>
      </div>
      <Link to="/discover?focus=nearby" className="landing-hero-floating-chip landing-motion-deco landing-hero-chip-float">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('landing.heroFloatingBadge')}
      </Link>
    </div>
  )
}

function Marquee() {
  const { t } = useTranslation()
  const keys = [
    'landing.marqueePetitions',
    'landing.marqueeVolunteer',
    'landing.marqueePolls',
    'landing.marqueeRelief',
    'landing.marqueeCouncils',
    'landing.marqueePeaceful',
    'landing.marqueeImpact',
    'landing.marqueeVotes',
  ] as const
  const items = keys.map((key) => t(key))

  return (
    <section className="landing-marquee landing-section-reveal" aria-hidden>
      <div className="landing-marquee-fade landing-marquee-fade--left" aria-hidden />
      <div className="landing-marquee-fade landing-marquee-fade--right" aria-hidden />
      <div className="landing-marquee-viewport">
        <div className="landing-marquee-track landing-motion-deco">
          {[0, 1].map((copy) => (
            <div key={copy} className="landing-marquee-group" aria-hidden={copy === 1 ? true : undefined}>
              {items.map((label) => (
                <span key={`${copy}-${label}`} className="landing-marquee-item">
                  <span className="landing-marquee-label">{label}</span>
                  <span className="landing-marquee-dot" aria-hidden />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-28">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">The problem</div>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            Youth voices disappear into <em className="text-gradient not-italic">the scroll</em>.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Every day, young people across Sri Lanka share ideas, concerns, and community needs — and watch them vanish
            into endless feeds. Passion turns into passive posts. Concern turns into comment threads. Nothing moves.
          </p>
          <ul className="mt-7 space-y-3.5 text-muted-foreground">
            {[
              'Real issues get buried under noise and algorithms',
              "There's no structured path to turn ideas into action",
              'Public expression can risk personal identity exposure',
              'Impact stays invisible — so momentum dies early',
            ].map((text) => (
              <li key={text} className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-indigo" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:pl-4">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft md:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-mint/20 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">The ForFuture solution</div>
              <h3 className="mt-3 font-display text-3xl leading-tight md:text-4xl">
                A civic participation network — not another social feed.
              </h3>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                ForFuture turns scattered youth energy into visible action, community participation, and measurable
                impact.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm md:gap-x-2.5">
                {['Discover', 'Care', 'Follow', 'Act', 'See Impact'].map((s, i, arr) => (
                  <span key={s} className="inline-flex items-center gap-2">
                    <span className="rounded-full border border-border bg-secondary/80 px-3.5 py-1.5 font-medium text-foreground shadow-sm">
                      {s}
                    </span>
                    {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Pillars() {
  const items = [
    {
      icon: Megaphone,
      title: 'Raise your voice',
      desc: 'Post ideas, concerns, and civic issues through a Youth Voice ID or your profile — safely and visibly.',
      to: '/signup',
    },
    {
      icon: Zap,
      title: 'Take action',
      desc: 'Launch petitions, volunteer drives, peaceful civic actions, and relief campaigns that mobilize people.',
      to: '/explore',
    },
    {
      icon: TrendingUp,
      title: 'Create impact',
      desc: 'Track momentum on the impact map and Youth Impact Pulse — so community action stays visible.',
      to: '/impact',
    },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-28">
      <div className="max-w-2xl">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">What ForFuture does</div>
        <h2 className="mt-4 font-display text-4xl md:text-5xl">Three pillars for a civic generation.</h2>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {items.map((it) => (
          <Link key={it.title} to={it.to} className="group relative block overflow-hidden rounded-3xl border border-border bg-card p-8 transition hover:shadow-elegant">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-glow opacity-0 blur-2xl transition group-hover:opacity-20" aria-hidden />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-dark text-cream shadow-soft">
              <it.icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-6 font-display text-2xl">{it.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{it.desc}</p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
              Learn more <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Features() {
  const types = [
    { icon: Megaphone, tag: 'Raise Your Voice', title: 'Speak on what matters', desc: 'Publish issues, ideas, and concerns that your community needs to hear.', grad: 'from-indigo to-mint', to: '/explore?type=raise_voice' },
    { icon: FileSignature, tag: 'Petitions', title: 'Launch a petition', desc: 'Turn a demand into a structured campaign people can sign and share.', grad: 'from-navy to-indigo', to: '/explore?type=youth_petition' },
    { icon: HandHeart, tag: 'Volunteer Drives', title: 'Organize volunteers', desc: 'Recruit, coordinate, and confirm volunteers for real on-ground action.', grad: 'from-mint to-indigo', to: '/explore?type=volunteer_drive' },
    { icon: Heart, tag: 'Donation & Relief', title: 'Mobilize relief', desc: 'Post urgent needs—supplies, shelter, support—and connect with helpers.', grad: 'from-indigo to-navy', to: '/explore/relief' },
    { icon: Coins, tag: 'Fundraising', title: 'Fund civic campaigns', desc: 'Start transparent fundraising for community-focused civic causes.', grad: 'from-mint to-cream', to: '/explore?type=fundraising' },
    { icon: Vote, tag: 'Community Polls', title: 'Read the room', desc: 'Run community polls to gather public opinion before launching a movement.', grad: 'from-indigo to-mint', to: '/explore?type=quick_youth_poll' },
  ]
  return (
    <section id="features" className="scroll-mt-24 border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-28">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Movement types</div>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">Six ways to turn a voice into a movement.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A guided flow helps you describe the issue, why it matters, and the change you want —{' '}
            then publishes it as the right kind of movement.
          </p>
        </div>
        <div className="mt-14 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
          {types.map((item) => (
            <Link
              key={item.tag}
              to={item.to}
              className="group flex min-h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 transition hover:shadow-elegant"
            >
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${item.grad} text-cream shadow-soft`}>
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.tag}</div>
              <h3 className="mt-1.5 font-display text-xl">{item.title}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Speak', desc: 'Share an idea, concern, or civic need through a guided movement flow.' },
    { n: '02', title: 'Organize', desc: 'Choose the right movement type — petition, volunteer drive, relief, fundraiser, or poll.' },
    { n: '03', title: 'Mobilize', desc: 'Communities discover, support, sign, volunteer, and amplify your movement.' },
    { n: '04', title: 'Impact', desc: 'Track momentum live with dashboards, the impact map, and Youth Impact Pulse.' },
  ]
  const headlineParts = ['Speak', 'Organize', 'Mobilize', 'Impact'] as const
  return (
    <section id="how-it-works" className="relative scroll-mt-24 overflow-hidden bg-dark text-cream">
      <div className="absolute inset-0 grain opacity-30" aria-hidden />
      <div className="absolute top-1/2 -left-32 h-96 w-96 -translate-y-1/2 rounded-full bg-indigo/40 blur-3xl" aria-hidden />
      <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-mint/30 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-28 md:py-32">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/70">How it works</div>
          <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight text-cream md:text-5xl md:leading-tight">
            <span className="sr-only">Speak, Organize, Mobilize, Impact.</span>
            <span className="flex flex-wrap items-center gap-2 md:gap-3" aria-hidden>
              {headlineParts.map((word, i) => (
                <span key={word} className="inline-flex items-center gap-2 md:gap-3">
                  <span>{word}</span>
                  {i < headlineParts.length - 1 && <ArrowRight className="h-5 w-5 shrink-0 text-mint md:h-6 md:w-6" />}
                </span>
              ))}
              <span className="font-display">.</span>
            </span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/85">
            Built for young people across Sri Lanka who want to organize, participate, and measure civic change — safely
            and visibly.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex min-h-[12.5rem] flex-col rounded-3xl border border-cream/20 bg-cream/[0.08] p-7 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur-sm transition hover:border-cream/25 hover:bg-cream/[0.11]"
            >
              <div className="font-display text-4xl tabular-nums text-mint md:text-5xl">{s.n}</div>
              <h3 className="mt-5 font-display text-xl text-cream">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-cream/80">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProtectedVoice() {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-28 md:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <Lock className="h-3.5 w-3.5 text-mint" aria-hidden />
            <span className="text-muted-foreground">Youth Voice ID · Protected expression</span>
          </div>
          <h2 className="mt-5 font-display text-4xl leading-tight md:text-5xl">
            Speak publicly. <em className="text-gradient not-italic">Stay protected.</em>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('landing.voiceIdText')}</p>
          <ul className="mt-8 grid max-w-xl gap-3 sm:grid-cols-1 sm:gap-3.5 md:grid-cols-2">
            {[
              'Post and sign with a protected civic identity',
              'Personal profile stays private from the public',
              'Internal accountability helps prevent abuse',
              'Designed for safe, responsible expression',
            ].map((text) => (
              <li key={text} className="flex gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-mint" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5">
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-glow opacity-20 blur-3xl" aria-hidden />
            <div className="relative rounded-3xl border border-border bg-card p-7 shadow-elegant">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Your Youth Voice ID
                </div>
                <span className="rounded-full bg-mint/20 px-2.5 py-1 text-[10px] font-semibold text-foreground">Protected</span>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo to-mint text-cream">
                  <ShieldCheck className="h-7 w-7" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-lg font-semibold tracking-tight text-foreground md:text-xl">Voice #A4-92K</div>
                  <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Verified civic participant since 2024
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                {['Movements', 'Petitions', 'Actions'].map((label) => (
                  <div key={label} className="rounded-xl border border-border bg-secondary/40 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {label}
                    </div>
                    <div className="mt-1.5 text-xs font-medium text-foreground">Your impact</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden /> Personal profile hidden from public view
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Impact() {
  const impactPillars = [
    { title: 'Petitions', desc: 'Mobilize support for community priorities' },
    { title: 'Volunteer drives', desc: 'Coordinate people and on-ground action' },
    { title: 'Relief & needs', desc: 'Respond when communities need help' },
    { title: 'Youth Impact Pulse', desc: 'See momentum across Sri Lanka' },
  ]

  return (
    <section id="impact" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-28 md:py-32">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-10 shadow-soft md:p-14">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mint/25 blur-3xl" aria-hidden />
        <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Youth Impact Pulse</div>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">See how youth action adds up.</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              ForFuture helps communities track petitions, volunteer drives, relief needs, and civic momentum with
              transparent tools built for Sri Lankan youth participation.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/impact"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                See live dashboard <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4 text-mint" aria-hidden />
                Updated in real time
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {impactPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-border bg-background/95 p-5 shadow-sm sm:p-6 dark:bg-background/80"
              >
                <div className="font-display text-lg text-primary md:text-xl">{pillar.title}</div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Movements() {
  const cards = [
    {
      tag: 'POLL',
      title: 'What should our town prioritize next?',
      typeLabel: 'Quick poll',
      icon: Vote,
      to: '/explore?type=quick_youth_poll',
    },
    {
      tag: 'EDUCATION',
      title: 'Safer school roads for every student',
      typeLabel: 'Raise your voice',
      icon: Megaphone,
      to: '/explore?type=raise_voice',
    },
    {
      tag: 'RELIEF',
      title: 'Community flood relief and supply support',
      typeLabel: 'Volunteer drive',
      icon: HandHeart,
      to: '/explore/relief',
    },
  ]
  return (
    <section id="movements" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Active right now</div>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">Movements gaining momentum.</h2>
        </div>
        <Link to="/explore" className="inline-flex items-center gap-1.5 text-sm font-medium transition-all hover:gap-2.5">
          Browse all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            to={c.to}
            className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-elegant"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-glow">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-70 transition group-hover:opacity-90" aria-hidden />
              <div className="absolute inset-0 grain opacity-45" aria-hidden />
              <c.icon
                className="absolute bottom-6 right-6 h-20 w-20 text-cream/95 transition group-hover:scale-105"
                strokeWidth={1.2}
                aria-hidden
              />
              <span className="absolute left-5 top-5 rounded-full bg-background/95 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm backdrop-blur-sm">
                {c.tag}
              </span>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl leading-snug text-foreground">{c.title}</h3>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/80 pt-4">
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" aria-hidden />{' '}
                  <span className="truncate">{c.typeLabel}</span>
                </div>
                <span className="shrink-0 rounded-full border border-mint/40 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
                  Join
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ActionPathAI() {
  const { t } = useTranslation()
  return (
    <section id="innovation" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card to-secondary/40 p-10 md:p-14">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo/20 blur-3xl" aria-hidden />
        <div className="relative grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium">
              <Wand2 className="h-3.5 w-3.5 text-indigo" aria-hidden />
              <span className="text-muted-foreground">Introducing ActionPath AI</span>
            </div>
            <h2 className="mt-5 font-display text-4xl leading-tight md:text-5xl">
              A civic writing assistant that turns concerns into <em className="text-gradient not-italic">action-ready movements</em>.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('landing.actionPathText')}</p>
          </div>
          <div className="lg:col-span-5">
            <div className="space-y-3 rounded-3xl border border-border bg-background p-6 shadow-soft">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Draft assistant</div>
              <div className="rounded-2xl bg-secondary/60 p-4 text-sm">&quot;the bus stop near our school is unsafe at night&quot;</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wand2 className="h-3.5 w-3.5 text-indigo" aria-hidden /> ActionPath suggests
              </div>
              <div className="rounded-2xl border border-mint/40 bg-mint/10 p-4 text-sm">
                <span className="font-semibold">Petition · Safer transit for students.</span> Demand improved lighting, security and signage at the school-route bus stop to protect youth commuters after dark.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustSafety() {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Trusted campaigns',
      desc: 'Verified organizations and trust-badge indicators on credible movements.',
      to: '/community-guidelines',
    },
    {
      icon: Flag,
      title: 'Report content',
      desc: 'Community reporting tools help keep the platform safe and responsible.',
      to: '/community-guidelines',
    },
    {
      icon: Lock,
      title: 'Protected identity',
      desc: 'Youth Voice ID lets you speak publicly without exposing personal data.',
      to: '/privacy',
    },
    {
      icon: Heart,
      title: 'Civic-first tone',
      desc: 'Designed for thoughtful participation—not chaotic or performative content.',
      to: '/terms',
    },
  ]
  return (
    <section id="trust" className="scroll-mt-24 border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trust & civic safety</div>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">A platform built on responsibility.</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Civic action needs trust. ForFuture combines verification, reporting, and protected expression so
            movements grow with credibility.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <Link key={it.title} to={it.to} className="rounded-3xl border border-border bg-card p-7 transition hover:shadow-elegant">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-dark text-cream">
                <it.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 font-display text-lg">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function Voices() {
  const quotes = [
    {
      q: 'Our school-route petition helped parents, students, and local leaders focus on safer roads together.',
      n: 'Nethmi, 17',
      role: 'Student organizer · Western Province',
    },
    {
      q: 'We coordinated flood relief supplies through volunteer drives and kept the whole community updated.',
      n: 'Ravi, 21',
      role: 'Community volunteer · Sabaragamuwa',
    },
    {
      q: 'ForFuture gives young people a respectful place to raise issues and turn support into visible action.',
      n: 'Tharushi, 19',
      role: 'Youth advocate',
    },
  ]
  return (
    <section id="voices" className="scroll-mt-24 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Voices of the movement</div>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">Built by youth. Trusted by youth.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {quotes.map((q) => (
            <figure key={q.n} className="rounded-3xl border border-border bg-card p-8">
              <Quote className="h-6 w-6 text-mint" aria-hidden />
              <blockquote className="mt-5 font-display text-lg leading-snug">&quot;{q.q}&quot;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-glow" aria-hidden />
                <div>
                  <div className="text-sm font-semibold">{q.n}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  const { t } = useTranslation()
  const { isMember, loading, loggingOut, configured } = useAuth()
  const authReady = !configured || (!loading && !loggingOut)
  const signedIn = authReady && isMember

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-28">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-dark p-12 text-center text-cream md:p-20">
        <div className="absolute inset-0 grain opacity-40" aria-hidden />
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo/50 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-mint/30 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.2em] text-mint">Your generation. Your future.</div>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-5xl leading-[0.95] md:text-7xl">
            Building Sri Lanka&apos;s future through <em className="text-gradient not-italic">youth action</em>.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cream/70">
            Join young people across Sri Lanka turning local concerns into petitions, volunteer drives, and
            measurable community impact.
          </p>
          <div
            className="mt-10 flex min-h-14 flex-wrap items-center justify-center gap-3"
            aria-busy={!authReady}
          >
            {!authReady ? (
              <div className="landing-hero-cta-placeholder landing-hero-cta-placeholder--on-dark" aria-hidden />
            ) : (
              <>
                <Link
                  to={signedIn ? '/feed' : '/signup'}
                  className="inline-flex h-14 items-center gap-2 rounded-full bg-mint px-8 font-semibold text-ink shadow-elegant transition hover:opacity-90"
                >
                  {signedIn ? t('landing.heroMyFeed') : t('landing.joinCta')}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
                <Link
                  to="/explore"
                  className="inline-flex h-14 items-center gap-2 rounded-full border border-cream/20 px-8 text-cream transition hover:bg-cream/10"
                >
                  {t('nav.exploreMovements')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function LovableFooter() {
  const platformLinks = [
    { label: 'Movements', to: '/explore' },
    { label: 'Petitions', to: '/explore?type=youth_petition' },
    { label: 'Volunteer Drives', to: '/explore?type=volunteer_drive' },
    { label: 'Impact Map', to: '/impact-map' },
  ]
  const communityLinks = [
    { label: 'About', to: '/#voices' },
    { label: 'Youth Council', to: '/contact' },
    { label: 'Partners', to: '/contact' },
    { label: 'Contact', to: '/contact' },
  ]

  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4 md:gap-14">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-dark text-cream">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-display text-xl">ForFuture</span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            ForFuture is a civic platform for Sri Lankan youth to raise community issues and create measurable impact.
          </p>
        </div>
        {[
          { heading: 'Platform', links: platformLinks },
          { heading: 'Community', links: communityLinks },
        ].map((col) => (
          <div key={col.heading}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{col.heading}</div>
            <ul className="mt-5 space-y-3 text-sm leading-snug">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-foreground/90 transition hover:text-gradient">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center text-xs leading-relaxed text-muted-foreground">
          © {new Date().getFullYear()} ForFuture · Built with young people, for young people.
        </p>
      </div>
    </footer>
  )
}

