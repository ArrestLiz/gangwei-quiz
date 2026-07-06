import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { accounts } from '../data/accounts'
import { Lock, Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react'

export default function PasswordGate() {
  const { login, unlocking } = useApp()
  const [selectedId, setSelectedId] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedId) { setError('请先选择账号'); return }
    if (!password) { setError('请输入密码'); return }
    const result = await login(selectedId, password)
    if (!result.ok) {
      setError(result.error)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f2d5e 0%, #1a4480 50%, #2563eb 100%)' }}>
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-5 fade-in">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand/10 mb-2">
            <Lock className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-lg font-bold text-gray-800">岗位练兵刷题</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setError('') }}
              disabled={unlocking}
              className={`w-full appearance-none px-3 py-2 pr-9 border rounded-lg outline-none transition-colors text-sm bg-white disabled:opacity-50
                ${error && !selectedId ? 'border-red-400' : 'border-gray-200 focus:border-brand-light'}`}
            >
              <option value="">选择账号</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="密码"
              disabled={unlocking}
              className={`w-full px-3 py-2 pr-9 border rounded-lg outline-none transition-colors text-sm disabled:opacity-50
                ${error && selectedId ? 'border-red-400' : 'border-gray-200 focus:border-brand-light'}`}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={unlocking}
            className="w-full py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {unlocking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                登录中...
              </>
            ) : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
