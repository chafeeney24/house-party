// Prediction templates

export interface TemplatePrediction {
  type: 'pick-one' | 'over-under' | 'exact-number';
  question: string;
  options?: string[];
  overUnderValue?: number;
  points: number;
}

export const superBowlTemplate: TemplatePrediction[] = [
  {
    type: 'pick-one',
    question: '🪙 Coin Toss Result',
    options: ['Heads', 'Tails'],
    points: 1,
  },
  {
    type: 'pick-one',
    question: '🏈 Which team will score FIRST?',
    options: ['Seahawks', 'Patriots'],
    points: 1,
  },
  {
    type: 'pick-one',
    question: '⚡ First scoring play type',
    options: ['Touchdown', 'Field Goal', 'Safety'],
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🏆 Super Bowl Winner',
    options: ['Seahawks', 'Patriots'],
    points: 3,
  },
  {
    type: 'over-under',
    question: '📊 Total combined points',
    overUnderValue: 49.5,
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🎤 First song at Halftime Show',
    options: ['Bodak Yellow', 'I Like It', 'WAP', 'Up', 'Other'],
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🥤 Gatorade color on winning coach',
    options: ['Orange', 'Blue', 'Yellow', 'Red', 'Clear/Water', 'None'],
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🦺 Will there be a safety?',
    options: ['Yes', 'No'],
    points: 2,
  },
  {
    type: 'pick-one',
    question: '⏰ Will the game go to overtime?',
    options: ['Yes', 'No'],
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🏅 Super Bowl MVP',
    options: ['Geno Smith', 'DK Metcalf', 'Drake Maye', 'Rhamondre Stevenson', 'Other Seahawks Player', 'Other Patriots Player', 'Defensive Player'],
    points: 3,
  },
  {
    type: 'over-under',
    question: '🎯 Longest field goal (yards)',
    overUnderValue: 48.5,
    points: 2,
  },
  {
    type: 'over-under',
    question: '🏃 Longest touchdown play (yards)',
    overUnderValue: 39.5,
    points: 2,
  },
  {
    type: 'pick-one',
    question: '📺 Best Super Bowl commercial category',
    options: ['Beer', 'Cars', 'Food/Snacks', 'Tech', 'Streaming/Movies', 'Insurance', 'Other'],
    points: 1,
  },
  {
    type: 'exact-number',
    question: '🔢 Total combined points (closest wins)',
    points: 5,
  },
  {
    type: 'exact-number',
    question: '🎯 Winning team final score',
    points: 3,
  },
];

export function getTemplate(name: string): TemplatePrediction[] | null {
  switch (name) {
    case 'super-bowl':
      return superBowlTemplate;
    default:
      return null;
  }
}
