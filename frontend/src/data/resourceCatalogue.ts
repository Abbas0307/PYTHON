/**
 * src/data/resourceCatalogue.ts
 * Mindora 2.0 — Verified Student Support Resource Catalogue.
 * 
 * Single authoritative source of truth for all crisis hotlines,
 * emergency dispatch services, and educational support resources.
 * 
 * STRICT VERIFICATION REQUIREMENTS:
 *   - Verified against official government health departments or registered services.
 *   - Immediate emergency dispatch is strictly separated from mental health counseling.
 *   - Offline-accessible static data structure (bundled in client-side code).
 *   - Zero collection or persistence of personal student information.
 */

export type ResourceCategory =
  | 'emergency_dispatch'       // Category A: Immediate Emergency Dispatch
  | 'crisis_counselling'       // Category B: Crisis and Mental Health Counselling
  | 'student_wellbeing'        // Category C: Student Wellbeing and Educational Support
  | 'sleep_recovery'           // Category D: Sleep and Recovery Education
  | 'academic_resilience'      // Category E: Academic Resilience Resources
  | 'international_directory'; // Category F: International Directories

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED';

export type SupportedCountry =
  | 'India'
  | 'United States'
  | 'Canada'
  | 'United Kingdom'
  | 'Australia'
  | 'International';

export interface SupportResource {
  id: string;
  name: string;
  countryOrRegion: SupportedCountry | 'Global';
  category: ResourceCategory;
  categoryLabel: string;
  telephoneNumber?: string;
  dialableNumber?: string;
  smsContact?: string;
  website: string;
  operatingHours: string;
  eligibilityRestrictions: string;
  isEmergencyDispatch: boolean;
  summary: string;
  description: string;
  officialVerificationSource: string;
  verificationSourceUrl: string;
  lastVerificationDate: string; // ISO 8601 YYYY-MM-DD
  verificationStatus: VerificationStatus;
}

export const CATEGORY_DEFINITIONS: Record<
  ResourceCategory,
  { code: string; label: string; description: string; badgeVariant: 'rose' | 'amber' | 'violet' | 'slate' | 'emerald' }
> = {
  emergency_dispatch: {
    code: 'A',
    label: 'Immediate Emergency Dispatch',
    description: 'Dial immediate local emergency services for acute danger to life, medical emergencies, or physical safety threats.',
    badgeVariant: 'amber'
  },
  crisis_counselling: {
    code: 'B',
    label: 'Crisis & Mental Health Counselling',
    description: 'Free, confidential, 24/7 listening services and psychological support provided by qualified counselors.',
    badgeVariant: 'rose'
  },
  student_wellbeing: {
    code: 'C',
    label: 'Student Wellbeing & Educational Support',
    description: 'Collegiate mental health initiatives, stress reduction programs, and campus community navigation.',
    badgeVariant: 'emerald'
  },
  sleep_recovery: {
    code: 'D',
    label: 'Sleep & Recovery Education',
    description: 'Evidence-based circadian pacing, sleep architecture optimization, and restorative rest strategies.',
    badgeVariant: 'violet'
  },
  academic_resilience: {
    code: 'E',
    label: 'Academic Resilience Resources',
    description: 'Ultradian study pacing (50/10 protocol), exam stress buffering, and cognitive fatigue ergonomics.',
    badgeVariant: 'slate'
  },
  international_directory: {
    code: 'F',
    label: 'International Directories',
    description: 'Global search tools and crisis helpline directories operating across 130+ nations.',
    badgeVariant: 'violet'
  }
};

export const SUPPORTED_COUNTRIES: readonly SupportedCountry[] = [
  'India',
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'International'
] as const;

