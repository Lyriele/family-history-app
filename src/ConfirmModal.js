import React, { useRef, useEffect } from 'react';

// ConfirmModal Component: A reusable modal for confirmation messages.
const ConfirmModal = ({
  showModal,
  onClose,
  onConfirm,
  message
}) => {
  const modalRef = useRef(); // Ref for detecting clicks outside the modal

  // Effect to close modal on outside click
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

  // If the modal is not visible, don't render anything
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 print:hidden z-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Action</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors duration-200 font-medium shadow-sm"
          >
            No, Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 font-bold shadow-md"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
