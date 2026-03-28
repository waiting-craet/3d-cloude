'use client';

import styles from './styles.module.css';

interface ImportButtonProps {
  onImport: () => void;
  onOpenDialog: () => void;
}

export default function ImportButton({ onImport, onOpenDialog }: ImportButtonProps) {
  const handleClick = () => {
    onOpenDialog();
  };

  return (
    <button className={styles.importButton} onClick={handleClick}>
      导入文件
    </button>
  );
}
