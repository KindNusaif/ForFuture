interface SectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  const centered = align === 'center'

  return (
    <header
      className={`${centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl text-left'} ${className}`}
    >
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed text-secondary sm:text-lg ${centered ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </header>
  )
}
