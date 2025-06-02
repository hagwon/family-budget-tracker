import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import './Auth.css'

interface AuthProps {
  darkMode: boolean
  toggleDarkMode: () => void
}

const Auth = ({ darkMode, toggleDarkMode }: AuthProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // 이메일/비밀번호 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      // 에러 메시지를 한국어로 변환
      let errorMessage = '로그인에 실패했습니다.'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식이 아닙니다.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth-container ${darkMode ? 'dark' : 'light'}`}>
      {/* 테마 토글 버튼 */}
      <div className="theme-toggle">
        <button onClick={toggleDarkMode} className="theme-button">
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="auth-card glass-card">
        <h2>👨‍👩‍👧‍👦 쭈 가계부</h2>
        <p>쭈의 가족들만 로그인하세요.</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-info">
          <p>🔒 <strong>보안 안내:</strong></p>
          <ul>
            <li>등록된 가족만 접근 가능합니다.</li>
            <li>계정 문의는 관리자에게 연락하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Auth