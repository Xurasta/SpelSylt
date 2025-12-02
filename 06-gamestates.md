# Steg 6 - Game States

Vi implementerar vinstvillkor, förlustvillkor och möjligheten att starta om spelet - grundläggande för att skapa en komplett spelupplevelse.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **State Machine** - Hantera olika speltillstånd
- **Win/Lose Conditions** - Definiera när spelaren vinner eller förlorar
- **Game Loop Control** - Pausa/starta baserat på state
- **Restart Mechanism** - Återställ spelet till början
- **UI Feedback** - Visa meddelanden till spelaren

## Översikt

För att skapa en komplett spelloop behöver vi:
1. **Game States** - PLAYING, GAME_OVER, WIN
2. **Win Condition** - Kolla om alla mynt är samlade
3. **Lose Condition** - Kolla om spelaren förlorat alla liv
4. **State-baserad Update** - Uppdatera bara när PLAYING
5. **Overlay Screens** - Rita meddelanden vid GAME_OVER/WIN
6. **Restart Function** - Återställ allt med R-tangenten
7. **Init Method** - Centralisera initialization logic

## Problemet - Oändlig spelloop utan mål

Hittills har vårt spel ingen början eller slut:
- Spelaren kan dö men spelet fortsätter
- Alla mynt samlade = inget händer
- Ingen restart-funktion

**Detta skapar:**
- Ingen känsla av progression eller achievement
- Frustration när spelaren dör
- Ingen motivation att samla alla mynt

## State Machine - Vad är det?

En **state machine** är ett mönster där ett objekt kan vara i exakt ett av flera tillstånd åt gången. Övergångar mellan states styrs av conditions.

**Våra states:**
```javascript
'PLAYING'    // Normalt gameplay
'GAME_OVER'  // Spelaren dog (health = 0)
'WIN'        // Alla mynt samlade
```

**State diagram:**
```
    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
    ┌──────────┐
    │ PLAYING  │◄──────┐
    └─┬─────┬──┘       │
      │     │          │ Press R
      │     │     ┌────┴─────┐
      │     │     │ GAME_OVER│
      │     │     └──────────┘
      │     │     Condition: health <= 0
      │     │
      │     │     ┌─────┐
      │     └────►│ WIN │
      │           └──┬──┘
      │              │ Press R
      └──────────────┘
      Condition: all coins collected
```

## Implementering i Game.js

### Constructor - Lägg till game state:
```javascript
constructor(width, height) {
    this.width = width
    this.height = height
    
    // Fysik
    this.gravity = 0.001
    this.friction = 0.00015
    
    // Game state
    this.gameState = 'PLAYING'  // Nytt!
    this.score = 0
    this.coinsCollected = 0
    this.totalCoins = 0  // Nytt! Spara totalt antal mynt
    
    this.inputHandler = new InputHandler(this)
    this.ui = new UserInterface(this)
    
    // Flytta initialization till egen metod
    this.init()
}
```

### Init Method - Återanvändbar initialization:
```javascript
init() {
    // Återställ game state
    this.gameState = 'PLAYING'
    this.score = 0
    this.coinsCollected = 0
    
    // Skapa spelaren
    this.player = new Player(this, 50, 50, 50, 50, 'green')
    
    // Skapa plattformar
    this.platforms = [
        new Platform(this, 0, this.height - 40, this.width, 40, '#654321'),
        new Platform(this, 150, this.height - 140, 150, 20, '#8B4513'),
        // ... alla plattformar
    ]
    
    // Skapa mynt
    this.coins = [
        new Coin(this, 200, this.height - 180),
        new Coin(this, 240, this.height - 180),
        // ... alla mynt
    ]
    this.totalCoins = this.coins.length  // Spara antal!
    
    // Skapa fiender
    this.enemies = [
        new Enemy(this, 200, this.height - 220, 40, 40, 80),
        // ... alla fiender
    ]
    
    this.gameObjects = []
}

restart() {
    this.init()  // Anropa init() igen för restart
}
```

