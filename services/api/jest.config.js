module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsconfig: 'tsconfig.json' } },
  moduleFileExtensions: ['ts','js','json'],
  testMatch: ['**/test/**/*.test.ts']
};