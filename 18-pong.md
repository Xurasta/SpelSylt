# Steg 18 - Pong

I detta steg skapar vi det klassiska spelet Pong som en demonstration av hur vår spelmotor fungerar för 2-spelare spel. Vi kommer att återanvända mycket av den befintliga koden från tidigare steg, inklusive GameBase, GameObject-hierarkin och InputHandler.

## Översikt

Pong är ett bra exemplet på hur vi kan återanvända vår spelmotor för något annat. Vi bygger ett helt fungerande 2-spelare spel med endast ~150 rader ny kod. Detta visar förhoppningsvis hur användbar vår grund är.

**Mål:**
- Maximalt återanvändande av befintlig kod
- 2-spelare support utan ändringar i InputHandler
- Ball extends Rectangle för att återanvända studs fysiken
- Paddle extends GameObject för grundläggande funktionalitet
- Ingen gravity, ingen scrolling, inga sprites - minimalistiskt

## Arkitektur och återanvändning

### Vad återanvänds DIREKT utan ändringar

| Komponent | Återanvändning | Användning i Pong |
|-----------|---------------|-------------------|
| **GameBase** | 100% | Extends GameBase, får gameState, inputHandler, enemies array |
| **GameObject** | 100% | Bas för Paddle (x, y, width, height, update, draw) |
| **Rectangle** | 90% | Bas för Ball, återanvänder bounce-logik |
| **InputHandler** | 100% | Hanterar 2 spelare utan ändringar (keys Set) |
| **Camera** | 0% | Används ej - fixed screen game |
| **UserInterface** | 0% | Används ej - egen score rendering |

## Filstruktur

```
src/
  pong/
    PongGame.js       # Huvudspel, extends GameBase 
    Paddle.js         # Spelare-kontrollerad paddel, extends GameObject
    Ball.js           # Boll med bounce, extends Rectangle 
```

Total kod: **~200 lines** (inklusive kommentarer)

## Komponenter

### PongGame.js

Extends GameBase och implementerar den klassiska Pong-loopen:

```javascript
export default class PongGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // 2-spelare scoring
        this.player1Score = 0
        this.player2Score = 0
        this.winScore = 5
        
        this.init()
    }
    
    init() {
        // Skapa 2 paddlar med olika tangenter
        this.paddle1 = new Paddle(this, 30, y, w, h, 'w', 's')
        this.paddle2 = new Paddle(this, x, y, w, h, 'ArrowUp', 'ArrowDown')
        
        // Skapa boll
        this.ball = new Ball(this, width/2, height/2, 15, 15)
    }
}
```

**Återanvändning:**
- `super(width, height)` - Får GameBase funktionalitet
- `this.inputHandler` - Används av Paddle för 2-spelare input
- `this.gameState` - PLAYING och GAME_OVER states
- `checkCollision()` - Standard AABB collision

**Anpassningar:**
- Dubbel score (player1Score, player2Score)
- Mål detection istället för enemy spawning
- Egen draw() med mittlinje och stora score-siffror

### Paddle.js

En väldigt lite utökning av GameObject för att hantera spelarkontrollerade paddlar och vi kan känna igen movement hanteringen från player i plattformspelet:

```javascript
export default class Paddle extends GameObject {
    constructor(game, x, y, width, height, upKey, downKey) {
        super(game, x, y, width, height)
        this.upKey = upKey      // 'w' eller 'ArrowUp'
        this.downKey = downKey  // 's' eller 'ArrowDown'
        this.speed = 0.4
    }
    
    update(deltaTime) {
        // Läs tangenter från game.inputHandler
        if (this.game.inputHandler.keys.has(this.upKey)) {
            this.y -= this.speed * deltaTime
        }
        if (this.game.inputHandler.keys.has(this.downKey)) {
            this.y += this.speed * deltaTime
        }
        
        // Begränsa till canvas
        if (this.y < 0) this.y = 0
        if (this.y + this.height > this.game.height) {
            this.y = this.game.height - this.height
        }
    }
}
```

**Återanvändning:**
- `super()` - Får x, y, width, height, game reference
- `this.game.inputHandler.keys` - Set av nedtryckta tangenter
- `draw()` - Ärver standard draw (kan override)

