<script setup>
import { ref } from 'vue'
import { compressImage } from '@/utils/image'

const props = defineProps({
  modelValue: { type: String, default: '' },
  // 拍照打卡模式：显示「拍照」+「相册」两个入口，移动端可直接调起相机
  capture: { type: Boolean, default: false },
  label: { type: String, default: '上传照片' },
  alt: { type: String, default: '照片' },
})
const emit = defineEmits(['update:modelValue'])

const cameraRef = ref(null)
const galleryRef = ref(null)
const loading = ref(false)
const error = ref('')

function pickCamera() {
  cameraRef.value?.click()
}
function pickGallery() {
  galleryRef.value?.click()
}

async function onFile(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  loading.value = true
  error.value = ''
  try {
    const dataUrl = await compressImage(file)
    emit('update:modelValue', dataUrl)
  } catch (err) {
    error.value = err.message || '图片处理失败'
  } finally {
    loading.value = false
  }
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="photo-upload">
    <div v-if="modelValue" class="preview">
      <img :src="modelValue" :alt="alt" />
      <button type="button" class="remove" @click="clear">✕</button>
    </div>
    <template v-else>
      <button v-if="capture" type="button" class="picker capture-pick" :disabled="loading" @click="pickCamera">
        <span class="big-icon">📷</span>
        <span>{{ loading ? '处理中…' : label }}</span>
      </button>
      <button v-if="capture" type="button" class="link-pick" :disabled="loading" @click="pickGallery">
        从相册选择
      </button>
      <button v-else type="button" class="picker" :disabled="loading" @click="pickGallery">
        <span>📷</span>
        <span>{{ loading ? '处理中…' : label }}</span>
      </button>
    </template>
    <p v-if="error" class="err">{{ error }}</p>
    <!-- capture="environment" 优先调起后置摄像头；桌面端忽略该属性，行为退化为普通选图 -->
    <input ref="cameraRef" type="file" accept="image/*" capture="environment" hidden @change="onFile" />
    <input ref="galleryRef" type="file" accept="image/*" hidden @change="onFile" />
  </div>
</template>

<style scoped>
.photo-upload {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.preview {
  position: relative;
  width: 96px;
  height: 96px;
}
.preview img {
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
}
.picker {
  width: 96px;
  height: 96px;
  border: 2px dashed var(--border);
  border-radius: 10px;
  background: var(--surface-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-2);
  font-size: 12px;
}
.picker:disabled {
  opacity: 0.6;
  cursor: wait;
}
.picker span:first-child {
  font-size: 24px;
}
.capture-pick {
  width: 112px;
  height: 112px;
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 600;
}
.capture-pick .big-icon {
  font-size: 30px;
}
.link-pick {
  border: none;
  background: none;
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.link-pick:disabled {
  opacity: 0.6;
}
.err {
  margin: 0;
  font-size: 12px;
  color: var(--danger);
}
</style>
