'use client';

import { NavigationItemType } from '@/lib/types/creation';
import styles from './styles.module.css';

interface ButtonGroupProps {
  onNavItemSelect: (itemId: NavigationItemType) => void;
}

export default function ButtonGroup({ onNavItemSelect }: ButtonGroupProps) {
  return (
    <div className={styles.buttonGroup}>
      <button
        className={styles.navButton}
        onClick={() => onNavItemSelect('new-project')}
      >
        新建图谱
      </button>
      <button
        className={styles.navButton}
        onClick={() => onNavItemSelect('ai-create')}
      >
        AI创建
      </button>
    </div>
  );
}
