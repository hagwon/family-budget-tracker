// src/hooks/useHolidays.ts
import { useState, useEffect } from 'react';

export interface Holiday {
  date: string; // YYYYMMDD 형식
  name: string;
  isHoliday: boolean;
}

// 환경변수에서 API 키 가져오기
const API_KEY = import.meta.env.VITE_HOLIDAY_API_KEY;

// 여러 CORS 프록시 서비스 URL (백업용)
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://proxy.cors.sh/',
  'https://api.codetabs.com/v1/proxy?quest='
];

// 공공데이터포털 특일정보 API (공휴일 정보조회)
const API_BASE_URL = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo';

// 백업용 정적 공휴일 데이터 (API 실패 시 사용)
const KOREA_HOLIDAYS_2025: Record<string, string> = {
  '20250101': '신정',
  '20250301': '3·1절',
  '20250505': '어린이날',
  '20250506': '어린이날 대체공휴일',
  '20250606': '현충일',
  '20250815': '광복절',
  '20251003': '개천절',
  '20251009': '한글날',
  '20251225': '크리스마스',
  '20250128': '설날 전날',
  '20250129': '설날',
  '20250130': '설날 다음날',
  '20250131': '설날 연휴',
  '20250524': '부처님오신날',
  '20251005': '추석 전날',
  '20251006': '추석',
  '20251007': '추석 다음날',
  '20251008': '추석 대체공휴일',
};

const KOREA_HOLIDAYS_2026: Record<string, string> = {
  '20260101': '신정',
  '20260301': '3·1절',
  '20260505': '어린이날',
  '20260606': '현충일',
  '20260815': '광복절',
  '20261003': '개천절',
  '20261009': '한글날',
  '20261225': '크리스마스',
  '20260216': '설날 전날',
  '20260217': '설날',
  '20260218': '설날 다음날',
  '20260524': '부처님오신날',
  '20260924': '추석 전날',
  '20260925': '추석',
  '20260926': '추석 다음날',
};

const ALL_HOLIDAYS: Record<number, Record<string, string>> = {
  2025: KOREA_HOLIDAYS_2025,
  2026: KOREA_HOLIDAYS_2026,
};

// XML 파싱 함수 개선
const parseXMLResponse = (xmlString: string): Holiday[] => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // 파싱 에러 체크
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML 파싱 오류: ' + parseError.textContent);
    }

    // 에러 응답 체크
    const errorCode = xmlDoc.querySelector('returnAuthMsg, cmmMsgHeader > errMsg');
    if (errorCode) {
      throw new Error('API 오류: ' + errorCode.textContent);
    }
    
    const items = xmlDoc.querySelectorAll('item');
    const holidays: Holiday[] = [];
    
    items.forEach(item => {
      const dateName = item.querySelector('dateName')?.textContent;
      const locdate = item.querySelector('locdate')?.textContent;
      const isHoliday = item.querySelector('isHoliday')?.textContent;
      
      if (dateName && locdate) {
        holidays.push({
          date: locdate,
          name: dateName,
          isHoliday: isHoliday === 'Y'
        });
      }
    });
    
    return holidays;
  } catch (error) {
    throw error;
  }
};

// API 키 처리 함수 (인코딩하지 않고 그대로 사용)
const prepareAPIKey = (apiKey: string): string => {
  // API 키를 그대로 사용 (이미 디코딩된 키를 받았으므로)
  return apiKey.trim();
};

