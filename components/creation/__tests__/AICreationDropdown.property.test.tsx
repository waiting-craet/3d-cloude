import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AICreationDropdown from '../AICreationDropdown';

/**
 * Property 2: 菜单展开状态一致性
 * 对于任何AI创作菜单，展开状态应该与其子菜单的可见性一致。
 * 验证: Requirements 6
 */
describe('AICreationDropdown - Property 2: Menu Expansion State Consistency', () => {
  const mockOnToggle = jest.fn();
  const mockOnNavItemSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show submenu items when expanded', () => {
    render(
      <AICreationDropdown
        isExpanded={true}
        onToggle={mockOnToggle}
        selectedNavItem="my-projects"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    // All submenu items should be visible
    expect(screen.getByText('AI提示词')).toBeInTheDocument();
    expect(screen.getByText('长文本分析')).toBeInTheDocument();
    expect(screen.getByText('文档分析')).toBeInTheDocument();
    expect(screen.getByText('结构化语言分析')).toBeInTheDocument();
  });

  it('should hide submenu items when collapsed', () => {
    const { container } = render(
      <AICreationDropdown
        isExpanded={false}
        onToggle={mockOnToggle}
        selectedNavItem="my-projects"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    // Submenu list should not have expanded class
    const submenuList = container.querySelector('[class*="submenuList"]');
    expect(submenuList?.className).not.toContain('expanded');
  });

  it('should toggle expansion state when header is clicked', () => {
    render(
      <AICreationDropdown
        isExpanded={false}
        onToggle={mockOnToggle}
        selectedNavItem="my-projects"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    const header = screen.getByText('AI创作');
    fireEvent.click(header);

    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('should maintain expansion state consistency across renders', () => {
    const { rerender, container } = render(
      <AICreationDropdown
        isExpanded={false}
        onToggle={mockOnToggle}
        selectedNavItem="my-projects"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    let submenuList = container.querySelector('[class*="submenuList"]');
    expect(submenuList?.className).not.toContain('expanded');

    // Rerender with expanded state
    rerender(
      <AICreationDropdown
        isExpanded={true}
        onToggle={mockOnToggle}
        selectedNavItem="my-projects"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    submenuList = container.querySelector('[class*="submenuList"]');
    expect(submenuList?.className).toContain('expanded');
  });

  it('should rotate dropdown icon when expanded', () => {
    const { container, rerender } = render(
      <AICreationDropdown
        isExpanded={false}
        onToggle={mockOnToggle}
        selectedNavItem="my-projects"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    let icon = container.querySelector('[class*="dropdownIcon"]');
    expect(icon?.className).not.toContain('expanded');

    rerender(
      <AICreationDropdown
        isExpanded={true}
        onToggle={mockOnToggle}
        selectedNavItem="my-projects"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    icon = container.querySelector('[class*="dropdownIcon"]');
    expect(icon?.className).toContain('expanded');
  });

  it('should call onNavItemSelect when submenu item is clicked', () => {
    render(
      <AICreationDropdown
        isExpanded={true}
        onToggle={mockOnToggle}
        selectedNavItem="my-projects"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    const aiPromptItem = screen.getByText('AI提示词');
    fireEvent.click(aiPromptItem);

    expect(mockOnNavItemSelect).toHaveBeenCalledWith('ai-prompt');
  });

  it('should highlight selected submenu item', () => {
    const { container } = render(
      <AICreationDropdown
        isExpanded={true}
        onToggle={mockOnToggle}
        selectedNavItem="ai-prompt"
        onNavItemSelect={mockOnNavItemSelect}
      />
    );

    const submenuItems = container.querySelectorAll('[class*="submenuItem"]');
    const selectedItem = Array.from(submenuItems).find((item) =>
      item.className.includes('selected')
    );

    expect(selectedItem?.textContent).toBe('AI提示词');
  });
});
