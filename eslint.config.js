import config from '@altipla/eslint-config-vue-ts'

export default [
  ...config,
  {
    ignores: ['convex/_generated/**/*'],
  },
]
