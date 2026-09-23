// 图片压缩工具：将用户选择/拍摄的图片缩放后转为 JPEG DataURL，避免 localStorage 被撑爆

const MAX_SIZE = 1080 // 长边最大像素
const QUALITY = 0.72 // JPEG 压缩质量

// 读取文件并压缩，输出 JPEG DataURL
export function compressImage(file, { maxSize = MAX_SIZE, quality = QUALITY } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'))
      return
    }

    let settled = false
    const fail = (e) => {
      if (!settled) {
        settled = true
        reject(e instanceof Error ? e : new Error('图片处理失败'))
      }
    }
    const done = (dataUrl) => {
      if (!settled) {
        settled = true
        resolve(dataUrl)
      }
    }

    // 优先用 createImageBitmap 纠正手机竖拍照片的 EXIF 方向
    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file, { imageOrientation: 'from-image' })
        .then((img) => done(drawToDataUrl(img, img.width, img.height, maxSize, quality)))
        .catch(() => decodeByImgElement(file, maxSize, quality).then(done).catch(fail))
    } else {
      decodeByImgElement(file, maxSize, quality).then(done).catch(fail)
    }
  })
}

// 兜底：使用 <img> 解码（不纠正 EXIF 方向）
function decodeByImgElement(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () =>
        resolve(drawToDataUrl(img, img.naturalWidth, img.naturalHeight, maxSize, quality))
      img.onerror = () => reject(new Error('图片解码失败'))
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function drawToDataUrl(source, srcW, srcH, maxSize, quality) {
  let w = srcW
  let h = srcH
  if (Math.max(w, h) > maxSize) {
    const scale = maxSize / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}
