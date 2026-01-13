/**
 * Test script for 2D to 3D conversion
 * 
 * This script tests the coordinate conversion and batch processing
 */

import {
  convertTo3DCoordinates,
  convertNodesToCoordinates,
  calculateDistance3D,
  type Node2D,
} from '../lib/coordinate-converter'

// Test data: Create a sample workflow with 20 nodes
const testNodes: Node2D[] = [
  { id: '1', label: 'Node 1', description: 'First node', x: 100, y: 100 },
  { id: '2', label: 'Node 2', description: 'Second node', x: 200, y: 100 },
  { id: '3', label: 'Node 3', description: 'Third node', x: 300, y: 100 },
  { id: '4', label: 'Node 4', description: 'Fourth node', x: 100, y: 200 },
  { id: '5', label: 'Node 5', description: 'Fifth node', x: 200, y: 200 },
  { id: '6', label: 'Node 6', description: 'Sixth node', x: 300, y: 200 },
  { id: '7', label: 'Node 7', description: 'Seventh node', x: 100, y: 300 },
  { id: '8', label: 'Node 8', description: 'Eighth node', x: 200, y: 300 },
  { id: '9', label: 'Node 9', description: 'Ninth node', x: 300, y: 300 },
  { id: '10', label: 'Node 10', description: 'Tenth node', x: 400, y: 100 },
  { id: '11', label: 'Node 11', description: 'Eleventh node', x: 400, y: 200 },
  { id: '12', label: 'Node 12', description: 'Twelfth node', x: 400, y: 300 },
  { id: '13', label: 'Node 13', description: 'Thirteenth node', x: 500, y: 100 },
  { id: '14', label: 'Node 14', description: 'Fourteenth node', x: 500, y: 200 },
  { id: '15', label: 'Node 15', description: 'Fifteenth node', x: 500, y: 300 },
  { id: '16', label: 'Node 16', description: 'Sixteenth node', x: 600, y: 100 },
  { id: '17', label: 'Node 17', description: 'Seventeenth node', x: 600, y: 200 },
  { id: '18', label: 'Node 18', description: 'Eighteenth node', x: 600, y: 300 },
  { id: '19', label: 'Node 19', description: 'Nineteenth node', x: 700, y: 200 },
  { id: '20', label: 'Node 20', description: 'Twentieth node', x: 800, y: 200 },
]

console.log('🧪 Testing 2D to 3D Coordinate Conversion\n')
console.log('=' .repeat(60))

// Test 1: Convert nodes with enhanced algorithm
console.log('\n📊 Test 1: Converting 20 nodes with enhanced algorithm')
console.log('-'.repeat(60))

const startTime = Date.now()
const converted = convertNodesToCoordinates(testNodes, {
  heightVariation: 5,
  minNodeDistance: 2,
})
const endTime = Date.now()

console.log(`✅ Conversion completed in ${endTime - startTime}ms`)
console.log(`✅ Converted ${converted.length} nodes`)

// Test 2: Check coordinate bounds
console.log('\n📏 Test 2: Checking coordinate bounds')
console.log('-'.repeat(60))

const xCoords = converted.map(n => n.x3d)
const yCoords = converted.map(n => n.y3d)
const zCoords = converted.map(n => n.z3d)

const bounds = {
  x: { min: Math.min(...xCoords), max: Math.max(...xCoords) },
  y: { min: Math.min(...yCoords), max: Math.max(...yCoords) },
  z: { min: Math.min(...zCoords), max: Math.max(...zCoords) },
}

console.log('X bounds:', bounds.x)
console.log('Y bounds:', bounds.y)
console.log('Z bounds:', bounds.z)

const withinBounds = 
  Math.abs(bounds.x.min) <= 50 && Math.abs(bounds.x.max) <= 50 &&
  Math.abs(bounds.y.min) <= 50 && Math.abs(bounds.y.max) <= 50 &&
  Math.abs(bounds.z.min) <= 50 && Math.abs(bounds.z.max) <= 50

