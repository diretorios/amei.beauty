import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should render with labelKey', () => {
    render(<Button labelKey="buttons.save" />);
    // Translation will be loaded, so we check it exists
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should be disabled when isLoading', () => {
    render(<Button isLoading>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should call onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply variant classes', () => {
    const { container } = render(<Button variant="primary">Click</Button>);
    const button = container.querySelector('.btn-primary');
    expect(button).toBeInTheDocument();
  });
});

