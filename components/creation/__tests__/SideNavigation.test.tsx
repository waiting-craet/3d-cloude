import React from 'react';
import { render, screen } from '@testing-library/react';
import SideNavigation from '../SideNavigation';

describe('SideNavigation', () => {
  const mockOnNavItemSelect = jest.fn();
  const mockOnMenuToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the navigation bar', () => {
    render(
      <SideNavigation
        selectedNavItem="my-projects"
        expandedMenus={new Set()}
        onNavItemSelect={mockOnNavItemSelect}
        onMenuToggle={mockOnMenuToggle}
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should render the title section', () => {
    render(
      <SideNavigation
        selectedNavItem="my-projects"
        expandedMenus={new Set()}
        onNavItemSelect={mockOnNavItemSelect}
        onMenuToggle={mockOnMenuToggle}
      />
    );

    expect(screen.getByText('知识图谱')).toBeInTheDocument();
  });

  it('should render the my-projects menu item as selected', () => {
    render(
      <SideNavigation
        selectedNavItem="my-projects"
        expandedMenus={new Set()}
        onNavItemSelect={mockOnNavItemSelect}
        onMenuToggle={mockOnMenuToggle}
      />
    );

    const myProjectsItem = screen.getByText('我的项目');
    expect(myProjectsItem).toBeInTheDocument();
  });

  it('should render the import button', () => {
    render(
      <SideNavigation
        selectedNavItem="my-projects"
        expandedMenus={new Set()}
        onNavItemSelect={mockOnNavItemSelect}
        onMenuToggle={mockOnMenuToggle}
      />
    );

    expect(screen.getByText('导入文件')).toBeInTheDocument();
  });

  it('should render the AI creation dropdown', () => {
    render(
      <SideNavigation
        selectedNavItem="my-projects"
        expandedMenus={new Set()}
        onNavItemSelect={mockOnNavItemSelect}
        onMenuToggle={mockOnMenuToggle}
      />
    );

    expect(screen.getByText('AI创作')).toBeInTheDocument();
  });
});
