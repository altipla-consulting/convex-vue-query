import { getFunctionName, type FunctionArgs, type FunctionReference } from 'convex/server'
import { QueryClient, queryOptions } from '@tanstack/vue-query'
import { useConvexClient } from 'convex-vue'
import { convexToJson } from 'convex/values'
import { toValue, type App, type MaybeRefOrGetter, type ComputedRef, type Ref } from 'vue'
import type { ConvexClient } from 'convex/browser'

export { useConvexMutation } from 'convex-vue'

// Utility function to recursively resolve computed refs in an object
function resolveComputedRefs<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle refs and computed refs
  if (typeof obj === 'object' && 'value' in obj && typeof obj.value !== 'undefined') {
    return toValue(obj) as T
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(resolveComputedRefs) as T
  }

  // Handle plain objects
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const resolved: any = {}
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveComputedRefs(value)
    }
    return resolved as T
  }

  // Return primitive values as-is
  return obj
}

/**
 * Generates the query key for a convex query.
 *
 * @param funcRef - The function reference of the query.
 * @param queryArgs - The arguments of the query.
 * @returns The query key.
 */
export function convexQueryKey<ConvexQueryReference extends FunctionReference<'query'>, Args extends FunctionArgs<ConvexQueryReference>>(
  funcRef: ConvexQueryReference,
  queryArgs: MaybeRefOrGetter<Args> | { [K in keyof Args]: Args[K] | Ref<Args[K]> | ComputedRef<Args[K]> },
) {
  return ['convexQuery', getFunctionName(funcRef), queryArgs]
}

/**
 * Creates a Tanstack Query query options object for a convex query function.
 *
 * @param funcRef - The function reference of the query.
 * @param queryArgs - The arguments of the query.
 * @returns The query.
 */
export function convexQuery<ConvexQueryReference extends FunctionReference<'query'>, Args extends FunctionArgs<ConvexQueryReference>>(
  funcRef: ConvexQueryReference,
  queryArgs: MaybeRefOrGetter<Args> | { [K in keyof Args]: Args[K] | Ref<Args[K]> | ComputedRef<Args[K]> },
) {
  const client = useConvexClient()
  return queryOptions({
    queryKey: convexQueryKey(funcRef, queryArgs) as any,
    queryFn: () => client.query(funcRef, resolveComputedRefs(toValue(queryArgs))),
    staleTime: Infinity,
    enabled: true,
  })
}

function hashQuery(queryKey: ['convexQuery', FunctionReference<'query'>, Record<string, any>, object]): string {
  return `convexQuery|${getFunctionName(queryKey[1])}|${JSON.stringify(convexToJson(queryKey[2]))}`
}

type Subscription = {
  subscribe: () => () => void
  unsubscribe?: () => void
}

/**
 * Vue plugin to register Tanstack Query with Convex.s
 */
export const ConvexVueQuery = {
  install: (app: App) => {
    const subscriptions = new Map<string, Subscription>()

    const convex = app._context.provides['convex-vue'].clientRef.value as ConvexClient
    const queryClient = app._context.provides.VUE_QUERY_CLIENT as QueryClient

    const queryCache = queryClient.getQueryCache()
    queryCache.subscribe((event) => {
      // We're only interested in convex queries.
      if (!event.query.queryKey.length || event.query.queryKey[0] !== 'convexQuery') {
        return
      }

      const querySubscribe = () => {
        const hash = hashQuery(event.query.queryKey)
        const sub = subscriptions.get(hash)
        if (!sub) {
          throw new Error(`ConvexVueQuery: no subscription found for query ${hash}`)
        }
        if (sub.unsubscribe) {
          return
        }

        sub.unsubscribe = sub.subscribe()
      }
      const queryUnsubscribe = () => {
        const hash = hashQuery(event.query.queryKey)
        const sub = subscriptions.get(hash)
        if (sub?.unsubscribe) {
          sub.unsubscribe()
          sub.unsubscribe = undefined
        }
      }

      switch (event.type) {
        // A new query has been requested for the first time.
        case 'added': {
          const [_, func, args, _opts] = event.query.queryKey as ['convexQuery', FunctionReference<'query'>, any, object]
          const hash = hashQuery(event.query.queryKey)

          const subscribe = () => {
            return convex.onUpdate(
              func,
              args,
              (result: any) => {
                queryClient.setQueryData(event.query.queryKey, () => result)
              },
              () => {
                void queryClient.resetQueries({ queryKey: event.query.queryKey })
              },
            )
          }

          subscriptions.set(hash, { subscribe })

          break
        }

        // A query has been GC'd.
        case 'removed': {
          const hash = hashQuery(event.query.queryKey)
          subscriptions.delete(hash)

          break
        }

        // A query has been mounted in a component.
        case 'observerAdded': {
          if (event.query.isActive()) {
            querySubscribe()
          }

          break
        }

        // Enabled or disabled query should update the subscription accordingly.
        case 'observerOptionsUpdated': {
          if (event.query.isActive()) {
            querySubscribe()
          } else {
            queryUnsubscribe()
          }

          break
        }

        // A query has been unmounted.
        case 'observerRemoved': {
          if (event.query.getObserversCount() === 0) {
            queryUnsubscribe()
          }

          break
        }
      }
    })
  },
}
