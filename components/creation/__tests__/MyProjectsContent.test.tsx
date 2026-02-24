import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyProjectsContent from '../content/MyProjectsContent';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('MyProjectsContent', () => {
  it('should render the header with title and description', async () => {
    render(<MyProjectsContent />);
    expect(screen.getByText('我的项目')).toBeInTheDocument();
    expect(screen.getByText('管理和创建您的知识图谱项目')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
  });

  it('should render the project grid with new project card', async () => {
    render(<MyProjectsContent />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('新建')).toBeInTheDocument();
  });

  it('should fetch and display projects from API', async () => {
    render(<MyProjectsContent />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
    
    // The mock returns an empty array, so no projects should be displayed
    // except for the new project card
    expect(screen.getByText('新建')).toBeInTheDocument();
  });

  it('should open dialog when new project card is clicked', async () => {
    render(<MyProjectsContent />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
    
    const newProjectCard = screen.getByText('新建').closest('div');
    fireEvent.click(newProjectCard!);
    await waitFor(() => {
      expect(screen.getByText('新建知识图谱')).toBeInTheDocument();
    });
  });

  it('should close dialog when cancel button is clicked', async () => {
    render(<MyProjectsContent />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
    
    const newProjectCard = screen.getByText('新建').closest('div');
    fireEvent.click(newProjectCard!);
    await waitFor(() => {
      expect(screen.getByText('新建知识图谱')).toBeInTheDocument();
    });
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(screen.queryByText('新建知识图谱')).not.toBeInTheDocument();
    });
  });

  it('should create a new project when form is submitted', async () => {
    // Mock the fetch API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: '1',
            name: '新图谱',
            description: '暂无介绍',
            createdAt: new Date().toISOString(),
            graphs: [
              {
                id: 'graph-1',
                name: '新图谱',
              },
            ],
          }),
      })
    ) as jest.Mock;

    render(<MyProjectsContent />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
    
    const newProjectCard = screen.getByText('新建').closest('div');
    fireEvent.click(newProjectCard!);
    await waitFor(() => {
      expect(screen.getByText('新建知识图谱')).toBeInTheDocument();
    });

    const graphNameInput = screen.getByPlaceholderText('输入知识图谱名称');
    const createButton = screen.getByText('创建');

    fireEvent.change(graphNameInput, { target: { value: '新图谱' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('新图谱')).toBeInTheDocument();
    });
  });

  it('should open dialog when external isDialogOpen prop is true', async () => {
    render(<MyProjectsContent isDialogOpen={true} onDialogClose={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('新建知识图谱')).toBeInTheDocument();
    });
  });

  it('should call external onDialogClose when dialog is closed', async () => {
    const mockOnClose = jest.fn();
    render(
      <MyProjectsContent isDialogOpen={true} onDialogClose={mockOnClose} />
    );
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
