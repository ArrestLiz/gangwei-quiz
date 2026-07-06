import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Home, BookOpen, RotateCcw, FileText, GraduationCap, LogOut, Shield, User } from 'lucide-react'

const navItems = [
  { to: '/home', label: '首页', icon: Home },
  { to: '/practice', label: '顺序刷题', icon: BookOpen },
  { to: '/wrong', label: '错题重刷', icon: RotateCcw },
  { to: '/test', label: '组卷测试', icon: FileText },
  { to: '/midterm', label: '中期测试', icon: GraduationCap },
]

export default function Layout({ children }) {
  const { currentUser, logout } = useApp()
  const location = useLocation()
  const isAdmin = currentUser?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex flex-col w-56 bg-brand text-white fixed h-full z-10">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-lg font-bold">岗位练兵</h1>
          <p className="text-xs text-white/60">刷题系统</p>
        </div>

        {/* 用户信息 */}
        <div className="px-6 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {isAdmin ? <Shield className="w-4 h-4 text-orange-300" /> : <User className="w-4 h-4 text-white/60" />}
            <span className="text-sm font-medium">{currentUser?.name}</span>
            {isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-400/30 text-orange-200">管理员</span>}
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive ? 'bg-white/15 text-white font-medium' : 'text-white/70 hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 md:ml-56 pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* 移动端用户信息栏 */}
          <div className="md:hidden flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              {isAdmin ? <Shield className="w-4 h-4 text-orange-500" /> : <User className="w-4 h-4 text-gray-400" />}
              <span className="text-sm font-medium text-gray-700">{currentUser?.name}</span>
              {isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600">管理员</span>}
            </div>
            <button onClick={logout} className="text-sm text-gray-400 flex items-center gap-1">
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
          {children}
        </div>
      </main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-brand' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
