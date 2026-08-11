<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { withBase } from 'vitepress'
import { data as articles, type ArticleMeta } from '../articles.data'

interface DayGroup {
  date: string
  year: number
  month: number
  day: number
  articles: ArticleMeta[]
}

interface YearBlock {
  year: number
  days: DayGroup[]
  articleCount: number
}

/** 初次展示的「天」数量；之后每次再加载一批 */
const DAYS_PAGE = 12
/** 同一天默认展开的文章数，避免单日刷屏 */
const DAY_PREVIEW = 6

const visibleDayCount = shallowRef(DAYS_PAGE)
const expandedDays = shallowRef(new Set<string>())

const dayGroups = computed<DayGroup[]>(() => {
  // 每篇文章只按其「最新一次更新」归入一天，不会重复出现
  const map = new Map<string, ArticleMeta[]>()
  for (const article of articles) {
    const d = new Date(article.updatedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const list = map.get(key)
    if (list) list.push(article)
    else map.set(key, [article])
  }

  return [...map.entries()]
    .map(([date, list]) => {
      const [y, m, day] = date.split('-').map(Number) as [number, number, number]
      return {
        date,
        year: y,
        month: m,
        day,
        articles: [...list].sort((a, b) => b.updatedAt - a.updatedAt),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
})

const visibleDays = computed(() => dayGroups.value.slice(0, visibleDayCount.value))

const yearBlocks = computed<YearBlock[]>(() => {
  const blocks: YearBlock[] = []
  for (const group of visibleDays.value) {
    const last = blocks[blocks.length - 1]
    if (!last || last.year !== group.year) {
      blocks.push({
        year: group.year,
        days: [group],
        articleCount: group.articles.length,
      })
    } else {
      last.days.push(group)
      last.articleCount += group.articles.length
    }
  }
  return blocks
})

const hasMoreDays = computed(() => visibleDayCount.value < dayGroups.value.length)
const remainingDays = computed(() =>
  Math.max(0, dayGroups.value.length - visibleDayCount.value),
)

const totalArticles = computed(() => articles.length)
const totalDays = computed(() => dayGroups.value.length)

function loadMore() {
  visibleDayCount.value = Math.min(
    visibleDayCount.value + DAYS_PAGE,
    dayGroups.value.length,
  )
}

function isDayExpanded(date: string): boolean {
  return expandedDays.value.has(date)
}

function toggleDay(date: string) {
  const next = new Set(expandedDays.value)
  if (next.has(date)) next.delete(date)
  else next.add(date)
  expandedDays.value = next
}

function visibleArticles(group: DayGroup): ArticleMeta[] {
  if (isDayExpanded(group.date) || group.articles.length <= DAY_PREVIEW) {
    return group.articles
  }
  return group.articles.slice(0, DAY_PREVIEW)
}

function hiddenCount(group: DayGroup): number {
  return Math.max(0, group.articles.length - DAY_PREVIEW)
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="timeline">
    <div v-if="totalDays" class="timeline__summary">
      <span>共 {{ totalArticles }} 篇 · {{ totalDays }} 个更新日期</span>
      <span class="hint">每篇文章只按最近一次编辑出现一次</span>
    </div>

    <p v-if="!totalDays" class="timeline__empty">暂无文章更新记录。</p>

    <section
      v-for="block in yearBlocks"
      :key="block.year"
      class="year"
    >
      <header class="year__head">
        <span class="year__badge">{{ block.year }}</span>
        <span class="year__meta">{{ block.articleCount }} 篇</span>
      </header>

      <div class="year__track">
        <article
          v-for="group in block.days"
          :key="group.date"
          class="day"
        >
          <div class="day__axis">
            <time class="day__stamp" :datetime="group.date">
              <span class="day__month">{{ group.month }}月</span>
              <span class="day__num">{{ group.day }}</span>
            </time>
            <span class="day__node" aria-hidden="true" />
          </div>

          <div class="day__body">
            <div class="day__caption">
              <span class="day__count">{{ group.articles.length }} 篇更新</span>
            </div>

            <ul class="day__list">
              <li
                v-for="article in visibleArticles(group)"
                :key="article.url"
                class="day__item"
              >
                <a class="day__title" :href="withBase(article.url)">
                  {{ article.title }}
                </a>
                <div class="day__meta">
                  <span class="day__category">{{ article.category }}</span>
                  <span class="day__time">{{ formatTime(article.updatedAt) }}</span>
                </div>
              </li>
            </ul>

            <button
              v-if="hiddenCount(group) > 0"
              type="button"
              class="more-btn"
              @click="toggleDay(group.date)"
            >
              {{
                isDayExpanded(group.date)
                  ? '收起'
                  : `展开其余 ${hiddenCount(group)} 篇`
              }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <div v-if="hasMoreDays" class="timeline__pager">
      <button type="button" class="pager-btn" @click="loadMore">
        加载更早的 {{ Math.min(DAYS_PAGE, remainingDays) }} 天
        <span class="pager-rest">（还剩 {{ remainingDays }} 天）</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  margin: 1rem 0 2.5rem;
}

.timeline__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1rem;
  margin-bottom: 1.35rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.hint {
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
}

.timeline__empty {
  color: var(--vp-c-text-3);
}

.year + .year {
  margin-top: 1.25rem;
}

.year__head {
  position: sticky;
  top: calc(var(--vp-nav-height, 64px) + 6px);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
  padding: 0.4rem 0;
  background: color-mix(in srgb, var(--vp-c-bg) 90%, transparent);
  backdrop-filter: blur(8px);
}

.year__badge {
  display: inline-flex;
  align-items: center;
  min-width: 3.5rem;
  justify-content: center;
  padding: 0.18rem 0.7rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, var(--vp-c-bg));
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent);
}

.year__meta {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.year__track {
  position: relative;
  margin-left: 3.35rem;
}

.year__track::before {
  content: '';
  position: absolute;
  top: 0.35rem;
  bottom: 0.6rem;
  left: -1.42rem;
  width: 2px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--vp-c-brand-1) 55%, var(--vp-c-divider)),
    var(--vp-c-divider) 40%,
    color-mix(in srgb, var(--vp-c-divider) 40%, transparent)
  );
  border-radius: 1px;
}

.day {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  padding-bottom: 1.15rem;
}

.day:last-child {
  padding-bottom: 0.25rem;
}

.day__axis {
  position: absolute;
  left: -3.35rem;
  top: 0;
  width: 3.35rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-right: 1.15rem;
}

.day__stamp {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.15;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.day__month {
  font-size: 0.68rem;
  color: var(--vp-c-text-3);
  letter-spacing: 0.02em;
}

.day__num {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.day__node {
  position: absolute;
  right: -0.22rem;
  top: 0.95rem;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-brand-1);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--vp-c-brand-1) 16%, transparent),
    0 0 0 1px var(--vp-c-bg);
  z-index: 1;
}

