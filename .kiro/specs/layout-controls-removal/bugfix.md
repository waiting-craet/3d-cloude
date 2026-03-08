# Bugfix Requirements Document

## Introduction

在3D知识图谱页面中，左上角显示了一个"Layout Controls"控制面板，该面板包含布局策略选择器、Re-layout按钮和质量指标显示等功能。这个控制面板影响了用户体验，需要将其从界面中移除，使3D知识图谱页面更加简洁。

受影响的文件：
- components/KnowledgeGraph.tsx (第461-598行包含Layout Controls面板的完整实现)

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN 用户访问3D知识图谱页面(app/graph/page.tsx) THEN 系统在左上角显示"Layout Controls"控制面板

1.2 WHEN "Layout Controls"面板显示时 THEN 系统显示布局策略选择器(Auto, Force Directed, Hierarchical, Radial, Grid, Spherical)

1.3 WHEN "Layout Controls"面板显示时 THEN 系统显示Re-layout按钮和质量指标(Quality Score, overlaps, space utilization)

1.4 WHEN "Layout Controls"面板显示时 THEN 系统提供可折叠/展开的面板交互功能

### Expected Behavior (Correct)

2.1 WHEN 用户访问3D知识图谱页面(app/graph/page.tsx) THEN 系统SHALL NOT显示"Layout Controls"控制面板

2.2 WHEN 3D知识图谱页面渲染时 THEN 系统SHALL呈现简洁的界面，不包含布局控制相关的UI元素

2.3 WHEN 用户与3D知识图谱交互时 THEN 系统SHALL NOT提供布局策略选择和Re-layout功能的UI入口

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 用户访问3D知识图谱页面 THEN 系统SHALL CONTINUE TO正常渲染3D图谱的节点和边

3.2 WHEN 用户与3D图谱交互(旋转、缩放、平移) THEN 系统SHALL CONTINUE TO正常响应用户的交互操作

3.3 WHEN 3D图谱加载数据 THEN 系统SHALL CONTINUE TO使用现有的布局算法正确布局节点

3.4 WHEN 用户点击节点 THEN 系统SHALL CONTINUE TO正常显示节点详情和相关功能

3.5 WHEN 页面包含其他控制元素(如相机控制、节点详情面板等) THEN 系统SHALL CONTINUE TO正常显示和工作
