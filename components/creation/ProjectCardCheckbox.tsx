'use client';

import { KeyboardEvent } from 'react';
import styles from './creation-workflow.module.css';

interface ProjectCardCheckboxProps {
  projectId: string;
  projectName: string;
  isSelected: boolean;
  onToggle: (projectId: string) => void;
}

/**
 * ProjectCardCheckbox组件
 * 
 * 显示在项目卡片右上角的复选框覆盖层，用于批量删除功能
 * 
 * 功能：
 * - 显示复选框，支持选中/未选中状态
 * - 处理点击事件，切换选中状态
 * - 阻止事件冒泡，避免触发项目卡片点击
 * - 支持键盘操作（空格键切换）
 * - 包含可访问性标签（aria-label）
 * 
 * 需求: 2.5, 2.6, 2.7, 3.1, 3.2, 10.2, 10.4
 */
export default function ProjectCardCheckbox({
  projectId,
  projectName,
  isSelected,
  onToggle
}: ProjectCardCheckboxProps) {
  
  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡到项目卡片 (需求 3.2)
    e.stopPropagation();
    
    // 切换选中状态 (需求 3.1)
    onToggle(projectId);
  };

  // 处理键盘事件 (需求 10.4)
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // 空格键切换选中状态
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); // 防止页面滚动
      e.stopPropagation(); // 阻止事件冒泡
      onToggle(projectId);
    }
  };

  return (
    <div
      className={styles.checkboxOverlay}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`选择项目 ${projectName}`}
      tabIndex={0}
    >
      <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
        {isSelected && (
          <svg
            className={styles.checkboxIcon}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 4.5L6 12L2.5 8.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
