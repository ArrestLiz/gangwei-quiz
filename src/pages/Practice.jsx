import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import QuestionCard from '../components/QuestionCard'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'

const TYPES = [
  { key: 'single', label: '单选题', desc: '单选唯一答案' },
  { key: 'multi', label: '多选题', desc: '多选有两个及以上正确答案' },
  { key: 'judge', label: '判断题', desc: '判断对错' },
]

export default function Practice() {
  const { questions, progress, recordProgress } = useApp()
  const [activeType, setActiveType] = useState(null)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})

  const typeQuestions = useMemo(() => {
    if (!questions || !activeType) return []
    return questions.filter(q => q.type === activeType)
  }, [questions, activeType])

  if (!activeType) {
    // 题型选择页
    return (
      <div className="space-y-3 fade-in">
        <h2 className="text-lg font-bold text-gray-800 mb-2">选择题型</h2>
        {TYPES.map(t => {
          const total = questions?.filter(q => q.type === t.key).length || 0
          const done = progress[t.key].length
          const rate = total > 0 ? Math.round((done / total) * 100) : 0
          return (
            <button
              key={t.key}
              onClick={() => {
                setActiveType(t.key)
                setIdx(progress[t.key].length >= total ? 0 : progress[t.key].length)
                setAnswers({})
              }}
              className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98] text-left"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{t.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-light rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{done}/{total}</span>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
            </button>
          )
        })}
      </div>
    )
  }

  // 答题页
  if (typeQuestions.length === 0) return null

  const q = typeQuestions[idx]
  const isLast = idx === typeQuestions.length - 1
  const doneCount = Object.keys(answers).length

  function handleAnswer(ans) {
    const question = typeQuestions[idx]
    const isCorrect = checkAnswer(ans, question.answer, question.type)
    setAnswers(prev => ({ ...prev, [question.id]: ans }))
    recordProgress(question.id, question.type, isCorrect, ans)
  }

  return (
    <div>
      {/* 顶部进度 */}
      <div className="bg-white rounded-xl shadow-sm p-3 mb-4 flex items-center gap-3">
        <button onClick={() => setActiveType(null)} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{TYPES.find(t => t.key === activeType).label}</span>
            <span className="font-mono">{idx + 1} / {typeQuestions.length}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-light rounded-full transition-all"
              style={{ width: `${((idx + 1) / typeQuestions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        index={idx}
        total={typeQuestions.length}
        userAnswer={answers[q.id] || null}
        onAnswer={handleAnswer}
        showResult={true}
        onPrev={() => setIdx(i => Math.max(0, i - 1))}
        onNext={() => setIdx(i => Math.min(typeQuestions.length - 1, i + 1))}
        canPrev={idx > 0}
        canNext={idx < typeQuestions.length - 1}
        nextLabel={isLast ? '已是最后一题' : '下一题'}
      />

      {isLast && Object.keys(answers).length > 0 && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl text-center fade-in">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">本次练习完成！</p>
          <p className="text-sm text-gray-500 mt-1">共练习 {doneCount} 题</p>
          <button
            onClick={() => setActiveType(null)}
            className="mt-3 px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            返回题型选择
          </button>
        </div>
      )}
    </div>
  )
}

function checkAnswer(userAnswer, correctAnswer, type) {
  if (!userAnswer) return false
  if (type === 'multi') {
    return userAnswer.split('').sort().join('') === correctAnswer.split('').sort().join('')
  }
  return userAnswer === correctAnswer
}
