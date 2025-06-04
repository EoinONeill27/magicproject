// This file will run before each test
require('@testing-library/jest-dom');

// Mock environment variables
process.env.VITE_APP_API_URL = 'http://localhost:5000/api';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children }) => children,
  Navigate: ({ to }) => `Redirect to ${to}`,
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ path, element }) => element,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 