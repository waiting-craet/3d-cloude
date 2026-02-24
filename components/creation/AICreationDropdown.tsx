'use client';

import { NavigationItemType, AI_CREATION_OPTIONS } from '@/lib/types/creation';
import styles from './styles.module.css';

interface AICreationDropdownProps {
  isExpanded: boolean;
  onToggle: () => void;
  selectedNavItem: NavigationItemType;
  onNavItemSelect: (itemId: NavigationItemType) => void;
}

export default function AICreationDropdown({
  isExpanded,
  onToggle,
  selectedNavItem,
  onNavItemSelect,
}: AICreationDropdownProps) {
  return (
    <div className={styles.dropdownMenu}>
      <div
        className={`${styles.dropdownHeader} ${isExpanded ? styles.expanded : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onToggle();
          }
        }}
      >
        <span>AI创作</span>
        <span className={`${styles.dropdownIcon} ${isExpanded ? styles.expanded : ''}`}>
          ▼
        </span>
      </div>

      <div className={`${styles.submenuList} ${isExpanded ? styles.expanded : ''}`}>
        {AI_CREATION_OPTIONS.map((option) => (
          <div
            key={option.id}
            className={`${styles.submenuItem} ${
              selectedNavItem === option.id ? styles.selected : ''
            }`}
            onClick={() => onNavItemSelect(option.id as NavigationItemType)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavItemSelect(option.id as NavigationItemType);
              }
            }}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}
