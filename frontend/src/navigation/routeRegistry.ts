import type { NavigationScreen } from '../storage/sessionStorage';

export interface RouteRegistryItem {
  id: NavigationScreen;
  title: string;
  path: string;
  group: string;
  description: string;
  keywords: string[];
}

export const ROUTE_REGISTRY: RouteRegistryItem[] = [
  {
    id: 'dashboard',
    title: 'Student Dashboard',
    path: '/dashboard',
    group: 'B. DAILY HUB',
    description: 'Central overview of your wellbeing rhythm, motorcycle analog stress meter, quick habits, and goals.',
    keywords: ['dashboard', 'home', 'main', 'overview', 'vitality', 'speedometer', 'meter', 'start']
  },
  {
    id: 'wellbeing',
    title: 'Wellbeing Rhythm & Trends',
    path: '/wellbeing',
    group: 'B. DAILY HUB',
    description: 'Detailed analytics, primary analog stress meter hero dial, sleep recovery, and academic load pacing.',
    keywords: ['wellbeing', 'rhythm', 'trends', 'sleep recovery', 'academic load', 'friction', 'hero gauge', 'speedometer dial']
  },
  {
    id: 'daily_checkin',
    title: 'Daily Check-in',
    path: '/daily-checkin',
    group: 'B. DAILY HUB',
    description: 'Quick morning or evening reflection on your daily energy, study pressure, and emotional pacing.',
    keywords: ['daily checkin', 'check in', 'checkin', 'daily mood', 'energy level', 'morning check', 'daily reflection']
  },
  {
    id: 'goals',
    title: 'Personal Goals',
    path: '/goals',
    group: 'B. DAILY HUB',
    description: 'Create and track collegiate habits, study time management, and sleep restoration targets.',
    keywords: ['goals', 'my goals', 'targets', 'habits', 'personal goals', 'tasks', 'habit tracker', 'objectives']
  },
  {
    id: 'assessment',
    title: 'Wellbeing Assessment',
    path: '/assessment',
    group: 'A. ONBOARDING & ASSESSMENT',
    description: '10-factor collegiate lifestyle and academic friction survey (non-diagnostic observation).',
    keywords: ['assessment', 'survey', 'test', 'questionnaire', 'lifestyle survey', 'take assessment', 'calibrate']
  },
  {
    id: 'assessment_history',
    title: 'Assessment History',
    path: '/assessment-history',
    group: 'C. MY PERSONAL SPACE',
    description: 'Review your past assessment logs, trend progress, and historical wellbeing reflections.',
    keywords: ['previous assessments', 'assessment history', 'past assessments', 'past surveys', 'check my previous assessments', 'history', 'records', 'past results']
  },
  {
    id: 'personal_journal',
    title: 'Personal Journal',
    path: '/journal',
    group: 'C. MY PERSONAL SPACE',
    description: 'Client-side encrypted private notebook where you can freely express your feelings, reflections, and thoughts.',
    keywords: ['personal journal', 'journal', 'diary', 'write about my feelings', 'write', 'feelings', 'thoughts', 'private notes', 'reflection']
  },
  {
    id: 'activity_history',
    title: 'Activity History',
    path: '/activity-history',
    group: 'C. MY PERSONAL SPACE',
    description: 'Unified timeline and audit trail of your completed breathing cycles, grounding sessions, and study timers.',
    keywords: ['activity history', 'timeline', 'activities', 'practice history', 'completed sessions']
  },
  {
    id: 'wellness_studio',
    title: 'Wellness Studio',
    path: '/wellness-studio',
    group: 'D. WELLNESS STUDIO',
    description: 'Interactive calming space with guided breathing, 25-minute Pomodoro focus timer, and muscle relaxation.',
    keywords: ['wellness studio', 'studio', 'relaxation center', 'calm space']
  },
  {
    id: 'breathing',
    title: 'Breathing Exercises',
    path: '/breathing',
    group: 'D. WELLNESS STUDIO',
    description: 'Soothing box breathing and diaphragmatic pacing without forced breath-holding.',
    keywords: ['breathing', 'breathing exercise', 'start a breathing exercise', 'box breathing', 'breathe', 'calm down', 'deep breath', 'nervous', 'panic']
  },
  {
    id: 'focus_timer',
    title: 'Focus & Break Timer',
    path: '/focus-timer',
    group: 'D. WELLNESS STUDIO',
    description: '25-minute Pomodoro study focus timer with wall-clock drift protection.',
    keywords: ['focus timer', 'pomodoro', 'study timer', 'timer', 'clock', 'study session', 'chunking']
  },
  {
    id: 'muscle_relaxation',
    title: 'Muscle Relaxation & Grounding',
    path: '/muscle-relaxation',
    group: 'D. WELLNESS STUDIO',
    description: 'Progressive tension-release and 5-4-3-2-1 sensory grounding exercise.',
    keywords: ['muscle relaxation', 'grounding', 'sensory grounding', '54321', 'progressive muscle', 'physical tension']
  },
  {
    id: 'ambient_music',
    title: 'Ambient Music',
    path: '/ambient-music',
    group: 'D. WELLNESS STUDIO',
    description: 'Six curated instrumental soundscapes with continuous background playback across navigation.',
    keywords: ['music', 'ambient music', 'songs', 'relaxing music', 'audio', 'soundscapes', 'listen to music', 'tracks']
  },
  {
    id: 'mini_games',
    title: 'Mindora Mini Games',
    path: '/mini-games',
    group: 'D. WELLNESS STUDIO',
    description: 'Five-minute gentle stress-relief mini games (Snake & Block Puzzle) with automatic session timer.',
    keywords: ['games', 'mini games', 'play games', 'snake', 'block puzzle', 'arcade', '5 minute game']
  },
  {
    id: 'ai_feelings_space',
    title: 'AI Feelings Space',
    path: '/ai-feelings-space',
    group: 'E. AI SUPPORT',
    description: 'Voice-based interactive AI listener space to speak freely, express academic stress, and be heard without judgment.',
    keywords: ['feelings space', 'ai feelings space', 'voice', 'speak', 'talk with ai', 'voice assistant', 'microphone', 'voice chat', 'express feelings out loud']
  },
  {
    id: 'ai_recommendations',
    title: 'AI Recommendations',
    path: '/ai-recommendations',
    group: 'E. AI SUPPORT',
    description: 'Personalized non-clinical lifestyle habits and actionable recommendations adapted to your study rhythm.',
    keywords: ['recommendations', 'ai recommendations', 'suggested tasks', 'advice', 'study tips']
  },
  {
    id: 'learning_hub',
    title: 'Wellness Learning Hub',
    path: '/learning-hub',
    group: 'E. AI SUPPORT',
    description: 'Educational articles on collegiate sleep hygiene, exam pacing, and cognitive stamina.',
    keywords: ['learning hub', 'articles', 'learn', 'education', 'guides', 'readings', 'sleep science']
  },
  {
    id: 'profile',
    title: 'Student Profile',
    path: '/profile',
    group: 'F. ACCOUNT & SUPPORT',
    description: 'Manage personal details, university affiliation, department, and custom avatar.',
    keywords: ['profile', 'my profile', 'account', 'student details', 'name', 'avatar', 'edit profile']
  },
  {
    id: 'guardian_info',
    title: 'Guardian Information & Settings',
    path: '/guardian-info',
    group: 'F. ACCOUNT & SUPPORT',
    description: 'Manage trusted parent/guardian name, verified email address, phone, and alert preferences.',
    keywords: ['guardian', 'parent', 'guardian email', 'update guardian email', 'update my guardian email', 'parent email', 'guardian settings', 'parent contact', 'emergency contact']
  },
  {
    id: 'email_notifications',
    title: 'Guardian Email Notifications',
    path: '/email-notifications',
    group: 'F. ACCOUNT & SUPPORT',
    description: 'Configure explicit student opt-in consent and review status for automated 70 and 90 threshold alerts.',
    keywords: ['email notifications', 'parent alerts', 'guardian alerts', 'threshold alerts', 'notifications', 'email consent', '70 alert', '90 alert']
  },
  {
    id: 'notification_history',
    title: 'Notification History',
    path: '/notification-history',
    group: 'F. ACCOUNT & SUPPORT',
    description: 'Audit log of dispatched guardian emails, verified timestamps, and diagnostic statuses.',
    keywords: ['notification history', 'email history', 'alert logs', 'sent emails', 'notification logs']
  },
  {
    id: 'privacy_security',
    title: 'Privacy & Security Center',
    path: '/privacy-security',
    group: 'F. ACCOUNT & SUPPORT',
    description: 'Review Category A sensitive data boundaries, export client-side records, or erase data.',
    keywords: ['privacy', 'security', 'data center', 'export data', 'erase data', 'delete account']
  },
  {
    id: 'help_support',
    title: 'Emergency Crisis Support & Helplines',
    path: '/help-support',
    group: 'F. ACCOUNT & SUPPORT',
    description: '24/7 verified crisis resources including Tele-MANAS (14416), KIRAN (1800-599-0019), and campus helplines.',
    keywords: ['help', 'support', 'crisis', 'emergency', 'helpline', 'tele-manas', 'kiran', 'suicide', 'immediate help', 'sos']
  }
];

