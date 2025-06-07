// src/utils/fixedExpenseUtils.ts
import type { FixedExpense, FixedExpenseTemplate, FixedExpenseGenerationStatus } from '../types';

// 일반적인 고정비 템플릿
export const FIXED_EXPENSE_TEMPLATES: FixedExpenseTemplate[] = [
  { name: '월세/관리비', category: '주거비', type: 'expense', suggestedDay: 1 },
  { name: '휴대폰 요금', category: '통신비', type: 'expense', suggestedDay: 25 },
  { name: '인터넷 요금', category: '통신비', type: 'expense', suggestedDay: 15 },
  { name: '자동차 보험', category: '교통비', type: 'expense', suggestedDay: 1 },
  { name: '건강보험료', category: '의료비', type: 'expense', suggestedDay: 10 },
  { name: '급여', category: '급여', type: 'income', suggestedDay: 25 },
  { name: '부업 수입', category: '부업', type: 'income', suggestedDay: 30 },
  { name: '적금', category: '저축', type: 'expense', suggestedDay: 1 },
  { name: '투자 (주식/펀드)', category: '투자', type: 'expense', suggestedDay: 1 },
  { name: '구독 서비스 (Netflix 등)', category: '문화/여가', type: 'expense', suggestedDay: 1 },
];

// 해당 월의 목표 날짜 생성 (일자 조정 포함)
export const getTargetDateForMonth = (year: number, month: number, dayOfMonth: number): string => {
  // 해당 월의 마지막 날 구하기
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  
  // 목표 일자가 해당 월의 마지막 날보다 크면 마지막 날로 조정
  const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
  
  return `${year}-${month.toString().padStart(2, '0')}-${targetDay.toString().padStart(2, '0')}`;
};

// 해당 월에 고정비가 이미 생성되었는지 확인
export const getMonthKey = (year: number, month: number): string => {
  return `${year}-${month.toString().padStart(2, '0')}`;
};

// 고정비가 해당 기간에 활성상태인지 확인
export const isFixedExpenseActiveInMonth = (expense: FixedExpense, year: number, month: number): boolean => {
  const targetDate = new Date(year, month - 1, 1); // month는 1-based
  const startDate = new Date(expense.startDate);
  const endDate = expense.endDate ? new Date(expense.endDate) : null;
  
  // 시작일 이후이고, 종료일이 없거나 종료일 이전인지 확인
  const afterStart = targetDate >= startDate;
  const beforeEnd = !endDate || targetDate <= endDate;
  
  return expense.isActive && afterStart && beforeEnd;
};

// 고정비 생성 상태 계산
export const calculateGenerationStatus = (
  fixedExpenses: FixedExpense[], 
  year: number, 
  month: number
): FixedExpenseGenerationStatus => {
  const monthKey = getMonthKey(year, month);
  const activeExpenses = fixedExpenses.filter(expense => 
    isFixedExpenseActiveInMonth(expense, year, month)
  );
  
  const generatedCount = activeExpenses.filter(expense => 
    expense.lastGenerated === monthKey
  ).length;
  
  const pendingCount = activeExpenses.length - generatedCount;
  
  // 마지막 생성일 찾기
  const lastGenerated = fixedExpenses
    .map(expense => expense.lastGenerated)
    .filter(date => date)
    .sort()
    .pop() || null;
  
  return {
    totalCount: activeExpenses.length,
    generatedCount,
    pendingCount,
    lastGenerated
  };
};

// 고정비 유효성 검사
export const validateFixedExpense = (data: {
  name: string;
  amount: string;
  category: string;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name.trim()) {
    errors.push('고정비 이름을 입력해주세요.');
  }
  
  if (!data.amount.trim() || isNaN(parseInt(data.amount))) {
    errors.push('올바른 금액을 입력해주세요.');
  }
  
  if (parseInt(data.amount) <= 0) {
    errors.push('금액은 0보다 커야 합니다.');
  }
  
  if (!data.category.trim()) {
    errors.push('카테고리를 선택해주세요.');
  }
  
  if (data.dayOfMonth < 1 || data.dayOfMonth > 31) {
    errors.push('날짜는 1일부터 31일 사이여야 합니다.');
  }
  
  if (!data.startDate) {
    errors.push('시작일을 선택해주세요.');
  }
  
  if (data.endDate && data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
    errors.push('종료일은 시작일 이후여야 합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 고정비 카테고리별 그룹화
export const groupFixedExpensesByCategory = (expenses: FixedExpense[]) => {
  return expenses.reduce((groups, expense) => {
    const category = expense.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(expense);
    return groups;
  }, {} as Record<string, FixedExpense[]>);
};

// 고정비 월별 예상 금액 계산
export const calculateMonthlyProjection = (expenses: FixedExpense[], year: number, month: number) => {
  const activeExpenses = expenses.filter(expense => 
    isFixedExpenseActiveInMonth(expense, year, month)
  );
  
  const income = activeExpenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const expense = activeExpenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  return {
    income,
    expense,
    balance: income - expense,
    count: activeExpenses.length
  };
};

// 날짜 포맷팅 (한국어)
export const formatMonthYear = (year: number, month: number): string => {
  return `${year}년 ${month}월`;
};

// 다음 생성 예정일 계산
export const getNextGenerationDate = (expense: FixedExpense): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  // 이번 달에 이미 생성 예정일이 지났는지 확인
  let targetYear = currentYear;
  let targetMonth = currentMonth;
  
  if (currentDay >= expense.dayOfMonth) {
    // 다음 달로
    targetMonth++;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear++;
    }
  }
  
  return getTargetDateForMonth(targetYear, targetMonth, expense.dayOfMonth);
};