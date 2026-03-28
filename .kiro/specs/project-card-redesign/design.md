# 项目卡片重新设计 - 设计文档

## 概述

本设计文档描述了创建工作流页面中项目卡片的重新设计方案。新设计采用简洁的白色卡片风格，以"name: description"的格式清晰展示项目信息，提升用户体验和视觉一致性。

## 架构

项目卡片组件采用简单的展示型组件架构，不包含复杂的状态管理。组件接收项目数据作为props，渲染为白色卡片，并处理用户交互。

```
┌─────────────────────────────────────────┐
│         ProjectCard Component           │
├─────────────────────────────────────────┤
│                                         │
│  Props: { project: Project }           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  White Card Container             │ │
│  │  ┌─────────────────────────────┐  │ │
│  │  │  name: description          │  │ │
│  │  └─────────────────────────────┘  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Handlers:                              │
│  - onClick: Navigate to editor          │
│  - onHover: Show hover effects          │
│                                         │
└─────────────────────────────────────────┘
```

## 组件和接口

### 1. ProjectCard 组件

**职责**: 渲染单个项目的卡片展示

**Props**:
```typescript
interface ProjectCardProps {
  project: Project;
  onClick?: (projectId: string) => void;
}

interface Project {
  id: string;
  name: string;
  description: string | null | undefined;
  createdAt: Date;
}
```

**渲染逻辑**:
```typescript
function ProjectCard({ project, onClick }: ProjectCardProps) {
  // 处理空描述
  const displayDescription = project.description || '暂无描述';
  
  // 处理空名称
  const displayName = project.name || '未命名项目';
  
  // 格式化显示文本
  const displayText = `${displayName}: ${displayDescription}`;
  
  // 处理点击事件
  const handleClick = () => {
    onClick?.(project.id);
  };
  
  return (
    <div className="project-card" onClick={handleClick}>
      <p className="project-text">{displayText}</p>
    </div>
  );
}
```

### 2. ProjectGrid 组件

**职责**: 管理项目卡片的网格布局

**Props**:
```typescript
interface ProjectGridProps {
  projects: Project[];
  onNewProjectClick: () => void;
  onProjectClick?: (projectId: string) => void;
}
```

**布局结构**:
- 使用 CSS Grid 布局
- 自动适应列数（最小宽度 280px）
- 新建项目卡片始终在第一个位置
- 项目卡片按创建时间排序

## 数据模型

### Project 接口
```typescript
interface Project {
  id: string;              // 项目唯一标识
  name: string;            // 项目名称
  description: string | null | undefined;  // 项目描述（可为空）
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
  status: 'active' | 'archived';  // 项目状态
}
```

### 数据处理规则

1. **名称处理**:
   - 如果 `name` 为空字符串、null 或 undefined，显示"未命名项目"
   - 如果 `name` 过长（超过50个字符），使用省略号截断

2. **描述处理**:
   - 如果 `description` 为空字符串、null 或 undefined，显示"暂无描述"
   - 如果 `description` 过长（超过100个字符），使用省略号截断
   - 默认文本使用较浅的颜色（#999999）

3. **特殊字符处理**:
   - 正确转义 HTML 特殊字符（<, >, &, ", '）
   - 保留换行符和空格
   - 支持 Unicode 字符（包括中文、日文、韩文等）

## 样式规范

### 卡片容器样式
```css
.project-card {
  /* 背景和边框 */
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  /* 尺寸和间距 */
  padding: 20px;
  min-height: 80px;
  
  /* 交互 */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.project-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
```

### 文本样式
```css
.project-text {
  /* 字体 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               'PingFang SC', 'Hiragino Sans GB', 
               'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  
  /* 颜色 */
  color: #262626;
  
  /* 文本处理 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  /* 间距 */
  margin: 0;
}

.project-text .name {
  font-weight: 500;
}

.project-text .description {
  font-weight: 400;
}

.project-text .empty-description {
  color: #999999;
  font-weight: 400;
}
```

### 网格布局样式
```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
}
```

### 响应式设计
```css
/* 平板设备 */
@media (max-width: 1024px) {
  .project-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    padding: 16px;
  }
  
  .project-card {
    padding: 16px;
  }
}

/* 移动设备 */
@media (max-width: 768px) {
  .project-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
  }
  
  .project-card {
    padding: 16px;
  }
}
```

## 正确性属性

一个属性是一个特征或行为，应该在系统的所有有效执行中保持真实——本质上是对系统应该做什么的正式陈述。属性充当人类可读规范和机器可验证正确性保证之间的桥梁。

