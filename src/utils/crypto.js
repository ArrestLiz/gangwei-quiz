// 使用动态导入，避免 1.8MB 加密文件阻塞首屏渲染
export async function decryptQuestions(password) {
  try {
    const [{ encryptedData }, CryptoJS] = await Promise.all([
      import('../data/encrypted'),
      import('crypto-js'),
    ])
    const crypto = CryptoJS.default || CryptoJS
    const bytes = crypto.AES.decrypt(encryptedData, password)
    const json = bytes.toString(crypto.enc.Utf8)
    if (!json) return null
    return JSON.parse(json)
  } catch {
    return null
  }
}
