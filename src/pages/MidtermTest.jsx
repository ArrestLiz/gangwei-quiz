import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import TestRunner from '../components/TestRunner'
import { getMidtermConfig, saveMidtermConfig } from '../utils/storage'
import { GraduationCap, Clock, FileText, Award, Shield, Settings, CheckCircle } from 'lucide-react'

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

export default function MidtermTest() {
  const { questions, currentUser } = useApp()
  const isAdmin = currentUser?.role === 'admin'
  const [phase, setPhase] = useState('intro')
  const [testQuestions, setTestQuestions] = useState([])
  const [published, setPublished] = useState(getMidtermConfig())
  const [config, setConfig] = useState(published || {
    count: 50,
    timeLimit: 60,
    types: ['single', 'multi', 'judge'],
    diffs: ['easy', 'medium', 'hard'],
  })
  const [justPublished, setJustPublished] = useState(false)

  const availableCount = useMemo(() => {
    if (!questions) return 0
    return Math.min(config.count, questions.filter(q =>
      config.types.includes(q.type) && config.diffs.includes(q.difficulty)
    ).length)
  }, [questions, config])

  function publishTest() {
    saveMidtermConfig(config)
    setPublished(config)
    setJustPublished(true)
    setTimeout(() => setJustPublished(false), 3000)
  }

  function toggleArr(key, val) {
    setConfig(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val],
    }))
  }

  function startTest(testConfig) {
    const filtered = questions.filter(q =>
      testConfig.types.includes(q.type) && testConfig.diffs.includes(q.difficulty)
    )
    // 按比例从各题型中抽题
    const byType = { single: [], multi: [], judge: [] }
    filtered.forEach(q => { if (byType[q.type]) byType[q.type].push(q) })
    const total = filtered.length
    const counts = {}
    Object.keys(byType).forEach(t => {
      counts[t] = Math.round((byType[t].length / total) * testConfig.count)
    })
    let sum = Object.values(counts).reduce((a, b) => a + b, 0)
    while (sum < testConfig.count && sum < total) {
      const max = Object.keys(byType).reduce((a, b) => byType[a].length > byType[b].length ? a : b)
      if (counts[max] < byType[max].length) { counts[max]++; sum++ } else break
    }
    const selected = []
    Object.keys(byType).forEach(t => {
      const shuffled = [...byType[t]].sort(() => Math.random() - 0.5)
      selected.push(...shuffled.slice(0, counts[t]))
    })
    setTestQuestions(selected.sort(() => Math.random() - 0.5))
    setPhase('testing')
  }

  if (phase === 'testing') {
    return <TestRunner
      questions={testQuestions}
      timeLimit={config.timeLimit * 60}
      testType="midterm"
      onExit={() => setPhase('intro')}
    />
  }

  // 普通用户：未发布测试
  if (!isAdmin && !published) {
    return (
      <div className="space-y-4 fade-in">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">中期测试</h2>
              <p className="text-white/70 text-sm mt-0.5">模拟竞赛场景</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无发布的测试</p>
          <p className="text-sm text-gray-400 mt-1">请等待管理员发布中期测试</p>
        </div>
      </div>
    )
  }

  // 普通用户：已发布测试
  if (!isAdmin && published) {
    return (
      <div className="space-y-4 fade-in">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">中期测试</h2>
              <p className="text-white/70 text-sm mt-0.5">管理员已发布测试，请参加</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">题量: {published.count} 题</p>
              <p className="text-xs text-gray-400">全题型混合</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">限时: {published.timeLimit} 分钟</p>
              <p className="text-xs text-gray-400">超时自动交卷</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => startTest(published)}
          className="w-full py-3.5 bg-red-500 text-white rounded-xl font-medium text-lg hover:bg-red-600 transition-colors active:scale-[0.98]"
        >
          参加测试
        </button>
      </div>
    )
  }

  // 管理员：配置并发布
  return (
    <div className="space-y-4 fade-in">
      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">中期测试管理</h2>
            <p className="text-white/70 text-sm mt-0.5">配置并发布中期测试</p>
          </div>
        </div>
      </div>

      {published && (
        <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">已发布测试: {published.count}题 / {published.timeLimit}分钟</span>
        </div>
      )}

      {justPublished && (
        <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2 fade-in">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">发布成功！普通用户现在可以参加测试</span>
        </div>
      )}

      {/* 配置面板 */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-5">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">测试配置</h3>
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

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-sm text-blue-600">
          可选题库: <span className="font-bold">{availableCount}</span> 题
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={publishTest}
          className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Shield className="w-5 h-5" />
          发布测试
        </button>
        <button
          onClick={() => startTest(config)}
          disabled={availableCount === 0}
          className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors active:scale-[0.98] disabled:opacity-40"
        >
          开始测试
        </button>
      </div>
    </div>
  )
}
