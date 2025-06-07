// 기존 BudgetItem 타입 확장
export interface BudgetItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  createdAt: Date;
  fixedExpenseId?: string; // 고정비에서 생성된 거래인지 표시
}

// 고정비 타입 정의
export interface FixedExpense {
  id: string;
  name: string;                    // "월세", "휴대폰 요금" 등
  amount: number;
  category: string;
  type: 'income' | 'expense';
  dayOfMonth: number;             // 매월 몇일에 발생 (1-31)
  startDate: string;              // 시작일 (YYYY-MM-DD)
  endDate?: string;               // 종료일 (선택사항)
  isActive: boolean;              // 활성/비활성
  lastGenerated: string;          // 마지막 생성된 월 (YYYY-MM)
  createdAt: Date;
  userId?: string;                // 사용자별 관리 (추후 멀티유저용)
}

// 고정비 폼 데이터
export interface FixedExpenseFormData {
  name: string;
  amount: string;
  category: string;
  type: 'income' | 'expense';
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
}

// 고정비 생성 상태
export interface FixedExpenseGenerationStatus {
  totalCount: number;
  generatedCount: number;
  pendingCount: number;
  lastGenerated: string | null;
}

// 고정비 템플릿
export interface FixedExpenseTemplate {
  name: string;
  category: string;
  type: 'income' | 'expense';
  suggestedDay: number;
  description?: string;
}

// 고정비 관리자 Props
export interface FixedExpenseManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  currentMonth: Date;
}

// 고정비 카드 Props
export interface FixedExpenseCardProps {
  expense: FixedExpense;
  isDarkMode: boolean;
  onEdit: (expense: FixedExpense) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

// 고정비 폼 Props
export interface FixedExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FixedExpenseFormData) => void;
  editingExpense?: FixedExpense | null;
  isDarkMode: boolean;
}