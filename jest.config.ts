import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  // Sibling git worktrees live under .worktrees and carry their own branch's tests
  testPathIgnorePatterns: ['/node_modules/', '/\\.worktrees/'],
  // The OpenNext build leaves a standalone copy of package.json under .next,
  // which haste reads as a second "careersume" module.
  modulePathIgnorePatterns: ['<rootDir>/\\.next/', '<rootDir>/\\.open-next/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
      },
    }],
  },
}

export default config
