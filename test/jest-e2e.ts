import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['**/*.e2e-spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/src/'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  coverageReporters: ['json', 'lcov'],
  coverageDirectory: 'coverage/e2e',
  collectCoverageFrom: ['src/**'],
  coveragePathIgnorePatterns: ['.module.ts$', '.spec.ts$', 'index.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup-jest.ts'],
};

export default config;
