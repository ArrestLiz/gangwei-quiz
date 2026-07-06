// crypto-js 静态导入，避免动态 import 在构建环境中失败
import CryptoJS from 'crypto-js'

// 加密题库动态导入，避免 1.8MB 阻塞首屏渲染
export async function decryptQuestions(password) {
  try {
    const { encryptedData } = await import('../data/encrypted')
    const bytes = CryptoJS.AES.decrypt(encryptedData, password)
    const json = bytes.toString(CryptoJS.enc.Utf8)
    if (!json) return null
    return JSON.parse(json)
  } catch {
    return null
  }
}