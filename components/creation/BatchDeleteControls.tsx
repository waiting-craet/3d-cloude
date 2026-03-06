'use client';

import styles from './creation-workflow.module.css';

interface BatchDeleteControlsProps {
  isBatchDeleteMode: boolean;
  selectedCount: number;
  isDeleting: boolean;
  isProjectView: boolean;
  onEnterBatchMode: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BatchDeleteControls({
  isBatchDeleteMode,
  selectedCount,
  isDeleting,
  isProjectView,
  onEnterBatchMode,
  onConfirm,
  onCancel
}: BatchDeleteControlsProps) {
  // 仅在项目视图显示批量删除功能
  if (!isProjectView) {
    return null;
  }

  // 批量删除模式：显示确定和取消按钮
  if (isBatchDeleteMode) {
    return (
      <div className={styles.batchDeleteControls}>
        <span className={styles.selectedCount}>
          已选中 {selectedCount} 个项目
        </span>
        <div className={styles.batchDeleteActions}>
          <button
            className={styles.batchDeleteConfirmButton}
            onClick={onConfirm}
            disabled={selectedCount === 0 || isDeleting}
            aria-label="确认删除选中的项目"
          >
            {isDeleting ? '删除中...' : '确定'}
          </button>
          <button
            className={styles.batchDeleteCancelButton}
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="取消批量删除"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  // 正常模式：显示批量删除按钮
  return (
    <button
      className={styles.batchDeleteButton}
      onClick={onEnterBatchMode}
      aria-label="批量删除项目"
    >
      批量删除
    </button>
  );
}
