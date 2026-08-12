<script setup lang="ts">
const props = withDefaults(defineProps<{
  word: string
  audio?: string
  type?: 1 | 2
}>(), {
  type: 1,
})

function play() {
  const text = props.audio ?? props.word
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${props.type}`
  new Audio(url).play()
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
