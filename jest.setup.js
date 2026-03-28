// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock fetch API for tests
global.fetch = jest.fn((url, options) => {
  // Mock GET /api/projects - return empty array
  if (url === '/api/projects' && (!options || options.method === 'GET')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  }

  // Mock POST /api/projects - return created project
  if (url === '/api/projects' && options?.method === 'POST') {
    const body = JSON.parse(options.body);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-project-id',
        name: body.projectName,
        description: body.graphName,
        createdAt: new Date().toISOString(),
        graphs: [],
      }),
    });
  }

  // Default response
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
  });
});
