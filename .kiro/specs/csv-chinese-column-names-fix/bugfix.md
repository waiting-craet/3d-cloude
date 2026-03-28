# Bugfix Requirements Document

## Introduction

用户在上传包含中文列名的CSV文件时，系统无法识别列名导致导入失败。当前系统只支持英文列名（source, target, from, to等），但许多中文用户习惯使用中文列名（源节点、目标节点、关系等）。此bug导致用户体验不佳，需要手动修改CSV文件的列名才能导入。

本修复将扩展列名识别逻辑，支持常见的中文列名，使系统能够自动识别并映射到对应的英文字段。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN CSV文件包含中文列名"源节点"作为source列 THEN 系统抛出错误"CSV文件必须包含source和target列"并导入失败

1.2 WHEN CSV文件包含中文列名"目标节点"作为target列 THEN 系统抛出错误"CSV文件必须包含source和target列"并导入失败

1.3 WHEN CSV文件包含中文列名"关系"作为label列 THEN 系统无法识别关系列，导致所有边的label为空字符串

1.4 WHEN CSV文件同时包含"源节点"、"目标节点"、"关系"等中文列名 THEN 系统抛出错误并显示找到的列名，但无法识别任何中文列名

### Expected Behavior (Correct)

2.1 WHEN CSV文件包含中文列名"源节点"、"起点"、"来源"作为source列 THEN 系统SHALL正确识别为source列并成功导入数据

2.2 WHEN CSV文件包含中文列名"目标节点"、"终点"、"目的地"作为target列 THEN 系统SHALL正确识别为target列并成功导入数据

2.3 WHEN CSV文件包含中文列名"关系"、"关系类型"、"边类型"、"连接类型"作为label列 THEN 系统SHALL正确识别为label列并成功导入关系数据

2.4 WHEN CSV文件同时包含"源节点"、"目标节点"、"关系"等中文列名 THEN 系统SHALL成功解析所有列并完成导入，创建正确的节点和边

2.5 WHEN CSV文件混合使用中英文列名（如"源节点"和"target"） THEN 系统SHALL正确识别所有列名并成功导入

### Unchanged Behavior (Regression Prevention)

3.1 WHEN CSV文件使用英文列名"source"、"from"、"src" THEN 系统SHALL CONTINUE TO正确识别为source列

3.2 WHEN CSV文件使用英文列名"target"、"to"、"dest"、"dst" THEN 系统SHALL CONTINUE TO正确识别为target列

3.3 WHEN CSV文件使用英文列名"label"、"relationship"、"relation"、"type" THEN 系统SHALL CONTINUE TO正确识别为label列

3.4 WHEN CSV文件缺少必需的source或target列（无论中英文） THEN 系统SHALL CONTINUE TO抛出清晰的错误信息

3.5 WHEN CSV文件包含有效的边数据（source和target都存在） THEN 系统SHALL CONTINUE TO正确创建节点集合和边集合

3.6 WHEN CSV文件的某行source或target为空 THEN 系统SHALL CONTINUE TO跳过该行

3.7 WHEN CSV文件没有label列 THEN 系统SHALL CONTINUE TO为所有边设置空字符串作为label

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CSVInput
  OUTPUT: boolean
  
  // Returns true when CSV contains Chinese column names
  RETURN (
    X.headers CONTAINS ANY OF ["源节点", "起点", "来源", "目标节点", "终点", "目的地", "关系", "关系类型", "边类型", "连接类型"]
  )
END FUNCTION
```

### Property Specification

```pascal
// Property: Fix Checking - Chinese Column Name Recognition
FOR ALL X WHERE isBugCondition(X) DO
  result ← parseCSVWithEdgeData'(X.lines, X.headers)
  ASSERT (
    result.nodes.length > 0 AND
    result.edges.length > 0 AND
    no_error_thrown(result)
  )
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking - English Column Names Still Work
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT parseCSVWithEdgeData(X.lines, X.headers) = parseCSVWithEdgeData'(X.lines, X.headers)
END FOR
```

其中：
- **F** = `parseCSVWithEdgeData` (原始函数，只支持英文列名)
- **F'** = `parseCSVWithEdgeData'` (修复后的函数，支持中英文列名)
- **C(X)** = CSV包含中文列名
- **¬C(X)** = CSV只包含英文列名或无效列名
