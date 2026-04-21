<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { EffectCoverflow, Autoplay, Pagination, Navigation } from 'swiper/modules'
import { galleryPhotos } from '../data/photos'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const modules = [EffectCoverflow, Autoplay, Pagination, Navigation]

const lightbox = ref(null)

function open(src) {
  lightbox.value = src
}

function close() {
  lightbox.value = null
}

let escOff = null
watch(lightbox, (v) => {
  if (escOff) {
    escOff()
    escOff = null
  }
  if (!v) return
  const h = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  }
  window.addEventListener('keydown', h, true)
  escOff = () => window.removeEventListener('keydown', h, true)
})

onUnmounted(() => {
  if (escOff) escOff()
})
</script>

<template>
  <section class="feed">
    <header class="feed__header">
      <h1 class="feed__title">我们的瞬间</h1>
      <p class="feed__desc">3D 轮播 · 左右滑动 · 点击放大</p>
    </header>

    <div class="feed__stage">
      <div class="feed__glow" aria-hidden="true" />
      <Swiper
        class="feed__swiper"
        :modules="modules"
        effect="coverflow"
        :grab-cursor="true"
        :centered-slides="true"
        :slides-per-view="'auto'"
        :coverflow-effect="{
          rotate: 0,
          stretch: 0,
          depth: 120,
          modifier: 1.2,
          slideShadows: true,
        }"
        :loop="true"
        :speed="600"
        :autoplay="{
          delay: 2800,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }"
        :pagination="{ clickable: true, dynamicBullets: true }"
        :navigation="true"
      >
        <SwiperSlide
          v-for="(src, i) in galleryPhotos"
          :key="src + i"
          class="feed__slide"
        >
          <button type="button" class="feed__card" @click="open(src)">
            <span class="feed__shine" aria-hidden="true" />
            <img :src="src" alt="" loading="lazy" decoding="async" />
          </button>
        </SwiperSlide>
      </Swiper>
    </div>

    <Teleport to="body">
      <Transition name="feed-fade">
        <div
          v-if="lightbox"
          class="feed__lb"
          role="dialog"
          aria-modal="true"
          @click.self="close"
        >
          <button type="button" class="feed__lb-close" @click="close">关闭</button>
          <img :src="lightbox" alt="" class="feed__lb-img" />
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.feed {
  min-height: 100vh;
  padding: 20px 0 calc(120px + var(--safe-bottom));
  position: relative;
  overflow: hidden;
}

.feed__header {
  max-width: 520px;
  margin: 0 auto 20px;
  padding: 0 16px;
  text-align: center;
}

.feed__title {
  margin: 0 0 8px;
  font-size: 1.55rem;
  font-weight: 800;
  background: linear-gradient(90deg, #fff, #ffb8e0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: title-float 4s ease-in-out infinite;
}

@keyframes title-float {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.08);
  }
}

.feed__desc {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}

.feed__stage {
  position: relative;
  padding: 20px 0 48px;
}

.feed__glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120%;
  height: 60%;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse at center, rgba(255, 107, 157, 0.35), transparent 65%);
  pointer-events: none;
  z-index: 0;
}

.feed__swiper {
  position: relative;
  z-index: 1;
  padding-bottom: 40px !important;
}

.feed__slide {
  width: 72%;
  max-width: 320px;
}

.feed__card {
  position: relative;
  width: 100%;
  padding: 0;
  border: none;
  border-radius: 14px;
  overflow: hidden;
  cursor: zoom-in;
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  transform: translateZ(0);
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease;
}

.feed__card:hover {
  transform: scale(1.02) translateZ(0);
  box-shadow:
    0 16px 48px rgba(255, 107, 157, 0.25),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.feed__card img {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: middle;
}

.feed__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    125deg,
    transparent 35%,
    rgba(255, 255, 255, 0.12) 50%,
    transparent 65%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.feed__card:hover .feed__shine {
  opacity: 1;
}

.feed__lb {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(10, 5, 8, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.feed__lb-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6);
}

.feed__lb-close {
  position: absolute;
  top: 16px;
  right: 16px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  color: var(--text);
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
}

.feed-fade-enter-active,
.feed-fade-leave-active {
  transition: opacity 0.2s ease;
}

.feed-fade-enter-from,
.feed-fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* Swiper 导航/分页在 scoped 外需全局样式微调 */
.feed .swiper-pagination-bullet-active {
  background: linear-gradient(120deg, #ff6b9d, #c471f5);
  opacity: 1;
}

.feed .swiper-button-next,
.feed .swiper-button-prev {
  color: rgba(255, 255, 255, 0.85);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.35));
}

.feed .swiper-button-next::after,
.feed .swiper-button-prev::after {
  font-size: 1.25rem;
}
</style>
