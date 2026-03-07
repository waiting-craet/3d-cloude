# Bugfix Requirements Document

## Introduction

修复首页项目卡片点击后导致404错误的问题。当前实现尝试跳转到不存在的 `/project/${projectId}` 路由，导致页面错误。正确的行为应该是在首页本页展示该项目下的知识图谱列表，而不是跳转到新页面。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN 用户点击首页的项目卡片 THEN 系统跳转到 `/project/${projectId}` 路由并显示404错误页面

1.2 WHEN 用户点击项目卡片后 THEN 系统无法展示该项目下的知识图谱列表

1.3 WHEN 用户点击项目卡片后 THEN 系统没有提供返回推荐广场的方式

### Expected Behavior (Correct)

2.1 WHEN 用户点击首页的项目卡片 THEN 系统应该在当前页面展示该项目下的知识图谱列表，而不是跳转到新路由

2.2 WHEN 用户点击项目卡片后 THEN 系统应该将"推荐广场"标题更改为"xxx项目中的知识图谱"（xxx为项目名称）

2.3 WHEN 用户点击项目卡片后 THEN 系统应该在原来显示项目卡片的位置显示该项目下的所有知识图谱卡片

2.4 WHEN 用户点击项目卡片后 THEN 系统应该显示返回按钮，允许用户返回到推荐广场视图

2.5 WHEN 用户点击知识图谱卡片 THEN 系统应该跳转到具体的图谱查看页面（现有功能）

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 用户在推荐广场视图中浏览项目卡片 THEN 系统应该继续正常显示所有项目卡片

3.2 WHEN 用户点击返回按钮 THEN 系统应该继续正常返回到推荐广场视图并显示项目卡片

3.3 WHEN 用户在其他页面使用导航功能 THEN 系统应该继续正常工作不受影响

3.4 WHEN 系统调用 `/api/projects/[id]/graphs` API THEN 系统应该继续正常返回项目下的图谱列表

3.5 WHEN 用户点击知识图谱卡片进入图谱查看页面 THEN 系统应该继续正常跳转和显示
