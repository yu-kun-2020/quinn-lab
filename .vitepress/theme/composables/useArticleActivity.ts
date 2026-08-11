import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { ArticleMeta } from '../articles.data'

export interface DayActivity {
  date: string
  count: number
  articles: ArticleMeta[]
}

function toDateKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useArticleActivity(articles: MaybeRefOrGetter<ArticleMeta[]>) {
  const byDate = computed(() => {
    const map = new Map<string, ArticleMeta[]>()
    for (const article of toValue(articles)) {
      const key = toDateKey(article.updatedAt)
      const list = map.get(key)
      if (list) list.push(article)
      else map.set(key, [article])
    }
    return map
  })

  const days = computed<DayActivity[]>(() =>
    [...byDate.value.entries()]
      .map(([date, list]) => ({
        date,
        count: list.length,
        articles: list,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
  )

  const years = computed(() => {
    const set = new Set<number>()
    for (const article of toValue(articles)) {
      set.add(new Date(article.updatedAt).getFullYear())
    }
    return [...set].sort((a, b) => b - a)
  })

  const peakDay = computed(() =>
    days.value.reduce<DayActivity | null>((best, day) => {
      if (!best || day.count > best.count) return day
      return best
    }, null),
  )

  function activityOn(date: string): DayActivity {
    const articlesOnDay = byDate.value.get(date) ?? []
    return { date, count: articlesOnDay.length, articles: articlesOnDay }
  }

  return { byDate, days, years, peakDay, activityOn, toDateKey }
}
