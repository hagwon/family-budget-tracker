import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import Modal from './Modal';
import './BudgetOverview.css';

interface BudgetItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  createdAt: Date;
}

interface BudgetOverviewProps {
  isDarkMode: boolean;
}

const BudgetOverview = ({ isDarkMode }: BudgetOverviewProps) => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    date: '',
    category: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense'
  });

  // 카테고리 옵션
  const expenseCategories = ['생활비', '식비', '교통비', '의료비', '교육비', '문화/여가', '기타'];
  const incomeCategories = ['급여', '용돈', '보너스', '투자수익', '기타'];

  // 현재 월의 첫날과 마지막날 계산
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  // 캘린더 날짜 배열 생성
  const generateCalendarDays = () => {
    const { firstDay, lastDay } = getMonthRange(currentDate);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // 주의 시작(일요일)으로 조정
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay())); // 주의 끝(토요일)으로 조정
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };

  // 특정 날짜의 거래 내역 가져오기
  const getTransactionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return budgetItems.filter(item => item.date === dateString);
  };

  // 월별 통계 계산
  const getMonthlyStats = () => {
    const { firstDay, lastDay } = getMonthRange(currentDate);
    const monthlyItems = budgetItems.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= firstDay && itemDate <= lastDay;
    });

    const income = monthlyItems
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);

    const expense = monthlyItems
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    return { income, expense, balance: income - expense };
  };

  // Firebase에서 데이터 실시간 감지
  useEffect(() => {
    const q = query(collection(db, 'budgetItems'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as BudgetItem[];
      
      setBudgetItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 월 변경
  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      date: '',
      category: '',
      description: '',
      amount: '',
      type: 'expense'
    });
  };

  // 거래 추가
  const handleAddTransaction = async () => {
    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
      return;
    }

    try {
      await addDoc(collection(db, 'budgetItems'), {
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: parseInt(formData.amount),
        type: formData.type,
        createdAt: new Date()
      });

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  // 거래 삭제
  const handleDeleteTransaction = async () => {
    if (!selectedItem) return;

    try {
      await deleteDoc(doc(db, 'budgetItems', selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // 오늘 날짜 설정
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ ...formData, date: today });
  };

  const monthlyStats = getMonthlyStats();
  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <div className="budget-loading">
        <div className="loading-spinner">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={`budget-overview ${isDarkMode ? 'dark' : 'light'}`}>
      {/* 헤더 */}
      <div className="budget-header">
        <div className="month-navigation">
          <button onClick={() => changeMonth(-1)} className="nav-button">
            ◀
          </button>
          <h2 className="current-month">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 종합 가계부
          </h2>
          <button onClick={() => changeMonth(1)} className="nav-button">
            ▶
          </button>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="add-button"
          >
            생활비 가계부 보기
          </button>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="add-button primary"
          >
            고정비 관리
          </button>
        </div>
      </div>

      {/* 월별 통계 */}
      <div className="monthly-stats">
        <div className="stat-card income">
          <div className="stat-label">수입</div>
          <div className="stat-amount">+{monthlyStats.income.toLocaleString()}원</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-label">지출</div>
          <div className="stat-amount">-{monthlyStats.expense.toLocaleString()}원</div>
        </div>
        <div className={`stat-card balance ${monthlyStats.balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-label">잔액</div>
          <div className="stat-amount">
            {monthlyStats.balance >= 0 ? '+' : ''}{monthlyStats.balance.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="weekday">일</div>
          <div className="weekday">월</div>
          <div className="weekday">화</div>
          <div className="weekday">수</div>
          <div className="weekday">목</div>
          <div className="weekday">금</div>
          <div className="weekday">토</div>
        </div>
        
        <div className="calendar-body">
          {calendarDays.map((day, index) => {
            const transactions = getTransactionsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            
            const dayIncome = transactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);
            
            const dayExpense = transactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div 
                key={index} 
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className="day-number">{day.getDate()}</div>
                {isCurrentMonth && transactions.length > 0 && (
                  <div className="day-transactions">
                    {dayIncome > 0 && (
                      <div className="day-amount income">+{dayIncome.toLocaleString()}</div>
                    )}
                    {dayExpense > 0 && (
                      <div className="day-amount expense">-{dayExpense.toLocaleString()}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 거래 추가 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="거래 추가"
        message=""
        type="info"
        isDarkMode={isDarkMode}
        confirmText="추가"
        onConfirm={handleAddTransaction}
        cancelText="취소"
      />

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        title="거래 삭제"
        message="정말로 이 거래를 삭제하시겠습니까?"
        type="warning"
        isDarkMode={isDarkMode}
        confirmText="삭제"
        onConfirm={handleDeleteTransaction}
        cancelText="취소"
      />
    </div>
  );
};

export default BudgetOverview;