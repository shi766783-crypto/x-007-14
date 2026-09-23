<script setup>
defineProps({
  show: Boolean,
  src: { type: String, default: '' },
  title: { type: String, default: '' },
})
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="viewer" @click.self="emit('close')">
        <button class="close" @click="emit('close')">✕</button>
        <img v-if="src" :src="src" :alt="title || '饮食照片'" @click.stop />
        <p v-if="title" class="title" @click.stop>{{ title }}</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.viewer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 2000;
  padding: 24px;
}
.viewer img {
  max-width: 92vw;
  max-height: 78vh;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.title {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}
.close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}
.close:hover {
  background: rgba(255, 255, 255, 0.3);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
