'use client';

import { NavigationItemType } from '@/lib/types/creation';
import MyProjectsContent from './content/MyProjectsContent';
import NewProjectContent from './content/NewProjectContent';
import AICreateContent from './content/AICreateContent';
import ImportFileContent from './content/ImportFileContent';
import AIPromptContent from './content/AIPromptContent';
import LongTextContent from './content/LongTextContent';
import DocumentAnalysisContent from './content/DocumentAnalysisContent';
import StructuredAnalysisContent from './content/StructuredAnalysisContent';
import styles from './styles.module.css';

interface MainContentProps {
  selectedNavItem: NavigationItemType;
  isCreateProjectDialogOpen: boolean;
  onCreateProjectDialogClose: () => void;
  isImportFileDialogOpen: boolean;
  onImportFileDialogClose: () => void;
  onOpenImportFileDialog: () => void;
}

export default function MainContent({
  selectedNavItem,
  isCreateProjectDialogOpen,
  onCreateProjectDialogClose,
  isImportFileDialogOpen,
  onImportFileDialogClose,
  onOpenImportFileDialog,
}: MainContentProps) {
  const renderContent = () => {
    switch (selectedNavItem) {
      case 'my-projects':
        return (
          <MyProjectsContent
            isDialogOpen={isCreateProjectDialogOpen}
            onDialogClose={onCreateProjectDialogClose}
          />
        );
      case 'new-project':
        return <NewProjectContent />;
      case 'ai-create':
        return <AICreateContent />;
      case 'import-file':
        return (
          <ImportFileContent
            isDialogOpen={isImportFileDialogOpen}
            onDialogClose={onImportFileDialogClose}
            onOpenDialog={onOpenImportFileDialog}
          />
        );
      case 'ai-prompt':
        return <AIPromptContent />;
      case 'long-text':
        return <LongTextContent />;
      case 'document-analysis':
        return <DocumentAnalysisContent />;
      case 'structured-analysis':
        return <StructuredAnalysisContent />;
      default:
        return (
          <MyProjectsContent
            isDialogOpen={isCreateProjectDialogOpen}
            onDialogClose={onCreateProjectDialogClose}
          />
        );
    }
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.contentSection}>{renderContent()}</div>
    </div>
  );
}
