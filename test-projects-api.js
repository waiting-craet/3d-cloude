// Test script to diagnose the projects API issue
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testProjectsAPI() {
  console.log('=== Testing Projects API Logic ===\n');

  try {
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connected successfully\n');

    console.log('2. Testing project query with _count...');
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        nodeCount: true,
        edgeCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            graph: true,
          },
        },
      },
    });

    console.log(`✓ Query successful! Found ${projects.length} projects\n`);
    
    if (projects.length > 0) {
      console.log('Sample project data:');
      console.log(JSON.stringify(projects[0], null, 2));
    } else {
      console.log('No projects found in database');
    }

    console.log('\n3. Testing data transformation...');
    const projectsWithGraphCount = projects.map(project => ({
      ...project,
      graphCount: project._count.graph,
      _count: undefined,
    }));
    
    console.log('✓ Transformation successful\n');
    
    if (projectsWithGraphCount.length > 0) {
      console.log('Transformed project data:');
      console.log(JSON.stringify(projectsWithGraphCount[0], null, 2));
    }

    console.log('\n=== All tests passed! ===');
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProjectsAPI();
