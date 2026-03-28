import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportFileDialog from '../ImportFileDialog';

describe('ImportFileDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnFilesSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ImportFileDialog
        isOpen={false}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when isOpen is true', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    expect(screen.getByText('本地导入')).toBeInTheDocument();
  });

  it('should display drag-and-drop area', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    expect(screen.getByText('拖文件至此或点击此区域')).toBeInTheDocument();
  });

  it('should display supported formats', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    expect(screen.getByText('Excel(.xlsx)')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('NRD Studio files(.nrd)')).toBeInTheDocument();
  });

  it('should display action buttons', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    expect(screen.getByRole('button', { name: 'AI创作' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下载模板' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '高级导入' })).toBeInTheDocument();
  });

  it('should close dialog when close button is clicked', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close dialog when backdrop is clicked', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    const backdrop = screen.getByText('本地导入').closest('[class*="dialogBackdrop"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should close dialog when Escape key is pressed', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    fireEvent.keyDown(screen.getByText('本地导入').closest('[class*="dialogBackdrop"]')!, {
      key: 'Escape',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should trigger file input when drop zone is clicked', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    const dropZone = screen.getByText('拖文件至此或点击此区域').closest('[role="button"]');
    fireEvent.click(dropZone!);
    // File input should be triggered (we can't directly test this without mocking)
  });

  it('should display supported formats label', () => {
    render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    expect(screen.getByText('支持格式：')).toBeInTheDocument();
  });

  it('should have proper dialog structure', () => {
    const { container } = render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    expect(container.querySelector('[class*="importDialogContainer"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="importDialogHeader"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="importDialogContent"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="importDialogFooter"]')).toBeInTheDocument();
  });

  it('should have proper button styling', () => {
    const { container } = render(
      <ImportFileDialog
        isOpen={true}
        onClose={mockOnClose}
        onFilesSelected={mockOnFilesSelected}
      />
    );
    const primaryButton = screen.getByRole('button', { name: '高级导入' });
    expect(primaryButton).toHaveClass('importDialogButtonPrimary');
  });
});
