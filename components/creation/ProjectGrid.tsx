'use client';

import NewProjectCard from './NewProjectCard';
import ProjectCard from './ProjectCard';
import styles from './styles.module.css';

interface Project {
  id: string;
  name: string;
  description: string | null | undefined;
  thumbnail?: string;
  createdAt: Date;
  status: 'active' | 'archived';
}

interface ProjectGridProps {
  projects: Project[];
  onNewProjectClick: () => void;
}

export default function ProjectGrid({
  projects,
  onNewProjectClick,
}: ProjectGridProps) {
  return (
    <div className={styles.projectGrid}>
      <NewProjectCard onClick={onNewProjectClick} />
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
