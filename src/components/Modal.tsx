import { useEffect, useRef } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  isDarkMode?: boolean;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  onCancel?: () => void;
  children?: React.ReactNode;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  icon,
  type = 'info',
  isDarkMode = false,
  confirmText = '확인',
  onConfirm,
  cancelText,
  onCancel,
  children
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const lastButtonRef = useRef<HTMLButtonElement>(null);

  // ESC 키와 포커스 관리
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    const handleTab = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusableElements || focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleTab);
    
    // 모달이 열릴 때 body 스크롤 방지 및 첫 번째 버튼에 포커스
    document.body.style.overflow = 'hidden';
    
    // 약간의 지연 후 첫 번째 포커스 가능한 요소에 포커스
    setTimeout(() => {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 기본 아이콘 설정
  const getDefaultIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  // 확인 버튼 클릭 핸들러
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  // 취소 버튼 클릭 핸들러
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // 오버레이 클릭 핸들러 (모달 외부 클릭 시 닫기)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-message"
    >
      <div 
        ref={modalRef}
        className={`modal-content ${isDarkMode ? 'dark' : 'light'}`} 
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* 모달 아이콘 */}
        <span 
          className="modal-icon" 
          role="img" 
          aria-label={`${type} 아이콘`}
        >
          {icon || getDefaultIcon()}
        </span>
        
        {/* 모달 제목 */}
        <h3 
          id="modal-title"
          className={`modal-title ${type}`}
        >
          {title}
        </h3>
        
        {/* 모달 메시지 */}
        {message && (
          <p 
            id="modal-message"
            className="modal-message"
          >
            {message}
          </p>
        )}

        {/* 커스텀 콘텐츠 (폼 등) */}
        {children && (
          <div className="modal-custom-content">
            {children}
          </div>
        )}
        
        {/* 액션 버튼들 */}
        <div className="modal-buttons">
          {cancelText && (
            <button 
              ref={firstButtonRef}
              onClick={handleCancel} 
              onKeyPress={(e) => handleKeyPress(e, handleCancel)}
              className="modal-button cancel"
              type="button"
              aria-label={`${cancelText} 버튼`}
            >
              {cancelText}
            </button>
          )}
          
          <button 
            ref={cancelText ? lastButtonRef : firstButtonRef}
            onClick={handleConfirm} 
            onKeyPress={(e) => handleKeyPress(e, handleConfirm)}
            className={`modal-button ${type}`}
            type="button"
            aria-label={`${confirmText} 버튼`}
            autoFocus={!cancelText} // 취소 버튼이 없으면 자동 포커스
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;