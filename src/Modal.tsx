import { useEffect } from 'react';
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
  onCancel
}: ModalProps) => {
  
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content ${isDarkMode ? 'dark' : 'light'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <span className="modal-icon">
          {icon || getDefaultIcon()}
        </span>
        
        <h3 className={`modal-title ${type}`}>
          {title}
        </h3>
        
        <p className="modal-message">
          {message}
        </p>
        
        <div className="modal-buttons">
          {cancelText && (
            <button 
              onClick={handleCancel} 
              className="modal-button cancel"
            >
              {cancelText}
            </button>
          )}
          
          <button 
            onClick={handleConfirm} 
            className={`modal-button ${type}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;