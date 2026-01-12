# 相机固定调试指南

## 🔍 如何测试

### 步骤 1: 强制刷新浏览器
```
按 Ctrl + F5 (Windows)
或 Cmd + Shift + R (Mac)
```

### 步骤 2: 打开浏览器控制台
```
按 F12
点击 "Console" 标签
```

### 步骤 3: 测试长按拖动
```
1. 将鼠标移到节点上
2. 按住鼠标不放
3. 等待 0.5 秒
4. 移动鼠标
```

### 步骤 4: 查看控制台输出
你应该看到：
```
OrbitControls enabled: false  // 拖拽开始
OrbitControls enabled: true   // 拖拽结束
```

## ✅ 预期行为

### 拖拽开始时
- 控制台显示: `OrbitControls enabled: false`
- 光标变为"抓取中" ✊
- **相机应该完全不动**

### 拖拽过程中
- 节点跟随鼠标
- 相机保持静止
- 背景不旋转

### 拖拽结束时
- 控制台显示: `OrbitControls enabled: true`
- 光标恢复
- 相机控制恢复

## 🐛 如果还是不工作

### 检查 1: 控制台是否有日志？
**如果没有日志**:
- 说明 `isDragging` 状态没有改变
- 检查是否等待了足够长的时间（> 0.3 秒）

**如果有日志但相机还在动**:
- 可能是 OrbitControls ref 没有正确连接
- 尝试完全重启开发服务器

### 检查 2: 光标是否变化？
**如果光标变为"抓取中"**:
- 说明进入了拖拽模式
- 但 OrbitControls 可能没有禁用

**如果光标没变**:
- 说明没有进入拖拽模式
- 需要按住更长时间

### 检查 3: 重启开发服务器
```powershell
# 停止当前服务器 (Ctrl+C)
# 清除缓存
Remove-Item -Recurse -Force .next

# 重新启动
npm run dev
```

## 📊 调试信息

### 在浏览器控制台中运行
```javascript
// 检查 store 状态
console.log('isDragging:', window.useGraphStore?.getState?.()?.isDragging)

// 手动测试禁用相机
// (在 Three.js 场景中)
```

## 🔧 手动测试

### 测试 A: 快速点击
```
1. 快速点击节点
2. 观察相机是否移动到节点
3. 检查是否弹出详情面板
```
**预期**: 相机移动，面板显示

### 测试 B: 长按拖动
```
1. 按住节点 1 秒
2. 移动鼠标
3. 观察相机是否静止
```
**预期**: 相机完全不动

### 测试 C: 拖动后旋转
```
1. 拖动节点
2. 松开鼠标
3. 立即在空白处拖动
4. 观察相机是否旋转
```
**预期**: 相机立即响应

## 💡 关键点

### 时间要求
- **长按时间**: 必须 > 300ms
- **建议**: 按住 0.5-1 秒再移动

### 视觉反馈
- **光标**: 必须变为"抓取中" ✊
- **控制台**: 必须显示 `enabled: false`

### 相机状态
- **拖拽时**: `enabled = false`
- **正常时**: `enabled = true`

## 🎯 完整测试流程

```
1. 刷新浏览器 (Ctrl+F5)
   ↓
2. 打开控制台 (F12)
   ↓
3. 将鼠标移到节点上
   ↓
4. 按住鼠标不放
   ↓
5. 数 "1, 2, 3" (约 0.5 秒)
   ↓
6. 查看控制台: "OrbitControls enabled: false"
   ↓
7. 移动鼠标
   ↓
8. 观察: 相机应该完全不动
   ↓
9. 松开鼠标
   ↓
10. 查看控制台: "OrbitControls enabled: true"
```

## 📝 报告问题

如果还是不工作，请提供：
1. 控制台的完整输出
2. 光标是否变为"抓取中"
3. 是否看到 "OrbitControls enabled" 日志
4. 浏览器类型和版本

## 🚀 应该工作的原因

代码逻辑：
```typescript
// 1. 长按 300ms 后
setIsDragging(true)

// 2. KnowledgeGraph 监听到变化
useEffect(() => {
  controlsRef.current.enabled = !isDragging  // false
}, [isDragging])

// 3. OrbitControls 被禁用
// 4. 相机不再响应鼠标操作
```

这个逻辑是正确的，应该能工作！
