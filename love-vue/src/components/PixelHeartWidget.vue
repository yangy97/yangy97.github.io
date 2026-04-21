<script setup>
import { computed } from 'vue'
import {
  pageToCellIndex,
  cellIndexToPage,
  PIXEL_FILLED_COUNT,
} from '../utils/pixelStoryLink'
import { PIXEL_WIDGET_PATTERN, PIXEL_WIDGET_COLS } from '../data/pixelHeartWidgetPattern'

const props = defineProps({
  musicOn: { type: Boolean, default: true },
  /** 当前故事页 0..total-1，与首页 LoveStory 同步 */
  storyPageIndex: { type: Number, default: 0 },
  /** 故事总页数 */
  storyTotal: { type: Number, default: 0 },
})

const emit = defineEmits(['toggle-music', 'select-page'])

const cols = PIXEL_WIDGET_COLS
const filledCount = PIXEL_FILLED_COUNT

const cells = computed(() => {
  let idx = 0
  const out = []
  for (const row of PIXEL_WIDGET_PATTERN) {
    for (const ch of row) {
      if (ch === ' ') {
        out.push(null)
      } else {
        out.push({ cellIndex: idx })
        idx += 1
      }
    }
  }
  return out
})

const activeCellIndex = computed(() =>
  pageToCellIndex(
    Math.min(Math.max(0, props.storyPageIndex), Math.max(0, props.storyTotal - 1)),
    Math.max(1, props.storyTotal),
    filledCount,
  ),
)

function onCell(cell) {
  if (!cell) return
  const page = cellIndexToPage(
    cell.cellIndex,
    Math.max(1, props.storyTotal),
    filledCount,
  )
  emit('select-page', { pageIndex: page })
}
</script>

<template>
  <div class="pixel-widget">
    <button
      type="button"
      class="pixel-widget__note"
      :title="musicOn ? '点击暂停' : '点击播放'"
      :aria-label="musicOn ? '暂停背景音乐' : '播放背景音乐'"
      @click="emit('toggle-music')"
    >
      <span :class="{ 'pixel-widget__note--off': !musicOn }">♪</span>
    </button>

    <div class="pixel-widget__box">
      <div
        class="pixel-widget__grid"
        :style="{ gridTemplateColumns: `repeat(${cols}, var(--px-w))` }"
      >
        <template v-for="(cell, idx) in cells" :key="idx">
          <span
            v-if="!cell"
            class="pixel-widget__hole"
            aria-hidden="true"
          />
          <button
            v-else
            type="button"
            class="pixel-widget__cell"
            :class="{ 'pixel-widget__cell--active': activeCellIndex === cell.cellIndex }"
            :title="`第 ${cellIndexToPage(cell.cellIndex, Math.max(1, storyTotal), filledCount) + 1} 页`"
            @click="onCell(cell)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixel-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  /* 略扁矩形格，接近原版 */
  --px-w: 10px;
  --px-h: 8px;
}

.pixel-widget__note {
  border: none;
  background: transparent;
  padding: 0 0 2px;
  cursor: pointer;
  color: rgba(30, 20, 25, 0.75);
  font-size: 19px;
  line-height: 1;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.6));
}

.pixel-widget__note:hover {
  color: #c2185b;
}

.pixel-widget__note--off {
  opacity: 0.45;
}

/* 无边框、无容器底色；悬停时只加深格子本身 */
.pixel-widget__box {
  border: none;
  padding: 6px;
  background: transparent;
  box-shadow: none;
}

.pixel-widget__grid {
  display: grid;
  gap: 2px;
  grid-auto-rows: var(--px-h);
}

.pixel-widget__hole {
  width: var(--px-w);
  height: var(--px-h);
  visibility: hidden;
  pointer-events: none;
}

.pixel-widget__cell {
  width: var(--px-w);
  height: var(--px-h);
  padding: 0;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  /* 未选中：偏紫红，接近原版 */
  background: #a64477;
  transition:
    transform 0.12s ease,
    background 0.2s ease,
    filter 0.12s ease;
}

.pixel-widget__cell:hover:not(.pixel-widget__cell--active) {
  background: #6d2d4d;
  transform: scale(1.12);
  z-index: 1;
}

.pixel-widget__cell--active:hover {
  background: #388e3c;
  transform: scale(1.08);
  z-index: 1;
}

.pixel-widget__cell:active {
  transform: scale(0.94);
}

/* 当前页：绿色高亮，随翻页移动 */
.pixel-widget__cell--active {
  background: #4caf50;
  z-index: 2;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}
</style>
