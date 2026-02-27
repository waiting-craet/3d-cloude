'use client';

import { useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

interface Project {
  id: string;
  name: string;
  description: string | null | undefined;
  thumbnail?: string;
  createdAt: Date;
  status: 'active' | 'archived';
}

interface ProjectCardProps {
  project: Project;
}

// 文本处理工具函数
const sanitizeText = (text: string): string => {
  // React 会自动转义 HTML 特殊字符，所以这里只需要确保文本是字符串
  return String(text);
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  const router = useRouter();

  // 处理空名称
  const displayName = useMemo(() => {
    if (!project.name || project.name.trim() === '') {
      return '未命名项目';
    }
    // 清理和截断名称（最大50个字符）
    const sanitized = sanitizeText(project.name);
    return truncateText(sanitized, 50);
  }, [project.name]);

  // 处理空描述
  const displayDescription = useMemo(() => {
    if (!project.description || project.description.trim() === '') {
      return '暂无描述';
    }
    // 清理和截断描述（最大100个字符）
    const sanitized = sanitizeText(project.description);
    return truncateText(sanitized, 100);
  }, [project.description]);

  // 格式化显示文本："name: description"
  const displayText = useMemo(() => {
    return `${displayName}: ${displayDescription}`;
  }, [displayName, displayDescription]);

  // 判断是否使用默认描述文本
  const isEmptyDescription = useMemo(() => {
    return !project.description || project.description.trim() === '';
  }, [project.description]);

  // 处理点击事件 - 导航到项目编辑页面
  const handleClick = async () => {
    try {
      // 获取项目的图谱信息
      const response = await fetch(`/api/projects/${project.id}/graphs`);
      if (response.ok) {
        const data = await response.json();
        if (data.graphs && data.graphs.length > 0) {
          const firstGraph = data.graphs[0];
          // 根据图谱设置判断类型（简化处理，默认为2D）
          // TODO: 在数据库中添加图谱类型字段
          router.push(`/workflow?graphId=${firstGraph.id}`);
        } else {
          // 如果没有图谱，导航到项目页面
          router.push(`/creation?projectId=${project.id}`);
        }
      } else {
        // 如果获取失败，使用默认导航
        router.push(`/creation?projectId=${project.id}`);
      }
    } catch (error) {
      console.error('导航失败:', error);
      // 错误处理：显示提示或使用默认导航
      router.push(`/creation?projectId=${project.id}`);
    }
  };

  // 处理键盘事件（可访问性）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={styles.projectCardSimple}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`项目: ${displayText}`}
    >
      <p className={styles.projectTextSimple}>
        <span className={styles.projectName}>{displayName}</span>
        <span className={styles.projectSeparator}>: </span>
        <span className={isEmptyDescription ? styles.projectDescriptionEmpty : styles.projectDescription}>
          {displayDescription}
        </span>
      </p>
    </div>
  );
};

// 使用 React.memo 优化性能
export default memo(ProjectCard);
