import React, { useRef, useEffect } from 'react';

// MemberModal Component: Handles the form for adding and editing family members.
const MemberModal = ({
  showModal,
  onClose,
  onSubmit,
  newMember,
  handleMemberChange,
  handleRelationshipChange,
  familyMembers,
  editingMember
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
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{editingMember ? 'Edit Family Member' : 'Add New Family Member'}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newMember.name}
              onChange={handleMemberChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          {/* Birth and Death Dates/Places */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Birth Date</label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={newMember.birthDate}
                onChange={handleMemberChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700">Birth Place</label>
              <input
                type="text"
                id="birthPlace"
                name="birthPlace"
                value={newMember.birthPlace}
                onChange={handleMemberChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700">Death Date</label>
              <input
                type="date"
                id="deathDate"
                name="deathDate"
                value={newMember.deathDate}
                onChange={handleMemberChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="deathPlace" className="block text-sm font-medium text-gray-700">Death Place</label>
              <input
                type="text"
                id="deathPlace"
                name="deathPlace"
                value={newMember.deathPlace}
                onChange={handleMemberChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Spouse Selection */}
          <div>
            <label htmlFor="spouse" className="block text-sm font-medium text-gray-700">Spouse</label>
            <select
              id="spouse"
              name="spouse"
              value={newMember.spouse}
              onChange={handleMemberChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Spouse (Optional)</option>
              {familyMembers
                .filter(member => member.id !== (editingMember ? editingMember.id : null)) // Cannot be spouse to self
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                .map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
            </select>
          </div>

          {/* Parents Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Parents</label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {familyMembers
                .filter(member => member.id !== (editingMember ? editingMember.id : null) && // Cannot be parent to self
                  !newMember.children.includes(member.id)) // Cannot be parent to own child (circular logic check)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(member => (
                  <div key={`parent-${member.id}`} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`parent-${member.id}`}
                      checked={newMember.parents.includes(member.id)}
                      onChange={() => handleRelationshipChange('parents', member.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`parent-${member.id}`} className="ml-2 text-sm text-gray-900">{member.name}</label>
                  </div>
                ))}
            </div>
          </div>

          {/* Children Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Children</label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {familyMembers
                .filter(member => member.id !== (editingMember ? editingMember.id : null) && // Cannot be child to self
                  !newMember.parents.includes(member.id)) // Cannot be child to own parent (circular logic check)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(member => (
                  <div key={`child-${member.id}`} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`child-${member.id}`}
                      checked={newMember.children.includes(member.id)}
                      onChange={() => handleRelationshipChange('children', member.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`child-${member.id}`} className="ml-2 text-sm text-gray-900">{member.name}</label>
                  </div>
                ))}
            </div>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors duration-200 font-bold shadow-md"
            >
              {editingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberModal;
