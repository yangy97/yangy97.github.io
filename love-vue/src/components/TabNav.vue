<script setup>
defineProps({
  modelValue: { type: String, required: true },
  /** 为 false 时收起到底部（配合 App 边缘唤出） */
  chromeVisible: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const tabs = [
  { id: 'home', label: '首页' },
  { id: 'feed', label: '动态' },
  { id: 'letters', label: '想说的话' },
]

function select(id) {
  emit('update:modelValue', id)
}
</script>

<template>
  <div class="tab-nav-wrap" :class="{ 'tab-nav-wrap--hidden': !chromeVisible }">
    <nav class="tab-nav" aria-label="主导航">
      <div class="tab-nav__inner">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="tab-nav__btn"
          :class="{ 'tab-nav__btn--active': modelValue === t.id }"
          :aria-current="modelValue === t.id ? 'page' : undefined"
          @click="select(t.id)"
        >
          <span class="tab-nav__glow" aria-hidden="true" />
          <span class="tab-nav__label">{{ t.label }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.tab-nav-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  padding: 0;
  pointer-events: none;
  transition:
    transform 0.42s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s ease;
}

.tab-nav-wrap--hidden {
  transform: translateY(calc(100% + 20px));
  opacity: 0;
  pointer-events: none;
}

/* 底部渐变，避免浅色背景图时导航看不清 */
.tab-nav-wrap::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.12) 55%, transparent 100%);
  pointer-events: none;
}

.tab-nav {
  position: relative;
  padding: 20px 14px calc(14px + var(--safe-bottom));
}

.tab-nav__inner {
  pointer-events: auto;
  max-width: min(100%, 520px);
  margin: 0 auto;
  display: flex;
  gap: 6px;
  padding: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.tab-nav__btn {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  border: none;
  border-radius: 999px;
  padding: 11px 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.45);
  background: transparent;
  cursor: pointer;
  transition:
    color 0.25s ease,
    transform 0.2s ease;
}

.tab-nav__btn--active {
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.tab-nav__glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  background: linear-gradient(120deg, #ff6b9d, #c471f5);
  box-shadow: 0 4px 18px rgba(255, 107, 157, 0.45);
  transition: opacity 0.28s ease;
  z-index: 0;
}

.tab-nav__btn--active .tab-nav__glow {
  opacity: 1;
}

.tab-nav__label {
  position: relative;
  z-index: 1;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-nav__btn:active {
  transform: scale(0.97);
}
</style>
