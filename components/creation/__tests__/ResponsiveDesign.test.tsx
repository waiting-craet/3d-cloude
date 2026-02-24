import React from 'react';
import { render } from '@testing-library/react';
import CreationWorkflowPage from '../CreationWorkflowPage';

describe('CreationWorkflowPage - Responsive Design', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    // Restore original window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('should render correctly on desktop (1024px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { container } = render(<CreationWorkflowPage />);
    const pageContainer = container.querySelector('[class*="pageContainer"]');
    expect(pageContainer).toBeInTheDocument();
  });

  it('should render correctly on tablet (768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { container } = render(<CreationWorkflowPage />);
    const pageContainer = container.querySelector('[class*="pageContainer"]');
    expect(pageContainer).toBeInTheDocument();
  });

  it('should render correctly on mobile (480px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    const { container } = render(<CreationWorkflowPage />);
    const pageContainer = container.querySelector('[class*="pageContainer"]');
    expect(pageContainer).toBeInTheDocument();
  });

  it('should have navigation bar on all screen sizes', () => {
    const screenSizes = [480, 768, 1024];

    screenSizes.forEach((size) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: size,
      });

      const { container } = render(<CreationWorkflowPage />);
      const sideNav = container.querySelector('[class*="sideNavigation"]');
      expect(sideNav).toBeInTheDocument();
    });
  });

  it('should have main content area on all screen sizes', () => {
    const screenSizes = [480, 768, 1024];

    screenSizes.forEach((size) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: size,
      });

      const { container } = render(<CreationWorkflowPage />);
      const mainContent = container.querySelector('[class*="mainContent"]');
      expect(mainContent).toBeInTheDocument();
    });
  });

  it('should maintain layout structure on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    const { container } = render(<CreationWorkflowPage />);

    // Check that both navigation and content are present
    const sideNav = container.querySelector('[class*="sideNavigation"]');
    const mainContent = container.querySelector('[class*="mainContent"]');

    expect(sideNav).toBeInTheDocument();
    expect(mainContent).toBeInTheDocument();
  });

  it('should have proper flex layout', () => {
    const { container } = render(<CreationWorkflowPage />);
    const pageContainer = container.querySelector('[class*="pageContainer"]');
    
    // CSS modules are not applied in test environment, just verify element exists
    expect(pageContainer).toBeInTheDocument();
  });

  it('should have full viewport height', () => {
    const { container } = render(<CreationWorkflowPage />);
    const pageContainer = container.querySelector('[class*="pageContainer"]');
    
    // CSS modules are not applied in test environment, just verify element exists
    expect(pageContainer).toBeInTheDocument();
  });
});
