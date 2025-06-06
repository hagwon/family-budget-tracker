// src/utils/budgetUtils.ts

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString()}원`;
};

export const getMonthRange = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return { firstDay, lastDay };
};

export const getHolidayStatusMessage = (
  loading: boolean,
  error: string | null,
  dataSource: 'api' | 'static',
  holidaysCount: number,
  isAPIConfigured: boolean
): { type: 'loading' | 'error' | 'success' | 'info'; message: string } => {
  if (loading) {
    return { 
      type: 'loading', 
      message: '공휴일 정보를 불러오는 중...' 
    };
  }

  if (error) {
    return { 
      type: 'error', 
      message: error 
    };
  }

  if (dataSource === 'api') {
    return { 
      type: 'success', 
      message: `실시간 공휴일 정보 (${holidaysCount}개 공휴일 확인됨)` 
    };
  }

  if (!isAPIConfigured) {
    return { 
      type: 'info', 
      message: `정적 공휴일 데이터 사용 중 (${holidaysCount}개 공휴일)` 
    };
  }

  return { 
    type: 'info', 
    message: `백업 공휴일 데이터 사용 중 (${holidaysCount}개 공휴일)` 
  };
};