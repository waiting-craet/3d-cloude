# 实现计划

- [x] 1. 编写bug条件探索测试
  - **Property 1: Fault Condition** - 非UTF-8编码CSV文件解码失败
  - **重要**: 在实施修复之前编写此基于属性的测试
  - **目标**: 展示bug存在的反例
  - **作用域PBT方法**: 针对具体失败案例：GBK/GB2312/Big5编码的CSV文件包含中文字符
  - 测试parseCSVFile对于GBK编码的CSV文件（包含"拥有"字符）会产生乱码（来自设计中的故障条件）
  - 测试parseCSVFile对于GB2312编码的CSV文件（包含"关系"字符）会产生乱码
  - 测试parseCSVFile对于Big5编码的CSV文件（包含繁体中文"擁有"）会产生乱码
  - 在未修复的代码上运行测试
  - **预期结果**: 测试失败（这是正确的 - 证明bug存在）
  - 记录发现的反例（例如："GBK编码的CSV文件中'拥有'显示为'4???'而不是正确的中文字符"）
  - 当测试编写完成、运行并记录失败时，标记任务完成
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [x] 2. 编写保留性属性测试（在实施修复之前）
  - **Property 2: Preservation** - UTF-8和ASCII内容行为不变
  - **重要**: 遵循观察优先方法
  - 观察：在未修复代码上，UTF-8编码的CSV文件正确解析
  - 观察：在未修复代码上，仅包含ASCII字符的CSV文件正确解析
  - 观察：在未修复代码上，edge-list格式（source, label, target）正确解析
  - 观察：在未修复代码上，完整节点格式（包含x, y坐标）正确解析
  - 编写基于属性的测试：对于所有UTF-8编码或纯ASCII内容的CSV文件，解析结果应与原始行为相同（来自设计中的保留需求）
  - 在未修复的代码上验证测试通过
  - **预期结果**: 测试通过（确认要保留的基线行为）
  - 当测试编写完成、运行并在未修复代码上通过时，标记任务完成
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. 修复CSV编码问题

  - [x] 3.1 安装jschardet依赖
    - 运行`npm install jschardet`
    - 在`lib/services/graph-import.ts`中导入jschardet
    - _Requirements: 2.1_

  - [x] 3.2 实现编码检测和解码
    - 将`file.text()`改为`file.arrayBuffer()`读取原始字节数据
    - 使用jschardet检测文件编码：`const detected = jschardet.detect(uint8Array)`
    - 使用TextDecoder API解码：`const decoder = new TextDecoder(encoding); const text = decoder.decode(uint8Array)`
    - 保持后续CSV解析逻辑不变（lines分割、headers解析、格式检测）
    - _Bug_Condition: isBugCondition(input) where input.encoding != 'UTF-8' AND containsMultiByteCharacters(input.content)_
    - _Expected_Behavior: 自动检测文件编码并使用正确编码解码，中文等多字节字符正确显示（来自设计中的expectedBehavior）_
    - _Preservation: UTF-8编码CSV、ASCII内容、edge-list格式、完整节点格式、Excel/JSON导入功能保持不变（来自设计中的保留需求）_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 验证bug条件探索测试现在通过
    - **Property 1: Expected Behavior** - 非UTF-8编码CSV文件正确解码
    - **重要**: 重新运行任务1中的相同测试 - 不要编写新测试
    - 任务1中的测试编码了预期行为
    - 当此测试通过时，确认预期行为得到满足
    - 运行任务1中的bug条件探索测试
    - **预期结果**: 测试通过（确认bug已修复）
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 验证保留性测试仍然通过
    - **Property 2: Preservation** - UTF-8和ASCII内容行为不变
    - **重要**: 重新运行任务2中的相同测试 - 不要编写新测试
    - 运行任务2中的保留性属性测试
    - **预期结果**: 测试通过（确认没有回归）
    - 确认修复后所有测试仍然通过（没有回归）
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户
