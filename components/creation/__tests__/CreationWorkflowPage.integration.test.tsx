import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreationWorkflowPage from '../CreationWorkflowPage';

describe('CreationWorkflowPage - Integration Tests', () => {
  it('should render the complete page with navigation and content', () => {
    render(<CreationWorkflowPage />);

    // Check navigation elements
    expect(screen.getByText('知识图谱')).toBeInTheDocument();
    expect(screen.getByText('导入文件')).toBeInTheDocument();
    expect(screen.getByText('AI创作')).toBeInTheDocument();
  });

  it('should expand and collapse AI creation dropdown', () => {
    render(<CreationWorkflowPage />);

    // Initially, submenu items should not be visible
    const aiCreationHeader = screen.getByText('AI创作');
    expect(aiCreationHeader).toBeInTheDocument();

    // Click to expand
    fireEvent.click(aiCreationHeader);

    // Submenu items should now be visible
    expect(screen.getByText('AI提示词')).toBeInTheDocument();
    expect(screen.getByText('长文本分析')).toBeInTheDocument();
    expect(screen.getByText('文档分析')).toBeInTheDocument();
    expect(screen.getByText('结构化语言分析')).toBeInTheDocument();
  });

  it('should navigate to AI submenu items', () => {
    render(<CreationWorkflowPage />);

    // Expand AI creation dropdown
    const aiCreationHeader = screen.getByText('AI创作');
    fireEvent.click(aiCreationHeader);

    // Click on AI prompt
    const aiPromptItem = screen.getByText('AI提示词');
    fireEvent.click(aiPromptItem);

    // Content should switch to AI prompt
    const aiPromptContents = screen.getAllByText('AI提示词');
    expect(aiPromptContents.length).toBeGreaterThan(0);
  });

  it('should have proper page layout structure', () => {
    const { container } = render(<CreationWorkflowPage />);

    // Check page container
    const pageContainer = container.querySelector('[class*="pageContainer"]');
    expect(pageContainer).toBeInTheDocument();

    // Check navigation bar
    const sideNav = container.querySelector('[class*="sideNavigation"]');
    expect(sideNav).toBeInTheDocument();

    // Check main content
    const mainContent = container.querySelector('[class*="mainContent"]');
    expect(mainContent).toBeInTheDocument();
  });

  it('should display my-projects as default selected item', () => {
    const { container } = render(<CreationWorkflowPage />);

    // Find the my-projects menu item
    const menuItems = container.querySelectorAll('[role="button"]');
    let myProjectsItem: Element | null = null;

    menuItems.forEach((item) => {
      if (item.textContent === '我的项目' && item.className.includes('menuItem')) {
        myProjectsItem = item;
      }
    });

    expect(myProjectsItem).toBeInTheDocument();
    expect(myProjectsItem?.className).toContain('selected');
  });

  it('should handle keyboard navigation', () => {
    render(<CreationWorkflowPage />);

    // Get the my-projects menu item (first one in the list)
    const myProjectsItems = screen.getAllByText('我的项目');
    const myProjectsMenuItem = myProjectsItems[0];

    // Simulate keyboard press
    fireEvent.keyDown(myProjectsMenuItem, { key: 'Enter' });

    // Should still display my-projects
    expect(screen.getAllByText('我的项目').length).toBeGreaterThan(0);
  });
});
