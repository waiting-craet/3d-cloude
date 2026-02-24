import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectCard from '../ProjectCard';

const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'This is a test project description',
  createdAt: new Date('2024-01-15'),
  status: 'active' as const,
};

describe('ProjectCard', () => {
  it('should render project name', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should render project description', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('This is a test project description')).toBeInTheDocument();
  });

  it('should render formatted date', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('2024/01/15')).toBeInTheDocument();
  });

  it('should render project icon with first letter', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('should render badge label', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('暂无介绍')).toBeInTheDocument();
  });

  it('should render creator info', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('wechat-c5Ujwfne-3un2RNH')).toBeInTheDocument();
  });

  it('should truncate long descriptions', () => {
    const longDescriptionProject = {
      ...mockProject,
      description:
        'This is a very long description that should be truncated because it exceeds the maximum number of lines allowed in the project card component',
    };
    render(<ProjectCard project={longDescriptionProject} />);
    const description = screen.getByText(/This is a very long description/);
    expect(description).toBeInTheDocument();
  });

  it('should render card with proper structure', () => {
    const { container } = render(<ProjectCard project={mockProject} />);
    const card = container.querySelector('[class*="projectCard"]');
    expect(card).toBeInTheDocument();
  });
});
