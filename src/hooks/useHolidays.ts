// src/hooks/useHolidays.ts
import { useState, useEffect } from 'react';

export interface Holiday {
  date: string;
  name: string;
  isHoliday: boolean;
}

const API_KEY = import.meta.env.VITE_HOLIDAY_API_KEY;

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://proxy.cors.sh/',
  'https://api.codetabs.com/v1/proxy?quest='
];

const API_BASE_URL = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo';

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

const parseXMLResponse = (xmlString: string): Holiday[] => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML 파싱 오류: ' + parseError.textContent);
    }

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

const prepareAPIKey = (apiKey: string): string => {
  return apiKey.trim();
};

export const useHolidays = (year: number, month: number) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'static'>('static');
  const [isAPIConfigured, setIsAPIConfigured] = useState(false);

  useEffect(() => {
    const apiConfigured = API_KEY && 
                         API_KEY.trim() !== '' && 
                         API_KEY !== 'YOUR_API_KEY_HERE' &&
                         API_KEY.length > 50;
    setIsAPIConfigured(apiConfigured);

    const fetchHolidays = async () => {
      setLoading(true);
      setError(null);

      try {
        if (apiConfigured) {
          await fetchHolidaysFromAPI(year, month);
          setDataSource('api');
        } else {
          await fetchHolidaysFromStaticData(year, month);
          setDataSource('static');
        }
      } catch (err) {
        await fetchHolidaysFromStaticData(year, month);
        setDataSource('static');
        
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

    const fetchHolidaysFromAPI = async (year: number, month: number) => {
      const apiKey = prepareAPIKey(API_KEY);
      
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

          const holidayData = parseXMLResponse(xmlString);
          setHolidays(holidayData);
          return;
          
        } catch (error) {
          lastError = error as Error;
          
          if (i < CORS_PROXIES.length - 1) {
            continue;
          }
        }
      }

      if (lastError) {
        throw new Error(`모든 프록시 서비스 실패. 마지막 오류: ${lastError.message}`);
      }
    };

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

export const isHoliday = (date: Date, holidays: Holiday[]): Holiday | null => {
  const dateString = date.getFullYear().toString() + 
                    (date.getMonth() + 1).toString().padStart(2, '0') + 
                    date.getDate().toString().padStart(2, '0');
  
  return holidays.find(holiday => holiday.date === dateString) || null;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

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

export const truncateHolidayName = (name: string, maxLength: number = 3): string => {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength) + '...';
};