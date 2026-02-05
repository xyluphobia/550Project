module.exports = {
  testEnvironment: 'jsdom',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  moduleFileExtensions: ['js', 'jsx'],

  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx)'
  ],

  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  }
};

