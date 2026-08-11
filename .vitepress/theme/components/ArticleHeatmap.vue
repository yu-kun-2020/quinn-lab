<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../articles.data'
import { useArticleActivity, type DayActivity } from '../composables/useArticleActivity'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'] as const
const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
] as const

const { years, activityOn } = useArticleActivity(articles)

const selectedYear = shallowRef<number>(new Date().getFullYear())
const selectedDay = shallowRef<DayActivity | null>(null)

watch(
  years,
  (list) => {
    if (!list.length) return
    if (!list.includes(selectedYear.value)) {
      selectedYear.value = list[0]!
    }
  },
  { immediate: true },
)

const maxCount = computed(() => {
  const counts = new Map<string, number>()
  for (const article of articles) {
    if (new Date(article.updatedAt).getFullYear() !== selectedYear.value) continue
    const key = formatDate(new Date(article.updatedAt))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Math.max(0, ...counts.values())
})

const peakDay = computed(() => {
  let best: DayActivity | null = null
  const seen = new Set<string>()
  for (const article of articles) {
    if (new Date(article.updatedAt).getFullYear() !== selectedYear.value) continue
    const key = formatDate(new Date(article.updatedAt))
    if (seen.has(key)) continue
    seen.add(key)
    const day = activityOn(key)
    if (!best || day.count > best.count) best = day
  }
  return best
})

const weeks = computed(() => {
  const year = selectedYear.value
  const start = startOfWeek(new Date(year, 0, 1))
  const end = endOfWeek(new Date(year, 11, 31))
  const result: { date: Date; key: string; count: number; inYear: boolean }[][] = []
  let cursor = new Date(start)
  let week: typeof result[number] = []

  while (cursor <= end) {
    const key = formatDate(cursor)
    const inYear = cursor.getFullYear() === year
    week.push({
      date: new Date(cursor),
      key,
      count: inYear ? activityOn(key).count : 0,
      inYear,
    })
    if (week.length === 7) {
      result.push(week)
      week = []
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
})

const monthLabels = computed(() => {
  const labels: { label: string; weekIndex: number }[] = []
  let lastMonth = -1
  weeks.value.forEach((week, weekIndex) => {
    const firstInYear = week.find((d) => d.inYear)
    if (!firstInYear) return
    const month = firstInYear.date.getMonth()
    if (month !== lastMonth) {
      labels.push({ label: MONTHS[month]!, weekIndex })
      lastMonth = month
    }
  })
  return labels
})

const totalInYear = computed(
  () =>
    articles.filter((a) => new Date(a.updatedAt).getFullYear() === selectedYear.value)
      .length,
)

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 周一开始 */
function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfWeek(d: Date): Date {
  const date = startOfWeek(d)
  date.setDate(date.getDate() + 6)
  return date
}

function levelClass(count: number, inYear: boolean): string {
  if (!inYear) return 'cell is-outside'
  if (count <= 0) return 'cell level-0'
  if (maxCount.value <= 1) return 'cell level-4'
  const ratio = count / maxCount.value
  if (ratio <= 0.25) return 'cell level-1'
  if (ratio <= 0.5) return 'cell level-2'
  if (ratio <= 0.75) return 'cell level-3'
  return 'cell level-4'
}

function onSelectDay(day: { key: string; count: number; inYear: boolean }) {
  if (!day.inYear) return
  selectedDay.value = activityOn(day.key)
}

function selectYear(year: number) {
  selectedYear.value = year
  selectedDay.value = null
}
</script>

<template>
  <div class="heatmap">
    <div class="heatmap__toolbar">
      <div class="heatmap__stats">
        <span>{{ selectedYear }} 年共编辑 <strong>{{ totalInYear }}</strong> 篇</span>
        <span v-if="peakDay" class="heatmap__peak">
          最活跃：{{ peakDay.date }}（{{ peakDay.count }} 篇）
        </span>
      </div>
      <div v-if="years.length" class="heatmap__years">
        <button
          v-for="year in years"
          :key="year"
          type="button"
          class="year-btn"
          :class="{ active: year === selectedYear }"
          @click="selectYear(year)"
        >
          {{ year }}
        </button>
      </div>
    </div>

    <div class="heatmap__board">
      <div class="weekday-col" aria-hidden="true">
        <span class="weekday-spacer" />
        <span
          v-for="(label, i) in WEEKDAYS"
          :key="label"
          class="weekday"
        >
          {{ i % 2 === 0 ? label : '' }}
        </span>
      </div>

      <div class="calendar">
        <div class="month-row">
          <span
            v-for="month in monthLabels"
            :key="`${month.label}-${month.weekIndex}`"
            class="month-label"
            :style="{ gridColumn: month.weekIndex + 1 }"
          >
            {{ month.label }}
          </span>
        </div>

        <div class="weeks">
          <div v-for="(week, wi) in weeks" :key="wi" class="week">
            <button
              v-for="day in week"
              :key="day.key"
              type="button"
              :class="[
                levelClass(day.count, day.inYear),
                { selected: selectedDay?.date === day.key },
              ]"
              :title="day.inYear ? `${day.key} · ${day.count} 篇` : ''"
              :disabled="!day.inYear"
              @click="onSelectDay(day)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="heatmap__legend">
      <span>少</span>
      <i class="cell level-0" />
      <i class="cell level-1" />
      <i class="cell level-2" />
      <i class="cell level-3" />
      <i class="cell level-4" />
      <span>多</span>
    </div>

    <div v-if="selectedDay" class="heatmap__detail">
      <h3>{{ selectedDay.date }} · {{ selectedDay.count }} 篇</h3>
      <ul v-if="selectedDay.articles.length">
        <li v-for="article in selectedDay.articles" :key="article.url">
          <a :href="withBase(article.url)">{{ article.title }}</a>
          <span class="category">{{ article.category }}</span>
        </li>
      </ul>
      <p v-else class="empty">这一天没有编辑记录。</p>
    </div>
  </div>
</template>

<style scoped>
.heatmap {
  margin: 1.25rem 0 2rem;
}

.heatmap__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.heatmap__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.heatmap__peak {
  color: var(--vp-c-text-1);
}

.heatmap__years {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.year-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border-radius: 6px;
  padding: 0.2rem 0.65rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.year-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.year-btn.active {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.heatmap__board {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.weekday-col {
  display: grid;
  grid-template-rows: 1.1rem repeat(7, 12px);
  gap: 3px;
  color: var(--vp-c-text-3);
  font-size: 0.7rem;
  line-height: 12px;
}

.weekday-spacer {
  display: block;
}

.weekday {
  display: flex;
  align-items: center;
}

.calendar {
  min-width: max-content;
}

.month-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 12px;
  gap: 3px;
  height: 1.1rem;
  margin-bottom: 3px;
  color: var(--vp-c-text-3);
  font-size: 0.72rem;
}

.month-label {
  white-space: nowrap;
}

.weeks {
  display: flex;
  gap: 3px;
}

.week {
  display: grid;
  grid-template-rows: repeat(7, 12px);
  gap: 3px;
}

.cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: none;
  padding: 0;
  display: inline-block;
  box-sizing: border-box;
}

button.cell {
  cursor: pointer;
}

button.cell:disabled {
  cursor: default;
}

.cell.level-0 {
  background: var(--vp-c-bg-soft);
  box-shadow: inset 0 0 0 1px var(--vp-c-divider);
}

.cell.level-1 {
  background: color-mix(in srgb, var(--vp-c-brand-1) 28%, var(--vp-c-bg));
}

.cell.level-2 {
  background: color-mix(in srgb, var(--vp-c-brand-1) 48%, var(--vp-c-bg));
}

.cell.level-3 {
  background: color-mix(in srgb, var(--vp-c-brand-1) 72%, var(--vp-c-bg));
}

.cell.level-4 {
  background: var(--vp-c-brand-1);
}

.cell.is-outside {
  background: transparent;
  box-shadow: none;
}

.cell.selected {
  outline: 2px solid var(--vp-c-brand-2);
  outline-offset: 1px;
}

.heatmap__legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0.75rem;
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
}

.heatmap__detail {
  margin-top: 1.25rem;
  padding: 1rem 1.1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
}

.heatmap__detail h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  border: none;
  padding: 0;
}

.heatmap__detail ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.heatmap__detail li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.35rem 0;
  border-top: 1px solid var(--vp-c-divider);
}

.heatmap__detail li:first-child {
  border-top: none;
}

.category {
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.empty {
  margin: 0;
  color: var(--vp-c-text-3);
}
</style>
