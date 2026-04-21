<script setup>
import { ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { defaultLetters } from '../data/letters'
import { ambientLoveLines } from '../data/lettersAmbient'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

const modules = [Autoplay, EffectFade, Pagination]

/** 页面载入即有的飘动情话：随机纵向位置与快慢错相，只生成一次避免重绘抖动 */
function buildAmbientRows() {
  return ambientLoveLines.map((text, i) => ({
    id: `ambient-${i}-${Math.random().toString(36).slice(2, 10)}`,
    text,
    top: `${6 + Math.random() * 78}%`,
    animationDuration: `${17 + Math.random() * 16}s`,
    animationDelay: `${-Math.random() * 22}s`,
  }))
}
const ambientRows = ref(buildAmbientRows())

const LS_KEY = 'love-vue-danmaku-v1'

const danmakuInput = ref('')
const flying = ref([])

function persistLine(text) {
  let list = []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) list = JSON.parse(raw)
  } catch (_) {
    list = []
  }
  list.push({ text, at: Date.now() })
  if (list.length > 100) list = list.slice(-100)
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch (_) {
    /* ignore */
  }
}

function sendDanmaku() {
  const t = danmakuInput.value.trim()
  if (!t) return
  danmakuInput.value = ''
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const top = 8 + Math.random() * 58
  const duration = 11 + Math.random() * 5
  flying.value = [...flying.value, { id, text: t, top, duration }]
  persistLine(t)
  window.setTimeout(() => {
    flying.value = flying.value.filter((x) => x.id !== id)
  }, (duration + 0.8) * 1000)
}
</script>

<template>
  <section class="letters">
    <div class="letters__ambient" aria-hidden="true">
      <div
        v-for="row in ambientRows"
        :key="row.id"
        class="letters__ambient-line"
        :style="{
          top: row.top,
          animationDuration: row.animationDuration,
          animationDelay: row.animationDelay,
        }"
      >
        {{ row.text }}
      </div>
    </div>

    <div class="letters__danmaku" aria-hidden="true">
      <div
        v-for="d in flying"
        :key="d.id"
        class="letters__danmaku-line"
        :style="{
          top: `${d.top}%`,
          animationDuration: `${d.duration}s`,
        }"
      >
        {{ d.text }}
      </div>
    </div>

    <header class="letters__header">
      <h1 class="letters__title">我爱你宝</h1>
    </header>

    <div class="letters__swiper-wrap">
      <Swiper
        class="letters__swiper"
        :modules="modules"
        effect="fade"
        :fade-effect="{ crossFade: true }"
        :loop="true"
        :speed="900"
        :autoplay="{
          delay: 5200,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }"
        :pagination="{ clickable: true, dynamicBullets: true }"
        :grab-cursor="true"
      >
        <SwiperSlide v-for="(item, i) in defaultLetters" :key="i" class="letters__slide">
          <article class="letters__card">
            <div class="letters__card-glow" aria-hidden="true" />
            <div class="letters__card-edge" aria-hidden="true" />
            <h2 class="letters__card-title">{{ item.title }}</h2>
            <p class="letters__card-body">{{ item.body }}</p>
          </article>
        </SwiperSlide>
      </Swiper>
    </div>

    <form class="letters__composer" @submit.prevent="sendDanmaku">
      <input
        v-model="danmakuInput"
        class="letters__input"
        type="text"
        maxlength="120"
        placeholder="写一句心里话，回车发送弹幕…"
        autocomplete="off"
        aria-label="弹幕内容"
      />
      <button type="submit" class="letters__send">发送</button>
    </form>
  </section>
</template>

<style scoped>
.letters {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 20px 0 calc(120px + var(--safe-bottom));
  overflow: hidden;
}

/* 默认情话：铺在底层层，不挡住信卡正文 */
.letters__ambient {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.letters__ambient-line {
  position: absolute;
  left: 0;
  max-width: 92vw;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 228, 238, 0.92);
  text-shadow:
    0 0 8px rgba(0, 0, 0, 0.75),
    0 1px 2px rgba(0, 0, 0, 0.85);
  white-space: nowrap;
  animation-name: letters-danmaku-move;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
  opacity: 0.9;
}

.letters__danmaku {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 260;
}

.letters__danmaku-line {
  position: absolute;
  left: 0;
  max-width: 92vw;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 250, 252, 0.98);
  text-shadow:
    0 0 10px rgba(0, 0, 0, 0.9),
    0 1px 3px rgba(0, 0, 0, 0.95);
  white-space: nowrap;
  animation-name: letters-danmaku-move;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  will-change: transform;
}

@keyframes letters-danmaku-move {
  0% {
    transform: translateX(100vw);
  }
  100% {
    transform: translateX(calc(-100% - 24px));
  }
}

