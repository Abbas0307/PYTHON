/**
 * src/engines/crisisDirectory.ts
 * Authoritative National & Regional Crisis Directory.
 * Strictly segregated from ML inference.
 */

export interface CrisisContact {
  serviceName: string;
  contactNumber: string;
  description: string;
  isEmergencyDispatch: boolean;
  actionUrl?: string;
}

export interface NationalCrisisInfo {
  country: string;
  emergencyNumber: string;
  emergencyDispatchName: string;
  emergencyInstruction: string;
  primaryMentalHealthService: string;
  primaryMentalHealthNumber: string;
  primaryMentalHealthDetails: string;
  secondaryContacts: CrisisContact[];
  regionalNotice?: string;
  accessibilityWarning: string;
}

export const NATIONAL_CRISIS_DIRECTORY: Record<string, NationalCrisisInfo> = {
  India: {
    country: 'India',
    emergencyNumber: '112',
    emergencyDispatchName: 'National Emergency Services (Police, Fire, Ambulance)',
    emergencyInstruction: 'Call 112 for immediate danger to life, including life-threatening mental-health crises or medical emergencies in India.',
    primaryMentalHealthService: 'Tele-MANAS (Govt. of India MoHFW DGHS)',
    primaryMentalHealthNumber: '14416 / 1800-89-14416',
    primaryMentalHealthDetails: '24/7 Toll-Free National Mental Health Helpline operated by the Ministry of Health and Family Welfare, available in 20+ languages.',
    secondaryContacts: [
      {
        serviceName: 'KIRAN National Mental Health Helpline',
        contactNumber: '1800-599-0019',
        description: '24/7 mental health rehabilitation and emotional support helpline.',
        isEmergencyDispatch: false
      },
      {
        serviceName: 'Vandrevala Foundation Helpline',
        contactNumber: '+91 9999 666 555',
        description: '24/7 free mental health counseling by professional psychologists.',
        isEmergencyDispatch: false
      }
    ],
    accessibilityWarning: 'Crisis helplines in other nations (such as US 988 or UK 111) cannot be dialed from India. Please use the verified Indian numbers above.'
  },
  'United States': {
    country: 'United States',
    emergencyNumber: '911',
    emergencyDispatchName: 'General Emergency Services (Police, Fire, Ambulance)',
    emergencyInstruction: 'Call 911 for immediate danger to life. 911 is general emergency dispatch, whereas 988 is dedicated to mental-health crisis support.',
    primaryMentalHealthService: '988 Suicide & Crisis Lifeline',
    primaryMentalHealthNumber: 'Call or Text 988',
    primaryMentalHealthDetails: '24/7 free and confidential emotional support for anyone experiencing suicidal crisis or emotional distress across the US.',
    secondaryContacts: [
      {
        serviceName: 'Crisis Text Line',
        contactNumber: 'Text HOME to 741741',
        description: 'Free 24/7 crisis counseling via text message.',
        isEmergencyDispatch: false
      },
      {
        serviceName: 'The Trevor Project (LGBTQ Youth)',
        contactNumber: '1-866-488-7386 or Text START to 678-678',
        description: '24/7 suicide prevention and crisis intervention for LGBTQ young people.',
        isEmergencyDispatch: false
      }
    ],
    accessibilityWarning: '988 is a dedicated mental-health crisis lifeline; it is NOT a general emergency number. For immediate danger to life, dial 911.'
  },
  Canada: {
    country: 'Canada',
    emergencyNumber: '911',
    emergencyDispatchName: 'General Emergency Services',
    emergencyInstruction: 'Call 911 for immediate danger to life. 911 is general emergency dispatch; 988 is for mental health crises.',
    primaryMentalHealthService: '988 Suicide Crisis Helpline',
    primaryMentalHealthNumber: 'Call or Text 988',
    primaryMentalHealthDetails: '24/7 nationwide bilingual (English & French) suicide prevention support.',
    secondaryContacts: [
      {
        serviceName: 'Kids Help Phone',
        contactNumber: '1-800-668-6868 or Text 686868',
        description: '24/7 e-mental health services for youth across Canada.',
        isEmergencyDispatch: false
      }
    ],
    accessibilityWarning: '988 is a dedicated crisis helpline; for immediate danger to life, dial 911.'
  },
  'United Kingdom': {
    country: 'United Kingdom',
    emergencyNumber: '999',
    emergencyDispatchName: 'General Emergency Services (Police, Fire, Ambulance)',
    emergencyInstruction: 'Call 999 (or 112) for immediate danger to life. 999 is UK emergency dispatch; NHS 111 is for non-emergency medical advice.',
    primaryMentalHealthService: 'UK Regional NHS / Crisis Pathways',
    primaryMentalHealthNumber: '111 (England, Scotland, Wales) / 0808 808 8000 (Northern Ireland)',
    primaryMentalHealthDetails: 'England: NHS 111 Mental Health Option. Scotland: NHS 24 on 111. Wales: NHS 111 Wales (Option 2). Northern Ireland: Lifeline NI (0808 808 8000).',
    regionalNotice: 'Regional Notice: The England NHS 111 pathway does not operate in Northern Ireland. In NI, contact Lifeline NI (0808 808 8000) or local HSC Trust services.',
    secondaryContacts: [
      {
        serviceName: 'Samaritans (Pan-UK)',
        contactNumber: 'Call 116 123',
        description: '24/7 confidential listening service for anyone in emotional distress.',
        isEmergencyDispatch: false
      },
      {
        serviceName: 'Shout Crisis Text Line',
        contactNumber: 'Text SHOUT to 85258',
        description: '24/7 free, confidential text support across the UK.',
        isEmergencyDispatch: false
      }
    ],
    accessibilityWarning: 'NHS 111 is for non-emergency health advice and triage; it is NOT a general emergency number. For life-threatening emergencies, dial 999.'
  },
  Australia: {
    country: 'Australia',
    emergencyNumber: '000',
    emergencyDispatchName: 'Emergency Services (Triple Zero)',
    emergencyInstruction: 'Call 000 (Triple Zero) for immediate danger to life. Lifeline 13 11 14 is dedicated to mental health crisis support.',
    primaryMentalHealthService: 'Lifeline Australia',
    primaryMentalHealthNumber: 'Call 13 11 14',
    primaryMentalHealthDetails: '24/7 national crisis support and suicide prevention services.',
    secondaryContacts: [
      {
        serviceName: 'Beyond Blue',
        contactNumber: 'Call 1300 22 4636',
        description: '24/7 mental health information and advice across Australia.',
        isEmergencyDispatch: false
      }
    ],
    accessibilityWarning: 'Lifeline 13 11 14 is a crisis helpline; for immediate danger to life, dial 000.'
  },
  International: {
    country: 'International / Other',
    emergencyNumber: 'Local Emergency Number',
    emergencyDispatchName: 'Local Emergency Services',
    emergencyInstruction: 'Please dial your local national emergency services number for immediate life-threatening crises.',
    primaryMentalHealthService: 'Find A Helpline (Global Directory)',
    primaryMentalHealthNumber: 'Visit findahelpline.com',
    primaryMentalHealthDetails: 'Free, confidential support from local crisis lines in over 130 countries.',
    secondaryContacts: [
      {
        serviceName: 'Befrienders Worldwide',
        contactNumber: 'befrienders.org',
        description: 'Global network of emotional support helplines.',
        isEmergencyDispatch: false,
        actionUrl: 'https://www.befrienders.org'
      }
    ],
    accessibilityWarning: 'Emergency numbers and helplines cannot be dialed across national borders. Connect directly to your local nation.'
  }
};
