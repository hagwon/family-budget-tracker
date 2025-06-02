import { useState, useEffect } from 'react'
import './App.css'
import { db } from './firebase'
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  orderBy, 
  query 
} from 'firebase/firestore'

// 거래 내역 타입 정의
interface Transaction {
  id: string
  amount: number
  category: string
  description: string
  date: string
  type: 'income' | 'expense'
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [displayAmount, setDisplayAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [loading, setLoading] = useState(false)

  // Firebase에서 데이터 실시간 로드
  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'))
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData: Transaction[] = []
      querySnapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data()
        } as Transaction)
      })
      setTransactions(transactionsData)
    })

    return () => unsubscribe()
  }, [])

  // 금액 포맷팅 함수
  const formatNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')
    // 천 단위 구분자 추가
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // 금액 입력 핸들러
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbers = value.replace(/[^\d]/g, '')
    setAmount(numbers)
    setDisplayAmount(formatNumber(numbers))
  }

  // 거래 추가 함수 (Firebase에 저장)
  const addTransaction = async () => {
    if (!amount || !category || !description) {
      alert('모든 필드를 입력해주세요!')
      return
    }

    setLoading(true)

    try {
      const newTransaction = {
        amount: parseFloat(amount),
        category,
        description,
        date: new Date().toISOString().split('T')[0],
        type,
        createdAt: new Date()
      }

      // Firestore에 데이터 추가
      await addDoc(collection(db, 'transactions'), newTransaction)

      // 입력 필드 초기화
      setAmount('')
      setDisplayAmount('')
      setCategory('')
      setDescription('')
      
    } catch (error) {
      console.error('Error adding transaction: ', error)
      alert('거래 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 총 수입/지출 계산
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  return (
    <div className="App">
      <header className="App-header">
        <h1>👨‍👩‍👧‍👦 가족 가계부</h1>
        
        {/* 잔액 표시 */}
        <div className="balance-summary">
          <div className="balance-item">
            <span>💰 총 잔액: </span>
            <span style={{ color: balance >= 0 ? 'green' : 'red' }}>
              {balance.toLocaleString()}원
            </span>
          </div>
          <div className="balance-item">
            <span>📈 수입: </span>
            <span style={{ color: 'blue' }}>{totalIncome.toLocaleString()}원</span>
          </div>
          <div className="balance-item">
            <span>📉 지출: </span>
            <span style={{ color: 'red' }}>{totalExpense.toLocaleString()}원</span>
          </div>
        </div>

        {/* 거래 입력 폼 */}
        <div className="transaction-form">
          <h3>새 거래 추가</h3>
          
          <div className="form-group">
            <label>
              <input
                type="radio"
                value="income"
                checked={type === 'income'}
                onChange={(e) => setType(e.target.value as 'income' | 'expense')}
              />
              수입
            </label>
            <label>
              <input
                type="radio"
                value="expense"
                checked={type === 'expense'}
                onChange={(e) => setType(e.target.value as 'income' | 'expense')}
              />
              지출
            </label>
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="금액"
              value={displayAmount}
              onChange={handleAmountChange}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="카테고리 (예: 식비, 교통비, 월급)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button 
            onClick={addTransaction} 
            className="add-button"
            disabled={loading}
          >
            {loading ? '추가 중...' : '거래 추가'}
          </button>
        </div>

        {/* 거래 내역 리스트 */}
        <div className="transaction-list">
          <h3>거래 내역</h3>
          {transactions.length === 0 ? (
            <p>아직 거래 내역이 없습니다.</p>
          ) : (
            transactions.map(transaction => (
              <div 
                key={transaction.id} 
                className={`transaction-item ${transaction.type}`}
              >
                <div className="transaction-info">
                  <span className="transaction-category">{transaction.category}</span>
                  <span className="transaction-description">{transaction.description}</span>
                  <span className="transaction-date">{transaction.date}</span>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {transaction.amount.toLocaleString()}원
                </div>
              </div>
            ))
          )}
        </div>
      </header>
    </div>
  )
}

export default App