.day__body {
  min-width: 0;
  padding-top: 0.15rem;
}

.day__caption {
  margin-bottom: 0.45rem;
}

.day__count {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.day__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.day__item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 1rem;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
}

.day__item:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 45%, var(--vp-c-divider));
  transform: translateX(2px);
}

.day__title {
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
  line-height: 1.4;
}

.day__title:hover {
  color: var(--vp-c-brand-1);
}

.day__meta {
  display: flex;
  gap: 0.65rem;
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
  flex-shrink: 0;
}

.day__category {
  text-transform: capitalize;
}

.more-btn,
.pager-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.more-btn {
  margin-top: 0.5rem;
  padding: 0.25rem 0.7rem;
  font-size: 0.8rem;
}

.more-btn:hover,
.pager-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 8%, var(--vp-c-bg));
}

.timeline__pager {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 0.25rem;
}

.pager-btn {
  padding: 0.55rem 1.1rem;
  font-size: 0.9rem;
}

.pager-rest {
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .year__track {
    margin-left: 2.85rem;
  }

  .year__track::before {
    left: -1.2rem;
  }

  .day__axis {
    left: -2.85rem;
    width: 2.85rem;
    padding-right: 0.95rem;
  }

  .day__node {
    right: -0.18rem;
  }

  .day__num {
    font-size: 1.05rem;
  }

  .day__item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
