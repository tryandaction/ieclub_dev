module.exports = {
  extends: ['taro/react'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // 根据项目需要添加规则
    '@typescript-eslint/no-unused-vars': 'warn',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off'
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
}