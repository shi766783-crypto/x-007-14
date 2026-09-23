<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDietRecordStore } from '@/stores/dietRecord'
import { MEAL_ICONS } from '@/constants'
import { toDateKey, formatDate, weekdayLabel, monthLabel } from '@/utils/date'
import DietTabs from '@/components/diet/DietTabs.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'

const diet = useDietRecordStore()
const route = useRoute()
const router = useRouter()

const groups = computed(() => diet.albumByDate)
const flatPhotos = computed(() => diet.albumPhotos)
const todayKey = toDateKey()

// 月份分隔：与上一组月份不同时显示月份标题
function monthOf(group, index) {
  if (index === 0) return monthLabel(group.date)
  const prev = groups.value[index - 1].date.slice(0, 7)
  return group.date.slice(0, 7) !== prev ? monthLabel(group.date) : ''
}

// 灯箱
const activeIndex = ref(-1)
const activePhoto = computed(() =>
  activeIndex.value >= 0 ? flatPhotos.value[activeIndex.value] : null,
)

function openAt(index) {
  activeIndex.value = index
}
function close() {
  activeIndex.value = -1
  router.replace({ query: {} })
}
function prev() {
  if (activeIndex.value > 0) activeIndex.value--
}
function next() {
  if (activeIndex.value < flatPhotos.value.length - 1) activeIndex.value++
}
function onKey(e) {
  if (activeIndex.value < 0) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

// 从记录页缩略图跳入时自动打开灯箱
async function openFromQuery() {
  const key = route.query.photo
  if (!key) return
  await nextTick()
  const idx = flatPhotos.value.findIndex((p) => p.key === key)
  if (idx >= 0) openAt(idx)
}
onMounted(openFromQuery)
watch(() => route.query.photo, (v) => {
  if (v && activeIndex.value < 0) openFromQuery()
})

// 照片在记录内的序号（删除时用）
function photoIndex(photo) {
  const rec = diet.records.find((r) => r.id === photo.recordId)
  return rec?.photos?.indexOf(photo.url) ?? -1
}

function deleteActive() {
  const p = activePhoto.value
  if (!p) return
  if (!window.confirm('确定删除这张照片吗？')) return
  const idx = photoIndex(p)
  if (idx >= 0) {
    diet.removePhoto(p.recordId, idx)
    // 删除后停留在下一张；没有更多则关闭灯箱
    activeIndex.value = Math.min(activeIndex.value, flatPhotos.value.length - 1)
    if (activeIndex.value < 0) close()
    router.replace({ query: {} })
  }
}

const monthGrid = computed(() => {
  const map = new Map()
  groups.value.forEach((g) => {
    const m = g.date.slice(0, 7)
    if (!map.has(m)) map.set(m, { label: monthLabel(g.date), count: 0 })
    map.get(m).count += Object.values(g.meals).reduce((s, arr) => s + arr.length, 0)
  })
  return [...map.values()]
})
</script>

<template>
  <div>
    <div class="page-head">
      <h2>🖼️ 饮食相册</h2>
    </div>

    <DietTabs active="album" />

    <!-- 打卡概览 -->
    <div class="album-summary">
      <div class="sum-item highlight">
        <span class="num">🔥 {{ diet.currentStreak }}</span>
        <span class="lbl">连续打卡（天）</span>
      </div>
      <div class="sum-item">
        <span class="num">{{ diet.checkInDays }}</span>
        <span class="lbl">累计打卡（天）</span>
      </div>
      <div class="sum-item">
        <span class="num">{{ diet.photoCount }}</span>
        <span class="lbl">照片（张）</span>
      </div>
      <div class="sum-item">
        <span class="num">{{ diet.maxStreak }}</span>
        <span class="lbl">最长连续（天）</span>
      </div>
    </div>

    <BaseEmpty
      v-if="!groups.length"
      emoji="📷"
      text="还没有餐食照片，去记录一餐并拍照打卡吧"
    />

    <div v-else>
      <div v-if="monthGrid.length" class="month-chips">
        <span v-for="m in monthGrid" :key="m.label" class="chip">{{ m.label }} · {{ m.count }} 张</span>
      </div>

      <section v-for="(g, gi) in groups" :key="g.date" class="day-group">
        <div v-if="monthOf(g, gi)" class="month-title">{{ monthOf(g, gi) }}</div>
        <div class="day-head">
          <span class="date">{{ formatDate(g.date) }} {{ weekdayLabel(g.date) }}</span>
          <span v-if="g.date === todayKey" class="today-tag">今天</span>
        </div>

        <div v-for="(photos, mealName) in g.meals" :key="mealName" class="meal-row">
          <div class="meal-label">{{ MEAL_ICONS[mealName] }} {{ mealName }}</div>
          <div class="photo-grid">
            <button
              v-for="(p, i) in photos"
              :key="p.key"
              type="button"
              class="photo-cell"
              @click="openAt(flatPhotos.findIndex((x) => x.key === p.key))"
            >
              <img :src="p.url" :alt="`${g.date} ${mealName} ${i + 1}`" loading="lazy" />
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- 灯箱 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="activePhoto" class="lightbox" @click.self="close">
          <button class="lb-btn close" @click="close">✕</button>
          <button class="lb-btn nav prev" @click.stop="prev" :disabled="activeIndex === 0">‹</button>
          <div class="lb-content" @click.stop>
            <img :src="activePhoto.url" alt="餐食大图" />
            <div class="lb-meta">
              <div>
                <strong>{{ formatDate(activePhoto.date) }} {{ weekdayLabel(activePhoto.date) }}</strong>
                <span class="meal">{{ MEAL_ICONS[activePhoto.meal] }} {{ activePhoto.meal }}</span>
              </div>
              <button class="lb-delete" @click="deleteActive">🗑 删除照片</button>
            </div>
          </div>
          <button
            class="lb-btn nav next"
            @click.stop="next"
            :disabled="activeIndex === flatPhotos.length - 1"
          >
            ›
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.page-head h2 {
  margin: 0 0 16px;
}
.album-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.sum-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.sum-item.highlight {
  background: linear-gradient(135deg, #fff7e6, #fff1f0);
  border-color: #ffd591;
}
.sum-item .num {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-dark);
}
.sum-item.highlight .num {
  color: #e65100;
}
.sum-item .lbl {
  font-size: 12px;
  color: var(--text-2);
}
.month-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.chip {
  font-size: 12px;
  background: var(--surface-2);
  color: var(--text-2);
  padding: 4px 12px;
  border-radius: 999px;
}
.day-group {
  margin-bottom: 20px;
}
.month-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--primary-dark);
  margin: 8px 0 10px;
  padding-left: 2px;
}
.day-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.day-head .date {
  font-weight: 600;
  font-size: 15px;
}
.today-tag {
  font-size: 11px;
  background: var(--primary);
  color: #fff;
  padding: 1px 8px;
  border-radius: 999px;
}
.meal-row {
  margin-bottom: 10px;
}
.meal-label {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 6px;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}
.photo-cell {
  position: relative;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 1;
  background: var(--surface-2);
}
.photo-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}
.photo-cell:hover img {
  transform: scale(1.05);
}

/* 灯箱 */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 64px;
}
.lb-content {
  max-width: min(90vw, 860px);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}
.lb-content img {
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 10px;
}
.lb-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 4px 0;
  color: #fff;
}
.lb-meta .meal {
  margin-left: 12px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
}
.lb-delete {
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
.lb-delete:hover {
  background: var(--danger);
}
.lb-btn {
  position: absolute;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
  z-index: 1;
}
.lb-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.28);
}
.lb-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.lb-btn.close {
  top: 18px;
  right: 20px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 15px;
}
.lb-btn.nav {
  top: 50%;
  transform: translateY(-50%);
  width: 46px;
  height: 46px;
  border-radius: 50%;
  font-size: 26px;
  line-height: 1;
}
.lb-btn.prev {
  left: 16px;
}
.lb-btn.next {
  right: 16px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 560px) {
  .album-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  .lightbox {
    padding: 16px 48px;
  }
}
</style>
