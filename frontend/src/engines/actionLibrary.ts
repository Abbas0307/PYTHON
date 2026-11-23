/**
 * src/engines/actionLibrary.ts
 * Curated, typed library of 30 distinct collegiate actions for the Smart Action Planner.
 * 
 * Categories (5 distinct actions each):
 *   1. Study & Focus
 *   2. Sleep Routine
 *   3. Relaxation
 *   4. Daily Movement
 *   5. Personal Routine
 *   6. Time Management
 * 
 * STRICT PRIVACY & SAFETY RULES:
 *   - Practical, bite-sized collegiate habits only.
 *   - Zero medical prescriptions, supplement advice, or diagnostic assertions.
 *   - Never advocates sleep reduction for academic output.
 */

import type { PlannerAction } from '../contracts/plannerContract.ts';

export const ACTION_LIBRARY: PlannerAction[] = [
  // ==========================================
  // CATEGORY 1: STUDY & FOCUS (5 actions)
  // ==========================================
  {
    id: 'act-study-pomodoro-25',
    title: '25-Minute Focused Study Sprint',
    shortDescription: 'One focused sprint with notifications silenced, followed by a 5-minute break.',
    category: 'Study & Focus',
    estimatedDuration: 25,
    difficulty: 'easy',
    triggerRule: 'LOW_STUDY_SATISFACTION',
    instructions: [
      'Choose one single assignment or reading chapter to work on.',
      'Silence non-essential phone and browser notifications.',
      'Set a timer for 25 minutes and work with singular attention.',
      'When the timer rings, stop immediately and take a 5-minute breather.'
    ],
    safetyOrSuitabilityNote: 'If you feel mental fatigue before 25 minutes, stop and rest. High intensity is not required.',
    rationaleTemplate: 'Structured, short focus sessions build academic momentum without mental exhaustion.'
  },
  {
    id: 'act-study-three-priorities',
    title: 'Top-3 Academic Priorities Triage',
    shortDescription: 'Select and write down the top three tasks that will genuinely advance your week.',
    category: 'Study & Focus',
    estimatedDuration: 10,
    difficulty: 'easy',
    triggerRule: 'HIGH_ACADEMIC_PRESSURE',
    instructions: [
      'Open your notebook or task app.',
      'Review your current upcoming deadlines and assignments.',
      'Pick strictly three tasks that are high-impact or due soonest.',
      'Mark everything else as secondary until these three have clear progress.'
    ],
    safetyOrSuitabilityNote: 'Resist the urge to add a fourth task today. Scoping prevents cognitive overwhelm.',
    rationaleTemplate: 'Pruning tasks down to three tangible items reduces deadline paralysis.'
  },
  {
    id: 'act-study-active-recall-15',
    title: '15-Minute Concept Self-Quiz',
    shortDescription: 'Test yourself on three core lecture concepts from memory without looking at notes first.',
    category: 'Study & Focus',
    estimatedDuration: 15,
    difficulty: 'moderate',
    triggerRule: 'GOAL_STUDY_CONSISTENCY',
    instructions: [
      'Select a single topic from your recent lecture or seminar.',
      'Close your textbook and slides.',
      'Write down on a blank page or say aloud the key mechanism or formula.',
      'Reopen notes for 2 minutes to check for gaps and verify understanding.'
    ],
    safetyOrSuitabilityNote: 'Focus on understanding core intuition rather than rote verbatim memorization.',
    rationaleTemplate: 'Active recall strengthens long-term concept retention in shorter time spans.'
  },
  {
    id: 'act-study-desk-declutter',
    title: 'Visual Study Space Reset',
    shortDescription: 'Clear clutter, old food containers, and unrelated tabs from your study desk.',
    category: 'Study & Focus',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_STUDY_SATISFACTION',
    instructions: [
      'Remove empty cups, food wrappers, and scattered scraps of paper.',
      'Close all browser tabs that are not related to your immediate task.',
      'Place only the notebook, pen, and textbook needed for your next study block.',
      'Wipe down your desktop surface.'
    ],
    safetyOrSuitabilityNote: 'A clear physical field of view reduces background attentional competition.',
    rationaleTemplate: 'Removing visual distractions reduces cognitive friction when sitting down to study.'
  },
  {
    id: 'act-study-chunk-milestone',
    title: 'Deconstruct a Large Assignment',
    shortDescription: 'Break a multi-page essay or semester project into 4 bite-sized sub-deliverables.',
    category: 'Study & Focus',
    estimatedDuration: 15,
    difficulty: 'moderate',
    triggerRule: 'HIGH_ACADEMIC_PRESSURE',
    instructions: [
      'Identify the intimidating assignment that has been causing stress.',
      'Write down: 1) Outline & thesis, 2) Source gathering, 3) Draft section 1, 4) Draft section 2.',
      'Assign an estimated 30-minute block to just the very first sub-deliverable.',
      'Ignore steps 2 through 4 for today.'
    ],
    safetyOrSuitabilityNote: 'Focus strictly on starting step 1. You do not need to finish the whole project today.',
    rationaleTemplate: 'Deconstructing complex coursework into small steps makes large deadlines approachable.'
  },

  // ==========================================
  // CATEGORY 2: SLEEP ROUTINE (5 actions)
  // ==========================================
  {
    id: 'act-sleep-digital-sundown',
    title: '30-Minute Screen Wind-Down',
    shortDescription: 'Switch off computer and phone screens 30 minutes before your planned bedtime.',
    category: 'Sleep Routine',
    estimatedDuration: 30,
    difficulty: 'moderate',
    triggerRule: 'LOW_SLEEP_QUALITY',
    instructions: [
      'Set an alarm 30 minutes before your target bedtime labeled "Screen Sunset".',
      'Plug your phone in to charge away from arm’s reach of your bed.',
      'Switch computer display to standby.',
      'Engage in a non-screen activity: paper reading, sketching, or light stretching.'
    ],
    safetyOrSuitabilityNote: 'Minimizing blue light and notifications helps the brain produce natural melatonin.',
    rationaleTemplate: 'Diminishing screen stimulation primes natural circadian rhythms for deeper sleep.'
  },
  {
    id: 'act-sleep-brain-dump',
    title: 'Bedtime Worry & Task Journal',
    shortDescription: 'Jot down racing thoughts and tomorrow’s tasks on paper so your mind can rest.',
    category: 'Sleep Routine',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_SLEEP_QUALITY',
    instructions: [
      'Keep a paper notepad and pen by your bed or desk.',
      'Before turning off lights, write down anything you are afraid of forgetting tomorrow.',
      'Write down your top 2 priorities for tomorrow morning.',
      'Close the notepad and remind yourself: "These are captured; I can rest tonight."'
    ],
    safetyOrSuitabilityNote: 'This is an organizational exercise, not psychological therapy.',
    rationaleTemplate: 'Externalizing unfinished thoughts onto paper reduces pre-sleep cognitive arousal.'
  },
  {
    id: 'act-sleep-warm-beverage',
    title: 'Calming Herbal Tea or Warm Water',
    shortDescription: 'Enjoy a warm cup of chamomile, peppermint, or warm water 45 minutes before sleep.',
    category: 'Sleep Routine',
    estimatedDuration: 10,
    difficulty: 'easy',
    triggerRule: 'GOAL_SLEEP_ROUTINE',
    instructions: [
      'Brew a caffeine-free tea (e.g. chamomile, mint, or rooibos) or warm water.',
      'Sip slowly without checking social media or emails.',
      'Let the warm beverage signal to your nervous system that the work day is finished.'
    ],
    safetyOrSuitabilityNote: 'Herbal infusions are optional comfort rituals, not medical treatments for sleep disorders. Avoid caffeine within 6 hours of sleep. If you have botanical allergies, dietary sensitivities, or medication-related concerns, choose plain warm water or consult a healthcare professional.',
    rationaleTemplate: 'Warm, non-caffeinated beverages provide a sensory transition toward bedtime relaxation.'
  },
  {
    id: 'act-sleep-room-ventilation',
    title: 'Sleep Sanctuary Cool & Dark Prep',
    shortDescription: 'Cool down your bedroom and block out stray light for optimal sleep architecture.',
    category: 'Sleep Routine',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_SLEEP_QUALITY',
    instructions: [
      'Crack a window for 5 minutes for fresh air, or set thermostat slightly cooler (18–20°C / 65–68°F).',
      'Draw blackout curtains or close blinds tightly.',
      'Cover or turn away bright LED charging indicators in your sleeping area.'
    ],
    safetyOrSuitabilityNote: 'Human core body temperature must drop slightly to initiate restful deep sleep.',
    rationaleTemplate: 'A dark, cool sleeping environment minimizes nocturnal waking and supports restorative sleep.'
  },
  {
    id: 'act-sleep-consistent-wake',
    title: 'Consistent Morning Anchor Commitment',
    shortDescription: 'Commit to waking up within the same 30-minute window tomorrow morning.',
    category: 'Sleep Routine',
    estimatedDuration: 5,
    difficulty: 'moderate',
    triggerRule: 'GOAL_SLEEP_ROUTINE',
    instructions: [
      'Select a realistic wake-up time for tomorrow.',
      'Set a single alarm and place the alarm device across the room.',
      'Commit to getting out of bed within 3 minutes of the alarm.',
      'Upon waking, open the curtains immediately to let natural light hit your eyes.'
    ],
    safetyOrSuitabilityNote: 'Do not drastically shift your wake time by more than 1 hour in a single day.',
    rationaleTemplate: 'Anchor wake times entrain your circadian rhythm for more reliable evening sleepiness.'
  },

  // ==========================================
  // CATEGORY 3: RELAXATION (5 actions)
  // ==========================================
  {
    id: 'act-relax-box-breathing',
    title: '5-Minute Box Breathing Reset',
    shortDescription: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat for 5 calming cycles.',
    category: 'Relaxation',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'HIGH_ACADEMIC_PRESSURE',
    instructions: [
      'Sit comfortably in your chair with your feet flat on the floor.',
      'Inhale slowly through your nose for 4 counts.',
      'Gently hold your breath for 4 counts.',
      'Exhale smoothly through your mouth for 4 counts.',
      'Hold the empty breath for 4 counts. Repeat for 4–5 cycles.'
    ],
    safetyOrSuitabilityNote: 'Breathe gently and naturally. If you feel lightheaded, return to normal breathing.',
    rationaleTemplate: 'Controlled pacing of respiration stimulates parasympathetic vagal tone and lowers acute tension.'
  },
  {
    id: 'act-relax-body-scan',
    title: '5-Minute Progressive Muscle Release',
    shortDescription: 'Consciously tense and release your shoulders, neck, and jaw muscles.',
    category: 'Relaxation',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_DAILY_ENERGY',
    instructions: [
      'Raise your shoulders up toward your ears for 5 seconds.',
      'Drop your shoulders completely and exhale with a sigh.',
      'Unclench your jaw and let your tongue rest away from the roof of your mouth.',
      'Release the furrow in your brow and take 3 deep, slow breaths.'
    ],
    safetyOrSuitabilityNote: 'Do not strain muscles; apply gentle, comfortable pressure only.',
    rationaleTemplate: 'Releasing physical muscle bracing helps alleviate study-induced neck and shoulder stiffness.'
  },
  {
    id: 'act-relax-sensory-grounding',
    title: '5-4-3-2-1 Sensory Grounding Break',
    shortDescription: 'Ground your attention into the present physical environment using your five senses.',
    category: 'Relaxation',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'GOAL_TAKE_BREAKS',
    instructions: [
      'Look around your study space: notice 5 things you can see.',
      'Feel your surroundings: notice 4 things you can physically touch.',
      'Listen closely: identify 3 distinct sounds in your environment.',
      'Notice 2 things you can smell or taste.',
      'Notice 1 positive physical sensation (e.g. warmth of clothing, chair support).'
    ],
    safetyOrSuitabilityNote: 'A gentle mental reset tool when studying feels overwhelming.',
    rationaleTemplate: 'Sensory orientation shifts mental focus away from spiraling academic worries into reality.'
  },
  {
    id: 'act-relax-music-immersion',
    title: '10-Minute Lo-Fi or Ambient Pause',
    shortDescription: 'Listen to ambient, classical, or lo-fi instrumental tracks with closed eyes.',
    category: 'Relaxation',
    estimatedDuration: 10,
    difficulty: 'easy',
    triggerRule: 'GOAL_TAKE_BREAKS',
    instructions: [
      'Put on headphones with peaceful, non-lyrical music.',
      'Lean back in your chair or lie back on a couch.',
      'Close your eyes and focus strictly on the melodies and tempo.',
      'Do not multitask, browse social feeds, or read coursework during this track.'
    ],
    safetyOrSuitabilityNote: 'Keep volume at a comfortable, hearing-safe level.',
    rationaleTemplate: 'Non-verbal auditory relaxation allows working memory to clear cognitive fatigue.'
  },
  {
    id: 'act-relax-nature-gazing',
    title: '20-20-20 Eye & Sky Rest Break',
    shortDescription: 'Look 20 feet away out a window for 20 seconds to relax ciliary eye muscles.',
    category: 'Relaxation',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_DAILY_ENERGY',
    instructions: [
      'Pause your computer screen work.',
      'Look out the nearest window at the furthest tree, building, or cloud.',
      'Hold your soft gaze into the distance for at least 20–30 seconds.',
      'Blink deliberately 10 times to rehydrate your eyes.'
    ],
    safetyOrSuitabilityNote: 'Reduces digital eye strain and dry-eye symptoms caused by prolonged monitor staring.',
    rationaleTemplate: 'Relaxing visual accommodation eases optic muscle fatigue during intense study sessions.'
  },

  // ==========================================
  // CATEGORY 4: DAILY MOVEMENT (5 actions)
  // ==========================================
  {
    id: 'act-move-campus-stroll',
    title: '10-Minute Outdoor Fresh Air Walk',
    shortDescription: 'Step outside your library or dorm for a quick 10-minute stroll around the quad.',
    category: 'Daily Movement',
    estimatedDuration: 10,
    difficulty: 'easy',
    triggerRule: 'LOW_DAILY_ENERGY',
    instructions: [
      'Put on comfortable shoes and step outdoors.',
      'Walk at a comfortable, leisurely pace for 5 minutes in one direction.',
      'Notice the temperature and breeze on your skin.',
      'Turn around and walk back to your study area feeling refreshed.'
    ],
    safetyOrSuitabilityNote: 'Dress appropriately for the weather. Stroll at your own comfortable pace.',
    rationaleTemplate: 'Brief daylight and gentle ambulation stimulate cerebral blood flow and alertness.'
  },
  {
    id: 'act-move-spine-mobility',
    title: 'Desk Spine Mobility & Hip Stretch',
    shortDescription: 'Gentle standing stretches to reverse seated forward-head and hunched postures.',
    category: 'Daily Movement',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_DAILY_ENERGY',
    instructions: [
      'Stand up tall behind your desk.',
      'Interlace fingers behind your lower back and gently open your chest.',
      'Place hands on hips and do 5 slow hip circles in each direction.',
      'Reach both arms overhead and lean gently left, then right.'
    ],
    safetyOrSuitabilityNote: 'Move gently within your comfortable range of motion. Never force a stretch.',
    rationaleTemplate: 'Decompressing prolonged sitting relieves spinal pressure and improves thoracic mobility.'
  },
  {
    id: 'act-move-stair-climb',
    title: 'Quick 2-Flight Stair Exploration',
    shortDescription: 'Opt for the stairs instead of the elevator to get a quick boost of blood circulation.',
    category: 'Daily Movement',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'GOAL_BALANCED_ROUTINE',
    instructions: [
      'When moving between library floors or dorm levels, take the stairs.',
      'Climb at a steady, rhythmic pace.',
      'Take deep, smooth breaths as you reach the top landing.',
      'Feel your heart rate increase gently.'
    ],
    safetyOrSuitabilityNote: 'Use handrails for balance. Skip if experiencing knee discomfort.',
    rationaleTemplate: 'Short bouts of vertical movement activate large lower-body muscles and boost circulation.'
  },
  {
    id: 'act-move-wrist-finger-stretch',
    title: 'Typing & Mouse Wrist Decompression',
    shortDescription: 'Stretch forearms, wrists, and fingers to counter repetitive typing fatigue.',
    category: 'Daily Movement',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'HIGH_ACADEMIC_PRESSURE',
    instructions: [
      'Extend right arm forward with palm facing out, fingers up.',
      'Use left hand to gently pull fingers back toward you for 15 seconds.',
      'Point fingers down and gently press the back of hand for 15 seconds.',
      'Repeat on the left arm, then shake out both hands loosely.'
    ],
    safetyOrSuitabilityNote: 'Gentle tension only. Stops repetitive strain injury (RSI) stiffness.',
    rationaleTemplate: 'Targeted wrist stretches relieve tendon tension accumulated from prolonged typing.'
  },
  {
    id: 'act-move-hydration-walk',
    title: 'Stand-and-Refill Water Mission',
    shortDescription: 'Walk to the nearest water fountain to drink a full glass and refill your bottle.',
    category: 'Daily Movement',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_ROUTINE_BALANCE',
    instructions: [
      'Stand up from your desk with your empty water bottle.',
      'Walk to the nearest hydration station or kitchen.',
      'Drink 250ml (one cup) of water on the spot.',
      'Refill the bottle to full and carry it back to your workspace.'
    ],
    safetyOrSuitabilityNote: 'Hydration supports mental clarity and prevents mild dehydration headaches.',
    rationaleTemplate: 'Combining physical steps with hydration counters study inertia and brain fog.'
  },

  // ==========================================
  // CATEGORY 5: PERSONAL ROUTINE (5 actions)
  // ==========================================
  {
    id: 'act-routine-morning-intention',
    title: '3-Minute Morning Pace Check-In',
    shortDescription: 'Take 3 quiet minutes before checking emails to set a calm mental intention for today.',
    category: 'Personal Routine',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_ROUTINE_BALANCE',
    instructions: [
      'Before opening email, social media, or lecture portals, sit quietly.',
      'Ask yourself: "What pace do I need to keep today to remain sustainable?"',
      'Choose one guiding word (e.g. "steady", "focused", "patient", "organized").',
      'Take one deep breath and begin your morning activities.'
    ],
    safetyOrSuitabilityNote: 'Non-judgmental self-reflection to start your day with agency.',
    rationaleTemplate: 'Intentional morning pacing protects against reactive anxiety from early notifications.'
  },
  {
    id: 'act-routine-screen-free-meal',
    title: 'Screen-Free Nourishment Pause',
    shortDescription: 'Eat lunch or dinner without watching videos or checking coursework updates.',
    category: 'Personal Routine',
    estimatedDuration: 20,
    difficulty: 'moderate',
    triggerRule: 'LOW_ROUTINE_BALANCE',
    instructions: [
      'Prepare or collect your meal.',
      'Close laptop lids and place your phone screen-down or in your pocket.',
      'Focus on the taste, texture, and aroma of your food.',
      'Notice your fullness cues without digital distraction.'
    ],
    safetyOrSuitabilityNote: 'Promotes healthy digestive response and true psychological detachment from work.',
    rationaleTemplate: 'Mindful, screen-free meals allow cognitive circuits to rest and recharge.'
  },
  {
    id: 'act-routine-evening-shutdown',
    title: 'Evening Academic Shutdown Ritual',
    shortDescription: 'Formally declare the study day finished: close all books, tabs, and plan tomorrow.',
    category: 'Personal Routine',
    estimatedDuration: 10,
    difficulty: 'moderate',
    triggerRule: 'HIGH_ACADEMIC_PRESSURE',
    instructions: [
      'At your designated end time (e.g. 8:30 PM), stop working on coursework.',
      'Save all documents and close school tabs.',
      'Pack your backpack with tomorrow’s materials.',
      'Say aloud or to yourself: "Work is concluded for today. The rest of the night belongs to recovery."'
    ],
    safetyOrSuitabilityNote: 'Creating a firm boundary between study time and rest time prevents burnout.',
    rationaleTemplate: 'Clear psychological demarcation signals the brain that academic vigilance is complete.'
  },
  {
    id: 'act-routine-social-connection',
    title: 'Brief Check-In With a Friend or Peer',
    shortDescription: 'Send a quick text or share a 5-minute coffee chat with a friend or family member.',
    category: 'Personal Routine',
    estimatedDuration: 10,
    difficulty: 'easy',
    triggerRule: 'GOAL_BALANCED_ROUTINE',
    instructions: [
      'Think of a classmate, friend, or family member you haven’t spoken with recently.',
      'Send a casual text: "Hey! Thinking of you, hope your week is going well."',
      'Or take a 10-minute stroll to grab a tea together.',
      'Talk about life outside of grades and exams.'
    ],
    safetyOrSuitabilityNote: 'Human connection is an essential pillar of collegiate resilience.',
    rationaleTemplate: 'Brief social touchpoints prevent academic isolation and broaden emotional perspective.'
  },
  {
    id: 'act-routine-room-air-sunlight',
    title: 'Morning Natural Light Exposure',
    shortDescription: 'Get 10 minutes of direct outdoor or window sunlight within an hour of waking.',
    category: 'Personal Routine',
    estimatedDuration: 10,
    difficulty: 'easy',
    triggerRule: 'LOW_DAILY_ENERGY',
    instructions: [
      'Within 30–60 minutes of waking up, step near a bright window or step outside.',
      'Let natural daylight reach your eyes without staring directly at the sun.',
      'Breathe in the morning air for 5–10 minutes.',
      'Feel your natural alertness signal turn on.'
    ],
    safetyOrSuitabilityNote: 'Do not look directly at the sun. Ambient daylight through clouds is sufficient.',
    rationaleTemplate: 'Morning photons trigger cortisol awakening response, boosting daytime alertness.'
  },

  // ==========================================
  // CATEGORY 6: TIME MANAGEMENT (5 actions)
  // ==========================================
  {
    id: 'act-time-block-tomorrow',
    title: 'Calendar Time-Blocking for Hardest Task',
    shortDescription: 'Schedule a protected 60-minute window for your most demanding course tomorrow.',
    category: 'Time Management',
    estimatedDuration: 10,
    difficulty: 'moderate',
    triggerRule: 'HIGH_ACADEMIC_PRESSURE',
    instructions: [
      'Open your calendar or weekly planner.',
      'Identify your most challenging upcoming assignment or reading.',
      'Block out a 60-minute appointment tomorrow morning when your energy is highest.',
      'Treat this block with the same commitment as an in-person lecture.'
    ],
    safetyOrSuitabilityNote: 'Keep blocks realistic (45–60 mins). Never schedule back-to-back blocks without breaks.',
    rationaleTemplate: 'Pre-scheduling difficult tasks protects them from procrastination and task-switching.'
  },
  {
    id: 'act-time-two-minute-rule',
    title: '2-Minute Admin Task Blitz',
    shortDescription: 'Knock out 3 tiny administrative tasks (replying to email, uploading a file, printing a paper).',
    category: 'Time Management',
    estimatedDuration: 10,
    difficulty: 'easy',
    triggerRule: 'LOW_STUDY_SATISFACTION',
    instructions: [
      'Look at your inbox or to-do list for tasks that take under 2 minutes.',
      'Pick up to 3 of them (e.g. submit confirmation, reply to professor, download lecture slides).',
      'Execute them back-to-back in 6 minutes.',
      'Cross them off your list and enjoy the mental clutter relief.'
    ],
    safetyOrSuitabilityNote: 'Stop after 3 tasks to avoid falling into productive procrastination.',
    rationaleTemplate: 'Clearing micro-tasks removes low-grade mental friction from lingering admin to-dos.'
  },
  {
    id: 'act-time-buffer-allocation',
    title: 'Add 15-Minute Buffers Between Study Blocks',
    shortDescription: 'Schedule 15 minutes of unoccupied buffer time between study sessions or lectures.',
    category: 'Time Management',
    estimatedDuration: 5,
    difficulty: 'easy',
    triggerRule: 'LOW_ROUTINE_BALANCE',
    instructions: [
      'Examine your daily schedule.',
      'Look for back-to-back meetings, study blocks, or lectures.',
      'Insert a 15-minute transition cushion between them.',
      'Use this cushion strictly for walking, stretching, or restroom breaks.'
    ],
    safetyOrSuitabilityNote: 'Prevents the cascading rush and late arrivals that elevate daily stress.',
    rationaleTemplate: 'Buffer time absorbs unexpected delays and prevents schedule compression stress.'
  },
  {
    id: 'act-time-deadline-mapping',
    title: 'Visual 7-Day Deadline Horizon Map',
    shortDescription: 'Write out all deadlines for the next 7 days in chronological order on one sticky note.',
    category: 'Time Management',
    estimatedDuration: 10,
    difficulty: 'easy',
    triggerRule: 'HIGH_ACADEMIC_PRESSURE',
    instructions: [
      'Take a single sticky note or 3x5 index card.',
      'Write down: Mon, Tue, Wed, Thu, Fri, Sat, Sun.',
      'Write only the items with firm due dates or exam times.',
      'Post the card next to your monitor so there are no surprises.'
    ],
    safetyOrSuitabilityNote: 'Keeps future anxiety contained to a predictable 7-day visible horizon.',
    rationaleTemplate: 'A visible chronological horizon stops anxiety about forgotten assignments.'
  },
  {
    id: 'act-time-say-no-triage',
    title: 'Protect Your Study Boundaries',
    shortDescription: 'Politely decline or postpone one optional, non-essential commitment this week.',
    category: 'Time Management',
    estimatedDuration: 5,
    difficulty: 'moderate',
    triggerRule: 'HIGH_ACADEMIC_PRESSURE',
    instructions: [
      'Review any extra meetings, social obligations, or favors you have agreed to.',
      'Identify one that is draining your limited study and rest capacity.',
      'Send a courteous message: "Thank you for thinking of me! With upcoming deadlines this week, I won’t be able to join, but hope to catch up next week."',
      'Reclaim that time for sleep or core coursework.'
    ],
    safetyOrSuitabilityNote: 'Saying no to non-essentials is a healthy collegiate life skill, not selfish.',
    rationaleTemplate: 'Protecting time boundaries preserves essential sleep and study capacity.'
  }
];

/**
 * Quick lookup map for actions by ID.
 */
export const ACTION_BY_ID = new Map<string, PlannerAction>(
  ACTION_LIBRARY.map((a) => [a.id, a])
);
