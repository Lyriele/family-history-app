/* global __app_id, __firebase_config, __initial_auth_token */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import './App.css';
import WelcomeModal from './WelcomeModal';
import BalkanFamilyTreeWrapper from './BalkanFamilyTreeWrapper';
import LottieAnimation from './LottieAnimation';
import Select from 'react-select';



// MemberModal Component (UPDATED with react-select and photo inputs)
const MemberModal = ({
  showModal,
  onClose,
  onSubmit,
  newMember,
  handleMemberChange,
  handleRelationshipChange, // Will pass this down
  handlePhotoUpload, // NEW: Pass this handler for file input
  familyMembers,
  editingMember
}) => {
  const modalRef = useRef();

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

  // Make sure these hooks are declared at the top, unconditionally
  const relationshipOptions = useMemo(() => {
    return familyMembers
      .filter(member => member.id !== (editingMember ? editingMember.id : null))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(member => ({ value: member.id, label: member.name }));
  }, [familyMembers, editingMember]);

  const handleSelectRelationshipChange = useCallback((selectedOptions, type) => {
    const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    // The 'true' indicates that this is a full replacement from react-select
    handleRelationshipChange(type, selectedIds, true);
  }, [handleRelationshipChange]);


  if (!showModal) return null; // This is the ONLY conditional return allowed here

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-content">
        <h3 className="modal-title">{editingMember ? 'Edit Family Member' : 'Add New Family Member'}</h3>
        <form onSubmit={onSubmit} className="form-grid">
          <div>
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newMember.name}
              onChange={handleMemberChange}
              className="form-input"
              required
            />
          </div>
          <div className="grid-col-2">
            <div>
              <label htmlFor="birthDate" className="form-label">Birth Date</label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={newMember.birthDate}
                onChange={handleMemberChange}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="birthPlace" className="form-label">Birth Place</label>
              <input
                type="text"
                id="birthPlace"
                name="birthPlace"
                value={newMember.birthPlace}
                onChange={handleMemberChange}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="deathDate" className="form-label">Death Date</label>
              <input
                type="date"
                id="deathDate"
                name="deathDate"
                value={newMember.deathDate}
                onChange={handleMemberChange}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="deathPlace" className="form-label">Death Place</label>
              <input
                type="text"
                id="deathPlace"
                name="deathPlace"
                value={newMember.deathPlace}
                onChange={handleMemberChange}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="form-label">Gender</label>
              <select
              id="gender"
              name="gender"
              value={newMember.gender}
              onChange={handleMemberChange}
              className="form-input"
              required
              >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unknown">Unknown</option>
              </select>
          </div>

          <div>
            <label htmlFor="spouse" className="form-label">Spouse</label>
            <select
              id="spouse"
              name="spouse"
              value={newMember.spouse}
              onChange={handleMemberChange}
              className="form-input"
            >
              <option value="">Select Spouse (Optional)</option>
              {familyMembers
                .filter(member => member.id !== (editingMember ? editingMember.id : null))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
            </select>
          </div>

          {/* Photo Upload Input and Preview */}
          <div>
            <label htmlFor="memberPhotoUpload" className="form-label">Upload Photo</label>
            <input
              type="file"
              id="memberPhotoUpload"
              name="photoFile"
              accept="image/*"
              onChange={handlePhotoUpload} // Use the passed-in prop
              className="form-input"
            />
            {newMember.photoPreview && (
              <img src={newMember.photoPreview} alt="Selected member preview" style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px', borderRadius: '5px' }} />
            )}
          </div>
          <div>
            <label htmlFor="photoUrl" className="form-label">Photo URL (from upload or manual)</label>
            <input
              type="text"
              id="photoUrl"
              name="photo"
              value={newMember.photo}
              onChange={handleMemberChange}
              className="form-input"
              placeholder="URL will appear here after upload, or enter manually"
              readOnly={newMember.photoFile ? true : false} // Make read-only if a file is selected
            />
          </div>

          {/* Parents section with react-select */}
          <div>
            <label htmlFor="parents-select" className="form-label">Parents</label>
            <Select
              id="parents-select"
              isMulti
              name="parents"
              options={relationshipOptions.filter(option => !newMember.children.includes(option.value))}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Select parents..."
              value={relationshipOptions.filter(option => newMember.parents.includes(option.value))}
              onChange={(selectedOptions) => handleSelectRelationshipChange(selectedOptions, 'parents')}
            />
          </div>

          {/* Children section with react-select */}
          <div>
            <label htmlFor="children-select" className="form-label">Children</label>
            <Select
              id="children-select"
              isMulti
              name="children"
              options={relationshipOptions.filter(option => !newMember.parents.includes(option.value))}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Select children..."
              value={relationshipOptions.filter(option => newMember.children.includes(option.value))}
              onChange={(selectedOptions) => handleSelectRelationshipChange(selectedOptions, 'children')}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-submit-indigo"
            >
              {editingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// NoteModal Component 
const NoteModal = ({
  showModal,
  onClose,
  onSubmit,
  newNote,
  handleNoteChange,
  familyMembers,
  editingNote
}) => {
  const modalRef = useRef();

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

  const getMemberName = (id) => {
    const member = familyMembers.find(m => m.id === id);
    return member ? member.name : 'Unknown';
  };

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-content">
        <h3 className="modal-title">{editingNote ? 'Edit Family Story' : 'Add New Family Story'}</h3>
        <form onSubmit={onSubmit} className="form-vertical">
          <div>
            <label htmlFor="noteTitle" className="form-label">Title</label>
            <input
              type="text"
              id="noteTitle"
              name="title"
              value={newNote.title}
              onChange={handleNoteChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="noteContent" className="form-label">Story/Content</label>
            <textarea
              id="noteContent"
              name="content"
              value={newNote.content}
              onChange={handleNoteChange}
              rows="6"
              className="form-input textarea-large"
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="relatedMemberId" className="form-label">Relate to Family Member (Optional)</label>
            <select
              id="relatedMemberId"
              name="relatedMemberId"
              value={newNote.relatedMemberId}
              onChange={handleNoteChange}
              className="form-input"
            >
              <option value="">None</option>
              {familyMembers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(member => (
                  <option key={member.id} value={member.id}>{getMemberName(member.id)}</option>
                ))}
            </select>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-submit-purple"
            >
              {editingNote ? 'Update Story' : 'Add Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ConfirmModal Component
const ConfirmModal = ({
  showModal,
  onClose,
  onConfirm,
  message
}) => {
  const modalRef = useRef();

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
      <div ref={modalRef} className="modal-content small-modal">
        <h3 className="modal-title">Confirm Action</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions-center">
          <button
            onClick={onClose}
            className="button-cancel"
          >
            No, Cancel
          </button>
          <button
            onClick={onConfirm}
            className="button-danger"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};



// Main App component
const App = () => {
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  // eslint-disable-next-line no-unused-vars
  const [app, setApp] = useState(null);  
  const [db, setDb] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [auth, setAuth] = useState(null); 
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [primaryRootId, setPrimaryRootId] = useState(null);
  const [newMember, setNewMember] = useState({
    name: '',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    gender: '',
    spouse: '',
    parents: [],
    children: [],
    photo: '', 
    photoFile: null, 
    photoPreview: null
  });
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    relatedMemberId: ''
  });
  const [editingMember, setEditingMember] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [activeTab, setActiveTab] = useState('list');
const [showWelcomeModal, setShowWelcomeModal] = useState(false);
// eslint-disable-next-line no-unused-vars
  const [hasShownWelcome, setHasShownWelcome] = useState(false); 



  const handleCloseWelcomeModal = async () => {
    setShowWelcomeModal(false);
    
    // Mark that user has seen the welcome message
    if (db && userId && appId) {
      try {
        const userDocRef = doc(db, `artifacts/${appId}/users`, userId);
        await setDoc(userDocRef, { hasSeenWelcome: true }, { merge: true });
      } catch (error) {
        console.error("Error updating welcome status:", error);
      }
    }
  };


  // Initialize Firebase and handle authentication
  useEffect(() => {
    try {
      const firebaseConfig = typeof __firebase_config !== 'undefined'
        ? JSON.parse(__firebase_config)
        : {
            apiKey: "AIzaSyBXRxvdVG5eM09rTUryRIHcD-IK-RDxg_w",
            authDomain: "family-tree-aac71.firebaseapp.com",
            projectId: "family-tree-aac71",
            storageBucket: "family-tree-aac71.firebasestorage.app",
            messagingSenderId: "836307590899",
            appId: "1:836307590899:web:4cd8ab88cd6ae8cbb62186",
            measurementId: "G-XZN0DTVFJT"
          };

      const firebaseApp = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(firebaseApp);
      const firebaseAuth = getAuth(firebaseApp);

      setApp(firebaseApp);
      setDb(firestoreDb);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthenticated(true);

    
          if (firestoreDb) {
            const userDocRef = doc(firestoreDb, `artifacts/${appId}/users`, user.uid);
            try {
              const userDoc = await getDoc(userDocRef); 
              if (userDoc.exists()) {
                const userData = userDoc.data();
                if (!userData.hasSeenWelcome) {
                  setShowWelcomeModal(true);
                }
                setHasShownWelcome(userData.hasSeenWelcome || false);
              } else {
                // First time user, show welcome and set flag
                setShowWelcomeModal(true);
                // The flag will be set in handleCloseWelcomeModal
              }
            } catch (error) {
              console.error("Error fetching user data for welcome message:", error);
              // Fallback: show welcome if there's an error fetching user data
              setShowWelcomeModal(true);
            }
          }

        } else {
          if (typeof __initial_auth_token !== 'undefined') {
            try {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
            } catch (error) {
              console.error("Firebase custom token authentication failed:", error);
              try {
                await signInAnonymously(firebaseAuth);
              } catch (anonError) {
                console.error("Firebase anonymous authentication failed:", anonError);
                // If anonymous sign-in fails, generate a local ID as a last resort.
                // This user won't persist data to Firebase unless they authenticate later.
                setUserId(crypto.randomUUID());
              }
            }
          } else {
            try {
              await signInAnonymously(firebaseAuth);
            } catch (error) {
              console.error("Firebase anonymous authentication failed:", error);
              setUserId(crypto.randomUUID());
            }
          }
          setIsAuthenticated(true);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, [appId]); 

  // Fetch data
  useEffect(() => {
    if (isAuthenticated && db && userId && appId) {
      const familyMembersRef = collection(db, `artifacts/${appId}/users/${userId}/members`);
      const unsubscribeMembers = onSnapshot(familyMembersRef, (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFamilyMembers(membersData);

        if (membersData.length > 0) {
          const membersMap = membersData.reduce((map, member) => {
            map[member.id] = member;
            return map;
          }, {});

          const potentialRoots = membersData.filter(member =>
            !member.parents || member.parents.length === 0 ||
            member.parents.every(pid => !membersMap[pid])
          );

          if (!primaryRootId || !membersMap[primaryRootId]) {
            setPrimaryRootId(potentialRoots.length > 0 ? potentialRoots[0].id : membersData[0].id);
          }
        } else {
          setPrimaryRootId(null);
        }
      }, (error) => {
        console.error("Error fetching family members:", error);
      });

      const notesRef = collection(db, `artifacts/${appId}/users/${userId}/notes`);
      const unsubscribeNotes = onSnapshot(notesRef, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotes(notesData);
      }, (error) => {
        console.error("Error fetching notes:", error);
      });

      return () => {
        unsubscribeMembers();
        unsubscribeNotes();
      };
    }
  }, [isAuthenticated, db, userId, appId, primaryRootId]);


  // --- Family Member Management ---

  const handleMemberChange = (e) => {
    const { name, value } = e.target;
    setNewMember(prev => ({ ...prev, [name]: value }));
  };


  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
  
      const previewUrl = URL.createObjectURL(file);
      setNewMember(prev => ({
        ...prev,
        photoFile: file,
        photoPreview: previewUrl,
        photo: '' // Clear previous URL when new file is selected
      }));
    }
  };

  const handleRelationshipChange = useCallback((type, idOrIds, isReplace = false) => {
    setNewMember(prevMember => {
      if (isReplace) { // If it's from react-select, replace the whole array
        return { ...prevMember, [type]: idOrIds };
      } else { // If it's still from a single checkbox/button toggle (if any exist)
        const currentIds = prevMember[type] || [];
        const updatedIds = currentIds.includes(idOrIds)
          ? currentIds.filter(item => item !== idOrIds)
          : [...currentIds, idOrIds];
        return { ...prevMember, [type]: updatedIds };
      }
    });
  }, []); // Empty dependency array, assuming setNewMember is stable or you're fine with it


  const addOrUpdateFamilyMember = async (e) => {
    e.preventDefault();
  
    if (!db || !userId || !appId) {
      console.error("Firestore not initialized or user not authenticated.");
      return;
    }
  
    try {
      let finalPhotoUrl = newMember.photo; // Start with existing URL (if any)
  
      // Handle photo upload if a new file was selected
      if (newMember.photoFile) {
        try {
          console.log("Starting photo upload...");
          const storage = getStorage();
          
          // Create a unique filename with timestamp to prevent collisions
          const fileExt = newMember.photoFile.name.split('.').pop();
          const timestamp = Date.now();
          const filename = `member_${timestamp}.${fileExt}`;
          const storagePath = `users/${userId}/members/${filename}`;
          const photoRef = ref(storage, storagePath);
          
          console.log("Uploading file to:", storagePath);
          const uploadResult = await uploadBytes(photoRef, newMember.photoFile);
          console.log("Upload complete, getting download URL...");
          
          finalPhotoUrl = await getDownloadURL(uploadResult.ref);
          console.log("Photo uploaded successfully. URL:", finalPhotoUrl);
        } catch (uploadError) {
          console.error("Error uploading photo:", uploadError);
          throw new Error("Failed to upload photo. Please try again.");
        }
      } else if (editingMember && !newMember.photoFile && newMember.photo === '') {
        // Case: User cleared the photo URL when editing
        finalPhotoUrl = '';
      }
  
      // Prepare member data for Firestore (excluding temporary fields)
      const memberToSave = {
        name: newMember.name,
        birthDate: newMember.birthDate,
        birthPlace: newMember.birthPlace,
        deathDate: newMember.deathDate,
        deathPlace: newMember.deathPlace,
        gender: newMember.gender,
        spouse: newMember.spouse || '',
        parents: newMember.parents.filter(id => id !== ''),
        children: newMember.children.filter(id => id !== ''),
        photo: finalPhotoUrl
      };
  
      console.log("Member data to save:", memberToSave);
  
      let oldMember = null;
      let memberId = editingMember ? editingMember.id : null;
  
      const membersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/members`);
  
      // Save the member document
      if (editingMember) {
        oldMember = familyMembers.find(m => m.id === editingMember.id);
        const memberDocRef = doc(membersCollectionRef, editingMember.id);
        await updateDoc(memberDocRef, memberToSave);
        console.log("Member updated successfully:", editingMember.id);
      } else {
        const docRef = await addDoc(membersCollectionRef, memberToSave);
        memberId = docRef.id;
        console.log("New member added with ID:", memberId);
      }
  
      // Handle relationship updates (spouse, parents, children)
      const currentSpouseId = memberToSave.spouse;
      const oldSpouseId = oldMember ? (oldMember.spouse || '') : '';
  
      if (currentSpouseId !== oldSpouseId) {
        if (oldSpouseId && oldSpouseId !== currentSpouseId) {
          const oldSpouseRef = doc(membersCollectionRef, oldSpouseId);
          await updateDoc(oldSpouseRef, { spouse: '' });
        }
        if (currentSpouseId) {
          const newSpouseRef = doc(membersCollectionRef, currentSpouseId);
          await updateDoc(newSpouseRef, { spouse: memberId });
        }
      }
  
      // Handle parents relationships
      const currentParents = new Set(memberToSave.parents || []);
      const oldParents = new Set(oldMember ? (oldMember.parents || []) : []);
  
      for (const parentId of currentParents) {
        if (!oldParents.has(parentId)) {
          const parentRef = doc(membersCollectionRef, parentId);
          await updateDoc(parentRef, { children: arrayUnion(memberId) });
        }
      }
      for (const parentId of oldParents) {
        if (!currentParents.has(parentId)) {
          const parentRef = doc(membersCollectionRef, parentId);
          await updateDoc(parentRef, { children: arrayRemove(memberId) });
        }
      }
  
      // Handle children relationships
      const currentChildren = new Set(memberToSave.children || []);
      const oldChildren = new Set(oldMember ? (oldMember.children || []) : []);
  
      for (const childId of currentChildren) {
        if (!oldChildren.has(childId)) {
          const childRef = doc(membersCollectionRef, childId);
          await updateDoc(childRef, { parents: arrayUnion(memberId) });
        }
      }
      for (const childId of oldChildren) {
        if (!currentChildren.has(childId)) {
          const childRef = doc(membersCollectionRef, childId);
          await updateDoc(childRef, { parents: arrayRemove(memberId) });
        }
      }
  
      console.log("All relationships updated successfully");
      
      // Clean up and close modal
      resetMemberForm();
      setShowMemberModal(false);
  
    } catch (error) {
      console.error("Error in addOrUpdateFamilyMember:", error);
      alert(error.message || "An error occurred while saving the family member.");
    }
  };

  
  const startEditMember = (member) => {
    setEditingMember(member);
    setNewMember({
      name: member.name,
      birthDate: member.birthDate,
      birthPlace: member.birthPlace || '',
      deathDate: member.deathDate,
      deathPlace: member.deathPlace || '',
      spouse: member.spouse || '',
      parents: member.parents || [],
      children: member.children || [],
      gender: member.gender || 'unknown',
      photo: member.photo || '',
      photoFile: null,
      photoPreview: member.photo || null
    });
    setShowMemberModal(true);
  };

  const confirmDeleteMember = (memberId) => {
    setConfirmMessage("Are you sure you want to delete this family member? This action cannot be undone. All relationships involving this member will also be removed.");
    setConfirmAction(() => async () => {
      if (!db || !userId || !appId) return;
      try {
        const membersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/members`);
        const memberToDelete = familyMembers.find(m => m.id === memberId);

        if (memberToDelete) {
          if (memberToDelete.spouse) {
            const spouseRef = doc(membersCollectionRef, memberToDelete.spouse);
            await updateDoc(spouseRef, { spouse: '' });
          }

          for (const parentId of (memberToDelete.parents || [])) {
            const parentRef = doc(membersCollectionRef, parentId);
            await updateDoc(parentRef, { children: arrayRemove(memberId) });
          }

          for (const childId of (memberToDelete.children || [])) {
            const childRef = doc(membersCollectionRef, childId);
            await updateDoc(childRef, { parents: arrayRemove(memberId) });
          }

          const memberDocRef = doc(membersCollectionRef, memberId);
          await deleteDoc(memberDocRef);
          console.log("--- Family member and all related relationships deleted successfully! ---");
        }
        setShowConfirmModal(false);
      } catch (error) {
        console.error("Error deleting family member:", error);
      }
    });
    setShowConfirmModal(true);
  };

