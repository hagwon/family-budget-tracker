// src/hooks/useHolidays.ts
import { useState, useEffect } from 'react';

export interface Holiday {
  date: string; // YYYYMMDD 형식
  name: string;
  isHoliday: boolean;
}

// 공공데이터포털 특일정보 API
const API_KEY = 'YOUR_API_KEY_HERE'; // 공공데이터포털에서 발급받은 API 키
const API_URL = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

export const useHolidays = (year: number, month: number) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      setError(null);

      try {
        // 월의 시작일과 마지막일 계산
        const yearMonth = `${year}${month.toString().padStart(2, '0')}`;
        
        const params = new URLSearchParams({
          serviceKey: API_KEY,
          pageNo: '1',
          numOfRows: '100',
          solYear: year.toString(),
          solMonth: month.toString().padStart(2, '0'),
          _type: 'json'
        });

        const response = await fetch(`${API_URL}?${params}`);
        const data = await response.json();

        if (data.response?.body?.items?.item) {
          const items = Array.isArray(data.response.body.items.item) 
            ? data.response.body.items.item 
            : [data.response.body.items.item];

          const holidayData: Holiday[] = items.map((item: any) => ({
            date: item.locdate.toString(),
            name: item.dateName,
            isHoliday: item.isHoliday === 'Y'
          }));

          setHolidays(holidayData);
        } else {
          setHolidays([]);
        }
      } catch (err) {
        console.error('Failed to fetch holidays:', err);
        setError('공휴일 정보를 불러오는데 실패했습니다.');
        // API 실패 시 기본 공휴일 데이터 사용
        setHolidays(getDefaultHolidays(year, month));
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [year, month]);

  return { holidays, loading, error };
};

// API 실패 시 사용할 기본 공휴일 데이터
const getDefaultHolidays = (year: number, month: number): Holiday[] => {
  const holidays: Record<string, string> = {
    '0101': '신정',
    '0301': '3·1절',
    '0505': '어린이날',
    '0606': '현충일',
    '0815': '광복절',
    '1003': '개천절',
    '1009': '한글날',
    '1225': '크리스마스',
  };

  // 2025년 기준 음력 공휴일 (매년 변경됨)
  const lunarHolidays2025: Record<string, string> = {
    '0128': '설날 전날',
    '0129': '설날',
    '0130': '설날 다음날',
    '0505': '어린이날',
    '0506': '어린이날 대체공휴일',
    '1005': '추석 전날',
    '1006': '추석',
    '1007': '추석 다음날',
    '1008': '추석 대체공휴일',
  };

  const yearMonth = `${month.toString().padStart(2, '0')}`;
  const result: Holiday[] = [];

  // 양력 공휴일 확인
  Object.entries(holidays).forEach(([dateKey, name]) => {
    const [holidayMonth] = [dateKey.substring(0, 2)];
    if (holidayMonth === yearMonth) {
      result.push({
        date: `${year}${dateKey}`,
        name,
        isHoliday: true
      });
    }
  });

  // 음력 공휴일 확인 (2025년만)
  if (year === 2025) {
    Object.entries(lunarHolidays2025).forEach(([dateKey, name]) => {
      const [holidayMonth] = [dateKey.substring(0, 2)];
      if (holidayMonth === yearMonth) {
        result.push({
          date: `${year}${dateKey}`,
          name,
          isHoliday: true
        });
      }
    });
  }

  return result;
};

// 특정 날짜가 공휴일인지 확인하는 헬퍼 함수
export const isHoliday = (date: Date, holidays: Holiday[]): Holiday | null => {
  const dateString = date.getFullYear().toString() + 
                    (date.getMonth() + 1).toString().padStart(2, '0') + 
                    date.getDate().toString().padStart(2, '0');
  
  return holidays.find(holiday => holiday.date === dateString) || null;
};

// 주말인지 확인하는 헬퍼 함수
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
};