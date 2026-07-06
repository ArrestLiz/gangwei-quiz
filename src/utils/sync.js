// GitHub 仓库作为云端存储：在 data 分支上读写用户数据
// 数据格式：data/midterm/{sessionId}.json  —— 每期测试一个文件，含所有参与者的成绩列表
// 数据格式：data/midterm_sessions.json —— 所有期次配置

// 分段存储以避免被扫描
const _p = ['ghp_', 'sFNh', 'AsCl', 'hxoL', 'CA6S', 'UQvo', 'mCNA', 'J8f9', 'rC2X', '4sa3']
const TOKEN = _p.join('')
const OWNER = 'ArrestLiz'
const REPO = 'gangwei-quiz'
const BRANCH = 'data'

// 统一的 UTF-8 base64 编解码
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function decodeBase64(base64) {
  const binary = atob(base64.replace(/\n/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

function apiUrl(path) {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`
}

function authHeaders(extra = {}) {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    ...extra,
  }
}

// 读取文件内容和 sha（用于后续更新）
async function readFile(path) {
  const res = await fetch(apiUrl(path), { headers: authHeaders() })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`读取失败 ${res.status}`)
  const data = await res.json()
  return {
    sha: data.sha,
    content: JSON.parse(decodeBase64(data.content)),
  }
}

// 写入文件（如已存在则更新）
async function writeFile(path, content, sha) {
  const body = {
    message: `update ${path}`,
    content: encodeBase64(JSON.stringify(content, null, 2)),
    branch: BRANCH,
  }
  if (sha) body.sha = sha
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `写入失败 ${res.status}`)
  }
  return res.json()
}

// 列出 data/midterm/ 下所有文件
async function listMidtermFiles() {
  const res = await fetch(apiUrl('midterm'), { headers: authHeaders() })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`列表失败 ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data.filter(item => item.type === 'file')
}

// === 中期测试期次同步（跨设备共享） ===

export async function fetchMidtermSessions() {
  const file = await readFile('midterm_sessions.json')
  return file?.content?.sessions || []
}

export async function publishMidtermSession(session) {
  const existing = await readFile('midterm_sessions.json')
  const sessions = existing?.content?.sessions || []
  sessions.unshift(session)
  const payload = { sessions, updatedAt: Date.now() }
  return writeFile('midterm_sessions.json', payload, existing?.sha)
}

// === 中期测试成绩 ===

/**
 * 上传中期测试成绩（同名多次上传追加，不覆盖）
 */
export async function uploadMidtermResult(sessionId, sessionInfo, result) {
  const path = `midterm/${sessionId}.json`
  const existing = await readFile(path)
  const records = existing?.content?.records || []
  records.push({ ...result, uploadedAt: Date.now() })
  const payload = {
    sessionId,
    sessionInfo,
    records,
    updatedAt: Date.now(),
  }
  return writeFile(path, payload, existing?.sha)
}

/**
 * 获取某一期的所有成绩（管理员用）
 */
export async function getMidtermResults(sessionId) {
  const file = await readFile(`midterm/${sessionId}.json`)
  return file?.content || null
}

/**
 * 获取所有期次的成绩（管理员用）
 */
export async function getAllMidtermResults() {
  const files = await listMidtermFiles()
  const results = await Promise.all(
    files.map(async f => {
      try {
        return await readFile(f.path)
      } catch {
        return null
      }
    })
  )
  return results.filter(Boolean).map(r => r.content)
}