import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  UserCheck,
  UserX,
  ExternalLink,
  Trash2,
  Sparkles,
  BookOpen,
  Mic,
  Square,
  Volume2,
  ArrowLeft,
  Play,
  Image as ImageIcon,
  Pencil,
  Globe
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

// Unified, harmonious Yuzu Africa brand badges
const PLATFORM_META = {
  Instagram: { short: 'IG', label: 'Instagram' },
  TikTok: { short: 'TT', label: 'TikTok' },
  LinkedIn: { short: 'IN', label: 'LinkedIn' },
  X: { short: 'X', label: 'X' },
  Facebook: { short: 'FB', label: 'Facebook' },
  WhatsApp: { short: 'WA', label: 'WhatsApp' }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function emailToDocId(email) {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function formatDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const mins = Math.floor(s / 60);
  const rem = String(s % 60).padStart(2, '0');
  return `${mins}:${rem}`;
}

function getTodayInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const day = now.getDate();
  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, monthIndex, dateStr };
}

export default function App() {
  const todayInfo = useMemo(() => getTodayInfo(), []);

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
  const [authRole, setAuthRole] = useState('manager');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation Pages: 'calendar' | 'post-detail' | 'post-edit' | 'team' | 'settings'
  const [activeTab, setActiveTab] = useState('calendar');

  // Calendar State — Defaults to exact current day
  const [currentYear, setCurrentYear] = useState(todayInfo.year);
  const [currentMonth, setCurrentMonth] = useState(todayInfo.monthIndex);
  const [selectedDate, setSelectedDate] = useState(todayInfo.dateStr);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isAddingPost, setIsAddingPost] = useState(false);

  // Firestore Collections State
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [seeding, setSeeding] = useState(true);

  // Media Lightbox Popup State (Video / Image / Swipeable Carousel)
  const [mediaPopup, setMediaPopup] = useState({
    open: false,
    items: [],
    index: 0,
    title: ''
  });
  const touchStartXRef = useRef(null);

  // In-App Post Link Popup Viewer State
  const [linkPopup, setLinkPopup] = useState({
    open: false,
    url: '',
    title: ''
  });

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Review Form State (Admin & Manager)
  const [reviewApproved, setReviewApproved] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewVoiceNotes, setReviewVoiceNotes] = useState([]);
  const [sendingReview, setSendingReview] = useState(false);

  // Voice Note Recorder State (Small bitrate WebM/Opus saved to Hugging Face)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadingVN, setUploadingVN] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordDurationRef = useRef(0);

  // Manager Upload / Edit Form State
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formPostType, setFormPostType] = useState('Carousel');
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formPostLink, setFormPostLink] = useState('');
  const [formFiles, setFormFiles] = useState([]);
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
          await setDoc(doc(db, 'users', DEFAULT_ADMIN.id), DEFAULT_ADMIN, { merge: true });
          await setDoc(doc(db, 'users', DEFAULT_MANAGER.id), DEFAULT_MANAGER, { merge: true });

          const batch = writeBatch(db);
          INITIAL_NOV_2026_POSTS.forEach((post) => {
            const pRef = doc(db, 'posts', post.id);
            batch.set(pRef, post, { merge: true });
          });
          await batch.commit();

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

      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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

  // Keep currentUser synced with live Firestore user doc
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

  // Derived: Active post being viewed on the Dedicated Social Page
  const activePost = useMemo(() => {
    if (!selectedPlatform) return null;
    return selectedDayPosts.find((p) => p.platform === selectedPlatform) || null;
  }, [selectedDayPosts, selectedPlatform]);

  // Normalize files list for any post
  const getPostMediaItems = (post) => {
    if (!post) return [];
    if (Array.isArray(post.files) && post.files.length > 0) {
      return post.files;
    }
    if (post.fileUrl) {
      return [
        {
          fileUrl: post.fileUrl,
          fileName: post.fileName || 'Attached File',
          fileType: post.fileType || 'application/octet-stream'
        }
      ];
    }
    return [];
  };

  // Sync Review & Edit states when activePost changes
  useEffect(() => {
    if (activePost) {
      setReviewApproved(Boolean(activePost.approved));
      setReviewComment(activePost.comment || '');
      setReviewVoiceNotes(Array.isArray(activePost.voiceNotes) ? activePost.voiceNotes : []);
      setFormPlatform(activePost.platform || 'Instagram');
      setFormPostType(activePost.postType || 'Carousel');
      setFormTitle(activePost.title || '');
      setFormCaption(activePost.caption || '');
      setFormPostLink(activePost.postLink || '');
      setFormFiles(getPostMediaItems(activePost));
      setIsAddingPost(false);
    }
  }, [
    activePost?.id,
    activePost?.approved,
    activePost?.comment,
    activePost?.updatedAt
  ]);

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

        await addDoc(collection(db, 'notifications'), {
          title: isAdminEmail ? 'New Admin Registered' : 'New Manager Sign-Up',
          message: `${newUser.name} (${newUser.email}) signed up as ${newUser.role}.`,
          targetRole: 'all',
          actorEmail: newUser.email,
          actorName: newUser.name,
          postDate: selectedDate || todayInfo.dateStr,
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

  const fillCredentials = (email, pass) => {
    setAuthMode('signin');
    setAuthEmail(email);
    setAuthPassword(pass);
    setAuthError('');
  };

  // ==================== VOICE NOTE RECORDING (LOW BITRATE + HF UPLOAD) ====================
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const options = mimeType
        ? { mimeType, audioBitsPerSecond: 24000 }
        : { audioBitsPerSecond: 24000 };

      const recorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      recordDurationRef.current = 0;
      setRecordingSeconds(0);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(recordTimerRef.current);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        const finalDuration = Math.max(1, recordDurationRef.current);
        const blobType = mimeType || 'audio/webm';
        const ext = blobType.includes('mp4') ? 'm4a' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });

        if (audioBlob.size === 0) return;

        setUploadingVN(true);
        try {
          const vnFileName = `vn_${Date.now()}.${ext}`;
          const targetPlatform = activePost?.platform || formPlatform || 'Instagram';
          const uploaded = await uploadAssetToHuggingFace(
            audioBlob,
            selectedDate,
            targetPlatform,
            vnFileName
          );

          const newVN = {
            id: `vn_${Date.now()}`,
            url: uploaded.fileUrl,
            duration: finalDuration,
            sizeKB: Math.max(1, Math.round(audioBlob.size / 1024)),
            authorName: currentUser?.name || 'Admin',
            createdAt: new Date().toISOString()
          };

          const updatedVNs = [...reviewVoiceNotes, newVN];
          setReviewVoiceNotes(updatedVNs);

          if (activePost) {
            await updateDoc(doc(db, 'posts', activePost.id), {
              voiceNotes: updatedVNs,
              updatedBy: currentUser.email,
              updatedAt: new Date().toISOString()
            });
          }

          showToast(`Voice note (${newVN.sizeKB} KB) saved to Hugging Face!`);
        } catch (err) {
          showToast('Voice note upload failed: ' + err.message, 'error');
        } finally {
          setUploadingVN(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      recordTimerRef.current = setInterval(() => {
        recordDurationRef.current += 1;
        setRecordingSeconds(recordDurationRef.current);
      }, 1000);
    } catch (err) {
      showToast('Microphone permission denied or unavailable.', 'error');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDeleteVoiceNote = async (vnId) => {
    const updatedVNs = reviewVoiceNotes.filter((v) => v.id !== vnId);
    setReviewVoiceNotes(updatedVNs);
    if (activePost && currentUser) {
      try {
        await updateDoc(doc(db, 'posts', activePost.id), {
          voiceNotes: updatedVNs,
          updatedBy: currentUser.email,
          updatedAt: new Date().toISOString()
        });
        showToast('Voice note deleted.');
      } catch (err) {
        showToast('Failed to delete voice note: ' + err.message, 'error');
      }
    }
  };

  // Admin: Send Review (Approval + Commentary + Voice Notes)
  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!activePost || !currentUser) return;
    setSendingReview(true);

    try {
      const postRef = doc(db, 'posts', activePost.id);
      await updateDoc(postRef, {
        approved: reviewApproved,
        comment: reviewComment.trim(),
        voiceNotes: reviewVoiceNotes,
        updatedBy: currentUser.email,
        updatedAt: new Date().toISOString()
      });

      const statusLabel = reviewApproved ? 'Approved' : 'Marked Pending';
      const vnCount = reviewVoiceNotes.length;
      const vnSuffix = vnCount > 0 ? ` (${vnCount} voice note${vnCount > 1 ? 's' : ''})` : '';

      await addDoc(collection(db, 'notifications'), {
        title: `${activePost.platform} Post ${statusLabel}`,
        message: `${currentUser.name} ${statusLabel.toLowerCase()} ${activePost.platform} (${activePost.date})${vnSuffix}${
          reviewComment.trim() ? `: "${reviewComment.trim()}"` : '.'
        }`,
        targetRole: 'all',
        actorEmail: currentUser.email,
        actorName: currentUser.name,
        postDate: activePost.date,
        postId: activePost.id,
        platform: activePost.platform,
        readBy: [currentUser.email],
        createdAt: new Date().toISOString()
      });

      showToast('Update sent to account managers!');
    } catch (err) {
      showToast('Failed to send review: ' + err.message, 'error');
    } finally {
      setSendingReview(false);
    }
  };

  // Multi-File Upload to Hugging Face Dataset
  const handleFileUpload = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;
    setUploadingFile(true);

    try {
      const targetPlatform = isAddingPost ? formPlatform : (activePost?.platform || formPlatform);
      const uploadedItems = [];

      for (const file of fileList) {
        const result = await uploadAssetToHuggingFace(file, selectedDate, targetPlatform);
        uploadedItems.push({
          fileUrl: result.fileUrl,
          fileName: result.fileName,
          fileType: result.fileType
        });
      }

      setFormFiles((prev) => [...prev, ...uploadedItems]);
      showToast(
        `Uploaded ${uploadedItems.length} file${uploadedItems.length > 1 ? 's' : ''} to Hugging Face!`
      );
    } catch (err) {
      showToast('HF Upload error: ' + err.message, 'error');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleRemoveFormFile = (indexToRemove) => {
    setFormFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Manager / Admin: Save or Update Post for Selected Day
  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedDate) return;
    setSavingPost(true);

    const targetPlatform = isAddingPost ? formPlatform : (activePost?.platform || formPlatform);
    const postId = `${selectedDate}_${targetPlatform.toLowerCase()}`;
    const [y, m] = selectedDate.split('-').map(Number);

    const primaryFile = formFiles[0] || { fileUrl: '', fileName: '', fileType: '' };

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
      fileUrl: primaryFile.fileUrl,
      fileName: primaryFile.fileName,
      fileType: primaryFile.fileType,
      files: formFiles,
      voiceNotes: activePost?.voiceNotes || reviewVoiceNotes || [],
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
        message: `${currentUser.name} updated ${targetPlatform} (${formPostType}) for ${selectedDate}.`,
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
      setActiveTab('post-detail');
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
      setActiveTab('calendar');
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

  // Open New Post Form on Dedicated Edit Page
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
    setFormFiles([]);
    setReviewVoiceNotes([]);
    setActiveTab('post-edit');
  };

  // Open Edit Page for Existing Active Post
  const openEditPostPage = () => {
    if (!activePost) return;
    setIsAddingPost(false);
    setFormPlatform(activePost.platform || 'Instagram');
    setFormPostType(activePost.postType || 'Carousel');
    setFormTitle(activePost.title || '');
    setFormCaption(activePost.caption || '');
    setFormPostLink(activePost.postLink || '');
    setFormFiles(getPostMediaItems(activePost));
    setActiveTab('post-edit');
  };

  // Open Media Popup Modal (Video, Image, or Swipeable Carousel)
  const openMediaModal = (items, startIndex = 0, title = 'Media Preview') => {
    if (!items || items.length === 0) return;
    setMediaPopup({
      open: true,
      items,
      index: startIndex,
      title
    });
  };

  const closeMediaModal = () => {
    setMediaPopup((prev) => ({ ...prev, open: false }));
  };

  const nextSlide = () => {
    setMediaPopup((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.items.length
    }));
  };

  const prevSlide = () => {
    setMediaPopup((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.items.length) % prev.items.length
    }));
  };

  // Touch Swipe Handlers for Carousel Modal
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartXRef.current;
    const diff = touchStartXRef.current - endX;
    if (Math.abs(diff) > 40 && mediaPopup.items.length > 1) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartXRef.current = null;
  };

  // Calendar Grid Calculation (Monday-first)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
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

  const isImageAsset = (item) => {
    if (!item) return false;
    const t = (item.fileType || '').toLowerCase();
    const u = (item.fileUrl || '').toLowerCase();
    return t.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(u);
  };

  const isVideoAsset = (item) => {
    if (!item) return false;
    const t = (item.fileType || '').toLowerCase();
    const u = (item.fileUrl || '').toLowerCase();
    return t.startsWith('video/') || /\.(mp4|webm|mov|m4v)(\?|$)/.test(u);
  };

  // ==================== AUTH SCREEN ====================
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF7F2] flex flex-col justify-between p-4 sm:p-8">
        <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/yuzu-logo.jpg"
              alt="Yuzu Africa"
              className="h-9 sm:h-10 w-auto rounded-lg object-contain bg-white px-2 py-1 shadow-sm border border-[#EDE6F5]"
            />
            <span className="font-heading font-bold text-base sm:text-lg text-[#5B2A86]">
              Yuzu Africa
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center my-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE6F4] shadow-[0_12px_32px_-12px_rgba(91,42,134,0.12)]">
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
        </main>

        <footer className="text-center text-xs text-[#222222]/50">
          Yuzu Africa · Strategy. Branding. Growth.
        </footer>
      </div>
    );
  }

  // ==================== MAIN WORKSPACE ====================
  const activePostMediaItems = getPostMediaItems(activePost);

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FAF7F2] text-[#222222] flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 z-50 sm:max-w-sm flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#222222] text-white text-xs font-medium shadow-xl">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              toast.type === 'error' ? 'bg-[#D6246E]' : 'bg-[#FFC20E]'
            }`}
          />
          <span className="truncate">{toast.msg}</span>
        </div>
      )}

      {/* ==================== POPUP 1: MEDIA LIGHTBOX (VIDEO / IMAGE / SWIPEABLE CAROUSEL) ==================== */}
      {mediaPopup.open && mediaPopup.items.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-[#222222]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={closeMediaModal}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#ECE6F4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#F1ECF8] bg-[#FAF7F2]">
              <div className="min-w-0 pr-3">
                <h3 className="font-heading font-bold text-sm text-[#5B2A86] truncate">
                  {mediaPopup.title}
                </h3>
                <p className="text-[11px] text-[#222222]/60">
                  Slide {mediaPopup.index + 1} of {mediaPopup.items.length}
                  {mediaPopup.items.length > 1 ? ' · Swipe or use arrows' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMediaModal}
                className="p-2 rounded-full bg-white hover:bg-[#FDF2F7] text-[#222222]/70 hover:text-[#D6246E] border border-[#E6DFEE] transition-all"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="relative flex-1 bg-[#18181B] flex items-center justify-center min-h-[280px] sm:min-h-[420px] max-h-[70vh] overflow-hidden">
              {(() => {
                const currentItem = mediaPopup.items[mediaPopup.index];
                if (!currentItem) return null;

                if (isVideoAsset(currentItem)) {
                  return (
                    <video
                      key={currentItem.fileUrl}
                      src={currentItem.fileUrl}
                      controls
                      autoPlay
                      className="max-h-[68vh] w-full object-contain"
                    />
                  );
                }

                if (isImageAsset(currentItem)) {
                  return (
                    <img
                      key={currentItem.fileUrl}
                      src={currentItem.fileUrl}
                      alt={currentItem.fileName || 'Slide'}
                      className="max-h-[68vh] w-full object-contain select-none"
                    />
                  );
                }

                const isPdf = (currentItem.fileUrl || '').toLowerCase().endsWith('.pdf') ||
                  (currentItem.fileType || '').toLowerCase().includes('pdf');

                if (isPdf) {
                  return (
                    <iframe
                      key={currentItem.fileUrl}
                      src={currentItem.fileUrl}
                      title={currentItem.fileName || 'PDF Preview'}
                      className="w-full h-[65vh] bg-white border-0"
                    />
                  );
                }

                return (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
                    <FileText className="w-12 h-12 text-[#FFC20E] mb-3" />
                    <p className="font-heading font-semibold text-sm mb-1">
                      {currentItem.fileName || 'Attached File'}
                    </p>
                    <a
                      href={currentItem.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D6246E] text-white font-heading font-semibold text-xs"
                    >
                      <span>Open File</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })()}

              {/* Carousel Prev / Next Controls */}
              {mediaPopup.items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#5B2A86] shadow-md flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next slide"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#5B2A86] shadow-md flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Carousel Pagination Dots & Direct Link Footer */}
            <div className="px-4 sm:px-6 py-3 bg-white border-t border-[#F1ECF8] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {mediaPopup.items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMediaPopup((p) => ({ ...p, index: i }))}
                    className={`h-2 rounded-full transition-all ${
                      i === mediaPopup.index
                        ? 'w-6 bg-[#D6246E]'
                        : 'w-2 bg-[#D8CFE3]'
                    }`}
                  />
                ))}
              </div>
              <a
                href={mediaPopup.items[mediaPopup.index]?.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-[#5B2A86] hover:underline"
              >
                <span>New Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================== POPUP 2: IN-APP POST LINK VIEWER ==================== */}
      {linkPopup.open && linkPopup.url && (
        <div
          className="fixed inset-0 z-50 bg-[#222222]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLinkPopup({ open: false, url: '', title: '' })}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#ECE6F4] shadow-2xl overflow-hidden flex flex-col h-[84vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#F1ECF8] bg-[#FAF7F2]">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <Globe className="w-4 h-4 text-[#D6246E] shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-[#5B2A86] truncate">
                    {linkPopup.title || 'Post Link Preview'}
                  </h3>
                  <p className="text-[11px] text-[#222222]/55 truncate">
                    {linkPopup.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={linkPopup.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#5B2A86] text-white font-heading font-semibold text-xs shadow-sm"
                >
                  <span>External</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setLinkPopup({ open: false, url: '', title: '' })}
                  className="p-2 rounded-full bg-white hover:bg-[#FDF2F7] text-[#222222]/70 hover:text-[#D6246E] border border-[#E6DFEE]"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#FAF7F2] relative">
              <iframe
                src={linkPopup.url}
                title={linkPopup.title || 'Post Link Viewer'}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== RESPONSIVE TOP HEADER (CLEAN ICON NAVIGATION) ==================== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#EAE3F2] px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => {
              setSelectedPlatform(null);
              setIsAddingPost(false);
              setActiveTab('calendar');
            }}
            className="flex items-center gap-2 text-left shrink-0"
          >
            <img
              src="/yuzu-logo.jpg"
              alt="Yuzu Africa"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="font-heading font-bold text-sm text-[#5B2A86] hidden sm:inline">
              Yuzu Africa
            </span>
          </button>

          {/* Center Icon Navigation Panel: Calendar, Managers, Settings */}
          <nav className="inline-flex items-center gap-1.5 bg-[#FAF7F2] p-1.5 rounded-full border border-[#E6DFEE]">
            <button
              type="button"
              onClick={() => {
                setSelectedPlatform(null);
                setIsAddingPost(false);
                setActiveTab('calendar');
              }}
              title="Calendar"
              aria-label="Calendar"
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'calendar' ||
                activeTab === 'post-detail' ||
                activeTab === 'post-edit'
                  ? 'bg-[#5B2A86] text-white shadow-sm'
                  : 'text-[#222222]/65 hover:text-[#5B2A86] hover:bg-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>

            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('team')}
                title="Managers"
                aria-label="Managers"
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  activeTab === 'team'
                    ? 'bg-[#5B2A86] text-white shadow-sm'
                    : 'text-[#222222]/65 hover:text-[#5B2A86] hover:bg-white'
                }`}
              >
                <Users className="w-4 h-4" />
                {pendingManagersCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D6246E] text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingManagersCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title="Settings"
              aria-label="Settings"
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#5B2A86] text-white shadow-sm'
                  : 'text-[#222222]/65 hover:text-[#5B2A86] hover:bg-white'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>

          {/* Right: Notification Bell + User Avatar & Sign Out */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowNotifDropdown((v) => !v);
                if (!showNotifDropdown) handleMarkAllRead();
              }}
              title="Notifications"
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#F1EAF9] border border-[#E6DFEE] text-[#5B2A86] flex items-center justify-center transition-all"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D6246E] text-white text-[10px] font-bold flex items-center justify-center shadow">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1.5 pl-1 pr-1 py-1 rounded-full bg-[#FAF7F2] border border-[#E6DFEE]">
              <div
                className="w-7 h-7 rounded-full bg-[#5B2A86] text-white font-heading font-bold text-xs flex items-center justify-center"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('yuzu_current_user');
                  setCurrentUser(null);
                }}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-1.5 rounded-full text-[#222222]/50 hover:text-[#D6246E] hover:bg-white transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Viewport-Safe Notification Popover */}
        {showNotifDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifDropdown(false)}
            />
            <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E6DFEE] p-4 z-50">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#F1ECF8]">
                <span className="font-heading font-semibold text-xs text-[#5B2A86]">
                  Live Updates ({notifications.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-[#222222]/40 hover:text-[#222222] p-1"
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
                          setActiveTab('post-detail');
                        } else {
                          setActiveTab('calendar');
                        }
                        setShowNotifDropdown(false);
                      }}
                      className="p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDF9] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading font-semibold text-xs text-[#5B2A86] truncate">
                          {n.title || 'Update'}
                        </span>
                        <span className="text-[10px] text-[#222222]/45 shrink-0">
                          {n.postDate || ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#222222]/80 mt-0.5 line-clamp-2 break-words">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* ==================== MAIN PAGE BODY ==================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        {/* ==================== PAGE 1: CALENDAR & SELECTED DAY SOCIALS LIST ==================== */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* MONTH CALENDAR CARD */}
            <section className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-4 sm:p-6 border border-[#ECE6F4] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
                <div>
                  <h1 className="font-heading font-bold text-lg sm:text-2xl text-[#5B2A86]">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h1>
                  <p className="text-xs text-[#222222]/60">
                    Tap any day to view or add social posts.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
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
                      setCurrentYear(todayInfo.year);
                      setCurrentMonth(todayInfo.monthIndex);
                      setSelectedDate(todayInfo.dateStr);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EBF9] text-xs font-heading font-semibold text-[#5B2A86] border border-[#E6DFEE]"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentYear(2026);
                      setCurrentMonth(10);
                      setSelectedDate('2026-11-02');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#F6F0FC] hover:bg-[#EFE4FA] text-xs font-heading font-semibold text-[#D6246E] border border-[#DCC8F2]"
                  >
                    Nov
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
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 text-center">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div
                    key={d}
                    className="text-[10px] sm:text-[11px] font-heading font-semibold text-[#5B2A86]/75 uppercase py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Clean, Neatly Organized Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((cell, idx) => {
                  if (!cell) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-12 sm:h-20 rounded-xl sm:rounded-2xl bg-[#FAF7F2]/40"
                      />
                    );
                  }

                  const dayPosts = postsByDate[cell.dateStr] || [];
                  const hasContent = dayPosts.length > 0;
                  const isSelected = selectedDate === cell.dateStr;
                  const isToday = cell.dateStr === todayInfo.dateStr;
                  const approvedCount = dayPosts.filter((p) => Boolean(p.approved)).length;
                  const allApproved = hasContent && approvedCount === dayPosts.length;

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(cell.dateStr);
                      }}
                      className={`h-12 sm:h-20 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between text-left transition-all border ${
                        isSelected
                          ? 'bg-[#5B2A86] text-white border-[#5B2A86] shadow-md'
                          : hasContent
                          ? 'bg-[#F6F0FC] hover:bg-[#EFE4FA] text-[#222222] border-[#DCC8F2]'
                          : isToday
                          ? 'bg-white text-[#5B2A86] border-[#D6246E]'
                          : 'bg-[#FAF7F2] hover:bg-[#F3EFEA] text-[#222222]/55 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`font-heading font-bold text-xs sm:text-sm leading-none ${
                            isSelected
                              ? 'text-white'
                              : hasContent || isToday
                              ? 'text-[#5B2A86]'
                              : 'text-[#222222]/55'
                          }`}
                        >
                          {cell.day}
                        </span>

                        {hasContent ? (
                          <span
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                              isSelected
                                ? 'bg-[#FFC20E]'
                                : allApproved
                                ? 'bg-[#10B981]'
                                : 'bg-[#D6246E]'
                            }`}
                          />
                        ) : isToday ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D6246E]" />
                        ) : null}
                      </div>

                      {hasContent && (
                        <div className="w-full flex items-center justify-between">
                          <span
                            className={`text-[9px] sm:text-[10px] font-heading font-semibold px-1.5 py-0.5 rounded-md leading-none truncate ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-white text-[#5B2A86] border border-[#E5D8F6]'
                            }`}
                          >
                            {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Minimal Legend */}
              <div className="mt-4 pt-3.5 border-t border-[#F1ECF8] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#222222]/70">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#F6F0FC] border border-[#DCC8F2]" />
                    Has Content
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    Approved
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D6246E]" />
                    Pending
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
                    Nov PDF
                  </a>
                  <a
                    href="/Yuzu_Africa_Brand_Bible.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#D6246E] hover:underline font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Brand Bible
                  </a>
                </div>
              </div>
            </section>

            {/* SELECTED DAY'S SOCIALS LIST */}
            <section className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-4 sm:p-6 border border-[#ECE6F4] shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F1ECF8]">
                <div>
                  <div className="text-[10px] font-heading font-semibold uppercase text-[#D6246E]">
                    {selectedDate === todayInfo.dateStr ? 'Today' : 'Selected Date'}
                  </div>
                  <h2 className="font-heading font-bold text-base sm:text-lg text-[#5B2A86]">
                    {selectedDate} · {selectedDayPosts.length}{' '}
                    {selectedDayPosts.length === 1 ? 'Social' : 'Socials'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={openNewPostForm}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D6246E] hover:bg-[#be1d60] text-white font-heading font-semibold text-xs shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Post
                </button>
              </div>

              {selectedDayPosts.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs sm:text-sm font-medium text-[#222222]/60 mb-3">
                    No social posts scheduled for {selectedDate}.
                  </p>
                  <button
                    type="button"
                    onClick={openNewPostForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5B2A86] text-white font-heading font-semibold text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Upload Post
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayPosts.map((post) => {
                    const meta = PLATFORM_META[post.platform] || {
                      short: 'SO',
                      label: post.platform
                    };
                    const vnCount = Array.isArray(post.voiceNotes)
                      ? post.voiceNotes.length
                      : 0;

                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlatform(post.platform);
                          setIsAddingPost(false);
                          setActiveTab('post-detail');
                        }}
                        className="w-full p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3EDF9] border border-[#EAE3F2] hover:border-[#5B2A86]/40 flex items-center justify-between gap-3 text-left transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-[#5B2A86] text-white font-heading font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {meta.short}
                          </span>
                          <div className="min-w-0">
                            <div className="font-heading font-semibold text-sm text-[#222222] flex items-center gap-2">
                              <span>{post.platform}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#5B2A86] border border-[#E5D8F6] font-medium">
                                {post.postType}
                              </span>
                              {vnCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#FDF2F7] text-[#D6246E] font-semibold">
                                  <Volume2 className="w-2.5 h-2.5" />
                                  {vnCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#222222]/65 truncate mt-0.5">
                              {post.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-heading font-semibold flex items-center gap-1 ${
                              post.approved
                                ? 'bg-[#ECFDF5] text-[#047857]'
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
                          <ChevronRight className="w-4 h-4 text-[#5B2A86]/50 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==================== PAGE 2: DEDICATED SOCIAL POST PREVIEW & REVIEW PAGE ==================== */}
        {activeTab === 'post-detail' && activePost && (
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Top Back Bar + Quick Day Social Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl p-3.5 sm:px-5 border border-[#ECE6F4] shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setIsAddingPost(false);
                  setActiveTab('calendar');
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-[#5B2A86] hover:text-[#D6246E] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{selectedDate}</span>
              </button>

              {selectedDayPosts.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedDayPosts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlatform(p.platform)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                        selectedPlatform === p.platform
                          ? 'bg-[#5B2A86] text-white'
                          : 'bg-[#FAF7F2] text-[#5B2A86] hover:bg-[#EFE4FA]'
                      }`}
                    >
                      {p.platform}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Post Preview Card */}
            <section className="bg-white rounded-3xl p-5 sm:p-7 border border-[#ECE6F4] shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F1ECF8]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-2xl bg-[#5B2A86] text-white font-heading font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                    {PLATFORM_META[activePost.platform]?.short || 'SO'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-heading font-bold text-lg sm:text-xl text-[#5B2A86]">
                        {activePost.platform}
                      </h1>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F6F0FC] text-[#5B2A86] font-heading font-semibold border border-[#DCC8F2]">
                        {activePost.postType}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-heading font-semibold ${
                          activePost.approved
                            ? 'bg-[#ECFDF5] text-[#047857]'
                            : 'bg-[#FFF7ED] text-[#F58220]'
                        }`}
                      >
                        {activePost.approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-[#222222]/60 mt-0.5 truncate">
                      By {activePost.authorName || 'Ikechukwu Paul Ebiringa'}
                    </p>
                  </div>
                </div>

                {/* Special Obvious Edit Icon Button + Delete Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={openEditPostPage}
                    title="Edit Post"
                    aria-label="Edit Post"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D6246E] hover:bg-[#be1d60] text-white font-heading font-semibold text-xs shadow-sm transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeletePost}
                    title="Delete Post"
                    aria-label="Delete Post"
                    className="p-2 rounded-xl bg-[#FAF7F2] text-[#222222]/50 hover:text-[#D6246E] hover:bg-[#FDF2F7] border border-[#E6DFEE] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Headline & Caption */}
              <div className="space-y-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#222222]">
                  {activePost.title}
                </h2>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3F2] text-xs sm:text-sm text-[#222222]/90 whitespace-pre-line leading-relaxed">
                  {activePost.caption}
                </div>
              </div>

              {/* Side-by-Side Concise Buttons: Preview & Post Link (In-App Popup Viewer) */}
              {(activePostMediaItems.length > 0 || activePost.postLink) && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={activePostMediaItems.length === 0}
                    onClick={() =>
                      openMediaModal(
                        activePostMediaItems,
                        0,
                        `${activePost.platform} · ${activePost.title}`
                      )
                    }
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#5B2A86] hover:bg-[#48206B] text-white font-heading font-semibold text-xs shadow-sm transition-all disabled:opacity-40"
                  >
                    {isVideoAsset(activePostMediaItems[0]) ? (
                      <Play className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">
                      Preview
                      {activePostMediaItems.length > 1
                        ? ` (${activePostMediaItems.length})`
                        : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!activePost.postLink}
                    onClick={() =>
                      setLinkPopup({
                        open: true,
                        url: activePost.postLink,
                        title: `${activePost.platform} · ${activePost.title}`
                      })
                    }
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#FDF2F7] text-[#D6246E] border border-[#F8D0E2] font-heading font-semibold text-xs transition-all disabled:opacity-40"
                  >
                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Post Link</span>
                  </button>
                </div>
              )}

              {/* Thumbnail Strip if Multiple Carousel Files Uploaded */}
              {activePostMediaItems.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {activePostMediaItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        openMediaModal(
                          activePostMediaItems,
                          idx,
                          `${activePost.platform} · ${activePost.title}`
                        )
                      }
                      className="group relative h-20 rounded-xl overflow-hidden border border-[#E6DFEE] bg-[#FAF7F2] flex flex-col items-center justify-center p-1.5 text-center hover:border-[#5B2A86] transition-all"
                    >
                      {isImageAsset(item) ? (
                        <img
                          src={item.fileUrl}
                          alt={item.fileName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : isVideoAsset(item) ? (
                        <Play className="w-5 h-5 text-[#5B2A86]" />
                      ) : (
                        <FileText className="w-5 h-5 text-[#5B2A86]" />
                      )}
                      <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-[#222222]/75 text-white text-[9px] font-bold">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Existing Admin Commentary & Voice Notes (Visible to Managers & Admin) */}
              {(activePost.comment ||
                (Array.isArray(activePost.voiceNotes) &&
                  activePost.voiceNotes.length > 0)) && (
                <div className="p-4 rounded-2xl bg-[#F6F0FC] border border-[#DCC8F2] space-y-3">
                  <div className="font-heading font-semibold text-xs text-[#5B2A86] uppercase">
                    Admin Feedback
                  </div>

                  {activePost.comment && (
                    <p className="text-xs sm:text-sm text-[#222222] bg-white p-3 rounded-xl border border-[#ECE6F4]">
                      {activePost.comment}
                    </p>
                  )}

                  {Array.isArray(activePost.voiceNotes) &&
                    activePost.voiceNotes.length > 0 && (
                      <div className="space-y-2">
                        {activePost.voiceNotes.map((vn, i) => (
                          <div
                            key={vn.id || i}
                            className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-[#ECE6F4]"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-7 h-7 rounded-lg bg-[#5B2A86] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                VN {i + 1}
                              </span>
                              <audio
                                src={vn.url}
                                controls
                                preload="metadata"
                                className="h-8 w-full max-w-[240px]"
                              />
                              <span className="text-[10px] text-[#222222]/55 shrink-0 hidden sm:inline">
                                {formatDuration(vn.duration)}
                              </span>
                            </div>

                            {currentUser.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteVoiceNote(vn.id)}
                                title="Delete voice note"
                                className="p-1.5 rounded-lg text-[#222222]/45 hover:text-[#D6246E] hover:bg-[#FDF2F7]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* ADMIN REVIEW PANEL: Approve Toggle + Text Comment + Voice Note Recorder + Send */}
              {currentUser.role === 'admin' && (
                <form
                  onSubmit={handleSendReview}
                  className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DFEE] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm text-[#5B2A86]">
                      Approve Post
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reviewApproved}
                      onClick={() => setReviewApproved((v) => !v)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                        reviewApproved
                          ? 'bg-[#D6246E] justify-end'
                          : 'bg-[#D8CFE3] justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white shadow" />
                    </button>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add short commentary..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E4DDF0] text-xs sm:text-sm focus:outline-none focus:border-[#5B2A86]"
                    />
                  </div>

                  {/* Voice Note Recorder Alternative */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#222222]/75">
                        Voice Notes ({reviewVoiceNotes.length})
                      </span>

                      {!isRecording ? (
                        <button
                          type="button"
                          disabled={uploadingVN}
                          onClick={startVoiceRecording}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5B2A86] hover:bg-[#48206B] text-white font-heading font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>{uploadingVN ? 'Saving...' : 'Record VN'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopVoiceRecording}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D6246E] text-white font-heading font-semibold text-xs animate-pulse shadow-sm"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop ({formatDuration(recordingSeconds)})</span>
                        </button>
                      )}
                    </div>

                    {reviewVoiceNotes.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {reviewVoiceNotes.map((vn, idx) => (
                          <div
                            key={vn.id || idx}
                            className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-[#E4DDF0]"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="px-2 py-0.5 rounded-md bg-[#F6F0FC] text-[#5B2A86] font-heading font-bold text-[10px] shrink-0">
                                VN {idx + 1}
                              </span>
                              <audio
                                src={vn.url}
                                controls
                                preload="metadata"
                                className="h-8 w-full max-w-[210px]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteVoiceNote(vn.id)}
                              title="Delete Voice Note"
                              className="p-1.5 rounded-lg text-[#222222]/45 hover:text-[#D6246E]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={sendingReview || isRecording || uploadingVN}
                    className="w-full py-2.5 rounded-xl bg-[#D6246E] hover:bg-[#be1d60] text-white font-heading font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sendingReview ? 'Sending...' : 'Send'}
                  </button>
                </form>
              )}
            </section>
          </div>
        )}

        {/* ==================== PAGE 3: DEDICATED EDIT / UPLOAD POST PAGE ==================== */}
        {activeTab === 'post-edit' && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-white rounded-2xl p-3.5 sm:px-5 border border-[#ECE6F4] shadow-sm">
              <button
                type="button"
                onClick={() => {
                  if (isAddingPost || !activePost) {
                    setIsAddingPost(false);
                    setActiveTab('calendar');
                  } else {
                    setActiveTab('post-detail');
                  }
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-[#5B2A86] hover:text-[#D6246E]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <span className="text-xs font-heading font-semibold text-[#222222]/60">
                {selectedDate}
              </span>
            </div>

            <section className="bg-white rounded-3xl p-5 sm:p-7 border border-[#ECE6F4] shadow-sm">
              <h2 className="font-heading font-bold text-lg text-[#5B2A86] mb-4">
                {isAddingPost
                  ? `New Post · ${selectedDate}`
                  : `Edit ${activePost?.platform} Post`}
              </h2>

              <form onSubmit={handleSavePost} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#222222]/75 mb-1">
                      Social
                    </label>
                    <select
                      value={
                        isAddingPost
                          ? formPlatform
                          : activePost?.platform || formPlatform
                      }
                      disabled={!isAddingPost}
                      onChange={(e) => setFormPlatform(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-xs sm:text-sm focus:outline-none focus:border-[#5B2A86] disabled:opacity-60"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#222222]/75 mb-1">
                      Kind of Post
                    </label>
                    <select
                      value={formPostType}
                      onChange={(e) => setFormPostType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-xs sm:text-sm focus:outline-none focus:border-[#5B2A86]"
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
                  <label className="block text-xs font-medium text-[#222222]/75 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Post headline..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-xs sm:text-sm focus:outline-none focus:border-[#5B2A86]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#222222]/75 mb-1">
                    Text / Caption
                  </label>
                  <textarea
                    rows={4}
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    placeholder="Write post copy..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-xs sm:text-sm focus:outline-none focus:border-[#5B2A86]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#222222]/75 mb-1">
                    Post Link
                  </label>
                  <input
                    type="url"
                    value={formPostLink}
                    onChange={(e) => setFormPostLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-xs sm:text-sm focus:outline-none focus:border-[#5B2A86]"
                  />
                </div>

                {/* Multi-File Upload to Hugging Face Dataset */}
                <div>
                  <label className="block text-xs font-medium text-[#222222]/75 mb-1">
                    Files (Saved to Hugging Face)
                  </label>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFFA] text-[#5B2A86] border border-dashed border-[#5B2A86]/40 text-xs font-heading font-semibold cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>
                      {uploadingFile
                        ? 'Uploading to Hugging Face...'
                        : 'Upload Image(s), Video, or PDF'}
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>

                  {formFiles.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {formFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E6DFEE] text-xs"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openMediaModal(formFiles, i, formTitle || 'Uploaded Media')
                            }
                            className="flex items-center gap-2 text-[#5B2A86] font-medium truncate hover:underline text-left"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-[#F6F0FC] text-[10px] font-bold">
                              #{i + 1}
                            </span>
                            <span className="truncate">{f.fileName || f.fileUrl}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFormFile(i)}
                            className="text-[#222222]/40 hover:text-[#D6246E] p-1 shrink-0"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAddingPost || !activePost) {
                        setIsAddingPost(false);
                        setActiveTab('calendar');
                      } else {
                        setActiveTab('post-detail');
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E4DDF0] text-xs font-heading font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPost || uploadingFile}
                    className="flex-1 py-3 rounded-xl bg-[#5B2A86] hover:bg-[#49206c] text-white font-heading font-semibold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
                  >
                    {savingPost ? 'Saving...' : 'Save Post'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ==================== PAGE 4: ACCOUNT MANAGERS (ADMIN ONLY) ==================== */}
        {activeTab === 'team' && currentUser.role === 'admin' && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECE6F4] shadow-sm max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F1ECF8]">
              <div>
                <h2 className="font-heading font-bold text-lg sm:text-xl text-[#5B2A86]">
                  Account Managers
                </h2>
                <p className="text-xs text-[#222222]/60">
                  Approve or deactivate manager accounts.
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
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#5B2A86] text-white font-heading font-bold text-sm flex items-center justify-center shrink-0">
                        {manager.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-heading font-semibold text-sm text-[#222222] flex items-center gap-2 flex-wrap">
                          <span className="truncate">{manager.name}</span>
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
                        <div className="text-xs text-[#222222]/60 truncate">
                          {manager.email}
                        </div>
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

        {/* ==================== PAGE 5: PROFILE SETTINGS & CHANGE PASSWORD ==================== */}
        {activeTab === 'settings' && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECE6F4] shadow-sm max-w-xl mx-auto space-y-6">
            <div className="pb-4 border-b border-[#F1ECF8]">
              <h2 className="font-heading font-bold text-lg sm:text-xl text-[#5B2A86]">
                Profile Settings
              </h2>
              <p className="text-xs text-[#222222]/60">
                Manage your account and password.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFEE] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#5B2A86] text-white font-heading font-bold text-lg flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-heading font-bold text-base text-[#222222] truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs text-[#222222]/65 truncate">
                  {currentUser.email}
                </div>
                <span className="inline-block mt-1 text-[10px] font-heading font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#F4EFFA] text-[#5B2A86]">
                  {currentUser.role} · {currentUser.status}
                </span>
              </div>
            </div>

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
      </main>
    </div>
  );
}
