export default {
  testEnvironment: 'node',
  transform: {},
  // Remove the extensionsToTreatAsEsm line as it's causing conflicts
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  // Add this to handle ES modules
  transformIgnorePatterns: [
    '/node_modules/(?!(your-esm-packages)/)'
  ]
};
