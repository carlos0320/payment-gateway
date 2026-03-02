module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['vue', 'js', 'json'],
  testMatch: ['**/*.spec.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/main.js',
    '!src/store/index.js',
  ],
  coverageDirectory: 'coverage',
}
