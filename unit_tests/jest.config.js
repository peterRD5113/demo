module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
      diagnostics: false,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@electron|electron))'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../desktop/src/$1',
    '^@main/(.*)$': '<rootDir>/../desktop/src/main/$1',
    '^@shared/(.*)$': '<rootDir>/../desktop/src/shared/$1',
    '^@renderer/(.*)$': '<rootDir>/../desktop/src/renderer/$1'
  }
};
