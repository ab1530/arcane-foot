import { render, screen } from '@testing-library/react'
import { GlassCard } from '../glass-card'

describe('GlassCard Component', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <p>Test content</p>
      </GlassCard>
    )
    expect(screen.getByText(/test content/i)).toBeInTheDocument()
  })

  it('applies default variant styles', () => {
    const { container } = render(<GlassCard>Default</GlassCard>)
    const card = container.firstChild
    expect(card).toHaveClass('bg-white/5')
    expect(card).toHaveClass('backdrop-blur-xl')
  })

  it('applies elevated variant styles', () => {
    const { container } = render(<GlassCard variant="elevated">Elevated</GlassCard>)
    const card = container.firstChild
    expect(card).toHaveClass('bg-white/10')
    expect(card).toHaveClass('shadow-2xl')
  })

  it('applies bordered variant styles', () => {
    const { container } = render(<GlassCard variant="bordered">Bordered</GlassCard>)
    const card = container.firstChild
    expect(card).toHaveClass('border-2')
    expect(card).toHaveClass('border-arcane-accent')
  })

  it('applies glow on hover when glowOnHover is true', () => {
    const { container } = render(<GlassCard glowOnHover>Glow</GlassCard>)
    const card = container.firstChild
    expect(card).toHaveClass('hover:shadow-arcane-accent/20')
  })

  it('accepts custom className', () => {
    const { container } = render(<GlassCard className="custom-class">Custom</GlassCard>)
    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })

  it('renders with padding by default', () => {
    const { container } = render(<GlassCard>Padded</GlassCard>)
    const card = container.firstChild
    expect(card).toHaveClass('p-6')
  })
})
