import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonGroup from '../ButtonGroup';

describe('ButtonGroup', () => {
  const mockOnNavItemSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render both buttons', () => {
    render(<ButtonGroup onNavItemSelect={mockOnNavItemSelect} />);
    expect(screen.getByText('新建图谱')).toBeInTheDocument();
    expect(screen.getByText('AI创建')).toBeInTheDocument();
  });

  it('should call onNavItemSelect with new-project when new project button is clicked', () => {
    render(<ButtonGroup onNavItemSelect={mockOnNavItemSelect} />);
    const newProjectButton = screen.getByText('新建图谱');
    fireEvent.click(newProjectButton);
    expect(mockOnNavItemSelect).toHaveBeenCalledWith('new-project');
  });

  it('should call onNavItemSelect with ai-create when AI create button is clicked', () => {
    render(<ButtonGroup onNavItemSelect={mockOnNavItemSelect} />);
    const aiCreateButton = screen.getByText('AI创建');
    fireEvent.click(aiCreateButton);
    expect(mockOnNavItemSelect).toHaveBeenCalledWith('ai-create');
  });

  it('should have correct button styling', () => {
    const { container } = render(<ButtonGroup onNavItemSelect={mockOnNavItemSelect} />);
    const buttons = container.querySelectorAll('[class*="navButton"]');
    expect(buttons.length).toBe(2);
  });
});
