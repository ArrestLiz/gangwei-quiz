import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import PasswordGate from './components/PasswordGate'
import Layout from './components/Layout'
import Home from './pages/Home'
import Practice from './pages/Practice'
import WrongReview from './pages/WrongReview'
import CustomTest from './pages/CustomTest'
import MidtermTest from './pages/MidtermTest'

export default function App() {
  const { currentUser } = useApp()

  if (!currentUser) return <PasswordGate />

  return (
    <Routes>
      <Route path="/home" element={<Layout><Home /></Layout>} />
      <Route path="/practice" element={<Layout><Practice /></Layout>} />
      <Route path="/wrong" element={<Layout><WrongReview /></Layout>} />
      <Route path="/test" element={<Layout><CustomTest /></Layout>} />
      <Route path="/midterm" element={<Layout><MidtermTest /></Layout>} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
