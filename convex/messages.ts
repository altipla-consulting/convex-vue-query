import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('messages').collect()
  },
})

export const get = query({
  args: {
    id: v.id('messages'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('messages', { text: args.text })
  },
})
