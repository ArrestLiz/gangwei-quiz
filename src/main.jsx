import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import './index.css'

// 全局错误捕获，防止白屏无法排查
window.addEventListener('error', (e) => {
  const root = document.getElementById('root')
  // 仅在 React 尚未挂载时（fallback 还在）显示错误
  if (root && root.querySelector('#fallback')) {
    root.innerHTML = `<div style="padding:24px;font-family:monospace;color:#b91c1c;white-space:pre-wrap;font-size:13px;line-height:1.6">页面加载出错：\n\n${e.message}\n\n${e.error?.stack || ''}</div>`
  }
})

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <HashRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </HashRouter>
    </React.StrictMode>,
  )
} catch (err) {
  document.getElementById('root').innerHTML = `<div style="padding:24px;font-family:monospace;color:#b91c1c;white-space:pre-wrap;font-size:13px;line-height:1.6">渲染失败：\n\n${err.message}\n\n${err.stack || ''}</div>`
}
