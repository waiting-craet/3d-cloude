'use client';

import { useState } from 'react';
import SideNavigation from './SideNavigation';
import MainContent from './MainContent';
import { NavigationItemType, PageState } from '@/lib/types/creation';
import styles from './styles.module.css';

export default function CreationWorkflowPage() {
  const [pageState, setPageState] = useState<PageState>({
    selectedNavItem: 'my-projects',
    expandedMenus: new Set(),
  });

  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isImportFileDialogOpen, setIsImportFileDialogOpen] = useState(false);

  const handleNavItemSelect = (itemId: NavigationItemType) => {
    if (itemId === 'new-project') {
      setIsCreateProjectDialogOpen(true);
    } else {
      setPageState((prev) => ({
        ...prev,
        selectedNavItem: itemId,
      }));
    }
  };

  const handleMenuToggle = (menuId: string) => {
    setPageState((prev) => {
      const newExpandedMenus = new Set(prev.expandedMenus);
      if (newExpandedMenus.has(menuId)) {
        newExpandedMenus.delete(menuId);
      } else {
        newExpandedMenus.add(menuId);
      }
      return {
        ...prev,
        expandedMenus: newExpandedMenus,
      };
    });
  };

  return (
    <div className={styles.pageContainer}>
      <SideNavigation
        selectedNavItem={pageState.selectedNavItem}
        expandedMenus={pageState.expandedMenus}
        onNavItemSelect={handleNavItemSelect}
        onMenuToggle={handleMenuToggle}
      />
      <MainContent
        selectedNavItem={pageState.selectedNavItem}
        isCreateProjectDialogOpen={isCreateProjectDialogOpen}
        onCreateProjectDialogClose={() => setIsCreateProjectDialogOpen(false)}
        isImportFileDialogOpen={isImportFileDialogOpen}
        onImportFileDialogClose={() => setIsImportFileDialogOpen(false)}
        onOpenImportFileDialog={() => setIsImportFileDialogOpen(true)}
      />
    </div>
  );
}
