import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import {
  Calendar as CalendarIcon,
  Users,
  Settings,
  Bell,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Clock,
  Send,
  Upload,
  Link as LinkIcon,
  FileText,
  Eye,
  EyeOff,
  LogOut,
  X as XIcon,
  CheckCircle2,
  UserCheck,
  UserX,
  ExternalLink,
  Trash2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { db } from './firebase';
import {
  DEFAULT_ADMIN,
  DEFAULT_MANAGER,
  PLATFORMS,
  POST_TYPES,
  INITIAL_NOV_2026_POSTS
} from './seedData';
import { uploadAssetToHuggingFace } from './hfUpload';

// Clean Platform Badge Colors & SVG Icons
const PLATFORM_STYLE = {
  Instagram: { bg: 'bg-[#FDF2F7]', text: 'text-[#D6246E]', border: 'border-[#F8D0E2]', dot: 'bg-[#D6246E]', short: 'IG' },
  TikTok: { bg: 'bg-[#F4EFFA]', text: 'text-[#5B2A86]', border: 'border-[#DFD1F0]', dot: 'bg-[#5B2A86]', short: 'TT' },
  LinkedIn: { bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', border: 'border-[#BFDBFE]', dot: 'bg-[#2563EB]', short: 'IN' },
  X: { bg: 'bg-[#F3F4F6]', text: 'text-[#222222]', border: 'border-[#E5E7EB]', dot: 'bg-[#222222]', short: 'X' },
  Facebook: { bg: 'bg-[#FFF7ED]', text: 'text-[#F58220]', border: 'border-[#FED7AA]', dot: 'bg-[#F58220]', short: 'FB' },
  WhatsApp: { bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]', dot: 'bg-[#10B981]', short: 'WA' }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function emailToDocId(email) {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export default function App() {
  // Auth & Users state
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('yuzu_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('manager'); // 'manager' | 'admin'
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Viewport Toggle: 'desktop' | 'mobile'
  const [viewMode, setViewMode] = useState('desktop');

  // Navigation Tabs: 'calendar' | 'team' | 'settings'
  const [activeTab, setActiveTab] = useState('calendar');

  // Calendar State (Default to November 2026 where preloaded schedule lives)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 0-indexed: 10 = November
  const [selectedDate, setSelectedDate] = useState('2026-11-02');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isAddingPost, setIsAddingPost] = useState(false);

  // Firestore Collections State
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [seeding, setSeeding] = useState(true);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Review Form State (Admin & Manager)
  const [reviewApproved, setReviewApproved] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [sendingReview, setSendingReview] = useState(false);

  // Manager Upload / Edit Form State
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formPostType, setFormPostType] = useState('Carousel');
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formPostLink, setFormPostLink] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileType, setFormFileType] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  // Profile Settings Change Password State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // 1. Seed Default Accounts & November 2026 Calendar on First Run
  useEffect(() => {
    let unsubUsers;
    let unsubPosts;
    let unsubNotifs;

    async function initAndSubscribe() {
      try {
        const metaRef = doc(db, 'meta', 'seeded_nov_2026');
        const metaSnap = await getDoc(metaRef);

        if (!metaSnap.exists() || !metaSnap.data()?.seeded) {
          // Ensure Default Admin & Default Manager exist
          await setDoc(doc(db, 'users', DEFAULT_ADMIN.id), DEFAULT_ADMIN, { merge: true });
          await setDoc(doc(db, 'users', DEFAULT_MANAGER.id), DEFAULT_MANAGER, { merge: true });

          // Batch write November 2026 posts
          const batch = writeBatch(db);
          INITIAL_NOV_2026_POSTS.forEach((post) => {
            const pRef = doc(db, 'posts', post.id);
            batch.set(pRef, post, { merge: true });
          });
          await batch.commit();

          // Create a welcome notification
          await addDoc(collection(db, 'notifications'), {
            title: 'November 2026 Calendar Loaded',
            message: 'Ikechukwu Paul Ebiringa uploaded 87 posts for November 2026 across 6 social channels.',
            targetRole: 'all',
            actorEmail: DEFAULT_MANAGER.email,
            actorName: DEFAULT_MANAGER.name,
            postDate: '2026-11-02',
            platform: 'Instagram',
            readBy: [],
            createdAt: new Date().toISOString()
          });

          await setDoc(metaRef, {
            seeded: true,
            seededAt: new Date().toISOString(),
            version: 1
          });
        }
      } catch (err) {
        console.error('Seed check error:', err);
      } finally {
        setSeeding(false);
      }

      // Real-time Listeners
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(list);
      });

      unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPosts(list);
      });

      unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setNotifications(list);
      });
    }

    initAndSubscribe();

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubPosts) unsubPosts();
      if (unsubNotifs) unsubNotifs();
    };
  }, []);

  // Keep currentUser synced with live Firestore user doc (e.g., if deactivated or password updated)
  useEffect(() => {
    if (!currentUser || users.length === 0) return;
    const liveUser = users.find((u) => u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (liveUser) {
      if (liveUser.status !== 'approved' && liveUser.role !== 'admin') {
        localStorage.removeItem('yuzu_current_user');
        setCurrentUser(null);
        setAuthError(`Your account status is currently "${liveUser.status}". Please contact Admin.`);
      } else if (
        liveUser.name !== currentUser.name ||
        liveUser.password !== currentUser.password ||
        liveUser.status !== currentUser.status
      ) {
        setCurrentUser(liveUser);
        localStorage.setItem('yuzu_current_user', JSON.stringify(liveUser));
      }
    }
  }, [users, currentUser]);

  // Derived: Posts grouped by date
  const postsByDate = useMemo(() => {
    const map = {};
    posts.forEach((p) => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    return map;
  }, [posts]);

  // Derived: Social posts for currently selected date
  const selectedDayPosts = useMemo(() => {
    if (!selectedDate) return [];
    const list = postsByDate[selectedDate] || [];
    return list.sort((a, b) => PLATFORMS.indexOf(a.platform) - PLATFORMS.indexOf(b.platform));
  }, [postsByDate, selectedDate]);

  // Derived: Active post being previewed
  const activePost = useMemo(() => {
    if (!selectedPlatform) return null;
    return selectedDayPosts.find((p) => p.platform === selectedPlatform) || null;
  }, [selectedDayPosts, selectedPlatform]);

  // Sync Review & Edit states when activePost changes
  useEffect(() => {
    if (activePost) {
      setReviewApproved(Boolean(activePost.approved));
      setReviewComment(activePost.comment || '');
      setFormPlatform(activePost.platform || 'Instagram');
      setFormPostType(activePost.postType || 'Carousel');
      setFormTitle(activePost.title || '');
      setFormCaption(activePost.caption || '');
      setFormPostLink(activePost.postLink || '');
      setFormFileUrl(activePost.fileUrl || '');
      setFormFileName(activePost.fileName || '');
      setFormFileType(activePost.fileType || '');
      setIsAddingPost(false);
    }
  }, [activePost?.id, activePost?.approved, activePost?.comment, activePost?.updatedAt]);

  // Unread Notifications for Current User
  const unreadNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => {
      const readBy = Array.isArray(n.readBy) ? n.readBy : [];
      return !readBy.includes(currentUser.email);
    });
  }, [notifications, currentUser]);

  // Pending Managers Count for Admin Badge
  const pendingManagersCount = useMemo(() => {
    return users.filter((u) => u.role === 'manager' && u.status === 'pending').length;
  }, [users]);

  // Mark notifications read
  const handleMarkAllRead = async () => {
    if (!currentUser || unreadNotifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      unreadNotifications.forEach((n) => {
        const ref = doc(db, 'notifications', n.id);
        const updatedReadBy = Array.from(new Set([...(n.readBy || []), currentUser.email]));
        batch.update(ref, { readBy: updatedReadBy });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  // Handle Sign In / Sign Up
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPass = authPassword;

    try {
      if (authMode === 'signin') {
        const userDocId = emailToDocId(cleanEmail);
        const snap = await getDoc(doc(db, 'users', userDocId));
        let foundUser = snap.exists() ? { id: snap.id, ...snap.data() } : null;

        if (!foundUser) {
          foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
        }

        if (!foundUser) {
          setAuthError('Account not found. Check your email or sign up.');
          setAuthLoading(false);
          return;
        }

        if (foundUser.password !== cleanPass) {
          setAuthError('Incorrect password. Click the eye icon to verify your input.');
          setAuthLoading(false);
          return;
        }

        if (foundUser.role !== 'admin' && foundUser.status === 'pending') {
          setAuthError('Your account is awaiting Admin approval.');
          setAuthLoading(false);
          return;
        }

        if (foundUser.role !== 'admin' && foundUser.status === 'deactivated') {
          setAuthError('Your account has been deactivated by Admin.');
          setAuthLoading(false);
          return;
        }

        setCurrentUser(foundUser);
        localStorage.setItem('yuzu_current_user', JSON.stringify(foundUser));
        showToast(`Welcome back, ${foundUser.name}!`);
      } else {
        // Sign Up
        if (!authName.trim()) {
          setAuthError('Please enter your full name.');
          setAuthLoading(false);
          return;
        }
        const userDocId = emailToDocId(cleanEmail);
        const existing = await getDoc(doc(db, 'users', userDocId));
        if (existing.exists()) {
          setAuthError('An account with this email already exists. Please sign in.');
          setAuthLoading(false);
          return;
        }

        const isAdminEmail = cleanEmail === 'admin@yuzuafrica.com' || authRole === 'admin';
        const newUser = {
          id: userDocId,
          email: cleanEmail,
          name: authName.trim(),
          password: cleanPass,
          role: isAdminEmail ? 'admin' : 'manager',
          status: isAdminEmail ? 'approved' : 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', userDocId), newUser);

        // Notify Admin and Managers
        await addDoc(collection(db, 'notifications'), {
          title: isAdminEmail ? 'New Admin Registered' : 'New Manager Sign-Up',
          message: `${newUser.name} (${newUser.email}) signed up as ${newUser.role}.`,
          targetRole: 'all',
          actorEmail: newUser.email,
          actorName: newUser.name,
          postDate: selectedDate || '2026-11-02',
          platform: 'Team',
          readBy: [],
          createdAt: new Date().toISOString()
        });

        if (isAdminEmail) {
          setCurrentUser(newUser);
          localStorage.setItem('yuzu_current_user', JSON.stringify(newUser));
          showToast('Admin account created and signed in!');
        } else {
          setAuthMode('signin');
          setAuthError('');
          showToast('Account created! Waiting for Admin approval.');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick Demo Fill Helper on Login Screen
  const fillCredentials = (email, pass) => {
    setAuthMode('signin');
    setAuthEmail(email);
    setAuthPassword(pass);
    setAuthError('');
  };

  // Admin: Send Review (Approval + Commentary)
  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!activePost || !currentUser) return;
    setSendingReview(true);

    try {
      const postRef = doc(db, 'posts', activePost.id);
      await updateDoc(postRef, {
        approved: reviewApproved,
        comment: reviewComment.trim(),
        updatedBy: currentUser.email,
        updatedAt: new Date().toISOString()
      });

      const statusLabel = reviewApproved ? 'Approved' : 'Marked Pending';
      await addDoc(collection(db, 'notifications'), {
        title: `${activePost.platform} Post ${statusLabel}`,
        message: `${currentUser.name} ${statusLabel.toLowerCase()} ${activePost.platform} (${activePost.date})${reviewComment.trim() ? `: "${reviewComment.trim()}"` : '.'}`,
        targetRole: 'all',
        actorEmail: currentUser.email,
        actorName: currentUser.name,
        postDate: activePost.date,
        postId: activePost.id,
        platform: activePost.platform,
        readBy: [currentUser.email],
        createdAt: new Date().toISOString()
      });

      showToast(`Update sent to account managers!`);
    } catch (err) {
      showToast('Failed to send review: ' + err.message, 'error');
    } finally {
      setSendingReview(false);
    }
  };

  // Instant File Upload to Hugging Face Dataset
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const targetPlatform = isAddingPost ? formPlatform : (activePost?.platform || formPlatform);
      const result = await uploadAssetToHuggingFace(file, selectedDate, targetPlatform);
      setFormFileUrl(result.fileUrl);
      setFormFileName(result.fileName);
      setFormFileType(result.fileType);
      showToast(`Saved "${file.name}" to Hugging Face Dataset!`);
    } catch (err) {
      showToast('HF Upload error: ' + err.message, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  // Manager / Admin: Save or Update Post for Selected Day
  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedDate) return;
    setSavingPost(true);

    const targetPlatform = isAddingPost ? formPlatform : (activePost?.platform || formPlatform);
    const postId = `${selectedDate}_${targetPlatform.toLowerCase()}`;
    const [y, m] = selectedDate.split('-').map(Number);

    const payload = {
      date: selectedDate,
      year: y,
      month: m,
      platform: targetPlatform,
      postType: formPostType || 'Carousel',
      pillar: activePost?.pillar || 'Content',
      title: formTitle.trim() || `${targetPlatform} ${formPostType}`,
      caption: formCaption.trim(),
      postLink: formPostLink.trim(),
      fileUrl: formFileUrl.trim(),
      fileName: formFileName.trim(),
      fileType: formFileType.trim(),
      authorEmail: currentUser.email,
      authorName: currentUser.name,
      approved: activePost ? Boolean(activePost.approved) : false,
      comment: activePost?.comment || '',
      updatedBy: currentUser.email,
      createdAt: activePost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'posts', postId), payload, { merge: true });

      await addDoc(collection(db, 'notifications'), {
        title: `${targetPlatform} Post Updated`,
        message: `${currentUser.name} uploaded ${targetPlatform} (${formPostType}) for ${selectedDate}.`,
        targetRole: 'all',
        actorEmail: currentUser.email,
        actorName: currentUser.name,
        postDate: selectedDate,
        postId,
        platform: targetPlatform,
        readBy: [currentUser.email],
        createdAt: new Date().toISOString()
      });

      setSelectedPlatform(targetPlatform);
      setIsAddingPost(false);
      showToast(`${targetPlatform} post saved for ${selectedDate}!`);
    } catch (err) {
      showToast('Failed to save post: ' + err.message, 'error');
    } finally {
      setSavingPost(false);
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!activePost || !currentUser) return;
    try {
      await deleteDoc(doc(db, 'posts', activePost.id));
      await addDoc(collection(db, 'notifications'), {
        title: `${activePost.platform} Post Removed`,
        message: `${currentUser.name} removed ${activePost.platform} post on ${activePost.date}.`,
        targetRole: 'all',
        actorEmail: currentUser.email,
        actorName: currentUser.name,
        postDate: activePost.date,
        platform: activePost.platform,
        readBy: [currentUser.email],
        createdAt: new Date().toISOString()
      });
      setSelectedPlatform(null);
      showToast('Post removed.');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  // Admin: Approve or Deactivate Manager Account
  const handleUpdateUserStatus = async (targetUser, newStatus) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      await updateDoc(doc(db, 'users', targetUser.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'notifications'), {
        title: `Manager Account ${newStatus === 'approved' ? 'Approved' : 'Deactivated'}`,
        message: `Admin ${newStatus} ${targetUser.name} (${targetUser.email}).`,
        targetRole: 'all',
        actorEmail: currentUser.email,
        actorName: currentUser.name,
        postDate: selectedDate,
        platform: 'Team',
        readBy: [currentUser.email],
        createdAt: new Date().toISOString()
      });

      showToast(`${targetUser.name} is now ${newStatus}.`);
    } catch (err) {
      showToast('Failed to update user: ' + err.message, 'error');
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (currentPassInput !== currentUser.password) {
      showToast('Current password does not match.', 'error');
      return;
    }
    if (newPassInput.length < 4) {
      showToast('New password must be at least 4 characters.', 'error');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setChangingPass(true);
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        password: newPassInput,
        updatedAt: new Date().toISOString()
      });

      const updated = { ...currentUser, password: newPassInput };
      setCurrentUser(updated);
      localStorage.setItem('yuzu_current_user', JSON.stringify(updated));
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
      showToast('Password updated successfully!');
    } catch (err) {
      showToast('Error updating password: ' + err.message, 'error');
    } finally {
      setChangingPass(false);
    }
  };

  // Start Adding New Post on Selected Day
  const openNewPostForm = () => {
    const existingPlatforms = selectedDayPosts.map((p) => p.platform);
    const availablePlatform = PLATFORMS.find((p) => !existingPlatforms.includes(p)) || 'Instagram';
    setSelectedPlatform(null);
    setIsAddingPost(true);
    setFormPlatform(availablePlatform);
    setFormPostType('Carousel');
    setFormTitle('');
    setFormCaption('');
    setFormPostLink('https://yuzuafrica.com');
    setFormFileUrl('');
    setFormFileName('');
    setFormFileType('');
  };

  // Calendar Grid Calculation (Monday-first to match Yuzu Africa PDF Calendar)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({
        day: d,
        dateStr: `${currentYear}-${mStr}-${dStr}`
      });
    }
    return cells;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isMobile = viewMode === 'mobile';

  // ==================== AUTH SCREEN ====================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between p-4 md:p-8">
        {/* Top Bar with Viewport Toggle even on Auth */}
        <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/yuzu-logo.jpg"
              alt="Yuzu Africa"
              className="h-10 w-auto rounded-lg object-contain bg-white px-2 py-1 shadow-sm border border-[#EDE6F5]"
            />
            <span className="font-heading font-bold text-lg text-[#5B2A86] hidden sm:inline">
              Yuzu Africa
            </span>
          </div>

          {/* Desktop / Mobile Toggle Switch */}
          <div className="inline-flex items-center bg-white p-1 rounded-full border border-[#E6DFEE] shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                !isMobile
                  ? 'bg-[#5B2A86] text-white shadow-sm'
                  : 'text-[#222222]/70 hover:text-[#5B2A86]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isMobile
                  ? 'bg-[#5B2A86] text-white shadow-sm'
                  : 'text-[#222222]/70 hover:text-[#5B2A86]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
            </button>
          </div>
        </header>

        {/* Auth Container (Framed as Phone when Mobile Toggle is active) */}
        <main className="flex-1 flex items-center justify-center my-6">
          <div
            className={`w-full transition-all duration-300 ${
              isMobile
                ? 'max-w-[390px] bg-[#FAF7F2] border-[10px] border-[#222222] rounded-[44px] shadow-2xl p-5 overflow-hidden'
                : 'max-w-md'
            }`}
          >
            {isMobile && (
              <div className="w-24 h-5 bg-[#222222] rounded-full mx-auto mb-5" />
            )}

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE6F4] shadow-[0_12px_32px_-12px_rgba(91,42,134,0.12)]">
              <div className="flex flex-col items-center text-center mb-6">
                <img
                  src="/yuzu-logo.jpg"
                  alt="Yuzu Africa Logo"
                  className="h-14 w-auto object-contain mb-3"
                />
                <h1 className="font-heading font-bold text-2xl text-[#5B2A86]">
                  Content Calendar
                </h1>
                <p className="text-xs text-[#222222]/60 mt-1">
                  Marketing that closes. Scroll to sale.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 bg-[#FAF7F2] p-1 rounded-xl mb-5 border border-[#EDE6F5]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError('');
                  }}
                  className={`py-2 text-xs font-heading font-semibold rounded-lg transition-all ${
                    authMode === 'signin'
                      ? 'bg-white text-[#5B2A86] shadow-sm'
                      : 'text-[#222222]/60'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                  }}
                  className={`py-2 text-xs font-heading font-semibold rounded-lg transition-all ${
                    authMode === 'signup'
                      ? 'bg-white text-[#5B2A86] shadow-sm'
                      : 'text-[#222222]/60'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-[#FDF2F7] border border-[#D6246E]/30 text-[#D6246E] text-xs font-medium">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-[#222222]/80 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="e.g. Ikechukwu Paul Ebiringa"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-sm focus:outline-none focus:border-[#5B2A86]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#222222]/80 mb-1">
                        Role
                      </label>
                      <select
                        value={authRole}
                        onChange={(e) => setAuthRole(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-sm focus:outline-none focus:border-[#5B2A86]"
                      >
                        <option value="manager">Account Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#222222]/80 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="admin@yuzuafrica.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-sm focus:outline-none focus:border-[#5B2A86]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#222222]/80 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAuthPassword ? 'text' : 'password'}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-sm focus:outline-none focus:border-[#5B2A86]"
                    />
                    <button
                      type="button"
                      aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowAuthPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#222222]/50 hover:text-[#5B2A86] p-1"
                    >
                      {showAuthPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading || seeding}
                  className="w-full py-3 rounded-xl bg-[#D6246E] hover:bg-[#be1d60] text-white font-heading font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {authLoading
                    ? 'Please wait...'
                    : authMode === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>
              </form>

              {/* One-Tap Quick Fill Pills for Default Accounts */}
              <div className="mt-6 pt-5 border-t border-[#F1ECF8]">
                <p className="text-[11px] font-medium text-[#222222]/50 text-center mb-2.5">
                  Quick Fill Default Accounts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@yuzuafrica.com', 'Admin321')}
                    className="px-3 py-2 rounded-xl bg-[#F4EFFA] hover:bg-[#EAE0F6] text-[#5B2A86] text-xs font-medium text-left transition-all"
                  >
                    <div className="font-heading font-semibold">Admin</div>
                    <div className="text-[10px] opacity-75 truncate">admin@yuzuafrica.com</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('ebiringai@gmail.com', 'Airpyk98')}
                    className="px-3 py-2 rounded-xl bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#F58220] text-xs font-medium text-left transition-all"
                  >
                    <div className="font-heading font-semibold text-[#222222]">Paul Ebiringa</div>
                    <div className="text-[10px] text-[#222222]/70 truncate">ebiringai@gmail.com</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-[#222222]/50">
          Yuzu Africa · Strategy. Branding. Growth.
        </footer>
      </div>
    );
  }

  // ==================== MAIN WORKSPACE ====================
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#222222] flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#222222] text-white text-xs font-medium shadow-xl border border-white/10">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === 'error' ? 'bg-[#D6246E]' : 'bg-[#FFC20E]'
            }`}
          />
          {toast.msg}
        </div>
      )}

      {/* Global Top Bar (Always accessible to toggle Desktop / Mobile View) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#EAE3F2] px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/yuzu-logo.jpg"
              alt="Yuzu Africa"
              className="h-9 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <div className="font-heading font-bold text-sm text-[#5B2A86] leading-tight">
                Yuzu Africa
              </div>
              <div className="text-[11px] text-[#222222]/55">
                Content Calendar
              </div>
            </div>
          </div>

          {/* Center Nav + Desktop/Mobile View Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Main Navigation Tabs */}
            <nav className="inline-flex items-center bg-[#FAF7F2] p-1 rounded-full border border-[#E6DFEE]">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-[#5B2A86] text-white shadow-sm'
                    : 'text-[#222222]/70 hover:text-[#5B2A86]'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>

              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === 'team'
                      ? 'bg-[#5B2A86] text-white shadow-sm'
                      : 'text-[#222222]/70 hover:text-[#5B2A86]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Managers</span>
                  {pendingManagersCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#D6246E] text-white text-[10px] font-bold">
                      {pendingManagersCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#5B2A86] text-white shadow-sm'
                    : 'text-[#222222]/70 hover:text-[#5B2A86]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Desktop / Mobile View Toggle Switch */}
            <div
              className="inline-flex items-center bg-[#FAF7F2] p-1 rounded-full border border-[#E6DFEE]"
              title="Toggle Desktop / Mobile View"
            >
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !isMobile
                    ? 'bg-[#D6246E] text-white shadow-sm'
                    : 'text-[#222222]/70 hover:text-[#D6246E]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isMobile
                    ? 'bg-[#D6246E] text-white shadow-sm'
                    : 'text-[#222222]/70 hover:text-[#D6246E]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mobile</span>
              </button>
            </div>
          </div>

          {/* Right: Notification Bell with Real-time Badge + User Role Pill */}
          <div className="flex items-center gap-2.5 relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifDropdown((v) => !v);
                if (!showNotifDropdown) handleMarkAllRead();
              }}
              aria-label="Notifications"
              className="relative p-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#F1EAF9] border border-[#E6DFEE] text-[#5B2A86] transition-all"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D6246E] text-white text-[10px] font-bold flex items-center justify-center shadow">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E6DFEE] p-4 z-50">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#F1ECF8]">
                  <span className="font-heading font-semibold text-xs text-[#5B2A86]">
                    Live Updates ({notifications.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-[#222222]/40 hover:text-[#222222]"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#222222]/50 py-4 text-center">
                      No updates yet.
                    </p>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.postDate) {
                            setSelectedDate(n.postDate);
                            const [y, m] = n.postDate.split('-').map(Number);
                            if (y && m) {
                              setCurrentYear(y);
                              setCurrentMonth(m - 1);
                            }
                          }
                          if (n.platform && PLATFORMS.includes(n.platform)) {
                            setSelectedPlatform(n.platform);
                          }
                          setActiveTab('calendar');
                          setShowNotifDropdown(false);
                        }}
                        className="p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDF9] cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-heading font-semibold text-xs text-[#5B2A86]">
                            {n.title || 'Update'}
                          </span>
                          <span className="text-[10px] text-[#222222]/45">
                            {n.postDate || ''}
                          </span>
                        </div>
                        <p className="text-xs text-[#222222]/80 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* User Badge */}
            <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-[#FAF7F2] border border-[#E6DFEE]">
              <div className="w-7 h-7 rounded-full bg-[#5B2A86] text-white font-heading font-bold text-xs flex items-center justify-center">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block pr-2">
                <div className="text-xs font-semibold leading-none text-[#222222]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#5B2A86] font-medium uppercase">
                  {currentUser.role}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('yuzu_current_user');
                  setCurrentUser(null);
                }}
                title="Sign Out"
                className="p-1.5 rounded-full text-[#222222]/50 hover:text-[#D6246E] hover:bg-white transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container (Switches cleanly between Full Desktop and Framed Mobile Phone Viewport) */}
      <main className="flex-1 py-6 px-4 lg:px-8 flex justify-center">
        <div
          className={`w-full transition-all duration-300 ${
            isMobile
              ? 'max-w-[412px] bg-[#FAF7F2] border-[11px] border-[#222222] rounded-[48px] shadow-[0_24px_60px_rgba(34,34,34,0.22)] p-4 overflow-y-auto max-h-[840px]'
              : 'max-w-7xl'
          }`}
        >
          {/* Mobile Notch Bar when in Mobile View */}
          {isMobile && (
            <div className="flex items-center justify-between px-3 pb-3 mb-2 border-b border-[#EAE3F2]">
              <span className="text-[11px] font-semibold text-[#5B2A86]">9:41</span>
              <div className="w-20 h-4 bg-[#222222] rounded-full" />
              <span className="text-[10px] font-medium text-[#D6246E] uppercase">
                {currentUser.role}
              </span>
            </div>
          )}

          {/* ==================== TAB 1: CALENDAR ==================== */}
          {activeTab === 'calendar' && (
            <div
              className={`grid gap-6 ${
                isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
              }`}
            >
              {/* LEFT / MAIN: MONTH CALENDAR */}
              <section
                className={`${
                  isMobile ? '' : 'lg:col-span-7 xl:col-span-8'
                } bg-white rounded-3xl p-5 sm:p-6 border border-[#ECE6F4] shadow-sm`}
              >
                {/* Calendar Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#5B2A86]">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </h1>
                    <p className="text-xs text-[#222222]/60">
                      Click any highlighted day to view or upload social posts.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      aria-label="Previous month"
                      className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EBF9] text-[#5B2A86] border border-[#E6DFEE]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentYear(2026);
                        setCurrentMonth(10);
                        setSelectedDate('2026-11-02');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EBF9] text-xs font-heading font-semibold text-[#5B2A86] border border-[#E6DFEE]"
                    >
                      Nov 2026
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      aria-label="Next month"
                      className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EBF9] text-[#5B2A86] border border-[#E6DFEE]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day-of-Week Headers */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div
                      key={d}
                      className="text-[11px] font-heading font-semibold text-[#5B2A86]/75 uppercase py-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {calendarDays.map((cell, idx) => {
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="h-14 sm:h-20 rounded-2xl bg-[#FAF7F2]/40"
                        />
                      );
                    }

                    const dayPosts = postsByDate[cell.dateStr] || [];
                    const hasContent = dayPosts.length > 0;
                    const isSelected = selectedDate === cell.dateStr;
                    const allApproved =
                      hasContent && dayPosts.every((p) => Boolean(p.approved));

                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(cell.dateStr);
                          setSelectedPlatform(null);
                          setIsAddingPost(false);
                        }}
                        className={`h-14 sm:h-20 rounded-2xl p-2 flex flex-col justify-between text-left transition-all border ${
                          isSelected
                            ? 'bg-[#5B2A86] text-white border-[#5B2A86] shadow-md scale-[1.02]'
                            : hasContent
                            ? 'bg-[#F6F0FC] hover:bg-[#EFE4FA] text-[#222222] border-[#DCC8F2]'
                            : 'bg-[#FAF7F2] hover:bg-[#F3EFEA] text-[#222222]/60 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`font-heading font-bold text-xs sm:text-sm ${
                              isSelected
                                ? 'text-white'
                                : hasContent
                                ? 'text-[#5B2A86]'
                                : 'text-[#222222]/60'
                            }`}
                          >
                            {cell.day}
                          </span>
                          {hasContent && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                isSelected
                                  ? 'bg-[#FFC20E] text-[#222222]'
                                  : allApproved
                                  ? 'bg-[#10B981]/15 text-[#047857]'
                                  : 'bg-[#F58220]/20 text-[#222222]'
                              }`}
                            >
                              {dayPosts.length}
                            </span>
                          )}
                        </div>

                        {/* Colored Social Dots */}
                        {hasContent && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {dayPosts.slice(0, 6).map((p) => (
                              <span
                                key={p.id}
                                className={`w-2 h-2 rounded-full ${
                                  isSelected
                                    ? p.approved
                                      ? 'bg-[#FFC20E]'
                                      : 'bg-white/80'
                                    : PLATFORM_STYLE[p.platform]?.dot || 'bg-[#5B2A86]'
                                }`}
                                title={`${p.platform}: ${p.title}`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Minimal Legend */}
                <div className="mt-5 pt-4 border-t border-[#F1ECF8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#222222]/70">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-[#F6F0FC] border border-[#DCC8F2]" />
                      Has Content
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-[#5B2A86]" />
                      Selected Day
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href="/Yuzu_Africa_Nov2026_Calendar.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#5B2A86] hover:underline font-medium"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Nov Calendar PDF
                    </a>
                    <a
                      href="/Yuzu_Africa_Brand_Bible.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#D6246E] hover:underline font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Brand Bible PDF
                    </a>
                  </div>
                </div>
              </section>

              {/* RIGHT / BOTTOM: SELECTED DAY SOCIALS & CONTENT PREVIEW */}
              <section
                className={`${
                  isMobile ? '' : 'lg:col-span-5 xl:col-span-4'
                } bg-white rounded-3xl p-5 sm:p-6 border border-[#ECE6F4] shadow-sm flex flex-col`}
              >
                {/* Selected Day Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1ECF8]">
                  <div>
                    <div className="text-[11px] font-heading font-semibold uppercase text-[#D6246E]">
                      Selected Day
                    </div>
                    <h2 className="font-heading font-bold text-lg text-[#5B2A86]">
                      {selectedDate} · {selectedDayPosts.length}{' '}
                      {selectedDayPosts.length === 1 ? 'Social' : 'Socials'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={openNewPostForm}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D6246E] hover:bg-[#be1d60] text-white font-heading font-semibold text-xs shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Post
                  </button>
                </div>

                {/* Step 1: List of Socials for the Selected Day */}
                {selectedDayPosts.length === 0 && !isAddingPost ? (
                  <div className="py-12 text-center">
                    <p className="text-sm font-medium text-[#222222]/60 mb-3">
                      No social posts scheduled for {selectedDate}.
                    </p>
                    <button
                      type="button"
                      onClick={openNewPostForm}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5B2A86] text-white font-heading font-semibold text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Upload Post for {selectedDate}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="text-xs font-medium text-[#222222]/60 mb-2">
                        Socials with content (click to preview):
                      </div>
                      <div className="space-y-2">
                        {selectedDayPosts.map((post) => {
                          const style =
                            PLATFORM_STYLE[post.platform] || PLATFORM_STYLE.Instagram;
                          const isCurrent =
                            selectedPlatform === post.platform && !isAddingPost;

                          return (
                            <button
                              key={post.id}
                              type="button"
                              onClick={() => {
                                setSelectedPlatform(post.platform);
                                setIsAddingPost(false);
                              }}
                              className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                                isCurrent
                                  ? 'bg-[#5B2A86] text-white border-[#5B2A86] shadow-sm'
                                  : 'bg-[#FAF7F2] hover:bg-[#F3EDF9] text-[#222222] border-[#EAE3F2]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`w-8 h-8 rounded-xl font-heading font-bold text-xs flex items-center justify-center shrink-0 ${
                                    isCurrent
                                      ? 'bg-white text-[#5B2A86]'
                                      : `${style.bg} ${style.text}`
                                  }`}
                                >
                                  {style.short}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-heading font-semibold text-sm flex items-center gap-2">
                                    <span>{post.platform}</span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                        isCurrent
                                          ? 'bg-white/20 text-white'
                                          : 'bg-white text-[#5B2A86]'
                                      }`}
                                    >
                                      {post.postType}
                                    </span>
                                  </div>
                                  <p
                                    className={`text-xs truncate ${
                                      isCurrent ? 'text-white/80' : 'text-[#222222]/65'
                                    }`}
                                  >
                                    {post.title}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`ml-2 px-2.5 py-1 rounded-full text-[10px] font-heading font-semibold shrink-0 flex items-center gap-1 ${
                                  post.approved
                                    ? isCurrent
                                      ? 'bg-[#FFC20E] text-[#222222]'
                                      : 'bg-[#ECFDF5] text-[#047857]'
                                    : isCurrent
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#FFF7ED] text-[#F58220]'
                                }`}
                              >
                                {post.approved ? (
                                  <>
                                    <Check className="w-3 h-3" /> Approved
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" /> Pending
                                  </>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2: Content Preview / Admin Approval / Manager Upload Drawer */}
                {(activePost || isAddingPost) && (
                  <div className="mt-2 pt-4 border-t border-[#EAE3F2] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#5B2A86] text-white font-heading font-semibold text-xs">
                          {isAddingPost ? 'New Post' : activePost.platform}
                        </span>
                        {!isAddingPost && (
                          <span className="text-xs font-medium text-[#222222]/60">
                            by {activePost.authorName || 'Ikechukwu Paul Ebiringa'}
                          </span>
                        )}
                      </div>

                      {!isAddingPost && (
                        <button
                          type="button"
                          onClick={handleDeletePost}
                          title="Delete post"
                          className="p-1.5 rounded-lg text-[#222222]/40 hover:text-[#D6246E] hover:bg-[#FDF2F7]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Preview Card when viewing an existing post */}
                    {!isAddingPost && activePost && (
                      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFEE] space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-heading font-bold uppercase text-[#5B2A86]">
                            {activePost.postType} · {activePost.pillar || 'Content'}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              activePost.approved
                                ? 'bg-[#ECFDF5] text-[#047857]'
                                : 'bg-[#FFF7ED] text-[#F58220]'
                            }`}
                          >
                            {activePost.approved ? 'Approved' : 'Pending Review'}
                          </span>
                        </div>

                        <h3 className="font-heading font-bold text-sm text-[#222222]">
                          {activePost.title}
                        </h3>

                        <p className="text-xs text-[#222222]/85 whitespace-pre-line leading-relaxed bg-white p-3 rounded-xl border border-[#ECE6F4]">
                          {activePost.caption}
                        </p>

                        {/* Uploaded Media / Link Preview */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {activePost.fileUrl && (
                            <a
                              href={activePost.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F4EFFA] text-[#5B2A86] border border-[#DCC8F2] text-xs font-medium"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[180px]">
                                {activePost.fileName || 'View Uploaded File'}
                              </span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {activePost.postLink && (
                            <a
                              href={activePost.postLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FDF2F7] text-[#D6246E] border border-[#F8D0E2] text-xs font-medium"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span>Post Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Inline Image/Video Preview if uploaded file is media */}
                        {activePost.fileUrl &&
                          activePost.fileType?.startsWith('image/') && (
                            <img
                              src={activePost.fileUrl}
                              alt={activePost.title}
                              className="w-full max-h-48 object-cover rounded-xl border border-[#E6DFEE]"
                            />
                          )}
                        {activePost.fileUrl &&
                          activePost.fileType?.startsWith('video/') && (
                            <video
                              src={activePost.fileUrl}
                              controls
                              className="w-full max-h-48 rounded-xl border border-[#E6DFEE]"
                            />
                          )}

                        {/* Existing Admin Commentary Display */}
                        {activePost.comment && (
                          <div className="p-3 rounded-xl bg-[#F4EFFA] border border-[#DCC8F2] text-xs">
                            <span className="font-heading font-semibold text-[#5B2A86] block mb-0.5">
                              Admin Commentary:
                            </span>
                            <span className="text-[#222222]">{activePost.comment}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADMIN REVIEW BOX: Toggle Approve + Commentary + Send */}
                    {!isAddingPost && activePost && currentUser.role === 'admin' && (
                      <form
                        onSubmit={handleSendReview}
                        className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFEE] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-semibold text-xs text-[#5B2A86]">
                            Approve Post
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={reviewApproved}
                            onClick={() => setReviewApproved((v) => !v)}
                            className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                              reviewApproved ? 'bg-[#D6246E] justify-end' : 'bg-[#D8CFE3] justify-start'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white shadow" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#222222]/75 mb-1">
                            Commentary for Account Manager
                          </label>
                          <textarea
                            rows={2}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Add short feedback or approval note..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4DDF0] text-xs focus:outline-none focus:border-[#5B2A86]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingReview}
                          className="w-full py-2.5 rounded-xl bg-[#D6246E] hover:bg-[#be1d60] text-white font-heading font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {sendingReview ? 'Sending...' : 'Send Update'}
                        </button>
                      </form>
                    )}

                    {/* UPLOAD / EDIT POST SECTION (Managers & Admin can upload/edit post kind, link, HF file, or text) */}
                    <details
                      open={isAddingPost || currentUser.role === 'manager'}
                      className="group rounded-2xl bg-[#FAF7F2] border border-[#E6DFEE] p-4"
                    >
                      <summary className="font-heading font-semibold text-xs text-[#5B2A86] cursor-pointer list-none flex items-center justify-between">
                        <span>
                          {isAddingPost
                            ? `Upload New Post for ${selectedDate}`
                            : `Edit / Upload Content (${activePost?.platform})`}
                        </span>
                        <span className="text-[10px] text-[#D6246E] font-medium">
                          {isAddingPost ? ' Required' : 'Expand'}
                        </span>
                      </summary>

                      <form onSubmit={handleSavePost} className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-[#222222]/75 mb-1">
                              Social Platform
                            </label>
                            <select
                              value={isAddingPost ? formPlatform : activePost?.platform || formPlatform}
                              disabled={!isAddingPost}
                              onChange={(e) => setFormPlatform(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4DDF0] text-xs focus:outline-none focus:border-[#5B2A86] disabled:opacity-60"
                            >
                              {PLATFORMS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-[#222222]/75 mb-1">
                              Kind of Post
                            </label>
                            <select
                              value={formPostType}
                              onChange={(e) => setFormPostType(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4DDF0] text-xs focus:outline-none focus:border-[#5B2A86]"
                            >
                              {POST_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[#222222]/75 mb-1">
                            Headline / Topic
                          </label>
                          <input
                            type="text"
                            required
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="e.g. 5 reasons people follow you but never buy"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4DDF0] text-xs focus:outline-none focus:border-[#5B2A86]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[#222222]/75 mb-1">
                            Post Text / Caption
                          </label>
                          <textarea
                            rows={3}
                            value={formCaption}
                            onChange={(e) => setFormCaption(e.target.value)}
                            placeholder="Write post copy and hashtags..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4DDF0] text-xs focus:outline-none focus:border-[#5B2A86]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[#222222]/75 mb-1">
                            Post Link (optional)
                          </label>
                          <input
                            type="url"
                            value={formPostLink}
                            onChange={(e) => setFormPostLink(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4DDF0] text-xs focus:outline-none focus:border-[#5B2A86]"
                          />
                        </div>

                        {/* Persistent Hugging Face File Upload */}
                        <div>
                          <label className="block text-[11px] font-medium text-[#222222]/75 mb-1">
                            Upload File (Saved persistently to Hugging Face Dataset)
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-[#F4EFFA] text-[#5B2A86] border border-dashed border-[#5B2A86]/40 text-xs font-medium cursor-pointer transition-all">
                              <Upload className="w-3.5 h-3.5" />
                              <span>
                                {uploadingFile
                                  ? 'Uploading to Hugging Face...'
                                  : formFileName
                                  ? `Uploaded: ${formFileName}`
                                  : 'Choose File / Media'}
                              </span>
                              <input
                                type="file"
                                onChange={handleFileUpload}
                                disabled={uploadingFile}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {formFileUrl && (
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded-lg">
                              <span className="truncate">HF Saved: {formFileName || formFileUrl}</span>
                              <a
                                href={formFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline ml-2 shrink-0"
                              >
                                Open
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {isAddingPost && (
                            <button
                              type="button"
                              onClick={() => setIsAddingPost(false)}
                              className="px-3 py-2 rounded-xl bg-white border border-[#E4DDF0] text-xs font-medium"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={savingPost || uploadingFile}
                            className="flex-1 py-2.5 rounded-xl bg-[#5B2A86] hover:bg-[#49206c] text-white font-heading font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                          >
                            {savingPost ? 'Saving...' : 'Save Post'}
                          </button>
                        </div>
                      </form>
                    </details>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ==================== TAB 2: TEAM MANAGERS (ADMIN ONLY) ==================== */}
          {activeTab === 'team' && currentUser.role === 'admin' && (
            <section className="bg-white rounded-3xl p-6 border border-[#ECE6F4] shadow-sm max-w-3xl mx-auto">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F1ECF8]">
                <div>
                  <h2 className="font-heading font-bold text-xl text-[#5B2A86]">
                    Account Managers
                  </h2>
                  <p className="text-xs text-[#222222]/60">
                    Approve new manager sign-ups or deactivate accounts in real time.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#F4EFFA] text-[#5B2A86] font-heading font-semibold text-xs">
                  {users.filter((u) => u.role === 'manager').length} Managers
                </span>
              </div>

              <div className="space-y-3">
                {users
                  .filter((u) => u.role === 'manager')
                  .map((manager) => (
                    <div
                      key={manager.id}
                      className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFEE] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#5B2A86] text-white font-heading font-bold text-sm flex items-center justify-center">
                          {manager.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-heading font-semibold text-sm text-[#222222] flex items-center gap-2">
                            <span>{manager.name}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                manager.status === 'approved'
                                  ? 'bg-[#ECFDF5] text-[#047857]'
                                  : manager.status === 'pending'
                                  ? 'bg-[#FFF7ED] text-[#F58220]'
                                  : 'bg-[#FDF2F7] text-[#D6246E]'
                              }`}
                            >
                              {manager.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#222222]/60">{manager.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {manager.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateUserStatus(manager, 'approved')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-heading font-semibold text-xs shadow-sm transition-all"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                        {manager.status !== 'deactivated' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateUserStatus(manager, 'deactivated')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF2F7] hover:bg-[#D6246E] text-[#D6246E] hover:text-white border border-[#D6246E]/30 font-heading font-semibold text-xs transition-all"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* ==================== TAB 3: PROFILE SETTINGS & CHANGE PASSWORD ==================== */}
          {activeTab === 'settings' && (
            <section className="bg-white rounded-3xl p-6 border border-[#ECE6F4] shadow-sm max-w-xl mx-auto space-y-6">
              <div className="pb-4 border-b border-[#F1ECF8]">
                <h2 className="font-heading font-bold text-xl text-[#5B2A86]">
                  Profile Settings
                </h2>
                <p className="text-xs text-[#222222]/60">
                  Manage your Yuzu Africa account details and password.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFEE] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5B2A86] text-white font-heading font-bold text-lg flex items-center justify-center">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-heading font-bold text-base text-[#222222]">
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-[#222222]/65">{currentUser.email}</div>
                  <span className="inline-block mt-1 text-[10px] font-heading font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#F4EFFA] text-[#5B2A86]">
                    {currentUser.role} · {currentUser.status}
                  </span>
                </div>
              </div>

              {/* Change Password Form with Eye Icons */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="font-heading font-semibold text-sm text-[#5B2A86]">
                  Change Password
                </h3>

                <div>
                  <label className="block text-xs font-medium text-[#222222]/80 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassInput}
                      onChange={(e) => setCurrentPassInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-sm focus:outline-none focus:border-[#5B2A86]"
                    />
                    <button
                      type="button"
                      aria-label={showCurrentPass ? 'Hide current password' : 'Show current password'}
                      onClick={() => setShowCurrentPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#222222]/50 hover:text-[#5B2A86] p-1"
                    >
                      {showCurrentPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#222222]/80 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-sm focus:outline-none focus:border-[#5B2A86]"
                    />
                    <button
                      type="button"
                      aria-label={showNewPass ? 'Hide new password' : 'Show new password'}
                      onClick={() => setShowNewPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#222222]/50 hover:text-[#5B2A86] p-1"
                    >
                      {showNewPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#222222]/80 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassInput}
                      onChange={(e) => setConfirmPassInput(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-sm focus:outline-none focus:border-[#5B2A86]"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#222222]/50 hover:text-[#5B2A86] p-1"
                    >
                      {showConfirmPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={changingPass}
                  className="w-full py-3 rounded-xl bg-[#D6246E] hover:bg-[#be1d60] text-white font-heading font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {changingPass ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
