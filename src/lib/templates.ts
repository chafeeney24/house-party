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
    type: 'pick-one',
    question: '🪙 Which team wins the coin toss?\nA pure 50/50 — pick your gut feeling',
    options: ['Seahawks', 'Patriots'],
    points: 1,
    category: 'pregame',
  },
  {
    type: 'pick-one',
    question: '🪙 Will the coin toss winner also win the game?\nHistorically the toss winner has LOST 33 out of 59 times',
    options: ['Yes', 'No'],
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
  {
    type: 'pick-one',
    question: '📺 First QB shown on broadcast during the anthem?\nWho does the camera find first?',
    options: ['Drake Maye', 'Sam Darnold'],
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
    question: '🏈 Will there be a turnover in the first quarter?\nDrake Maye threw a pick in both the Wild Card and Divisional rounds',
    options: ['Yes', 'No'],
    points: 1,
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
    type: 'pick-one',
    question: '🎤 Will Cardi B make a guest appearance during Bad Bunny\'s halftime show?\nShe\'s the betting favorite at -250 — she has a hit with Bad Bunny AND her boyfriend Stefon Diggs is playing',
    options: ['Yes', 'No'],
    points: 2,
    category: 'halftime',
  },
  {
    type: 'pick-one',
    question: '🎤 Will J Balvin appear as a guest during halftime?\nHe and Bad Bunny squashed their beef and reunited on stage in Mexico City in December',
    options: ['Yes', 'No'],
    points: 2,
    category: 'halftime',
  },
  {
    type: 'over-under',
    question: '🎤 Total guest performers on stage with Bad Bunny?\nOver/Under 2.5 — halftime shows love surprise guests',
    overUnderValue: 2.5,
    points: 2,
    category: 'halftime',
  },
  {
    type: 'over-under',
    question: '🎵 Total songs performed by Bad Bunny?\nBad Bunny himself said the show is about 13 minutes — he could pack a LOT of songs in',
    overUnderValue: 11.5,
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
    question: '🏈 Will any kick hit the upright (the "Doink" prop)?\nThe football gods love a good doink in a big game',
    options: ['Yes', 'No'],
    points: 2,
    category: 'game',
  },
  {
    type: 'over-under',
    question: '🚩 Total penalty flags in the game?\nOver/Under 10.5 — refs tend to let teams play in the Super Bowl',
    overUnderValue: 10.5,
    points: 1,
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
    question: '💍 Will Stefon Diggs propose to Cardi B on the field after the game?\nWhen asked at media day, Diggs said "It\'s on the agenda, maybe..."',
    options: ['Yes', 'No'],
    points: 2,
    category: 'novelty',
  },
  {
    type: 'pick-one',
    question: '👕 Will Cardi B be shown wearing a Stefon Diggs Patriots jersey?\nShe wore one during her "Call Her Daddy" interview but hasn\'t been spotted in team gear at actual games',
    options: ['Yes', 'No'],
    points: 1,
    category: 'novelty',
  },
  {
    type: 'pick-one',
    question: '🎙️ Will the announcer reference the "Battle of the Mikes"?\nCoach Mike Macdonald vs. Coach Mike Vrabel, called by Mike Tirico — at +200 this seems like a lock',
    options: ['Yes', 'No'],
    points: 1,
    category: 'novelty',
  },
  {
    type: 'pick-one',
    question: '🏅 Super Bowl MVP first "thank you"?\nDrake Maye thanked "the good Lord" after the AFC Championship; Darnold typically thanks teammates',
    options: ['God', 'Teammates', 'Family', 'Coaches'],
    points: 2,
    category: 'novelty',
  },
  {
    type: 'pick-one',
    question: '🏃 Will an unauthorized person run onto the field?\nIt happened as recently as Super Bowl LVIII in 2024 — two shirtless guys sprinted onto the turf',
    options: ['Yes', 'No'],
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