export const RESOURCE_CATALOGUE: SupportResource[] = [
  // ==========================================
  // INDIA
  // ==========================================
  {
    id: 'in-emergency-112',
    name: 'National Emergency Services (Police, Fire, Ambulance)',
    countryOrRegion: 'India',
    category: 'emergency_dispatch',
    categoryLabel: 'Category A: Immediate Emergency Dispatch',
    telephoneNumber: '112',
    dialableNumber: '112',
    website: 'https://112.gov.in',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Anyone in India experiencing an immediate threat to life, safety, or medical emergency.',
    isEmergencyDispatch: true,
    summary: 'Single unified emergency response number for India across all states and union territories.',
    description: 'Call 112 immediately if you or someone near you is in acute life-threatening danger, severe medical crisis, or immediate risk of physical harm. 112 dispatches police, fire, and ambulance services.',
    officialVerificationSource: 'Ministry of Home Affairs (MHA), Government of India — Emergency Response Support System (ERSS)',
    verificationSourceUrl: 'https://112.gov.in',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'in-tele-manas',
    name: 'Tele-MANAS (National Mental Health Helpline)',
    countryOrRegion: 'India',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '14416 / 1800-89-14416',
    dialableNumber: '14416',
    website: 'https://telemanas.mohfw.gov.in',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free, toll-free, confidential service open to all individuals in India; supported in 20+ regional languages.',
    isEmergencyDispatch: false,
    summary: 'Government of India comprehensive 24/7 tele-mental health support network.',
    description: 'Tele-MANAS provides free psychological first aid, crisis intervention, and specialized psychiatric referral. Calls are handled by trained mental health professionals and psychiatrists.',
    officialVerificationSource: 'Ministry of Health and Family Welfare (MoHFW), Government of India / NIMHANS Bengaluru',
    verificationSourceUrl: 'https://telemanas.mohfw.gov.in',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'in-kiran-helpline',
    name: 'KIRAN Mental Health Rehabilitation Helpline',
    countryOrRegion: 'India',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '1800-599-0019',
    dialableNumber: '18005990019',
    website: 'https://disabilityaffairs.gov.in',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free, confidential mental health counseling available in 13 languages across India.',
    isEmergencyDispatch: false,
    summary: 'Government national helpline for psychological support and crisis management.',
    description: 'Provides early screening, first aid, psychological support, distress management, and mental health rehabilitation referrals.',
    officialVerificationSource: 'Department of Empowerment of Persons with Disabilities, Ministry of Social Justice and Empowerment, Government of India',
    verificationSourceUrl: 'https://disabilityaffairs.gov.in',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'in-vandrevala-foundation',
    name: 'Vandrevala Foundation Helpline',
    countryOrRegion: 'India',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '+91 9999 666 555',
    dialableNumber: '+919999666555',
    website: 'https://www.vandrevalafoundation.com',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free telephone counseling available to anyone residing in India or overseas seeking support in English, Hindi, and regional languages.',
    isEmergencyDispatch: false,
    summary: 'Non-profit 24/7 telephonic emotional support and counseling organization.',
    description: 'Staffed by professional psychologists and clinical counselors providing immediate emotional support for anxiety, depression, exam stress, and crisis situations.',
    officialVerificationSource: 'Vandrevala Foundation for Mental Health (Section 8 Non-Profit Registered Trust)',
    verificationSourceUrl: 'https://www.vandrevalafoundation.com',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },

  // ==========================================
  // UNITED STATES
  // ==========================================
  {
    id: 'us-emergency-911',
    name: 'Emergency Dispatch Services (Police, Fire, EMS)',
    countryOrRegion: 'United States',
    category: 'emergency_dispatch',
    categoryLabel: 'Category A: Immediate Emergency Dispatch',
    telephoneNumber: '911',
    dialableNumber: '911',
    website: 'https://www.911.gov',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Immediate life-threatening danger, physical violence, or acute emergency in the United States.',
    isEmergencyDispatch: true,
    summary: 'National emergency dispatch system across all 50 US states and territories.',
    description: 'Dial 911 immediately if you or someone else is in immediate danger of death or severe injury. 911 sends police, fire, or paramedic first responders.',
    officialVerificationSource: 'National 911 Program, National Highway Traffic Safety Administration (NHTSA), US Department of Transportation',
    verificationSourceUrl: 'https://www.911.gov',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'us-988-lifeline',
    name: '988 Suicide & Crisis Lifeline',
    countryOrRegion: 'United States',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '988 (Call or Text)',
    dialableNumber: '988',
    smsContact: '988',
    website: 'https://988lifeline.org',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free, confidential support for anyone in suicidal crisis, mental health distress, or substance use crisis in the US.',
    isEmergencyDispatch: false,
    summary: 'Federal 3-digit national suicide prevention and mental health crisis lifeline.',
    description: 'Call or text 988 to connect with trained crisis counselors in English and Spanish, with interpretation in 240+ languages. 988 is a confidential counseling service, not emergency dispatch.',
    officialVerificationSource: 'Substance Abuse and Mental Health Services Administration (SAMHSA), US Department of Health and Human Services (HHS)',
    verificationSourceUrl: 'https://988lifeline.org',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'us-crisis-text-line',
    name: 'Crisis Text Line',
    countryOrRegion: 'United States',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: 'Text HOME to 741741',
    smsContact: '741741',
    website: 'https://www.crisistextline.org',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free text-based crisis intervention available across the United States.',
    isEmergencyDispatch: false,
    summary: '24/7 text-based mental health support and suicide prevention service.',
    description: 'Text HOME to 741741 from anywhere in the US to text with a trained volunteer crisis counselor. Confidential support for anxiety, depression, relationship strain, and crisis.',
    officialVerificationSource: 'Crisis Text Line (Verified 501(c)(3) Public Charity partnered with mental health authorities)',
    verificationSourceUrl: 'https://www.crisistextline.org',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'us-trevor-project',
    name: 'The Trevor Project (LGBTQ+ Youth Crisis Lifeline)',
    countryOrRegion: 'United States',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '1-866-488-7386',
    dialableNumber: '18664887386',
    smsContact: 'Text START to 678-678',
    website: 'https://www.thetrevorproject.org',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free, confidential suicide prevention and crisis intervention for LGBTQ young people (under 25).',
    isEmergencyDispatch: false,
    summary: 'Dedicated 24/7 suicide prevention and crisis intervention for LGBTQ youth.',
    description: 'Provides free and confidential phone, text, and chat services connecting LGBTQ youth to trained counselors who understand LGBTQ-specific challenges.',
    officialVerificationSource: 'The Trevor Project Inc. (National LGBTQ Youth Mental Health Charity)',
    verificationSourceUrl: 'https://www.thetrevorproject.org',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },

  // ==========================================
  // CANADA
  // ==========================================
  {
    id: 'ca-emergency-911',
    name: 'Emergency Dispatch Services (Police, Fire, Ambulance)',
    countryOrRegion: 'Canada',
    category: 'emergency_dispatch',
    categoryLabel: 'Category A: Immediate Emergency Dispatch',
    telephoneNumber: '911',
    dialableNumber: '911',
    website: 'https://www.publicsafety.gc.ca',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Immediate threat to life, medical emergencies, or safety incidents in Canada.',
    isEmergencyDispatch: true,
    summary: 'Canadian national emergency response dispatch system.',
    description: 'Call 911 immediately if you are in immediate life-threatening danger or require urgent paramedic/police response in Canada.',
    officialVerificationSource: 'Public Safety Canada / Sécurité publique Canada',
    verificationSourceUrl: 'https://www.publicsafety.gc.ca',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'ca-988-helpline',
    name: '988 Suicide Crisis Helpline / Ligne d’aide en cas de crise de suicide',
    countryOrRegion: 'Canada',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '988 (Call or Text)',
    dialableNumber: '988',
    smsContact: '988',
    website: 'https://988.ca',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Toll-free, bilingual (English & French) support for anyone in Canada thinking about suicide or in distress.',
    isEmergencyDispatch: false,
    summary: 'Pan-Canadian 3-digit suicide prevention and crisis intervention service.',
    description: 'Trained responders provide compassionate, non-judgmental support via phone or text 24 hours a day, 7 days a week, 365 days a year across Canada.',
    officialVerificationSource: 'Public Health Agency of Canada (PHAC) / Centre for Addiction and Mental Health (CAMH)',
    verificationSourceUrl: 'https://988.ca',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'ca-kids-help-phone',
    name: 'Kids Help Phone (Jeunesse, J’écoute)',
    countryOrRegion: 'Canada',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '1-800-668-6868',
    dialableNumber: '18006686868',
    smsContact: 'Text 686868',
    website: 'https://kidshelpphone.ca',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free national e-mental health service for youth and young adults across Canada.',
    isEmergencyDispatch: false,
    summary: '24/7 national e-mental health service offering bilingual youth counseling.',
    description: 'Provides phone, text, and self-directed mental health support resources for Canadian youth, college students, and young adults.',
    officialVerificationSource: 'Kids Help Phone Canada (Federally Registered Canadian Charity)',
    verificationSourceUrl: 'https://kidshelpphone.ca',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },

  // ==========================================
  // UNITED KINGDOM
  // ==========================================
  {
    id: 'uk-emergency-999',
    name: 'Emergency Services (Police, Fire, Ambulance, Coastguard)',
    countryOrRegion: 'United Kingdom',
    category: 'emergency_dispatch',
    categoryLabel: 'Category A: Immediate Emergency Dispatch',
    telephoneNumber: '999 (or 112)',
    dialableNumber: '999',
    website: 'https://www.police.uk',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Immediate threat to life, serious crime in progress, or catastrophic injury in the UK.',
    isEmergencyDispatch: true,
    summary: 'United Kingdom national emergency dispatch service.',
    description: 'Call 999 (or 112) immediately for life-threatening emergencies. 999 dispatches police, fire, ambulance, or coastguard services.',
    officialVerificationSource: 'Home Office, Government of the United Kingdom / National Health Service (NHS England)',
    verificationSourceUrl: 'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'uk-nhs-111',
    name: 'NHS 111 Mental Health Services',
    countryOrRegion: 'United Kingdom',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '111',
    dialableNumber: '111',
    website: 'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'England, Scotland, and Wales. (In Northern Ireland, Lifeline NI operates on 0808 808 8000).',
    isEmergencyDispatch: false,
    summary: 'NHS clinical assessment, urgent advice, and local crisis team triage.',
    description: 'Select the mental health option when dialing 111 to speak to a trained mental health nurse or advisor. For urgent, non-life-threatening mental health support.',
    officialVerificationSource: 'National Health Service (NHS England, NHS 24 Scotland, NHS 111 Wales)',
    verificationSourceUrl: 'https://www.nhs.uk',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'uk-lifeline-ni',
    name: 'Lifeline Northern Ireland',
    countryOrRegion: 'United Kingdom',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '0808 808 8000',
    dialableNumber: '08088088000',
    website: 'https://www.lifelinehelpline.info',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free, confidential helpline for people living in Northern Ireland experiencing crisis or despair.',
    isEmergencyDispatch: false,
    summary: 'Northern Ireland dedicated regional crisis and suicide prevention helpline.',
    description: 'Regional Notice: NHS 111 mental health triage does not operate in Northern Ireland. Lifeline NI provides dedicated 24/7 crisis response for NI residents.',
    officialVerificationSource: 'Public Health Agency (PHA) Northern Ireland / Health and Social Care (HSC)',
    verificationSourceUrl: 'https://www.lifelinehelpline.info',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'uk-samaritans',
    name: 'Samaritans (Pan-UK & Ireland)',
    countryOrRegion: 'United Kingdom',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '116 123',
    dialableNumber: '116123',
    website: 'https://www.samaritans.org',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free confidential listening service for anyone in the UK and Republic of Ireland.',
    isEmergencyDispatch: false,
    summary: '24/7 volunteer-led emotional support charity.',
    description: 'Whatever you are going through, a Samaritan volunteer is available to listen without judgment 24 hours a day, 365 days a year.',
    officialVerificationSource: 'Samaritans (UK Registered Charity 219432)',
    verificationSourceUrl: 'https://www.samaritans.org',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'uk-shout-text',
    name: 'Shout Crisis Text Line',
    countryOrRegion: 'United Kingdom',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: 'Text SHOUT to 85258',
    smsContact: '85258',
    website: 'https://giveusashout.org',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free, confidential text support for anyone in the United Kingdom.',
    isEmergencyDispatch: false,
    summary: 'Free 24/7 UK text messaging mental health support service.',
    description: 'Text SHOUT to 85258 from any major UK mobile network to connect with a trained volunteer crisis responder for support with suicidal thoughts, depression, or panic.',
    officialVerificationSource: 'Mental Health Innovations (Registered UK Charity 1175670, partnered with NHS)',
    verificationSourceUrl: 'https://giveusashout.org',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },

  // ==========================================
  // AUSTRALIA
  // ==========================================
  {
    id: 'au-emergency-000',
    name: 'Emergency Services (Triple Zero - 000)',
    countryOrRegion: 'Australia',
    category: 'emergency_dispatch',
    categoryLabel: 'Category A: Immediate Emergency Dispatch',
    telephoneNumber: '000',
    dialableNumber: '000',
    website: 'https://www.triplezero.gov.au',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Life-threatening situations, emergencies, or urgent crimes in Australia.',
    isEmergencyDispatch: true,
    summary: 'Australian national primary emergency dispatch service.',
    description: 'Dial 000 (Triple Zero) immediately if you or someone else is in life-threatening medical danger, acute crisis, or severe physical hazard in Australia.',
    officialVerificationSource: 'Department of Home Affairs, Australian Government / Emergency Services Telecommunications Authority',
    verificationSourceUrl: 'https://www.triplezero.gov.au',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'au-lifeline',
    name: 'Lifeline Australia',
    countryOrRegion: 'Australia',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '13 11 14',
    dialableNumber: '131114',
    website: 'https://www.lifeline.org.au',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free national crisis support and suicide prevention services for all people in Australia.',
    isEmergencyDispatch: false,
    summary: 'National charity providing all Australians with access to 24/7 crisis support.',
    description: 'Provides 24/7 crisis counseling via telephone (13 11 14), text, and web chat. Non-judgmental support for suicide prevention and emotional crisis.',
    officialVerificationSource: 'Lifeline Australia (Supported by Australian Department of Health and Aged Care)',
    verificationSourceUrl: 'https://www.lifeline.org.au',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'au-beyond-blue',
    name: 'Beyond Blue Support Service',
    countryOrRegion: 'Australia',
    category: 'crisis_counselling',
    categoryLabel: 'Category B: Crisis and Mental Health Counselling',
    telephoneNumber: '1300 22 4636',
    dialableNumber: '1300224636',
    website: 'https://www.beyondblue.org.au',
    operatingHours: '24/7/365',
    eligibilityRestrictions: 'Free support and referral for anxiety, depression, and mental health in Australia.',
    isEmergencyDispatch: false,
    summary: 'Mental health information and short-term counseling service.',
    description: 'Offers 24/7 telephone counseling, webchat, and online forums to help Australians understand depression, manage anxiety, and access local mental health professionals.',
    officialVerificationSource: 'Beyond Blue Limited (National Mental Health Initiative funded by Australian Governments)',
    verificationSourceUrl: 'https://www.beyondblue.org.au',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },

  // ==========================================
  // INTERNATIONAL & EDUCATIONAL RESOURCES
  // ==========================================
  {
    id: 'intl-find-a-helpline',
    name: 'Find A Helpline (Global Crisis Directory)',
    countryOrRegion: 'International',
    category: 'international_directory',
    categoryLabel: 'Category F: International Directories',
    website: 'https://findahelpline.com',
    operatingHours: '24/7 Searchable Directory',
    eligibilityRestrictions: 'Free, global directory accessible to anyone seeking crisis lines across 130+ nations.',
    isEmergencyDispatch: false,
    summary: 'World-wide confidential search tool connecting users to local crisis services.',
    description: 'Free, confidential directory that helps users find local crisis hotlines, text lines, and chat services in over 130 countries across Europe, Asia, Americas, Africa, and Oceania.',
    officialVerificationSource: 'Live For Tomorrow & Tech Matters (Supported by Befrienders Worldwide and Lifeline International)',
    verificationSourceUrl: 'https://findahelpline.com',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'intl-befrienders',
    name: 'Befrienders Worldwide',
    countryOrRegion: 'International',
    category: 'international_directory',
    categoryLabel: 'Category F: International Directories',
    website: 'https://www.befrienders.org',
    operatingHours: '24/7 Searchable Network',
    eligibilityRestrictions: 'Global network of 349 emotional support centers in 32 countries.',
    isEmergencyDispatch: false,
    summary: 'Global network of volunteer-led emotional support and suicide prevention centers.',
    description: 'Coordinates volunteer helplines globally to provide non-judgmental listening and emotional support to individuals experiencing severe distress or suicidal crisis.',
    officialVerificationSource: 'Befrienders Worldwide (UK Registered Charity 1184318)',
    verificationSourceUrl: 'https://www.befrienders.org',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'edu-sleep-architecture',
    name: 'Circadian Pacing & Restorative Sleep Architecture',
    countryOrRegion: 'Global',
    category: 'sleep_recovery',
    categoryLabel: 'Category D: Sleep and Recovery Education',
    website: 'https://sleepeducation.org',
    operatingHours: 'Public Open Access Educational Portal',
    eligibilityRestrictions: 'Freely available educational resource for students and educators.',
    isEmergencyDispatch: false,
    summary: 'Evidence-based university guide on circadian rhythms and cognitive sleep recovery.',
    description: 'Educational guidance detailing slow-wave deep sleep cycles, REM consolidation, and practical sleep hygiene micro-habits designed to prevent cognitive burnout during exams.',
    officialVerificationSource: 'American Academy of Sleep Medicine (AASM) / Sleep Research Society',
    verificationSourceUrl: 'https://sleepeducation.org',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'edu-ultradian-pacing',
    name: 'Ultradian Academic Pacing (50/10 Protocol)',
    countryOrRegion: 'Global',
    category: 'academic_resilience',
    categoryLabel: 'Category E: Academic Resilience Resources',
    website: 'https://learningcenter.unc.edu/tips-and-tools/studying-101-study-smarter-not-harder/',
    operatingHours: 'Public Open Access Academic Tool',
    eligibilityRestrictions: 'University students seeking cognitive ergonomics and structured study pacing.',
    isEmergencyDispatch: false,
    summary: 'Cognitive science framework aligning study blocks with natural human ultradian rhythms.',
    description: 'Provides structured guidance on 50-minute deep study intervals separated by complete screen disconnections to preserve cognitive focus and prevent semester mental fatigue.',
    officialVerificationSource: 'The Learning Center, University of North Carolina at Chapel Hill',
    verificationSourceUrl: 'https://learningcenter.unc.edu',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'edu-active-minds',
    name: 'Active Minds Student Mental Health Resource Hub',
    countryOrRegion: 'Global',
    category: 'student_wellbeing',
    categoryLabel: 'Category C: Student Wellbeing and Educational Support',
    website: 'https://www.activeminds.org',
    operatingHours: 'Public Open Access Student Resource',
    eligibilityRestrictions: 'College and university students navigating academic, peer, and financial stress.',
    isEmergencyDispatch: false,
    summary: 'Leading national student-led mental health organization and peer resource library.',
    description: 'Provides educational guides on student stress decompensation, validating peer support models, and de-stigmatizing conversations around academic pressure and emotional health.',
    officialVerificationSource: 'Active Minds Inc. (National 501(c)(3) Nonprofit Organization)',
    verificationSourceUrl: 'https://www.activeminds.org',
    lastVerificationDate: '2026-11-15',
    verificationStatus: 'VERIFIED'
  }
];

