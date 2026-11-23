/**
 * src/engines/relaxationLibrary.ts
 * Curated Relaxation Activity Collection for Mindora Wellness Studio.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - 100% educational, practical collegiate activities.
 *   - Never claims to cure, treat, or diagnose mental illness.
 *   - Zero recommendation of pharmaceutical supplements or commercial products.
 *   - Includes clear suitability and safety notes for each activity.
 */

import type { RelaxationActivity, RelaxationCategory } from '../contracts/wellnessContract.ts';

export const RELAXATION_ACTIVITIES: RelaxationActivity[] = [
  // ==========================================
  // CATEGORY 1: MINDFUL BREAKS (3 activities)
  // ==========================================
  {
    id: 'rel-mindful-observation',
    title: 'Quiet Object Observation Break',
    description: 'Anchor your attention onto a single everyday object for 5 minutes of focused visual calm.',
    category: 'Mindful Breaks',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Choose a small nearby object (e.g. a pen, a houseplant leaf, a mug, or your keys).',
      'Set aside your phone, study materials, and keyboard.',
      'Gaze at the object as if seeing it for the very first time. Notice its colors, shadows, and contours.',
      'Whenever your thoughts drift toward coursework or deadlines, gently guide attention back to the object.',
      'Take two full, natural breaths before returning to your work.'
    ],
    safetyOrSuitabilityNote: 'This is a gentle attention-anchoring exercise, not psychological meditation therapy.',
    iconName: 'Eye'
  },
  {
    id: 'rel-ambient-sound-listening',
    title: 'Mindful Soundscape Listening',
    description: 'Close your eyes and listen to ambient acoustic layers in your environment without judgment.',
    category: 'Mindful Breaks',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Sit comfortably and soften or close your eyes.',
      'Listen for the most distant sound you can detect (e.g. distant traffic, wind, or birds).',
      'Now listen for sounds closer to you (e.g. a refrigerator hum, a fan, or footsteps in the hallway).',
      'Finally, notice the sound of your own quiet breathing.',
      'Recognize sounds as passing waves of sound energy without labeling them as good or bad.'
    ],
    safetyOrSuitabilityNote: 'If ambient noise in your area is jarring or loud, choose a quieter space or use earplugs.',
    iconName: 'Headphones'
  },
  {
    id: 'rel-screen-free-pause',
    title: '10-Minute Screen-Free Sanctuary',
    description: 'Step away from laptops, tablets, and phones to rest your eyes and mental processing.',
    category: 'Mindful Breaks',
    estimatedDuration: 10,
    difficulty: 'easy',
    instructions: [
      'Place your phone face down and turn off or sleep your monitor.',
      'Stand up and look across the room or out a window at a distant point.',
      'Allow your eyes to relax by blinking softly and letting peripheral vision expand.',
      'Enjoy the absence of notifications, blue light, and algorithmic stimulation for 10 full minutes.'
    ],
    safetyOrSuitabilityNote: 'Regular screen-free intervals reduce ocular fatigue and cognitive overload.',
    iconName: 'MonitorOff'
  },

  // ==========================================
  // CATEGORY 2: CREATIVE ACTIVITIES (3 activities)
  // ==========================================
  {
    id: 'rel-creative-doodling',
    title: 'Non-Judgmental Sketching or Doodling',
    description: 'Let your hand draw flowing shapes, spirals, or patterns on paper without seeking artistic perfection.',
    category: 'Creative Activities',
    estimatedDuration: 10,
    difficulty: 'easy',
    instructions: [
      'Grab a blank sheet of scrap paper and a pen or pencil.',
      'Start drawing continuous lines, gentle waves, or geometric patterns.',
      'Release all expectations of making "art" — focus entirely on the tactile sensation of pen on paper.',
      'Fill half a page with whatever shapes emerge organically.',
      'Set the paper aside with a smile.'
    ],
    safetyOrSuitabilityNote: 'Doodling engages motor-sensory channels and releases hyper-focused cognitive tension.',
    iconName: 'PenTool'
  },
  {
    id: 'rel-gratitude-postcard',
    title: 'Appreciation Micro-Note Writing',
    description: 'Write a brief, private 3-sentence note acknowledging something or someone you appreciate.',
    category: 'Creative Activities',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Think of one small kindness, helpful concept, or comforting moment from this past week.',
      'Write down: 1) What occurred, 2) Why it brought relief or meaning, 3) How you feel thinking about it.',
      'You do not need to send or show this note to anyone; write purely for your own personal reflection.'
    ],
    safetyOrSuitabilityNote: 'Focusing on micro-moments of support cultivates resilience during rigorous study terms.',
    iconName: 'HeartHandshake'
  },
  {
    id: 'rel-study-space-refresh',
    title: 'Tactile Desk & Study Space Reset',
    description: 'Take 7 minutes to clear clutter, wipe your desk surface, and restore order to your immediate workspace.',
    category: 'Creative Activities',
    estimatedDuration: 7,
    difficulty: 'easy',
    instructions: [
      'Gather loose papers and stack them neatly.',
      'Return empty mugs or wrappers to the kitchen or trash bin.',
      'Wipe down your keyboard and desk surface with a cloth.',
      'Place only the single textbook or notebook you need for your next session in the center of your desk.',
      'Appreciate the clean, spacious visual canvas you created.'
    ],
    safetyOrSuitabilityNote: 'External environmental order noticeably reduces subconscious cognitive clutter.',
    iconName: 'Sparkles'
  },

  // ==========================================
  // CATEGORY 3: REST & RECOVERY (3 activities)
  // ==========================================
  {
    id: 'rel-reclined-eye-rest',
    title: '10-Minute Darkened Eye Rest',
    description: 'Recline in your chair with eyes gently covered to release ocular muscular strain.',
    category: 'Rest & Recovery',
    estimatedDuration: 10,
    difficulty: 'easy',
    instructions: [
      'Sit comfortably with your head supported by your chair back or cushion.',
      'Rub your palms together until warm, then cup them gently over your closed eyes without applying pressure.',
      'Allow complete darkness to soothe your optic nerves.',
      'Breathe slowly through your nose for 10 quiet minutes.'
    ],
    safetyOrSuitabilityNote: 'Do not press against the eyeballs. If you wear contact lenses and feel dry, use rewetting drops.',
    iconName: 'Moon'
  },
  {
    id: 'rel-hydration-nourish',
    title: 'Mindful Hydration & Nourishing Sip',
    description: 'Drink a full glass of cool or warm water slowly, feeling the hydration refresh your cells.',
    category: 'Rest & Recovery',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Pour a fresh glass of water.',
      'Hold the glass in both hands and take in its temperature.',
      'Take 5 slow, deliberate sips, pausing between each sip.',
      'Notice the sensation of cool hydration easing dry throat and fatigue.'
    ],
    safetyOrSuitabilityNote: 'Adequate hydration is critical for sustained cognitive attention and cellular metabolism.',
    iconName: 'Droplet'
  },
  {
    id: 'rel-power-recharge-breather',
    title: 'Post-Lecture Cognitive Buffer',
    description: 'Take a 15-minute complete mental buffer between classes or study blocks without consuming media.',
    category: 'Rest & Recovery',
    estimatedDuration: 15,
    difficulty: 'moderate',
    instructions: [
      'Immediately upon concluding an exam or dense lecture, close your notebooks.',
      'Refrain from opening social media, short-form videos, or news feeds.',
      'Sit quietly, look out a window, or stretch your back.',
      'Let your brain consolidate what you learned before demanding new cognitive processing.'
    ],
    safetyOrSuitabilityNote: 'Cognitive consolidation occurs during awake rest periods.',
    iconName: 'Coffee'
  },

  // ==========================================
  // CATEGORY 4: GENTLE MOVEMENT (3 activities)
  // ==========================================
  {
    id: 'rel-desk-stretch-routine',
    title: 'Seated Spine & Shoulder Stretches',
    description: 'Release hunching and neck stiffness caused by extensive laptop use with 5 gentle stretches.',
    category: 'Gentle Movement',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Interlace fingers, invert palms, and gently reach arms overhead toward the ceiling for 10 seconds.',
      'Lower arms and roll your shoulders backward 5 times in slow, wide circles.',
      'Place right hand on left knee and gently twist torso to the left for 3 breaths; repeat on the opposite side.',
      'Tilt right ear toward right shoulder until you feel a gentle neck stretch; hold for 3 breaths; switch sides.',
      'Shake out hands and wrists.'
    ],
    safetyOrSuitabilityNote: 'Never force a twist or pull aggressively on your neck. Keep all movements gentle and pain-free.',
    iconName: 'Activity'
  },
  {
    id: 'rel-wrist-forearm-relief',
    title: 'Typing & Mouse Wrist Relief',
    description: 'Gentle forearm flexor and extensor stretches to relieve keyboard strain.',
    category: 'Gentle Movement',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Extend right arm forward with palm facing away, fingers pointing up.',
      'Use left hand to gently draw right fingers back until a mild stretch is felt in forearm. Hold 15 seconds.',
      'Now point right fingers down, palm facing you, and gently press back of hand for 15 seconds.',
      'Repeat on the left arm.',
      'Rotate both wrists slowly in clockwise and counter-clockwise circles.'
    ],
    safetyOrSuitabilityNote: 'Do not overextend. Stop immediately if you experience sharp nerve pain or numbness.',
    iconName: 'Shield'
  },
  {
    id: 'rel-standing-posture-realignment',
    title: 'Standing Posture & Gravity Reset',
    description: 'Stand tall against a flat wall to realign spinal vertebrae after hours of slouching.',
    category: 'Gentle Movement',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Stand with heels, buttocks, upper back, and back of head lightly contacting a wall.',
      'Gently tuck your chin to lengthen the back of your neck.',
      'Breathe deeply into your diaphragm, feeling your ribcage expand horizontally.',
      'Hold this tall, natural posture for 2 to 3 minutes, taking steady breaths.'
    ],
    safetyOrSuitabilityNote: 'If touching all four points causes strain, step heels slightly forward of the wall.',
    iconName: 'Maximize2'
  },

  // ==========================================
  // CATEGORY 5: OUTDOOR AWARENESS (3 activities)
  // ==========================================
  {
    id: 'rel-fresh-air-walk',
    title: '15-Minute Fresh-Air Walk',
    description: 'Take an unhurried walk outdoors across campus or around your block without checking your phone.',
    category: 'Outdoor Awareness',
    estimatedDuration: 15,
    difficulty: 'easy',
    instructions: [
      'Put on comfortable walking shoes and step outside.',
      'Keep your phone in your pocket on silent mode.',
      'Walk at an easy, leisurely pace.',
      'Notice the temperature of the air on your skin and the rhythm of your footsteps.',
      'Look up at the trees, buildings, and horizon.'
    ],
    safetyOrSuitabilityNote: 'Dress appropriately for the weather. Stay on safe, well-lit sidewalks and pedestrian paths.',
    iconName: 'Compass'
  },
  {
    id: 'rel-sky-observation',
    title: 'Expansive Sky & Horizon Gazing',
    description: 'Broaden your visual field by looking at the open sky and distant clouds for 5 minutes.',
    category: 'Outdoor Awareness',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Step out onto a balcony, patio, or look through an unobstructed open window.',
      'Look up at the sky and notice cloud movements, colors, or stars depending on the time of day.',
      'Allow your eyes to focus on infinity rather than a screen 18 inches away.',
      'Notice how expansive the world is beyond your immediate textbook or assignment.'
    ],
    safetyOrSuitabilityNote: 'Never look directly at the sun. Protect your eyes with sunglasses if midday glare is bright.',
    iconName: 'Sun'
  },
  {
    id: 'rel-greenery-nature-pause',
    title: 'Botanical Observation Pause',
    description: 'Spend 5 minutes observing trees, grass, or flowers in a campus quad or nearby park.',
    category: 'Outdoor Awareness',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Find a patch of grass, a leafy tree, or potted foliage.',
      'Notice the intricate veins on the leaves, the texture of the tree bark, and the varying shades of green.',
      'Take 3 slow breaths of outdoor fresh air.',
      'Feel grounded in the natural rhythms of plant life.'
    ],
    safetyOrSuitabilityNote: 'Brief visual contact with greenery helps reset involuntary attention mechanisms.',
    iconName: 'Feather'
  },

  // ==========================================
  // CATEGORY 6: SOCIAL CONNECTION (3 activities)
  // ==========================================
  {
    id: 'rel-friend-checkin',
    title: 'Brief Friendly Text or Voice Note',
    description: 'Send a quick warm message or voice note to a close friend or family member just to say hello.',
    category: 'Social Connection',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Think of a supportive friend, sibling, or classmate.',
      'Send a brief text: "Hey! Just taking a quick study break and thinking of you. Hope your week is going smoothly!"',
      'Do not expect an immediate reply; sending kindness connects you socially without pressure.'
    ],
    safetyOrSuitabilityNote: 'Keep the interaction light and voluntary. Avoid initiating during heated discussions.',
    iconName: 'MessageCircle'
  },
  {
    id: 'rel-campus-friendly-hello',
    title: 'Mindful Social Presence on Campus',
    description: 'Offer a warm smile or pleasant greeting to campus library staff, a dining worker, or a peer.',
    category: 'Social Connection',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'When ordering food or checking out a library book, make gentle eye contact.',
      'Offer a sincere "Thank you, have a good day."',
      'Notice how small micro-interactions of everyday courtesy warm social connection.'
    ],
    safetyOrSuitabilityNote: 'Micro-connections foster collegiate belonging and reduce feelings of isolation.',
    iconName: 'Smile'
  },
  {
    id: 'rel-study-buddy-checkin',
    title: '5-Minute Study Buddy High-Five',
    description: 'Check in with a classmate to celebrate a completed assignment or swap one encouraging word.',
    category: 'Social Connection',
    estimatedDuration: 5,
    difficulty: 'easy',
    instructions: [
      'Reach out to someone in your cohort or class.',
      'Ask how their studying is going and share 1 small win from today.',
      'Remind each other to rest and hydrate.'
    ],
    safetyOrSuitabilityNote: 'Peer camaraderie normalizes academic challenges and prevents competitive burnout.',
    iconName: 'Users'
  }
];

export const RELAXATION_BY_ID = new Map<string, RelaxationActivity>(
  RELAXATION_ACTIVITIES.map((act) => [act.id, act])
);

export const RELAXATION_CATEGORIES: RelaxationCategory[] = [
  'Mindful Breaks',
  'Creative Activities',
  'Rest & Recovery',
  'Gentle Movement',
  'Outdoor Awareness',
  'Social Connection'
];
