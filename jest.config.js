module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/project/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '^src/(.*)$': '<rootDir>/project/src/$1',
    '^project/src/(.*)$': '<rootDir>/project/src/$1',
    '^project/src/services/api$': '<rootDir>/__mocks__/api.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|tsx|js|jsx)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleDirectories: ['node_modules', '<rootDir>/project/src'],
  globals: {
    'process.env': {
      VITE_APP_API_URL: 'http://localhost:5000/api'
    }
  },
  transformIgnorePatterns: [
    '/node_modules/(?!react-router-dom|@testing-library)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  setupFiles: []
}; 