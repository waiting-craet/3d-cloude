# 设计文档 - 导入页面莫兰蒂色彩重新设计

## 概述

本设计文档详细说明导入数据页面(app/import/page.tsx)的莫兰蒂色彩重新设计方案。设计参考创建页面(app/create/page.tsx)的莫兰蒂绿色风格,使用天青色(#7FDBDA)和黛绿色(#426666)作为主要配色。此次重新设计仅涉及视觉呈现层面,不修改任何现有功能逻辑,确保所有导入功能、数据处理、API调用和状态管理保持完全不变。

### 设计目标

1. 应用统一的莫兰蒂色系调色板,提升视觉舒适度
2. 保持与创建页面的视觉一致性,增强产品整体性
3. 优化UI组件的颜色应用,改善用户体验
4. 确保功能完整性,不影响任何现有逻辑

### 设计原则

1. **视觉优先**: 仅修改颜色、渐变、阴影等视觉属性
2. **功能保护**: 保持所有事件处理、状态管理、API调用不变
3. **一致性**: 与创建页面使用相同的设计语言和视觉效果
4. **可维护性**: 使用集中的颜色配置对象,便于后续调整

## 架构设计

### 高层架构

导入页面的架构保持不变,仅在表现层进行颜色配置更新:

```
┌─────────────────────────────────────────────────────────┐
│                    Import Page Component                 │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Morandi Color Configuration             │  │
│  │  (MorandiColors + InkWashEffects Objects)         │  │
│  └───────────────────────────────────────────────────┘  │
│                          │                                │
│                          ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │              UI Component Layer                    │  │
│  │  • Navigation Bar                                  │  │
│  │  • Project/Graph Selectors                        │  │
│  │  • File Type Cards                                │  │
│  │  • Template Download Section                      │  │
│  │  • Action Buttons                                 │  │
│  │  • Modals (New Project/Graph/Confirm/Loading)    │  │
│  │  • Status Messages                                │  │
│  └───────────────────────────────────────────────────┘  │
│                          │                                │
│                          ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Business Logic Layer (不变)               │  │
│  │  • State Management (useState hooks)              │  │
│  │  • Event Handlers                                 │  │
│  │  • API Integration                                │  │
│  │  • Data Validation                                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```


### 设计分层

1. **配置层**: 定义莫兰蒂色系调色板和视觉效果常量
2. **表现层**: 应用颜色配置到UI组件的内联样式
3. **逻辑层**: 保持不变,包含所有功能实现

## 组件和接口

### 1. 莫兰蒂色系调色板 (MorandiColors)

参考创建页面的实现,定义完整的莫兰蒂色系调色板对象:

```typescript
const MorandiColors = {
  // 主要强调色
  skyBlue: '#7FDBDA',           // 天青色 - 主要强调色
  darkGreen: '#426666',         // 黛绿色 - 次要强调色
  
  // 莫兰蒂绿色系列
  sageGreen: '#7fa99b',         // 鼠尾草绿 - 主要背景和按钮
  mintGreen: '#9bbaae',         // 薄荷绿 - 次要背景
  paleGreen: '#c8d5cf',         // 浅绿 - 微妙背景
  
  // 中性色调
  warmGray: '#e8e6e3',          // 暖灰 - 边框和分隔线
  softWhite: '#f5f4f2',         // 柔白 - 卡片背景
  charcoal: '#4a4a48',          // 炭灰 - 文本
  
  // 状态色 (柔和化以配合调色板)
  successGreen: '#7fa87f',      // 柔和绿 - 成功状态
  warningAmber: '#d4b896',      // 柔和琥珀 - 警告状态
  errorRose: '#c89b9b',         // 柔和玫瑰 - 错误状态
  
  // 悬停状态 (稍浅/深的变体)
  skyBlueHover: '#9dd9f3',      // 浅天青色
  darkGreenHover: '#3d6363',    // 浅黛绿色
  sageGreenHover: '#8fb5a7',    // 浅鼠尾草绿
}
```

**颜色选择说明**:
- 天青色和黛绿色作为主要强调色,用于关键交互元素
- 鼠尾草绿系列用于按钮、导航栏等主要UI元素
- 中性色调提供背景和文本的柔和对比
- 状态色经过柔和化处理,避免视觉冲击

### 2. 水墨视觉效果 (InkWashEffects)

定义统一的视觉效果常量,确保与创建页面一致:

```typescript
const InkWashEffects = {
  // 渐变背景 (柔和、垂直)
  pageGradient: 'linear-gradient(135deg, #e8f0ed 0%, #d4e4df 100%)',
  cardGradient: 'linear-gradient(180deg, #f5f4f2 0%, #e8e6e3 100%)',
  navGradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(245, 244, 242, 0.85) 100%)',
  modalGradient: 'linear-gradient(180deg, #ffffff 0%, #f5f4f2 100%)',
  
  // 柔和阴影 (多层次深度)
  softShadow: '0 2px 8px rgba(90, 122, 110, 0.08), 0 1px 3px rgba(90, 122, 110, 0.06)',
  cardShadow: '0 4px 12px rgba(90, 122, 110, 0.12), 0 2px 4px rgba(90, 122, 110, 0.06)',
  modalShadow: '0 8px 24px rgba(90, 122, 110, 0.15), 0 4px 8px rgba(90, 122, 110, 0.1)',
  
  // 圆角半径 (柔和、圆润)
  smallRadius: '8px',
  mediumRadius: '12px',
  largeRadius: '14px',
  pillRadius: '24px',
  
  // 透明度叠加层
  modalOverlay: 'rgba(66, 102, 102, 0.6)',      // 黛绿色半透明
  loadingOverlay: 'rgba(66, 102, 102, 0.7)',    // 黛绿色半透明(更深)
  
  // 模糊效果
  backdropBlur: 'blur(10px)',
}
```

**视觉效果说明**:
- 渐变背景使用柔和的绿色到米色过渡
- 阴影采用多层叠加,创造自然深度
- 圆角半径保持一致性,增强视觉流畅度
- 模态框遮罩使用黛绿色半透明,呼应主题色


### 3. UI组件颜色应用方案

#### 3.1 页面主容器

```typescript
<main style={{
  minHeight: '100vh',
  background: InkWashEffects.pageGradient,  // 使用莫兰蒂绿色渐变
  padding: '0'
}}>
```

**应用说明**:
- 使用与创建页面相同的渐变背景
- 从浅绿色(#e8f0ed)到米绿色(#d4e4df)的135度渐变
- 创造柔和、舒适的整体氛围

#### 3.2 导航栏

```typescript
<nav style={{
  padding: '16px 40px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: InkWashEffects.navGradient,           // 白色到米色渐变
  backdropFilter: InkWashEffects.backdropBlur,      // 毛玻璃效果
  borderBottom: `1px solid rgba(139, 166, 154, 0.2)`,  // 柔和边框
  boxShadow: InkWashEffects.softShadow              // 柔和阴影
}}>
  <div style={{
    color: MorandiColors.sageGreen,                 // 鼠尾草绿文字
    // ... 其他样式
  }}>
    <div style={{
      background: `linear-gradient(135deg, ${MorandiColors.sageGreen} 0%, ${MorandiColors.darkGreen} 100%)`,
      // 品牌标识使用莫兰蒂绿色渐变
    }}>
      📊
    </div>
    知识图谱
  </div>
</nav>
```

**应用说明**:
- 导航栏背景使用白色到米色的渐变,保持轻盈感
- 品牌标识使用鼠尾草绿到黛绿色的渐变
- 边框和阴影使用柔和的莫兰蒂色调
- 添加毛玻璃效果增强层次感

#### 3.3 项目和图谱选择器

```typescript
// 选择器容器
<div style={{
  background: InkWashEffects.cardGradient,          // 卡片渐变背景
  borderRadius: InkWashEffects.smallRadius,         // 8px圆角
  padding: '16px 20px',
  border: `1px solid ${MorandiColors.warmGray}`,    // 暖灰边框
  boxShadow: InkWashEffects.softShadow              // 柔和阴影
}}>
  <select style={{
    border: `1px solid ${MorandiColors.warmGray}`,
    borderRadius: InkWashEffects.smallRadius,
    background: MorandiColors.softWhite,            // 柔白背景
    color: MorandiColors.charcoal,                  // 炭灰文字
    // 悬停时
    // borderColor: MorandiColors.sageGreen
  }}>
  </select>
  
  // 新建按钮
  <button style={{
    background: MorandiColors.sageGreen,            // 鼠尾草绿背景
    color: 'white',
    borderRadius: InkWashEffects.smallRadius,
    boxShadow: InkWashEffects.softShadow,
    // 悬停时
    // background: MorandiColors.sageGreenHover
  }}>
    + 新建
  </button>
</div>
```

**应用说明**:
- 容器使用卡片渐变背景,从柔白到暖灰
- 选择器使用柔白背景,边框为暖灰色
- 悬停时边框变为鼠尾草绿,提供视觉反馈
- 新建按钮使用鼠尾草绿,悬停时变浅

#### 3.4 文件类型卡片

```typescript
<div style={{
  padding: '30px 20px',
  border: selectedFile && fileType === type
    ? `2px solid ${MorandiColors.sageGreen}`        // 选中时鼠尾草绿边框
    : `1px solid ${MorandiColors.warmGray}`,        // 未选中时暖灰边框
  borderRadius: InkWashEffects.mediumRadius,        // 12px圆角
  background: InkWashEffects.cardGradient,          // 卡片渐变背景
  boxShadow: InkWashEffects.cardShadow,             // 卡片阴影
  // 悬停时
  // borderColor: MorandiColors.sageGreenHover
  // transform: 'translateY(-2px)'
}}>
  <FileTypeIcon type={type} />
  <div style={{ color: MorandiColors.charcoal }}>  {/* 炭灰文字 */}
    {type}
  </div>
</div>
```

**应用说明**:
- 卡片使用渐变背景,创造柔和层次
- 未选中时使用暖灰边框,选中时使用鼠尾草绿边框
- 悬停时边框变为浅鼠尾草绿,卡片轻微上移
- 应用卡片阴影增强立体感


#### 3.5 模板下载按钮

```typescript
<button style={{
  padding: '12px 16px',
  background: MorandiColors.sageGreen,              // 鼠尾草绿背景
  border: `1px solid ${MorandiColors.warmGray}`,    // 暖灰边框
  borderRadius: InkWashEffects.smallRadius,         // 8px圆角
  color: 'white',                                   // 白色文字
  boxShadow: InkWashEffects.softShadow,             // 柔和阴影
  // 悬停时
  // background: MorandiColors.sageGreenHover
}}>
  <DownloadIcon />
  <span>Excel模板</span>
</button>
```

**应用说明**:
- 按钮使用鼠尾草绿背景,白色文字
- 悬停时背景变为浅鼠尾草绿
- 应用柔和阴影增强按钮立体感
- 保持与其他按钮一致的视觉风格

#### 3.6 生成图谱按钮

```typescript
<button style={{
  padding: '14px 60px',
  background: !canGenerate 
    ? MorandiColors.warmGray                        // 禁用时暖灰
    : MorandiColors.sageGreen,                      // 启用时鼠尾草绿
  borderRadius: InkWashEffects.mediumRadius,        // 12px圆角
  color: !canGenerate 
    ? MorandiColors.charcoal                        // 禁用时炭灰文字
    : 'white',                                      // 启用时白色文字
  boxShadow: !canGenerate 
    ? 'none' 
    : InkWashEffects.softShadow,                    // 启用时柔和阴影
  // 悬停时(启用状态)
  // background: MorandiColors.sageGreenHover
}}>
  生成图谱
</button>
```

**应用说明**:
- 启用状态使用鼠尾草绿背景,白色文字
- 禁用状态使用暖灰背景,炭灰文字
- 悬停时(启用状态)背景变为浅鼠尾草绿
- 使用中等圆角,增强按钮重要性

#### 3.7 模态框设计

##### 3.7.1 模态框遮罩层

```typescript
<div style={{
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: InkWashEffects.modalOverlay,          // 黛绿色半透明
  backdropFilter: InkWashEffects.backdropBlur,      // 毛玻璃效果
  zIndex: 1000
}}>
```

**应用说明**:
- 使用黛绿色(#426666)的60%透明度作为遮罩
- 添加毛玻璃模糊效果,增强层次感
- 与主题色保持一致

##### 3.7.2 模态框容器

```typescript
<div style={{
  background: InkWashEffects.modalGradient,         // 白色到米色渐变
  borderRadius: InkWashEffects.largeRadius,         // 14px圆角
  padding: '30px',
  boxShadow: InkWashEffects.modalShadow             // 模态框阴影
}}>
  <h3 style={{
    color: MorandiColors.charcoal                   // 炭灰标题
  }}>
    新建项目
  </h3>
  
  <input style={{
    border: `1px solid ${MorandiColors.warmGray}`,  // 暖灰边框
    borderRadius: InkWashEffects.smallRadius,       // 8px圆角
    background: MorandiColors.softWhite,            // 柔白背景
    color: MorandiColors.charcoal,                  // 炭灰文字
    // 聚焦时
    // borderColor: MorandiColors.sageGreen
    // boxShadow: `0 0 0 2px ${MorandiColors.sageGreen}33`
  }} />
  
  <button style={{
    background: MorandiColors.warmGray,             // 取消按钮暖灰
    color: MorandiColors.charcoal
  }}>取消</button>
  
  <button style={{
    background: MorandiColors.sageGreen,            // 确认按钮鼠尾草绿
    color: 'white',
    boxShadow: InkWashEffects.softShadow
  }}>确定</button>
</div>
```

**应用说明**:
- 模态框背景使用白色到米色的渐变
- 输入框聚焦时显示鼠尾草绿边框高亮
- 取消按钮使用暖灰,确认按钮使用鼠尾草绿
- 应用大圆角和模态框阴影,增强视觉层次


##### 3.7.3 加载模态框

```typescript
<div style={{
  background: InkWashEffects.loadingOverlay,        // 黛绿色半透明(更深)
  backdropFilter: InkWashEffects.backdropBlur
}}>
  <div style={{
    background: InkWashEffects.modalGradient,       // 白色到米色渐变
    borderRadius: InkWashEffects.largeRadius,
    boxShadow: InkWashEffects.modalShadow
  }}>
    {/* 加载动画 */}
    <div style={{
      border: `4px solid ${MorandiColors.paleGreen}`,      // 浅绿轨道
      borderTop: `4px solid ${MorandiColors.sageGreen}`,   // 鼠尾草绿旋转部分
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    
    <h3 style={{ color: MorandiColors.charcoal }}>
      正在生成图谱...
    </h3>
    
    {/* 统计信息卡片 */}
    <div style={{
      background: InkWashEffects.cardGradient,      // 卡片渐变背景
      borderRadius: InkWashEffects.mediumRadius,
      border: `1px solid ${MorandiColors.warmGray}`,
      boxShadow: InkWashEffects.cardShadow
    }}>
      <div style={{
        background: MorandiColors.softWhite,        // 柔白背景
        border: `1px solid ${MorandiColors.warmGray}`,
        boxShadow: InkWashEffects.cardShadow
      }}>
        <div style={{ color: MorandiColors.charcoal }}>
          文件节点数
        </div>
        <div style={{ color: MorandiColors.charcoal }}>
          {stats.totalNodesInFile}
        </div>
      </div>
      
      <div style={{
        background: MorandiColors.paleGreen,        // 浅绿背景(警告)
        border: `1px solid ${MorandiColors.warmGray}`
      }}>
        <div style={{ color: MorandiColors.warningAmber }}>
          冗余节点
        </div>
        <div style={{ color: MorandiColors.warningAmber }}>
          {stats.duplicateNodesCount}
        </div>
      </div>
      
      <div style={{
        background: MorandiColors.paleGreen,        // 浅绿背景(成功)
        border: `1px solid ${MorandiColors.warmGray}`
      }}>
        <div style={{ color: MorandiColors.successGreen }}>
          导入节点
        </div>
        <div style={{ color: MorandiColors.successGreen }}>
          {stats.importedNodesCount}
        </div>
      </div>
    </div>
  </div>
</div>
```

**应用说明**:
- 加载遮罩使用更深的黛绿色半透明(70%)
- 加载动画使用鼠尾草绿和浅绿色
- 统计卡片使用渐变背景和柔和阴影
- 不同状态使用不同的莫兰蒂色调(成功绿、警告琥珀)

#### 3.8 状态提示消息

```typescript
<div style={{
  padding: '12px 16px',
  background: uploadStatus.includes('成功')
    ? MorandiColors.successGreen                    // 成功:柔和绿
    : uploadStatus.includes('警告')
      ? MorandiColors.warningAmber                  // 警告:柔和琥珀
      : MorandiColors.errorRose,                    // 错误:柔和玫瑰
  color: uploadStatus.includes('成功')
    ? MorandiColors.darkGreen                       // 成功:黛绿色文字
    : MorandiColors.charcoal,                       // 其他:炭灰文字
  borderRadius: InkWashEffects.smallRadius,         // 8px圆角
  boxShadow: InkWashEffects.softShadow,             // 柔和阴影
  lineHeight: '1.5',
  whiteSpace: 'pre-line'
}}>
  {uploadStatus}
</div>
```

**应用说明**:
- 成功状态使用柔和绿背景,黛绿色文字
- 警告状态使用柔和琥珀背景,炭灰文字
- 错误状态使用柔和玫瑰背景,炭灰文字
- 所有状态提示使用深色文字确保可读性
- 应用柔和圆角和阴影,保持视觉一致性


## 数据模型

本次重新设计不涉及数据模型的修改。所有数据结构保持不变:

```typescript
// 现有数据模型保持不变
interface Project {
  id: string
  name: string
}

interface Graph {
  id: string
  name: string
}

interface ImportStats {
  duplicateNodesCount: number
  duplicateEdgesCount: number
  importedNodesCount: number
  importedEdgesCount: number
  totalNodesInFile: number
  totalEdgesInFile: number
}

// 状态管理保持不变
const [projects, setProjects] = useState<Project[]>([])
const [graphs, setGraphs] = useState<Graph[]>([])
const [selectedProject, setSelectedProject] = useState<string>('')
const [selectedGraph, setSelectedGraph] = useState<string>('')
const [selectedFile, setSelectedFile] = useState<File | null>(null)
const [fileType, setFileType] = useState<'excel' | 'csv' | 'json' | null>(null)
const [uploading, setUploading] = useState(false)
const [uploadStatus, setUploadStatus] = useState<string>('')
const [showNewProjectModal, setShowNewProjectModal] = useState(false)
const [showNewGraphModal, setShowNewGraphModal] = useState(false)
const [showConfirmModal, setShowConfirmModal] = useState(false)
const [showLoadingModal, setShowLoadingModal] = useState(false)
const [newProjectName, setNewProjectName] = useState('')
const [newGraphName, setNewGraphName] = useState('')
const [creating, setCreating] = useState(false)
const [abortController, setAbortController] = useState<AbortController | null>(null)
const [importStats, setImportStats] = useState<ImportStats | null>(null)
```

**数据流保持不变**:
1. 用户交互 → 事件处理函数
2. 状态更新 → React重新渲染
3. API调用 → 数据获取/提交
4. 数据验证 → 错误处理

## 正确性属性

*属性是一个特征或行为,应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于需求文档的验收标准分析,本次重新设计主要涉及视觉呈现,大部分验收标准无法通过自动化测试验证。以下是可测试的正确性属性:

### 属性 1: 颜色配置完整性

*对于任何* 导入页面实例,MorandiColors对象应该包含所有必需的颜色属性(skyBlue, darkGreen, sageGreen, mintGreen, paleGreen, warmGray, softWhite, charcoal, successGreen, warningAmber, errorRose, skyBlueHover, darkGreenHover, sageGreenHover),并且InkWashEffects对象应该包含所有必需的视觉效果属性(pageGradient, cardGradient, navGradient, modalGradient, softShadow, cardShadow, modalShadow, smallRadius, mediumRadius, largeRadius, pillRadius, modalOverlay, loadingOverlay, backdropBlur)

**验证: 需求 1.3, 1.4**

### 属性 2: 功能完整性保持

*对于任何* 用户操作序列(选择项目、选择图谱、选择文件、创建项目、创建图谱、上传文件、取消上传),重新设计后的导入页面应该产生与重新设计前完全相同的功能结果(API调用、状态更新、导航行为、数据验证)

**验证: 需求 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

### 属性 3: 样式常量一致性

*对于任何* UI组件,使用的圆角半径值应该来自InkWashEffects对象(smallRadius, mediumRadius, largeRadius, pillRadius),并且使用的阴影效果应该来自InkWashEffects对象(softShadow, cardShadow, modalShadow),确保与创建页面的视觉一致性

**验证: 需求 10.4, 10.5**

### 示例测试场景

以下是需要通过示例测试验证的交互行为:

1. **按钮悬停效果**: 当用户悬停在任何按钮上时,按钮应该显示悬停状态的颜色变化
   - **验证: 需求 3.4, 5.3**

2. **文件卡片选中状态**: 当文件被选中时,对应的文件类型卡片应该显示选中状态的边框颜色
   - **验证: 需求 4.3**

3. **文件卡片悬停效果**: 当用户悬停在文件类型卡片上时,卡片应该显示悬停状态的边框颜色
   - **验证: 需求 4.4**

4. **输入框聚焦高亮**: 当模态框中的输入框获得焦点时,应该显示莫兰蒂绿色的边框高亮
   - **验证: 需求 6.7**

5. **加载动画存在性**: 加载模态框应该包含旋转动画的CSS定义
   - **验证: 需求 8.3**


## 错误处理

本次重新设计不修改任何错误处理逻辑。所有现有的错误处理机制保持不变:

### 现有错误处理保持不变

1. **API错误处理**
   ```typescript
   // 保持不变
   try {
     const response = await fetch('/api/projects')
     if (response.ok) {
       const data = await response.json()
       setProjects(data.projects)
     }
   } catch (error) {
     console.error('Failed to fetch projects:', error)
     setProjects([])
   }
   ```

2. **文件验证错误**
   ```typescript
   // 保持不变
   if (!file) return
   const fileName = file.name.toLowerCase()
   if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && 
       !fileName.endsWith('.csv') && !fileName.endsWith('.json')) {
     setFileType(null)
     setUploadStatus('不支持的文件格式')
   }
   ```

3. **上传错误处理**
   ```typescript
   // 保持不变
   try {
     const response = await fetch('/api/import', {
       method: 'POST',
       body: formData,
       signal: controller.signal
     })
     
     if (response.ok) {
       // 成功处理
     } else {
       const result = await response.json()
       let errorMessage = '导入失败：'
       if (result.errors && Array.isArray(result.errors)) {
         errorMessage += '\n' + result.errors.join('\n')
       }
       setUploadStatus(errorMessage)
     }
   } catch (error: any) {
     if (error.name === 'AbortError') {
       setUploadStatus('已取消生成')
     } else {
       setUploadStatus('导入失败，请重试')
     }
   }
   ```

4. **用户输入验证**
   ```typescript
   // 保持不变
   if (!newProjectName.trim()) {
     alert('请输入项目名称')
     return
   }
   
   if (!selectedFile || !selectedProject || !selectedGraph) {
     setUploadStatus('请选择项目、图谱和文件')
     return
   }
   ```

### 错误消息显示样式更新

唯一的变化是错误消息的视觉呈现,使用莫兰蒂色系:

```typescript
// 错误消息样式更新
<div style={{
  background: MorandiColors.errorRose,      // 柔和玫瑰色背景
  color: MorandiColors.charcoal,            // 炭灰色文字(确保可读性)
  borderRadius: InkWashEffects.smallRadius,
  boxShadow: InkWashEffects.softShadow
}}>
  {errorMessage}
</div>
```

**错误处理原则**:
- 所有错误检测逻辑保持不变
- 所有错误恢复机制保持不变
- 仅更新错误消息的视觉呈现
- 确保错误消息的可读性(使用深色文字)


## 测试策略

### 双重测试方法

本次重新设计需要采用单元测试和属性测试相结合的方法:

1. **单元测试**: 验证特定的UI交互示例和边缘情况
2. **属性测试**: 验证功能保持不变的通用属性

两者互补,共同确保全面覆盖:
- 单元测试捕获具体的视觉交互bug
- 属性测试验证功能完整性保持

### 单元测试策略

单元测试专注于以下方面:

#### 1. 颜色配置结构测试

```typescript
describe('Morandi Color Configuration', () => {
  it('should have all required color properties', () => {
    expect(MorandiColors).toHaveProperty('skyBlue')
    expect(MorandiColors).toHaveProperty('darkGreen')
    expect(MorandiColors).toHaveProperty('sageGreen')
    // ... 验证所有颜色属性
  })
  
  it('should have all required visual effect properties', () => {
    expect(InkWashEffects).toHaveProperty('pageGradient')
    expect(InkWashEffects).toHaveProperty('cardGradient')
    expect(InkWashEffects).toHaveProperty('softShadow')
    // ... 验证所有视觉效果属性
  })
})
```

#### 2. UI交互行为测试

```typescript
describe('Button Hover Interactions', () => {
  it('should change background color on hover', () => {
    const button = screen.getByText('+ 新建')
    fireEvent.mouseEnter(button)
    expect(button).toHaveStyle({ background: MorandiColors.sageGreenHover })
    fireEvent.mouseLeave(button)
    expect(button).toHaveStyle({ background: MorandiColors.sageGreen })
  })
})

describe('File Card Selection', () => {
  it('should show selected border when file is selected', () => {
    const card = screen.getByText('Excel')
    fireEvent.click(card)
    expect(card).toHaveStyle({ 
      border: `2px solid ${MorandiColors.sageGreen}` 
    })
  })
})

describe('Input Focus Highlight', () => {
  it('should show green border on focus', () => {
    const input = screen.getByPlaceholderText('请输入项目名称')
    fireEvent.focus(input)
    expect(input).toHaveStyle({ 
      borderColor: MorandiColors.sageGreen 
    })
  })
})

describe('Loading Animation', () => {
  it('should have spin animation defined', () => {
    render(<ImportPage />)
    const styles = document.querySelector('style')
    expect(styles?.textContent).toContain('@keyframes spin')
  })
})
```

#### 3. 样式常量一致性测试

```typescript
describe('Style Constant Consistency', () => {
  it('should use InkWashEffects radius constants', () => {
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      const borderRadius = window.getComputedStyle(button).borderRadius
      expect([
        InkWashEffects.smallRadius,
        InkWashEffects.mediumRadius,
        InkWashEffects.largeRadius,
        InkWashEffects.pillRadius
      ]).toContain(borderRadius)
    })
  })
  
  it('should use InkWashEffects shadow constants', () => {
    const cards = screen.getAllByTestId('card')
    cards.forEach(card => {
      const boxShadow = window.getComputedStyle(card).boxShadow
      expect([
        InkWashEffects.softShadow,
        InkWashEffects.cardShadow,
        InkWashEffects.modalShadow
      ]).toContain(boxShadow)
    })
  })
})
```

### 属性测试策略

属性测试验证功能完整性保持不变,使用属性测试库(如fast-check for TypeScript):

#### 配置要求

- **测试库**: fast-check (TypeScript/JavaScript的属性测试库)
- **最小迭代次数**: 100次(由于随机化)
- **标签格式**: `Feature: import-page-morandi-color-redesign, Property {number}: {property_text}`

#### 属性测试实现

```typescript
import fc from 'fast-check'

describe('Property Tests: Functional Preservation', () => {
  /**
   * Feature: import-page-morandi-color-redesign, Property 2: 
   * For any user action sequence, the redesigned import page should 
   * produce exactly the same functional results as before redesign
   */
  it('should preserve all functional behavior after color redesign', () => {
    fc.assert(
      fc.property(
        fc.record({
          projectName: fc.string({ minLength: 1, maxLength: 50 }),
          graphName: fc.string({ minLength: 1, maxLength: 50 }),
          fileType: fc.constantFrom('excel', 'csv', 'json'),
          action: fc.constantFrom(
            'selectProject', 
            'selectGraph', 
            'selectFile', 
            'createProject', 
            'createGraph', 
            'uploadFile'
          )
        }),
        async (testCase) => {
          // 执行操作并验证功能结果保持不变
          const result = await executeAction(testCase)
          expect(result.apiCalls).toMatchSnapshot()
          expect(result.stateUpdates).toMatchSnapshot()
          expect(result.navigationBehavior).toMatchSnapshot()
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### 测试覆盖目标

1. **颜色配置**: 100%覆盖所有颜色和视觉效果常量
2. **UI交互**: 覆盖所有悬停、聚焦、选中状态
3. **功能保持**: 通过属性测试验证所有用户操作序列
4. **样式一致性**: 验证所有组件使用统一的样式常量

### 测试执行顺序

1. 首先运行单元测试,验证基本的颜色配置和UI交互
2. 然后运行属性测试,验证功能完整性保持
3. 最后进行手动视觉回归测试,确认视觉效果符合设计

### 视觉回归测试

虽然大部分视觉要求无法自动化测试,但应该进行手动视觉回归测试:

1. **对比检查**: 将重新设计后的页面与创建页面并排对比
2. **颜色验证**: 使用浏览器开发工具验证实际应用的颜色值
3. **交互测试**: 手动测试所有悬停、聚焦、选中状态
4. **响应式测试**: 在不同屏幕尺寸下验证视觉效果
5. **浏览器兼容性**: 在主流浏览器中验证视觉一致性

## 实施注意事项

### 1. 代码修改范围

**仅修改**:
- 内联样式对象中的颜色值
- 渐变背景定义
- 阴影效果定义
- 圆角半径值

**不修改**:
- 任何事件处理函数
- 任何状态管理逻辑
- 任何API调用
- 任何数据验证逻辑
- 任何组件结构
- 任何业务逻辑

### 2. 实施步骤

1. **定义颜色配置**: 在文件顶部添加MorandiColors和InkWashEffects对象
2. **更新页面背景**: 修改main容器的background属性
3. **更新导航栏**: 修改nav的样式属性
4. **更新选择器**: 修改项目和图谱选择器的样式
5. **更新文件卡片**: 修改文件类型卡片的样式
6. **更新按钮**: 修改所有按钮的样式
7. **更新模态框**: 修改所有模态框的样式
8. **更新状态消息**: 修改状态提示的样式
9. **验证功能**: 运行所有测试确保功能不变

### 3. 与创建页面的一致性检查

实施过程中应该持续对比创建页面,确保:
- 使用相同的颜色值
- 使用相同的渐变定义
- 使用相同的阴影效果
- 使用相同的圆角半径
- 使用相同的悬停效果

### 4. 性能考虑

- 颜色配置对象在组件外部定义,避免每次渲染重新创建
- 内联样式保持不变,不影响渲染性能
- 不引入额外的CSS文件或样式计算

### 5. 可维护性

- 所有颜色值集中在MorandiColors对象中
- 所有视觉效果集中在InkWashEffects对象中
- 未来调整颜色只需修改配置对象
- 保持代码结构清晰,便于理解和维护

## 总结

本设计文档详细说明了导入页面莫兰蒂色彩重新设计的完整方案:

1. **颜色系统**: 定义了完整的莫兰蒂色系调色板,包含主要强调色、莫兰蒂绿色系列、中性色调和状态色
2. **视觉效果**: 定义了统一的渐变、阴影、圆角和透明度效果
3. **组件应用**: 详细说明了每个UI组件的颜色应用方案
4. **功能保护**: 确保所有现有功能逻辑保持完全不变
5. **测试策略**: 提供了单元测试和属性测试的完整方案
6. **实施指导**: 提供了清晰的实施步骤和注意事项

设计方案确保导入页面与创建页面保持视觉一致性,同时不影响任何现有功能,为用户提供统一、舒适的视觉体验。
