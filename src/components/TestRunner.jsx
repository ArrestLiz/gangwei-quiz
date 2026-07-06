import { useState, useEffect, useRef } from 'react'
import QuestionCard from './QuestionCard'
import { useApp } from '../context/AppContext'
import { saveTestRecord } from '../utils/storage'
import { uploadMidtermResult } from '../utils/sync'
import { Clock, CheckCircle, XCircle, ChevronLeft, Upload, Loader2, AlertTriangle } from 'lucide-react'

export default function TestRunner({ questions, timeLimit, testType, onExit, sessionInfo }) {
  const { recordProgress, currentUser, userName } = useApp()
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
      // 中期测试：只有错题计入已刷题+错题本，正确题不计入
      if (testType === 'midterm') {
        if (!isCorrect) {
          recordProgress(q.id, q.type, false, ua)
        }
      } else {
        // 普通组卷测试：全部计入
        recordProgress(q.id, q.type, !!isCorrect, ua)
      }
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
    return (
      <TestResult
        result={result}
        questions={questions}
        answers={answersRef.current}
        onExit={onExit}
        testType={testType}
        sessionInfo={sessionInfo}
      />
    )
  }

  const q = questions[currentIdx]
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length

  return (
    <div>
      {/* 顶部固定栏 */}
      <div className="sticky top-0 z-10 bg-white rounded-xl shadow-sm p-2 sm:p-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onExit} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg font-mono font-medium text-xs sm:text-sm ${
            timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
          }`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            已答 {answeredCount}/{questions.length}
          </div>
          <button
            onClick={handleSubmit}
            className="ml-auto px-3 sm:px-4 py-1.5 bg-brand text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-dark"
          >
            交卷
          </button>
        </div>
        {/* 题号导航条 */}
        <div className="flex gap-1 sm:gap-1.5 mt-2 sm:mt-3 overflow-x-auto pb-1">
          {questions.map((qq, i) => {
            const answered = answers[qq.id]
            return (
              <button
                key={qq.id}
                onClick={() => setCurrentIdx(i)}
                className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded text-[10px] sm:text-xs font-medium transition-colors ${
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

function TestResult({ result, questions, answers, onExit, testType, sessionInfo }) {
  const { userName } = useApp()
  const [expanded, setExpanded] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const correctRate = Math.round((result.correctCount / result.totalCount) * 100)

  // 中期测试：自动提交并阻塞
  const isMidterm = testType === 'midterm' && sessionInfo
  useEffect(() => {
    if (!isMidterm) return
    if (uploadSuccess || uploadError) return
    handleAutoUpload()
  }, [isMidterm])

  async function handleAutoUpload() {
    setUploading(true)
    setUploadError('')
    try {
      await uploadMidtermResult(sessionInfo.id, sessionInfo, {
        name: userName || '未署名',
        score: result.score,
        totalScore: result.totalScore,
        correctCount: result.correctCount,
        totalCount: result.totalCount,
        accuracy: correctRate,
        duration: result.duration,
        createdAt: result.createdAt,
      })
      setUploadSuccess(true)
    } catch (e) {
      setUploadError(e.message || '上传失败，请检查网络')
    }
    setUploading(false)
  }

  // 中期测试提交阻塞遮罩
  if (isMidterm && !uploadSuccess && !uploadError) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center fade-in">
          <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-brand animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">正在提交成绩</h3>
          <p className="text-sm text-gray-500 mb-4">
            正在将 {userName} 的成绩上传到云端，请稍候...
          </p>
          <div className="flex items-center justify-center gap-2 text-brand">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">上传中...</span>
          </div>
        </div>
      </div>
    )
  }

  // 中期测试上传失败遮罩
  if (isMidterm && uploadError) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center fade-in">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">上传失败</h3>
          <p className="text-sm text-red-500 mb-4">{uploadError}</p>
          <div className="flex gap-2">
            <button
              onClick={handleAutoUpload}
              className="flex-1 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
            >
              重试
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              跳过
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* 分数展示 */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center mb-3 sm:mb-4">
        <p className="text-gray-500 text-xs sm:text-sm mb-2">测试成绩</p>
        <div className="text-4xl sm:text-5xl font-bold text-brand font-mono mb-1">{result.score}</div>
        <p className="text-gray-400 text-xs sm:text-sm">/ {result.totalScore} 分</p>
        <div className="flex justify-center gap-4 sm:gap-6 mt-3 sm:mt-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium text-sm sm:text-base">{result.correctCount}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">答对</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-red-500">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium text-sm sm:text-base">{result.totalCount - result.correctCount}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">答错</p>
          </div>
          <div className="text-center">
            <div className="text-brand font-medium text-sm sm:text-base">{correctRate}%</div>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">正确率</p>
          </div>
          <div className="text-center">
            <div className="text-gray-600 font-mono font-medium text-xs sm:text-sm">
              {Math.floor(result.duration / 60)}'{String(result.duration % 60).padStart(2, '0')}"
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">用时</p>
          </div>
        </div>
      </div>

      {/* 中期测试：上传成功提示 */}
      {isMidterm && uploadSuccess && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-3 sm:mb-4">
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {userName} 的成绩已上传！管理员可以查看到你的测试结果。
          </div>
        </div>
      )}

      {/* 非中期测试：上传成绩 */}
      {!isMidterm && testType === 'midterm' && sessionInfo && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-medium text-gray-700">上传成绩</h3>
          </div>
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            成绩已上传！
          </div>
        </div>
      )}

      {/* 题目列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-700 text-sm">题目回顾</div>
        {questions.map((q, i) => {
          const ua = answers[q.id]
          const isCorrect = ua && checkAnswer(ua, q.answer, q.type)
          return (
            <div key={q.id} className="border-b border-gray-50">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50"
              >
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                  isCorrect ? 'bg-green-100 text-green-600' : ua ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-xs sm:text-sm text-gray-600 truncate">
                  {q.stem.slice(0, 40)}...
                </span>
                {isCorrect ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" /> : <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />}
              </button>
              {expanded === i && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 fade-in">
                  <div className="selectable text-xs sm:text-sm text-gray-700 mb-2">{q.stem}</div>
                  <div className="text-[10px] sm:text-xs space-y-1 mb-2">
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
                  {q.analysis && <p className="selectable text-[10px] sm:text-xs text-gray-500 bg-gray-50 p-2 rounded">{q.analysis}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onExit}
        className="w-full mt-3 sm:mt-4 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark text-sm"
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