**Varför en separat init()?**
- **DRY (Don't Repeat Yourself)** - Samma kod för start och restart
- **Lättare att underhålla** - Ändra en plats, påverkar både start och restart
- **Tydligare struktur** - Constructor skapar permanenta objekt, init() återställbara

### Update - State-baserad logik:
```javascript
update(deltaTime) {
    // Kolla restart input (fungerar i GAME_OVER och WIN)
    if (this.inputHandler.keys.has('r') || this.inputHandler.keys.has('R')) {
        if (this.gameState === 'GAME_OVER' || this.gameState === 'WIN') {
            this.restart()
            return  // Avsluta update för att börja fresh nästa frame
        }
    }
    
    // Uppdatera bara om spelet är i PLAYING state
    if (this.gameState !== 'PLAYING') return
    
    // ... all normal update-logik (objekt, kollisioner, etc) ...
    
    // Kolla win condition (i slutet av update)
    if (this.coinsCollected === this.totalCoins && this.gameState === 'PLAYING') {
        this.gameState = 'WIN'
    }
    
    // Kolla lose condition
    if (this.player.health <= 0 && this.gameState === 'PLAYING') {
        this.gameState = 'GAME_OVER'
    }
}
```

**Viktigt:**
- Restart-input kollas **före** state-check
- State-check (`if (this.gameState !== 'PLAYING') return`) **stoppar** all update när ej PLAYING
- Win/lose conditions kollas **sist** i update

### Draw - UI handles overlays:
```javascript
draw(ctx) {
    // Rita alltid spelvärlden (som "frozen" bakgrund)
    this.platforms.forEach(platform => platform.draw(ctx))
    this.coins.forEach(coin => coin.draw(ctx))
    this.enemies.forEach(enemy => enemy.draw(ctx))
    this.gameObjects.forEach(obj => obj.draw(ctx))
    this.player.draw(ctx)
    
    // Rita UI sist (så det är överst)
    // UserInterface hanterar både HUD och game state overlays
    this.ui.draw(ctx)
}
```

**Varför rita spelvärlden även vid GAME_OVER/WIN?**
- Spelaren ser vad som hände
- Kontext för varför de dog/vann
- Mer visuellt tilltalande än svart skärm

**Separation of Concerns:**
- `Game.js` sätter `gameState` (logik)
- `UserInterface.js` renderar baserat på `gameState` (presentation)
- Detta följer Single Responsibility Principle

## UserInterface.js - Hantera ALL UI-rendering

UserInterface-klassen har nu ansvar för all visuell feedback:

### Draw Method - Delegerar till sub-methods:
```javascript
draw(ctx) {
    // Rita HUD (score, health, etc)
    this.drawHUD(ctx)
    
    // Rita game state overlays baserat på game.gameState
    if (this.game.gameState === 'GAME_OVER') {
        this.drawGameOver(ctx)
    } else if (this.game.gameState === 'WIN') {
        this.drawWin(ctx)
    }
}
```

### HUD (Heads-Up Display):
```javascript
drawHUD(ctx) {
    ctx.save()
    
    // Konfigurera text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`
    ctx.fillStyle = this.textColor
    ctx.shadowColor = this.shadowColor
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.shadowBlur = 3
    
    // Rita score, coins, health
    ctx.fillText(`Score: ${this.game.score}`, 20, 40)
    ctx.fillText(`Coins: ${this.game.coinsCollected}`, 20, 70)
    ctx.fillText(`Health: ${this.game.player.health}/${this.game.player.maxHealth}`, 20, 100)
    
    // Rita health bars som hjärtan
    for (let i = 0; i < this.game.player.maxHealth; i++) {
        const heartX = 20 + i * 30
        const heartY = 110
        
        ctx.fillStyle = i < this.game.player.health ? '#FF0000' : '#333333'
        ctx.fillRect(heartX, heartY, 20, 20)
    }
    
    ctx.restore()
}
```

### Game Over Overlay:
```javascript
drawGameOver(ctx) {
    // Halvgenomskinlig svart bakgrund (dimma)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, this.game.width, this.game.height)
    
    // Save/restore för att inte påverka annan rendering
    ctx.save()
    
    // Game Over text
    ctx.fillStyle = '#FF0000'
    ctx.font = 'bold 60px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('GAME OVER', this.game.width / 2, this.game.height / 2 - 50)
    
    // Final score
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '30px Arial'
    ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, this.game.height / 2 + 20)
    ctx.fillText(`Coins: ${this.game.coinsCollected}/${this.game.totalCoins}`, this.game.width / 2, this.game.height / 2 + 60)
    
    // Restart instruktion
    ctx.font = '24px Arial'
    ctx.fillText('Press R to Restart', this.game.width / 2, this.game.height / 2 + 120)
    
    ctx.restore()
}
```

### Win Overlay:
```javascript
drawWin(ctx) {
    // Halvgenomskinlig grön bakgrund (victory glow)
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
    ctx.fillRect(0, 0, this.game.width, this.game.height)
    
    ctx.save()
    
    // Victory text
    ctx.fillStyle = '#FFD700'  // Guld färg
    ctx.font = 'bold 60px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('VICTORY!', this.game.width / 2, this.game.height / 2 - 50)
    
    // Success message
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '30px Arial'
    ctx.fillText('All Coins Collected!', this.game.width / 2, this.game.height / 2 + 20)
    ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, this.game.height / 2 + 60)
    
    // Restart instruktion
    ctx.font = '24px Arial'
    ctx.fillText('Press R to Play Again', this.game.width / 2, this.game.height / 2 + 120)
    
    ctx.restore()
}
```

**Canvas text API:**
- `textAlign: 'center'` - Centrera text horisontellt
- `textBaseline: 'middle'` - Centrera text vertikalt
- `ctx.save()/restore()` - Spara/återställ canvas state (font, color, etc)

## Viktig buggfix - deltaTime initialization

**VIKTIGT:** Det finns en kritisk bugg i spelloopen som kan få spelaren att falla igenom världen!

### Problemet

Vid första framen kan `deltaTime` bli **jättestort**:
- `lastTime` börjar på 0
- `timeStamp` är tiden sedan sidan laddades (kan vara flera tusen millisekunder)
- Detta ger `deltaTime = timeStamp - 0` = enormt värde!
- Spelaren faller 43000+ pixels och hamnar långt under världen

### Lösningen - Två enkla steg

**1. Initiera lastTime korrekt (main.js):**
```javascript
const runGame = (timeStamp) => {
    // Förhindra för stora deltaTime värden (första frame, tab-switch, etc)
    if (lastTime === 0) {
        lastTime = timeStamp
    }
    const deltaTime = timeStamp - lastTime
    lastTime = timeStamp
    
    // ... rest av koden
}
```

**2. Cap deltaTime till max 100ms (main.js):**
```javascript
const runGame = (timeStamp) => {
    // ... lastTime check från ovan
    
    // Säkerhets-cap för deltaTime (max 100ms)
    const cappedDeltaTime = Math.min(deltaTime, 100)
    
    // Rensa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Uppdatera och rita med cappedDeltaTime
    game.update(cappedDeltaTime)
    game.draw(ctx)
    
    // ... rest av koden
}
```

### Varför behövs båda?

- **lastTime check**: Förhindrar bug vid första framen
- **deltaTime cap**: Förhindrar extrema värden vid:
  - Tab-switch (användaren byter flik och kommer tillbaka)
  - Långsam restart (spelaren väntar länge i GAME_OVER innan R)
  - Browser freeze/lag

**Utan dessa fixar:**
- Spelaren faller genom världen vid start
- Fiender spawnar felaktigt efter restart
- Fysiken blir opålitlig vid långa frames

**Komplett implementation:**
```javascript
const runGame = (timeStamp) => {
    // Förhindra för stora deltaTime värden (första frame, tab-switch, etc)
    if (lastTime === 0) {
        lastTime = timeStamp
    }
    const deltaTime = timeStamp - lastTime
    lastTime = timeStamp
    
    // Säkerhets-cap för deltaTime (max 100ms)
    const cappedDeltaTime = Math.min(deltaTime, 100)
    
    // Rensa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Uppdatera och rita
    game.update(cappedDeltaTime)
    game.draw(ctx)
    
    // Kör nästa frame
    gameLoop = requestAnimationFrame(runGame)
}
```

## RGBA Colors - Transparens

```javascript
ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
//                    R  G  B  Alpha
//                    ↓  ↓  ↓  ↓
// R (Red):   0-255 (0 = ingen röd)
// G (Green): 0-255 (0 = ingen grön)
// B (Blue):  0-255 (0 = ingen blå)
// A (Alpha): 0-1   (0 = helt transparent, 1 = helt opak)
```

**Exempel:**
- `rgba(0, 0, 0, 0.7)` - Svart med 70% opacity (mörk dimma)
- `rgba(255, 0, 0, 0.5)` - Röd med 50% opacity
- `rgba(0, 255, 0, 0.3)` - Grön med 30% opacity (lätt grön glöd)

## Testa spelet

Nu kan du:
1. **Spela som vanligt** - Samla mynt, undvik fiender
2. **Förlora** - Ta skada tills health = 0 → GAME OVER screen
3. **Vinna** - Samla alla mynt → VICTORY screen
4. **Restart** - Tryck R på GAME_OVER eller WIN → Spelet startas om

## Uppgifter

### Pause-funktionalitet

**Du lär dig att hantera fler game states.**

Lägg till en PAUSED state som aktiveras med Escape-tangenten:

```javascript
// I constructor
this.gameState = 'PLAYING' // eller 'PAUSED', 'GAME_OVER', 'WIN'

