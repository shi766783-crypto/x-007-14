<script setup>
import { ref, computed } from 'vue'
import { useDietRecordStore } from '@/stores/dietRecord'
import { useMealPlanStore } from '@/stores/mealPlan'
import { DISH_CATEGORIES, MEALS, MEAL_ICONS, WEEK_DAYS } from '@/constants'
import { toDateKey, weekDateKeys, parseDateKey } from '@/utils/date'
import { nutritionScore, scoreLabel } from '@/utils/nutrition'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import SimpleChart from '@/components/common/SimpleChart.vue'
import DietTabs from '@/components/diet/DietTabs.vue'
import MealPhotoUploader from '@/components/diet/MealPhotoUploader.vue'

const diet = useDietRecordStore()
const mealPlan = useMealPlanStore()

const date = ref(toDateKey())
const meal = ref('早餐')
const dishes = ref([{ name: '', category: '蔬菜' }])
const photos = ref([])
const weekDates = weekDateKeys()

const dayRecords = computed(() =>
  diet.records.filter((r) => r.date === date.value).sort((a, b) => a.createdAt - b.createdAt),
)
const dayDishes = computed(() => dayRecords.value.flatMap((r) => r.dishes))
const dayScore = computed(() => nutritionScore(dayDishes.value))
const score = computed(() => scoreLabel(dayScore.value))

const planDishesForToday = computed(() => {
  // 找到本周对应日期的计划菜品
  const idx = weekDates.indexOf(date.value)
  if (idx === -1) return []
  const dayKey = WEEK_DAYS[idx]?.key
  if (!dayKey) return []
  const week = mealPlan.currentWeek.days
  const m = { 早餐: 'breakfast', 午餐: 'lunch', 晚餐: 'dinner' }[meal.value]
  return (week[dayKey]?.[m] || [])
    .map((id) => mealPlan.dishMap[id])
    .filter(Boolean)
})

const trendLabels = computed(() => weekDates.map((d) => `${parseDateKey(d).getMonth() + 1}/${parseDateKey(d).getDate()}`))
const trendData = computed(() => weekDates.map((d) => diet.dailyScores[d] || 0))

const todayKey = toDateKey()
const checkedToday = computed(() => diet.checkInDates.includes(todayKey))
const checkedTodayWithPhoto = computed(() =>
  diet.records.some((r) => r.date === todayKey && r.photos?.length),
)

function addDish() {
  dishes.value.push({ name: '', category: '蔬菜' })
}
function removeDish(i) {
  if (dishes.value.length === 1) dishes.value[0] = { name: '', category: '蔬菜' }
  else dishes.value.splice(i, 1)
}

function importFromPlan() {
  dishes.value = planDishesForToday.value.map((d) => ({ name: d.name, category: d.category }))
  if (!dishes.value.length) dishes.value = [{ name: '', category: '蔬菜' }]
}

function resetForm() {
  dishes.value = [{ name: '', category: '蔬菜' }]
  photos.value = []
}

function save() {
  const valid = dishes.value.filter((d) => d.name.trim())
  // 允许只拍照打卡（没有填菜品名时也算一次记录）
  if (!valid.length && !photos.value.length) return
  diet.addRecord(date.value, meal.value, valid, photos.value)
  resetForm()
}

function removeRecord(id) {
  diet.removeRecord(id)
}
</script>

