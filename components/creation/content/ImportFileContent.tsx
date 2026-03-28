'use client';

import ImportFileDialog from '../ImportFileDialog';
import ImportButton from '../ImportButton';

interface ImportFileContentProps {
  isDialogOpen: boolean;
  onDialogClose: () => void;
  onOpenDialog: () => void;
}

export default function ImportFileContent({
  isDialogOpen,
  onDialogClose,
  onOpenDialog,
}: ImportFileContentProps) {
  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files);
    // Handle file processing here
  };

  return (
    <div>
      <h1>导入文件</h1>
      <p>点击下方按钮导入文件</p>
      <ImportButton onImport={() => {}} onOpenDialog={onOpenDialog} />
      <ImportFileDialog
        isOpen={isDialogOpen}
        onClose={onDialogClose}
        onFilesSelected={handleFilesSelected}
      />
    </div>
  );
}
