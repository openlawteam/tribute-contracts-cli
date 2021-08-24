const configs = {
  transform: {
    "^.+\\.(js)$": "babel-jest",
  },
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node",
  roots: ["./test"],
  coverageProvider: "v8",
};

module.exports = configs;
