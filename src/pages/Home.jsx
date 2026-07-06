import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BookOpen, RotateCcw, FileText, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react'

const TYPE_INFO = [
  { key: 'single', label: '单选题', color: 'bg-blue-500' },
  { key: 'multi', label: '多选题', color: 'bg-purple-500' },
  { key: 'judge', label: '判断题', color: 'bg-teal-500' },
]

const FEATURES = [
  { to: '/practice', label: '顺序刷题', desc: '按题型逐题练习', icon: BookOpen, color: 'bg-blue-500' },
  { to: '/wrong', label: '错题重刷', desc: '重做错题巩固', icon: RotateCcw, color: 'bg-orange-500' },
  { to: '/test', label: '组卷测试', desc: '自定义随机组卷', icon: FileText, color: 'bg-green-500' },
  { to: '/midterm', label: '中期测试', desc: '模拟竞赛场景', icon: GraduationCap, color: 'bg-red-500' },
]

export default function Home() {
  const { questions, progress, wrongBook } = useApp()

  const stats = useMemo(() => {
    if (!questions) return null
    const byType = { single: 0, multi: 0, judge: 0 }
    questions.forEach(q => { if (byType[q.type] !== undefined) byType[q.type]++ })
    const doneCount = progress.single.length + progress.multi.length + progress.judge.length
    const wrongCount = Object.keys(wrongBook).length
    return {
      total: questions.length,
      done: doneCount,
      wrong: wrongCount,
      types: TYPE_INFO.map(t => ({ ...t, total: byType[t.key], done: progress[t.key].length })),
    }
  }, [questions, progress, wrongBook])

  if (!stats) return null

  const doneRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="space-y-4 fade-in">
      {/* 学习概览卡片 */}
      <div className="bg-gradient-to-br from-brand to-brand-light rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm">学习概览</p>
            <p className="text-2xl font-bold mt-1">{stats.done} <span className="text-base text-white/60 font-normal">/ {stats.total}</span></p>
            <p className="text-white/70 text-xs mt-0.5">已练习题数</p>
          </div>
          {/* 环形进度 */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="white" strokeWidth="6"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - doneRate / 100)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {doneRate}%
            </div>
          </div>
        </div>
        <div className="flex gap-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-white/70" />
            <span className="text-sm">已练 {stats.done}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-white/70" />
            <span className="text-sm">错题 {stats.wrong}</span>
          </div>
        </div>
      </div>

      {/* 题型进度 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">题型进度</h3>
        <div className="space-y-3">
          {stats.types.map(t => {
            const rate = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0
            return (
              <div key={t.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{t.label}</span>
                  <span className="text-gray-400 font-mono">{t.done}/{t.total}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${t.color} rounded-full transition-all duration-500`} style={{ width: `${rate}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 功能入口 */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURES.map(f => (
          <Link
            key={f.to}
            to={f.to}
            className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-start hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center mb-2`}>
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-medium text-gray-800">{f.label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
