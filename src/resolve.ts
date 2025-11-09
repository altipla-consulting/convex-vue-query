import { isRef, toValue } from 'vue'

// Utility function to recursively resolve computed refs in an object
export function resolveComputedRefs<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle refs and computed refs
  if (isRef(obj)) {
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
