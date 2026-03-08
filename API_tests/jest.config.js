module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../desktop/src/$1',
    '^@main/(.*)$': '<rootDir>/../desktop/src/main/$1',
    '^@shared/(.*)$': '<rootDir>/../desktop/src/shared/$1',
    '^@renderer/(.*)$': '<rootDir>/../desktop/src/renderer/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false
    }
  }
};
