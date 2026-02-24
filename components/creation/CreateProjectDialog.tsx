'use client';

import { useState, useEffect } from 'react';
import styles from './styles.module.css';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (graphName: string, graphType: '2d' | '3d') => void;
}

export default function CreateProjectDialog({
  isOpen,
  onClose,
  onCreateProject,
}: CreateProjectDialogProps) {
  const [graphName, setGraphName] = useState('');
  const [graphType, setGraphType] = useState<'2d' | '3d'>('2d');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (graphName.trim()) {
      onCreateProject(graphName, graphType);
      setGraphName('');
      setGraphType('2d');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.dialogBackdrop} onClick={handleBackdropClick}>
      <div className={styles.dialogContainer}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>新建知识图谱</h2>
          <p className={styles.dialogSubtitle}>
            创建新的知识图谱
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.dialogForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>知识图谱名称</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="输入知识图谱名称"
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>图谱类型</label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={graphType === '2d'}
                  onChange={() => setGraphType('2d')}
                  className={styles.checkbox}
                />
                <span>二维图谱</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={graphType === '3d'}
                  onChange={() => setGraphType('3d')}
                  className={styles.checkbox}
                />
                <span>三维图谱</span>
              </label>
            </div>
          </div>

          <div className={styles.dialogFooter}>
            <button
              type="button"
              className={styles.dialogButtonCancel}
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className={styles.dialogButtonCreate}
              disabled={!graphName.trim()}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
