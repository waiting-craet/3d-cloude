/**
 * 测试图谱同步功能
 * 
 * 运行: npx tsx scripts/test-graph-sync.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testGr