/**
 * Searches the route registry using normalized token & keyword matching,
 * natural language intent matching, and fuzzy keyword scoring.
 * Returns the matching RouteRegistryItem or null if no confident route match is found.
 */
export function findMatchingRoute(query: string): RouteRegistryItem | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // 1. Direct title or id exact match
  for (const item of ROUTE_REGISTRY) {
    if (q === item.id.toLowerCase() || q === item.title.toLowerCase()) {
      return item;
    }
  }

  // 2. High-priority natural language intent mappings
  // Journal / Private Writing
  if (
    q.includes('write something privately') ||
    q.includes('write privately') ||
    q.includes('write about my feelings') ||
    q.includes('write feelings') ||
    q.includes('private notes') ||
    q.includes('journal') ||
    q.includes('diary') ||
    (q.includes('write') && (q.includes('private') || q.includes('feelings') || q.includes('thoughts')))
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'personal_journal') || null;
  }

  // Assessment History / Old Assessments
  if (
    q.includes('old assessments') ||
    q.includes('previous assessments') ||
    q.includes('past assessments') ||
    q.includes('check my assessments') ||
    q.includes('my old assessments') ||
    q.includes('past surveys') ||
    q.includes('assessment history') ||
    q.includes('past results')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'assessment_history') || null;
  }

  // Goals / Habit targets
  if (
    q.includes('take me to my goals') ||
    q.includes('my goals') ||
    q.includes('to my goals') ||
    q.includes('personal goals') ||
    q.includes('habit targets') ||
    q.includes('targets') ||
    (q.includes('goal') && (q.includes('set') || q.includes('track') || q.includes('view') || q.includes('open')))
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'goals') || null;
  }

  // Relaxation / Unwinding
  if (
    q.includes('i want to relax') ||
    q.includes('want to relax') ||
    q.includes('how can i relax') ||
    q.includes('help me relax') ||
    q.includes('relaxation') ||
    q.includes('unwind')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'wellness_studio') || null;
  }

  // Progress / Wellbeing Trends
  if (
    q.includes('where can i check my progress') ||
    q.includes('check my progress') ||
    q.includes('my progress') ||
    q.includes('view progress') ||
    q.includes('wellbeing rhythm') ||
    q.includes('progress over time') ||
    q.includes('how am i doing')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'wellbeing') || null;
  }

  // Guardian Email / Parent Settings
  if (
    q.includes('change my guardian email') ||
    q.includes('update guardian email') ||
    q.includes('guardian email') ||
    q.includes('parent email') ||
    q.includes('update guardian') ||
    q.includes('guardian settings') ||
    q.includes('parent settings') ||
    q.includes('change parent') ||
    q.includes('guardian notifications')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'guardian_info') || null;
  }

  // Breathing Exercises
  if (
    q.includes('breathing exercise') ||
    q.includes('start breathing') ||
    q.includes('calm breathing') ||
    q.includes('box breath') ||
    q.includes('breathe') ||
    q.includes('do a breathing exercise')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'breathing') || null;
  }

  // AI Feelings Space
  if (
    q.includes('feelings space') ||
    q.includes('voice space') ||
    q.includes('voice ai') ||
    q.includes('talk out loud') ||
    q.includes('speak to ai') ||
    q.includes('voice companion')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'ai_feelings_space') || null;
  }

  // Music & Soundscapes
  if (
    q.includes('ambient music') ||
    q.includes('play music') ||
    q.includes('songs') ||
    q.includes('music') ||
    q.includes('soundscapes') ||
    q.includes('listen to music')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'ambient_music') || null;
  }

  // Mini Games
  if (
    q.includes('mini games') ||
    q.includes('play game') ||
    q.includes('snake game') ||
    q.includes('block puzzle') ||
    q.includes('play snake') ||
    q.includes('distraction game')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'mini_games') || null;
  }

  // Crisis / Help
  if (
    q.includes('crisis') ||
    q.includes('emergency') ||
    q.includes('helpline') ||
    q.includes('tele-manas') ||
    q.includes('kiran') ||
    q.includes('contact support') ||
    q.includes('sos')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'help_support') || null;
  }

  // Focus Timer / Pomodoro
  if (
    q.includes('focus timer') ||
    q.includes('pomodoro') ||
    q.includes('study timer') ||
    q.includes('focus sprint')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'focus_timer') || null;
  }

  // Daily Checkin
  if (
    q.includes('daily checkin') ||
    q.includes('check-in') ||
    q.includes('daily check in') ||
    q.includes('check in today') ||
    q.includes('log my mood')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'daily_checkin') || null;
  }

  // Assessment Survey
  if (
    q.includes('take assessment') ||
    q.includes('retake assessment') ||
    q.includes('start assessment') ||
    q.includes('new assessment') ||
    q.includes('survey')
  ) {
    return ROUTE_REGISTRY.find(r => r.id === 'assessment') || null;
  }

  // Speedometer / Gauge
  if (q.includes('speedometer') || q.includes('stress meter') || q.includes('analog meter')) {
    return ROUTE_REGISTRY.find(r => r.id === 'dashboard') || null;
  }

  // 3. Keyword scoring & token overlap
  const stopWords = new Set(['i', 'want', 'to', 'me', 'my', 'the', 'a', 'an', 'in', 'on', 'where', 'how', 'can', 'do', 'is', 'take', 'find', 'show', 'open', 'go']);
  const queryTokens = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  let bestMatch: RouteRegistryItem | null = null;
  let bestScore = 0;

  for (const item of ROUTE_REGISTRY) {
    let score = 0;

    // Check exact keyword match
    for (const kw of item.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += kw.length * 2;
      }
    }

    // Check token overlap with title and keywords
    for (const token of queryTokens) {
      if (item.title.toLowerCase().includes(token)) {
        score += 8;
      }
      if (item.description.toLowerCase().includes(token)) {
        score += 3;
      }
      for (const kw of item.keywords) {
        if (kw.toLowerCase().includes(token)) {
          score += 4;
        }
      }
    }

    if (score > bestScore && score >= 6) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

export function getAllNavigableRoutes(): RouteRegistryItem[] {
  return ROUTE_REGISTRY;
}