// I update()
if (this.inputHandler.keys.has('Escape')) {
    if (this.gameState === 'PLAYING') {
        this.gameState = 'PAUSED'
    } else if (this.gameState === 'PAUSED') {
        this.gameState = 'PLAYING'
    }
    this.inputHandler.keys.delete('Escape') // Förhindra spam
}

if (this.gameState !== 'PLAYING') return // Stoppa update om paused

// I draw()
if (this.gameState === 'PAUSED') {
    this.drawPaused(ctx)
}
```

### High score system

**Du lär dig att spara data med localStorage.**

Spara högsta score mellan spel-sessioner:

```javascript
// I constructor
this.highScore = parseInt(localStorage.getItem('highScore')) || 0

// När spelaren vinner eller dör
if (this.score > this.highScore) {
    this.highScore = this.score
    localStorage.setItem('highScore', this.highScore.toString())
}

// Visa i UI
ctx.fillText(`High Score: ${this.highScore}`, 20, 130)
```

### Timer-baserad challenge

**Du lär dig att skapa tidsbegränsade utmaningar.**

Lägg till en timer - spelaren måste samla alla mynt innan tiden tar slut:

```javascript
// I init()
this.timeLimit = 60000 // 60 sekunder i millisekunder
this.timeRemaining = this.timeLimit