const resetMemberForm = () => {
  // Revoke any object URLs to prevent memory leaks
  if (newMember.photoPreview) {
    URL.revokeObjectURL(newMember.photoPreview);
  }

  setNewMember({
    name: '',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    gender: '',
    spouse: '',
    parents: [],
    children: [],
    photo: '',
    photoFile: null,
    photoPreview: null
  });
  setEditingMember(null);
};

  const getMemberName = (id) => {
    const member = familyMembers.find(m => m.id === id);
    return member ? member.name : 'Unknown';
  };

  // --- Notes Management ---

  const handleNoteChange = (e) => {
    const { name, value } = e.target;
    setNewNote(prev => ({ ...prev, [name]: value }));
  };

  const addOrUpdateNote = async (e) => {
    e.preventDefault();
    if (!db || !userId || !appId) {
      console.error("Firestore not initialized or user not authenticated.");
      return;
    }

    try {
      const notesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/notes`);
      if (editingNote) {
        const noteDocRef = doc(notesCollectionRef, editingNote.id);
        await updateDoc(noteDocRef, newNote);
        console.log("Note updated successfully!");
      } else {
        await addDoc(notesCollectionRef, newNote);
        console.log("Note added successfully!");
      }
      resetNoteForm();
      setShowNoteModal(false);
    } catch (error) {
      console.error("Error adding/updating note:", error);
    }
  };

  const startEditNote = (note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      relatedMemberId: note.relatedMemberId || ''
    });
    setShowNoteModal(true);
  };

  const confirmDeleteNote = (noteId) => {
    setConfirmMessage("Are you sure you want to delete this note? This action cannot be undone.");
    setConfirmAction(() => async () => {
      if (!db || !userId || !appId) return;
      try {
        const noteDocRef = doc(db, `artifacts/${appId}/users/${userId}/notes`, noteId);
        await deleteDoc(noteDocRef);
        console.log("Note deleted successfully!");
        setShowConfirmModal(false);
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    });
    setShowConfirmModal(true);
  };

  const resetNoteForm = () => {
    setNewNote({ title: '', content: '', relatedMemberId: '' });
    setEditingNote(null);
  };

  // --- Print Functionality ---
  const handlePrint = () => {
    window.print();
  };

  // Loading state for initial data fetch
  if (!isAuthenticated || !db || !userId) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <svg className="spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="loading-text">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">

      <WelcomeModal
        showModal={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      /> 

    {/* Header */}
    <header className="app-header print-hidden">
      <h1 className="app-title">Family History Keeper
      <LottieAnimation
            src="/tree.json" // Use the confirmed working file here
            className="tree-animation"
      ></LottieAnimation>
      </h1>
      <div className="header-actions">
        <span className="user-id-display">User ID: <span className="user-id-value">{userId}</span></span>
        <button
          onClick={handlePrint}
          className="button button-secondary"
        >
          <svg className="icon-print" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2"></path></svg>
          Print
        </button>
      </div>
    </header>

    {/* Navigation Tabs - These are already correctly styled as tab-button, which is distinct */}
    <nav className="nav-tabs print-hidden">
      <div className="tab-container">
        <button
          onClick={() => setActiveTab('list')}
          className={`tab-button ${activeTab === 'list' ? 'active-tab' : ''}`}
        >
          Family Members
        </button>
        <button
          onClick={() => setActiveTab('tree')}
          className={`tab-button ${activeTab === 'tree' ? 'active-tab' : ''}`}
        >
          View Tree
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`tab-button ${activeTab === 'notes' ? 'active-tab' : ''}`}
        >
          Family Stories
        </button>
      </div>

    </nav>

    {/* Main Content Area */}
    <main className={activeTab === 'tree' ? 'main-content tree-full-width' : 'main-content'}>
    {/* Family Member List Tab Content */}
      {activeTab === 'list' && (
        <div className="content-card">
          <h2 className="content-title-flex">
            Family Members List
            <button
              onClick={() => { setShowMemberModal(true); resetMemberForm(); }}
              className="button button-primary print-hidden"
            >
              + Add New Member
            </button>
          </h2>

          {familyMembers.length === 0 ? (
            <p className="empty-message">No family members added yet. Click "+ Add New Member" to get started!</p>
          ) : (
            <div className="members-grid">
              {familyMembers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(member => (
                <div key={member.id} className="member-item-card">
                  <h3 className="member-item-name">{member.name}</h3>
                  <p className="member-item-detail">
                    {member.birthDate && `Born: ${member.birthDate}`}
                    {member.birthPlace && `, ${member.birthPlace}`}
                  </p>
                  <p className="member-item-detail">
                    {member.deathDate && `Died: ${member.deathDate}`}
                    {member.deathPlace && `, ${member.deathPlace}`}
                  </p>
                  {member.spouse && member.spouse !== '' && (
                      <p className="member-item-detail">Spouse: <span className="member-item-strong">{getMemberName(member.spouse)}</span></p>
                  )}
                  {member.parents && member.parents.length > 0 && (
                    <p className="member-item-detail">Parents: <span className="member-item-strong">{member.parents.map(getMemberName).join(', ')}</span></p>
                  )}
                  {member.children && member.children.length > 0 && (
                    <p className="member-item-detail">Children: <span className="member-item-strong">{member.children.map(getMemberName).join(', ')}</span></p>
                  )}
                  <div className="item-actions print-hidden">
                    <button
                      onClick={() => startEditMember(member)}
                      className="button button-secondary button-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDeleteMember(member.id)}
                      className="button button-danger button-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Family Tree Tab Content */}
      {activeTab === 'tree' && (
        <div className="content-card full-height">
          <h2 className="content-title">Family Tree Visualization</h2>
          {familyMembers.length === 0 ? (
            <p className="empty-message">Add members to see your family tree here!</p>
          ) : (
             <BalkanFamilyTreeWrapper members={familyMembers} />
          )}
        </div>
      )}

      {/* Notes Tab Content */}
      {activeTab === 'notes' && (
        <div className="content-card">
          <h2 className="content-title-flex">
            Family Stories & Notes
            <button
              onClick={() => { setShowNoteModal(true); resetNoteForm(); }}
              className="button button-primary print-hidden"
            >
              + Add New Story
            </button>
          </h2>
          {notes.length === 0 ? (
            <p className="empty-message">No family stories or notes added yet. Click "+ Add New Story" to begin documenting!</p>
          ) : (
            <div className="notes-grid">
              {notes
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Assuming a timestamp field for sorting
                .map(note => (
                  <div key={note.id} className="note-item-card">
                    <h3 className="note-item-title">{note.title}</h3>
                    {note.relatedMemberId && (
                      <p className="note-item-related">Related to: {getMemberName(note.relatedMemberId)}</p>
                    )}
                    <p className="note-item-content">{note.content}</p>
                    <div className="item-actions print-hidden">
                      <button
                        onClick={() => startEditNote(note)}
                        className="button button-secondary button-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDeleteNote(note.id)}
                        className="button button-danger button-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <MemberModal
        showModal={showMemberModal}
        onClose={() => { setShowMemberModal(false); resetMemberForm(); }}
        onSubmit={addOrUpdateFamilyMember}
        newMember={newMember}
        handleMemberChange={handleMemberChange}
        handleRelationshipChange={handleRelationshipChange}
        handlePhotoUpload={handlePhotoUpload}
        familyMembers={familyMembers}
        editingMember={editingMember}
      />

      <NoteModal
        showModal={showNoteModal}
        onClose={() => { setShowNoteModal(false); resetNoteForm(); }}
        onSubmit={addOrUpdateNote}
        newNote={newNote}
        handleNoteChange={handleNoteChange}
        familyMembers={familyMembers}
        editingNote={editingNote}
      />

      <ConfirmModal
        showModal={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        message={confirmMessage}
      />
    </main>
  </div>
  );
};


export default App;