module.exports = {
  parser: '@babel/eslint-parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit',
    '@electron-toolkit/eslint-config-prettier'
  ],
  plugins: ['react'],
  rules: {
    'prettier/prettier': 'off',
    "react/prop-types": "off",
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "no-unused-vars": ["error", { "varsIgnorePattern": "^React$" }]
  }
}
