import { PIXEL_WIDGET_PATTERN } from '../data/pixelHeartWidgetPattern'

/** 右下角像素爱心里有颜色的格子数量 */
export function countFilledPixels() {
  let n = 0
  for (const row of PIXEL_WIDGET_PATTERN) {
    for (const ch of row) {
      if (ch !== ' ') n += 1
    }
  }
  return n
}

export const PIXEL_FILLED_COUNT = countFilledPixels()

/**
 * 当前故事页（0..totalPages-1）→ 高亮的格子序号（0..filledCount-1）
 * 当页数与格数一致时严格一一对应（与原版「一格一页」一致）
 */
export function pageToCellIndex(pageIndex, totalPages, filledCount) {
  if (filledCount <= 0 || totalPages <= 0) return 0
  const p = Math.min(Math.max(0, pageIndex), Math.max(0, totalPages - 1))
  if (totalPages === filledCount) {
    return p
  }
  if (totalPages === 1 || filledCount === 1) return 0
  return Math.round((p * (filledCount - 1)) / (totalPages - 1))
}

/**
 * 点击第几个格子（0..filledCount-1）→ 跳到第几页（0..totalPages-1）
 */
export function cellIndexToPage(cellIndex, totalPages, filledCount) {
  if (filledCount <= 0 || totalPages <= 0) return 0
  const c = Math.min(Math.max(0, cellIndex), filledCount - 1)
  if (totalPages === filledCount) {
    return c
  }
  if (totalPages === 1 || filledCount === 1) return 0
  return Math.round((c * (totalPages - 1)) / (filledCount - 1))
}
