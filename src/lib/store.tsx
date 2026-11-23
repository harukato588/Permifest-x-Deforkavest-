'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  Competition, 
  Registration, 
  RegistrationStatus,
  Submission, 
  JudgeAssignment, 
  Announcement, 
  AuditLog, 
  MatchResult,
  RubricCriteria,
  SystemSettings,
  ScoreChange,
  TimelineEvent,
  Partner,
  Guidebook,
  EventItem,
  DynamicFaqItem,
} from './types';
import { 
  MOCK_REGISTRATIONS, 
  MOCK_SUBMISSIONS, 
  MOCK_JUDGE_ASSIGNMENTS, 
  MOCK_ANNOUNCEMENTS, 
  MOCK_AUDIT_LOGS, 
  MOCK_MATCH_RESULTS,
  MOCK_RUBRIC_CRITERIA,
  MOCK_PARTNERS,
  MOCK_GUIDEBOOKS,
  MOCK_EVENTS,
  MOCK_FAQS,
} from './mock-data';
import { INITIAL_COMPETITIONS } from './constants';
import { getTimelineEvents } from './landing-data';

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  event_name: 'Permifest x Deforkafest 2026',
  registration_open: true,
  maintenance_mode: false,
  bank_name: 'BCA (Bank Central Asia)',
  bank_account_number: '8820 1928 37',
  bank_account_holder: 'Panitia Permifest x Deforkafest',
  qris_nmid: 'ID10293847561',
  qris_image_url: '',
  whatsapp_helpdesk: '0812-3456-7890',
  email_helpdesk: 'helpdesk@permifest.id',
  instagram_permikomnas: 'https://instagram.com/permikomnas.diy',
  instagram_impsi: 'https://instagram.com/impsi_ust',
  venue_name: 'Universitas Sarjanawiyata Tamansiswa (UST)',
  venue_address: 'Jl. Batikan, Tahunan, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55167',
  registration_close_at: '2026-12-11T23:59:59+07:00',
};

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  availableUsers: User[];
  competitions: Competition[];
  registrations: Registration[];
  submissions: Submission[];
  judgeAssignments: JudgeAssignment[];
  rubricCriteria: RubricCriteria[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  matchResults: MatchResult[];
  systemSettings: SystemSettings;
  scoreChanges: ScoreChange[];
  timelineEvents: TimelineEvent[];
  
  // Actions - Pendaftaran & Pembayaran
  registerCompetition: (competitionId: string, formData: Record<string, unknown>) => Promise<Registration>;
  addRegistrationManual: (data: { userId: string; competitionId: string; status: RegistrationStatus; teamName?: string }) => Promise<Registration>;
  updateRegistrationStatus: (registrationId: string, status: RegistrationStatus) => Promise<void>;
  uploadPaymentProof: (registrationId: string, proofUrl: string, proofName: string) => Promise<void>;
  verifyPayment: (registrationId: string, status: 'verified' | 'rejected', reason?: string) => Promise<void>;
  updatePaymentAmount: (registrationId: string, amount: number) => Promise<void>;
  deleteRegistration: (registrationId: string) => Promise<void>;

  // Actions - Karya & Penilaian
  submitWork: (registrationId: string, stageId: string, data: { fileUrl?: string; fileName?: string; linkUrl?: string; notes?: string }) => Promise<void>;
  deleteSubmission: (submissionId: string) => Promise<void>;
  assignJudge: (submissionId: string, judgeId: string) => Promise<void>;
  removeJudgeAssignment: (assignmentId: string) => Promise<void>;
  submitJudgeScore: (assignmentId: string, scores: { criteriaId: string; score: number; comment?: string }[]) => Promise<void>;
  toggleLockSubmissionScore: (submissionId: string, locked: boolean) => Promise<void>;
  overrideScore: (submissionId: string, newScore: number, reason: string) => Promise<void>;

  // Actions - Rubrik Penilaian CRUD
  addRubricCriteria: (criteria: Omit<RubricCriteria, 'id'>) => Promise<RubricCriteria>;
  updateRubricCriteria: (id: string, updates: Partial<RubricCriteria>) => Promise<void>;
  deleteRubricCriteria: (id: string) => Promise<void>;

  // Actions - Kompetisi CRUD
  addCompetition: (comp: Omit<Competition, 'id' | 'registered_count'>) => Promise<Competition>;
  updateCompetition: (id: string, updates: Partial<Competition>) => Promise<void>;
  deleteCompetition: (id: string) => Promise<void>;

  // Actions - Pengguna CRUD
  addUser: (user: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Actions - Pengumuman CRUD
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'published_at'>) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Actions - Hasil E-Sport CRUD
  addMatchResult: (result: Omit<MatchResult, 'id' | 'created_at'>) => Promise<void>;
  updateMatchResult: (id: string, updates: Partial<MatchResult>) => Promise<void>;
  deleteMatchResult: (id: string) => Promise<void>;

  // Actions - Pengaturan Sistem
  updateSystemSettings: (updates: Partial<SystemSettings>) => Promise<void>;

  // Actions - Timeline & Kalender Event CRUD & Auto-detect
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent>;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<void>;
  deleteTimelineEvent: (id: string) => Promise<void>;
  syncTimelineFromCompetitions: () => Promise<{ addedCount: number }>;

  // Actions - Autentikasi
  logout: () => Promise<void>;

  // Actions - Mitra & Sponsor CRUD
  partners: Partner[];
  addPartner: (partner: Omit<Partner, 'id'>) => Promise<Partner>;
  updatePartner: (id: string, updates: Partial<Partner>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  togglePartnerActive: (id: string) => Promise<void>;

  // Actions - Guidebook Online CRUD
  guidebooks: Guidebook[];
  addGuidebook: (data: Omit<Guidebook, 'id' | 'created_at' | 'updated_at'>) => Promise<Guidebook>;
  updateGuidebook: (id: string, updates: Partial<Guidebook>) => Promise<void>;
  deleteGuidebook: (id: string) => Promise<void>;
  toggleGuidebookPublished: (id: string, is_published: boolean) => Promise<void>;

  // Actions - Agenda & Event (Seminar, Webinar, Workshop) CRUD
  events: EventItem[];
  addEvent: (data: Omit<EventItem, 'id' | 'registered_count'>) => Promise<EventItem>;
  updateEvent: (id: string, updates: Partial<EventItem>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventPublished: (id: string, is_published: boolean) => Promise<void>;

  // Actions - Dynamic FAQs
  faqs: DynamicFaqItem[];
  addFaq: (data: Omit<DynamicFaqItem, 'id'>) => Promise<DynamicFaqItem>;
  updateFaq: (id: string, updates: Partial<DynamicFaqItem>) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GUEST_USER: User = {
  id: '',
  email: '',
  full_name: '',
  role: '' as UserRole,
  email_verified: false,
};

function getInitialUser(): User {
  if (typeof window !== 'undefined') {
    try {
      // 1. Prioritaskan cookie demo role yang aktif dari sesi login
      const matchRole = document.cookie.match(/permifest_demo_role=([^;]+)/);
      const matchEmail = document.cookie.match(/permifest_demo_email=([^;]+)/);
      if (matchRole && matchRole[1]) {
        const roleFromCookie = decodeURIComponent(matchRole[1]) as UserRole;
        const emailFromCookie = matchEmail ? decodeURIComponent(matchEmail[1]) : `${roleFromCookie}@permifest.id`;
        const matched = MOCK_USERS.find((u) => u.role === roleFromCookie);
        if (matched) return { ...matched, email: emailFromCookie };
        return {
          id: `user-${roleFromCookie}`,
          email: emailFromCookie,
          full_name: roleFromCookie === 'super_admin' ? 'Administrator Utama' : roleFromCookie.toUpperCase(),
          role: roleFromCookie,
          email_verified: true,
        };
      }

      // 2. Baca dari localStorage
      const saved = localStorage.getItem('permifest_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role) return parsed;
      }
    } catch {
      // Abaikan bila di lingkungan server SSR
    }
  }
  return GUEST_USER;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(getInitialUser);
  const [availableUsers, setAvailableUsers] = useState<User[]>(MOCK_USERS);
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [registrations, setRegistrations] = useState<Registration[]>(MOCK_REGISTRATIONS);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [judgeAssignments, setJudgeAssignments] = useState<JudgeAssignment[]>(MOCK_JUDGE_ASSIGNMENTS);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriteria[]>(MOCK_RUBRIC_CRITERIA);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [matchResults, setMatchResults] = useState<MatchResult[]>(MOCK_MATCH_RESULTS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [scoreChanges, setScoreChanges] = useState<ScoreChange[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() => getTimelineEvents());
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS);
  const [guidebooks, setGuidebooks] = useState<Guidebook[]>(MOCK_GUIDEBOOKS);
  const [events, setEvents] = useState<EventItem[]>(MOCK_EVENTS);
  const [faqs, setFaqs] = useState<DynamicFaqItem[]>(MOCK_FAQS);

  // Simpan setiap kali currentUser berubah
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser && currentUser.role) {
      try {
        localStorage.setItem('permifest_user', JSON.stringify(currentUser));
      } catch {}
    }
  }, [currentUser]);

  // Switch role easily for demo & testing
  const switchRole = (role: UserRole) => {
    const userForRole = availableUsers.find(u => u.role === role) || {
      id: `mock-${role}`,
      email: `${role}@permifest.id`,
      full_name: `Demo ${role.toUpperCase()}`,
      role: role,
      email_verified: true,
    };
    setCurrentUser(userForRole);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('permifest_user', JSON.stringify(userForRole));
      } catch {}
    }
  };

  // Logout menyeluruh: reset state client, panggil API logout server, dan redirect ke /login
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // Abaikan bila offline
    }
    setCurrentUser({
      id: '',
      email: '',
      full_name: '',
      role: '' as UserRole,
      email_verified: false,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('permifest_user');
      document.cookie = 'permifest_demo_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'permifest_demo_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  const logAudit = (action: string, entity_type: string, entity_id: string, details: Record<string, unknown>) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user_email: currentUser.email,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- CRUD Pendaftaran & Pembayaran ---
  const registerCompetition = async (competitionId: string, formData: Record<string, unknown>): Promise<Registration> => {
    const comp = competitions.find(c => c.id === competitionId);
    if (!comp) throw new Error('Kompetisi tidak ditemukan');

    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      user_id: currentUser.id,
      competition_id: competitionId,
      competition: comp,
      user: currentUser,
      form_data: formData,
      status: comp.registration_fee > 0 ? 'payment_pending' : 'verified',
      registered_at: new Date().toISOString(),
      payment: comp.registration_fee > 0 ? {
        id: `pay-${Date.now()}`,
        registration_id: `reg-${Date.now()}`,
        amount: comp.registration_fee,
        status: 'pending',
      } : undefined,
    };

    setRegistrations(prev => [newReg, ...prev]);
    setCompetitions(prev => prev.map(c => c.id === competitionId ? { ...c, registered_count: c.registered_count + 1 } : c));
    logAudit('REGISTER_COMPETITION', 'registration', newReg.id, { competition: comp.name });
    return newReg;
  };

  const addRegistrationManual = async (data: { userId: string; competitionId: string; status: RegistrationStatus; teamName?: string }): Promise<Registration> => {
    const comp = competitions.find(c => c.id === data.competitionId);
    const user = availableUsers.find(u => u.id === data.userId);
    if (!comp || !user) throw new Error('Kompetisi atau Pengguna tidak ditemukan');

    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      user_id: data.userId,
      competition_id: data.competitionId,
      competition: comp,
      user: user,
      form_data: { full_name: user.full_name, institution: user.institution },
      status: data.status,
      registered_at: new Date().toISOString(),
      team: data.teamName ? {
        id: `team-${Date.now()}`,
        competition_id: data.competitionId,
        name: data.teamName,
        captain_id: user.id,
        invite_code: `INV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        members: [{ id: `tm-1`, team_id: `team-${Date.now()}`, user_id: user.id, role: 'captain', joined_at: new Date().toISOString() }],
      } : undefined,
      payment: comp.registration_fee > 0 ? {
        id: `pay-${Date.now()}`,
        registration_id: `reg-${Date.now()}`,
        amount: comp.registration_fee,
        status: data.status === 'verified' ? 'verified' : 'pending',
      } : undefined,
    };

    setRegistrations(prev => [newReg, ...prev]);
    setCompetitions(prev => prev.map(c => c.id === data.competitionId ? { ...c, registered_count: c.registered_count + 1 } : c));
    logAudit('ADD_REGISTRATION_MANUAL', 'registration', newReg.id, { user: user.full_name, competition: comp.name });
    return newReg;
  };

  const updateRegistrationStatus = async (registrationId: string, status: RegistrationStatus) => {
    setRegistrations(prev => prev.map(r => r.id === registrationId ? { ...r, status } : r));
    logAudit('UPDATE_REGISTRATION_STATUS', 'registration', registrationId, { status });
  };

  const uploadPaymentProof = async (registrationId: string, proofUrl: string, proofName: string) => {
    setRegistrations(prev => prev.map(reg => {
      if (reg.id === registrationId) {
        return {
          ...reg,
          payment: {
            id: reg.payment?.id || `pay-${Date.now()}`,
            registration_id: registrationId,
            amount: reg.payment?.amount || reg.competition?.registration_fee || 0,
            proof_url: proofUrl,
            proof_name: proofName,
            status: 'uploaded',
            uploaded_at: new Date().toISOString(),
          }
        };
      }
      return reg;
    }));
    logAudit('UPLOAD_PAYMENT_PROOF', 'payment', registrationId, { proofName });
  };

  const verifyPayment = async (registrationId: string, status: 'verified' | 'rejected', reason?: string) => {
    setRegistrations(prev => prev.map(reg => {
      if (reg.id === registrationId && reg.payment) {
        return {
          ...reg,
          status: status === 'verified' ? 'verified' : 'rejected',
          payment: {
            ...reg.payment,
            status: status,
            verified_by: currentUser.id,
            verified_at: new Date().toISOString(),
            rejection_reason: reason,
          }
        };
      }
      return reg;
    }));
    logAudit('VERIFY_PAYMENT', 'payment', registrationId, { status, reason });
  };

  const updatePaymentAmount = async (registrationId: string, amount: number) => {
    setRegistrations(prev => prev.map(reg => {
      if (reg.id === registrationId && reg.payment) {
        return {
          ...reg,
          payment: {
            ...reg.payment,
            amount,
          }
        };
      }
      return reg;
    }));
    logAudit('UPDATE_PAYMENT_AMOUNT', 'payment', registrationId, { amount });
  };

  const deleteRegistration = async (registrationId: string) => {
    setRegistrations(prev => prev.filter(r => r.id !== registrationId));
    logAudit('DELETE_REGISTRATION', 'registration', registrationId, {});
  };

  // --- Submission & Juri ---
  const submitWork = async (
    registrationId: string, 
    stageId: string, 
    data: { fileUrl?: string; fileName?: string; linkUrl?: string; notes?: string }
  ) => {
    const reg = registrations.find(r => r.id === registrationId);
    const existingIndex = submissions.findIndex(s => s.registration_id === registrationId && s.stage_id === stageId);
    const version = existingIndex >= 0 ? submissions[existingIndex].version + 1 : 1;

    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      registration_id: registrationId,
      stage_id: stageId,
      registration: reg,
      file_url: data.fileUrl,
      file_name: data.fileName,
      link_url: data.linkUrl,
      notes: data.notes,
      version: version,
      is_latest: true,
      submitted_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      setSubmissions(prev => {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], is_latest: false };
        return [newSub, ...copy];
      });
    } else {
      setSubmissions(prev => [newSub, ...prev]);
    }

    logAudit('SUBMIT_WORK', 'submission', newSub.id, { version, fileName: data.fileName || data.linkUrl });
  };

  const deleteSubmission = async (submissionId: string) => {
    setSubmissions(prev => prev.filter(s => s.id !== submissionId));
    logAudit('DELETE_SUBMISSION', 'submission', submissionId, {});
  };

  const assignJudge = async (submissionId: string, judgeId: string) => {
    const judge = availableUsers.find(u => u.id === judgeId);
    const sub = submissions.find(s => s.id === submissionId);
    const newAssignment: JudgeAssignment = {
      id: `assign-${Date.now()}`,
      judge_id: judgeId,
      submission_id: submissionId,
      judge,
      submission: sub,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    };
    setJudgeAssignments(prev => [newAssignment, ...prev]);
    logAudit('ASSIGN_JUDGE', 'judge_assignment', newAssignment.id, { judgeName: judge?.full_name });
  };

  const removeJudgeAssignment = async (assignmentId: string) => {
    setJudgeAssignments(prev => prev.filter(a => a.id !== assignmentId));
    logAudit('REMOVE_JUDGE_ASSIGNMENT', 'judge_assignment', assignmentId, {});
  };

  const submitJudgeScore = async (
    assignmentId: string, 
    scoresInput: { criteriaId: string; score: number; comment?: string }[]
  ) => {
    let totalWeighted = 0;
    scoresInput.forEach(s => {
      const crit = rubricCriteria.find(c => c.id === s.criteriaId);
      const weight = crit?.weight || 0.25;
      totalWeighted += s.score * weight;
    });

    setJudgeAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          status: 'completed',
          completed_at: new Date().toISOString(),
          scores: scoresInput.map((s, idx) => ({
            id: `score-${Date.now()}-${idx}`,
            judge_assignment_id: assignmentId,
            rubric_criteria_id: s.criteriaId,
            rubric_criteria: rubricCriteria.find(c => c.id === s.criteriaId),
            score: s.score,
            comment: s.comment,
            is_locked: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        };
      }
      return a;
    }));

    const targetAssign = judgeAssignments.find(a => a.id === assignmentId);
    if (targetAssign) {
      setSubmissions(prev => prev.map(s => {
        if (s.id === targetAssign.submission_id) {
          return { ...s, final_score: Math.round(totalWeighted * 10) / 10 };
        }
        return s;
      }));
    }

    logAudit('SUBMIT_JUDGE_SCORE', 'score', assignmentId, { totalWeighted });
  };

  const toggleLockSubmissionScore = async (submissionId: string, locked: boolean) => {
    setJudgeAssignments(prev => prev.map(a => {
      if (a.submission_id === submissionId && a.scores) {
        return {
          ...a,
          scores: a.scores.map(s => ({ ...s, is_locked: locked }))
        };
      }
      return a;
    }));
    logAudit('TOGGLE_LOCK_SCORE', 'submission', submissionId, { locked });
  };

  // --- Break-glass emergency score override ---
  const overrideScore = async (submissionId: string, newScore: number, reason: string) => {
    const targetSub = submissions.find(s => s.id === submissionId);
    const oldScore = targetSub?.final_score || 0;

    const changeEntry: ScoreChange = {
      id: `sc-${Date.now()}`,
      submission_id: submissionId,
      old_score: oldScore,
      new_score: newScore,
      reason,
      changed_by: currentUser.email,
      created_at: new Date().toISOString(),
    };

    setScoreChanges(prev => [changeEntry, ...prev]);

    setSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        return { ...s, final_score: newScore };
      }
      return s;
    }));

    logAudit('EMERGENCY_SCORE_OVERRIDE', 'submission', submissionId, {
      oldScore,
      newScore,
      reason,
      authorised_by: currentUser.email,
    });
  };

  // --- CRUD Rubrik Penilaian ---
  const addRubricCriteria = async (criteria: Omit<RubricCriteria, 'id'>): Promise<RubricCriteria> => {
    const newCrit: RubricCriteria = {
      ...criteria,
      id: `crit-${Date.now()}`,
    };
    setRubricCriteria(prev => [...prev, newCrit]);
    logAudit('CREATE_RUBRIC_CRITERIA', 'rubric_criteria', newCrit.id, { name: newCrit.name, weight: newCrit.weight });
    return newCrit;
  };

  const updateRubricCriteria = async (id: string, updates: Partial<RubricCriteria>) => {
    setRubricCriteria(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logAudit('UPDATE_RUBRIC_CRITERIA', 'rubric_criteria', id, updates as Record<string, unknown>);
  };

  const deleteRubricCriteria = async (id: string) => {
    const crit = rubricCriteria.find(c => c.id === id);
    setRubricCriteria(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_RUBRIC_CRITERIA', 'rubric_criteria', id, { name: crit?.name });
  };

  // --- CRUD Kompetisi ---
  const addCompetition = async (compData: Omit<Competition, 'id' | 'registered_count'>): Promise<Competition> => {
    const newComp: Competition = {
      ...compData,
      id: `comp-${Date.now()}`,
      registered_count: 0,
    };
    setCompetitions(prev => [...prev, newComp]);
    logAudit('CREATE_COMPETITION', 'competition', newComp.id, { name: newComp.name });
    return newComp;
  };

  const updateCompetition = async (id: string, updates: Partial<Competition>) => {
    setCompetitions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logAudit('UPDATE_COMPETITION', 'competition', id, updates as Record<string, unknown>);
  };

  const deleteCompetition = async (id: string) => {
    const comp = competitions.find(c => c.id === id);
    setCompetitions(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_COMPETITION', 'competition', id, { name: comp?.name });
  };

  // --- CRUD Pengguna ---
  const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setAvailableUsers(prev => [newUser, ...prev]);
    logAudit('CREATE_USER', 'user', newUser.id, { email: newUser.email, role: newUser.role });
    return newUser;
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setAvailableUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    logAudit('UPDATE_USER', 'user', id, updates as Record<string, unknown>);
  };

  const deleteUser = async (id: string) => {
    const user = availableUsers.find(u => u.id === id);
    setAvailableUsers(prev => prev.filter(u => u.id !== id));
    logAudit('DELETE_USER', 'user', id, { email: user?.email, name: user?.full_name });
  };

  // --- CRUD Pengumuman ---
  const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'published_at'>) => {
    const newAnn: Announcement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      published_at: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    logAudit('CREATE_ANNOUNCEMENT', 'announcement', newAnn.id, { title: announcement.title });
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    logAudit('UPDATE_ANNOUNCEMENT', 'announcement', id, updates as Record<string, unknown>);
  };

  const deleteAnnouncement = async (id: string) => {
    const ann = announcements.find(a => a.id === id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    logAudit('DELETE_ANNOUNCEMENT', 'announcement', id, { title: ann?.title });
  };

  // --- CRUD Hasil E-Sport ---
  const addMatchResult = async (result: Omit<MatchResult, 'id' | 'created_at'>) => {
    const newResult: MatchResult = {
      ...result,
      id: `match-${Date.now()}`,
      created_at: new Date().toISOString(),
      input_by: currentUser.id,
    };
    setMatchResults(prev => [newResult, ...prev]);
    logAudit('INPUT_MATCH_RESULT', 'match_result', newResult.id, { participant: result.participant_name, position: result.position });
  };

  const updateMatchResult = async (id: string, updates: Partial<MatchResult>) => {
    setMatchResults(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    logAudit('UPDATE_MATCH_RESULT', 'match_result', id, updates as Record<string, unknown>);
  };

  const deleteMatchResult = async (id: string) => {
    const match = matchResults.find(m => m.id === id);
    setMatchResults(prev => prev.filter(m => m.id !== id));
    logAudit('DELETE_MATCH_RESULT', 'match_result', id, { participant: match?.participant_name });
  };

  // --- Pengaturan Sistem ---
  const updateSystemSettings = async (updates: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...updates }));
    logAudit('UPDATE_SYSTEM_SETTINGS', 'system_settings', 'global', updates as Record<string, unknown>);
  };

  // --- Timeline & Kalender Actions ---
  const addTimelineEvent = async (eventData: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> => {
    const newEvent: TimelineEvent = {
      ...eventData,
      id: `tl-${Date.now()}`,
    };
    setTimelineEvents(prev => [...prev, newEvent].sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai)));
    logAudit('CREATE_TIMELINE_EVENT', 'timeline', newEvent.id, { judul: newEvent.judul, tanggal: newEvent.tanggal_mulai });
    return newEvent;
  };

  const updateTimelineEvent = async (id: string, updates: Partial<TimelineEvent>) => {
    setTimelineEvents(prev => prev.map(ev => (ev.id === id ? { ...ev, ...updates } : ev)).sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai)));
    logAudit('UPDATE_TIMELINE_EVENT', 'timeline', id, updates as Record<string, unknown>);
  };

  const deleteTimelineEvent = async (id: string) => {
    setTimelineEvents(prev => prev.filter(ev => ev.id !== id));
    logAudit('DELETE_TIMELINE_EVENT', 'timeline', id, {});
  };

  const syncTimelineFromCompetitions = async (): Promise<{ addedCount: number }> => {
    let count = 0;
    const newItems: TimelineEvent[] = [];

    competitions.forEach((comp) => {
      // 1. Pendaftaran Buka
      if (comp.registration_open_at) {
        const dateStr = comp.registration_open_at.split('T')[0];
        const title = `Buka Pendaftaran: ${comp.name}`;
        const exists = timelineEvents.some(
          (e) => e.tanggal_mulai === dateStr && e.cabang_id === comp.id && e.jenis === 'daftar' && e.judul.includes('Buka')
        );
        if (!exists) {
          count++;
          newItems.push({
            id: `tl-auto-${comp.id}-open`,
            judul: title,
            deskripsi: `Pembukaan pendaftaran untuk cabang lomba ${comp.name} (${comp.type === 'academic' ? 'Akademik' : 'E-Sport'}).`,
            tanggal_mulai: dateStr,
            jam: '00:00 WIB',
            jenis: 'daftar',
            cabang_id: comp.id,
            cabang_nama: comp.name,
            lokasi: 'Online Platform',
          });
        }
      }

      // 2. Pendaftaran Tutup
      if (comp.registration_close_at) {
        const dateStr = comp.registration_close_at.split('T')[0];
        const title = `Tutup Pendaftaran & Pembayaran: ${comp.name}`;
        const exists = timelineEvents.some(
          (e) => e.tanggal_mulai === dateStr && e.cabang_id === comp.id && e.jenis === 'daftar' && e.is_deadline
        );
        if (!exists) {
          count++;
          newItems.push({
            id: `tl-auto-${comp.id}-close`,
            judul: title,
            deskripsi: `Batas akhir pendaftaran dan verifikasi bukti pembayaran QRIS untuk lomba ${comp.name}.`,
            tanggal_mulai: dateStr,
            jam: '23:59 WIB',
            jenis: 'daftar',
            cabang_id: comp.id,
            cabang_nama: comp.name,
            lokasi: 'Online Platform',
            is_deadline: true,
          });
        }
      }

      // 3. Stages / Babak Penyisihan & Final
      if (comp.stages && comp.stages.length > 0) {
        comp.stages.forEach((stage) => {
          if (stage.submission_close_at) {
            const dateStr = stage.submission_close_at.split('T')[0];
            const isFinal = stage.name.toLowerCase().includes('final');
            const title = isFinal 
              ? `Babak Final & Presentasi: ${comp.name}` 
              : `Batas Pengumpulan Berkas: ${comp.name} (${stage.name})`;
            const exists = timelineEvents.some(
              (e) => e.tanggal_mulai === dateStr && e.cabang_id === comp.id && e.judul.includes(stage.name)
            );
            if (!exists) {
              count++;
              newItems.push({
                id: `tl-auto-${comp.id}-${stage.id}`,
                judul: title,
                deskripsi: `Jadwal pelaksanaan tahapan ${stage.name} untuk peserta lomba ${comp.name}.`,
                tanggal_mulai: dateStr,
                jam: isFinal ? '09:00 WIB' : '23:59 WIB',
                jenis: isFinal ? 'final' : 'penyisihan',
                cabang_id: comp.id,
                cabang_nama: comp.name,
                lokasi: isFinal ? 'Kampus UST Yogyakarta' : 'Online Platform',
                is_deadline: !isFinal,
              });
            }
          }
        });
      }
    });

    // 4. Pertandingan E-Sport dari matchResults bila ada
    matchResults.forEach((match) => {
      if (match.created_at) {
        const dateStr = match.created_at.split('T')[0];
        const comp = competitions.find(c => c.id === match.competition_id);
        const title = `Laga Pertandingan: ${comp?.name || 'E-Sport'} (${match.participant_name})`;
        const exists = timelineEvents.some(
          (e) => e.tanggal_mulai === dateStr && e.judul === title
        );
        if (!exists) {
          count++;
          newItems.push({
            id: `tl-auto-match-${match.id}`,
            judul: title,
            deskripsi: `Jadwal pertandingan turnamen untuk ${match.participant_name}. Catatan: ${match.notes || 'Sistem gugur (Single Elimination)'}`,
            tanggal_mulai: dateStr,
            jam: '13:00 WIB',
            jenis: 'penyisihan',
            cabang_id: match.competition_id,
            cabang_nama: comp?.name,
            lokasi: 'Online Room / Arena',
          });
        }
      }
    });

    if (newItems.length > 0) {
      setTimelineEvents(prev => [...prev, ...newItems].sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai)));
      logAudit('SYNC_TIMELINE', 'timeline', 'competitions', { count: newItems.length });
    }

    return { addedCount: count };
  };

  // ─── CRUD Mitra & Sponsor ─────────────────────────────────────────────
  const addPartner = async (p: Omit<Partner, 'id'>): Promise<Partner> => {
    const newPartner: Partner = {
      ...p,
      id: `partner-${Date.now()}`,
    };
    setPartners(prev => [...prev, newPartner]);
    logAudit('ADD_PARTNER', 'partner', newPartner.id, { name: p.name, category: p.category });
    return newPartner;
  };

  const updatePartner = async (id: string, updates: Partial<Partner>): Promise<void> => {
    setPartners(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    logAudit('UPDATE_PARTNER', 'partner', id, updates);
  };

  const deletePartner = async (id: string): Promise<void> => {
    setPartners(prev => prev.filter(p => p.id !== id));
    logAudit('DELETE_PARTNER', 'partner', id, { id });
  };

  const togglePartnerActive = async (id: string): Promise<void> => {
    setPartners(prev => prev.map(p => (p.id === id ? { ...p, is_active: !p.is_active } : p)));
    logAudit('TOGGLE_PARTNER_ACTIVE', 'partner', id, {});
  };

  const addGuidebook = async (data: Omit<Guidebook, 'id' | 'created_at' | 'updated_at'>): Promise<Guidebook> => {
    const newGuidebook: Guidebook = {
      ...data,
      id: `guidebook-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setGuidebooks(prev => [newGuidebook, ...prev]);
    logAudit('CREATE_GUIDEBOOK', 'guidebook', newGuidebook.id, { title: newGuidebook.title, category: newGuidebook.category });
    return newGuidebook;
  };

  const updateGuidebook = async (id: string, updates: Partial<Guidebook>): Promise<void> => {
    setGuidebooks(prev =>
      prev.map(g => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g))
    );
    logAudit('UPDATE_GUIDEBOOK', 'guidebook', id, updates);
  };

  const deleteGuidebook = async (id: string): Promise<void> => {
    setGuidebooks(prev => prev.filter(g => g.id !== id));
    logAudit('DELETE_GUIDEBOOK', 'guidebook', id, { id });
  };

  const toggleGuidebookPublished = async (id: string, is_published: boolean): Promise<void> => {
    await updateGuidebook(id, { is_published });
    logAudit('TOGGLE_GUIDEBOOK_PUBLISHED', 'guidebook', id, { is_published });
  };

  // ── Events / Agenda CRUD ──
  const addEvent = async (data: Omit<EventItem, 'id' | 'registered_count'>): Promise<EventItem> => {
    const newEvent: EventItem = {
      ...data,
      id: `event-${Date.now()}`,
      registered_count: 0,
    };
    setEvents(prev => [...prev, newEvent]);
    logAudit('CREATE_EVENT', 'event', newEvent.id, { title: newEvent.title, type: newEvent.type });
    return newEvent;
  };

  const updateEvent = async (id: string, updates: Partial<EventItem>): Promise<void> => {
    setEvents(prev => prev.map(ev => (ev.id === id ? { ...ev, ...updates } : ev)));
    logAudit('UPDATE_EVENT', 'event', id, updates);
  };

  const deleteEvent = async (id: string): Promise<void> => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
    logAudit('DELETE_EVENT', 'event', id, { id });
  };

  const toggleEventPublished = async (id: string, is_published: boolean): Promise<void> => {
    await updateEvent(id, { is_published });
    logAudit('TOGGLE_EVENT_PUBLISHED', 'event', id, { is_published });
  };

  // ── Dynamic FAQs CRUD ──
  const addFaq = async (data: Omit<DynamicFaqItem, 'id'>): Promise<DynamicFaqItem> => {
    const newFaq: DynamicFaqItem = {
      ...data,
      id: `faq-${Date.now()}`,
    };
    setFaqs(prev => [...prev, newFaq]);
    logAudit('CREATE_FAQ', 'faq', newFaq.id, { question: newFaq.question });
    return newFaq;
  };

  const updateFaq = async (id: string, updates: Partial<DynamicFaqItem>): Promise<void> => {
    setFaqs(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    logAudit('UPDATE_FAQ', 'faq', id, updates);
  };

  const deleteFaq = async (id: string): Promise<void> => {
    setFaqs(prev => prev.filter(f => f.id !== id));
    logAudit('DELETE_FAQ', 'faq', id, { id });
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      switchRole,
      availableUsers,
      competitions,
      registrations,
      submissions,
      judgeAssignments,
      rubricCriteria,
      announcements,
      auditLogs,
      matchResults,
      systemSettings,
      scoreChanges,
      registerCompetition,
      addRegistrationManual,
      updateRegistrationStatus,
      uploadPaymentProof,
      verifyPayment,
      updatePaymentAmount,
      deleteRegistration,
      submitWork,
      deleteSubmission,
      assignJudge,
      removeJudgeAssignment,
      submitJudgeScore,
      toggleLockSubmissionScore,
      overrideScore,
      addRubricCriteria,
      updateRubricCriteria,
      deleteRubricCriteria,
      addCompetition,
      updateCompetition,
      deleteCompetition,
      addUser,
      updateUser,
      deleteUser,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      addMatchResult,
      updateMatchResult,
      deleteMatchResult,
      updateSystemSettings,
      timelineEvents,
      addTimelineEvent,
      updateTimelineEvent,
      deleteTimelineEvent,
      syncTimelineFromCompetitions,
      partners,
      addPartner,
      updatePartner,
      deletePartner,
      togglePartnerActive,
      guidebooks,
      addGuidebook,
      updateGuidebook,
      deleteGuidebook,
      toggleGuidebookPublished,
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      toggleEventPublished,
      faqs,
      addFaq,
      updateFaq,
      deleteFaq,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
