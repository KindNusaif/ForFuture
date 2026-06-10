/** Neutral landing shell while auth resolves — same background as marketing home. */
export default function LandingPageShell() {
  return (
    <div className="landing-lovable landing-lovable-shell" aria-busy="true" aria-label="Loading">
      <section className="landing-hero relative min-h-[52vh] bg-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-grid">
            <div className="landing-hero-copy">
              <div className="landing-hero-cta-placeholder mb-6" aria-hidden />
              <div className="h-10 w-3/4 max-w-lg animate-pulse rounded-xl bg-white/20" aria-hidden />
              <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded-lg bg-white/15" aria-hidden />
              <div className="mt-2 h-4 w-5/6 max-w-sm animate-pulse rounded-lg bg-white/10" aria-hidden />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
