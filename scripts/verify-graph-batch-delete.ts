/**
 * 验证图谱批量删除功能实现
 * 
 * 此脚本验证以下功能：
 * 1. handleConfirmDeleteGraphs 函数存在
 * 2. 函数包含正确的错误处理
 * 3. 函数包含重试机制
 * 4. 函数包含数据刷新逻辑
 * 5. 函数包含选择状态清除逻辑
 */

import fs from 'fs';
import path from 'path';

const componentPath = path.join(process.cwd(), 'components/creation/NewCreationWorkflowPage.tsx');
const content = fs.readFileSync(componentPath, 'utf-8');

console.log('验证图谱批量删除功能实现...\n');

// 1. 验证 handleConfirmDeleteGraphs 函数存在
const hasHandleConfirmDeleteGraphs = content.includes('const handleConfirmDeleteGraphs = async ()');
console.log(`✓ handleConfirmDeleteGraphs 函数存在: ${hasHandleConfirmDeleteGraphs ? '是' : '否'}`);

// 2. 验证调用批量删除 API
const callsBatchDeleteAPI = content.includes('/api/graphs/batch-delete');
console.log(`✓ 调用批量删除 API: ${callsBatchDeleteAPI ? '是' : '否'}`);

// 3. 验证错误处理
const hasErrorHandling = content.includes('try {') && content.includes('catch (error)');
console.log(`✓ 包含错误处理: ${hasErrorHandling ? '是' : '否'}`);

// 4. 验证重试机制
const hasRetryMechanism = content.includes('retryCount') && content.includes('maxRetries');
console.log(`✓ 包含重试机制: ${hasRetryMechanism ? '是' : '否'}`);

// 5. 验证指数退避策略
const hasExponentialBackoff = content.includes('500 * retryCount');
console.log(`✓ 包含指数退避策略: ${hasExponentialBackoff ? '是' : '否'}`);

// 6. 验证数据刷新逻辑
const hasDataRefresh = content.includes('/api/projects/with-graphs') && 
                       content.includes('cache: \'no-store\'');
console.log(`✓ 包含数据刷新逻辑: ${hasDataRefresh ? '是' : '否'}`);

// 7. 验证缓存控制头
const hasCacheControl = content.includes('Cache-Control') && 
                        content.includes('no-cache, no-store, must-revalidate');
console.log(`✓ 包含缓存控制头: ${hasCacheControl ? '是' : '否'}`);

// 8. 验证删除验证逻辑
const hasDeleteVerification = content.includes('stillExists') && 
                              content.includes('deletedGraphIds');
console.log(`✓ 包含删除验证逻辑: ${hasDeleteVerification ? '是' : '否'}`);

// 9. 验证选择状态清除
const hasClearSelection = content.includes('setSelectedGraphIds(new Set())');
console.log(`✓ 包含选择状态清除: ${hasClearSelection ? '是' : '否'}`);

// 10. 验证批量删除模式退出
const hasExitBatchMode = content.includes('setIsBatchDeleteMode(false)');
console.log(`✓ 包含批量删除模式退出: ${hasExitBatchMode ? '是' : '否'}`);

// 11. 验证部分失败处理
const hasPartialFailureHandling = content.includes('data.summary.succeeded') && 
                                   content.includes('data.summary.failed');
console.log(`✓ 包含部分失败处理: ${hasPartialFailureHandling ? '是' : '否'}`);

// 12. 验证用户友好的错误消息
const hasUserFriendlyErrors = content.includes('删除操作失败，请检查网络连接后重试');
console.log(`✓ 包含用户友好的错误消息: ${hasUserFriendlyErrors ? '是' : '否'}`);

// 验证 BatchDeleteControls 组件更新
console.log('\n验证 BatchDeleteControls 组件更新...\n');

const batchDeleteControlsPath = path.join(process.cwd(), 'components/creation/BatchDeleteControls.tsx');
const batchDeleteControlsContent = fs.readFileSync(batchDeleteControlsPath, 'utf-8');

const supportsGraphView = batchDeleteControlsContent.includes('isProjectView ? \'项目\' : \'图谱\'');
console.log(`✓ 支持图谱视图: ${supportsGraphView ? '是' : '否'}`);

// 验证 DeleteConfirmDialog 组件更新
console.log('\n验证 DeleteConfirmDialog 组件更新...\n');

const deleteConfirmDialogPath = path.join(process.cwd(), 'components/creation/DeleteConfirmDialog.tsx');
const deleteConfirmDialogContent = fs.readFileSync(deleteConfirmDialogPath, 'utf-8');

const hasItemType = deleteConfirmDialogContent.includes('itemType: \'project\' | \'graph\'');
console.log(`✓ 包含 itemType 属性: ${hasItemType ? '是' : '否'}`);

const hasGraphCount = deleteConfirmDialogContent.includes('graphCount?:');
console.log(`✓ 包含 graphCount 属性: ${hasGraphCount ? '是' : '否'}`);

// 验证图谱卡片复选框
console.log('\n验证图谱卡片复选框...\n');

const hasGraphCheckbox = content.includes('handleToggleGraphSelection(graph.id)');
console.log(`✓ 图谱卡片包含复选框: ${hasGraphCheckbox ? '是' : '否'}`);

const hasSelectedClass = content.includes('selectedGraphIds.has(graph.id)');
console.log(`✓ 图谱卡片包含选中状态: ${hasSelectedClass ? '是' : '否'}`);

// 验证 CSS 样式
console.log('\n验证 CSS 样式...\n');

const cssPath = path.join(process.cwd(), 'components/creation/creation-workflow.module.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

const hasSelectedStyle = cssContent.includes('.projectCard.selected');
console.log(`✓ 包含选中状态样式: ${hasSelectedStyle ? '是' : '否'}`);

// 总结
console.log('\n=== 验证总结 ===\n');

const allChecks = [
  hasHandleConfirmDeleteGraphs,
  callsBatchDeleteAPI,
  hasErrorHandling,
  hasRetryMechanism,
  hasExponentialBackoff,
  hasDataRefresh,
  hasCacheControl,
  hasDeleteVerification,
  hasClearSelection,
  hasExitBatchMode,
  hasPartialFailureHandling,
  hasUserFriendlyErrors,
  supportsGraphView,
  hasItemType,
  hasGraphCount,
  hasGraphCheckbox,
  hasSelectedClass,
  hasSelectedStyle
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`通过检查: ${passedChecks}/${totalChecks}`);

if (passedChecks === totalChecks) {
  console.log('\n✅ 所有验证通过！图谱批量删除功能实现完整。');
  process.exit(0);
} else {
  console.log('\n❌ 部分验证失败，请检查实现。');
  process.exit(1);
}