// I update()
if (this.gameState === 'PLAYING') {
    this.timeRemaining -= deltaTime
    if (this.timeRemaining <= 0) {
        this.timeRemaining = 0
        this.gameState = 'GAME_OVER'
    }
}

// I UI.draw()
const secondsLeft = Math.ceil(this.game.timeRemaining / 1000)
ctx.fillText(`Time: ${secondsLeft}s`, 20, 100)
```

### Levels system

**Du lär dig att skapa progression mellan nivåer.**

Lägg till level progression - när spelaren vinner, gå till nästa nivå:

```javascript
// I constructor
this.currentLevel = 1
this.maxLevel = 3

// I init()
this.loadLevel(this.currentLevel)

loadLevel(levelNumber) {
    // Återställ state
    this.gameState = 'PLAYING'
    this.score = 0
    this.coinsCollected = 0
    
    // Ladda level-specifik data
    if (levelNumber === 1) {
        // Lätt nivå - få fiender
        this.enemies = [
            new Enemy(this, 200, this.height - 220, 40, 40, 80),
        ]
    } else if (levelNumber === 2) {
        // Medel nivå - fler fiender
        this.enemies = [
            new Enemy(this, 200, this.height - 220, 40, 40, 80),
            new Enemy(this, 450, this.height - 240, 40, 40),
        ]
    }
    // ... etc
}