export const useHolidays = (year: number, month: number) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'static'>('static');
  const [isAPIConfigured, setIsAPIConfigured] = useState(false);

  useEffect(() => {
    // API 키 설정 확인
    const apiConfigured = API_KEY && 
                         API_KEY.trim() !== '' && 
                         API_KEY !== 'YOUR_API_KEY_HERE' &&
                         API_KEY.length > 50; // 공공데이터포털 API 키는 보통 80자 이상
    setIsAPIConfigured(apiConfigured);

    const fetchHolidays = async () => {
      setLoading(true);
      setError(null);

      try {
        // API 키가 설정되어 있을 때만 실시간 API 호출
        if (apiConfigured) {
          await fetchHolidaysFromAPI(year, month);
          setDataSource('api');
        } else {
          await fetchHolidaysFromStaticData(year, month);
          setDataSource('static');
        }
      } catch (err) {
        // API 실패 시 백업 데이터 사용
        await fetchHolidaysFromStaticData(year, month);
        setDataSource('static');
        
        // 에러 메시지 개선
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
          setError('API 키가 등록되지 않았거나 올바르지 않습니다. .env 파일의 VITE_HOLIDAY_API_KEY를 확인해주세요.');
        } else if (errorMessage.includes('SERVICE ERROR')) {
          setError('공공데이터포털 서비스 오류입니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError('실시간 공휴일 정보를 불러오지 못했습니다. 기본 공휴일 정보를 사용합니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    // 실시간 API에서 공휴일 정보 가져오기 (여러 프록시 시도)
    const fetchHolidaysFromAPI = async (year: number, month: number) => {
      const apiKey = prepareAPIKey(API_KEY);
      
      // API 파라미터 구성
      const params = new URLSearchParams({
        serviceKey: apiKey,
        pageNo: '1',
        numOfRows: '100',
        solYear: year.toString(),
        solMonth: month.toString().padStart(2, '0'),
        _type: 'xml'
      });

      const apiUrl = `${API_BASE_URL}?${params.toString()}`;
      
      let lastError: Error | null = null;

      // 여러 프록시 서비스를 순차적으로 시도
      for (let i = 0; i < CORS_PROXIES.length; i++) {
        const proxy = CORS_PROXIES[i];
        
        try {
          let proxyUrl: string;
          let fetchConfig: RequestInit = {
            method: 'GET',
            headers: {
              'Accept': 'application/xml, text/xml, */*',
            },
          };

          if (proxy.includes('allorigins.win')) {
            proxyUrl = `${proxy}${encodeURIComponent(apiUrl)}`;
          } else if (proxy.includes('cors-anywhere')) {
            proxyUrl = `${proxy}${apiUrl}`;
            fetchConfig.headers = {
              ...fetchConfig.headers,
              'X-Requested-With': 'XMLHttpRequest',
            };
          } else if (proxy.includes('corsproxy.io')) {
            proxyUrl = `${proxy}${encodeURIComponent(apiUrl)}`;
          } else if (proxy.includes('cors.sh')) {
            proxyUrl = `${proxy}${apiUrl}`;
          } else if (proxy.includes('codetabs.com')) {
            proxyUrl = `${proxy}${encodeURIComponent(apiUrl)}`;
          } else {
            proxyUrl = `${proxy}${encodeURIComponent(apiUrl)}`;
          }
          
          const response = await fetch(proxyUrl, fetchConfig);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          let xmlString: string;

          if (proxy.includes('allorigins.win')) {
            const proxyData = await response.json();
            xmlString = proxyData.contents;
            if (!xmlString) {
              throw new Error('프록시에서 빈 응답을 받았습니다.');
            }
          } else if (proxy.includes('codetabs.com')) {
            const proxyData = await response.json();
            xmlString = proxyData.data || proxyData;
          } else {
            xmlString = await response.text();
            if (!xmlString) {
              throw new Error('빈 응답을 받았습니다.');
            }
          }

          // XML 파싱
          const holidayData = parseXMLResponse(xmlString);
          
          // 성공하면 데이터 설정하고 즉시 함수 종료
          setHolidays(holidayData);
          return; // 성공하면 즉시 종료
          
        } catch (error) {
          lastError = error as Error;
          
          // 마지막 프록시가 아니면 다음 프록시 시도
          if (i < CORS_PROXIES.length - 1) {
            continue;
          }
        }
      }

      // 모든 프록시 실패 시
      if (lastError) {
        throw new Error(`모든 프록시 서비스 실패. 마지막 오류: ${lastError.message}`);
      }
    };

    // 정적 데이터에서 공휴일 정보 가져오기
    const fetchHolidaysFromStaticData = async (year: number, month: number) => {
      const yearHolidays = ALL_HOLIDAYS[year] || {};
      const monthStr = month.toString().padStart(2, '0');
      
      const holidayData: Holiday[] = [];
      
      Object.entries(yearHolidays).forEach(([dateStr, name]) => {
        const holidayMonth = dateStr.substring(4, 6);
        if (holidayMonth === monthStr) {
          holidayData.push({
            date: dateStr,
            name,
            isHoliday: true
          });
        }
      });

      setHolidays(holidayData);
    };

    fetchHolidays();
  }, [year, month]);

  return { holidays, loading, error, dataSource, isAPIConfigured };
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

// 특정 날짜가 공휴일 또는 주말인지 확인하는 헬퍼 함수
export const isHolidayOrWeekend = (date: Date, holidays: Holiday[]): boolean => {
  return isWeekend(date) || isHoliday(date, holidays) !== null;
};

// 다음 평일 찾기 (공휴일/주말 제외)
export const getNextWorkday = (date: Date, holidays: Holiday[]): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (isHolidayOrWeekend(nextDay, holidays)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
};

// 이전 평일 찾기 (공휴일/주말 제외)
export const getPreviousWorkday = (date: Date, holidays: Holiday[]): Date => {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  
  while (isHolidayOrWeekend(prevDay, holidays)) {
    prevDay.setDate(prevDay.getDate() - 1);
  }
  
  return prevDay;
};

// 월별 평일 수 계산
export const getWorkdaysInMonth = (year: number, month: number, holidays: Holiday[]): number => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  let workdays = 0;
  
  for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
    if (!isHolidayOrWeekend(date, holidays)) {
      workdays++;
    }
  }
  
  return workdays;
};

// API 키 설정 확인 함수 (BudgetOverview.tsx에서 사용)
export const getAPIKeyStatus = (): { 
  isConfigured: boolean; 
  message: string; 
  instruction: string;
} => {
  const apiKey = import.meta.env.VITE_HOLIDAY_API_KEY;
  
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_API_KEY_HERE') {
    return {
      isConfigured: false,
      message: '정적 공휴일 데이터 사용 중',
      instruction: '.env 파일에 VITE_HOLIDAY_API_KEY를 설정하면 실시간 업데이트가 가능합니다'
    };
  }
  
  return {
    isConfigured: true,
    message: '실시간 공휴일 API 활성화됨',
    instruction: '최신 공휴일 정보가 자동 업데이트됩니다'
  };
};

// 공휴일 이름 축약 함수
export const truncateHolidayName = (name: string, maxLength: number = 3): string => {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength) + '...';
};