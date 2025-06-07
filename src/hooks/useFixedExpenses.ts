// src/hooks/useFixedExpenses.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase';
import type { FixedExpense, FixedExpenseFormData, BudgetItem } from '../types';
import { 
  getTargetDateForMonth, 
  getMonthKey, 
  isFixedExpenseActiveInMonth,
  calculateGenerationStatus 
} from '../utils/fixedExpenseUtils';

export const useFixedExpenses = () => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase에서 고정비 데이터 실시간 감지
  useEffect(() => {
    const q = query(
      collection(db, 'fixedExpenses'), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as FixedExpense[];
      
      setFixedExpenses(expenses);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching fixed expenses:', err);
      setError('고정비 데이터를 불러오는데 실패했습니다.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 고정비 추가
  const addFixedExpense = async (data: FixedExpenseFormData): Promise<boolean> => {
    try {
      setError(null);
      
      await addDoc(collection(db, 'fixedExpenses'), {
        name: data.name.trim(),
        amount: parseInt(data.amount),
        category: data.category,
        type: data.type,
        dayOfMonth: data.dayOfMonth,
        startDate: data.startDate,
        endDate: data.endDate || null,
        isActive: true,
        lastGenerated: '', // 아직 생성된 적 없음
        createdAt: new Date()
      });

      return true;
    } catch (err) {
      console.error('Error adding fixed expense:', err);
      setError('고정비 추가에 실패했습니다.');
      return false;
    }
  };

  // 고정비 수정
  const updateFixedExpense = async (id: string, data: FixedExpenseFormData): Promise<boolean> => {
    try {
      setError(null);
      
      await updateDoc(doc(db, 'fixedExpenses', id), {
        name: data.name.trim(),
        amount: parseInt(data.amount),
        category: data.category,
        type: data.type,
        dayOfMonth: data.dayOfMonth,
        startDate: data.startDate,
        endDate: data.endDate || null
      });

      return true;
    } catch (err) {
      console.error('Error updating fixed expense:', err);
      setError('고정비 수정에 실패했습니다.');
      return false;
    }
  };

  // 고정비 삭제
  const deleteFixedExpense = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      await deleteDoc(doc(db, 'fixedExpenses', id));
      return true;
    } catch (err) {
      console.error('Error deleting fixed expense:', err);
      setError('고정비 삭제에 실패했습니다.');
      return false;
    }
  };

  // 고정비 활성/비활성 토글
  const toggleFixedExpense = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const expense = fixedExpenses.find(exp => exp.id === id);
      if (!expense) {
        setError('고정비를 찾을 수 없습니다.');
        return false;
      }

      await updateDoc(doc(db, 'fixedExpenses', id), {
        isActive: !expense.isActive
      });

      return true;
    } catch (err) {
      console.error('Error toggling fixed expense:', err);
      setError('고정비 상태 변경에 실패했습니다.');
      return false;
    }
  };

  // 특정 월의 고정비 거래가 이미 생성되었는지 확인
  const checkIfTransactionExists = async (fixedExpenseId: string, targetDate: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'budgetItems'),
        where('fixedExpenseId', '==', fixedExpenseId),
        where('date', '==', targetDate)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (err) {
      console.error('Error checking transaction existence:', err);
      return false;
    }
  };

  // 특정 월의 고정비 자동 생성
  const generateFixedExpensesForMonth = async (year: number, month: number): Promise<{
    success: boolean;
    generatedCount: number;
    errors: string[];
  }> => {
    try {
      setError(null);
      
      const monthKey = getMonthKey(year, month);
      const activeExpenses = fixedExpenses.filter(expense => 
        isFixedExpenseActiveInMonth(expense, year, month)
      );

      let generatedCount = 0;
      const errors: string[] = [];

      for (const expense of activeExpenses) {
        // 이미 이번 달에 생성되었는지 확인
        if (expense.lastGenerated === monthKey) {
          continue;
        }

        const targetDate = getTargetDateForMonth(year, month, expense.dayOfMonth);
        
        // 중복 거래 확인
        const exists = await checkIfTransactionExists(expense.id, targetDate);
        if (exists) {
          // lastGenerated 업데이트만 하고 넘어감
          await updateDoc(doc(db, 'fixedExpenses', expense.id), {
            lastGenerated: monthKey
          });
          continue;
        }

        try {
          // 새 거래 생성
          await addDoc(collection(db, 'budgetItems'), {
            date: targetDate,
            category: expense.category,
            description: `${expense.name} (고정비)`,
            amount: expense.amount,
            type: expense.type,
            fixedExpenseId: expense.id,
            createdAt: new Date()
          });

          // 고정비의 lastGenerated 업데이트
          await updateDoc(doc(db, 'fixedExpenses', expense.id), {
            lastGenerated: monthKey
          });

          generatedCount++;
        } catch (err) {
          console.error(`Error generating transaction for ${expense.name}:`, err);
          errors.push(`${expense.name} 생성 실패`);
        }
      }

      return {
        success: errors.length === 0,
        generatedCount,
        errors
      };
    } catch (err) {
      console.error('Error generating fixed expenses:', err);
      setError('고정비 자동 생성에 실패했습니다.');
      return {
        success: false,
        generatedCount: 0,
        errors: ['전체 생성 프로세스 실패']
      };
    }
  };

  // 고정비 생성 상태 조회
  const getGenerationStatus = (year: number, month: number) => {
    return calculateGenerationStatus(fixedExpenses, year, month);
  };

  // 활성 고정비만 조회
  const getActiveFixedExpenses = () => {
    return fixedExpenses.filter(expense => expense.isActive);
  };

  // 카테고리별 고정비 조회
  const getFixedExpensesByCategory = () => {
    return fixedExpenses.reduce((groups, expense) => {
      const category = expense.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(expense);
      return groups;
    }, {} as Record<string, FixedExpense[]>);
  };

  return {
    // 상태
    fixedExpenses,
    loading,
    error,
    
    // CRUD 작업
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    toggleFixedExpense,
    
    // 자동 생성
    generateFixedExpensesForMonth,
    getGenerationStatus,
    
    // 조회 유틸리티
    getActiveFixedExpenses,
    getFixedExpensesByCategory,
    
    // 에러 클리어
    clearError: () => setError(null)
  };
};