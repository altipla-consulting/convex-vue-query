import { createApp } from 'vue'
import App from './App.vue'
import { convexVue } from 'convex-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ConvexVueQuery } from '..'

const app = createApp(App)

app.use(convexVue, { url: import.meta.env.VITE_CONVEX_URL })
app.use(VueQueryPlugin)
app.use(ConvexVueQuery)

app.mount('main')
