import { useTranslation } from 'react-i18next'
import { PROTOTYPE_DEMO_ITEMS } from '../../lib/guidanceDemo'
import PrototypeDemoCard from './PrototypeDemoCard'

export default function PrototypeDemoShowcase() {
  const { t } = useTranslation()

  return (
    <section className="prototype-demo-section" aria-labelledby="prototype-demo-heading">
      <header className="prototype-demo-header">
        <h2 id="prototype-demo-heading" className="text-xl font-bold text-primary">
          {t('guidance.page.demoHeading', { defaultValue: 'Prototype Demo Ideas' })}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">
          {t('guidance.page.demoNote', {
            defaultValue:
              'These examples help visitors understand how ForFuture works. They are demo examples, not live user data.',
          })}
        </p>
      </header>
      <div className="prototype-demo-grid" role="list">
        {PROTOTYPE_DEMO_ITEMS.map((item) => (
          <div key={item.id} role="listitem" className="min-w-0">
            <PrototypeDemoCard item={item} />
          </div>
        ))}
      </div>
    </section>
  )
}
