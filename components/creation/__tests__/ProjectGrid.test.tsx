import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectGrid from '../ProjectGrid';

const mockProjects = [
  {
    id: '1',
    name: 'Project 1',
    description: 'Description 1',
    createdAt: new Date('2024-01-15'),
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Project 2',
    description: 'Description 2',
    createdAt: new Date('2024-02-10'),
    status: 'active' as const,
  },
];

describe('ProjectGrid', () => {
  it('should render new project card', () => {
    const mockOnClick = jest.fn();
    render(
      <ProjectGrid projects={mockProjects} onNewProjectClick={mockOnClick} />
    );
    expect(screen.getByText('新建')).toBeInTheDocument();
  });

  it('should render all projects', () => {
    const mockOnClick = jest.fn();
    render(
      <ProjectGrid projects={mockProjects} onNewProjectClick={mockOnClick} />
    );
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('should call onNewProjectClick when new project card is clicked', () => {
    const mockOnClick = jest.fn();
    render(
      <ProjectGrid projects={mockProjects} onNewProjectClick={mockOnClick} />
    );
    const newProjectCard = screen.getByText('新建').closest('div');
    fireEvent.click(newProjectCard!);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('should render empty grid with only new project card when no projects', () => {
    const mockOnClick = jest.fn();
    render(<ProjectGrid projects={[]} onNewProjectClick={mockOnClick} />);
    expect(screen.getByText('新建')).toBeInTheDocument();
  });

  it('should render new project card as first item', () => {
    const mockOnClick = jest.fn();
    const { container } = render(
      <ProjectGrid projects={mockProjects} onNewProjectClick={mockOnClick} />
    );
    const cards = container.querySelectorAll('[class*="Card"]');
    expect(cards[0]).toHaveTextContent('新建');
  });
});
