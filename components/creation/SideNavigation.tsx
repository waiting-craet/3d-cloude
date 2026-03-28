'use client';

import { NavigationItemType } from '@/lib/types/creation';
import TitleSection from './TitleSection';
import ButtonGroup from './ButtonGroup';
import MenuItem from './MenuItem';
import AICreationDropdown from './AICreationDropdown';
import ImportButton from './ImportButton';
import styles from './styles.module.css';

interface SideNavigationProps {
  selectedNavItem: NavigationItemType;
  expandedMenus: Set<string>;
  onNavItemSelect: (itemId: NavigationItemType) => void;
  onMenuToggle: (menuId: string) => void;
}

export default function SideNavigation({
  selectedNavItem,
  expandedMenus,
  onNavItemSelect,
  onMenuToggle,
}: SideNavigationProps) {
  return (
    <nav className={styles.sideNavigation}>
      <TitleSection />
      <ButtonGroup onNavItemSelect={onNavItemSelect} />
      
      <div className={styles.menuContainer}>
        <MenuItem
          id="my-projects"
          label="我的项目"
          isSelected={selectedNavItem === 'my-projects'}
          onClick={() => onNavItemSelect('my-projects')}
        />
        
        <ImportButton 
          onImport={() => onNavItemSelect('import-file')} 
          onOpenDialog={() => onNavItemSelect('import-file')}
        />
        
        <AICreationDropdown
          isExpanded={expandedMenus.has('ai-creation')}
          onToggle={() => onMenuToggle('ai-creation')}
          selectedNavItem={selectedNavItem}
          onNavItemSelect={onNavItemSelect}
        />
      </div>
    </nav>
  );
}
