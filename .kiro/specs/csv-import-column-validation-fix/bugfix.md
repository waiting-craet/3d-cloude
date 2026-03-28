# Bugfix Requirements Document

## Introduction

用户在导入CSV文件时遇到错误："CSV文件必须包含source和target列"，即使CSV文件包含了有效的列名（如Source、Target等大写形式）。问题出现在`lib/services/graph-import.ts`的`parseCSVWithEdgeData`函数中，该函数在检查source/target列时没有正确处理列名的大小写转换。

虽然代码在第345行将headers转换为小写（`headers = lines[0].split(',').map(h => h.trim().toLowerCase())`），但在第405-406行检查列名时，使用的是小写的列名数组与小写的匹配列表进行比较，这本应该工作正常。然而，实际问题可能是：
1. 列名在某些情况下没有被正确转换为小写
2. 或者存在其他边缘情况导致匹配失败

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN CSV文件的列名为大写形式（如"Source", "Target"）且headers数组未正确转换为小写时 THEN 系统抛出错误"CSV文件必须包含source和target列"

1.2 WHEN CSV文件包含有效的列名变体（如"Source", "From", "Src"等）但大小写不匹配时 THEN 系统无法识别这些列并抛出错误

1.3 WHEN 列名匹配失败时 THEN 错误消息不提供任何关于实际找到的列名的信息，用户无法诊断问题

### Expected Behavior (Correct)

2.1 WHEN CSV文件的列名为任意大小写形式（如"Source", "SOURCE", "source"）时 THEN 系统SHALL正确识别source列并成功解析

2.2 WHEN CSV文件包含有效的列名变体（如"Source", "From", "Src", "TARGET", "To"等）时 THEN 系统SHALL正确识别这些列并成功解析

2.3 WHEN 列名匹配失败时 THEN 系统SHALL在错误消息中显示实际找到的列名，帮助用户诊断问题（例如："CSV文件必须包含source和target列。找到的列：Name, Description, Type"）

### Unchanged Behavior (Regression Prevention)

3.1 WHEN CSV文件使用标准小写列名（source, target）时 THEN 系统SHALL CONTINUE TO正确解析文件

3.2 WHEN CSV文件使用支持的列名别名（from, to, src, dst, dest）时 THEN 系统SHALL CONTINUE TO正确识别这些列

3.3 WHEN CSV文件包含label/relationship列时 THEN 系统SHALL CONTINUE TO正确解析该列

3.4 WHEN CSV文件包含完整的节点数据（包含x, y坐标）时 THEN 系统SHALL CONTINUE TO使用parseCSVWithNodeData函数而不是parseCSVWithEdgeData函数

3.5 WHEN CSV文件格式完全正确时 THEN 系统SHALL CONTINUE TO返回正确的ParsedGraphData结构
