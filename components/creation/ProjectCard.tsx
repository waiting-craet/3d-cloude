'use client';

import styles from './styles.module.css';

interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  createdAt: Date;
  status: 'active' | 'archived';
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const formattedDate = new Date(project.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Generate a color based on project name
  const getColorIndex = (name: string) => {
    return name.charCodeAt(0) % 6;
  };

  const colorIndex = getColorIndex(project.name);
  const colors = ['#5B8DEE', '#6B9EFF', '#4A7FE8', '#7BA8FF', '#3A6FD8', '#8BB8FF'];
  const bgColor = colors[colorIndex];

  return (
    <div className={styles.projectCard}>
      <div className={styles.projectCardHeader}>
        <div className={styles.projectCardIcon} style={{ backgroundColor: bgColor }}>
          {project.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.projectCardHeaderContent}>
          <h3 className={styles.projectCardTitle}>{project.name}</h3>
          <p className={styles.projectCardStatusLabel}>{project.description || '暂无介绍'}</p>
        </div>
        <div className={styles.projectCardMeta}>
          <span className={styles.projectCardBadge}>暂无介绍</span>
        </div>
      </div>
      <div className={styles.projectCardBody}>
        <div className={styles.projectCardInfo}>
          <span className={styles.projectCardCreator}>wechat-c5Ujwfne-3un2RNH</span>
          <span className={styles.projectCardType}>图 卡</span>
        </div>
        <span className={styles.projectCardDate}>{formattedDate}</span>
      </div>
    </div>
  );
}
