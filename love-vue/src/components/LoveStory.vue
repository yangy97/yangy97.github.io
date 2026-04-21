<script setup>
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import rawStory from '../assets/story-flow-body.html?raw'
import { parseStoryPages } from '../utils/parseStoryHtml'
import '../../../lovewjl/css/all.min.css'

const props = defineProps({
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['storyUpdate'])

/** 与 App 底栏显隐联动 */
const showChrome = inject('showChrome', computed(() => true))

const base = import.meta.env.BASE_URL

const slides = computed(() => parseStoryPages(rawStory, base))

const current = ref(0)
const direction = ref('down')

const total = computed(() => slides.value.length)

const currentSlide = computed(() => slides.value[current.value] || { html: '', pageClass: '' })

function go(delta) {
  const n = total.value
  if (n === 0) return
  const next = current.value + delta
  if (next < 0 || next >= n) return
  direction.value = delta > 0 ? 'down' : 'up'
  current.value = next
}

/** 与按下键 / PageDown / 空格 相同：下一页（供右下角像素爱心等调用） */
function goNext() {
  go(1)
}

/** 跳到指定页（与格子点击对应） */
function goToPage(index) {
  const n = total.value
  if (n === 0) return
  const t = Math.max(0, Math.min(index, n - 1))
  if (t === current.value) return
  direction.value = t > current.value ? 'down' : 'up'
  current.value = t
}

defineExpose({
  goNext,
  goToPage,
})

watch(
  [current, total],
  () => {
    emit('storyUpdate', { page: current.value, total: total.value })
  },
  { immediate: true },
)

function onKeydown(e) {
  if (!props.active) return
  const k = e.key
  if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') {
    e.preventDefault()
    go(1)
  } else if (k === 'ArrowUp' || k === 'PageUp') {
    e.preventDefault()
    go(-1)
  } else if (k === 'ArrowRight') {
    e.preventDefault()
    go(1)
  } else if (k === 'ArrowLeft') {
    e.preventDefault()
    go(-1)
  }
}

let touchStartY = null
function onTouchStart(ev) {
  touchStartY = ev.changedTouches[0].clientY
}
function onTouchEnd(ev) {
  if (touchStartY == null) return
  const y = ev.changedTouches[0].clientY
  const dy = touchStartY - y
  touchStartY = null
  if (Math.abs(dy) < 40) return
  if (dy > 0) go(1)
  else go(-1)
}

const rootEl = ref(null)

watch(
  () => props.active,
  (v) => {
    if (v) {
      requestAnimationFrame(() => rootEl.value?.focus({ preventScroll: true }))
    }
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    ref="rootEl"
    class="love-story"
    tabindex="-1"
    role="region"
    aria-label="表白故事，使用方向键或滑动翻页"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <div class="flowtime love-story__flow">
      <div class="ft-section love-story__section">
        <Transition :name="direction === 'down' ? 'story-next' : 'story-prev'" mode="out-in">
          <div
            :key="current"
            :class="['love-story__page', currentSlide.pageClass]"
          >
            <div class="love-story__page-inner" v-html="currentSlide.html" />
          </div>
        </Transition>
      </div>
    </div>

    <div class="love-story__bar" :class="{ 'love-story__bar--hidden': !showChrome }">
      <div class="love-story__track" aria-hidden="true">
        <div
          class="love-story__fill"
          :style="{ width: total ? `${((current + 1) / total) * 100}%` : '0%' }"
        />
      </div>
      <p class="love-story__hint">
        第 {{ current + 1 }} / {{ total }} 页 · ↑↓ 或 ←→ · 上滑下一页
      </p>
    </div>
  </div>
</template>

<style scoped>
.love-story {
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: calc(120px + var(--safe-bottom, 0px));
  position: relative;
  outline: none;
}

.love-story__flow {
  min-height: calc(100dvh - 88px);
}

.love-story__section {
  position: relative;
  min-height: calc(100dvh - 88px);
}

.love-story__page {
  min-height: calc(100dvh - 88px);
  box-sizing: border-box;
}

.love-story__page-inner {
  width: 100%;
  min-height: inherit;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
  padding: 0 10px 8px;
  box-sizing: border-box;
}

/* 文字在上、图在下；contain 避免强行放大模糊；限制高度避免盖住文案 */
.love-story__page-inner :deep(h2),
.love-story__page-inner :deep(h3),
.love-story__page-inner :deep(p) {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}

.love-story__page-inner :deep(img) {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: min(48vh, 460px);
  object-fit: contain;
  object-position: center center;
  border-radius: 8px;
  flex-shrink: 0;
  align-self: center;
}

.love-story__page.full-img .love-story__page-inner :deep(img) {
  max-height: min(58vh, 560px);
}

.love-story__page.left-img .love-story__page-inner :deep(img),
.love-story__page.right-img .love-story__page-inner :deep(img),
.love-story__page.top-text .love-story__page-inner :deep(img) {
  max-height: min(52vh, 500px);
}

/* 翻页过渡 */
.story-next-enter-active,
.story-next-leave-active,
.story-prev-enter-active,
.story-prev-leave-active {
  transition:
    transform 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s ease;
}

.story-next-enter-from {
  opacity: 0;
  transform: translateY(28px) scale(0.98);
}
.story-next-leave-to {
  opacity: 0;
  transform: translateY(-22px) scale(0.99);
}

.story-prev-enter-from {
  opacity: 0;
  transform: translateY(-28px) scale(0.98);
}
.story-prev-leave-to {
  opacity: 0;
  transform: translateY(22px) scale(0.99);
}

.love-story__bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(88px + var(--safe-bottom, 0px));
  z-index: 95;
  padding: 0 16px;
  pointer-events: none;
  transition:
    transform 0.42s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s ease;
}

.love-story__bar--hidden {
  transform: translateY(calc(100% + 24px));
  opacity: 0;
  pointer-events: none;
}

.love-story__bar > * {
  pointer-events: auto;
}

.love-story__track {
  max-width: 520px;
  margin: 0 auto 10px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
  cursor: pointer;
}

.love-story__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ff6b9d, #c471f5);
  box-shadow: 0 0 14px rgba(255, 107, 157, 0.55);
  transition: width 0.35s ease;
}

.love-story__hint {
  margin: 0;
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}
</style>
