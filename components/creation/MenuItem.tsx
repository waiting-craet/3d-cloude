'use client';

import styles from './styles.module.css';

interface MenuItemProps {
  id: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function MenuItem({
  id,
  label,
  isSelected,
  onClick,
}: MenuItemProps) {
  return (
    <div
      className={`${styles.menuItem} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {label}
    </div>
  );
}
