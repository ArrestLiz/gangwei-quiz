import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import TestRunner from '../components/TestRunner'
import { fetchMidtermSessions, publishMidtermSession, getAllMidtermResults } from '../utils/sync'
import { GraduationCap, Clock, FileText, Award, Shield, Settings, CheckCircle, Plus, Calendar, Users, Loader2, Trophy, XCircle, RefreshCw } from 'lucide-react'

const COUNTS = [10, 20, 50, 100]
const TIMES = [30, 60, 90]
const DIFFS = [
  { key: 'easy', label: '较易' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '较难' },
]
const TYPES = [
  { key: 'single', label: '单选' },
  { key: 'multi', label: '多选' },
  { key: 'judge', label: '判断' },
]

function isSessionActive(session) {
  const now = Date.now()
  return now >= session.startTime && now <= session.endTime
}

function fmtDateTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function MidtermTest() {
  const { questions, currentUser } = useApp()
  const isAdmin = currentUser?.role === 'admin'
  const [phase, setPhase] = useState('list')
  const [testQuestions, setTestQuestions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [view, setView] = useState('list')
  const [publishing, setPublishing] = useState(false)
  const [config, setConfig] = useState({
    title: '',
    count: 50,
    timeLimit: 60,
    types: ['single', 'multi', 'judge'],
    diffs: ['easy', 'medium', 'hard'],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '21:00',
  })

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const data = await fetchMidtermSessions()
      setSessions(data)
    } catch {
      // 静默失败，使用空列表
    }
    setLoadingSessions(false)
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  function toggleArr(key, val) {
    setConfig(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val],
    }))
  }

  async function publishTest() {
    const startTime = new Date(`${config.startDate}T${config.startTime}:00`).getTime()
    const endTime = new Date(`${config.endDate}T${config.endTime}:00`).getTime()
    if (endTime <= startTime) {
      alert('结束时间必须晚于开始时间')
      return
    }
    setPublishing(true)
    const session = {
      id: `mt_${Date.now()}`,
      title: config.title.trim() || `第 ${sessions.length + 1} 期中期测试`,
      count: config.count,
      timeLimit: config.timeLimit,
      types: config.types,
      diffs: config.diffs,
      startTime,
      endTime,
      createdAt: Date.now(),
    }
    try {
      await publishMidtermSession(session)
      await loadSessions()
      setView('list')
    } catch (e) {
      alert('发布失败：' + (e.message || '网络错误'))
    }
    setPublishing(false)
  }

  function startTest(session) {
    const filtered = questions.filter(q =>
      session.types.includes(q.type) && session.diffs.includes(q.difficulty)
    )
    const byType = { single: [], multi: [], judge: [] }
    filtered.forEach(q => { if (byType[q.type]) byType[q.type].push(q) })
    const total = filtered.length
    if (total === 0) return
    const counts = {}
    Object.keys(byType).forEach(t => {
      counts[t] = Math.round((byType[t].length / total) * session.count)
    })
    let sum = Object.values(counts).reduce((a, b) => a + b, 0)
    while (sum < session.count && sum < total) {
      const max = Object.keys(byType).reduce((a, b) => byType[a].length > byType[b].length ? a : b)
      if (counts[max] < byType[max].length) { counts[max]++; sum++ } else break
    }
    const selected = []
    Object.keys(byType).forEach(t => {
      const shuffled = [...byType[t]].sort(() => Math.random() - 0.5)
      selected.push(...shuffled.slice(0, counts[t]))
    })
    setTestQuestions(selected.sort(() => Math.random() - 0.5))
    setActiveSession(session)
    setPhase('testing')
  }

  if (phase === 'testing') {
    return (
      <TestRunner
        questions={testQuestions}
        timeLimit={activeSession.timeLimit * 60}
        testType="midterm"
        sessionInfo={activeSession}
        onExit={() => { setPhase('list'); setActiveSession(null) }}
      />
    )
  }

  if (loadingSessions) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        加载中...
      </div>
    )
  }

  // 管理员：查看成绩
  if (isAdmin && view === 'results') {
    return <AdminResultsView onBack={() => setView('list')} />
  }

  // 管理员：创建测试
  if (isAdmin && view === 'create') {
    return (
      <div className="space-y-4 fade-in">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← 返回
          </button>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">发布新一期测试</h2>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">设置题目和时间范围</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 sm:space-y-5">
          <div>
            <h4 className="text-xs text-gray-500 mb-2">测试名称</h4>
            <input
              type="text"
              value={config.title}
              onChange={e => setConfig(p => ({ ...p, title: e.target.value }))}
              placeholder={`第 ${sessions.length + 1} 期中期测试`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-light text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs text-gray-500 mb-2">开始日期</h4>
              <input type="date" value={config.startDate} onChange={e => setConfig(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-light text-sm" />
            </div>
            <div>
              <h4 className="text-xs text-gray-500 mb-2">开始时间</h4>
              <input type="time" value={config.startTime} onChange={e => setConfig(p => ({ ...p, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-light text-sm" />
            </div>
            <div>
              <h4 className="text-xs text-gray-500 mb-2">结束日期</h4>
              <input type="date" value={config.endDate} onChange={e => setConfig(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-light text-sm" />
            </div>
            <div>
              <h4 className="text-xs text-gray-500 mb-2">结束时间</h4>
              <input type="time" value={config.endTime} onChange={e => setConfig(p => ({ ...p, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-light text-sm" />
            </div>
          </div>

          <div>
            <h4 className="text-xs text-gray-500 mb-2">题量</h4>
            <div className="grid grid-cols-4 gap-2">
              {COUNTS.map(c => (
                <button key={c} onClick={() => setConfig(p => ({ ...p, count: c }))}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${config.count === c ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {c}题
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs text-gray-500 mb-2">限时（分钟）</h4>
            <div className="grid grid-cols-3 gap-2">
              {TIMES.map(t => (
                <button key={t} onClick={() => setConfig(p => ({ ...p, timeLimit: t }))}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${config.timeLimit === t ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {t}分钟
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs text-gray-500 mb-2">题型</h4>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button key={t.key} onClick={() => toggleArr('types', t.key)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${config.types.includes(t.key) ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs text-gray-500 mb-2">难度</h4>
            <div className="flex gap-2">
              {DIFFS.map(d => (
                <button key={d.key} onClick={() => toggleArr('diffs', d.key)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${config.diffs.includes(d.key) ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={publishTest}
          disabled={publishing}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
          {publishing ? '发布中...' : '发布测试'}
        </button>
      </div>
    )
  }

  // 管理员：期次列表
  if (isAdmin) {
    return (
      <div className="space-y-4 fade-in">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">中期测试管理</h2>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">发布测试 · 查看成绩</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <button onClick={loadSessions} className="text-sm text-brand flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> 刷新
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setView('create')}
            className="py-3 bg-green-500 text-white rounded-xl font-medium text-sm hover:bg-green-600 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            发布新测试
          </button>
          <button
            onClick={() => setView('results')}
            className="py-3 bg-brand text-white rounded-xl font-medium text-sm hover:bg-brand-dark transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            查看成绩
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-700 text-sm">
            已发布期次（{sessions.length}）
          </div>
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂未发布任何期次</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions.map(s => {
                const active = isSessionActive(s)
                const expired = Date.now() > s.endTime
                return (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{s.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        active ? 'bg-green-100 text-green-600' :
                        expired ? 'bg-gray-100 text-gray-400' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {active ? '进行中' : expired ? '已结束' : '未开始'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {fmtDateTime(s.startTime)} ~ {fmtDateTime(s.endTime)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {s.count}题 / {s.timeLimit}分钟
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 普通用户：期次列表
  const activeSessions = sessions.filter(s => isSessionActive(s))
  const expiredSessions = sessions.filter(s => Date.now() > s.endTime)

  return (
    <div className="space-y-4 fade-in">
      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">中期测试</h2>
            <p className="text-white/70 text-xs sm:text-sm mt-0.5">选择期次参加测试</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <button onClick={loadSessions} className="text-sm text-brand flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> 刷新
        </button>
      </div>

      {/* 进行中的测试 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          进行中
        </h3>
        {activeSessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">暂无进行中的测试</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map(s => (
              <div key={s.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 text-sm">{s.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-600">可参加</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    截止 {fmtDateTime(s.endTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    {s.timeLimit}分钟
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    {s.count}题
                  </div>
                </div>
                <button
                  onClick={() => startTest(s)}
                  className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors active:scale-[0.98]"
                >
                  参加测试
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 已结束的测试 */}
      {expiredSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            已结束
          </h3>
          <div className="space-y-2">
            {expiredSessions.map(s => (
              <div key={s.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{s.title}</span>
                  <span className="text-[10px] text-gray-400">已结束</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {fmtDateTime(s.startTime)} ~ {fmtDateTime(s.endTime)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 管理员查看成绩视图
function AdminResultsView({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allResults, setAllResults] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const data = await getAllMidtermResults()
      setAllResults(data)
    } catch (e) {
      setError(e.message || '加载失败')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        加载成绩中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="fade-in">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm mb-3">← 返回</button>
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</div>
        <button onClick={loadData} className="mt-3 text-sm text-brand">重试</button>
      </div>
    )
  }

  if (!selectedSession) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
          <button onClick={loadData} className="text-sm text-brand flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>

        <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-4 sm:p-5 text-white shadow-lg mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <h2 className="text-lg font-bold">测试成绩</h2>
          </div>
          <p className="text-white/70 text-xs mt-1">共 {allResults.length} 期测试</p>
        </div>

        {allResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">暂无成绩数据</p>
            <p className="text-xs text-gray-400 mt-1">用户参加测试并上传后，成绩会显示在这里</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allResults.map(item => {
              const records = item.records || []
              const bestByUser = {}
              records.forEach(r => {
                if (!bestByUser[r.name] || r.score > bestByUser[r.name].score) {
                  bestByUser[r.name] = r
                }
              })
              const sorted = Object.values(bestByUser).sort((a, b) => b.score - a.score)
              return (
                <div key={item.sessionId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button onClick={() => setSelectedSession(item)} className="w-full text-left">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 text-sm">{item.sessionInfo?.title || '未命名测试'}</span>
                        <span className="text-xs text-gray-400">{records.length} 次提交 →</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 truncate">
                        {records.length > 0 && `最高分: ${sorted[0]?.score || 0}（${sorted[0]?.name || ''}）`}
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // 单期成绩详情
  const records = selectedSession.records || []
  const bestByUser = {}
  records.forEach(r => {
    if (!bestByUser[r.name] || r.score > bestByUser[r.name].score) {
      bestByUser[r.name] = r
    }
  })
  const sorted = Object.values(bestByUser).sort((a, b) => b.score - a.score)
  const allNames = [...new Set(records.map(r => r.name))]

  return (
    <div className="fade-in">
      <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-gray-600 text-sm mb-3">
        ← 返回期次列表
      </button>

      <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-4 sm:p-5 text-white shadow-lg mb-4">
        <h2 className="text-lg font-bold">{selectedSession.sessionInfo?.title}</h2>
        <p className="text-white/70 text-xs mt-1">
          {selectedSession.sessionInfo?.count}题 / {selectedSession.sessionInfo?.timeLimit}分钟
        </p>
        <div className="flex gap-4 mt-3 text-sm">
          <span>参与人数: {allNames.length}</span>
          <span>提交次数: {records.length}</span>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-700 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-500" />
            成绩排行（按最高分）
          </div>
          <div className="divide-y divide-gray-50">
            {sorted.map((r, idx) => (
              <div key={`${r.name}_${r.createdAt}`} className="flex items-center px-4 py-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mr-3 ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-gray-200 text-gray-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 truncate">{r.name}</div>
                  <div className="text-xs text-gray-400">
                    正确率 {r.accuracy}% · 用时 {Math.floor(r.duration / 60)}分{String(r.duration % 60).padStart(2, '0')}秒
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-brand font-mono">{r.score}</div>
                  <div className="text-xs text-gray-400">/ {r.totalScore}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length > Object.keys(bestByUser).length && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-700 text-sm">
            全部提交记录（{records.length}）
          </div>
          <div className="divide-y divide-gray-50">
            {records.slice().reverse().map((r, i) => (
              <div key={i} className="flex items-center px-4 py-2.5 text-sm">
                <span className="flex-1 text-gray-700 truncate">{r.name}</span>
                <span className="text-gray-400 text-xs mr-3 flex-shrink-0">
                  {new Date(r.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-mono font-medium text-brand flex-shrink-0">{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <XCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">暂无上传成绩</p>
        </div>
      )}
    </div>
  )
}