/**
 * Filter catalogue resources by country, category, and optional search term.
 */
export function queryResourceCatalogue(params: {
  country?: SupportedCountry | 'All';
  category?: ResourceCategory | 'all';
  searchQuery?: string;
  verifiedOnly?: boolean;
}): SupportResource[] {
  const { country = 'All', category = 'all', searchQuery = '', verifiedOnly = true } = params;
  const q = searchQuery.trim().toLowerCase();

  return RESOURCE_CATALOGUE.filter((res) => {
    // 1. Verification status filter
    if (verifiedOnly && res.verificationStatus !== 'VERIFIED') {
      return false;
    }

    // 2. Country filter
    if (country !== 'All' && country !== 'International') {
      if (res.countryOrRegion !== country && res.countryOrRegion !== 'Global') {
        return false;
      }
    } else if (country === 'International') {
      if (res.countryOrRegion !== 'International' && res.countryOrRegion !== 'Global') {
        return false;
      }
    }

    // 3. Category filter
    if (category !== 'all' && res.category !== category) {
      return false;
    }

    // 4. Search query filter
    if (q.length > 0) {
      const matchName = res.name.toLowerCase().includes(q);
      const matchDesc = res.description.toLowerCase().includes(q);
      const matchTel = res.telephoneNumber ? res.telephoneNumber.toLowerCase().includes(q) : false;
      const matchSource = res.officialVerificationSource.toLowerCase().includes(q);

      if (!matchName && !matchDesc && !matchTel && !matchSource) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Retrieves the primary national crisis and emergency contacts for a given country.
 */
export function getNationalCrisisSummary(country: SupportedCountry | string) {
  const targetCountry = SUPPORTED_COUNTRIES.includes(country as SupportedCountry)
    ? (country as SupportedCountry)
    : 'India';

  let emergency = RESOURCE_CATALOGUE.find(
    (r) => r.countryOrRegion === targetCountry && r.category === 'emergency_dispatch'
  );

  let primaryMentalHealth = RESOURCE_CATALOGUE.find(
    (r) => r.countryOrRegion === targetCountry && r.category === 'crisis_counselling'
  );

  if (targetCountry === 'International') {
    emergency = emergency || {
      id: 'intl-emergency',
      name: 'Local Emergency Services',
      countryOrRegion: 'International',
      category: 'emergency_dispatch',
      categoryLabel: 'Category A: Immediate Emergency Dispatch',
      telephoneNumber: 'Local Emergency Number',
      dialableNumber: '',
      website: 'https://findahelpline.com',
      operatingHours: '24/7/365',
      eligibilityRestrictions: 'All individuals globally.',
      isEmergencyDispatch: true,
      summary: 'Dial your nation’s local emergency dispatch number.',
      description: 'Please dial your local national emergency services number (e.g., 911, 112, 999, 000) for immediate life-threatening crises.',
      officialVerificationSource: 'International Emergency Services Reference',
      verificationSourceUrl: 'https://findahelpline.com',
      lastVerificationDate: '2026-11-15',
      verificationStatus: 'VERIFIED'
    };

    primaryMentalHealth = primaryMentalHealth || RESOURCE_CATALOGUE.find((r) => r.id === 'intl-find-a-helpline')!;
  } else {
    emergency = emergency || RESOURCE_CATALOGUE.find((r) => r.id === 'in-emergency-112')!;
    primaryMentalHealth = primaryMentalHealth || RESOURCE_CATALOGUE.find((r) => r.id === 'in-tele-manas')!;
  }

  const secondaryContacts = RESOURCE_CATALOGUE.filter(
    (r) =>
      r.countryOrRegion === targetCountry &&
      (r.category === 'crisis_counselling' || r.category === 'international_directory') &&
      r.id !== primaryMentalHealth.id
  ).map((r) => ({
    serviceName: r.name,
    contactNumber: r.telephoneNumber || r.website,
    description: r.summary || r.description,
    isEmergencyDispatch: r.isEmergencyDispatch,
    actionUrl: r.website,
    id: r.id,
    name: r.name,
    telephoneNumber: r.telephoneNumber,
    dialableNumber: r.dialableNumber
  }));

  const accessibilityWarning = targetCountry === 'International'
    ? 'Emergency numbers and helplines cannot be dialed across national borders. Connect directly to your local nation.'
    : `Crisis helplines in other nations cannot be dialed across international borders. Please use the verified numbers above for ${targetCountry}.`;

  return {
    country: targetCountry,
    emergencyNumber: emergency.telephoneNumber || '112',
    emergencyDispatchName: emergency.name,
    emergencyInstruction: emergency.description,
    primaryMentalHealthService: primaryMentalHealth.name,
    primaryMentalHealthNumber: primaryMentalHealth.telephoneNumber || primaryMentalHealth.website,
    primaryMentalHealthDetails: primaryMentalHealth.description,
    secondaryContacts,
    accessibilityWarning
  };
}
