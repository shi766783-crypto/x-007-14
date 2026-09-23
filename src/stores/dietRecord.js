import { defineStore } from 'pinia'
import { read, write } from '@/utils/storage'
import { uid } from '@/utils/id'
import { nutritionScore } from '@/utils/nutrition'
import { toDateKey, weekDateKeys, isConsecutive } from '@/utils/date'

const KEY = 'diet-records'

export const useDietRecordStore = defineStore('dietRecord', {
  state: () => ({
    records: read(KEY, []), // [{ id, date, meal, dishes: [{ name, category }], photos: [dataUrl], createdAt }]
  }),

  getters: {
    recordedMeals: (state) => state.records.length,

    // 按日期分组的记录
    byDate() {
      const map = {}
      this.records.forEach((r) => {
        if (!map[r.date]) map[r.date] = []
        map[r.date].push(r)
      })
      return map
    },

    // 有记录的全部日期（去重、倒序）
    checkInDates(state) {
      return [...new Set(state.records.map((r) => r.date))].sort().reverse()
    },

    // 打卡总天数
    checkInDays() {
      return this.checkInDates.length
    },

    // 某日某餐次的菜品
    mealDishes: (state) => (date, meal) => {
      const rec = state.records.find((r) => r.date === date && r.meal === meal)
      return rec ? rec.dishes : []
    },

    // 每日营养评分
    dailyScores() {
      const map = {}
      this.records.forEach((r) => {
        if (!map[r.date]) map[r.date] = []
        map[r.date].push(...r.dishes)
      })
      const scores = {}
      Object.entries(map).forEach(([date, dishes]) => {
        scores[date] = nutritionScore(dishes)
      })
      return scores
    },

    // 本周平均营养评分
    avgNutritionThisWeek() {
      const days = weekDateKeys()
      const scores = this.dailyScores
      const vals = days.map((d) => scores[d]).filter((s) => s !== undefined)
      if (!vals.length) return 0
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    },

    // 连续记录天数（最长连续）
    maxStreak() {
      const dates = [...new Set(this.records.map((r) => r.date))].sort()
      if (!dates.length) return 0
      let streak = 1
      let max = 1
      for (let i = 1; i < dates.length; i++) {
        if (isConsecutive(dates[i], dates[i - 1])) {
          streak++
          max = Math.max(max, streak)
        } else {
          streak = 1
        }
      }
      return max
    },

    // 当前连续打卡天数：今天/昨天有记录则连续计数，否则为 0
    currentStreak() {
      const dates = new Set(this.records.map((r) => r.date))
      if (!dates.size) return 0
      const cursor = new Date()
      // 今天还没记录时，从昨天起算（不断签）
      if (!dates.has(toDateKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1)
        if (!dates.has(toDateKey(cursor))) return 0
      }
      let streak = 0
      while (dates.has(toDateKey(cursor))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }
      return streak
    },

    // 累计照片数
    photoCount(state) {
      return state.records.reduce((sum, r) => sum + (r.photos?.length || 0), 0)
    },

    // 带照片的餐次记录数量
    photoCheckInCount(state) {
      return state.records.filter((r) => r.photos?.length).length
    },

    // 饮食相册：照片打平后按日期倒序（同日按创建时间倒序）
    // [{ key, url, recordId, date, meal, dishes }]
    albumPhotos(state) {
      const createdMap = {}
      state.records.forEach((r) => {
        createdMap[r.id] = r.createdAt || 0
      })
      const photos = []
      state.records.forEach((r) => {
        ;(r.photos || []).forEach((url, i) => {
          photos.push({
            key: `${r.id}-${i}`,
            url,
            recordId: r.id,
            date: r.date,
            meal: r.meal,
            dishes: r.dishes,
          })
        })
      })
      return photos.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1
        return (createdMap[b.recordId] || 0) - (createdMap[a.recordId] || 0)
      })
    },

    // 相册按日期分组（倒序）：[{ date, meals: { 早餐: [...], ... } }]
    albumByDate() {
      const map = {}
      this.albumPhotos.forEach((p) => {
        if (!map[p.date]) map[p.date] = {}
        if (!map[p.date][p.meal]) map[p.date][p.meal] = []
        map[p.date][p.meal].push(p)
      })
      return Object.keys(map)
        .sort()
        .reverse()
        .map((date) => ({ date, meals: map[date] }))
    },

    // 最近 7 天打卡情况（用于日历点）：[{ date, checked, photo }]
    recentCheckIns() {
      const today = new Date()
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (6 - i))
        const key = toDateKey(d)
        const recs = this.records.filter((r) => r.date === key)
        return {
          date: key,
          checked: recs.length > 0,
          photo: recs.some((r) => r.photos?.length),
        }
      })
    },

    // 营养评分趋势（最近 N 天）
    nutritionTrend: (state) => (n = 7) => {
      const end = new Date()
      const arr = []
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(end)
        d.setDate(end.getDate() - i)
        const key = toDateKey(d)
        const dishes = state.records.filter((r) => r.date === key).flatMap((r) => r.dishes)
        arr.push({ date: key, score: dishes.length ? nutritionScore(dishes) : 0 })
      }
      return arr
    },
  },

  actions: {
    persist() {
      write(KEY, this.records)
    },

    addRecord(date, meal, dishes, photos = []) {
      const rec = {
        id: uid('rec'),
        date,
        meal,
        dishes: dishes.map((d) => ({ name: d.name, category: d.category || '其他' })),
        photos: photos.filter(Boolean),
        createdAt: Date.now(),
      }
      this.records.push(rec)
      this.persist()
      return rec
    },

    updateRecord(id, dishes) {
      const rec = this.records.find((r) => r.id === id)
      if (!rec) return
      rec.dishes = dishes.map((d) => ({ name: d.name, category: d.category || '其他' }))
      this.persist()
    },

    removeRecord(id) {
      this.records = this.records.filter((r) => r.id !== id)
      this.persist()
    },

    // 给某条记录追加一张照片
    addPhoto(recordId, dataUrl) {
      const rec = this.records.find((r) => r.id === recordId)
      if (!rec || !dataUrl) return
      if (!rec.photos) rec.photos = []
      rec.photos.push(dataUrl)
      this.persist()
    },

    // 删除某条记录中的指定照片
    removePhoto(recordId, index) {
      const rec = this.records.find((r) => r.id === recordId)
      if (!rec?.photos) return
      rec.photos.splice(index, 1)
      this.persist()
    },

    // 快捷记录：从食谱计划导入当日菜品
    importFromPlan(date, meal, dishList) {
      this.addRecord(date, meal, dishList.map((d) => ({ name: d.name, category: d.category })))
    },
  },
})