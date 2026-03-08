'use client';

import { useEffect, useRef, KeyboardEvent } from 'react';
import styles from './creation-workflow.module.css';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  projectCount?: number;
  graphCount?: number;
  itemType: 'project' | 'graph';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteConfirmDialog组件
 * 
 * 批量删除确认对话框，显示项目或图谱数量和警告信息
 * 
 * 功能：
 * - 显示将要删除的项目或图谱数量
 * - 警告用户此操作不可撤销
 * - 对话框打开时自动获得焦点 (需求 10.6)
 * - 支持Escape键关闭 (需求 10.7)
 * - 包含确认和取消按钮
 * - 使用role="alertdialog"和aria-describedby提供可访问性
 * 
 * 需求: 4.1, 4.2, 5.1, 5.2, 5.3, 5.7, 10.6, 10.7
 */
export default function DeleteConfirmDialog({
  isOpen,
  projectCount = 0,
  graphCount = 0,
  itemType,
  onConfirm,
  onCancel
}: DeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // 根据类型确定数量和文本
  const count = itemType === 'project' ? projectCount : graphCount;
  const itemName = itemType === 'project' ? '项目' : '图谱';
  const warningText = itemType === 'project' 
    ? '此操作将永久删除所选项目及其所有关联数据（图谱、节点、边、文件），且'
    : '此操作将永久删除所选图谱及其所有关联数据（节点、边、文件），且';

  // 对话框打开时自动获得焦点 (需求 10.6)
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  // 处理键盘事件 - 支持Escape键关闭 (需求 10.7)
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  // 如果对话框未打开，不渲染任何内容
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className={styles.dialogOverlay}
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* 对话框 */}
      <div
        ref={dialogRef}
        className={styles.dialogContainer}
        role="alertdialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* 对话框标题 */}
        <h2 id="dialog-title" className={styles.dialogTitle}>
          确认删除
        </h2>

        {/* 对话框内容 - 显示项目或图谱数量和警告信息 (需求 4.1, 4.2, 5.1, 5.2) */}
        <div id="dialog-description" className={styles.dialogContent}>
          <p className={styles.dialogText}>
            您即将删除 <strong className={styles.dialogHighlight}>{count}</strong> 个{itemName}。
          </p>
          <p className={styles.dialogWarning}>
            ⚠️ {warningText}<strong>不可撤销</strong>。
          </p>
        </div>

        {/* 对话框按钮 */}
        <div className={styles.dialogActions}>
          {/* 取消按钮 (需求 5.7) */}
          <button
            className={styles.dialogCancelButton}
            onClick={onCancel}
            aria-label="取消删除操作"
          >
            取消
          </button>

          {/* 确认按钮 (需求 4.3, 5.3) */}
          <button
            className={styles.dialogConfirmButton}
            onClick={onConfirm}
            aria-label={`确认删除选中的${itemName}`}
          >
            确认删除
          </button>
        </div>
      </div>
    </>
  );
}
