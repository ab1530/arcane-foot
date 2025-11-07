import { render, screen } from '@testing-library/react'
import { GlassCard } from '@/components/ui/glass-card'

describe('GlassCard Component', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    const { container } = render(
      <GlassCard variant="elevated">Content</GlassCard>
    )
    const card = container.firstChild
    expect(card).toHaveClass('shadow-lg')
  })

  it('applies glowOnHover prop', () => {
    const { container } = render(
      <GlassCard glowOnHover>Content</GlassCard>
    )
    const card = container.firstChild
    expect(card).toHaveClass('hover:border-arcane-accent/30')
  })

  it('applies custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">Content</GlassCard>
    )
    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })
})
