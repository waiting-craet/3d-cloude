import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImportButton from '../ImportButton';

describe('ImportButton', () => {
  const mockOnImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the import button', () => {
    render(<ImportButton onImport={mockOnImport} />);
    expect(screen.getByText('导入文件')).toBeInTheDocument();
  });

  it('should have correct button styling', () => {
    const { container } = render(<ImportButton onImport={mockOnImport} />);
    const button = container.querySelector('[class*="importButton"]');
    expect(button).toBeInTheDocument();
  });

  it('should be clickable', () => {
    render(<ImportButton onImport={mockOnImport} />);
    const button = screen.getByText('导入文件');
    expect(button).toBeEnabled();
  });

  it('should have button role', () => {
    render(<ImportButton onImport={mockOnImport} />);
    const button = screen.getByRole('button', { name: /导入文件/i });
    expect(button).toBeInTheDocument();
  });
});
