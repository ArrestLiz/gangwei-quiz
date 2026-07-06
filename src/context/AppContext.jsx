import { createContext, useContext, useState, useCallback } from 'react'
import { decryptQuestions } from '../utils/crypto'
import { findAccount } from '../data/accounts'
import { getProgress, saveProgress, getWrongBook, saveWrongBook } from '../utils/storage'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [questions, setQuestions] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [userName, setUserName] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [progress, setProgress] = useState({ single: [], multi: [], judge: [] })
  const [wrongBook, setWrongBook] = useState({})

  const login = useCallback(async (accountId, password, name) => {
    setUnlocking(true)
    const account = findAccount(accountId)
    if (!account) {
      setUnlocking(false)
      return { ok: false, error: '账号不存在' }
    }
    const k = atob('Z3dsYjIwMjY=')
    const expected = account.role === 'admin' ? atob('Z2x5MjAyNg==') : k
    if (password !== expected) {
      setUnlocking(false)
      return { ok: false, error: '密码错误' }
    }
    const qs = await decryptQuestions(k)
    setUnlocking(false)
    if (!qs) {
      return { ok: false, error: '题库加载失败' }
    }
    setQuestions(qs)
    setCurrentUser(account)
    setUserName(name || '')
    setProgress(getProgress(account.id))
    setWrongBook(getWrongBook(account.id))
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setUserName('')
    setQuestions(null)
    setProgress({ single: [], multi: [], judge: [] })
    setWrongBook({})
  }, [])

  const recordProgress = useCallback((questionId, type, isCorrect) => {
    if (!currentUser) return
    setProgress(prev => {
      const next = { ...prev }
      if (!next[type].includes(questionId)) {
        next[type] = [...next[type], questionId]
      }
      saveProgress(currentUser.id, next)
      return next
    })
    setWrongBook(prev => {
      const next = { ...prev }
      if (isCorrect) {
        delete next[questionId]
      } else {
        next[questionId] = {
          type,
          wrongCount: (prev[questionId]?.wrongCount || 0) + 1,
          lastWrongAt: Date.now(),
        }
      }
      saveWrongBook(currentUser.id, next)
      return next
    })
  }, [currentUser])

  const removeFromWrong = useCallback((questionId) => {
    if (!currentUser) return
    setWrongBook(prev => {
      const next = { ...prev }
      delete next[questionId]
      saveWrongBook(currentUser.id, next)
      return next
    })
  }, [currentUser])

  const value = {
    questions,
    currentUser,
    userName,
    login,
    logout,
    unlocking,
    progress,
    wrongBook,
    recordProgress,
    removeFromWrong,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
