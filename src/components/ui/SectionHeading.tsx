interface SectionHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  as: Tag = 'h2',
  className = '',
}: SectionHeadingProps) {
  return (
    <header className={className}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className={`${eyebrow ? 'mt-2' : ''} section-title text-2xl sm:text-3xl`}>{title}</Tag>
      {subtitle && <p className="section-subtitle mt-2 max-w-2xl">{subtitle}</p>}
    </header>
  )
}
