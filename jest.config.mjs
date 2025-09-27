import presets from 'jest-preset-angular/presets/index.js';

const isCi = process.env.CI !== undefined;

// @see https://thymikee.github.io/jest-preset-angular/docs/getting-started/presets
let presetConfig = presets.createCjsPreset({});

process.env.TZ = 'UTC';

const config = {
  ...presetConfig,
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/src/setup.jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  roots: ['<rootDir>'],
  maxWorkers: isCi ? 2 : '50%',
  modulePaths: ['./'],
  moduleNameMapper: {
    tslib: 'tslib/tslib.es6.js',
  },
  transformIgnorePatterns: ['node_modules/?!(.*\\.mjs$)'],
  modulePathIgnorePatterns: ['<rootDir>/.*?/__mocks__'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coverageDirectory: 'reports/',
  coverageReporters: ['lcov', 'text-summary'],
  coveragePathIgnorePatterns: ['node_modules', '__mocks__'],
  reporters: ['default', ['jest-junit', { outputDirectory: 'reports', outputName: 'junit.xml' }]],
};

export default config;
