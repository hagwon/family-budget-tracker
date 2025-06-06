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

const DEFAULT_ICONS = {
  error: '❌',
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️'
} as const;

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

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleTab);
    document.body.style.overflow = 'hidden';
    
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

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
        <span 
          className="modal-icon" 
          role="img" 
          aria-label={`${type} 아이콘`}
        >
          {icon || DEFAULT_ICONS[type]}
        </span>
        
        <h3 
          id="modal-title"
          className={`modal-title ${type}`}
        >
          {title}
        </h3>
        
        {message && (
          <p 
            id="modal-message"
            className="modal-message"
          >
            {message}
          </p>
        )}

        {children && (
          <div className="modal-custom-content">
            {children}
          </div>
        )}
        
        <div className="modal-buttons">
          {cancelText && (
            <button 
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
            onClick={handleConfirm} 
            onKeyPress={(e) => handleKeyPress(e, handleConfirm)}
            className={`modal-button ${type}`}
            type="button"
            aria-label={`${confirmText} 버튼`}
            autoFocus={!cancelText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;