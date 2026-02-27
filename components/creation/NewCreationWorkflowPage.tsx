'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './creation-workflow.module.css';
import CreateProjectModal from '@/components/CreateProjectModal';

interface Project {
  id: string;
  name: string;
}

export default function NewCreationWorkflowPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'graph' | 'document'>('all');
  const [sortBy, setSortBy] = useState<'updateTime' | 'title'>('updateTime');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);

  // 加载项目列表
  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const projectList = data.projects || [];
        setProjects(projectList);
        // 默认选中第一个项目
        if (projectList.length > 0) {
          setSelectedProjectId(projectList[0].id);
        }
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  };

  // 加载现有项目列表
  useEffect(() => {
    if (isModalOpen) {
      fetchProjects();
    }
  }, [isModalOpen]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setExistingProjects(data.projects || []);
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  };

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateProject = async (projectName: string, graphName: string, isNewProject: boolean) => {
    try {
      if (isNewProject) {
        // 创建新项目和图谱
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            graphName: graphName,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '创建失败');
        }

        const data = await response.json();
        console.log('项目创建成功:', data);
      } else {
        // 在现有项目中创建图谱
        const selectedProject = existingProjects.find(p => p.name === projectName);
        if (!selectedProject) {
          throw new Error('未找到选中的项目');
        }

        const response = await fetch('/api/graphs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: selectedProject.id,
            name: graphName,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '创建图谱失败');
        }

        const data = await response.json();
        console.log('图谱创建成功:', data);
      }

      // 创建成功后刷新项目列表
      await fetchAllProjects();
    } catch (error) {
      console.error('创建失败:', error);
      throw error;
    }
  };

  const handleImport = () => {
    router.push('/import');
  };

  const handleAICreate = () => {
    router.push('/text-page');
  };

  return (
    <div className={styles.pageContainer}>
      {/* 左侧导航栏 - 占 1/6 宽度 */}
      <aside className={styles.sideNavigation}>
        {/* 标题区域 */}
        <div className={styles.titleSection}>
          <h1 className={styles.titleText}>3DGraph</h1>
        </div>

        {/* 按钮容器 */}
        <div className={styles.buttonContainer}>
          {/* 新建按钮 - 蓝色 */}
          <button 
            className={styles.newButton}
            onClick={handleNewProject}
          >
            新建
          </button>

          {/* 导入按钮 - 白色无边框 */}
          <button 
            className={styles.importButton}
            onClick={handleImport}
          >
            导入
          </button>

          {/* AI创建按钮 - 紫色 */}
          <button 
            className={styles.aiCreateButton}
            onClick={handleAICreate}
          >
            AI创建
          </button>
        </div>
      </aside>

      {/* 右侧主内容区 - 占 5/6 宽度 */}
      <main className={styles.mainContent}>
        {/* 搜索框 - 右上角 */}
        <div className={styles.searchContainer}>
          <div style={{ position: 'relative' }}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchBar}
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 功能卡片 - 横向排布 */}
        <div className={styles.actionCards}>
          {/* AI创建卡片 - 鲜艳红色 */}
          <div 
            className={`${styles.actionCard} ${styles.aiCreateCard}`}
            onClick={handleAICreate}
          >
            AI创建
          </div>

          {/* 导入数据卡片 - 鲜艳绿色 */}
          <div 
            className={`${styles.actionCard} ${styles.importDataCard}`}
            onClick={handleImport}
          >
            导入数据
          </div>
        </div>

        {/* 项目筛选栏 */}
        <div className={styles.filterBar}>
          {/* 左侧：我的项目文本和项目选择下拉框 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 className={styles.myProjectsText}>我的项目</h2>
            
            {/* 项目选择下拉框 */}
            {projects.length > 0 ? (
              <select
                className={styles.filterSelect}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{ minWidth: '200px' }}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '14px', color: '#999' }}>
                暂无项目
              </span>
            )}
          </div>

          {/* 右侧：两个下拉筛选框 */}
          <div className={styles.filterControls}>
            {/* 类型筛选下拉框 */}
            <select
              className={styles.filterSelect}
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'graph' | 'document')}
            >
              <option value="all">全部类型</option>
              <option value="graph">图谱</option>
              <option value="document">文档</option>
            </select>

            {/* 排序方式下拉框 */}
            <select
              className={styles.filterSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updateTime' | 'title')}
            >
              <option value="updateTime">更新时间</option>
              <option value="title">标题</option>
            </select>
          </div>
        </div>

        {/* 项目列表区域 - 占位 */}
        <div className={styles.projectGrid}>
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#999',
            background: '#fff',
            borderRadius: '8px'
          }}>
            项目列表区域（待实现）
          </div>
        </div>
      </main>

      {/* 创建项目对话框 */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateProject}
        existingProjects={existingProjects}
      />
    </div>
  );
}
