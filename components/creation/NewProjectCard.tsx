'use client';

import styles from './styles.module.css';

interface NewProjectCardProps {
  onClick: () => void;
}

export default function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <div className={styles.newProjectCard} onClick={onClick}>
      <div className={styles.newProjectCardLabel}>新建</div>
      <div className={styles.newProjectCardContent}>
        <div className={styles.newProjectIcon}>+</div>
      </div>
    </div>
  );
}
