'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectGrid from '../ProjectGrid';
import CreateProjectDialog from '../CreateProjectDialog';
import styles from '../styles.module.css';

interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  createdAt: Date;
  status: 'active' | 'archived';
}

interface MyProjectsContentProps {
  isDialogOpen?: boolean;
  onDialogClose?: () => void;
}

export default function MyProjectsContent({
  isDialogOpen: externalIsOpen = false,
  onDialogClose: externalOnClose,
}: MyProjectsContentProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocalDialogOpen, setIsLocalDialogOpen] = useState(false);

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('获取项目失败');
        }
        const data = await response.json();
        
        // 转换数据格式
        const formattedProjects: Project[] = data.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description || '暂无介绍',
          createdAt: new Date(project.createdAt),
          status: 'active' as const,
        }));
        
        setProjects(formattedProjects);
      } catch (error) {
        console.error('获取项目失败:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // 使用外部对话框状态或本地状态
  const isDialogOpen = externalIsOpen || isLocalDialogOpen;
  const handleDialogClose = () => {
    setIsLocalDialogOpen(false);
    externalOnClose?.();
  };

  const handleCreateProject = async (graphName: string, graphType: '2d' | '3d') => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graphName,
          graphType,
        }),
      });

      if (!response.ok) {
        throw new Error('创建项目失败');
      }

      const newProject = await response.json();
      
      // 添加到项目列表
      const formattedProject: Project = {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description || '暂无介绍',
        createdAt: new Date(newProject.createdAt),
        status: 'active',
      };

      setProjects([formattedProject, ...projects]);
      handleDialogClose();

      // 获取第一个图谱的ID并跳转
      if (newProject.graphs && newProject.graphs.length > 0) {
        const graphId = newProject.graphs[0].id;
        // 根据图谱类型跳转到相应的页面
        if (graphType === '2d') {
          router.push(`/workflow?graphId=${graphId}`);
        } else {
          // 3D图谱跳转到3D编辑器页面
          router.push(`/3d-editor?graphId=${graphId}`);
        }
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      alert('创建项目失败，请重试');
    }
  };

  return (
    <div className={styles.myProjectsContainer}>
      <div className={styles.myProjectsHeader}>
        <h1>我的项目</h1>
        <p>管理和创建您的知识图谱项目</p>
      </div>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <p>加载中...</p>
        </div>
      ) : (
        <ProjectGrid
          projects={projects}
          onNewProjectClick={() => setIsLocalDialogOpen(true)}
        />
      )}
      <CreateProjectDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
