import { registerApiRoute } from '@mastra/core/server'

export const testRoutes = [
  registerApiRoute('/hello', {
    method: 'GET',
    requiresAuth: false,
    handler: async (c) => {
      return c.json({ message: 'Hello World!' })
    },
  }),
]
