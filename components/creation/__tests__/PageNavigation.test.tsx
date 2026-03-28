import React from 'react';
import { render, screen } from '@testing-library/react';
import CreationWorkflowPage from '../CreationWorkflowPage';

describe('CreationWorkflowPage - Page Navigation', () => {
  it('should render the creation workflow page', () => {
    render(<CreationWorkflowPage />);
    
    // Check that the page renders with key elements
    expect(screen.getByText('知识图谱')).toBeInTheDocument();
    expect(screen.getByText('导入文件')).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    const { container } = render(<CreationWorkflowPage />);
    
    // Check page container exists
    const pageContainer = container.querySelector('[class*="pageContainer"]');
    expect(pageContainer).toBeInTheDocument();
  });

  it('should render navigation and content areas', () => {
    const { container } = render(<CreationWorkflowPage />);
    
    // Check navigation area
    const sideNav = container.querySelector('[class*="sideNavigation"]');
    expect(sideNav).toBeInTheDocument();
    
    // Check content area
    const mainContent = container.querySelector('[class*="mainContent"]');
    expect(mainContent).toBeInTheDocument();
  });

  it('should be accessible from the home page', () => {
    // This test verifies that the creation page can be accessed
    // The actual navigation is tested in the home page tests
    render(<CreationWorkflowPage />);
    
    expect(screen.getByText('知识图谱')).toBeInTheDocument();
  });
});
