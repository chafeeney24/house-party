// Prediction templates

export interface TemplatePrediction {
  type: 'pick-one' | 'over-under' | 'exact-number';
  question: string; // Use \n to separate question from hint text
  options?: string[];
  overUnderValue?: number;
  points: number;
  category?: 'pregame' | 'game' | 'halftime' | 'novelty';
}

export const superBowlTemplate: TemplatePrediction[] = [
  // ===== PRE-GAME =====
  {
    type: 'pick-one',
    question: '🪙 Coin Toss: Heads or Tails?\nTails leads all-time 31-28 and has hit in all 3 of Seattle\'s Super Bowl appearances',
    options: ['Heads', 'Tails'],
    points: 1,
    category: 'pregame',
  },
  {
    type: 'over-under',
    question: '🎤 National Anthem Over/Under 119.5 seconds?\nCharlie Puth is singing — the Over has hit 6 of the last 7 Super Bowls',
    overUnderValue: 119.5,
    points: 1,
    category: 'pregame',
  },
  {
    type: 'pick-one',
    question: '😭 Will a player or coach be shown crying during the Anthem?\nYes is actually the favorite at -230',
    options: ['Yes', 'No'],
    points: 1,
    category: 'pregame',
  },

  // ===== GAME — FIRST HALF =====
  {
    type: 'pick-one',
    question: '⚡ Which team scores first?\nSeattle scored first in 12 regular season games; New England in 7',
    options: ['Seahawks', 'Patriots'],
    points: 1,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏃 First touchdown scorer?\nWalker is the betting favorite',
    options: ['Kenneth Walker III', 'Jaxon Smith-Njigba', 'Rhamondre Stevenson', 'Hunter Henry', 'Field (anyone else)'],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '⏰ Which team leads at halftime?\nCan anyone pull ahead early or is it a grind?',
    options: ['Seahawks', 'Patriots', 'Tied'],
    points: 2,
    category: 'game',
  },
  {
    type: 'over-under',
    question: '📊 Total points scored in the first half?\nOver/Under 20.5 — defenses tend to dominate early in Super Bowls',
    overUnderValue: 20.5,
    points: 1,
    category: 'game',
  },

  // ===== HALFTIME SHOW =====
  {
    type: 'over-under',
    question: '🎤 Total guest performers on stage with Bad Bunny?\nOver/Under 2.5 — halftime shows love surprise guests',
    overUnderValue: 2.5,
    points: 2,
    category: 'halftime',
  },
  {
    type: 'pick-one',
    question: '👔 How many costume/outfit changes will Bad Bunny have?\nHe\'s known for dramatic fashion statements',
    options: ['0', '1', '2', '3+'],
    points: 2,
    category: 'halftime',
  },

  // ===== GAME — SECOND HALF & FULL GAME =====
  {
    type: 'pick-one',
    question: '🏆 Who wins Super Bowl LX?\nSeattle is a 4.5-point favorite',
    options: ['Seahawks', 'Patriots'],
    points: 3,
    category: 'game',
  },
  {
    type: 'over-under',
    question: '📊 Total points in the game?\nOver/Under 45.5 — both offenses have been clicking in the playoffs',
    overUnderValue: 45.5,
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🦺 Will there be a safety scored in the game?\nSafeties are rare but always electric',
    options: ['Yes', 'No'],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '⏰ Will the game go to overtime?\nOnly 2 of 59 Super Bowls have ever gone to OT',
    options: ['Yes', 'No'],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏈 Will Drake Maye throw an interception?\nHe threw one in both the Wild Card and Divisional rounds this postseason',
    options: ['Yes', 'No'],
    points: 1,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏈 Will Sam Darnold throw an interception?\nDidn\'t want to make Ben and Soph mad by only asking about Drake Maye',
    options: ['Yes', 'No'],
    points: 1,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏈 Will any kick hit the upright (the "Doink" prop)?\nThe football gods love a good doink in a big game',
    options: ['Yes', 'No'],
    points: 2,
    category: 'game',
  },
  {
    type: 'pick-one',
    question: '🏈 Will there be a successful 2-point conversion?\nThere were TWO in last year\'s Super Bowl',
    options: ['Yes', 'No'],
    points: 2,
    category: 'game',
  },

  // ===== NOVELTY & CELEBRITY =====
  {
    type: 'pick-one',
    question: '🥤 What color Gatorade will be poured on the winning coach?\nBoth teams wear blue; Patriots used blue in 2015 and 2019',
    options: ['Orange', 'Blue', 'Yellow/Lime', 'Purple', 'Red/Pink', 'Clear/Water'],
    points: 2,
    category: 'novelty',
  },
  {
    type: 'pick-one',
    question: '🏅 Super Bowl MVP first "thank you"?\nDrake Maye thanked "the good Lord" after the AFC Championship; Darnold typically thanks teammates',
    options: ['God', 'Teammates', 'Family', 'Coaches'],
    points: 2,
    category: 'novelty',
  },

  // ===== EXACT NUMBER (Tiebreaker) =====
  {
    type: 'exact-number',
    question: '🔢 Total combined points (closest wins)\nYour best guess at the final combined score — closest takes it!',
    points: 5,
    category: 'game',
  },
];

// Quick template with fewer questions for shorter parties
export const superBowlQuickTemplate: TemplatePrediction[] = [
  {
    type: 'pick-one',
    question: '🪙 Coin Toss: Heads or Tails?\nTails leads all-time 31-28',
    options: ['Heads', 'Tails'],
    points: 1,
  },
  {
    type: 'pick-one',
    question: '🏆 Who wins Super Bowl LX?\nSeattle is a 4.5-point favorite',
    options: ['Seahawks', 'Patriots'],
    points: 3,
  },
  {
    type: 'pick-one',
    question: '🏅 Super Bowl MVP?\nDarnold and Maye have both been balling in the playoffs',
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
    question: '📊 Total combined points?\nOver/Under 45.5',
    overUnderValue: 45.5,
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🎤 Will Cardi B appear during halftime?\nShe\'s the betting favorite at -250',
    options: ['Yes', 'No'],
    points: 2,
  },
  {
    type: 'pick-one',
    question: '🥤 Gatorade color on winning coach?\nBoth teams wear blue — will we see a blue shower?',
    options: ['Orange', 'Blue', 'Yellow/Green', 'Other'],
    points: 2,
  },
  {
    type: 'exact-number',
    question: '🔢 Total combined points (tiebreaker)\nClosest guess wins!',
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