**Anpassningar:**
- Tar 2 tangenter som constructor-parametrar (upKey, downKey)
- Enkel vertikal rörelse
- Canvas bounds clamping

### Ball.js

Extends Rectangle för att återanvända bounce physics:

```javascript
export default class Ball extends Rectangle {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height, '#fff')
        this.startX = x
        this.startY = y
        this.speed = 0.3
        this.bounce = 1.0  // Perfekt studs från Rectangle
        this.reset()
    }
    
    reset() {
        this.x = this.startX
        this.y = this.startY
        
        // Slumpmässig startriktning (±30 grader)
        const angle = (Math.random() - 0.5) * Math.PI / 3
        const direction = Math.random() < 0.5 ? 1 : -1
        
        this.velocityX = Math.cos(angle) * this.speed * direction
        this.velocityY = Math.sin(angle) * this.speed
    }
    
    update(deltaTime) {
        // Rörelse
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Bounce mot topp/botten (Rectangle hade vägg-bounce)
        if (this.y < 0 || this.y + this.height > this.game.height) {
            this.velocityY = -this.velocityY * this.bounce
        }
        // INTE bounce mot vänster/höger - det är mål!
    }
    
    bounceOffPaddle() {
        this.velocityX = -this.velocityX * 1.05  // Speed up
    }
}
```

**Återanvändning:**
- `super()` - Får velocityX, velocityY, bounce från Rectangle
- Rectangle hade redan bounce-logik i update()
- `this.bounce = 1.0` - Perfekt studs (ingen energiförlust)

**Anpassningar:**
- Override update() för att inte studsa mot sidorna
- `reset()` - Slumpmässig startriktning med trigonometri
- `bounceOffPaddle()` - Speed increase vid träff

## Input System - 2 spelare utan ändringar

Pong spelet låter oss visa hur vi kan använda samma InputHandler för 2 spelare utan att ändra något i InputHandler-koden:

```javascript
// InputHandler.js (oförändrad)
export default class InputHandler {
    constructor(game) {
        this.keys = new Set()  // Sparar ALLA nedtryckta tangenter
        window.addEventListener('keydown', (e) => this.keys.add(e.key))
        window.addEventListener('keyup', (e) => this.keys.delete(e.key))
    }
}

// I Paddle.js kan båda spelarna läsa från samma Set
if (this.game.inputHandler.keys.has('w')) { /* Player 1 */ }
if (this.game.inputHandler.keys.has('ArrowUp')) { /* Player 2 */ }
```

Detta visar att vår InputHandler-design var generell från början!

## Kontroller

- **Player 1:** W (upp), S (ner)
- **Player 2:** Arrow Up, Arrow Down
- **Restart:** SPACE (efter Game Over)

## Uppgifter

Spelklassikern är nu din, vi kan fråga oss vad som gör Pong roligt. Men vi kan också fråga oss vad vi kan lägga till för att göra det ännu bättre!

### 1. Lägg till ljudeffekter
Använd ljudsystemet från steg 14 för att lägga till:
- "Blip" när bollen träffar paddle
- "Boop" när bollen träffar vägg
- "Score" ljud när någon gör mål

### 2. Power-ups
Lägg till power-ups som dyker upp i mitten:
- **Big Paddle** - Gör paddeln längre i 5 sekunder
- **Fast Ball** - Ökar bollens hastighet
- **Slow Ball** - Minskar bollens hastighet

Använd GameObject som bas och collision detection från PongGame.

### 3. AI-motståndare
Skapa en `AIPaddle` klass som extends Paddle:
```javascript
class AIPaddle extends Paddle {
    update(deltaTime) {
        // Följ bollen istället för tangenter
        if (this.game.ball.y < this.y + this.height/2) {
            this.y -= this.speed * deltaTime
        } else {
            this.y += this.speed * deltaTime
        }
        // Clamp...
    }
}
```

### 4. Olika spellägen
- **Classic** - Första till 5
- **Time Attack** - Flest poäng på 2 minuter
- **Survival** - Paddeln krymper vid varje miss

Använd gameState för att växla mellan lägen.

### 5. Particles och juice
Lägg till particle effects när:
- Bollen träffar paddle (sparks)
- Någon gör mål (explosion)
- Ball hastighet ökar (trail effect)

