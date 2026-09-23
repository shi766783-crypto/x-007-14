<script setup>
import { ref, computed } from 'vue'
import { useDietRecordStore } from '@/stores/dietRecord'
import { MEAL_ICONS } from '@/constants'
import { toDateKey, formatLongDate } from '@/utils/date'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import PhotoViewer from '@/components/common/PhotoViewer.vue'
import StreakBanner from '@/components/diet/StreakBanner.vue'

const diet = useDietRecordStore()
const today = toDateKey()

const viewerShow = ref(false)
const viewerSrc = ref('')
const viewerTitle = ref('')

const groups = computed(() => diet.albumGroups)

function dayLabel(date) {
  return date === today ? '今天' : date === shiftKey(today, -1) ? '昨天' : formatLongDate(date)
}

function shiftKey(key, n) {
  const d = new Date(key)
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dishNames(rec) {
  return rec.dishes
    .map((d) => d.name)
    .filter(Boolean)
    .join('、')
}

function openViewer(rec) {
  viewerSrc.value = rec.photo
  viewerTitle.value = `${rec.date} ${MEAL_ICONS[rec.meal] || ''} ${rec.meal}`
  viewerShow.value = true
}
</script>

<template>
  <div>
    <div class="page-head">
      <h2>📷 饮食相册</h2>
      <p class="muted sub">每一餐的照片都在这里，按时间倒序排列。</p>
    </div>

    <StreakBanner class="streak" />

    <BaseEmpty
      v-if="!groups.length"
      emoji="📸"
      text="还没有饮食照片，去记录一餐并拍照打卡吧"
    />

    <template v-else>
      <div class="summary muted">共 {{ diet.photoCount }} 张照片 · {{ groups.length }} 天打卡</div>

      <div v-for="group in groups" :key="group.date" class="card day-group">
        <div class="section-title">
          <span class="day-title">
            {{ dayLabel(group.date) }}
            <em v-if="group.date === today" class="today-badge">今天</em>
          </span>
          <span class="muted small">{{ group.items.length }} 餐</span>
        </div>
        <div class="photo-grid">
          <figure
            v-for="rec in group.items"
            :key="rec.id"
            class="photo-cell"
            @click="openViewer(rec)"
          >
            <img :src="rec.photo" :alt="`${group.date}${rec.meal}照片`" loading="lazy" />
            <figcaption class="photo-meta">
              <span class="meal-tag">{{ MEAL_ICONS[rec.meal] }} {{ rec.meal }}</span>
              <span v-if="dishNames(rec)" class="dish-names">{{ dishNames(rec) }}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </template>

    <PhotoViewer :show="viewerShow" :src="viewerSrc" :title="viewerTitle" @close="viewerShow = false" />
  </div>
</template>

<style scoped>
.page-head h2 {
  margin: 0 0 4px;
}
.sub {
  margin: 0 0 16px;
  font-size: 13px;
}
.streak {
  margin-bottom: 16px;
}
.summary {
  font-size: 12px;
  margin: 0 0 10px 2px;
}
.day-group {
  padding: 14px 16px;
}
.day-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.small {
  font-size: 12px;
}
.today-badge {
  font-style: normal;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 600;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}
.photo-cell {
  margin: 0;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  background: var(--surface-2);
}
.photo-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s;
}
.photo-cell:hover img {
  transform: scale(1.06);
}
.photo-meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px 8px 6px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.meal-tag {
  font-size: 12px;
  font-weight: 600;
}
.dish-names {
  font-size: 11px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