### Property 1: 内容显示格式一致性
*对于任何* 项目数据，卡片显示的文本应该包含冒号分隔符，格式为"name: description"。

**验证**: Requirements 2.1, 2.2

### Property 2: 空描述默认文本
*对于任何* 描述字段为空（空字符串、null 或 undefined）的项目，卡片应该显示"暂无描述"作为默认文本。

**验证**: Requirements 2.6, 6.1, 6.2, 6.3

### Property 3: 空名称默认文本
*对于任何* 名称字段为空（空字符串、null 或 undefined）的项目，卡片应该显示"未命名项目"作为默认文本。

**验证**: Requirements 7.2

### Property 4: 特殊字符正确处理
*对于任何* 包含特殊字符（HTML 特殊字符、Unicode 字符）的项目数据，卡片应该正确显示这些字符，不出现乱码或渲染错误。

**验证**: Requirements 7.3, 7.5

### Property 5: 长文本截断处理
*对于任何* 文本长度超过显示区域的项目数据，卡片应该使用省略号截断文本，保持单行显示。

**验证**: Requirements 3.5, 7.4

### Property 6: 点击导航行为
*对于任何* 项目卡片，当用户点击时，系统应该触发导航到对应的项目编辑页面。

**验证**: Requirements 4.3

### Property 7: 名称字段始终显示
*对于任何* 项目数据，卡片应该始终显示名称字段（即使为空也显示默认文本）。

**验证**: Requirements 7.1

## 错误处理

### 数据错误
- **缺失必需字段**: 如果项目对象缺少 `id` 字段，记录错误并跳过渲染
- **无效数据类型**: 如果 `name` 或 `description` 不是字符串类型，转换为字符串
- **日期解析错误**: 如果 `createdAt` 无法解析，使用当前时间

### 渲染错误
- **组件崩溃**: 使用 Error Boundary 捕获渲染错误，显示错误提示
- **样式加载失败**: 使用内联样式作为降级方案

### 交互错误
- **点击事件失败**: 捕获错误并显示提示信息
- **导航失败**: 显示错误提示，允许用户重试

## 测试策略

### 单元测试
- 测试组件正确渲染项目数据
- 测试空描述显示默认文本
- 测试空名称显示默认文本
- 测试特殊字符正确显示
- 测试长文本截断
- 测试点击事件触发
- 测试悬停效果

### 属性测试
- **Property 1**: 生成随机项目数据，验证显示格式包含冒号
- **Property 2**: 生成描述为空的项目数据，验证显示"暂无描述"
- **Property 3**: 生成名称为空的项目数据，验证显示"未命名项目"
- **Property 4**: 生成包含特殊字符的项目数据，验证正确显示
- **Property 5**: 生成长文本项目数据，验证使用省略号截断
- **Property 6**: 生成随机项目数据，模拟点击，验证导航被触发
- **Property 7**: 生成任意项目数据，验证名称字段始终存在

### 集成测试
- 测试卡片在网格中的布局
- 测试多个卡片的交互
- 测试响应式布局
- 测试与其他组件的集成

### 视觉回归测试
- 测试卡片样式一致性
- 测试悬停效果
- 测试不同屏幕尺寸下的显示
- 测试与页面整体风格的协调性

## 性能考虑

### 渲染优化
- 使用 `React.memo` 避免不必要的重新渲染
- 使用 `useMemo` 缓存格式化后的显示文本
- 避免在渲染函数中创建新对象或函数

### 列表优化
- 对于大量项目，考虑使用虚拟滚动
- 使用 `key` 属性优化列表渲染
- 延迟加载项目数据

### 交互优化
- 使用 CSS 过渡而非 JavaScript 动画
- 使用 `will-change` 提示浏览器优化
- 防抖点击事件避免重复触发

## 可访问性

### 键盘导航
- 卡片可通过 Tab 键聚焦
- 按 Enter 或 Space 键触发点击
- 提供清晰的焦点指示器

### 屏幕阅读器
- 使用语义化 HTML 标签
- 提供 `aria-label` 描述卡片内容
- 确保文本内容可被读取

### 视觉辅助
- 确保足够的颜色对比度（至少 4.5:1）
- 不仅依赖颜色传达信息
- 支持高对比度模式

## 实现注意事项

1. **组件复用**: 修改现有的 `ProjectCard.tsx` 组件，保持接口兼容性
2. **样式隔离**: 使用 CSS Modules 避免样式冲突
3. **类型安全**: 使用 TypeScript 确保类型正确
4. **向后兼容**: 确保修改不影响现有功能
5. **渐进增强**: 先实现基础功能，再添加增强效果
