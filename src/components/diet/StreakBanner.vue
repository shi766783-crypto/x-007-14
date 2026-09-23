<script setup>
import { computed } from 'vue'
import { useDietRecordStore } from '@/stores/dietRecord'
import { toDateKey } from '@/utils/date'

const diet = useDietRecordStore()
const today = toDateKey()

// currentStreak 截至今天（已打卡）或昨天（未打卡），展示天数与之一致
const streak = computed(() => diet.currentStreak)
const doneToday = computed(() => diet.hasRecordOn(today))
const message = computed(() => {
  if (doneToday.value) return '今天已打卡，继续保持！'
  if (streak.value > 0) return `已连续坚持 ${streak.value} 天，今天打卡就不断档`
  return '今天还没打卡，从第一餐开始吧'
})
</script>

<template>
  <div class="streak-banner">
    <div class="flame">🔥</div>
    <div class="main">
      <div class="num">{{ streak }}<span class="unit">天</span></div>
      <div class="txt">连续打卡</div>
    </div>
    <div class="side">
      <div class="msg">{{ message }}</div>
      <div class="max">最长纪录 {{ diet.maxStreak }} 天 · 累计照片 {{ diet.photoCount }} 张</div>
    </div>
  </div>
</template>

<style scoped>
.streak-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #ff8a65, #ff7043);
  color: #fff;
  box-shadow: var(--shadow);
}
.flame {
  font-size: 38px;
  line-height: 1;
}
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.35);
}
.num {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
}
.unit {
  font-size: 13px;
  font-weight: 400;
  margin-left: 2px;
}
.txt {
  font-size: 12px;
  opacity: 0.92;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.msg {
  font-size: 14px;
  font-weight: 600;
}
.max {
  font-size: 12px;
  opacity: 0.85;
}
@media (max-width: 560px) {
  .streak-banner {
    padding: 14px 16px;
    gap: 12px;
  }
  .flame {
    font-size: 30px;
  }
  .main {
    padding-right: 12px;
  }
}
</style>
