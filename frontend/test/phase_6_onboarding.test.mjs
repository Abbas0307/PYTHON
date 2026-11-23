import test from 'node:test';
import assert from 'node:assert/strict';

test('Phase 6: Navigation screens include onboarding flow', async () => {
  const { INITIAL_APP_STATE } = await import('../src/storage/sessionStorage.ts');
  assert.ok(INITIAL_APP_STATE, 'INITIAL_APP_STATE exists');
  assert.strictEqual(INITIAL_APP_STATE.currentScreen, 'welcome');
});

test('Phase 6: Onboarding state machine progression rules', () => {
  // Helper simulating App.tsx routing resolution
  function resolveScreen(currentUser, currentScreen) {
    const isAuthenticated = !!currentUser;
    const onboarding = currentUser?.onboarding;
    const parentCompleted = onboarding
      ? onboarding.parent_info_completed
      : Boolean(currentUser?.guardian?.name && currentUser?.guardian?.phone);
    const studentCompleted = onboarding
      ? onboarding.student_info_completed
      : Boolean(currentUser?.full_name && currentUser?.date_of_birth && parentCompleted);
    const isOnboardingComplete = parentCompleted && studentCompleted;

    if (!isAuthenticated) {
      return currentScreen === 'signup' ? 'signup' : 'login';
    }
    if (!parentCompleted) {
      return 'parent_info';
    }
    if (!studentCompleted) {
      return 'student_info';
    }
    if (['login', 'signup', 'parent_info', 'student_info'].includes(currentScreen)) {
      return 'dashboard';
    }
    return currentScreen;
  }

  // 1. Unauthenticated visitor -> Always Login (or Signup if selected)
  assert.strictEqual(resolveScreen(null, 'dashboard'), 'login', 'Unauthenticated visitor cannot access dashboard');
  assert.strictEqual(resolveScreen(null, 'assessment'), 'login', 'Unauthenticated visitor cannot access assessment');
  assert.strictEqual(resolveScreen(null, 'welcome'), 'login', 'Unauthenticated visitor routed to login');
  assert.strictEqual(resolveScreen(null, 'signup'), 'signup', 'Signup screen accessible when unauthenticated');

  // 2. Newly registered student with incomplete parent info -> routed to parent_info
  const newStudent = {
    id: 101,
    email: 'new_student@university.edu',
    onboarding: { parent_info_completed: false, student_info_completed: false, onboarding_completed: false }
  };
  assert.strictEqual(resolveScreen(newStudent, 'dashboard'), 'parent_info', 'Must route to parent_info first');

  // 3. Student completed parent info but incomplete student info -> routed to student_info
  const parentDoneStudent = {
    id: 102,
    email: 'mid_student@university.edu',
    onboarding: { parent_info_completed: true, student_info_completed: false, onboarding_completed: false }
  };
  assert.strictEqual(resolveScreen(parentDoneStudent, 'dashboard'), 'student_info', 'Must route to student_info next');

  // 4. Fully onboarded student -> lands directly on dashboard
  const completedStudent = {
    id: 103,
    email: 'full_student@university.edu',
    onboarding: { parent_info_completed: true, student_info_completed: true, onboarding_completed: true }
  };
  assert.strictEqual(resolveScreen(completedStudent, 'login'), 'dashboard', 'Completed student skips to dashboard');
  assert.strictEqual(resolveScreen(completedStudent, 'dashboard'), 'dashboard');
  assert.strictEqual(resolveScreen(completedStudent, 'model_lab'), 'model_lab', 'Preserves target authenticated screen');

  // 5. Backward compatibility: Legacy student record without explicit onboarding flags
  const legacyStudent = {
    id: 1,
    full_name: 'Morgan Student',
    date_of_birth: '2003-05-15',
    guardian: { name: 'Taylor Lee', phone: '9876543210' }
  };
  assert.strictEqual(resolveScreen(legacyStudent, 'login'), 'dashboard', 'Legacy accounts default to completed');
});

test('Phase 6: Age calculation and DOB validation logic', () => {
  function calculateAge(dobString, referenceDate = new Date('2026-11-17T00:00:00Z')) {
    if (!dobString) return null;
    const birth = new Date(dobString);
    if (isNaN(birth.getTime())) return null;

    let age = referenceDate.getFullYear() - birth.getFullYear();
    const m = referenceDate.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && referenceDate.getDate() < birth.getDate())) {
      age--;
    }
    return {
      age,
      isAdult: age >= 18,
      isValid: age >= 13 && age <= 120 && birth <= referenceDate
    };
  }

  // Future DOB
  const future = calculateAge('2027-01-01');
  assert.strictEqual(future.isValid, false, 'Future date of birth is invalid');

  // Underage (< 13)
  const tooYoung = calculateAge('2015-05-10'); // 11 years old in Nov 2026
  assert.strictEqual(tooYoung.age, 11);
  assert.strictEqual(tooYoung.isValid, false, 'Under 13 is invalid');

  // Minor student (15 years old)
  const minor = calculateAge('2011-04-10');
  assert.strictEqual(minor.age, 15);
  assert.strictEqual(minor.isValid, true);
  assert.strictEqual(minor.isAdult, false);

  // Adult student (21 years old)
  const adult = calculateAge('2005-03-20');
  assert.strictEqual(adult.age, 21);
  assert.strictEqual(adult.isValid, true);
  assert.strictEqual(adult.isAdult, true);
});

test('Phase 6: Parent phone number cleaning and format validation', () => {
  function validatePhone(phone) {
    const digits = (phone || '').replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  assert.strictEqual(validatePhone('9876543210'), true);
  assert.strictEqual(validatePhone('+91 98765-43210'), true);
  assert.strictEqual(validatePhone('(555) 234-5678'), true);
  assert.strictEqual(validatePhone('123'), false, 'Too short');
  assert.strictEqual(validatePhone('12345678901234567'), false, 'Too long');
  assert.strictEqual(validatePhone(''), false, 'Empty phone invalid');
});
