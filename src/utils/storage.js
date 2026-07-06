const PREFIX = 'gwlb_'

function getUserPrefix(userId) {
  return userId ? `${PREFIX}${userId}_` : `${PREFIX}`
}

function read(userId, key) {
  try {
    const v = localStorage.getItem(getUserPrefix(userId) + key)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

function write(userId, key, value) {
  try {
    localStorage.setItem(getUserPrefix(userId) + key, JSON.stringify(value))
  } catch {
    // 忽略写入错误
  }
}

// 学习进度
export function getProgress(userId) {
  return read(userId, 'progress') || { single: [], multi: [], judge: [] }
}
export function saveProgress(userId, progress) {
  write(userId, 'progress', progress)
}

// 错题本
export function getWrongBook(userId) {
  return read(userId, 'wrongBook') || {}
}
export function saveWrongBook(userId, book) {
  write(userId, 'wrongBook', book)
}

// 测试记录
export function getTestRecords(userId) {
  return read(userId, 'testRecords') || []
}
export function saveTestRecord(userId, record) {
  const records = getTestRecords(userId)
  records.unshift(record)
  if (records.length > 50) records.pop()
  write(userId, 'testRecords', records)
}

// 中期测试期次（管理员发布，所有用户共享同一浏览器）
// 数据结构: [{ id, title, count, timeLimit, types, diffs, startTime, endTime, createdAt }]
export function getMidtermSessions() {
  return read(null, 'midtermSessions') || []
}
export function saveMidtermSessions(sessions) {
  write(null, 'midtermSessions', sessions)
}
export function addMidtermSession(session) {
  const sessions = getMidtermSessions()
  sessions.unshift(session)
  saveMidtermSessions(sessions)
}
// 按 id 获取单期
export function getMidtermSession(id) {
  return getMidtermSessions().find(s => s.id === id) || null
}
