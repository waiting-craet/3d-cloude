# Design Document: 3D Node Interaction Optimization

## Overview

本设计文档描述了3D知识图谱节点交互优化功能的技术实现方案。该功能通过改进摄像机聚焦算法、优化动画效果和实现文本billboard效果,显著提升用户在3D空间中与节点交互的体验。

核心改进包括:
- 智能摄像机定位算法,根据节点大小计算最佳观察距离
- 自适应动画系统,根据移动距离调整动画时长
- 实时billboard文本渲染,确保标签始终面向用户
- 性能优化策略,保证大规模图谱的流畅交互

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                   KnowledgeGraph.tsx                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Camera Focus Controller                   │  │
│  │  - calculateOptimalDistance()                     │  │
│  │  - animateCameraToNode()                         │  │
│  │  - cancelCurrentAnimation()                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    GraphNodes.tsx                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Node Component                       │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │      Billboard Text Manager                 │ │  │
│  │  │  - updateTextRotation()                     │ │  │
│  │  │  - calculateLookAtVector()                  │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Three.js Rendering                      │
│  - Camera (PerspectiveCamera)                           │
│  - Scene                                                 │
│  - Renderer                                              │
└─────────────────────────────────────────────────────────┘
```

### 数据流

1. **用户点击节点** → Node组件触发onClick事件
2. **计算最佳距离** → Camera Focus Controller根据节点大小计算观察距离
3. **启动动画** → 根据移动距离选择动画时长,使用缓动函数平滑移动
4. **更新billboard** → 每帧更新文本旋转,使其面向摄像机
5. **渲染场景** → Three.js渲染更新后的场景

## Components and Interfaces

### 1. Camera Focus Controller (KnowledgeGraph.tsx)

负责管理摄像机聚焦行为和动画。

#### 接口定义

```typescript
interface CameraFocusConfig {
  targetScreenCoverage: number;  // 目标屏幕覆盖率 (0.4-0.5)
  minDistance: number;            // 最小观察距离
  maxDistance: number;            // 最大观察距离
  shortAnimationDuration: number; // 短距离动画时长(ms)
  longAnimationDuration: number;  // 长距离动画时长(ms)
  distanceThreshold: number;      // 距离阈值(单位)
}

interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
  targetTarget: THREE.Vector3;
  animationFrameId: number | null;
}
```

#### 核心方法

```typescript
// 计算最佳观察距离
function calculateOptimalDistance(
  nodeSize: number,
  camera: THREE.PerspectiveCamera,
  targetCoverage: number = 0.45
): number {
  // 使用透视投影公式计算距离
  // distance = (nodeSize * 2) / (2 * tan(fov/2) * targetCoverage)
  const fov = camera.fov * (Math.PI / 180);
  const distance = (nodeSize * 2) / (2 * Math.tan(fov / 2) * targetCoverage);
  
  // 应用距离限制
  return Math.max(
    config.minDistance,
    Math.min(config.maxDistance, distance)
  );
}

// 启动摄像机聚焦动画
function animateCameraToNode(
  node: Node,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls
): void {
  // 取消当前动画
  cancelCurrentAnimation();
  
  // 计算目标位置
  const nodePosition = new THREE.Vector3(node.x, node.y, node.z);
  const optimalDistance = calculateOptimalDistance(node.size || 1.5, camera);
  
  // 保持当前观察方向
  const currentDirection = new THREE.Vector3();
  camera.getWorldDirection(currentDirection);
  currentDirection.normalize();
  
  // 计算目标摄像机位置
  const targetCameraPosition = nodePosition.clone()
    .sub(currentDirection.multiplyScalar(optimalDistance));
  
  // 计算移动距离以确定动画时长
  const moveDistance = camera.position.distanceTo(targetCameraPosition);
  const duration = moveDistance < config.distanceThreshold
    ? config.shortAnimationDuration
    : config.longAnimationDuration;
  
  // 初始化动画状态
  animationState = {
    isAnimating: true,
    startTime: Date.now(),
    duration,
    startPosition: camera.position.clone(),
    targetPosition: targetCameraPosition,
    startTarget: controls.target.clone(),
    targetTarget: nodePosition,
    animationFrameId: null
  };
  
  // 启动动画循环
  animate();
}

