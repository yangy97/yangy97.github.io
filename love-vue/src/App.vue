<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, provide } from 'vue'
import TabNav from './components/TabNav.vue'
import LoveStory from './components/LoveStory.vue'
import PhotoFeed from './components/PhotoFeed.vue'
import LoveLetters from './components/LoveLetters.vue'
import HeartSurprise from './components/HeartSurprise.vue'
import HeartGridOverlay from './components/HeartGridOverlay.vue'
import PixelHeartWidget from './components/PixelHeartWidget.vue'

const base = import.meta.env.BASE_URL

const activeTab = ref('home')
const audioRef = ref(null)
const musicOn = ref(true)
const bgmSrc = `${base}music/love.mp3`
/** 小爱心（SVG）惊喜，快捷键 H */
const heartSurpriseOpen = ref(false)
/** 全屏心形照片墙，快捷键 Esc（原版效果） */
const heartGridOpen = ref(false)
const loveStoryRef = ref(null)
/** 与首页故事同步，供右下角像素爱心高亮 */
const storyPageIndex = ref(0)
const storyTotal = ref(0)

/** 触屏设备不自动隐藏底栏；鼠标设备靠近底边显示，离开延迟隐藏（类似 macOS Dock） */
const chromeAutoHide = ref(true)
const chromeVisible = ref(true)
let chromeHideTimer = null

const showChrome = computed(() => !chromeAutoHide.value || chromeVisible.value)

provide('showChrome', showChrome)

function clearChromeHideTimer() {
  if (chromeHideTimer != null) {
    clearTimeout(chromeHideTimer)
    chromeHideTimer = null
  }
}

function onChromeMouseMove(e) {
  if (!chromeAutoHide.value) return
  const h = window.innerHeight
  if (e.clientY > h - 110) {
    chromeVisible.value = true
    clearChromeHideTimer()
  } else {
    clearChromeHideTimer()
    chromeHideTimer = window.setTimeout(() => {
      chromeVisible.value = false
      chromeHideTimer = null
    }, 900)
  }
}

function onDockHitEnter() {
  if (!chromeAutoHide.value) return
  chromeVisible.value = true
  clearChromeHideTimer()
}

function toggleHeartSurprise() {
  heartSurpriseOpen.value = !heartSurpriseOpen.value
}

function toggleHeartGrid() {
  heartGridOpen.value = !heartGridOpen.value
}

let mqPointer = null

function syncChromePointer() {
  if (!mqPointer) return
  chromeAutoHide.value = !mqPointer.matches
  if (!chromeAutoHide.value) chromeVisible.value = true
}

function onGlobalKeydown(e) {
  if (e.key === 'Escape') {
    if (document.querySelector('.feed__lb')) return
    if (document.querySelector('.heart-grid__lb')) return
    e.preventDefault()
    toggleHeartGrid()
    return
  }
  if (e.key === 'h' || e.key === 'H') {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const t = e.target
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
    e.preventDefault()
    toggleHeartSurprise()
  }
}

onMounted(() => {
  mqPointer = window.matchMedia('(pointer: coarse)')
  syncChromePointer()
  mqPointer.addEventListener?.('change', syncChromePointer)

  window.addEventListener('mousemove', onChromeMouseMove)
  window.addEventListener('keydown', onGlobalKeydown)
  const el = audioRef.value
  if (!el) return
  el.volume = 0.45
  const p = el.play()
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      musicOn.value = false
    })
  }
})

onUnmounted(() => {
  mqPointer?.removeEventListener?.('change', syncChromePointer)
  window.removeEventListener('mousemove', onChromeMouseMove)
  clearChromeHideTimer()
  window.removeEventListener('keydown', onGlobalKeydown)
})

watch(musicOn, (on) => {
  const el = audioRef.value
  if (!el) return
  if (on) {
    el.play().catch(() => {})
  } else {
    el.pause()
  }
})

function toggleMusic() {
  musicOn.value = !musicOn.value
}

function onStoryUpdate({ page, total }) {
  storyPageIndex.value = page
  storyTotal.value = total
}

/** 点击格子 → 跳到对应故事页（与下键翻页同一套页码） */
function onPixelSelectPage({ pageIndex }) {
  activeTab.value = 'home'
  nextTick(() => {
    loveStoryRef.value?.goToPage(pageIndex)
  })
}
</script>

<template>
  <div class="app">
    <main class="app__main">
      <LoveStory
        ref="loveStoryRef"
        v-show="activeTab === 'home'"
        :active="activeTab === 'home'"
        @story-update="onStoryUpdate"
      />
      <PhotoFeed v-show="activeTab === 'feed'" />
      <LoveLetters v-show="activeTab === 'letters'" />
    </main>

    <TabNav v-model="activeTab" :chrome-visible="showChrome" />

    <!-- 底边感应条：导航收起后鼠标移入可唤出 -->
    <div
      v-if="chromeAutoHide"
      class="app__dock-hit"
      aria-hidden="true"
      @mouseenter="onDockHitEnter"
    />

    <audio
      id="bgmMusic"
      ref="audioRef"
      class="app__audio"
      :src="bgmSrc"
      loop
      preload="auto"
    />

    <!-- 左上角：圆形跳动爱心（原版）；右下角：♪ + 像素爱心 -->
    <button
      v-show="activeTab === 'home'"
      type="button"
      class="app__heart"
      title="小爱心惊喜 · 按 H"
      aria-label="小爱心惊喜"
      @click="toggleHeartSurprise"
    >
      <span class="app__heart-icon" aria-hidden="true">♥</span>
    </button>

    <div
      v-show="activeTab === 'home'"
      class="app__fab"
      aria-label="音乐与像素爱心"
    >
      <PixelHeartWidget
        :music-on="musicOn"
        :story-page-index="storyPageIndex"
        :story-total="storyTotal"
        @toggle-music="toggleMusic"
        @select-page="onPixelSelectPage"
      />
    </div>

    <HeartSurprise v-model="heartSurpriseOpen" />
    <HeartGridOverlay v-model="heartGridOpen" />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  width: 100%;
}

.app__main {
  min-height: 100vh;
  min-height: 100dvh;
}

.app__audio {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.app__dock-hit {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 22px;
  z-index: 115;
  pointer-events: auto;
}

.app__fab {
  position: fixed;
  right: max(14px, env(safe-area-inset-right));
  bottom: calc(88px + var(--safe-bottom));
  z-index: 300;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  pointer-events: auto;
}

.app__heart {
  position: fixed;
  left: max(14px, env(safe-area-inset-left));
  top: max(14px, env(safe-area-inset-top));
  z-index: 300;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 107, 157, 0.55);
  background: linear-gradient(145deg, rgba(255, 80, 140, 0.45), rgba(20, 10, 16, 0.88));
  color: var(--text);
  box-shadow:
    0 0 0 1px rgba(255, 180, 210, 0.2) inset,
    0 4px 18px rgba(255, 60, 120, 0.25);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.app__heart-icon {
  font-size: 20px;
  line-height: 1;
  color: #ffb3d0;
  text-shadow: 0 0 12px rgba(255, 100, 160, 0.85);
  animation: heart-wobble 2.4s ease-in-out infinite;
}

@keyframes heart-wobble {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.app__heart:hover {
  border-color: rgba(255, 180, 210, 0.75);
}

.app__heart:active {
  transform: scale(0.95);
}
</style>
