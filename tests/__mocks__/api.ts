const API_URL = 'http://localhost:5000/api';

const api = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

export default api;
export { API_URL }; 