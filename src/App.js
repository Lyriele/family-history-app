/* global __app_id, __firebase_config, __initial_auth_token */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut // Imported signOut for logout functionality
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
    // eslint-disable-next-line no-unused-vars
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
import LoginForm from './LoginForm';
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
  editingMember,
  isGuest // NEW: Pass isGuest to disable saving for guests
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
              disabled={isGuest} // NEW: Disable if guest
            />
            {newMember.photoPreview && (
  <img 
    src={newMember.photoPreview} 
    alt={`Preview of ${newMember.name || 'selected member'}`} 
    style={{ 
      width: '100px', 
      height: '100px', 
      objectFit: 'cover', 
      marginTop: '10px', 
      borderRadius: '5px' 
    }} 
  />
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
              readOnly={newMember.photoFile ? true : false || isGuest} // NEW: Read-only if guest or file selected
              disabled={isGuest} // NEW: Disable if guest
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
              isDisabled={isGuest} // NEW: Disable if guest
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
              isDisabled={isGuest} // NEW: Disable if guest
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
              disabled={isGuest} // NEW: Disable submit button for guests
            >
              {editingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
          {isGuest && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>Data is not saved in Guest Mode.</p>}
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
  editingNote,
  isGuest // NEW: Pass isGuest to disable saving for guests
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
              disabled={isGuest} // NEW: Disable if guest
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
              disabled={isGuest} // NEW: Disable if guest
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
              disabled={isGuest} // NEW: Disable if guest
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
              disabled={isGuest} // NEW: Disable submit button for guests
            >
              {editingNote ? 'Update Story' : 'Add Story'}
            </button>
          </div>
          {isGuest && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>Data is not saved in Guest Mode.</p>}
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
  const [auth, setAuth] = useState(null);

  // `userId` will store the Firebase UID or a random UUID for guests
  const [userId, setUserId] = useState(null);
  // `isAuthenticated` means Firebase auth has completed its check AND we have a userId (either real or guest)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // `currentFirebaseUser` will store the actual Firebase User object if logged in (null for guests/anonymous)
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState(null); // NEW: To store the Firebase User object

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

  // --- NEW STATES FOR WELCOME/LOGIN FLOW ---
  // `true` by default to show the welcome screen on first load
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  // Controls visibility of the login form
  const [showLoginForm, setShowLoginForm] = useState(false);
  // Tracks if the user explicitly chose to continue as a guest
  const [isGuest, setIsGuest] = useState(false);
  // --- END NEW STATES ---


  // --- HANDLERS FOR WELCOME/LOGIN FLOW ---
  // Called when "Login to save records" button in WelcomeModal is clicked
  const handleLoginClick = () => {
    setShowWelcomeModal(false); // Hide the welcome modal
    setShowLoginForm(true);    // Show the login form
    setIsGuest(false);         // User chose login path, so not a guest
  };

  // Called when "Continue as guest" button in WelcomeModal is clicked
  const handleContinueAsGuest = () => {
    setShowWelcomeModal(false); // Hide the welcome modal
    setShowLoginForm(false);    // Ensure login form is not shown
    setIsGuest(true);           // Set guest mode to true
    // Generate a temporary, non-persistent ID for guest mode
    // This ID is used locally and is NOT tied to any persistent Firebase Anonymous Auth user
    setUserId(crypto.randomUUID());
    setIsAuthenticated(true);   // Treat guest as "authenticated" for main app display
    setCurrentFirebaseUser(null); // Ensure no Firebase user object is set for guests

    // Clear any existing data if coming from a previous session (e.g., old anonymous user)
    setFamilyMembers([]);
    setNotes([]);
    setPrimaryRootId(null);
  };

  // Called by LoginForm on successful email/password login
  const handleLoginSuccess = (user) => {
    setCurrentFirebaseUser(user); // Set the actual Firebase User object
    setUserId(user.uid);          // Set the UID
    setIsAuthenticated(true);     // Authenticated via Firebase
    setShowLoginForm(false);      // Hide login form
    setShowWelcomeModal(false);   // Ensure welcome is hidden
    setIsGuest(false);            // User is logged in, not a guest
  };

  // Handles user logout
  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth); // Sign out from Firebase
        // Reset all relevant states to bring the app back to its initial unauthenticated state
        setUserId(null);
        setIsAuthenticated(false);
        setCurrentFirebaseUser(null);
        setIsGuest(false);
        setFamilyMembers([]); // Clear data on logout
        setNotes([]);
        setPrimaryRootId(null);
        setShowWelcomeModal(true); // Show welcome modal again after logout
        setShowLoginForm(false); // Ensure login form is not shown initially
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };


  // --- Firebase Initialization and Authentication State Management ---
  useEffect(() => {
    const firebaseConfig = typeof __firebase_config !== 'undefined'
      ? JSON.parse(__firebase_config)
      : {
          // !!! WARNING: Hardcoded Firebase Config. Consider environment variables for production. !!!
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
        // A Firebase user (could be email/password or previous anonymous) is signed in
        setCurrentFirebaseUser(user); // Store the Firebase User object
        setUserId(user.uid);
        setIsAuthenticated(true);

        // If the user is NOT anonymous (meaning they logged in with email/password)
        // AND they haven't explicitly chosen guest mode this session,
        // then check if they've seen the welcome message for proper flow.
        if (!user.isAnonymous && !isGuest && firestoreDb) {
          const userDocRef = doc(firestoreDb, `artifacts/${appId}/users`, user.uid);
          try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // If they haven't seen welcome, show it
              if (!userData.hasSeenWelcome) {
                setShowWelcomeModal(true);
              } else {
                // If they have seen welcome, hide welcome/login forms
                setShowWelcomeModal(false);
                setShowLoginForm(false);
              }
            } else {
              // New authenticated user (first time logging in, no user doc), show welcome
              setShowWelcomeModal(true);
              setShowLoginForm(false); // Make sure login form is hidden
            }
          } catch (error) {
            console.error("Error fetching user data for welcome status:", error);
            // In case of error, default to hiding welcome modal for a logged-in user
            setShowWelcomeModal(false);
            setShowLoginForm(false);
          }
        } else if (user.isAnonymous && !isGuest && !showLoginForm) {
          // If it's an anonymous Firebase user and they haven't selected guest/login yet,
          // then we need to show the welcome modal to let them choose.
          // `showWelcomeModal` is true by default, so it will be shown.
          // If user clicked `Continue as Guest`, `isGuest` is true and this block is skipped.
        } else {
            // Already logged in and welcome handled, or currently in guest mode.
            setShowWelcomeModal(false);
            setShowLoginForm(false);
        }
      } else {
        // No Firebase user is signed in (initial load or explicitly signed out)
        setCurrentFirebaseUser(null);
        setUserId(null);
        setIsAuthenticated(false);

        // If not already in the guest flow and not showing login,
        // attempt anonymous sign-in or set a local UUID.
        // This ensures the app has a `userId` for initial `db` operations (if any)
        // before the user makes a choice via WelcomeModal.
        if (!isGuest && !showLoginForm) {
            if (typeof __initial_auth_token !== 'undefined') {
                try {
                    await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                } catch (error) {
                    console.error("Firebase custom token auth failed:", error);
                    // Fallback to anonymous if custom token fails
                    try {
                        await signInAnonymously(firebaseAuth);
                    } catch (anonError) {
                        console.error("Firebase anonymous auth failed:", anonError);
                        // If even anonymous sign-in fails, generate local ID
                        setUserId(crypto.randomUUID());
                        setIsAuthenticated(true); // Locally "authenticated"
                        setIsGuest(true); // Treat as guest
                        setShowWelcomeModal(false); // Skip welcome if forced into local guest
                    }
                }
            } else {
                try {
                    await signInAnonymously(firebaseAuth); // Attempt anonymous sign-in
                } catch (error) {
                    console.error("Firebase anonymous auth failed:", error);
                    setUserId(crypto.randomUUID()); // Generate local ID for guest
                    setIsAuthenticated(true); // Locally "authenticated"
                    setIsGuest(true); // Treat as guest
                    setShowWelcomeModal(false); // Skip welcome if forced into local guest
                }
            }
        }
        // showWelcomeModal remains true by default, directing to the welcome screen.
      }
    });

    return () => unsubscribe(); // Cleanup
  }, [appId, isGuest, showLoginForm]); // Dependencies for useEffect to re-run on relevant state changes


  // --- Fetch Data (Family Members and Notes) ---
  useEffect(() => {
    // ONLY fetch data if isAuthenticated (real user or determined guest with ID)
    // AND DB is ready AND NOT currently showing welcome/login modals.
    // AND NOT in guest mode if guests should *not* persist data to Firestore.

    // If in guest mode, and guest data should NOT persist, clear and return.
    if (isGuest) {
      setFamilyMembers([]);
      setNotes([]);
      setPrimaryRootId(null);
      // No Firestore subscriptions for guests if data is purely in-memory
      return;
    }

    // For authenticated users (non-guests)
    if (isAuthenticated && db && userId && appId && currentFirebaseUser && !isGuest && !showWelcomeModal && !showLoginForm) {
      const membersCollectionPath = `artifacts/${appId}/users/${userId}/members`;
      const familyMembersRef = collection(db, membersCollectionPath);
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

      const notesCollectionPath = `artifacts/${appId}/users/${userId}/notes`;
      const notesRef = collection(db, notesCollectionPath);
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
    // If not authenticated (and not in guest mode), or still in welcome/login flow,
    // ensure data is cleared or not loaded.
    else if (!isAuthenticated && !isGuest) {
        setFamilyMembers([]);
        setNotes([]);
        setPrimaryRootId(null);
    }

  }, [isAuthenticated, db, userId, appId, primaryRootId, showWelcomeModal, showLoginForm, isGuest, currentFirebaseUser]);


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
        // Replaced alert with custom modal logic or a console.error/message box if you have one
        console.error('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        console.error('Image size should be less than 5MB');
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
  }, []);


  const addOrUpdateFamilyMember = async (e) => {
    e.preventDefault();

    // NEW: Prevent saving/updating if in guest mode
    if (isGuest) {
      // Use your custom modal/message box for user feedback instead of alert
      alert("In Guest Mode, data is not saved permanently. Please log in to save your records.");
      resetMemberForm();
      setShowMemberModal(false);
      return;
    }

    if (!db || !userId || !appId) {
      console.error("Firestore not initialized or user not authenticated for saving.");
      return;
    }

    try {
      let finalPhotoUrl = newMember.photo;

      if (newMember.photoFile) {
        try {
          const storage = getStorage();
          const fileExt = newMember.photoFile.name.split('.').pop();
          const timestamp = Date.now();
          const filename = `member_${timestamp}.${fileExt}`;
          const storagePath = `users/${userId}/members/${filename}`;
          const photoRef = ref(storage, storagePath);

          const uploadResult = await uploadBytes(photoRef, newMember.photoFile);
          finalPhotoUrl = await getDownloadURL(uploadResult.ref);
        } catch (uploadError) {
          console.error("Error uploading photo:", uploadError);
          // Use custom message box here
          alert("Failed to upload photo. Please try again.");
          return; // Stop execution if upload fails
        }
      } else if (editingMember && !newMember.photoFile && newMember.photo === '') {
        finalPhotoUrl = '';
      }

      const memberToSave = {
        name: newMember.name,
        birthDate: newMember.birthDate,
        birthPlace: newMember.birthPlace || '',
        deathDate: newMember.deathDate,
        deathPlace: newMember.deathPlace || '',
        gender: newMember.gender,
        spouse: newMember.spouse || '',
        parents: newMember.parents.filter(id => id !== ''),
        children: newMember.children.filter(id => id !== ''),
        photo: finalPhotoUrl
      };

      let oldMember = null;
      let memberId = editingMember ? editingMember.id : null;

      const membersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/members`);

      if (editingMember) {
        oldMember = familyMembers.find(m => m.id === editingMember.id);
        const memberDocRef = doc(membersCollectionRef, editingMember.id);
        await updateDoc(memberDocRef, memberToSave);
      } else {
        const docRef = await addDoc(membersCollectionRef, memberToSave);
        memberId = docRef.id;
      }

      // Handle relationship updates for other members
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

      resetMemberForm();
      setShowMemberModal(false);

    } catch (error) {
      console.error("Error in addOrUpdateFamilyMember:", error);
      alert(error.message || "An error occurred while saving the family member."); // Use custom message box
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
    // NEW: Prevent deletion if in guest mode
    if (isGuest) {
      alert("In Guest Mode, data is not saved permanently. Cannot delete records."); // Use custom message box
      return;
    }

    setConfirmMessage("Are you sure you want to delete this family member? This action cannot be undone. All relationships involving this member will also be removed.");
    setConfirmAction(() => async () => {
      if (!db || !userId || !appId) return; // This check is handled by `isGuest` guard

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

    // NEW: Prevent saving/updating if in guest mode
    if (isGuest) {
      alert("In Guest Mode, data is not saved permanently. Please log in to save your records."); // Use custom message box
      resetNoteForm();
      setShowNoteModal(false);
      return;
    }

    if (!db || !userId || !appId) {
      console.error("Firestore not initialized or user not authenticated for saving notes.");
      return;
    }

    try {
      const notesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/notes`);
      if (editingNote) {
        const noteDocRef = doc(notesCollectionRef, editingNote.id);
        await updateDoc(noteDocRef, newNote);
      } else {
        await addDoc(notesCollectionRef, newNote);
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
    // NEW: Prevent deletion if in guest mode
    if (isGuest) {
      alert("In Guest Mode, data is not saved permanently. Cannot delete records."); // Use custom message box
      return;
    }

    setConfirmMessage("Are you sure you want to delete this note? This action cannot be undone.");
    setConfirmAction(() => async () => {
      if (!db || !userId || !appId) return; // This check is handled by `isGuest` guard

      try {
        const noteDocRef = doc(db, `artifacts/${appId}/users/${userId}/notes`, noteId);
        await deleteDoc(noteDocRef);
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

  // --- Conditional Rendering for Welcome/Login/App Flow ---
  if (showWelcomeModal) {
    return (
      <WelcomeModal
        onLoginClick={handleLoginClick}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  } else if (showLoginForm) {
    // Pass the `auth` instance to LoginForm so it can perform Firebase Auth operations
    return (
      <LoginForm onLoginSuccess={handleLoginSuccess} auth={auth} />
    );
  }

  // --- Loading State for Main App Content ---
  // If we've passed the welcome/login flow, but auth/db isn't fully ready yet, show loading
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

  // --- Main Application Content (If logged in or in guest mode) ---
  return (
    <div className="app-container"> {/* Changed class to app-container */}
      <header className="app-header print-hidden"> {/* Added print-hidden */}
        <h1 className="app-title">Family History Keeper
          <LottieAnimation
            src="/tree.json" // Use the confirmed working file here
            className="tree-animation"
          ></LottieAnimation>
        </h1>
        <div className="header-actions">
          <span className="user-id-display">
            {isGuest ? (
              <span>Guest Mode (Data is not saved)</span>
            ) : (
              <span>User: {currentFirebaseUser ? currentFirebaseUser.email || currentFirebaseUser.uid : 'N/A'}</span>
            )}
          </span>
          {/* Only show logout if authenticated AND not in guest mode (as guests don't explicitly log out) */}
          {isAuthenticated && !isGuest && (
            <button
              onClick={handleLogout}
              className="button button-secondary" // Changed from button-logout
            >
              Logout
            </button>
          )}
          <button
            onClick={handlePrint}
            className="button button-secondary"
          >
            <svg className="icon-print" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2"></path></svg>
            Print
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
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
      <main className="app-main-content">
        {activeTab === 'list' && (
          <div className="tab-content">
            <button
              onClick={() => { setShowMemberModal(true); resetMemberForm(); }}
              className="button-primary add-member-button print-hidden"
            >
              Add New Family Member
            </button>

            {familyMembers.length === 0 ? (
              <p className="no-data-message">No family members added yet. Click "Add New Family Member" to get started!</p>
            ) : (
              <ul className="member-list">
                {familyMembers.sort((a,b) => a.name.localeCompare(b.name)).map(member => (
                  <li key={member.id} className="member-item">
                    <div className="member-info">
                    {member.photo && <img src={member.photo} alt={member.name} className="member-photo-thumbnail" />}
                    <div>
                        <span className="member-name">{member.name} ({member.gender})</span>
                        {member.birthDate && <span className="member-dates">, b. {member.birthDate}</span>}
                        {member.deathDate && <span className="member-dates">, d. {member.deathDate}</span>}
                        {member.spouse && <p className="member-relationship">Spouse: {getMemberName(member.spouse)}</p>}
                        {member.parents && member.parents.length > 0 && (
                          <p className="member-relationship">Parents: {member.parents.map(getMemberName).join(', ')}</p>
                        )}
                        {member.children && member.children.length > 0 && (
                          <p className="member-relationship">Children: {member.children.map(getMemberName).join(', ')}</p>
                        )}
                      </div>
                    </div>
                    <div className="member-actions print-hidden">
                      <button onClick={() => startEditMember(member)} className="button-icon-edit" disabled={isGuest}>
                        <svg className="icon-edit" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={() => confirmDeleteMember(member.id)} className="button-icon-delete" disabled={isGuest}>
                        <svg className="icon-delete" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {isGuest && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>Editing and deleting is disabled in Guest Mode. Please log in to save your changes.</p>}
          </div>
        )}

        {activeTab === 'tree' && (
          <div className="tab-content tree-view-container">
            {familyMembers.length === 0 ? (
              <p className="no-data-message">Add family members to see your tree here!</p>
            ) : (
              <BalkanFamilyTreeWrapper members={familyMembers} primaryRootId={primaryRootId} />
            )}
            <LottieAnimation
              src="/tree.json" // Make sure LottieAnimation points to the correct path if it's external
              className="tree-animation"
            ></LottieAnimation>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="tab-content">
            <button
              onClick={() => { setShowNoteModal(true); resetNoteForm(); }}
              className="button-primary add-note-button print-hidden"
            >
              Add New Family Story
            </button>

            {notes.length === 0 ? (
              <p className="no-data-message">No family stories added yet. Click "Add New Family Story" to record one!</p>
            ) : (
              <ul className="note-list">
                {notes.sort((a,b) => b.createdAt?.toDate ? b.createdAt.toDate() - a.createdAt.toDate() : 0).map(note => ( // Assuming createdAt for sorting
                  <li key={note.id} className="note-item">
                    <div className="note-info">
                      <h4 className="note-title">{note.title}</h4>
                      {note.relatedMemberId && (
                        <p className="note-related-member">Related to: {getMemberName(note.relatedMemberId)}</p>
                      )}
                      <p className="note-content">{note.content}</p>
                    </div>
                    <div className="note-actions print-hidden">
                      <button onClick={() => startEditNote(note)} className="button-icon-edit" disabled={isGuest}>
                        <svg className="icon-edit" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={() => confirmDeleteNote(note.id)} className="button-icon-delete" disabled={isGuest}>
                        <svg className="icon-delete" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {isGuest && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>Editing and deleting is disabled in Guest Mode. Please log in to save your changes.</p>}
          </div>
        )}
      </main>

      {/* Modals (render unconditionally and let their showModal prop control visibility) */}
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
        isGuest={isGuest} // Pass isGuest to MemberModal
      />

      <NoteModal
        showModal={showNoteModal}
        onClose={() => { setShowNoteModal(false); resetNoteForm(); }}
        onSubmit={addOrUpdateNote}
        newNote={newNote}
        handleNoteChange={handleNoteChange}
        familyMembers={familyMembers}
        editingNote={editingNote}
        isGuest={isGuest} // Pass isGuest to NoteModal
      />

      <ConfirmModal
        showModal={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setShowConfirmModal(false); // Ensure modal closes after action
        }}
        message={confirmMessage}
      />
    </div>
  );
};

export default App;
