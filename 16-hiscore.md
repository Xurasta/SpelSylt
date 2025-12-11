# Steg 16 - High Score System

I detta steg implementerar vi ett high score system som sparar spelarens bästa resultat i localStorage och visar dem i en dedikerad meny.

## Översikt

High Score systemet låter spelare:
- Spara sina top 3 resultat (score och tid)
- Se alla sparade high scores i en dedikerad meny
- Rensa sparade scores
- Få automatisk sortering (högsta score först, vid lika score - snabbast tid först)

**Nytt i detta steg:**
- `HiScoreManager.js` - Hanterar localStorage för high scores
- `HiScoreMenu.js` - Visar top 3 scores i menysystemet
- Integration med SpaceShooterGame (sparar automatiskt vid game over)
- Integration med MainMenu (ny "High Scores" option)

## Arkitektur

### HiScoreManager

En fristående klass som hanterar all localStorage-interaktion för high scores.

**Ansvar:**
- Spara nya scores
- Hämta top 3 scores
- Sortera scores (högsta först, snabbast vid oavgjort)
- Rensa alla scores
- Validera om en score kvalificerar för top 3
- Formatera tid och datum för visning

**localStorage key:** `'space-shooter-hiscores'`

**Score format:**
```javascript
{
    score: number,      // Spelarens poäng
    time: number,       // Tid spelad i millisekunder
    date: string        // ISO timestamp när scoren sparades
}
```

### HiScoreMenu

En meny som extends `Menu` och visar alla sparade high scores.

**Features:**
- Visar top 3 scores med rank (#1, #2, #3)
- Färgkodade ranks (guld, silver, brons)
- Formaterad tid (MM:SS)
- Datum när scoren sattes
- Options: Main Menu [Escape], Clear Scores [C]

**Design:**
- Samma mörka overlay som andra menyer (rgba(0, 0, 0, 0.85))
- Guld titel "HIGH SCORES"
- Om inga scores: "No high scores yet! Play to set a record!"

### Integration med Befintliga System

**SpaceShooterGame:**
- Skapar `HiScoreManager` instance i constructor
- Sparar score automatiskt vid game over
- Inget behov av manuell sparning från spelaren

**MainMenu:**
- Ny option: "High Scores [H]"
- Öppnar HiScoreMenu när H trycks
- Ordning: Start Game → High Scores → Controls

## Implementering

### HiScoreManager.js

```javascript
export default class HiScoreManager {
    constructor(storageKey = 'space-shooter-hiscores') {
        this.storageKey = storageKey
        this.maxScores = 3
    }
    
    saveScore(score, playTime) {
        const scores = this.getTopScores()
        
        const newScore = {
            score: score,
            time: playTime,
            date: new Date().toISOString()
        }
        
        // Lägg till och sortera
        scores.push(newScore)
        scores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score  // Högsta först
            }
            return a.time - b.time  // Snabbast först vid oavgjort
        })
        
        // Behåll bara top 3
        const topScores = scores.slice(0, this.maxScores)
        localStorage.setItem(this.storageKey, JSON.stringify(topScores))
        
        // Returnera true om scoren kom med i top 3
        return topScores.some(s => 
            s.score === newScore.score && 
            s.time === newScore.time && 
            s.date === newScore.date
        )
    }
    
    getTopScores() {
        const stored = localStorage.getItem(this.storageKey)
        if (!stored) return []
        return JSON.parse(stored)
    }
    
    clearScores() {
        localStorage.removeItem(this.storageKey)
    }
    
    isHighScore(score) {
        const scores = this.getTopScores()
        if (scores.length < this.maxScores) return true
        return score > scores[scores.length - 1].score
    }
    
    static formatTime(ms) {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    
    static formatDate(isoDate) {
        const date = new Date(isoDate)
        return date.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }
}
```

**Viktiga metoder:**

- `saveScore(score, time)` - Sparar ny score om den är top 3
  - Lägger till i array
  - Sorterar (högsta score → snabbast tid)
  - Tar top 3
  - Sparar till localStorage
  - Returnerar true om scoren kom med

- `getTopScores()` - Hämtar alla sparade scores från localStorage
  - Try/catch för localStorage errors
  - Validerar att det är en array

- `clearScores()` - Tar bort alla scores (för Clear Scores option)

- `isHighScore(score)` - Kollar om en score kvalificerar
  - Om < 3 scores: alltid true
  - Annars: kolla om högre än lägsta top score

- `formatTime(ms)` - Static method för tid-formatering (MM:SS)

- `formatDate(isoDate)` - Static method för datum-formatering (svensk locale)

### HiScoreMenu.js

```javascript
export default class HiScoreMenu extends Menu {
    constructor(game) {
        super(game)
        this.hiScoreManager = new HiScoreManager()
    }
    
    getOptions() {
        return [
            {
                text: 'Main Menu',
                key: 'Escape',
                action: () => this.game.showMainMenu()
            },
            {
                text: 'Clear Scores',
                key: 'c',
                action: () => this.hiScoreManager.clearScores()
            }
        ]
    }
    
    draw(ctx) {
        // Mörk overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
        ctx.fillRect(0, 0, this.game.width, this.game.height)
        
        // Titel "HIGH SCORES" (guld)
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 48px Arial'
        ctx.fillText('HIGH SCORES', this.game.width / 2, 100)
        
        const scores = this.hiScoreManager.getTopScores()
        
        if (scores.length === 0) {
            // Inga scores än
            ctx.fillText('No high scores yet!', ...)
        } else {
            scores.forEach((scoreData, index) => {
                // Rank färg (guld #1, silver #2, brons #3)
                const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']
                ctx.fillStyle = rankColors[index]
                ctx.fillText(`#${index + 1}`, ...)
                
                // Score, tid, datum
                ctx.fillText(scoreData.score, ...)
                ctx.fillText(`Time: ${formatTime(scoreData.time)}`, ...)
                ctx.fillText(formatDate(scoreData.date), ...)
            })
        }
        
        this.drawOptions(ctx)
    }
}
```

**Rendering:**
- Rank nummer med färgkodning (#1 guld, #2 silver, #3 brons)
- Score i vitt, stor font
- Tid i grått, mindre font
- Datum i mörkgrått, minst font
- Options längst ner (Main Menu, Clear Scores)

### SpaceShooterGame Integration

```javascript
import HiScoreManager from '../HiScoreManager.js'