.letters__header {
  position: relative;
  z-index: 2;
  max-width: 520px;
  margin: 0 auto 16px;
  padding: 0 16px;
  text-align: center;
}

.letters__title {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 800;
}

.letters__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}

.letters__swiper-wrap {
  position: relative;
  z-index: 2;
  max-width: 560px;
  margin: 0 auto;
  padding: 0 12px 8px;
  filter: drop-shadow(0 20px 50px rgba(196, 113, 245, 0.12));
}

.letters__swiper {
  padding-bottom: 44px !important;
  overflow: visible !important;
}

.letters__slide {
  height: auto;
  display: flex;
  align-items: stretch;
}

.letters__card {
  position: relative;
  width: 100%;
  padding: 22px 22px 24px;
  border-radius: 20px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 45%, rgba(196, 113, 245, 0.06) 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 107, 157, 0.08) inset,
    0 -24px 60px -30px rgba(196, 113, 245, 0.25) inset;
  overflow: hidden;
  min-height: 220px;
  box-sizing: border-box;
  backdrop-filter: blur(14px);
  transition:
    box-shadow 0.45s ease,
    transform 0.45s ease;
}

.letters__swiper :deep(.swiper-slide-active) .letters__card {
  box-shadow:
    0 20px 56px rgba(0, 0, 0, 0.38),
    0 0 0 1px rgba(255, 107, 157, 0.14) inset,
    0 0 48px rgba(255, 107, 157, 0.18),
    0 -28px 70px -32px rgba(196, 113, 245, 0.35) inset;
}

.letters__card-glow {
  position: absolute;
  inset: -40%;
  background: conic-gradient(
    from 200deg at 30% 20%,
    rgba(255, 107, 157, 0.14),
    transparent 28%,
    rgba(196, 113, 245, 0.12),
    transparent 55%,
    rgba(255, 107, 157, 0.08),
    transparent 80%
  );
  opacity: 0.65;
  animation: letters-card-glow-spin 22s linear infinite;
  pointer-events: none;
}

.letters__swiper :deep(.swiper-slide-active) .letters__card-glow {
  opacity: 0.9;
}

.letters__card-edge {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--accent), var(--accent-2));
  box-shadow: 0 0 16px rgba(255, 107, 157, 0.55);
}

@keyframes letters-card-glow-spin {
  to {
    transform: rotate(360deg);
  }
}

.letters__card-title {
  position: relative;
  z-index: 1;
  margin: 0 0 12px;
  font-size: 1.18rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: linear-gradient(115deg, #fff5f8 0%, #ffc8dc 35%, #e8c4ff 75%, #fff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: letters-title-shimmer 6s ease-in-out infinite;
}

.letters__swiper :deep(.swiper-slide-active) .letters__card-title {
  animation:
    letters-title-shimmer 6s ease-in-out infinite,
    letters-card-content-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.letters__swiper :deep(.swiper-slide-active) .letters__card-body {
  animation: letters-card-body-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
}

@keyframes letters-title-shimmer {
  0%,
  100% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
}

@keyframes letters-card-content-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes letters-card-body-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.letters__card-body {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 15px;
  line-height: 1.75;
  color: rgba(255, 245, 248, 0.92);
  white-space: pre-wrap;
}

.letters__composer {
  position: fixed;
  left: 16px;
  right: max(14px, env(safe-area-inset-right));
  bottom: calc(130px + var(--safe-bottom));
  z-index: 255;
  display: flex;
  gap: 10px;
  align-items: center;
  max-width: min(560px, calc(100vw - 32px));
  margin: 0 auto;
  pointer-events: auto;
}

.letters__input {
  flex: 1;
  min-width: 0;
  padding: 11px 14px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: rgba(10, 6, 12, 0.72);
  color: var(--text);
  font-size: 15px;
  outline: none;
  backdrop-filter: blur(12px);
}

.letters__input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.letters__input:focus {
  border-color: rgba(255, 107, 157, 0.55);
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.12);
}

.letters__send {
  flex-shrink: 0;
  padding: 11px 16px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(120deg, #ff6b9d, #c471f5);
  box-shadow: 0 6px 20px rgba(255, 107, 157, 0.35);
}

.letters__send:active {
  transform: scale(0.97);
}
</style>

<style>
.letters .swiper-pagination {
  bottom: 6px !important;
}

.letters .swiper-pagination-bullet {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.28);
  opacity: 1;
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease,
    background 0.35s ease;
}

.letters .swiper-pagination-bullet-active {
  width: 22px;
  border-radius: 999px;
  background: linear-gradient(120deg, #ff6b9d, #c471f5);
  box-shadow:
    0 0 14px rgba(255, 107, 157, 0.65),
    0 0 28px rgba(196, 113, 245, 0.35);
  transform: scale(1.05);
}

.letters .swiper-pagination-bullet-active-main {
  transform: scale(1.08);
}
</style>
