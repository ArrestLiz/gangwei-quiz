import { useState, useEffect, useRef } from 'react'
import QuestionCard from './QuestionCard'
import { useApp } from '../context/AppContext'
import { saveTestRecord } from '../utils/storage'
import { Clock, CheckCircle, XCircle, ChevronLeft } from 'lucide-react'

export default function TestRunner({ questions, timeLimit, testType, onExit }) {
  const { recordProgress, currentUser } = useApp()
  const [phase, setPhase] = useState('testing')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef(null)

  // 用 ref 保存最新 answers，避免 setInterval 闭包过期
  const answersRef = useRef(answers)
  answersRef.current = answers

  useEffect(() => {
    if (phase !== 'testing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  function setAnswer(qid, answer) {
    setAnswers(prev => ({ ...prev, [qid]: answer }))
  }

  function handleSubmit() {
    clearInterval(timerRef.current)
    const currentAnswers = answersRef.current
    let correct = 0
    let score = 0
    questions.forEach(q => {
      const ua = currentAnswers[q.id]
      const isCorrect = ua && checkAnswer(ua, q.answer, q.type)
      if (isCorrect) {
        correct++
        score += q.score
      }
      recordProgress(q.id, q.type, !!isCorrect, ua)
    })
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const record = {
      id: `${testType}_${Date.now()}`,
      type: testType,
      questionIds: questions.map(q => q.id),
      answers: currentAnswers,
      score,
      totalScore: questions.reduce((s, q) => s + q.score, 0),
      correctCount: correct,
      totalCount: questions.length,
      duration,
      createdAt: Date.now(),
    }
    saveTestRecord(currentUser.id, record)
    setResult(record)
    setPhase('result')
  }

  if (phase === 'result' && result) {
    return <TestResult result={result} questions={questions} answers={answersRef.current} onExit={onExit} />
  }

  const q = questions[currentIdx]
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length

  return (
    <div>
      {/* 顶部固定栏 */}
      <div className="sticky top-0 z-10 bg-white rounded-xl shadow-sm p-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-medium ${
            timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
          }`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-500">
            已答 {answeredCount}/{questions.length}
          </div>
          <button
            onClick={handleSubmit}
            className="ml-auto px-4 py-1.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            交卷
          </button>
        </div>
        {/* 题号导航条 */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
          {questions.map((qq, i) => {
            const answered = answers[qq.id]
            return (
              <button
                key={qq.id}
                onClick={() => setCurrentIdx(i)}
                className={`flex-shrink-0 w-8 h-8 rounded text-xs font-medium transition-colors ${
                  i === currentIdx
                    ? 'bg-brand text-white'
                    : answered
                    ? 'bg-brand-light/20 text-brand'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* 答题区 */}
      <QuestionCard
        key={q.id}
        question={q}
        index={currentIdx}
        total={questions.length}
        userAnswer={answers[q.id] || null}
        onAnswer={ans => setAnswer(q.id, ans)}
        showResult={false}
        onPrev={() => setCurrentIdx(i => Math.max(0, i - 1))}
        onNext={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
        canPrev={currentIdx > 0}
        canNext={currentIdx < questions.length - 1}
        nextLabel={currentIdx === questions.length - 1 ? '最后一题' : '下一题'}
      />
    </div>
  )
}

function TestResult({ result, questions, answers, onExit }) {
  const [expanded, setExpanded] = useState(null)
  const correctRate = Math.round((result.correctCount / result.totalCount) * 100)

  return (
    <div className="fade-in">
      {/* 分数展示 */}
      <div className="bg-white rounded-xl shadow-sm p-6 text-center mb-4">
        <p className="text-gray-500 text-sm mb-2">测试成绩</p>
        <div className="text-5xl font-bold text-brand font-mono mb-1">{result.score}</div>
        <p className="text-gray-400 text-sm">/ {result.totalScore} 分</p>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{result.correctCount}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">答对</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-red-500">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">{result.totalCount - result.correctCount}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">答错</p>
          </div>
          <div className="text-center">
            <div className="text-brand font-medium">{correctRate}%</div>
            <p className="text-xs text-gray-400 mt-0.5">正确率</p>
          </div>
          <div className="text-center">
            <div className="text-gray-600 font-mono font-medium">
              {Math.floor(result.duration / 60)}'{String(result.duration % 60).padStart(2, '0')}"
            </div>
            <p className="text-xs text-gray-400 mt-0.5">用时</p>
          </div>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-700">题目回顾</div>
        {questions.map((q, i) => {
          const ua = answers[q.id]
          const isCorrect = ua && checkAnswer(ua, q.answer, q.type)
          return (
            <div key={q.id} className="border-b border-gray-50">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  isCorrect ? 'bg-green-100 text-green-600' : ua ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-600 truncate">
                  {q.stem.slice(0, 40)}...
                </span>
                {isCorrect ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
              </button>
              {expanded === i && (
                <div className="px-4 pb-4 fade-in">
                  <div className="selectable text-sm text-gray-700 mb-2">{q.stem}</div>
                  <div className="text-xs space-y-1 mb-2">
                    {q.options.map((opt, idx) => {
                      const letter = q.type === 'judge' ? (idx === 0 ? '对' : '错') : String.fromCharCode(65 + idx)
                      const isAns = q.type === 'multi' ? q.answer.includes(letter) : q.answer === letter
                      const isUser = ua && (q.type === 'multi' ? ua.includes(letter) : ua === letter)
                      return (
                        <div key={idx} className={`px-2 py-1 rounded ${isAns ? 'text-green-700 bg-green-50' : isUser ? 'text-red-600 bg-red-50' : 'text-gray-500'}`}>
                          {letter}. {opt} {isAns && '✓'} {isUser && !isAns && '✗'}
                        </div>
                      )
                    })}
                  </div>
                  {q.analysis && <p className="selectable text-xs text-gray-500 bg-gray-50 p-2 rounded">{q.analysis}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onExit}
        className="w-full mt-4 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark"
      >
        返回
      </button>
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
