# convex-vue

A seamless integration between [convex-vue](https://github.com/chris-visser/convex-vue) and [Vue Query (TanStack Query)](https://tanstack.com/query/latest) for Vue applications. This package provides a powerful and type-safe way to manage server state and real time updates with Convex while leveraging Vue Query's powerful caching and control over the query lifecycle.

## Features

- 🚀 **Type-safe**: Full TypeScript support with Convex's generated types
- 🔄 **Real-time**: Automatic real-time updates with Convex subscriptions
- 💾 **Configurable caching**: Vue Query's powerful control of query data, placeholders and stale time.
- 🔗 **Reactive**: Pass reactive references and objects to query params.

## Installation

```bash
# npm
npm install convex-vue

# pnpm
pnpm add convex-vue
```

## Quick Start

### 1. Setup the Plugin

Setup the plugin after configuring [convex-vue](https://github.com/chris-visser/convex-vue) and Vue Query.

```ts
import { createApp } from 'vue'
import { convexVue } from 'convex-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ConvexVueQuery } from 'convex-vue'

const app = createApp(App)

// Default setup for convex-vue. See their repo for more details and options.
app.use(convexVue, { url: import.meta.env.VITE_CONVEX_URL })

// Setup Vue Query.
app.use(VueQueryPlugin)

// Setup this plugin at the end.
app.use(ConvexVueQuery)

app.mount('#app')
```

### 2. Basic Query Example

We have a helper `convexQuery` to generate a query configuration object that can be used with Vue Query's `useQuery`. It has the same name and usage as the official React wrapper that Convex provides.

```vue
<template>
  <div>
    <ul>
      <li v-for="message in messages" :key="message._id">
        {{ message.text }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { convexQuery } from 'convex-vue'
import { api } from '~convex/_generated/api'

const { data: messages } = useQuery(convexQuery(api.messages.list, {}))
</script>
```

### 3. Simple Mutation Example

Use [`useConvexMutation`](https://github.com/chris-visser/convex-vue?tab=readme-ov-file#useconvexmutation) that is directly exported from `convex-vue`.

```vue
<template>
  <div>
    <input v-model="text" @keyup.enter="send" />
    <button @click="send">Send Message</button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useConvexMutation } from 'convex-vue'
import { api } from '~convex/_generated/api'

const text = ref('')
const { mutate } = useConvexMutation(api.messages.create)

async function send() {
  await mutate({ text: text.value })
  text.value = ''
}
</script>
```

### 4. Advanced Example with Placeholder Data

Expand the `convexQuery` options to further configure the query as needed. For example you can use the `placeholderData` option to provide placeholder data for the query reading a previous query from the list if present.

You can override any option like `enabled`, `refetchInterval`, etc.

```vue
<template>
  <div>
    <ul>
      <li v-for="message in messages" :key="message._id">
        {{ message.text }}
        <button @click="selected = message._id">Select</button>
      </li>
    </ul>

    <div v-if="selectedMessage" class="selected">
      {{ selectedMessage }}
      <button @click="selected = undefined">Unselect</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { convexQuery, convexQueryKey, useConvexMutation } from 'convex-vue'
import { api } from '~convex/_generated/api'
import type { Doc, Id } from '~convex/_generated/dataModel'

const { data: messages } = useQuery(convexQuery(api.messages.list, {}))

const selected = ref<Id<'messages'> | undefined>()
const client = useQueryClient()
type Message = Doc<'messages'>

const { data: selectedMessage } = useQuery({
  ...convexQuery(api.messages.get, { id: computed(() => selected.value!) }),
  placeholderData: () => {
    // Try to read a previous query if it exists to fill up the placeholder
    // data while the query is loading.
    const messages = client.getQueryData<Message[]>(convexQueryKey(api.messages.list, {}))
    return messages?.find((m) => m._id === selected.value)
  },
})
</script>
```

## API Reference

### `convexQuery(apiFunction, args)`

Creates a query configuration object that can be used with Vue Query's `useQuery`.

```ts
const { data, isLoading, error } = useQuery(convexQuery(api.messages.list, {}))
```

### `useConvexMutation(apiFunction)`

Returns a mutation object with a `mutate` method and some helpful properties.

```ts
const { mutate, isPending, error } = useConvexMutation(api.messages.create)
```

### `convexQueryKey(apiFunction, args)`

Generates a consistent query key for manual cache manipulation.

```ts
const queryKey = convexQueryKey(api.messages.list, {})
client.setQueryData(queryKey, newData)

const queryKeyWithArgs = convexQueryKey(api.messages.get, { id: '123' })
client.setQueryData(queryKeyWithArgs, newData)
```

## Real-time Updates

Convex queries automatically stay in sync with your database. When data changes on the server, your Vue components will automatically re-render with the latest data.

## Differences from using TanStack Query with `fetch`

### Stale Time

New query results are pushed from the server, so a `staleTime` of `Infinity` should be used and is enforced by `convexQuery`. Queries will be always up to date without the need to manually refetch and won't refetch when switching tabs or any other default behavior of TanStack Query.

### Subscription time

A difference from the official React+Tanstack Query library is that the subscription time is tied to the query lifecycle. When a query is unmounted, the subscription is cancelled inmediately instead of waiting for the `gcTime` to kick in. When the query is mounted again, the subscription is re-established like a normal `fetch`-based query would do.

This is nicer as it avoids uncontrolled background usage when the query is unmounted racking up unnecessary costs.

## Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
