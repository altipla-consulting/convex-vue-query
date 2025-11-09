import { test, describe, expect } from 'vitest'
import { resolveComputedRefs } from './resolve'
import { computed, ref } from 'vue'

describe('resolveComputedRefs', () => {
  test('should resolve empty objects', () => {
    expect(resolveComputedRefs({})).toEqual({})
  })

  test('should resolve plain objects', () => {
    expect(
      resolveComputedRefs({
        a: 1,
        b: 2,
      }),
    ).toEqual({
      a: 1,
      b: 2,
    })
  })

  test('should resolve refs', () => {
    expect(
      resolveComputedRefs({
        a: ref(1),
        b: ref(2),
      }),
    ).toEqual({
      a: 1,
      b: 2,
    })
  })

  test('should resolve computed refs', () => {
    expect(
      resolveComputedRefs({
        a: computed(() => 1),
        b: computed(() => 2),
      }),
    ).toEqual({
      a: 1,
      b: 2,
    })
  })

  test('should resolve nested refs', () => {
    expect(
      resolveComputedRefs({
        a: {
          b: ref(1),
        },
      }),
    ).toEqual({
      a: {
        b: 1,
      },
    })
  })

  test('should resolve undefined refs', () => {
    expect(
      resolveComputedRefs({
        a: ref(),
        b: 3,
      }),
    ).toEqual({
      b: 3,
    })
  })
})
