import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import TestRunner from '../components/TestRunner'
import { ChevronLeft, FileText, Settings } from 'lucide-react'

const COUNTS = [10, 20, 50, 100]
const TYPES = [
  { key: 'single', label: '单选' },
  { key: 'multi', label: '多选' },
  { key: 'judge', label: '判断' },
]
const DIFFS = [
  { key: 'easy', label: '较易' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '较难' },
]

export default function CustomTest() {
  const { questions } = useApp()
  const [phase, setPhase] = useState('config') // config | testing
  const [config, setConfig] = useState({
    count: 20,
    types: ['single', 'multi', 'judge'],
    diffs: ['easy', 'medium', 'hard'],
  })
  const [testQuestions, setTestQuestions] = useState([])

  const filtered = useMemo(() => {
    if (!questions) return []
    return questions.filter(q => config.types.includes(q.type) && config.diffs.includes(q.difficulty))
  }, [questions, config])

  function startTest() {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(config.count, shuffled.length))
    setTestQuestions(selected)
    setPhase('testing')
  }

  if (phase === 'testing') {
    return <TestRunner
      questions={testQuestions}
      timeLimit={config.count * 60}
      testType="custom"
      onExit={() => setPhase('config')}
    />
  }

  function toggleArr(key, val) {
    setConfig(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val],
    }))
  }

  return (
    <div className="space-y-4 fade-in">
      <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">组卷测试</h2>
            <p className="text-white/70 text-sm mt-0.5">自定义题型、难度、题量</p>
          </div>
        </div>
      </div>

      {/* 配置面板 */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">题量</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {COUNTS.map(c => (
              <button
                key={c}
                onClick={() => setConfig(prev => ({ ...prev, count: c }))}
                className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  config.count === c ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {c}题
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">题型</h3>
          <div className="flex gap-2">
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => toggleArr('types', t.key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  config.types.includes(t.key) ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">难度</h3>
          <div className="flex gap-2">
            {DIFFS.map(d => (
              <button
                key={d.key}
                onClick={() => toggleArr('diffs', d.key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  config.diffs.includes(d.key) ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 可选题数提示 */}
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <p className="text-sm text-blue-600">
          可选题库: <span className="font-bold">{filtered.length}</span> 题
          {filtered.length < config.count && (
            <span className="text-orange-500 ml-2">（不足{config.count}题，将全部使用）</span>
          )}
        </p>
      </div>

      <button
        onClick={startTest}
        disabled={filtered.length === 0}
        className="w-full py-3.5 bg-brand text-white rounded-xl font-medium text-lg hover:bg-brand-dark transition-colors active:scale-[0.98] disabled:opacity-40"
      >
        开始测试（限时{config.count}分钟）
      </button>
    </div>
  )
}
