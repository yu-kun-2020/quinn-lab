<script setup lang="ts">
const props = withDefaults(defineProps<{
  word: string
  audio?: string
  type?: 1 | 2
}>(), {
  type: 1,
})

// 有道 dictvoice 只适合单词/短词组，长句会失败
const YOUDAO_MAX_LENGTH = 20

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
  const text = props.audio ?? props.word

  if (text.length <= YOUDAO_MAX_LENGTH) {
    playWithYoudao(text)
  } else {
    speakWithBrowser(text)
  }
}
</script>

<template>
  <span class="pronounce">
    {{ word }}
    <button type="button" class="pronounce-btn" title="播放发音" @click="play">🔊</button>
  </span>
</template>

<style scoped>
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
</style>
