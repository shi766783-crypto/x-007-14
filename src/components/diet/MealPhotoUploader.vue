<script setup>
import { ref } from 'vue'
import { compressImage } from '@/utils/image'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 9 },
})
const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const processing = ref(false)
const error = ref('')

function pick() {
  error.value = ''
  inputRef.value?.click()
}

async function onFile(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return

  const remain = props.max - props.modelValue.length
  if (remain <= 0) {
    error.value = `最多上传 ${props.max} 张`
    return
  }
  const picked = files.slice(0, remain)
  processing.value = true
  try {
    const dataUrls = []
    for (const f of picked) {
      // 逐张压缩，避免一次性占用过多内存
      // eslint-disable-next-line no-await-in-loop
      dataUrls.push(await compressImage(f))
    }
    emit('update:modelValue', [...props.modelValue, ...dataUrls])
  } catch (err) {
    error.value = err.message || '图片处理失败，请换一张试试'
  } finally {
    processing.value = false
  }
}

function remove(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="meal-photos">
    <div v-for="(p, i) in modelValue" :key="i" class="thumb">
      <img :src="p" alt="餐食照片" />
      <button type="button" class="remove" @click="remove(i)">✕</button>
    </div>
    <button
      v-if="modelValue.length < max"
      type="button"
      class="picker"
      :disabled="processing"
      @click="pick"
    >
      <template v-if="processing">
        <span class="spin">⏳</span>
        <span>处理中…</span>
      </template>
      <template v-else>
        <span>📷</span>
        <span>拍照打卡</span>
        <span v-if="modelValue.length" class="count">{{ modelValue.length }}/{{ max }}</span>
      </template>
    </button>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      multiple
      hidden
      @change="onFile"
    />
    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<style scoped>
.meal-photos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.thumb {
  position: relative;
  width: 84px;
  height: 84px;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--border);
}
.remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--danger);
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}
.picker {
  width: 84px;
  height: 84px;
  border: 2px dashed var(--border);
  border-radius: 10px;
  background: var(--surface-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-2);
  font-size: 12px;
}
.picker:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary-dark);
  background: var(--primary-light);
}
.picker:disabled {
  cursor: wait;
  opacity: 0.7;
}
.picker span:first-child {
  font-size: 22px;
}
.spin {
  animation: pulse 1s ease-in-out infinite;
}
.count {
  font-size: 10px;
  color: var(--text-2);
}
.err {
  flex-basis: 100%;
  margin: 0;
  font-size: 12px;
  color: var(--danger);
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
