import React, { useState, useMemo } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  User,
  GraduationCap,
  Calendar,
  Building,
  BookOpen,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface StudentInformationScreenProps {
  currentUser: any;
  onSuccess: (updatedProfile: any) => void;
  onBackToParent: () => void;
  onNavigate: (screen: NavigationScreen) => void;
}

export const StudentInformationScreen: React.FC<StudentInformationScreenProps> = ({
  currentUser,
  onSuccess,
  onBackToParent
}) => {
  const [fullName, setFullName] = useState(
    currentUser?.full_name && currentUser.full_name !== 'Student' ? currentUser.full_name : ''
  );
  const [dob, setDob] = useState(currentUser?.date_of_birth || '2004-05-15');
  const [gender, setGender] = useState(currentUser?.gender || 'Prefer not to say');
  const [institution, setInstitution] = useState(
    currentUser?.institution_name || 'National Institute of Technology'
  );
  const [department, setDepartment] = useState(
    currentUser?.department || 'Computer Science & Engineering'
  );
  const [academicYear, setAcademicYear] = useState(
    currentUser?.academic_year || '3rd Year (UG)'
  );
  const [studentPhone, setStudentPhone] = useState(currentUser?.student_phone || '');

  // Profile Picture Upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentUser?.profile_image_url || null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time Age Calculation
  const ageCalculation = useMemo(() => {
    if (!dob) return null;
    try {
      const birth = new Date(dob);
      const today = new Date();
      if (isNaN(birth.getTime())) return null;

      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return {
        age,
        isAdult: age >= 18,
        isValid: age >= 13 && age <= 120 && birth <= today
      };
    } catch {
      return null;
    }
  }, [dob]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Profile image must be less than 2 MB.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations
    if (fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(fullName.trim())) {
      setErrorMessage('Student name should contain valid alphabetic characters.');
      return;
    }

    if (!ageCalculation || !ageCalculation.isValid) {
      setErrorMessage('Please provide a valid date of birth. Students must be at least 13 years old.');
      return;
    }

    if (institution.trim().length < 2) {
      setErrorMessage('Please enter your college or institution name.');
      return;
    }

    if (department.trim().length < 2) {
      setErrorMessage('Please enter your department or major.');
      return;
    }

    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('mindora_auth_token');

      // 1. Save student profile
      const resp = await fetch(`${getApiBaseUrl()}/api/onboarding/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          date_of_birth: dob,
          gender,
          institution_name: institution.trim(),
          department: department.trim(),
          academic_year: academicYear,
          student_phone: studentPhone.trim() ? studentPhone.replace(/\D/g, '') : ''
        })
      });

      const data = await resp.json();
      if (!resp.ok || data.status !== 'success') {
        setErrorMessage(data.detail || data.message || 'Failed to complete student profile.');
        setIsLoading(false);
        return;
      }

      let updatedProfile = data.data.profile;

      // 2. Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        try {
          const avatarResp = await fetch(`${getApiBaseUrl()}/api/profile/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          const avatarData = await avatarResp.json();
          if (avatarResp.ok && avatarData.avatar_url) {
            updatedProfile.profile_image_url = avatarData.avatar_url;
          }
        } catch {}
      }

      sessionStorage.setItem('mindora_user', JSON.stringify(updatedProfile));
      onSuccess(updatedProfile);
    } catch {
      // Local fallback for offline preview
      const updated = {
        ...currentUser,
        full_name: fullName.trim(),
        date_of_birth: dob,
        is_adult: ageCalculation?.isAdult ?? true,
        gender,
        institution_name: institution.trim(),
        department: department.trim(),
        academic_year: academicYear,
        student_phone: studentPhone.trim(),
        profile_image_url: avatarPreview,
        onboarding: {
          parent_info_completed: true,
          student_info_completed: true,
          onboarding_completed: true,
          next_step: 'dashboard'
        }
      };
      sessionStorage.setItem('mindora_user', JSON.stringify(updated));
      onSuccess(updated);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Onboarding Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-md mx-auto mb-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-emerald-700 mt-1">Account</span>
          </div>

          <div className="flex-1 h-0.5 bg-emerald-500 mx-2 -mt-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-emerald-700 mt-1">Parent Info</span>
          </div>

          <div className="flex-1 h-0.5 bg-violet-600 mx-2 -mt-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-violet-500/20 ring-4 ring-violet-100">
              3
            </div>
            <span className="text-[11px] font-semibold text-violet-900 mt-1">Student Profile</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-2 -mt-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-medium">
              4
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Dashboard</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-violet-700 text-xs font-medium mb-3">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Collegiate Profile Setup</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Complete Your Student Profile
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
          Personalize your wellness experience and calibrate peer benchmarks to your academic institution and study schedule.
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-lg border-violet-100 bg-white">
        {errorMessage && (
          <div role="alert" className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload Banner */}
          <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-violet-200 flex items-center justify-center shrink-0 shadow-sm">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-violet-300" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-slate-800">Profile Picture</h4>
              <p className="text-xs text-slate-500 mt-0.5 mb-2.5">
                Displays in the top navigation header and wellness milestones. Max 2 MB (JPEG, PNG, WebP).
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-violet-200 rounded-xl text-xs font-semibold text-violet-700 hover:bg-violet-50 cursor-pointer shadow-xs transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Picture</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Student Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Legal / Preferred Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin / Jordan Patel"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Date of Birth & Calculated Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  required
                  value={dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Age Validation
              </label>
              <div className="h-[42px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                {ageCalculation && ageCalculation.isValid ? (
                  <>
                    <span className="font-semibold text-slate-800">
                      {ageCalculation.age} years old
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {ageCalculation.isAdult ? 'Adult Student' : 'Minor Student'}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs">Enter valid birth date</span>
                )}
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Gender Identity
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* College / Institution */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              College / University / Institution <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. National Institute of Technology"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Department & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Department / Major <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Current Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
              >
                <option value="1st Year (UG)">1st Year (UG)</option>
                <option value="2nd Year (UG)">2nd Year (UG)</option>
                <option value="3rd Year (UG)">3rd Year (UG)</option>
                <option value="4th Year (UG)">4th Year (UG)</option>
                <option value="Postgraduate / Master's">Postgraduate / Master's</option>
                <option value="Doctoral / PhD">Doctoral / PhD</option>
              </select>
            </div>
          </div>

          {/* Student Mobile Number (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Student Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              placeholder="e.g. 9123456789"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Encrypted in database vault. Never shared publicly.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToParent}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Parent Info
            </button>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md shadow-violet-500/20 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Completing Setup...' : 'Complete Setup & Launch Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