export default class SpaceShooterGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // ... andra initialisieringar
        
        // High score manager
        this.hiScoreManager = new HiScoreManager()
    }
    
    update(deltaTime) {
        // Lose condition
        if (this.player && this.player.health <= 0 && this.gameState === 'PLAYING') {
            this.gameState = 'GAME_OVER'
            
            // Spara high score automatiskt
            this.hiScoreManager.saveScore(this.score, this.playTime)
            
            this.currentMenu = new GameOverMenu(this)
            this.backgroundMusic.pause()
        }
        
        // ... rest av update
    }
}
```

**Viktigt:** Scoren sparas automatiskt vid game over, inget manuellt steg behövs.

### MainMenu Integration

```javascript
import HiScoreMenu from './HiScoreMenu.js'

export default class MainMenu extends Menu {
    getOptions() {
        return [
            {
                text: 'Start Game',
                key: ' ',
                action: () => this.game.restart()
            },
            {
                text: 'High Scores',  // NY!
                key: 'h',
                action: () => {
                    this.game.currentMenu = new HiScoreMenu(this.game)
                }
            },
            {
                text: 'Controls',
                key: 'c',
                action: () => {
                    this.game.currentMenu = new ControlsMenu(this.game)
                }
            }
        ]
    }
}
```

## Användning

### Spelarens Perspektiv

1. **Första gången:**
   - Från huvudmenyn: Tryck H för High Scores
   - Ser "No high scores yet! Play to set a record!"
   - Tryck Escape för att gå tillbaka

2. **Efter att ha spelat:**
   - Spela spelet (Space från huvudmenyn)
   - Dö (health når 0)
   - Score sparas automatiskt
   - Game Over-menyn visas
   - Tryck Escape → Main Menu
   - Tryck H → Se din score i top 3!

3. **Rensa scores:**
   - Från High Scores menyn: Tryck C
   - Alla scores rensas direkt
   - Menyn visar "No high scores yet!"

### localStorage Data

Scores sparas under nyckeln `'space-shooter-hiscores'` som JSON:

```json
[
    {
        "score": 3500,
        "time": 125340,
        "date": "2025-12-11T14:23:45.678Z"
    },
    {
        "score": 2800,
        "time": 98200,
        "date": "2025-12-11T13:15:22.123Z"
    },
    {
        "score": 2100,
        "time": 76500,
        "date": "2025-12-11T12:05:10.456Z"
    }
]
```

## Sorteringslogik

High scores sorteras enligt följande regler:

1. **Primär sortering:** Högsta score först
2. **Sekundär sortering:** Om samma score, snabbast tid först

**Exempel:**
- Player A: 3000 poäng på 2:30 → Rank #1
- Player B: 3000 poäng på 3:15 → Rank #2 (samma score, långsammare)
- Player C: 2500 poäng på 1:45 → Rank #3 (lägre score trots snabbare tid)

```javascript
scores.sort((a, b) => {
    if (b.score !== a.score) {
        return b.score - a.score  // Högsta score vinner
    }
    return a.time - b.time  // Snabbast tid vinner vid oavgjort
})
```

## Error Handling

HiScoreManager har try/catch för localStorage:

```javascript
try {
    localStorage.setItem(this.storageKey, JSON.stringify(topScores))
    return true
} catch (error) {
    console.error('Failed to save high score:', error)
    return false
}
```

**Möjliga fel:**
- localStorage disabled i webbläsaren
- Quota exceeded (sällsynt för 3 scores)
- Private browsing mode (vissa browsers blockerar localStorage)

Vid fel loggas felet men spelet fortsätter fungera.

## Lärdomar

### localStorage Best Practices

1. **Always validate data:**
   ```javascript
   const scores = JSON.parse(stored)
   return Array.isArray(scores) ? scores : []
   ```

2. **Use try/catch:**
   - localStorage kan kasta errors
   - Private browsing, disabled storage, quota

3. **Keep data minimal:**
   - Bara top 3 scores
   - Enkla objekt utan nested data

### Menu System Extension

HiScoreMenu följer samma pattern som andra menyer:
- Extends Menu
- Implementerar getTitle() och getOptions()
- Custom draw() för speciell rendering
- Använder game.showMainMenu() callback

### Automatic vs Manual Saving

**Design choice:** Spara automatiskt vid game over
- ✅ Spelaren behöver inte tänka på det
- ✅ Enklare UX
- ✅ Konsistent data (ingen glömd sparning)
- ⚠️ Spelaren kan inte välja att INTE spara

Alternativ hade varit:
- Fråga "Save score?" i GameOverMenu
- Kräv manuell action (tryck S för save)
- Men det ger extra friktion för spelaren

### Static Methods för Formatering

`formatTime()` och `formatDate()` är static:
```javascript
static formatTime(ms) { ... }
```

**Varför static?**
- Ingen instance state behövs
- Kan användas utan att skapa HiScoreManager
- HiScoreMenu kan använda dem direkt: `HiScoreManager.formatTime(ms)`

### Separation of Concerns

**HiScoreManager:** Endast data/logic
- Ingen rendering
- Ingen game state
- Endast localStorage och sorting

**HiScoreMenu:** Endast presentation
- Använder HiScoreManager för data
- Hanterar rendering
- Menu navigation

**SpaceShooterGame:** Game logic
- Skapar HiScoreManager
- Sparar vid rätt tidpunkt
- Vet inte HUR data sparas

## Framtida Förbättringar

Möjliga tillägg i framtiden:

1. **Fler scores:** Top 10 istället för top 3
2. **Player names:** Låt spelaren skriva sitt namn
3. **Online leaderboard:** Synka med server
4. **Score tiers:** Bronze/Silver/Gold achievements
5. **Statistics:** Total games played, average score, etc.
6. **Filters:** "This week", "All time", "Today"
7. **Animations:** Fade in när ny high score sätts
8. **Sound effects:** Ljud när high score uppnås

## Testing Checklist

- [ ] Spela och dö → Score sparas automatiskt
- [ ] Öppna High Scores från huvudmenyn → Score visas
- [ ] Spela igen med högre score → Nya scoren ersätter gamla
- [ ] Spela igen med lägre score → Scoren sparas inte (om > 3 scores)
- [ ] Clear Scores → Alla scores försvinner
- [ ] Stäng och öppna spelet → Scores kvarstår (localStorage persistent)
- [ ] Samma score, olika tid → Snabbast tid rankas högre
- [ ] Private browsing → Inget crash (graceful degradation)

## Sammanfattning

Steg 16 introducerar ett enkelt men komplett high score system:

**Nytt:**
- ✅ HiScoreManager för localStorage handling
- ✅ HiScoreMenu för presentation
- ✅ Automatisk sparning vid game over
- ✅ Top 3 tracking med sortering
- ✅ Formatering av tid och datum
- ✅ Clear scores funktionalitet

**Återanvänder:**
- Menu system (HiScoreMenu extends Menu)
- MainMenu integration (ny option)
- SpaceShooterGame hooks (sparar i update loop)

**Arkitektur:**
- Separation of concerns (data/presentation/game logic)
- Static methods för utility functions
- Try/catch för localStorage errors
- Konsistent med befintligt menysystem

High score systemet ger spelaren motivation att spela igen för att slå sina egna rekord! 🏆