// 动画循环
function animate(): void {
  if (!animationState.isAnimating) return;
  
  const elapsed = Date.now() - animationState.startTime;
  const progress = Math.min(elapsed / animationState.duration, 1);
  
  // easeInOutCubic 缓动函数
  const easeProgress = progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  
  // 更新摄像机位置
  camera.position.lerpVectors(
    animationState.startPosition,
    animationState.targetPosition,
    easeProgress
  );
  
  // 更新控制器目标
  controls.target.lerpVectors(
    animationState.startTarget,
    animationState.targetTarget,
    easeProgress
  );
  
  controls.update();
  
  // 继续动画或结束
  if (progress < 1) {
    animationState.animationFrameId = requestAnimationFrame(animate);
  } else {
    animationState.isAnimating = false;
    animationState.animationFrameId = null;
  }
}

// 取消当前动画
function cancelCurrentAnimation(): void {
  if (animationState.animationFrameId !== null) {
    cancelAnimationFrame(animationState.animationFrameId);
    animationState.animationFrameId = null;
  }
  animationState.isAnimating = false;
}
```

### 2. Billboard Text Manager (GraphNodes.tsx)

负责管理节点文本标签的billboard效果。

#### 接口定义

```typescript
interface BillboardConfig {
  updateThreshold: number;  // 摄像机位置变化阈值
  smoothFactor: number;     // 旋转平滑因子
}
```

#### 核心方法

```typescript
// 在useFrame钩子中更新文本旋转
function updateTextRotation(
  textRef: React.RefObject<THREE.Mesh>,
  camera: THREE.Camera,
  nodePosition: THREE.Vector3
): void {
  if (!textRef.current) return;
  
  // 计算从文本到摄像机的方向
  const direction = new THREE.Vector3();
  direction.subVectors(camera.position, nodePosition);
  direction.y = 0; // 保持垂直方向,避免文字倒置
  direction.normalize();
  
  // 计算目标旋转角度
  const angle = Math.atan2(direction.x, direction.z);
  
  // 平滑旋转到目标角度
  const currentRotation = textRef.current.rotation.y;
  const targetRotation = angle;
  
  // 处理角度环绕问题
  let delta = targetRotation - currentRotation;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;
  
  // 应用平滑插值
  textRef.current.rotation.y = currentRotation + delta * config.smoothFactor;
}

