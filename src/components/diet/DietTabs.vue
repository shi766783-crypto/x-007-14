<script setup>
defineProps({
  active: { type: String, required: true }, // 'record' | 'album'
})
</script>

<template>
  <div class="diet-tabs">
    <router-link to="/diet" class="tab" :class="{ active: active === 'record' }">
      📝 记录
    </router-link>
    <router-link to="/diet/album" class="tab" :class="{ active: active === 'album' }">
      🖼️ 相册
    </router-link>
  </div>
</template>

<style scoped>
.diet-tabs {
  display: inline-flex;
  background: var(--surface-2);
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 16px;
}
.tab {
  padding: 7px 20px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-2);
  transition: all 0.15s ease;
}
.tab:hover {
  color: var(--primary-dark);
}
.tab.active {
  background: var(--surface);
  color: var(--primary-dark);
  font-weight: 600;
  box-shadow: var(--shadow);
}
</style>