<template>
  <div>
    <div class="page-head">
      <h2>🍽️ 每日饮食记录</h2>
    </div>

    <DietTabs active="record" />

    <!-- 连续打卡横幅 -->
    <div class="streak-banner" :class="{ 'streak-on': diet.currentStreak > 0 }">
      <div class="streak-main">
        <span class="flame">🔥</span>
        <div class="streak-text">
          <strong v-if="diet.currentStreak > 0">已连续打卡 {{ diet.currentStreak }} 天</strong>
          <strong v-else>今天还没打卡</strong>
          <span class="sub">
            {{ checkedToday ? (checkedTodayWithPhoto ? '今天的美食已留念 ✨' : '再拍张照片更有仪式感') : '记录一餐，开启今天的打卡' }}
            · 历史最长 {{ diet.maxStreak }} 天
          </span>
        </div>
      </div>
      <div class="week-dots">
        <span
          v-for="d in diet.recentCheckIns"
          :key="d.date"
          class="dot"
          :class="{ on: d.checked, cam: d.photo, today: d.date === todayKey }"
          :title="d.date"
        >
          <span v-if="d.photo">📷</span>
        </span>
      </div>
    </div>

    <div class="card">
      <div class="section-title">记录一餐</div>
      <div class="form-grid">
        <div class="field">
          <label>日期</label>
          <input v-model="date" type="date" />
        </div>
        <div class="field">
          <label>餐次</label>
          <select v-model="meal">
            <option v-for="m in MEALS" :key="m" :value="m">{{ MEAL_ICONS[m] }} {{ m }}</option>
          </select>
        </div>
        <div class="field actions-col">
          <BaseButton variant="ghost" size="sm" :disabled="!planDishesForToday.length" @click="importFromPlan">
            从计划导入
          </BaseButton>
        </div>
      </div>

      <div class="dish-editor">
        <div v-for="(d, i) in dishes" :key="i" class="dish-row">
          <input v-model="d.name" type="text" placeholder="菜品名" class="grow" />
          <select v-model="d.category">
            <option v-for="c in DISH_CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
          <button class="del" @click="removeDish(i)">✕</button>
        </div>
        <div class="editor-actions">
          <BaseButton size="sm" variant="ghost" @click="addDish">+ 加一道菜</BaseButton>
          <BaseButton size="sm" @click="save">保存记录</BaseButton>
        </div>
      </div>

      <div class="photo-block">
        <label>餐食照片<span class="hint">（拍下来，以后翻相册更有感觉）</span></label>
        <MealPhotoUploader v-model="photos" :max="6" />
      </div>
    </div>

    <div class="card">
      <div class="section-title">
        <span>{{ date }} 记录</span>
        <BaseTag :text="dayRecords.length ? `${dayScore} 分 · ${score.label}` : '暂无评分'" :color="dayRecords.length ? score.color : '#90a4ae'" />
      </div>
      <BaseEmpty v-if="!dayRecords.length" emoji="🍚" text="当天还没有记录" />
      <div v-else class="day-records">
        <div v-for="r in dayRecords" :key="r.id" class="rec">
          <div class="rec-head">
            <span class="meal">{{ MEAL_ICONS[r.meal] }} {{ r.meal }}</span>
            <button class="del" @click="removeRecord(r.id)">✕</button>
          </div>
          <div v-if="r.dishes?.length" class="rec-dishes">
            <BaseTag v-for="(d, i) in r.dishes" :key="i" :category="d.category" :text="d.name" />
          </div>
          <p v-else class="photo-only muted">📷 照片打卡</p>
          <div v-if="r.photos?.length" class="rec-photos">
            <router-link
              v-for="(p, i) in r.photos"
              :key="i"
              :to="{ path: '/diet/album', query: { photo: `${r.id}-${i}` } }"
              class="rec-photo"
            >
              <img :src="p" :alt="`${r.meal}照片${i + 1}`" loading="lazy" />
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">本周营养评分趋势</div>
      <SimpleChart type="line" :labels="trendLabels" :data="trendData" color="#2196f3" :height="180" />
    </div>
  </div>
</template>

<style scoped>
.page-head h2 {
  margin: 0 0 16px;
}
.streak-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  border-radius: var(--radius);
  padding: 14px 18px;
  margin-bottom: 16px;
  background: var(--surface-2);
  border: 1px solid var(--border);
}
.streak-banner.streak-on {
  background: linear-gradient(135deg, #fff7e6, #fff1f0);
  border-color: #ffd591;
}
.streak-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.flame {
  font-size: 32px;
  line-height: 1;
}
.streak-text {
  display: flex;
  flex-direction: column;
}
.streak-text strong {
  font-size: 16px;
}
.streak-text .sub {
  font-size: 12px;
  color: var(--text-2);
}
.week-dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
.dot.on {
  background: var(--primary-light);
  border-color: var(--primary);
}
.dot.cam {
  background: #fff3e0;
  border-color: #ffb74d;
}
.dot.today {
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.35);
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 12px;
  color: var(--text-2);
}
.field input,
.field select {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
}
.actions-col {
  padding-bottom: 2px;
}
.dish-editor {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}
.dish-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.dish-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
}
.dish-row .grow {
  flex: 2;
}
.dish-row select {
  width: 90px;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.del {
  border: none;
  background: var(--danger-light);
  color: var(--danger);
  width: 32px;
  border-radius: 6px;
  cursor: pointer;
}
.editor-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}
.photo-block {
  border-top: 1px solid var(--border);
  margin-top: 16px;
  padding-top: 16px;
}
.photo-block label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.photo-block .hint {
  font-weight: 400;
  color: var(--text-2);
}
.day-records {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rec {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}
.rec-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.meal {
  font-weight: 600;
}
.rec-dishes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.photo-only {
  margin: 0 0 4px;
  font-size: 13px;
}
.rec-photos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.rec-photo {
  width: 88px;
  height: 88px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.rec-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}
.rec-photo:hover img {
  transform: scale(1.06);
}
@media (max-width: 560px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
  .actions-col {
    grid-column: 1 / -1;
  }
}
</style>
