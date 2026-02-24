import React from 'react';
import { render, screen } from '@testing-library/react';
import MainContent from '../MainContent';

/**
 * Property 3: 内容区与导航同步
 * 对于任何导航项选择，主内容区应该显示对应的内容类型。
 * 验证: Requirements 4, 6
 */
describe('MainContent - Property 3: Content Area Navigation Sync', () => {
  it('should display my-projects content when selected', () => {
    render(<MainContent selectedNavItem="my-projects" />);
    expect(screen.getByText('我的项目')).toBeInTheDocument();
  });

  it('should display new-project content when selected', () => {
    render(<MainContent selectedNavItem="new-project" />);
    expect(screen.getByText('新建项目')).toBeInTheDocument();
  });

  it('should display ai-create content when selected', () => {
    render(<MainContent selectedNavItem="ai-create" />);
    expect(screen.getByText('AI创建')).toBeInTheDocument();
  });

  it('should display import-file content when selected', () => {
    render(<MainContent selectedNavItem="import-file" />);
    expect(screen.getByRole('heading', { name: '导入文件' })).toBeInTheDocument();
  });

  it('should display ai-prompt content when selected', () => {
    render(<MainContent selectedNavItem="ai-prompt" />);
    expect(screen.getByText('AI提示词')).toBeInTheDocument();
  });

  it('should display long-text content when selected', () => {
    render(<MainContent selectedNavItem="long-text" />);
    expect(screen.getByText('长文本分析')).toBeInTheDocument();
  });

  it('should display document-analysis content when selected', () => {
    render(<MainContent selectedNavItem="document-analysis" />);
    expect(screen.getByText('文档分析')).toBeInTheDocument();
  });

  it('should display structured-analysis content when selected', () => {
    render(<MainContent selectedNavItem="structured-analysis" />);
    expect(screen.getByText('结构化语言分析')).toBeInTheDocument();
  });

  it('should switch content when selectedNavItem changes', () => {
    const { rerender } = render(<MainContent selectedNavItem="my-projects" />);
    expect(screen.getByText('我的项目')).toBeInTheDocument();

    rerender(<MainContent selectedNavItem="new-project" />);
    expect(screen.queryByText('我的项目')).not.toBeInTheDocument();
    expect(screen.getByText('新建项目')).toBeInTheDocument();
  });

  it('should default to my-projects when invalid nav item is provided', () => {
    render(<MainContent selectedNavItem="invalid-item" as any />);
    expect(screen.getByText('我的项目')).toBeInTheDocument();
  });

  it('should render content section with animation class', () => {
    const { container } = render(<MainContent selectedNavItem="my-projects" />);
    const contentSection = container.querySelector('[class*="contentSection"]');
    expect(contentSection).toBeInTheDocument();
  });

  it('should maintain content area styling', () => {
    const { container } = render(<MainContent selectedNavItem="my-projects" />);
    const mainContent = container.querySelector('[class*="mainContent"]');
    expect(mainContent).toBeInTheDocument();
  });
});