// När spelaren vinner
if (this.coinsCollected === this.totalCoins && this.gameState === 'PLAYING') {
    if (this.currentLevel < this.maxLevel) {
        this.currentLevel++
        this.loadLevel(this.currentLevel)
    } else {
        this.gameState = 'WIN' // Alla levels klara!
    }
}
```

### Animerad win-screen

**Du lär dig att skapa juice med animationer.**

Lägg till animerade confetti eller stjärnor på win-screen:

```javascript
// I drawWin()
// Animera text med scale
const scale = 1 + Math.sin(Date.now() / 200) * 0.1
ctx.save()
ctx.translate(this.width / 2, this.height / 2 - 50)
ctx.scale(scale, scale)
ctx.fillText('VICTORY!', 0, 0)
ctx.restore()

// Rita fallande konfetti
if (!this.confetti) this.confetti = []
// Skapa nya confetti partiklar
for (let i = 0; i < 5; i++) {
    this.confetti.push({
        x: Math.random() * this.width,
        y: -10,
        speed: 0.1 + Math.random() * 0.2,
        color: ['red', 'yellow', 'blue', 'green'][Math.floor(Math.random() * 4)]
    })
}
// Rita och uppdatera
this.confetti.forEach((c, i) => {
    c.y += c.speed * deltaTime
    ctx.fillStyle = c.color
    ctx.fillRect(c.x, c.y, 5, 10)
    if (c.y > this.height) this.confetti.splice(i, 1)
})
```

### Smooth state transitions

**Du lär dig att göra övergångar mer eleganta.**

Lägg till fade-in/fade-out mellan states:

```javascript
// I constructor
this.transitionAlpha = 0
this.transitioning = false

// När state ändras
changeState(newState) {
    this.transitioning = true
    // Fade out
    const fadeOut = setInterval(() => {
        this.transitionAlpha += 0.05
        if (this.transitionAlpha >= 1) {
            clearInterval(fadeOut)
            this.gameState = newState
            // Fade in
            const fadeIn = setInterval(() => {
                this.transitionAlpha -= 0.05
                if (this.transitionAlpha <= 0) {
                    clearInterval(fadeIn)
                    this.transitioning = false
                }
            }, 16)
        }
    }, 16)
}

// I draw() (överst)
if (this.transitioning) {
    ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`
    ctx.fillRect(0, 0, this.width, this.height)
}
```

## Sammanfattning

Vi har nu implementerat ett komplett game state system!

**Vad vi gjorde:**
- State machine med PLAYING, GAME_OVER, WIN
- Win condition (alla mynt samlade)
- Lose condition (health = 0)
- Restart funktionalitet med R-tangenten
- Overlay screens med score och instruktioner
- Init/restart pattern för återanvändbar kod

**Nyckelkoncept:**
- State machine = Ett tillstånd åt gången
- Conditions trigger state changes
- State styr vad som uppdateras och ritas
- Overlay screens ger feedback
- Init method = DRY principle

## Testfrågor

1. Vad är en state machine? Beskriv de tre states vårt spel har och hur man övergår mellan dem.
2. Varför separerar vi `init()` från `constructor()`? Vilka fördelar ger detta pattern?
3. Varför kollar vi restart-input (`r`) **före** `if (this.gameState !== 'PLAYING') return`?
4. Förklara skillnaden mellan `rgb()` och `rgba()`. När använder vi rgba?
5. Varför ritar vi spelvärlden även när `gameState === 'GAME_OVER'`? Varför inte bara svart skärm?
6. Vad händer om vi glömmer `this.totalCoins = this.coins.length` i init()? Hur påverkar det win condition?
7. Varför använder vi `ctx.save()` och `ctx.restore()` i drawGameOver/drawWin?
8. **[BUGGFIX]** Varför kan `deltaTime` bli jättestort vid första framen? Förklara problemet och de två delarna av lösningen.
9. **[BUGGFIX]** Varför räcker det med `lastTime === 0` check och deltaTime cap? Varför behövs ingen separat restart-hantering?
10. Beskriv flödet från att spelaren samlar sista myntet till att win-screen visas. Vilka metoder anropas?

## Nästa steg

Nu när vi har ett komplett spel med states, är nästa steg att implementera ett kamerasystem så nivån kan vara större än skärmen. Detta är avgörande för sidoscrollande plattformsspel!

Byt till `07-camera` branchen för att fortsätta.

```bash
git checkout 07-camera
```

Öppna sedan filen [Steg 7 - Camera](07-camera.md) för att fortsätta!
