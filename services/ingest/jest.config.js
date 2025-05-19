module.exports = {
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  transform: {
    "^.+\\.tsx?$": "babel-jest"
  },

  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],

  testEnvironment: "node"
};
