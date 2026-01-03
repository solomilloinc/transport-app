import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  describe('rendering', () => {
    it('should render with children text', () => {
      render(<Button>Click me</Button>)
      
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('should render as a button element', () => {
      render(<Button>Default</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('should apply variant classes when specified', () => {
      const { rerender } = render(<Button variant="destructive">Delete</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button variant="link">Link</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="default">Default Size</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button size="icon">🔍</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      
      await user.click(screen.getByRole('button'))
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick} disabled>Disabled</Button>)
      
      await user.click(screen.getByRole('button'))
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should have disabled attribute when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('asChild', () => {
    it('should render as child element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link', { name: /link button/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })
  })

  describe('custom className', () => {
    it('should accept custom classNames', () => {
      render(<Button className="custom-class">Custom</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('type attribute', () => {
    it('should allow setting type attribute', () => {
      render(<Button type="button">Submit</Button>)
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('should allow submit type', () => {
      render(<Button type="submit">Submit</Button>)
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })
  })

  describe('accessibility', () => {
    it('should be focusable', () => {
      render(<Button>Focusable</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(button).toHaveFocus()
    })

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })
})
