import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Footer } from './components/common/Footer';
import { CrisisBanner } from './components/common/CrisisBanner';
import { WelcomePrivacyScreen } from './pages/WelcomePrivacyScreen';
import { AssessmentScreen } from './pages/AssessmentScreen';
import { DashboardScreen } from './pages/DashboardScreen';
import { ModelLabScreen } from './pages/ModelLabScreen';
import { ModelComparisonScreen } from './pages/ModelComparisonScreen';
import { RealWorldDatasetScreen } from './pages/RealWorldDatasetScreen';
import { LargeDatasetScreen } from './pages/LargeDatasetScreen';
import { ProfileSettingsScreen } from './pages/ProfileSettingsScreen';
import { LoginScreen } from './pages/LoginScreen';
import { SignupScreen } from './pages/SignupScreen';
import { ParentDetailsScreen } from './pages/ParentDetailsScreen';
import { StudentInformationScreen } from './pages/StudentInformationScreen';

// Phase 6.2: Dedicated Feature Pages
import { WellbeingScreen } from './pages/WellbeingScreen';
import { RiskInsightsScreen } from './pages/RiskInsightsScreen';
import { DailyCheckinScreen } from './pages/DailyCheckinScreen';
import { GoalsScreen } from './pages/GoalsScreen';
import { ActivityHistoryScreen } from './pages/ActivityHistoryScreen';
import { WellnessStudioScreen } from './pages/WellnessStudioScreen';
import { RecommendationsScreen } from './pages/RecommendationsScreen';
import { GuardianInfoScreen } from './pages/GuardianInfoScreen';
import { GuardianSupportScreen } from './pages/GuardianSupportScreen';
import { EmailNotificationsScreen } from './pages/EmailNotificationsScreen';
import { PrivacySecurityScreen } from './pages/PrivacySecurityScreen';
import { DataCenterScreen } from './pages/DataCenterScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { HelpSupportScreen } from './pages/HelpSupportScreen';

// Phase 7: AI Companion, Personalization & Structured Modules
import { AICompanionScreen } from './pages/AICompanionScreen';
import { FloatingAICompanionWidget } from './components/companion/FloatingAICompanionWidget';
import { AIFeelingsSpaceScreen } from './pages/AIFeelingsSpaceScreen';
import { PersonalizedActivitiesScreen } from './pages/PersonalizedActivitiesScreen';
import { WeeklyInsightsScreen } from './pages/WeeklyInsightsScreen';
import { AssessmentHistoryScreen } from './pages/AssessmentHistoryScreen';
import { PersonalJournalScreen } from './pages/PersonalJournalScreen';
import { RelaxationExercisesScreen } from './pages/RelaxationExercisesScreen';
import { LearningHubScreen } from './pages/LearningHubScreen';

// Phase 8: Real-World Analyzer, Ambient Music & Stress-Relief Games
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import { MiniGamesScreen } from './pages/MiniGamesScreen';
import { AmbientMusicScreen } from './pages/AmbientMusicScreen';
import { ExplainabilityScreen } from './pages/ExplainabilityScreen';

