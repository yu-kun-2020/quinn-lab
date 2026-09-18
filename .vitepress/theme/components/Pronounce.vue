<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const props = withDefaults(defineProps<{
  word: string
  audio?: string
  type?: 1 | 2
}>(), {
  type: 1,
})

// 有道 dictvoice 只适合单词/短词组，长句会失败
const YOUDAO_MAX_LENGTH = 20

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionResultEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const listening = ref(false)
const score = ref<number | null>(null)
const heard = ref('')
const feedback = ref('')

let recognition: SpeechRecognitionLike | null = null

const scoreClass = computed(() => {
  if (score.value === null) return ''
  if (score.value >= 85) return 'is-great'
  if (score.value >= 60) return 'is-ok'
  return 'is-low'
})

const targetText = computed(() => props.audio ?? props.word)

function speakWithBrowser(text: string) {
  if (!('speechSynthesis' in window)) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = props.type === 2 ? 'en-US' : 'en-GB'

  const voices = speechSynthesis.getVoices()
  const voice = voices.find(v => v.lang.startsWith(utterance.lang))
  if (voice) utterance.voice = voice

  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}

function playWithYoudao(text: string) {
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${props.type}`
  const audio = new Audio(url)
  audio.addEventListener('error', () => speakWithBrowser(text))
  audio.play().catch(() => speakWithBrowser(text))
}

function play() {
  const text = targetText.value

  if (text.length <= YOUDAO_MAX_LENGTH) {
    playWithYoudao(text)
  } else {
    speakWithBrowser(text)
  }
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string) {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0))

  for (let i = 0; i < rows; i++) matrix[i][0] = i
  for (let j = 0; j < cols; j++) matrix[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

function calcScore(expected: string, actual: string) {
  const left = normalize(expected)
  const right = normalize(actual)
  if (!left || !right) return 0
  if (left === right) return 100

  const distance = levenshtein(left, right)
  const maxLen = Math.max(left.length, right.length)
  const charScore = Math.round((1 - distance / maxLen) * 100)

  const leftWords = left.split(' ')
  const rightWords = new Set(right.split(' '))
  const matched = leftWords.filter(w => rightWords.has(w)).length
  const wordScore = Math.round((matched / leftWords.length) * 100)

  // 单词更看重字符相似度，句子兼顾词命中
  return leftWords.length <= 2
    ? Math.max(0, Math.min(100, charScore))
    : Math.max(0, Math.min(100, Math.round(charScore * 0.55 + wordScore * 0.45)))
}

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function stopListening() {
  recognition?.stop()
  listening.value = false
}

function startPractice() {
  const Recognition = getRecognitionCtor()
  if (!Recognition) {
    feedback.value = '当前浏览器不支持语音识别，请改用 Chrome / Edge'
    return
  }

  if (listening.value) {
    stopListening()
    return
  }

  score.value = null
  heard.value = ''
  feedback.value = '请朗读…'

  recognition = new Recognition()
  recognition.lang = props.type === 2 ? 'en-US' : 'en-GB'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim() ?? ''
    heard.value = transcript
    score.value = calcScore(targetText.value, transcript)
    feedback.value = transcript
      ? `识别为：${transcript}`
      : '没有听清，请再试一次'
  }

  recognition.onerror = (event) => {
    listening.value = false
    if (event.error === 'not-allowed') {
      feedback.value = '请允许麦克风权限后再试'
    } else if (event.error === 'no-speech') {
      feedback.value = '没有检测到声音，请再试一次'
    } else {
      feedback.value = '识别失败，请再试一次'
    }
  }

  recognition.onend = () => {
    listening.value = false
  }

  try {
    recognition.start()
    listening.value = true
  } catch {
    listening.value = false
    feedback.value = '无法启动麦克风，请稍后再试'
  }
}

onBeforeUnmount(() => {
  recognition?.abort()
})
</script>

<template>
  <span class="pronounce">
    <span class="pronounce-text">{{ word }}</span>
    <button type="button" class="pronounce-btn" title="播放发音" @click="play">🔊</button>
    <button
      type="button"
      class="pronounce-btn"
      :class="{ 'is-listening': listening }"
      :title="listening ? '停止录音' : '录音打分'"
      @click="startPractice"
    >
      {{ listening ? '⏹' : '🎤' }}
    </button>
    <span v-if="score !== null" class="pronounce-score" :class="scoreClass" :title="feedback">
      {{ score }}分
    </span>
    <span v-else-if="feedback" class="pronounce-tip" :title="feedback">{{ feedback }}</span>
  </span>
</template>

<style scoped>
.pronounce {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 4px;
  max-width: 100%;
}

.pronounce-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  font-size: inherit;
  line-height: inherit;
  vertical-align: baseline;
}

.pronounce-btn:hover {
  opacity: 0.7;
}

.pronounce-btn.is-listening {
  opacity: 1;
  animation: pronounce-pulse 1s ease-in-out infinite;
}

.pronounce-score,
.pronounce-tip {
  margin-left: 4px;
  font-size: 0.85em;
  line-height: inherit;
}

.pronounce-score.is-great {
  color: #16a34a;
}

.pronounce-score.is-ok {
  color: #ca8a04;
}

.pronounce-score.is-low {
  color: #dc2626;
}

.pronounce-tip {
  color: var(--vp-c-text-2);
}

@keyframes pronounce-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}
</style>
