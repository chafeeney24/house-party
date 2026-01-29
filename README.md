# 🎉 House Party

Real-time prediction games for your parties! Perfect for Super Bowl parties, game nights, holidays, and more.

## Features

- **Jackbox-style join flow** - Guests join with a simple party code, no accounts needed
- **Multiple game types:**
  - **Pick One** - Multiple choice (coin toss, MVP pick, etc.)
  - **Over/Under** - Guess if a value will be over or under
  - **Exact Number** - Predict an exact value (score predictions)
- **Real-time leaderboard** - Watch scores update as the host enters results
- **Lock/unlock predictions** - Host can lock predictions when the game starts

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## How It Works

### For Hosts
1. Go to the app and click "Host a Party"
2. Enter a party name and your name
3. Share the party code with guests
4. Add prediction games (coin toss, prop bets, etc.)
5. Lock predictions when the event starts
6. Enter correct answers as results come in
7. Watch the leaderboard update!

### For Guests
1. Get the party code from the host
2. Go to the app and enter the code
3. Enter your name to join
4. Make your predictions before they're locked
5. Check the leaderboard to see how you're doing

## Super Bowl Game Ideas

- Coin toss (Heads/Tails)
- Which team will score first?
- First song at halftime show?
- MVP prediction
- Total points (Over/Under)
- Final score prediction
- Will there be a safety? (Yes/No)
- Gatorade color on winning coach?

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **In-memory storage** (swap with Supabase/Planetscale for persistence)

## TODO

- [ ] Add Supabase for persistent storage
- [ ] WebSocket support for true real-time updates
- [ ] Pre-built game templates (Super Bowl, Oscars, etc.)
- [ ] QR code generation for party codes
- [ ] Sound effects and animations
- [ ] Multiple parties per host
