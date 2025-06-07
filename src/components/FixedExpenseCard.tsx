// src/components/FixedExpenseCard.tsx
import type { FixedExpenseCardProps } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { getNextGenerationDate } from '../utils/fixedExpenseUtils';

const FixedExpenseCard = ({ 
  expense, 
  isDarkMode, 
  onEdit, 
  onDelete, 
  onToggle 
}: FixedExpenseCardProps) => {

  const nextGeneration = getNextGenerationDate(expense);
  const isExpired = expense.endDate && new Date(expense.endDate) < new Date();

  return (
    <div className={`fixed-expense-card ${!expense.isActive ? 'inactive' : ''} ${isExpired ? 'expired' : ''}`}>
      {/* 카드 헤더 */}
      <div className="card-header">
        <div className="expense-info">
          <h4 className="expense-name">{expense.name}</h4>
          <div className="expense-meta">
            <span className="category">{expense.category}</span>
            <span className="schedule">매월 {expense.dayOfMonth}일</span>
          </div>
        </div>
        <div className="status-badges">
          {!expense.isActive && (
            <span className="status-badge inactive">비활성</span>
          )}
          {isExpired && (
            <span className="status-badge expired">만료</span>
          )}
          <span className={`type-badge ${expense.type}`}>
            {expense.type === 'income' ? '수입' : '지출'}
          </span>
        </div>
      </div>

      {/* 금액 정보 */}
      <div className="amount-section">
        <div className={`amount ${expense.type}`}>
          {expense.type === 'expense' ? '-' : '+'}
          {formatCurrency(expense.amount)}
        </div>
        <div className="next-generation">
          다음 생성: {new Date(nextGeneration).toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* 기간 정보 */}
      <div className="period-section">
        <div className="period-info">
          <span className="period-label">시작:</span>
          <span className="period-date">
            {new Date(expense.startDate).toLocaleDateString('ko-KR')}
          </span>
        </div>
        {expense.endDate && (
          <div className="period-info">
            <span className="period-label">종료:</span>
            <span className="period-date">
              {new Date(expense.endDate).toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="card-actions">
        <button 
          onClick={() => onToggle(expense.id)}
          className={`action-button toggle ${expense.isActive ? 'pause' : 'resume'}`}
          title={expense.isActive ? '일시정지' : '재개'}
        >
          {expense.isActive ? '⏸️' : '▶️'}
          {expense.isActive ? '일시정지' : '재개'}
        </button>
        
        <button 
          onClick={() => onEdit(expense)}
          className="action-button edit"
          title="수정"
        >
          ✏️ 수정
        </button>
        
        <button 
          onClick={() => onDelete(expense.id)}
          className="action-button delete"
          title="삭제"
        >
          🗑️ 삭제
        </button>
      </div>

      {/* 최근 생성 정보 */}
      {expense.lastGenerated && (
        <div className="last-generated">
          <span className="last-generated-label">최근 생성:</span>
          <span className="last-generated-date">
            {expense.lastGenerated.replace('-', '년 ').replace('-', '월')}월
          </span>
        </div>
      )}
    </div>
  );
};

export default FixedExpenseCard;