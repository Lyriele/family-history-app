import React, { useRef, useEffect } from 'react';
import './App.css'; // Assuming your modal-overlay and modal-content styles are here

const WelcomeModal = ({ showModal, onClose, onLoginClick, onContinueAsGuest }) => {
  const modalRef = useRef();

  // Close modal if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal, onClose]);

  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-content welcome-modal-content">
        <h3 className="modal-title">Welcome to Family Tree Keeper!</h3>
        <p className="modal-message">
          This website is designed for your <strong>personal family history</strong>.
          Record your family tree and precious stories here with complete peace of mind –
          your data is <strong>private</strong> and <strong>only accessible by you</strong>.
        </p>
        <div className="modal-actions-center">
        <button onClick={onLoginClick} style={{ marginRight: '10px' }}>
          Login to save records
        </button>
        <button onClick={onContinueAsGuest}>
          Continue as Guest
        </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;