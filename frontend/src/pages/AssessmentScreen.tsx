import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Shield,
  Heart,
  Phone,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { AssessmentVoiceAssistant } from '../components/assessment/AssessmentVoiceAssistant';
import {
  StudentSurveyFeatures,
  DEGREE_OPTIONS,
  SLEEP_DURATION_OPTIONS,
  DIETARY_HABITS_OPTIONS
} from '../contracts/featureContract';
import {
  PHQ9_QUESTIONS,
  PHQ9_OPTIONS,
  validateAge
} from '../engines/wellbeingEngine';
import { getNationalCrisisSummary } from '../data/resourceCatalogue';

interface AssessmentScreenProps {
  features: StudentSurveyFeatures;
  onUpdateFeatures: (features: StudentSurveyFeatures) => void;
  phq9Answers: number[];
  onUpdatePHQ9: (answers: number[]) => void;
  onSubmitAssessment: () => void;
  onBackToWelcome: () => void;
  selectedCountry: string;
}

export const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  features,
  onUpdateFeatures,
  phq9Answers,
  onUpdatePHQ9,
  onSubmitAssessment,
  onBackToWelcome,
  selectedCountry
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Defect 1: Explicit Age input & validation state
  const [ageInput, setAgeInput] = useState<string>(
    features.age !== undefined && features.age !== null ? String(features.age) : '21'
  );
  const [ageError, setAgeError] = useState<string | null>(null);

  // Defect 2: Mobile Item 9 safeguard viewport reference
  const item9SafeguardRef = useRef<HTMLDivElement | null>(null);

  const steps = [
    { number: 1, title: 'Academic Life', shortTitle: 'Academic', description: 'Degree, pressure & study satisfaction' },
    { number: 2, title: 'Daily Habits', shortTitle: 'Habits', description: 'Sleep schedule, workload & nourishment' },
    { number: 3, title: 'Wellbeing Screen', shortTitle: 'PHQ-9', description: 'Standardized 9-item reflection (PHQ-9)' }
  ];

  const handleFeatureChange = <K extends keyof StudentSurveyFeatures>(
    key: K,
    val: StudentSurveyFeatures[K]
  ) => {
    onUpdateFeatures({
      ...features,
      [key]: val
    });
  };

  const handleApplyVoiceFeatures = (updated: Partial<StudentSurveyFeatures>) => {
    if (updated.age !== undefined) {
      setAgeInput(String(updated.age));
      setAgeError(null);
    }
    onUpdateFeatures({
      ...features,
      ...updated
    });
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setAgeInput(rawVal);
    const validation = validateAge(rawVal);
    if (validation.isValid && validation.age !== undefined) {
      setAgeError(null);
      handleFeatureChange('age', validation.age);
    } else {
      setAgeError(validation.errorMessage || 'Invalid age.');
    }
  };

  const handleProceedToStep2 = () => {
    const validation = validateAge(ageInput);
    if (!validation.isValid || validation.age === undefined) {
      setAgeError(validation.errorMessage || 'Please enter a valid age between 16 and 55.');
      return;
    }
    handleFeatureChange('age', validation.age);
    setAgeError(null);
    setCurrentStep(2);
  };

  const handlePHQ9Change = (index: number, value: number) => {
    const updated = [...phq9Answers];
    updated[index] = value;
    onUpdatePHQ9(updated);
  };

  // Check if Item 9 (index 8) is positive
  const item9Active = phq9Answers[8] > 0;
  const nationalCrisis = getNationalCrisisSummary(selectedCountry);

  // Auto-scroll nearest boundary when Item 9 safeguard triggers to ensure instant visibility on mobile
  useEffect(() => {
    if (item9Active && currentStep === 3) {
      // Small timeout to allow DOM node render
      const timer = setTimeout(() => {
        item9SafeguardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [item9Active, currentStep]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header & Progress Indicator */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as any);
              else onBackToWelcome();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-mindora-primary hover:text-mindora-secondary transition-colors focus-visible:ring-2 focus-visible:ring-mindora-primary"
            aria-label={currentStep === 1 ? 'Back to Overview screen' : 'Return to Previous step'}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{currentStep === 1 ? 'Back to Overview' : 'Previous Step'}</span>
          </button>

          <Badge variant="violet">Step {currentStep} of 3</Badge>
        </div>

        {/* Multi-step progress bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3" role="progressbar" aria-label="Assessment Progress">
          {steps.map((s) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;

            return (
              <div
                key={s.number}
                className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-mindora-lavender/60 border-mindora-primary/40 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : 'bg-white border-mindora-border/70 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-mindora-primary text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : s.number}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold truncate hidden sm:inline">
                    {s.title}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold truncate sm:hidden">
                    {s.shortTitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content Cards */}
      {currentStep === 1 && (
        <Card className="space-y-6">
          <div className="border-b border-mindora-border/60 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-mindora-darkText">Step 1: Academic & Study Profile</h2>
            <p className="text-xs text-mindora-mutedText mt-1">
              Help us understand your current university workload, degree track, and academic commitments.
            </p>
          </div>

          {/* Voice Assessment Assistant */}
          <AssessmentVoiceAssistant
            currentFeatures={features}
            onApplyFeatures={handleApplyVoiceFeatures}
            currentStep={currentStep}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* DEFECT 1 RESOLUTION: Explicit Age Input with strict feature contract validation */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="age-input" className="text-xs font-bold text-mindora-darkText">
                  Age (Years)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Permitted: 16 – 55</span>
              </div>
              <input
                id="age-input"
                type="number"
                min={16}
                max={55}
                step={1}
                value={ageInput}
                onChange={handleAgeChange}
                placeholder="e.g. 21"
                aria-label="Student Age in years"
                aria-invalid={!!ageError}
                aria-describedby={ageError ? 'age-error-msg' : undefined}
                className={`w-full px-3.5 py-2.5 bg-mindora-surface border rounded-xl text-sm font-medium focus:ring-2 focus:outline-none transition-all ${
                  ageError
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-mindora-border focus:ring-mindora-primary/30'
                }`}
              />
              {ageError && (
                <p id="age-error-msg" role="alert" className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{ageError}</span>
                </p>
              )}
            </div>

            {/* Degree */}
            <div className="space-y-1.5">
              <label htmlFor="degree-select" className="text-xs font-bold text-mindora-darkText block">
                Degree / Program
              </label>
              <select
                id="degree-select"
                value={features.degree}
                onChange={(e) => handleFeatureChange('degree', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-mindora-surface border border-mindora-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none cursor-pointer"
              >
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Academic Pressure (1 to 5) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="academic-pressure-range" className="text-xs font-bold text-mindora-darkText">
                  Academic Pressure
                </label>
                <span className="text-xs font-extrabold text-mindora-primary bg-mindora-lavender px-2 py-0.5 rounded-full">
                  Level {features.academicPressure} / 5
                </span>
              </div>
              <input
                id="academic-pressure-range"
                type="range"
                min={1}
                max={5}
                step={1}
                value={features.academicPressure}
                onChange={(e) => handleFeatureChange('academicPressure', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-mindora-primary"
              />
              <div className="flex justify-between text-[10px] text-mindora-mutedText font-semibold">
                <span>1 - Minimal</span>
                <span>3 - Moderate</span>
                <span>5 - Severe Pressure</span>
              </div>
            </div>

            {/* Study Satisfaction (1 to 5) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="study-satisfaction-range" className="text-xs font-bold text-mindora-darkText">
                  Study Satisfaction
                </label>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {features.studySatisfaction} / 5
                </span>
              </div>
              <input
                id="study-satisfaction-range"
                type="range"
                min={1}
                max={5}
                step={1}
                value={features.studySatisfaction}
                onChange={(e) => handleFeatureChange('studySatisfaction', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-mindora-mutedText font-semibold">
                <span>1 - Dissatisfied</span>
                <span>3 - Neutral</span>
                <span>5 - Fulfilling</span>
              </div>
            </div>

            {/* CGPA */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="cgpa-input" className="text-xs font-bold text-mindora-darkText">
                  Current Cumulative CGPA (0.0 – 10.0)
                </label>
                <span className="text-xs font-bold text-slate-600">
                  {features.cgpa.toFixed(2)}
                </span>
              </div>
              <input
                id="cgpa-input"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={features.cgpa}
                onChange={(e) => handleFeatureChange('cgpa', parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-mindora-surface border border-mindora-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-mindora-border/60">
            <Button
              variant="outline"
              onClick={onBackToWelcome}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Overview
            </Button>
            <Button
              onClick={handleProceedToStep2}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next: Daily Habits
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="space-y-6">
          <div className="border-b border-mindora-border/60 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-mindora-darkText">Step 2: Sleep, Workload & Nourishment</h2>
            <p className="text-xs text-mindora-mutedText mt-1">
              Restorative balance and daily routine consistency are foundational drivers of mental clarity.
            </p>
          </div>

          {/* Voice Assessment Assistant */}
          <AssessmentVoiceAssistant
            currentFeatures={features}
            onApplyFeatures={handleApplyVoiceFeatures}
            currentStep={currentStep}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Sleep Duration */}
            <div className="space-y-1.5">
              <label htmlFor="sleep-duration-select" className="text-xs font-bold text-mindora-darkText block">
                Typical Sleep Duration (Nightly)
              </label>
              <select
                id="sleep-duration-select"
                value={features.sleepDuration}
                onChange={(e) => handleFeatureChange('sleepDuration', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-mindora-surface border border-mindora-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none cursor-pointer"
              >
                {SLEEP_DURATION_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Dietary Habits */}
            <div className="space-y-1.5">
              <label htmlFor="dietary-habits-select" className="text-xs font-bold text-mindora-darkText block">
                Dietary Habits & Regularity
              </label>
              <select
                id="dietary-habits-select"
                value={features.dietaryHabits}
                onChange={(e) => handleFeatureChange('dietaryHabits', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-mindora-surface border border-mindora-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none cursor-pointer"
              >
                {DIETARY_HABITS_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Daily Work / Study Hours */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="work-study-hours-range" className="text-xs font-bold text-mindora-darkText">
                  Daily Work & Study Hours
                </label>
                <span className="text-xs font-extrabold text-mindora-primary bg-mindora-lavender px-2 py-0.5 rounded-full">
                  {features.workStudyHours} hrs / day
                </span>
              </div>
              <input
                id="work-study-hours-range"
                type="range"
                min={0}
                max={16}
                step={0.5}
                value={features.workStudyHours}
                onChange={(e) => handleFeatureChange('workStudyHours', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-mindora-primary"
              />
              <div className="flex justify-between text-[10px] text-mindora-mutedText font-semibold">
                <span>0 hrs</span>
                <span>8 hrs (Standard)</span>
                <span>16 hrs (High Load)</span>
              </div>
            </div>

            {/* Financial Stress (1 to 5) */}
            <div className="space-y-1.5">
              <label htmlFor="financial-stress-select" className="text-xs font-bold text-mindora-darkText block">
                Financial Stress Concern
              </label>
              <select
                id="financial-stress-select"
                value={features.financialStress}
                onChange={(e) => handleFeatureChange('financialStress', parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-mindora-surface border border-mindora-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none cursor-pointer"
              >
                <option value={1}>1 - Low / Minimal Stress</option>
                <option value={2}>2 - Mild Strain</option>
                <option value={3}>3 - Moderate Pressure</option>
                <option value={4}>4 - High Concern</option>
                <option value={5}>5 - Acute Financial Burden</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-mindora-border/60">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Proceed to Wellbeing Screen
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="space-y-6">
          <div className="border-b border-mindora-border/60 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-mindora-darkText">Step 3: Standardized Wellbeing Screen</h2>
                <p className="text-xs text-mindora-mutedText mt-1">
                  Over the <strong>last 2 weeks</strong>, how often have you been bothered by any of the following problems?
                </p>
              </div>
              <Badge variant="emerald" icon={<Shield className="w-3.5 h-3.5" />}>
                Zero-Persistence Category A
              </Badge>
            </div>
          </div>

          {/* 9 Standardized Questions */}
          <div className="space-y-4">
            {PHQ9_QUESTIONS.map((question, idx) => {
              const isItem9 = idx === 8;

              return (
                <fieldset
                  key={idx}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isItem9 && item9Active
                      ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200/80 shadow-xs'
                      : isItem9
                      ? 'bg-slate-50/50 border-slate-200'
                      : 'bg-mindora-surface/60 border-mindora-border/60'
                  }`}
                >
                  <legend className="flex items-start gap-2 mb-2.5">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isItem9 && item9Active
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-mindora-lavender text-mindora-primary'
                      }`}
                    >
                      Q{idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-mindora-darkText leading-snug">
                      {question}
                    </span>
                  </legend>

                  {/* Answer Radio Options (Always interactive and un-obscured) */}
                  <div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1"
                    role="radiogroup"
                    aria-label={`Question ${idx + 1} response options`}
                  >
                    {PHQ9_OPTIONS.map((opt) => {
                      const isSelected = phq9Answers[idx] === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`Q${idx + 1}: ${opt.label}`}
                          onClick={() => handlePHQ9Change(idx, opt.value)}
                          className={`text-[11px] sm:text-xs font-semibold py-2 px-2 rounded-xl border text-center transition-all focus-visible:ring-2 focus-visible:ring-mindora-primary ${
                            isSelected
                              ? 'bg-gradient-to-r from-mindora-primary to-mindora-secondary text-white border-transparent shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-mindora-primary/40 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* DEFECT 2 RESOLUTION: Immediate In-Viewport Crisis Safeguard for Item 9 */}
                  {/* Positioned directly under Item 9 answer options for instantaneous mobile & desktop visibility */}
                  {isItem9 && item9Active && (
                    <div
                      ref={item9SafeguardRef}
                      role="alert"
                      aria-live="assertive"
                      className="mt-4 p-4 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 border-2 border-rose-300 rounded-xl space-y-3 shadow-md animate-fadeIn"
                    >
                      <div className="flex items-start gap-2.5">
                        <Heart className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" aria-hidden="true" />
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 block">
                            Dedicated Support is Available For You Right Now
                          </span>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                            You indicated thoughts of hurting yourself. Please know you are not alone, and your safety matters deeply. Confidential, compassionate crisis responders in <strong>{nationalCrisis.country}</strong> are available 24/7/365 to listen and support you.
                          </p>
                        </div>
                      </div>

                      {/* Direct One-Click Dial Actions (National Routing) */}
                      <div className="pt-2 border-t border-rose-200/80 flex flex-wrap items-center gap-2">
                        <a
                          href={nationalCrisis.primaryMentalHealthNumber.startsWith('http') ? nationalCrisis.primaryMentalHealthNumber : `tel:${nationalCrisis.primaryMentalHealthNumber.split('/')[0].trim()}`}
                          aria-label={`Call ${nationalCrisis.primaryMentalHealthService} at ${nationalCrisis.primaryMentalHealthNumber}`}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-2 px-3.5 rounded-xl shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Call {nationalCrisis.primaryMentalHealthService}: {nationalCrisis.primaryMentalHealthNumber}</span>
                        </a>

                        {nationalCrisis.emergencyNumber && nationalCrisis.emergencyNumber !== 'Local Emergency Number' && (
                          <a
                            href={`tel:${nationalCrisis.emergencyNumber}`}
                            aria-label={`Dial Emergency Dispatch at ${nationalCrisis.emergencyNumber}`}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 py-2 px-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Emergency: Dial {nationalCrisis.emergencyNumber}</span>
                          </a>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium">
                        Free • Confidential • 24/7 • Non-Commercial • No assessment submission required
                      </div>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-mindora-border/60">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              onClick={onSubmitAssessment}
              icon={<CheckCircle2 className="w-4 h-4" />}
              iconPosition="right"
              className="shadow-md"
            >
              Generate Wellbeing Intelligence
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
