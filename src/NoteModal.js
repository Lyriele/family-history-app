import React, { useRef, useEffect } from 'react';

// NoteModal Component: Handles the form for adding and editing family stories/notes.
const NoteModal = ({
  showModal,
  onClose,
  onSubmit,
  newNote,
  handleNoteChange,
  familyMembers,
  editingNote
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

  // Helper to get member name for the dropdown
  const getMemberName = (id) => {
    const member = familyMembers.find(m => m.id === id);
    return member ? member.name : 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 print:hidden z-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{editingNote ? 'Edit Family Story' : 'Add New Family Story'}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Title Input */}
          <div>
            <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="noteTitle"
              name="title"
              value={newNote.title}
              onChange={handleNoteChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          {/* Content Textarea */}
          <div>
            <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700">Story/Content</label>
            <textarea
              id="noteContent"
              name="content"
              value={newNote.content}
              onChange={handleNoteChange}
              rows="6"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
              required
            ></textarea>
          </div>
          {/* Related Member Selection */}
          <div>
            <label htmlFor="relatedMemberId" className="block text-sm font-medium text-gray-700">Relate to Family Member (Optional)</label>
            <select
              id="relatedMemberId"
              name="relatedMemberId"
              value={newNote.relatedMemberId}
              onChange={handleNoteChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">None</option>
              {familyMembers
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                .map(member => (
                  <option key={member.id} value={member.id}>{getMemberName(member.id)}</option>
                ))}
            </select>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors duration-200 font-medium shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors duration-200 font-bold shadow-md"
            >
              {editingNote ? 'Update Story' : 'Add Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;
