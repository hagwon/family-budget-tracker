import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './hooks/firebase';
import Modal from './components/Modal';
import { useHolidays, isHoliday, isWeekend, truncateHolidayName } from './hooks/useHolidays';
import { formatCurrency, getMonthRange } from './utils/budgetUtils';
import type { BudgetItem } from './types';
import FixedExpenseManager from './components/FixedExpenseManager';
import './BudgetOverview.css';

interface BudgetOverviewProps {
  isDarkMode: boolean;
}

const EXPENSE_CATEGORIES = ['식비', '공과금', '통신비', '주거비', '교통비', '의료비', '교육비', '문화/여가', '쇼핑', '기타'];

const BudgetOverview = ({ isDarkMode }: BudgetOverviewProps) => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFixedExpenseManager, setShowFixedExpenseManager] = useState(false);
  
  const { 
    holidays, 
    loading: holidaysLoading, 
    error: holidaysError, 
    dataSource,
    isAPIConfigured 
  } = useHolidays(currentDate.getFullYear(), currentDate.getMonth() + 1);
  
  const [formData, setFormData] = useState({
    date: '',
    category: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense'
  });

  // 캘린더 날짜 배열 생성
  const generateCalendarDays = () => {
    const { firstDay, lastDay } = getMonthRange(currentDate);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };

  const getTransactionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return budgetItems.filter(item => item.date === dateString);
  };

  const getMonthlyCategorySummary = () => {
    const { firstDay, lastDay } = getMonthRange(currentDate);
    const monthlyItems = budgetItems.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= firstDay && itemDate <= lastDay;
    });

    const categoryTotals = EXPENSE_CATEGORIES.map(category => {
      const categoryItems = monthlyItems.filter(item => 
        item.type === 'expense' && item.category === category
      );
      const total = categoryItems.reduce((sum, item) => sum + item.amount, 0);
      return { category, amount: total };
    });

    const totalExpense = categoryTotals.reduce((sum, cat) => sum + cat.amount, 0);
    const totalIncome = monthlyItems
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);

    return { categoryTotals, totalExpense, totalIncome, balance: totalIncome - totalExpense };
  };

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

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const resetForm = () => {
    setFormData({
      date: '',
      category: '',
      description: '',
      amount: '',
      type: 'expense'
    });
  };

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

  const monthlyStats = getMonthlyStats();
  const monthlySummary = getMonthlyCategorySummary();
  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <div className="budget-loading">
        <div className="loading-spinner">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={`budget-overview-container ${isDarkMode ? 'dark' : 'light'}`}>
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
              onClick={() => setShowFixedExpenseManager(true)}
              className="add-button primary"
            >
              고정비 관리
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="content-wrapper">
          <div className="main-content">
            {/* 가계부 메인 섹션 */}
            <div className="budget-main-section">
              {/* 월별 통계 */}
              <div className="monthly-stats">
                <div className="stat-card income">
                  <div className="stat-label">수입</div>
                  <div className="stat-amount">+{formatCurrency(monthlyStats.income)}</div>
                </div>
                <div className="stat-card expense">
                  <div className="stat-label">지출</div>
                  <div className="stat-amount">-{formatCurrency(monthlyStats.expense)}</div>
                </div>
                <div className={`stat-card balance ${monthlyStats.balance >= 0 ? 'positive' : 'negative'}`}>
                  <div className="stat-label">잔액</div>
                  <div className="stat-amount">
                    {monthlyStats.balance >= 0 ? '+' : ''}{formatCurrency(monthlyStats.balance)}
                  </div>
                </div>
              </div>

              {/* 캘린더 */}
              <div className="calendar-container">
                <div className="calendar-header">
                  <div className="weekday sunday">일</div>
                  <div className="weekday">월</div>
                  <div className="weekday">화</div>
                  <div className="weekday">수</div>
                  <div className="weekday">목</div>
                  <div className="weekday">금</div>
                  <div className="weekday saturday">토</div>
                </div>
                
                <div className="calendar-body">
                  {calendarDays.map((day, index) => {
                    const transactions = getTransactionsForDate(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();
                    const holidayInfo = isHoliday(day, holidays);
                    const isWeekendDay = isWeekend(day);
                    
                    const dayIncome = transactions
                      .filter(t => t.type === 'income')
                      .reduce((sum, t) => sum + t.amount, 0);
                    
                    const dayExpense = transactions
                      .filter(t => t.type === 'expense')
                      .reduce((sum, t) => sum + t.amount, 0);

                    let dayNumberClass = 'day-number';
                    if (holidayInfo) {
                      dayNumberClass += ' holiday-date';
                    } else if (isWeekendDay && day.getDay() === 0) {
                      dayNumberClass += ' sunday-date';
                    } else if (day.getDay() === 6) {
                      dayNumberClass += ' saturday-date';
                    }

                    return (
                      <div 
                        key={index} 
                        className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                        title={holidayInfo ? `${holidayInfo.name} (공휴일)` : isWeekendDay ? '주말' : ''}
                      >
                        <div className="day-header">
                          <div className={dayNumberClass}>
                            {day.getDate()}
                          </div>
                          
                          {isCurrentMonth && holidayInfo && (
                            <div className="holiday-name">
                              {truncateHolidayName(holidayInfo.name, 3)}
                              <div className="holiday-tooltip">
                                {holidayInfo.name}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {isCurrentMonth && transactions.length > 0 && (
                          <div className="day-transactions">
                            {dayIncome > 0 && (
                              <div className="day-amount income">+{formatCurrency(dayIncome)}</div>
                            )}
                            {dayExpense > 0 && (
                              <div className="day-amount expense">-{formatCurrency(dayExpense)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* 월 정산 테이블 */}
          <div className="monthly-summary">
            <h3 className="summary-title">
              📊 월별 정산
            </h3>
            
            <div className="summary-table-wrapper">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>카테고리</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.categoryTotals.map(({ category, amount }) => (
                    <tr key={category}>
                      <td className="category-name">{category}</td>
                      <td className="amount-cell expense">
                        {amount > 0 ? `-${formatCurrency(amount)}` : '0원'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="summary-total">
                    <td className="total-label">총 지출</td>
                    <td className="amount-cell expense">
                      -{formatCurrency(monthlySummary.totalExpense)}
                    </td>
                  </tr>
                  <tr className="summary-total">
                    <td className="total-label">총 수입</td>
                    <td className="amount-cell income">
                      +{formatCurrency(monthlySummary.totalIncome)}
                    </td>
                  </tr>
                  <tr className="summary-total">
                    <td className="total-label">잔액</td>
                    <td className={`amount-cell ${monthlySummary.balance >= 0 ? 'positive' : 'negative'}`}>
                      {monthlySummary.balance >= 0 ? '+' : ''}{formatCurrency(monthlySummary.balance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* API 상태 정보 */}
            <div className="api-status-info">
              <div>
                <strong>공휴일 데이터:</strong> {dataSource === 'api' ? '실시간 API' : '정적 데이터'}
              </div>
              {dataSource === 'api' && (
                <div style={{ color: '#10b981' }}>
                  ✅ 최신 공휴일 정보가 자동 업데이트됩니다
                </div>
              )}
              {!isAPIConfigured && (
                <div style={{ color: '#f59e0b', marginTop: '4px' }}>
                  💡 .env 파일에 VITE_HOLIDAY_API_KEY를 설정하면 실시간 업데이트가 가능합니다
                </div>
              )}
            </div>
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

        {/* 고정비 관리자 */}
        <FixedExpenseManager
          isOpen={showFixedExpenseManager}
          onClose={() => setShowFixedExpenseManager(false)}
          isDarkMode={isDarkMode}
          currentMonth={currentDate}
        />
      </div>
    </div>
  );
};

export default BudgetOverview;