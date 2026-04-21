<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="heart-surprise">
      <div
        v-if="modelValue"
        class="heart-surprise"
        role="dialog"
        aria-modal="true"
        aria-label="惊喜"
        @click.self="close"
      >
        <div class="heart-surprise__inner">
          <svg
            class="heart-surprise__svg"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff8fb8" />
                <stop offset="50%" stop-color="#ff4d8d" />
                <stop offset="100%" stop-color="#e91e8c" />
              </linearGradient>
            </defs>
            <path
              class="heart-surprise__path"
              fill="url(#heartGrad)"
              d="M50 88 C20 58 8 42 8 28 C8 14 18 6 32 6 C42 6 48 12 50 16 C52 12 58 6 68 6 C82 6 92 14 92 28 C92 42 80 58 50 88 Z"
            />
          </svg>
          <p class="heart-surprise__caption">给你一颗小心心</p>
          <p class="heart-surprise__tip">再按 H 或点空白处关闭</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.heart-surprise {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 5, 12, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.heart-surprise__inner {
  text-align: center;
  padding: 24px;
}

.heart-surprise__svg {
  width: min(52vw, 220px);
  height: auto;
  filter: drop-shadow(0 12px 40px rgba(255, 80, 140, 0.55));
  animation: heart-beat 1.1s ease-in-out infinite;
}

.heart-surprise__path {
  transform-origin: 50px 50px;
}

@keyframes heart-beat {
  0%,
  100% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.12);
  }
  30% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.08);
  }
}

.heart-surprise__caption {
  margin: 18px 0 6px;
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.heart-surprise__tip {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
}

.heart-surprise-enter-active,
.heart-surprise-leave-active {
  transition: opacity 0.35s ease;
}

.heart-surprise-enter-active .heart-surprise__inner,
.heart-surprise-leave-active .heart-surprise__inner {
  transition:
    transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.35s ease;
}

.heart-surprise-enter-from,
.heart-surprise-leave-to {
  opacity: 0;
}

.heart-surprise-enter-from .heart-surprise__inner,
.heart-surprise-leave-to .heart-surprise__inner {
  transform: scale(0.4);
  opacity: 0;
}
</style>
