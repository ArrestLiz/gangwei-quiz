import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'

const TYPE_LABELS = { single: '单选题', multi: '多选题', judge: '判断题' }
const DIFF_LABELS = { easy: '较易', medium: '中等', hard: '较难' }
const DIFF_COLORS = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' }

function getOptionLetter(question, index) {
  if (question.type === 'judge') return index === 0 ? '对' : '错'
  return String.fromCharCode(65 + index)
}

function isOptionSelected(question, index, answer) {
  if (!answer) return false
  const letter = getOptionLetter(question, index)
  if (question.type === 'multi') return answer.includes(letter)
  return answer === letter
}

function isOptionCorrect(question, index) {
  const letter = getOptionLetter(question, index)
  if (question.type === 'multi') return question.answer.includes(letter)
  return question.answer === letter
}

function checkAnswer(userAnswer, correctAnswer, type) {
  if (!userAnswer) return false
  if (type === 'multi') {
    return userAnswer.split('').sort().join('') === correctAnswer.split('').sort().join('')
  }
  return userAnswer === correctAnswer
}

export default function QuestionCard({
  question,
  index,
  total,
  userAnswer,
  onAnswer,
  showResult,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  nextLabel = '下一题',
}) {
  const isMulti = question.type === 'multi'
  const isLocked = showResult && userAnswer !== null && userAnswer !== undefined && userAnswer !== ''
  const isCorrect = isLocked && checkAnswer(userAnswer, question.answer, question.type)

  const [multiSel, setMultiSel] = useState([])

  useEffect(() => {
    if (isMulti && userAnswer) setMultiSel(userAnswer.split(''))
    else setMultiSel([])
  }, [question.id, userAnswer, isMulti])

  function toggleOption(idx) {
    if (isLocked) return
    const letter = getOptionLetter(question, idx)
    if (isMulti) {
      const next = multiSel.includes(letter)
        ? multiSel.filter(l => l !== letter)
        : [...multiSel, letter].sort()
      setMultiSel(next)
      if (!showResult) onAnswer(next.join(''))
    } else {
      onAnswer(letter)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 fade-in" key={question.id}>
      {/* 头部标签 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {TYPE_LABELS[question.type]}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFF_COLORS[question.difficulty]}`}>
          {DIFF_LABELS[question.difficulty]}
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          {question.score}分
        </span>
        <span className="ml-auto text-sm text-gray-400 font-mono">
          {index + 1}/{total}
        </span>
      </div>

      {/* 题干 */}
      <div className="selectable text-gray-800 leading-relaxed mb-5 whitespace-pre-wrap">
        {question.stem}
      </div>

      {/* 选项 */}
      <div className="space-y-2.5">
        {question.options.map((opt, idx) => {
          const letter = getOptionLetter(question, idx)
          const selected = isLocked
            ? isOptionSelected(question, idx, userAnswer)
            : (isMulti ? multiSel.includes(letter) : isOptionSelected(question, idx, userAnswer))
          const correct = isOptionCorrect(question, idx)
          let cls = 'border-gray-200 bg-white'
          if (isLocked) {
            if (correct) cls = 'border-green-400 bg-green-50'
            else if (selected && !correct) cls = 'border-red-400 bg-red-50'
          } else if (selected) {
            cls = 'border-brand-light bg-blue-50'
          }
          return (
            <button
              key={idx}
              onClick={() => toggleOption(idx)}
              disabled={isLocked}
              className={`option-btn w-full text-left px-4 py-3 border-2 rounded-lg flex items-start gap-3 ${cls}`}
            >
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                ${selected || (isLocked && correct) ? 'text-white' : 'text-gray-500'}
                ${isLocked && correct ? 'bg-green-500' : isLocked && selected && !correct ? 'bg-red-500' : selected ? 'bg-brand-light' : 'bg-gray-100'}`}
              >
                {question.type === 'judge' ? (idx === 0 ? '✓' : '✗') : letter}
              </span>
              <span className="selectable flex-1 text-gray-700">{opt}</span>
              {isLocked && correct && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
              {isLocked && selected && !correct && <X className="w-5 h-5 text-red-500 flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* 多选题确认按钮 */}
      {isMulti && !isLocked && showResult && (
        <button
          onClick={() => multiSel.length > 0 && onAnswer(multiSel.sort().join(''))}
          disabled={multiSel.length === 0}
          className="w-full mt-4 py-2.5 bg-brand text-white rounded-lg font-medium disabled:opacity-40 hover:bg-brand-dark transition-colors"
        >
          确认答案
        </button>
      )}

      {/* 结果反馈 */}
      {isLocked && (
        <div className={`mt-4 p-4 rounded-lg fade-in ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
            <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '回答正确' : '回答错误'}
            </span>
            {!isCorrect && (
              <span className="text-sm text-gray-500">
                正确答案: <span className="font-medium text-gray-700">{question.answer}</span>
              </span>
            )}
          </div>
          {question.analysis && (
            <p className="selectable text-sm text-gray-600 leading-relaxed">{question.analysis}</p>
          )}
        </div>
      )}

      {/* 导航按钮 */}
      {(onPrev || onNext) && (
        <div className="flex gap-3 mt-5">
          {onPrev && (
            <button
              onClick={onPrev}
              disabled={!canPrev}
              className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-lg font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              上一题
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              disabled={!canNext}
              className="flex-1 py-2.5 bg-brand text-white rounded-lg font-medium disabled:opacity-40 hover:bg-brand-dark transition-colors"
            >
              {nextLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
