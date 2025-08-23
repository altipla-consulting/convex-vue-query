<template>
  <VueQueryDevtools />

  <h1>Demo</h1>

  <ul>
    <li v-for="message in messages" :key="message._id">
      {{ message.text }}
      <button @click="selected = message._id">Select</button>
    </li>
  </ul>

  <input v-model="text" @keyup.enter="send" />
  <button @click="send">Send</button>

  <div v-if="selectedMessage" class="selected">
    {{ selectedMessage }}
    <button @click="selected = undefined">Unselect</button>
  </div>
</template>

<script lang="ts" setup>
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { convexQuery, convexQueryKey, useConvexMutation } from '..'
import { api } from '~convex/_generated/api'
import { computed, ref } from 'vue'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import type { Doc, Id } from '~convex/_generated/dataModel'

const { data: messages } = useQuery(convexQuery(api.messages.list, {}))

const text = ref('')
const { mutate } = useConvexMutation(api.messages.create)

async function send() {
  await mutate({ text: text.value })
  text.value = ''
}

const selected = ref<Id<'messages'> | undefined>()
const client = useQueryClient()
type Message = Doc<'messages'>
const { data: selectedMessage } = useQuery({
  ...convexQuery(api.messages.get, { id: computed(() => selected.value!) }),
  enabled: computed(() => !!selected.value),
  placeholderData: () => {
    const messages = client.getQueryData<Message[]>(convexQueryKey(api.messages.list, {}))
    return messages?.find((m) => m._id === selected.value)
  },
})
</script>

<style type="text/css">
ul {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
}

button {
  margin-left: 10px;
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

input {
  margin: 20px 10px 20px 0;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 300px;
}

.selected {
  background: #f5f5f5;
  margin: 20px 0;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-family: monospace;
}
</style>