// 优化版本:仅在摄像机位置显著变化时更新
function shouldUpdateBillboard(
  lastCameraPosition: THREE.Vector3,
  currentCameraPosition: THREE.Vector3,
  threshold: number = 0.1
): boolean {
  return lastCameraPosition.distanceTo(currentCameraPosition) > threshold;
}
```

### 3. Node Component 更新

更新Node组件以集成billboard文本管理器。

```typescript
function Node({ node, onClick, onDrag }: NodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const lastCameraPos = useRef(new THREE.Vector3());
  const { camera } = useThree();
  
  useFrame(() => {
    // 更新billboard文本
    if (shouldUpdateBillboard(lastCameraPos.current, camera.position)) {
      updateTextRotation(
        textRef,
        camera,
        new THREE.Vector3(node.x, node.y, node.z)
      );
      lastCameraPos.current.copy(camera.position);
    }
    
    // 其他动画逻辑...
  });
  
  return (
    <group ref={groupRef} position={[node.x, node.y, node.z]}>
      {/* 球体 */}
      <mesh>{/* ... */}</mesh>
      
      {/* Billboard文本 */}
      <Text
        ref={textRef}
        position={[0, (node.size || 1.5) + 0.8, 0]}
        fontSize={0.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="bottom"
      >
        {node.name || '未命名'}
      </Text>
    </group>
  );
}
```

## Data Models

### CameraFocusConfig

```typescript
const DEFAULT_CAMERA_FOCUS_CONFIG: CameraFocusConfig = {
  targetScreenCoverage: 0.45,      // 节点占屏幕高度45%
  minDistance: 5,                   // 最小5单位
  maxDistance: 50,                  // 最大50单位
  shortAnimationDuration: 600,      // 短距离600ms
  longAnimationDuration: 1000,      // 长距离1000ms
  distanceThreshold: 20             // 20单位为阈值
};
```

### BillboardConfig

```typescript
const DEFAULT_BILLBOARD_CONFIG: BillboardConfig = {
  updateThreshold: 0.1,   // 摄像机移动0.1单位才更新
  smoothFactor: 0.15      // 平滑因子,值越小越平滑
};
```

### AnimationState

```typescript
interface AnimationState {
  isAnimating: boolean;              // 是否正在动画
  startTime: number;                 // 动画开始时间戳
  duration: number;                  // 动画持续时间
  startPosition: THREE.Vector3;      // 起始摄像机位置
  targetPosition: THREE.Vector3;     // 目标摄像机位置
  startTarget: THREE.Vector3;        // 起始控制器目标
  targetTarget: THREE.Vector3;       // 目标控制器目标
  animationFrameId: number | null;   // 动画帧ID
}
```

## Correctness Properties

*属性是一个特征或行为,应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 最佳距离计算正确性

*For any* 节点大小和摄像机FOV,计算出的观察距离应该使节点在屏幕上占据40-50%的高度(基于透视投影公式)

**Validates: Requirements 1.1**

### Property 2: 聚焦后节点居中

*For any* 节点,当摄像机聚焦完成后,控制器的target应该等于节点的位置向量(在浮点误差范围内)

**Validates: Requirements 1.2**

### Property 3: 距离随节点大小缩放

*For any* 两个大小不同的节点,较大节点的计算距离应该大于较小节点的计算距离(保持相同的屏幕覆盖率)

**Validates: Requirements 1.3, 1.4**

### Property 4: 摄像机方向保持

*For any* 节点聚焦操作,聚焦前后摄像机的观察方向向量应该保持一致(角度变化小于5度)

**Validates: Requirements 1.5**

### Property 5: 缓动函数特性

*For any* progress值在[0,1]范围内,easeInOutCubic函数应该满足:f(0)=0, f(1)=1, f(0.5)=0.5,且函数单调递增

**Validates: Requirements 2.1, 2.4**

### Property 6: 短距离动画时长

*For any* 摄像机移动距离小于20单位的聚焦操作,动画持续时间应该等于600毫秒

**Validates: Requirements 2.2**

### Property 7: 长距离动画时长

*For any* 摄像机移动距离大于等于20单位的聚焦操作,动画持续时间应该等于1000毫秒

**Validates: Requirements 2.3**

### Property 8: 动画完成位置精确性

*For any* 目标位置,当动画完成(progress=1)时,摄像机位置应该等于目标位置(误差小于0.01单位)

**Validates: Requirements 2.6**

### Property 9: Billboard文本面向摄像机

*For any* 摄像机位置和节点位置,文本的旋转应该使其正面(法向量)指向摄像机方向(角度误差小于10度)

**Validates: Requirements 3.1, 3.2**

### Property 10: Billboard保持垂直

*For any* 摄像机位置,billboard文本的局部Y轴应该与世界Y轴对齐(避免文字倒置)

**Validates: Requirements 3.3**

### Property 11: 多节点Billboard一致性

*For any* 场景中的所有节点,每个节点的文本标签都应该正确面向摄像机(满足Property 9的条件)

**Validates: Requirements 3.4**

### Property 12: Billboard旋转平滑性

*For any* 两个连续的渲染帧,文本旋转角度的变化应该小于0.5弧度(约28.6度),确保平滑过渡

**Validates: Requirements 3.5**

### Property 13: Billboard独立于节点状态

*For any* 节点状态(选中、悬停、正常),billboard旋转计算应该产生相同的结果(状态不影响朝向)

**Validates: Requirements 3.6**

### Property 14: Billboard更新优化

*For any* 摄像机位置变化小于阈值(0.1单位)的情况,billboard文本不应该触发重新计算旋转

**Validates: Requirements 4.3**

### Property 15: 最小距离限制

*For any* 节点,如果计算出的观察距离小于5单位,最终使用的距离应该被限制为5单位

**Validates: Requirements 5.3**

### Property 16: 最大距离限制

*For any* 节点,如果计算出的观察距离大于50单位,最终使用的距离应该被限制为50单位

**Validates: Requirements 5.4**



## Error Handling

### 1. 无效节点数据处理

```typescript
function validateNodeData(node: any): boolean {
  // 检查节点坐标
  if (!isFinite(node.x) || !isFinite(node.y) || !isFinite(node.z)) {
    console.error(`Invalid node coordinates: ${node.id}`, node);
    return false;
  }
  
  // 检查节点大小
  if (node.size !== undefined && (!isFinite(node.size) || node.size < 0)) {
    console.warn(`Invalid node size: ${node.id}, using default`);
    node.size = 1.5;
  }
  
  return true;
}
```

### 2. 动画错误恢复

```typescript
function safeAnimateCameraToNode(node: Node, camera: Camera, controls: OrbitControls): void {
  try {
    // 验证节点数据
    if (!validateNodeData(node)) {
      console.error('Cannot focus on invalid node');
      return;
    }
    
    // 执行动画
    animateCameraToNode(node, camera, controls);
  } catch (error) {
    console.error('Camera animation failed:', error);
    
    // 回退到默认位置
    camera.position.set(-20, 8, 25);
    controls.target.set(0, 0, 0);
    controls.update();
  }
}
```

### 3. Billboard计算错误处理

```typescript
function safeUpdateTextRotation(
  textRef: React.RefObject<THREE.Mesh>,
  camera: THREE.Camera,
  nodePosition: THREE.Vector3
): void {
  try {
    if (!textRef.current) return;
    
    // 验证位置数据
    if (!isFinite(nodePosition.x) || !isFinite(nodePosition.y) || !isFinite(nodePosition.z)) {
      console.error('Invalid node position for billboard update');
      return;
    }
    
    updateTextRotation(textRef, camera, nodePosition);
  } catch (error) {
    console.error('Billboard update failed:', error);
    // 保持当前旋转,不更新
  }
}
```

### 4. 边界情况处理

- **节点大小为0或未定义**: 使用默认值1.5
- **摄像机FOV异常**: 使用默认FOV 60度
- **距离计算结果超出范围**: 应用min/max限制
- **动画被中断**: 清理动画状态,允许新动画开始
- **NaN或Infinity坐标**: 记录错误并跳过该节点

## Testing Strategy

### 单元测试 (Unit Tests)

使用Jest和React Testing Library测试独立函数和组件:

#### 1. 距离计算函数测试

```typescript
describe('calculateOptimalDistance', () => {
  it('should calculate correct distance for standard node', () => {
    const camera = new THREE.PerspectiveCamera(60);
    const distance = calculateOptimalDistance(1.5, camera, 0.45);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(50);
  });
  
  it('should handle zero or undefined size', () => {
    const camera = new THREE.PerspectiveCamera(60);
    expect(calculateOptimalDistance(0, camera)).toBe(5); // min distance
    expect(calculateOptimalDistance(undefined, camera)).toBeGreaterThan(0);
  });
  
  it('should respect min/max distance limits', () => {
    const camera = new THREE.PerspectiveCamera(60);
    expect(calculateOptimalDistance(0.1, camera)).toBeGreaterThanOrEqual(5);
    expect(calculateOptimalDistance(100, camera)).toBeLessThanOrEqual(50);
  });
});
```

#### 2. 缓动函数测试

```typescript
describe('easeInOutCubic', () => {
  it('should return 0 at start', () => {
    expect(easeInOutCubic(0)).toBe(0);
  });
  
  it('should return 1 at end', () => {
    expect(easeInOutCubic(1)).toBe(1);
  });
  
  it('should return 0.5 at midpoint', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 2);
  });
  
  it('should be monotonically increasing', () => {
    for (let i = 0; i < 1; i += 0.1) {
      expect(easeInOutCubic(i + 0.1)).toBeGreaterThan(easeInOutCubic(i));
    }
  });
});
```

#### 3. 动画取消测试

```typescript
describe('Animation cancellation', () => {
  it('should cancel previous animation when starting new one', () => {
    const node1 = { id: 1, x: 0, y: 0, z: 0, size: 1.5 };
    const node2 = { id: 2, x: 10, y: 10, z: 10, size: 1.5 };
    
    animateCameraToNode(node1, camera, controls);
    const firstAnimationId = animationState.animationFrameId;
    
    animateCameraToNode(node2, camera, controls);
    
    expect(firstAnimationId).not.toBe(animationState.animationFrameId);
    expect(animationState.targetTarget).toEqual(new THREE.Vector3(10, 10, 10));
  });
});
```

#### 4. Billboard旋转测试

```typescript
describe('Billboard text rotation', () => {
  it('should face camera from any angle', () => {
    const textRef = { current: new THREE.Mesh() };
    const nodePos = new THREE.Vector3(0, 0, 0);
    
    // Test from different camera positions
    const positions = [
      new THREE.Vector3(10, 0, 0),
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(-10, 0, -10)
    ];
    
    positions.forEach(pos => {
      camera.position.copy(pos);
      updateTextRotation(textRef, camera, nodePos);
      
      // Verify text faces camera (within tolerance)
      const direction = new THREE.Vector3().subVectors(pos, nodePos);
      direction.y = 0;
      direction.normalize();
      
      const expectedAngle = Math.atan2(direction.x, direction.z);
      expect(textRef.current.rotation.y).toBeCloseTo(expectedAngle, 1);
    });
  });
});
```

### 属性测试 (Property-Based Tests)

使用fast-check库进行属性测试,每个测试运行100次以上:

#### 1. 距离缩放属性

```typescript
import fc from 'fast-check';