console.log(withinBounds ? '✅ All coordinates within bounds [-50, 50]' : '❌ Some coordinates out of bounds')

// Test 3: Check Y-axis variation
console.log('\n📈 Test 3: Checking Y-axis variation')
console.log('-'.repeat(60))

const uniqueYValues = new Set(yCoords.map(y => y.toFixed(2)))
const yStdDev = Math.sqrt(
  yCoords.reduce((sum, y) => sum + Math.pow(y - yCoords.reduce((a, b) => a + b) / yCoords.length, 2), 0) / yCoords.length
)

console.log(`Unique Y values: ${uniqueYValues.size}`)
console.log(`Y standard deviation: ${yStdDev.toFixed(2)}`)
console.log(yStdDev > 0 ? '✅ Y-axis has variation (3D depth)' : '❌ No Y-axis variation (flat)')

// Test 4: Check minimum distance
console.log('\n📐 Test 4: Checking minimum distance between nodes')
console.log('-'.repeat(60))

let minDistance = Infinity
let violationCount = 0
const minRequired = 2.0

for (let i = 0; i < converted.length; i++) {
  for (let j = i + 1; j < converted.length; j++) {
    const distance = calculateDistance3D(
      { x: converted[i].x3d, y: converted[i].y3d, z: converted[i].z3d },
      { x: converted[j].x3d, y: converted[j].y3d, z: converted[j].z3d }
    )
    
    if (distance < minDistance) {
      minDistance = distance
    }
    
    if (distance < minRequired - 0.1) { // Allow small floating point error
      violationCount++
    }
  }
}

console.log(`Minimum distance found: ${minDistance.toFixed(2)} units`)
console.log(`Required minimum: ${minRequired} units`)
console.log(`Violations: ${violationCount}`)
console.log(violationCount === 0 ? '✅ All nodes have sufficient spacing' : `❌ ${violationCount} node pairs too close`)

// Test 5: Check relative position preservation
console.log('\n🔄 Test 5: Checking relative position preservation')
console.log('-'.repeat(60))

let preservationViolations = 0

for (let i = 0; i < testNodes.length; i++) {
  for (let j = i + 1; j < testNodes.length; j++) {
    const node1 = testNodes[i]
    const node2 = testNodes[j]
    const conv1 = converted[i]
    const conv2 = converted[j]
    
    // Check horizontal (X) relative position
    if ((node2.x > node1.x && conv2.x3d <= conv1.x3d) ||
        (node2.x < node1.x && conv2.x3d >= conv1.x3d)) {
      preservationViolations++
    }
  }
}

console.log(`Relative position violations: ${preservationViolations}`)
console.log(preservationViolations === 0 ? '✅ Relative positions preserved' : `❌ ${preservationViolations} violations`)

// Test 6: Display sample coordinates
console.log('\n📋 Test 6: Sample converted coordinates')
console.log('-'.repeat(60))

console.log('\nFirst 5 nodes:')
for (let i = 0; i < Math.min(5, converted.length); i++) {
  const node = converted[i]
  console.log(`  ${testNodes[i].label}:`)
  console.log(`    2D: (${testNodes[i].x}, ${testNodes[i].y})`)
  console.log(`    3D: (${node.x3d.toFixed(2)}, ${node.y3d.toFixed(2)}, ${node.z3d.toFixed(2)})`)
}

// Summary
console.log('\n' + '='.repeat(60))
console.log('📊 Test Summary')
console.log('='.repeat(60))

const allTestsPassed = 
  withinBounds &&
  yStdDev > 0 &&
  violationCount === 0 &&
  preservationViolations === 0

if (allTestsPassed) {
  console.log('✅ All tests passed!')
  console.log('✅ Coordinate conversion is working correctly')
  console.log('✅ Nodes are well-distributed in 3D space')
  console.log('✅ Ready for production use')
} else {
  console.log('❌ Some tests failed')
  console.log('⚠️  Please review the results above')
}

console.log('\n' + '='.repeat(60))
