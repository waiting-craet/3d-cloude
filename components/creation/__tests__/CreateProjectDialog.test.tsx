import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateProjectDialog from '../CreateProjectDialog';

describe('CreateProjectDialog', () => {
  it('should not render when isOpen is false', () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={false}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );
    expect(screen.queryByText('新建知识图谱')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );
    expect(screen.getByText('新建知识图谱')).toBeInTheDocument();
  });

  it('should render form input for graph name', () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );
    expect(screen.getByPlaceholderText('输入知识图谱名称')).toBeInTheDocument();
  });

  it('should render checkboxes for graph type selection', () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );
    expect(screen.getByText('二维图谱')).toBeInTheDocument();
    expect(screen.getByText('三维图谱')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onCreateProject with graph name and type when form is submitted', async () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const graphNameInput = screen.getByPlaceholderText('输入知识图谱名称');
    const createButton = screen.getByText('创建');

    fireEvent.change(graphNameInput, { target: { value: 'New Graph' } });
    fireEvent.click(createButton);

    expect(mockOnCreateProject).toHaveBeenCalledWith('New Graph', '2d');
  });

  it('should call onCreateProject with 3d type when 3d checkbox is selected', async () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const graphNameInput = screen.getByPlaceholderText('输入知识图谱名称');
    const checkbox3d = screen.getByRole('checkbox', { name: /三维图谱/i });
    const createButton = screen.getByText('创建');

    fireEvent.change(graphNameInput, { target: { value: 'New Graph' } });
    fireEvent.click(checkbox3d);
    fireEvent.click(createButton);

    expect(mockOnCreateProject).toHaveBeenCalledWith('New Graph', '3d');
  });

  it('should disable create button when graph name is empty', () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );
    const createButton = screen.getByText('创建') as HTMLButtonElement;
    expect(createButton.disabled).toBe(true);
  });

  it('should enable create button when graph name is filled', async () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const graphNameInput = screen.getByPlaceholderText('输入知识图谱名称');
    const createButton = screen.getByText('创建') as HTMLButtonElement;

    fireEvent.change(graphNameInput, { target: { value: 'New Graph' } });

    await waitFor(() => {
      expect(createButton.disabled).toBe(false);
    });
  });

  it('should close dialog when escape key is pressed', async () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should close dialog when backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    const { container } = render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const backdrop = container.querySelector('[class*="Backdrop"]');
    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close dialog when dialog container is clicked', () => {
    const mockOnClose = jest.fn();
    const mockOnCreateProject = jest.fn();
    const { container } = render(
      <CreateProjectDialog
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const dialogContainer = container.querySelector('[class*="Container"]');
    fireEvent.click(dialogContainer!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