describe('Property: Distance scales with node size', () => {
  it('larger nodes should have larger distances', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.5, max: 5 }),  // size1
        fc.float({ min: 0.5, max: 5 }),  // size2
        (size1, size2) => {
          fc.pre(size1 !== size2); // Skip equal sizes
          
          const camera = new THREE.PerspectiveCamera(60);
          const dist1 = calculateOptimalDistance(size1, camera);
          const dist2 = calculateOptimalDistance(size2, camera);
          
          if (size1 > size2) {
            return dist1 > dist2;
          } else {
            return dist1 < dist2;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // **Feature: 3d-node-interaction, Property 3: Distance scales with node size**
});
```

#### 2. 动画时长选择属性

```typescript
describe('Property: Animation duration based on distance', () => {
  it('short distances use 600ms, long distances use 1000ms', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100 }),  // distance
        (distance) => {
          const duration = selectAnimationDuration(distance);
          
          if (distance < 20) {
            return duration === 600;
          } else {
            return duration === 1000;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // **Feature: 3d-node-interaction, Property 6 & 7: Animation duration selection**
});
```

#### 3. 距离限制属性

```typescript
describe('Property: Distance limits enforced', () => {
  it('calculated distance should always be within [5, 50]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.1, max: 100 }),  // node size
        fc.float({ min: 30, max: 120 }),   // camera FOV
        (size, fov) => {
          const camera = new THREE.PerspectiveCamera(fov);
          const distance = calculateOptimalDistance(size, camera);
          
          return distance >= 5 && distance <= 50;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // **Feature: 3d-node-interaction, Property 15 & 16: Distance limits**
});
```

#### 4. Billboard面向摄像机属性

```typescript
describe('Property: Billboard always faces camera', () => {
  it('text normal should point toward camera', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -50, max: 50 }),  // camera x
        fc.float({ min: 5, max: 50 }),    // camera y (above ground)
        fc.float({ min: -50, max: 50 }),  // camera z
        (camX, camY, camZ) => {
          const textRef = { current: new THREE.Mesh() };
          const nodePos = new THREE.Vector3(0, 0, 0);
          const camera = new THREE.PerspectiveCamera();
          camera.position.set(camX, camY, camZ);
          
          updateTextRotation(textRef, camera, nodePos);
          
          // Calculate expected direction
          const direction = new THREE.Vector3(camX, 0, camZ);
          direction.normalize();
          const expectedAngle = Math.atan2(direction.x, direction.z);
          
          // Allow small tolerance for floating point
          const angleDiff = Math.abs(textRef.current.rotation.y - expectedAngle);
          return angleDiff < 0.2; // ~11 degrees tolerance
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // **Feature: 3d-node-interaction, Property 9: Billboard faces camera**
});
```

#### 5. 缓动函数单调性属性

```typescript
describe('Property: Easing function is monotonic', () => {
  it('should always increase as progress increases', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 0.99 }),  // progress1
        fc.float({ min: 0.01, max: 1 }),  // progress2
        (p1, p2) => {
          fc.pre(p1 < p2); // Ensure p1 < p2
          
          const v1 = easeInOutCubic(p1);
          const v2 = easeInOutCubic(p2);
          
          return v2 > v1;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // **Feature: 3d-node-interaction, Property 5: Easing function monotonicity**
});
```

### 集成测试

测试完整的交互流程:

```typescript
describe('Integration: Node click to camera focus', () => {
  it('should complete full focus animation', async () => {
    const { result } = renderHook(() => useGraphStore());
    const node = { id: 1, x: 10, y: 5, z: 10, size: 2 };
    
    // Simulate node click
    act(() => {
      result.current.setSelectedNode(node);
    });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(animationState.isAnimating).toBe(false);
    }, { timeout: 2000 });
    
    // Verify camera is focused on node
    expect(controls.target.x).toBeCloseTo(node.x, 1);
    expect(controls.target.y).toBeCloseTo(node.y, 1);
    expect(controls.target.z).toBeCloseTo(node.z, 1);
  });
});
```

### 测试配置

- 单元测试: Jest + React Testing Library
- 属性测试: fast-check (每个属性至少100次迭代)
- 测试覆盖率目标: 80%以上
- 关键路径(距离计算、动画、billboard)覆盖率: 95%以上

### 测试执行

```bash
# 运行所有测试
npm test

# 运行属性测试
npm test -- --testNamePattern="Property"

# 运行覆盖率报告
npm test -- --coverage
```
