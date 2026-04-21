<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { galleryPhotos } from '../data/photos'
import { HEART_PATTERN, HEART_COLS } from '../data/heartPattern'

defineProps({
  modelValue: { type: Boolean, required: true },
})

const emit = defineEmits(['update:modelValue'])

const lightbox = ref(null)

const cells = computed(() => {
  const imgs = [...galleryPhotos]
  let i = 0
  const out = []
  for (const row of HEART_PATTERN) {
    for (const ch of row) {
      if (ch === ' ') {
        out.push(null)
      } else {
        out.push(imgs[i % imgs.length])
        i += 1
      }
    }
  }
  return out
})

const cols = computed(() => HEART_COLS ?? HEART_PATTERN[0]?.length ?? 11)
const rows = computed(() => HEART_PATTERN.length)

function close() {
  emit('update:modelValue', false)
  lightbox.value = null
}

function onCellClick(src) {
  lightbox.value = src
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
      e.stopImmediatePropagation()
      lightbox.value = null
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
  <Teleport to="body">
    <Transition name="heart-grid">
      <div
        v-if="modelValue"
        class="heart-grid"
        role="dialog"
        aria-modal="true"
        aria-label="心形照片墙"
        @click.self="close"
      >
        <button type="button" class="heart-grid__close" title="关闭 (Esc)" @click="close">
          ✕
        </button>
        <p class="heart-grid__tip">点击每一块可放大 · Esc 关闭</p>

        <div
          class="heart-grid__matrix"
          :style="{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            aspectRatio: `${cols} / ${rows}`,
          }"
        >
          <div
            v-for="(src, idx) in cells"
            :key="idx"
            class="heart-grid__cell"
            :class="{ 'heart-grid__cell--empty': !src }"
          >
            <button
              v-if="src"
              type="button"
              class="heart-grid__tile"
              @click.stop="onCellClick(src)"
            >
              <img :src="src" alt="" loading="lazy" decoding="async" />
            </button>
          </div>
        </div>

        <Transition name="heart-grid-lb">
          <div
            v-if="lightbox"
            class="heart-grid__lb"
            role="presentation"
            @click.self="lightbox = null"
          >
            <button type="button" class="heart-grid__lb-x" @click="lightbox = null">关闭</button>
            <img :src="lightbox" alt="" class="heart-grid__lb-img" />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.heart-grid {
  position: fixed;
  inset: 0;
  z-index: 280;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
  /* 接近原版：整块浅粉底，心形仅由格子留白拼出 */
  background: #ffd6e8;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.heart-grid__close {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  color: #8b2252;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 2;
}

.heart-grid__tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: rgba(120, 40, 70, 0.85);
  text-align: center;
}

.heart-grid__matrix {
  display: grid;
  gap: 3px;
  width: min(96vw, 88vmin);
  max-width: 720px;
  margin: 0 auto;
  filter: drop-shadow(0 12px 32px rgba(200, 80, 120, 0.28));
}

.heart-grid__cell--empty {
  visibility: hidden;
  pointer-events: none;
}

.heart-grid__tile {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  border-radius: 5px;
  overflow: hidden;
  cursor: zoom-in;
  background: rgba(255, 255, 255, 0.5);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.heart-grid__tile:hover {
  transform: scale(1.08);
  z-index: 1;
  box-shadow: 0 8px 20px rgba(200, 60, 100, 0.35);
}

.heart-grid__tile:active {
  transform: scale(0.96);
}

.heart-grid__tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  vertical-align: middle;
}

.heart-grid__lb {
  position: fixed;
  inset: 0;
  z-index: 290;
  background: rgba(30, 10, 20, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.heart-grid__lb-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.heart-grid__lb-x {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.heart-grid-enter-active,
.heart-grid-leave-active {
  transition: opacity 0.35s ease;
}

.heart-grid-enter-from,
.heart-grid-leave-to {
  opacity: 0;
}

.heart-grid-lb-enter-active,
.heart-grid-lb-leave-active {
  transition: opacity 0.2s ease;
}

.heart-grid-lb-enter-from,
.heart-grid-lb-leave-to {
  opacity: 0;
}
</style>
