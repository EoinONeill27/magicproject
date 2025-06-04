// Mock API service
const api = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  baseURL: 'http://localhost:5000/api'
};

export default api; 