'use client';

import { useState, useRef } from 'react';
import styles from './styles.module.css';

interface ImportFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
}

const SUPPORTED_FORMATS = ['.xlsx', '.json', '.csv', '.nrd'];

export default function ImportFileDialog({
  isOpen,
  onClose,
  onFilesSelected,
}: ImportFileDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];
    
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        validFiles.push(file);
      }
    }
    return validFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      onClose();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      onClose();
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={styles.dialogBackdrop} 
      onClick={handleBackdropClick}
      onKeyDown={handleEscapeKey}
    >
      <div className={styles.importDialogContainer}>
        <div className={styles.importDialogHeader}>
          <h2 className={styles.importDialogTitle}>本地导入</h2>
          <button
            className={styles.importDialogCloseButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className={styles.importDialogContent}>
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleDropZoneClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleDropZoneClick();
              }
            }}
          >
            <div className={styles.dropZoneIcon}>📁</div>
            <p className={styles.dropZoneText}>拖文件至此或点击此区域</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={SUPPORTED_FORMATS.join(',')}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </div>

          <div className={styles.supportedFormats}>
            <p className={styles.supportedFormatsLabel}>支持格式：</p>
            <div className={styles.formatsList}>
              <span className={styles.formatTag}>Excel(.xlsx)</span>
              <span className={styles.formatTag}>JSON</span>
              <span className={styles.formatTag}>CSV</span>
              <span className={styles.formatTag}>NRD Studio files(.nrd)</span>
            </div>
          </div>
        </div>

        <div className={styles.importDialogFooter}>
          <button
            className={styles.importDialogButtonSecondary}
            onClick={onClose}
          >
            AI创作
          </button>
          <button
            className={styles.importDialogButtonSecondary}
            onClick={onClose}
          >
            下载模板
          </button>
          <button
            className={styles.importDialogButtonPrimary}
            onClick={onClose}
          >
            高级导入
          </button>
        </div>
      </div>
    </div>
  );
}
