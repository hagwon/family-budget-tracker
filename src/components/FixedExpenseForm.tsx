// src/components/FixedExpenseForm.tsx
import { useState, useEffect } from 'react';
import type { FixedExpenseFormProps, FixedExpenseFormData } from '../types';
import { validateFixedExpense, FIXED_EXPENSE_TEMPLATES } from '../utils/fixedExpenseUtils';
import Modal from './Modal';

const EXPENSE_CATEGORIES = ['식비', '공과금', '통신비', '주거비', '교통비', '의료비', '교육비', '문화/여가', '쇼핑', '저축', '투자', '기타'];
const INCOME_CATEGORIES = ['급여', '부업', '투자수익', '기타수입'];

const FixedExpenseForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingExpense, 
  isDarkMode 
}: FixedExpenseFormProps) => {
  
  const [formData, setFormData] = useState<FixedExpenseFormData>({
    name: '',
    amount: '',
    category: '',
    type: 'expense',
    dayOfMonth: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ESC 키 처리
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // 편집 모드일 때 폼 데이터 설정
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        name: editingExpense.name,
        amount: editingExpense.amount.toString(),
        category: editingExpense.category,
        type: editingExpense.type,
        dayOfMonth: editingExpense.dayOfMonth,
        startDate: editingExpense.startDate,
        endDate: editingExpense.endDate || ''
      });
    } else {
      // 새로 추가할 때는 초기화
      setFormData({
        name: '',
        amount: '',
        category: '',
        type: 'expense',
        dayOfMonth: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
    }
    setErrors([]);
  }, [editingExpense, isOpen]);

  const handleInputChange = (field: keyof FixedExpenseFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 클리어
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type,
      category: '' // 타입 변경 시 카테고리 초기화
    }));
  };

  const handleTemplateSelect = (template: typeof FIXED_EXPENSE_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      category: template.category,
      type: template.type,
      dayOfMonth: template.suggestedDay
    }));
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    const validation = validateFixedExpense(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setErrors(['저장에 실패했습니다. 다시 시도해주세요.']);
    } finally {
      setSubmitting(false);
    }
  };

  const availableCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const filteredTemplates = FIXED_EXPENSE_TEMPLATES.filter(template => template.type === formData.type);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? '고정비 수정' : '고정비 추가'}
      message=""
      type="info"
      isDarkMode={isDarkMode}
      confirmText={submitting ? '저장 중...' : '저장'}
      onConfirm={handleSubmit}
      cancelText="취소"
    >
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <form onSubmit={handleSubmit} className="modal-form">
        {/* 에러 메시지 */}
        {errors.length > 0 && (
          <div className="form-errors">
            {errors.map((error, index) => (
              <div key={index} className="error-message">
                ❌ {error}
              </div>
            ))}
          </div>
        )}

        {/* 템플릿 선택 버튼 */}
        {!editingExpense && (
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <button 
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="template-toggle-button"
            >
              📋 템플릿에서 선택 {showTemplates ? '▲' : '▼'}
            </button>
            
            {showTemplates && (
              <div className="template-list">
                {filteredTemplates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="template-item"
                  >
                    <span className="template-name">{template.name}</span>
                    <span className="template-category">{template.category}</span>
                    <span className="template-day">{template.suggestedDay}일</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 수입/지출 타입 */}
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>타입</label>
          <div className="type-selector">
            <button 
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`type-button ${formData.type === 'expense' ? 'active' : ''}`}
            >
              💸 지출
            </button>
            <button 
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`type-button ${formData.type === 'income' ? 'active' : ''}`}
            >
              💰 수입
            </button>
          </div>
        </div>

        {/* 고정비 이름 */}
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label htmlFor="name">고정비 이름</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="예: 월세, 휴대폰 요금, 급여"
            required
          />
        </div>

        {/* 금액 */}
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label htmlFor="amount">금액</label>
          <input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0"
            min="1"
            required
          />
        </div>

        {/* 카테고리 */}
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label htmlFor="category">카테고리</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            required
          >
            <option value="">카테고리 선택</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* 날짜 설정 */}
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label htmlFor="dayOfMonth">매월 발생일</label>
          <select
            id="dayOfMonth"
            value={formData.dayOfMonth}
            onChange={(e) => handleInputChange('dayOfMonth', parseInt(e.target.value))}
            required
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>
                {day}일 {day === 31 && '(월말일 자동 조정)'}
              </option>
            ))}
          </select>
        </div>

        {/* 시작일 */}
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label htmlFor="startDate">시작일</label>
          <input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            required
          />
        </div>

        {/* 종료일 (선택사항) */}
        <div className="form-group" style={{ marginBottom: '8px' }}>
          <label htmlFor="endDate">종료일 (선택사항)</label>
          <input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            min={formData.startDate}
          />
          <small className="form-hint">
            종료일을 설정하지 않으면 계속 반복됩니다.
          </small>
        </div>
              </form>
      </div>
    </Modal>
  );
};

export default FixedExpenseForm;