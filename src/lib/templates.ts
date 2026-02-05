// Prediction templates

export interface TemplatePrediction {
  type: 'pick-one' | 'over-under' | 'exact-number';
  question: string;
  options?: string[];
  overUnderValue?: number;
  points: number;
  category?: 'pregame' | 'game' | 'halftime' | 'commercials' | 'misc';
}

export const superBowlTemplate: TemplatePrediction[] = [
  // ===== PRE-GAME =====
  {
    type: 'pick-one',
    question: '🪙 Coin Toss Result',
    options: ['Heads', 'Tails'],
    points: 1,
    category: 'pregame',
  },
  {
    type: 'pick-one',
    question: '🎤 National Anthem Over/Under 2 minutes?',
    options: ['Over 2:00', 'Under 2:00'],
    points: 1,
    category: 'pregame',
  },

  // ===== GAME PROPS =====
  {
    type: 'pick-one',
    question: '🏆 Super Bowl Winner',
    options: ['Seahawks', 'Patriots'],
    points: 3,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏈 Which team will score FIRST?',
    options: ['Seahawks', 'Patriots'],
    points: 1,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '⚡ First scoring play type',
    options: ['Touchdown', 'Field Goal', 'Safety'],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏅 Super Bowl MVP',
    options: [
      'Sam Darnold (SEA QB)',
      'Kenneth Walker III (SEA RB)',
      'Jaxon Smith-Njigba (SEA WR)',
      'Drake Maye (NE QB)',
      'Rhamondre Stevenson (NE RB)',
      'Other Seahawks Player',
      'Other Patriots Player',
    ],
    points: 3,
    category: 'game',
  },
  {
    type: 'over-under',
    question: '📊 Total combined points',
    overUnderValue: 45.5,
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🦺 Will there be a safety?',
    options: ['Yes', 'No'],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '⏰ Will the game go to overtime?',
    options: ['Yes', 'No'],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏃 First Seahawks touchdown scorer',
    options: [
      'Kenneth Walker III',
      'Jaxon Smith-Njigba',
      'Cooper Kupp',
      'AJ Barner',
      'Sam Darnold',
      'Other/None',
    ],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏃 First Patriots touchdown scorer',
    options: [
      'Rhamondre Stevenson',
      'Stefon Diggs',
      'Hunter Henry',
      'Kayshon Boutte',
      'Drake Maye',
      'Other/None',
    ],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🥤 Gatorade color on winning coach',
    options: ['Orange', 'Blue', 'Yellow/Lime/Green', 'Purple', 'Red/Pink', 'Clear/Water', 'None'],
    points: 2,
    category: 'game',
  },

  // ===== HALFTIME - BAD BUNNY =====
  {
    type: 'pick-one',
    question: '🎤 Bad Bunny\'s FIRST song',
    options: [
      'Tití Me Preguntó',
      'BAILE INoLVIDABLE',
      'MONACO',
      'Other',
    ],
    points: 2,
    category: 'halftime',
  },
  {
    type: 'pick-one',
    question: '🎤 Will there be a surprise guest performer?',
    options: ['Yes', 'No'],
    points: 2,
    category: 'halftime',
  },

  // ===== EXACT NUMBER (Tiebreakers) =====
  {
    type: 'exact-number',
    question: '🔢 Total combined points (closest wins)',
    points: 5,
    category: 'game',
  },
  {
    type: 'exact-number',
    question: '🎯 Winning team\'s final score (closest wins)',
    points: 3,
    category: 'game',
  },
];

// Quick template with fewer questions for shorter parties
export const superBowlQuickTemplate: TemplatePrediction[] = [
  {
    type: 'pick-one',
    question: '🪙 Coin Toss Result',
    options: ['Heads', 'Tails'],
    points: 1,
  },
  {
    type: 'pick-one',
    question: '🏆 Super Bowl Winner',
    options: ['Seahawks', 'Patriots'],
    points: 3,
  },
  {
    type: 'pick-one',
    question: '🏅 Super Bowl MVP',
    options: [
      'Sam Darnold (SEA)',
      'Kenneth Walker III (SEA)',
      'Drake Maye (NE)',
      'Other Player',
    ],
    points: 3,
  },
  {
    type: 'over-under',
    question: '📊 Total combined points',
    overUnderValue: 45.5,
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🎤 Will there be a surprise guest at halftime?',
    options: ['Yes', 'No'],
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🥤 Gatorade color on winning coach',
    options: ['Orange', 'Blue', 'Yellow/Green', 'Other'],
    points: 2,
  },
  {
    type: 'exact-number',
    question: '🔢 Total combined points (tiebreaker)',
    points: 5,
  },
];

export function getTemplate(name: string): TemplatePrediction[] | null {
  switch (name) {
    case 'super-bowl':
      return superBowlTemplate;
    case 'super-bowl-quick':
      return superBowlQuickTemplate;
    default:
      return null;
  }
}