import {
  AppState,
  NavigationScreen,
  INITIAL_APP_STATE,
  SAMPLE_PREVIEW_STATE
} from './storage/sessionStorage';
import { evaluatePHQ9, analyzeStudentLifestyle } from './engines/wellbeingEngine';
import { StudentSurveyFeatures } from './contracts/featureContract';
import { getApiBaseUrl } from './config/api';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ ...INITIAL_APP_STATE });
  const [showCrisisBanner, setShowCrisisBanner] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem('mindora_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Check backend session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('mindora_auth_token');
    if (token) {
      fetch(`${getApiBaseUrl()}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.status === 'success' && res.profile) {
            setCurrentUser(res.profile);
            sessionStorage.setItem('mindora_user', JSON.stringify(res.profile));
            window.dispatchEvent(new CustomEvent('mindora:login', { detail: { user: res.profile } }));
            const ob = res.profile.onboarding;
            if (ob && !ob.parent_info_completed) {
              setState((prev) => ({ ...prev, currentScreen: 'parent_info' }));
            } else if (ob && !ob.student_info_completed) {
              setState((prev) => ({ ...prev, currentScreen: 'student_info' }));
            } else if (state.currentScreen === 'welcome' || state.currentScreen === 'login') {
              setState((prev) => ({ ...prev, currentScreen: 'dashboard' }));
            }
          } else {
            sessionStorage.removeItem('mindora_auth_token');
            sessionStorage.removeItem('mindora_user');
            setCurrentUser(null);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Check if Item 9 is triggered
  const isItem9Triggered = state.phq9Answers[8] > 0;

  // Browser back/forward navigation support and URL hash sync
  useEffect(() => {
    const syncScreenFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const validScreens: NavigationScreen[] = [
        'dashboard',
        'wellbeing',
        'weekly_insights',
        'assessment',
        'assessment_history',
        'risk_insights',
        'daily_checkin',
        'goals',
        'activity_history',
        'personal_journal',
        'wellness_studio',
        'breathing',
        'grounding',
        'focus_timer',
        'relaxation_exercises',
        'personalized_activities',
        'ai_companion',
        'ai_feelings_space',
        'ai_recommendations',
        'learning_hub',
        'profile',
        'guardian_info',
        'email_notifications',
        'privacy_security',
        'settings',
        'help_support',
        'model_lab',
        'model_comparison',
        'real_world_163',
        'large_dataset',
        'explainability',
        'mini_games',
        'ambient_music',
        'guardian_support'
      ];
      if (hash && validScreens.includes(hash as NavigationScreen)) {
        setState((prev) => ({ ...prev, currentScreen: hash as NavigationScreen }));
      }
    };

    syncScreenFromHash();

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.screen) {
        setState((prev) => ({ ...prev, currentScreen: e.state.screen }));
      } else {
        syncScreenFromHash();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', syncScreenFromHash);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', syncScreenFromHash);
    };
  }, []);

  const handleNavigate = (screen: NavigationScreen) => {
    try {
      window.history.pushState({ screen }, '', `#${screen}`);
    } catch {
      // Safe fallback if history API restricted
    }
    setState((prev) => ({ ...prev, currentScreen: screen }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToSection = (sectionId: string) => {
    if (state.currentScreen !== 'dashboard') {
      try {
        window.history.pushState({ screen: 'dashboard' }, '', '#dashboard');
      } catch {}
      setState((prev) => ({ ...prev, currentScreen: 'dashboard' }));
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleLoginSuccess = (profile: any) => {
    setCurrentUser(profile);
    sessionStorage.setItem('mindora_user', JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('mindora:login', { detail: { user: profile } }));
    const ob = profile?.onboarding;
    if (ob && !ob.parent_info_completed) {
      handleNavigate('parent_info');
    } else if (ob && !ob.student_info_completed) {
      handleNavigate('student_info');
    } else {
      handleNavigate('dashboard');
    }
  };

  const handleSignupSuccess = (profile: any) => {
    setCurrentUser(profile);
    sessionStorage.setItem('mindora_user', JSON.stringify(profile));
    handleNavigate('parent_info');
  };

  const handleParentSuccess = (updatedProfile: any) => {
    setCurrentUser(updatedProfile);
    sessionStorage.setItem('mindora_user', JSON.stringify(updatedProfile));
    handleNavigate('student_info');
  };

  const handleStudentSuccess = (updatedProfile: any) => {
    setCurrentUser(updatedProfile);
    sessionStorage.setItem('mindora_user', JSON.stringify(updatedProfile));
    window.dispatchEvent(new CustomEvent('mindora:login', { detail: { user: updatedProfile } }));
    handleNavigate('dashboard');
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem('mindora_auth_token');
    if (token) {
      try {
        await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {}
      sessionStorage.removeItem('mindora_auth_token');
    }
    sessionStorage.removeItem('mindora_user');
    sessionStorage.removeItem('mindora_active_game_session_v1');
    window.dispatchEvent(new CustomEvent('mindora:logout'));
    setCurrentUser(null);
    handleNavigate('login');
  };

  const handleStartAssessment = () => {
    setState((prev) => ({
      ...prev,
      currentScreen: 'assessment',
      hasConsented: true
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExplorePreview = () => {
    setState({ ...SAMPLE_PREVIEW_STATE });
    setShowCrisisBanner(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetSession = () => {
    setState({ ...INITIAL_APP_STATE });
    setShowCrisisBanner(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateFeatures = (updated: StudentSurveyFeatures) => {
    setState((prev) => ({ ...prev, surveyFeatures: updated }));
  };

  const handleUpdatePHQ9 = (answers: number[]) => {
    setState((prev) => ({ ...prev, phq9Answers: answers }));
  };

  const handleSubmitAssessment = async () => {
    const phq9Eval = evaluatePHQ9(state.phq9Answers);
    const analysis = analyzeStudentLifestyle(state.surveyFeatures);
    const stressScore = Math.max(0, Math.min(100, Math.round(100 - analysis.overallWellbeingScore)));

    const token = sessionStorage.getItem('mindora_auth_token') || localStorage.getItem('mindora_auth_token');
    if (token) {
      try {
        const idempotencyKey = `assess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
        const res = await fetch(`${getApiBaseUrl()}/api/student/assessment/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            phq9_answers: state.phq9Answers,
            features: state.surveyFeatures,
            stress_score: stressScore,
            assessment_source: 'daily_assessment',
            idempotency_key: idempotencyKey,
            timezone: clientTz
          })
        });
        if (res.ok) {
          const resData = await res.json();
          window.dispatchEvent(new CustomEvent('mindora:assessment-submitted', { detail: resData.data }));
          window.dispatchEvent(new CustomEvent('mindora:stress-updated', { detail: { score: stressScore } }));
        }
      } catch (err) {
        console.error('Centralized assessment submission error:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      phq9Result: phq9Eval,
      assessmentCompleted: true,
      currentScreen: 'dashboard',
      isPreviewMode: false
    }));
    if (phq9Eval.hasSelfHarmRisk) {
      setShowCrisisBanner(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCountryChange = (country: string) => {
    setState((prev) => ({ ...prev, selectedCountry: country }));
  };

  const handleToggleHabit = (id: string) => {
    setState((prev) => ({
      ...prev,
      habitChecklist: {
        ...prev.habitChecklist,
        [id]: !prev.habitChecklist[id]
      }
    }));
  };

  // Determine effective screen via strict Login-First and Onboarding guard
  const isAuthenticated = !!currentUser;
  const onboarding = currentUser?.onboarding;
  const parentCompleted = onboarding
    ? onboarding.parent_info_completed
    : Boolean(currentUser?.guardian?.name && currentUser?.guardian?.phone);
  const studentCompleted = onboarding
    ? onboarding.student_info_completed
    : Boolean(currentUser?.full_name && currentUser?.date_of_birth && parentCompleted);
  const isOnboardingComplete = parentCompleted && studentCompleted;

  let effectiveScreen: NavigationScreen = state.currentScreen;
  if (!isAuthenticated) {
    if (effectiveScreen !== 'signup') {
      effectiveScreen = 'login';
    }
  } else if (!parentCompleted) {
    effectiveScreen = 'parent_info';
  } else if (!studentCompleted) {
    effectiveScreen = 'student_info';
  } else {
    if (['login', 'signup', 'parent_info', 'student_info'].includes(effectiveScreen)) {
      effectiveScreen = 'dashboard';
    }
  }

  // Pre-onboarding or Unauthenticated Layout (No Sidebar)
  const isPreOnboardingOrAuth = !isAuthenticated || !isOnboardingComplete;

  return (
    <MusicPlayerProvider>
      <div className="min-h-screen flex flex-col bg-[#F8F9FC] text-[#202033]">
      {/* Top Header */}
      <Header
        currentScreen={effectiveScreen}
        selectedCountry={state.selectedCountry}
        onCountryChange={handleCountryChange}
        onOpenCrisis={() => setShowCrisisBanner((prev) => !prev)}
        isPreviewMode={state.isPreviewMode}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
      />

      {/* Main Container */}
      {isPreOnboardingOrAuth ? (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
          {effectiveScreen === 'login' && (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onNavigate={handleNavigate}
            />
          )}

          {effectiveScreen === 'signup' && (
            <SignupScreen
              onSignupSuccess={handleSignupSuccess}
              onNavigate={handleNavigate}
            />
          )}

          {effectiveScreen === 'parent_info' && (
            <ParentDetailsScreen
              currentUser={currentUser}
              onSuccess={handleParentSuccess}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          )}

          {effectiveScreen === 'student_info' && (
            <StudentInformationScreen
              currentUser={currentUser}
              onSuccess={handleStudentSuccess}
              onBackToParent={() => handleNavigate('parent_info')}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
          {/* Rebuilt Collapsible Sidebar with Mobile Drawer */}
          <Sidebar
            currentScreen={effectiveScreen}
            onNavigate={handleNavigate}
            onJumpToSection={handleJumpToSection}
            assessmentCompleted={state.assessmentCompleted}
            onLoadPreview={handleExplorePreview}
            onResetSession={handleResetSession}
            isPreviewMode={state.isPreviewMode}
            isMobileOpen={isMobileNavOpen}
            onMobileClose={() => setIsMobileNavOpen(false)}
          />

          {/* Dedicated Page Content Pane */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
            {(showCrisisBanner || isItem9Triggered) && (
              <CrisisBanner
                country={state.selectedCountry}
                isTriggeredByItem9={isItem9Triggered}
                onDismiss={() => setShowCrisisBanner(false)}
              />
            )}

            {effectiveScreen === 'welcome' && (
              <WelcomePrivacyScreen
                onStartAssessment={handleStartAssessment}
                onExplorePreview={handleExplorePreview}
                hasConsented={state.hasConsented}
                onToggleConsent={(val) => setState((prev) => ({ ...prev, hasConsented: val }))}
              />
            )}

            {effectiveScreen === 'assessment' && (
              <AssessmentScreen
                features={state.surveyFeatures}
                onUpdateFeatures={handleUpdateFeatures}
                phq9Answers={state.phq9Answers}
                onUpdatePHQ9={handleUpdatePHQ9}
                onSubmitAssessment={handleSubmitAssessment}
                onBackToWelcome={() => handleNavigate('welcome')}
                selectedCountry={state.selectedCountry}
              />
            )}

            {effectiveScreen === 'dashboard' && (
              <DashboardScreen
                features={state.surveyFeatures}
                phq9Result={state.phq9Result}
                isPreviewMode={state.isPreviewMode}
                onRetakeAssessment={() => handleNavigate('assessment')}
                onOpenCrisis={() => setShowCrisisBanner(true)}
                habitChecklist={state.habitChecklist}
                onToggleHabit={handleToggleHabit}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {effectiveScreen === 'wellbeing' && (
              <WellbeingScreen
                features={state.surveyFeatures}
                phq9Result={state.phq9Result}
                isPreviewMode={state.isPreviewMode}
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'risk_insights' && (
              <RiskInsightsScreen
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'explainability' && (
              <ExplainabilityScreen />
            )}

            {effectiveScreen === 'daily_checkin' && (
              <DailyCheckinScreen
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {(effectiveScreen === 'goals' || effectiveScreen === 'personal_goals') && (
              <GoalsScreen
                isPreviewMode={state.isPreviewMode}
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'activity_history' && (
              <ActivityHistoryScreen
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'wellness_studio' && (
              <WellnessStudioScreen
                initialActivity="studio"
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'breathing' && (
              <WellnessStudioScreen
                initialActivity="breathing"
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'grounding' && (
              <WellnessStudioScreen
                initialActivity="grounding"
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'focus_timer' && (
              <WellnessStudioScreen
                initialActivity="focus_timer"
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'muscle_relaxation' && (
              <WellnessStudioScreen
                initialActivity="muscle_relaxation"
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'recommendations' && (
              <RecommendationsScreen
                features={state.surveyFeatures}
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'guardian_info' && (
              <GuardianInfoScreen
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'guardian_support' && (
              <GuardianSupportScreen />
            )}

            {(effectiveScreen === 'email_notifications' ||
              effectiveScreen === 'notification_history') && (
              <EmailNotificationsScreen
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'privacy_security' && (
              <PrivacySecurityScreen
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {(effectiveScreen === 'data_center' || effectiveScreen === 'privacy_center') && (
              <DataCenterScreen
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {effectiveScreen === 'settings' && (
              <SettingsScreen
                onResetSession={handleResetSession}
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {(effectiveScreen === 'profile' || effectiveScreen === 'profile_settings') && (
              <ProfileSettingsScreen />
            )}

            {(effectiveScreen === 'help_support' || effectiveScreen === 'support') && (
              <HelpSupportScreen
                selectedCountry={state.selectedCountry}
                onCountryChange={handleCountryChange}
                onNavigate={handleNavigate}
              />
            )}

            {/* Phase 7 Screens */}
            {effectiveScreen === 'ai_feelings_space' && (
              <AIFeelingsSpaceScreen onNavigate={handleNavigate} />
            )}

            {effectiveScreen === 'ai_companion' && (
              <AICompanionScreen />
            )}

            {effectiveScreen === 'personalized_activities' && (
              <PersonalizedActivitiesScreen onNavigate={handleNavigate} />
            )}

            {effectiveScreen === 'weekly_insights' && (
              <WeeklyInsightsScreen
                onNavigate={handleNavigate}
                isPreviewMode={state.isPreviewMode}
              />
            )}

            {effectiveScreen === 'assessment_history' && (
              <AssessmentHistoryScreen
                onNavigate={handleNavigate}
                assessmentCompleted={state.assessmentCompleted}
              />
            )}

            {effectiveScreen === 'personal_journal' && (
              <PersonalJournalScreen />
            )}

            {effectiveScreen === 'relaxation_exercises' && (
              <RelaxationExercisesScreen onNavigate={handleNavigate} />
            )}

            {effectiveScreen === 'learning_hub' && (
              <LearningHubScreen onNavigate={handleNavigate} />
            )}

            {effectiveScreen === 'ai_recommendations' && (
              <RecommendationsScreen
                features={state.surveyFeatures}
                onNavigate={handleNavigate}
                onOpenCrisis={() => setShowCrisisBanner(true)}
              />
            )}

            {/* Phase 8: Mini Games & Ambient Music Screens */}
            {effectiveScreen === 'mini_games' && (
              <MiniGamesScreen onNavigate={handleNavigate} />
            )}

            {effectiveScreen === 'ambient_music' && (
              <AmbientMusicScreen onNavigate={handleNavigate} />
            )}

            {/* Research Laboratory Screens */}
            {effectiveScreen === 'model_lab' && <ModelLabScreen />}
            {effectiveScreen === 'model_comparison' && <ModelComparisonScreen />}
            {effectiveScreen === 'real_world_163' && <RealWorldDatasetScreen />}
            {effectiveScreen === 'large_dataset' && <LargeDatasetScreen />}
          </main>

          {/* Floating Mindora AI Companion Widget */}
          <FloatingAICompanionWidget
            onNavigate={handleNavigate}
            currentScreen={effectiveScreen}
          />
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
    </MusicPlayerProvider>
  );
};

export default App;
