module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/integration-tests/**/*.spec.ts'],
  testPathIgnorePatterns: ['node_modules', 'src/services']
  ,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }]
  },
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  }
};

