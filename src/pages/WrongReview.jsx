import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import QuestionCard from '../components/QuestionCard'
import { RotateCcw, ChevronLeft, Inbox } from 'lucide-react'

export default function WrongReview() {
  const { questions, wrongBook, recordProgress, removeFromWrong } = useApp()
  const [session, setSession] = useState(false)
  const [idx, setIdx] = useState(0)
  const [sessionAnswers, setSessionAnswers] = useState({})
  const [removedCount, setRemovedCount] = useState(0)

  const wrongQuestions = useMemo(() => {
    if (!questions) return []
    const ids = Object.keys(wrongBook).map(Number)
    return questions.filter(q => ids.includes(q.id))
  }, [questions, wrongBook])

  if (!session) {
    // 概览页
    return (
      <div className="space-y-4 fade-in">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">错题本</p>
              <p className="text-3xl font-bold">{wrongQuestions.length}</p>
            </div>
          </div>
          <p className="text-white/70 text-sm">反复重做错题，巩固薄弱知识点</p>
        </div>

        {wrongQuestions.length > 0 ? (
          <button
            onClick={() => {
              setSession(true)
              setIdx(0)
              setSessionAnswers({})
              setRemovedCount(0)
            }}
            className="w-full py-3.5 bg-brand text-white rounded-xl font-medium text-lg hover:bg-brand-dark transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            开始重刷
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无错题</p>
            <p className="text-sm text-gray-400 mt-1">去刷题积累错题吧</p>
          </div>
        )}
      </div>
    )
  }

  // 答题页
  if (wrongQuestions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">所有错题已重刷完毕！</p>
        <button onClick={() => setSession(false)} className="mt-4 px-6 py-2 bg-brand text-white rounded-lg">
          返回
        </button>
      </div>
    )
  }

  const q = wrongQuestions[idx]
  if (!q) {
    // 全部完成
    return (
      <div className="text-center py-12 fade-in">
        <div className="inline-flex w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
          <RotateCcw className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-lg font-medium text-gray-800">重刷完成！</p>
        <p className="text-sm text-gray-500 mt-1">本次移除错题 {removedCount} 道</p>
        <button
          onClick={() => setSession(false)}
          className="mt-4 px-6 py-2 bg-brand text-white rounded-lg font-medium"
        >
          返回错题本
        </button>
      </div>
    )
  }

  function handleAnswer(ans) {
    const isCorrect = checkAnswer(ans, q.answer, q.type)
    setSessionAnswers(prev => ({ ...prev, [q.id]: ans }))
    if (isCorrect) {
      removeFromWrong(q.id)
      setRemovedCount(c => c + 1)
    } else {
      recordProgress(q.id, q.type, false)
    }
  }

  const answered = sessionAnswers[q.id] !== undefined

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-3 mb-4 flex items-center gap-3">
        <button onClick={() => setSession(false)} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>错题重刷</span>
            <span className="font-mono">剩余 {wrongQuestions.length - idx} 题</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${((idx + 1) / wrongQuestions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        index={idx}
        total={wrongQuestions.length}
        userAnswer={sessionAnswers[q.id] || null}
        onAnswer={handleAnswer}
        showResult={true}
        onNext={() => setIdx(i => i + 1)}
        canNext={answered}
        nextLabel="下一题"
      />
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
