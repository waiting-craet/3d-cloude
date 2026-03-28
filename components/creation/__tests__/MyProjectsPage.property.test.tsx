import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectGrid from '../ProjectGrid';
import CreateProjectDialog from '../CreateProjectDialog';

/**
 * Property 1: New Project Card Position
 * For any project grid, the new project card should always be displayed in the first position.
 */
describe('Property 1: New Project Card Position', () => {
  it('should always render new project card as first item regardless of project count', () => {
    const projects = [
      {
        id: '1',
        name: 'Project 1',
        description: 'Desc 1',
        createdAt: new Date(),
        status: 'active' as const,
      },
      {
        id: '2',
        name: 'Project 2',
        description: 'Desc 2',
        createdAt: new Date(),
        status: 'active' as const,
      },
      {
        id: '3',
        name: 'Project 3',
        description: 'Desc 3',
        createdAt: new Date(),
        status: 'active' as const,
      },
    ];

    const { container } = render(
      <ProjectGrid projects={projects} onNewProjectClick={jest.fn()} />
    );

    const cards = container.querySelectorAll('[class*="Card"]');
    expect(cards[0]).toHaveTextContent('新建');
  });

  it('should render new project card first even with empty project list', () => {
    const { container } = render(
      <ProjectGrid projects={[]} onNewProjectClick={jest.fn()} />
    );

    const cards = container.querySelectorAll('[class*="Card"]');
    expect(cards[0]).toHaveTextContent('新建');
  });
});

/**
 * Property 2: Dialog Form Validation
 * For any dialog state, form inputs should be properly validated and create button should be disabled when empty.
 */
describe('Property 2: Dialog Form Validation', () => {
  it('should disable create button when graph name is empty', () => {
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={jest.fn()}
        onCreateProject={jest.fn()}
      />
    );

    const createButton = screen.getByText('创建') as HTMLButtonElement;
    expect(createButton.disabled).toBe(true);
  });

  it('should enable create button when graph name is filled', async () => {
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={jest.fn()}
        onCreateProject={jest.fn()}
      />
    );

    const graphNameInput = screen.getByPlaceholderText('输入知识图谱名称');
    const createButton = screen.getByText('创建') as HTMLButtonElement;

    fireEvent.change(graphNameInput, { target: { value: 'Graph' } });

    await waitFor(() => {
      expect(createButton.disabled).toBe(false);
    });
  });

  it('should have 2d graph type selected by default', () => {
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={jest.fn()}
        onCreateProject={jest.fn()}
      />
    );

    const checkbox2d = screen.getByRole('checkbox', { name: /二维图谱/i }) as HTMLInputElement;
    expect(checkbox2d.checked).toBe(true);
  });
});

/**
 * Property 3: Dialog Close Functionality
 * For any open dialog, clicking cancel or pressing Escape should close the dialog.
 */
describe('Property 3: Dialog Close Functionality', () => {
  it('should close dialog when cancel button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={jest.fn()}
      />
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close dialog when escape key is pressed', async () => {
    const mockOnClose = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={jest.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should close dialog when backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={jest.fn()}
      />
    );

    const backdrop = container.querySelector('[class*="Backdrop"]');
    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

/**
 * Property 4: Project Card Information Completeness
 * For any project card, it should display project name, description, creation date, and thumbnail.
 */
describe('Property 4: Project Card Information Completeness', () => {
  it('should display all required project information', () => {
    const mockProject = {
      id: '1',
      name: 'Test Project',
      description: 'Test Description',
      createdAt: new Date('2024-01-15'),
      status: 'active' as const,
    };

    render(
      <ProjectGrid
        projects={[mockProject]}
        onNewProjectClick={jest.fn()}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('2024/01/15')).toBeInTheDocument();
  });

  it('should display all required information for multiple projects', () => {
    const projects = [
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

    render(
      <ProjectGrid projects={projects} onNewProjectClick={jest.fn()} />
    );

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('2024/01/15')).toBeInTheDocument();

    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
    expect(screen.getByText('2024/02/10')).toBeInTheDocument();
  });
});
