// src/components/FixedExpenseManager.tsx
import { useState } from 'react';
import type { FixedExpenseManagerProps, FixedExpense } from '../types';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { formatCurrency } from '../utils/budgetUtils';
import { calculateMonthlyProjection, formatMonthYear } from '../utils/fixedExpenseUtils';
import Modal from './Modal';
import FixedExpenseCard from './FixedExpenseCard';
import FixedExpenseForm from './FixedExpenseForm';
import './FixedExpenseManager.css';

const FixedExpenseManager = ({ isOpen, onClose, isDarkMode, currentMonth }: FixedExpenseManagerProps) => {
  const {
    fixedExpenses,
    loading,
    error,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    toggleFixedExpense,
    generateFixedExpensesForMonth,
    getGenerationStatus,
    clearError
  } = useFixedExpenses();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [generatingExpenses, setGeneratingExpenses] = useState(false);

  const currentYear = currentMonth.getFullYear();
  const currentMonthNum = currentMonth.getMonth() + 1;

  // 현재 월의 생성 상태 및 예상 금액
  const generationStatus = getGenerationStatus(currentYear, currentMonthNum);
  const monthlyProjection = calculateMonthlyProjection(fixedExpenses, currentYear, currentMonthNum);

  // 고정비 자동 생성 처리
  const handleGenerateExpenses = async () => {
    setGeneratingExpenses(true);
    
    try {
      const result = await generateFixedExpensesForMonth(currentYear, currentMonthNum);
      
      if (result.success) {
        // 성공 메시지는 별도 처리하거나 토스트로 표시 가능
        console.log(`${result.generatedCount}개의 고정비가 생성되었습니다.`);
      } else if (result.errors.length > 0) {
        console.error('일부 고정비 생성 실패:', result.errors);
      }
    } catch (err) {
      console.error('고정비 생성 오류:', err);
    } finally {
      setGeneratingExpenses(false);
    }
  };

  // 고정비 추가/수정 폼 제출
  const handleFormSubmit = async (data: any) => {
    let success = false;
    
    if (editingExpense) {
      success = await updateFixedExpense(editingExpense.id, data);
    } else {
      success = await addFixedExpense(data);
    }
    
    if (success) {
      setShowAddForm(false);
      setEditingExpense(null);
    }
  };

  // 고정비 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!selectedExpenseId) return;
    
    const success = await deleteFixedExpense(selectedExpenseId);
    
    if (success) {
      setShowDeleteModal(false);
      setSelectedExpenseId(null);
    }
  };

  // 수정 버튼 클릭
  const handleEdit = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setShowAddForm(true);
  };

  // 삭제 버튼 클릭
  const handleDelete = (id: string) => {
    setSelectedExpenseId(id);
    setShowDeleteModal(true);
  };

  // 모달 닫기 처리
  const handleClose = () => {
    onClose();
    setShowAddForm(false);
    setEditingExpense(null);
    setShowDeleteModal(false);
    setSelectedExpenseId(null);
    clearError();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className={`fixed-expense-manager ${isDarkMode ? 'dark' : 'light'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="manager-header">
          <h2 className="manager-title">
            💰 고정비 관리
          </h2>
          <button 
            onClick={handleClose}
            className="close-button"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 현재 월 상태 */}
        <div className="month-status">
          <div className="status-header">
            <h3>{formatMonthYear(currentYear, currentMonthNum)} 고정비 현황</h3>
            <button 
              onClick={handleGenerateExpenses}
              disabled={generatingExpenses || generationStatus.pendingCount === 0}
              className={`generate-button ${generationStatus.pendingCount > 0 ? 'primary' : 'disabled'}`}
            >
              {generatingExpenses ? '생성 중...' : 
               generationStatus.pendingCount > 0 ? `${generationStatus.pendingCount}개 생성` : '생성 완료'}
            </button>
          </div>

          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">등록된 고정비</div>
              <div className="status-value">{generationStatus.totalCount}개</div>
            </div>
            <div className="status-card">
              <div className="status-label">생성 완료</div>
              <div className="status-value success">{generationStatus.generatedCount}개</div>
            </div>
            <div className="status-card">
              <div className="status-label">생성 대기</div>
              <div className="status-value warning">{generationStatus.pendingCount}개</div>
            </div>
          </div>

          {/* 월 예상 금액 */}
          <div className="monthly-projection">
            <div className="projection-item income">
              <span className="projection-label">예상 수입</span>
              <span className="projection-amount">+{formatCurrency(monthlyProjection.income)}</span>
            </div>
            <div className="projection-item expense">
              <span className="projection-label">예상 지출</span>
              <span className="projection-amount">-{formatCurrency(monthlyProjection.expense)}</span>
            </div>
            <div className={`projection-item balance ${monthlyProjection.balance >= 0 ? 'positive' : 'negative'}`}>
              <span className="projection-label">예상 잔액</span>
              <span className="projection-amount">
                {monthlyProjection.balance >= 0 ? '+' : ''}{formatCurrency(monthlyProjection.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* 고정비 목록 */}
        <div className="expenses-section">
          <div className="section-header">
            <h3>등록된 고정비</h3>
            <button 
              onClick={() => setShowAddForm(true)}
              className="add-button"
            >
              + 고정비 추가
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">고정비를 불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button onClick={clearError} className="retry-button">다시 시도</button>
            </div>
          ) : fixedExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h4>등록된 고정비가 없습니다</h4>
              <p>월세, 통신비, 급여 등 매월 반복되는 수입/지출을 등록해보세요.</p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="add-button primary"
              >
                첫 고정비 추가하기
              </button>
            </div>
          ) : (
            <div className="expenses-list">
              {fixedExpenses.map(expense => (
                <FixedExpenseCard
                  key={expense.id}
                  expense={expense}
                  isDarkMode={isDarkMode}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={toggleFixedExpense}
                />
              ))}
            </div>
          )}
        </div>

        {/* 고정비 추가/수정 폼 */}
        <FixedExpenseForm
          isOpen={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setEditingExpense(null);
          }}
          onSubmit={handleFormSubmit}
          editingExpense={editingExpense}
          isDarkMode={isDarkMode}
        />

        {/* 삭제 확인 모달 */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="고정비 삭제"
          message="정말로 이 고정비를 삭제하시겠습니까? 이미 생성된 거래 내역은 유지됩니다."
          type="warning"
          isDarkMode={isDarkMode}
          confirmText="삭제"
          onConfirm={handleDeleteConfirm}
          cancelText="취소"
          icon="🗑️"
        />
      </div>
    </div>
  );
};

export default FixedExpenseManager;