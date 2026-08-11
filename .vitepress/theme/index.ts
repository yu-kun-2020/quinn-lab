import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ArticleHeatmap from './components/ArticleHeatmap.vue'
import ArticleTimeline from './components/ArticleTimeline.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ArticleHeatmap', ArticleHeatmap)
    app.component('ArticleTimeline', ArticleTimeline)
  },
} satisfies Theme
