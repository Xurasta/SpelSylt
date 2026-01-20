# Steg 10: Levels - Organisera nivåer

Efter att ha refaktorerat spelet till GameBase och PlatformerGame har vi en bra grund. Men all level-design ligger fortfarande hårdkodad i `PlatformerGame.init()`. Vad händer om vi vill ha flera nivåer? Eller göra det enkelt att skapa nya levels utan att röra i game-logiken?

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Level System** - Separera level-design från game logic
- **Abstract Level Class** - Mall för att skapa levels
- **Level Management** - Ladda och byta mellan levels
- **Data Separation** - Level data vs game mechanics
- **Skalbarhet** - Enkelt lägga till nya levels

## Problemet - Hårdkodad level-design

Just nu ligger all level-design i `PlatformerGame.init()`. Vi skapar allt genom att hårdkoda plattformar, mynt och fiender direkt i init-metoden. Det funkar för att testa, men i ett spel så vill vi separera denna data från spel-logiken.

```javascript
init() {
    // ... player setup ...
    
    // 70+ rader med hårdkodade plattformar
    this.platforms = [
        new Platform(this, 0, this.height - 40, ...),
        new Platform(this, 150, this.height - 140, ...),
        // ... många fler ...
    ]
    
    // 30+ rader med hårdkodade mynt
    this.coins = [
        new Coin(this, 200, this.height - 180),
        // ... många fler ...
    ]
    
    // ... hårdkodade fiender ...
}
```

## Lösningen - Level System

Vi skapar ett level-system med:
1. **Level (abstract)** - Basklass för alla levels
2. **Level1, Level2, etc** - Konkreta level-implementationer
3. **Level Management** - Ladda och byta mellan levels i PlatformerGame

Precis som tidigare så försöker vi hitta de gemensamma dragen och abstrahera dem till en basklass som vi sedan kan bygga vidare på. Vad ska ingå i Level-klassen? I nuläget så handlar det om att skapa plattformar, mynt och fiender. Men det låser till visss del Level till just en plattformsspelstyp. Men i det här fallet så är det okej. Vi kan också titta senare på hur vi kan byta ut Level-klassen för att passa andra speltyper. **Allt måste inte alltid vara generellt och återanvändbart.**


### Struktur

```
Level (abstract)
├── Properties: platforms[], coins[], enemies[], spawn position
├── Methods: createPlatforms(), createCoins(), createEnemies(), init(), getData()
│
├── Level1 (konkret)
│   └── Implementerar: createPlatforms(), createCoins(), createEnemies()
│
└── Level2 (konkret)
    └── Implementerar: createPlatforms(), createCoins(), createEnemies()

PlatformerGame
├── levels[] - Array av level-klasser
├── currentLevel - Aktiv level instance
├── loadLevel(index) - Ladda en specifik level
└── nextLevel() - Gå till nästa level
```

## Implementering

### Level.js - Abstract Base Class

Grunden i systemet är Level-klassen. Koden kan du se i [src/Level.js](src/Level.js).
Vi kan sedan använda den som bas för alla våra levels.

### Level1.js - Första nivån

I `Level1.js` definierar vi plattformar, mynt och fiender för den första nivån. Du känner igen den från spelet sen tidigare.

```javascript
import Level from '../Level.js'
import Platform from '../Platform.js'
// ... imports ...

export default class Level1 extends Level {
    constructor(game) {
        super(game)
        this.init()
    }
    
    createPlatforms() {
        const h = this.game.height
        this.platforms = [
            new Platform(this.game, 0, h - 40, this.game.worldWidth, 40, '#654321'),
            new Platform(this.game, 150, h - 140, 150, 20, '#8B4513'),
            // ... alla plattformar för level 1 ...
        ]
    }
    
    createCoins() { /* ... */ }
    createEnemies() { /* ... */ }
}
```

### Level2.js - Andra nivån

Level 2 är lite annorlunda med nya plattformar, mynt och fiender.

Se implementationen i [src/levels/Level2.js](src/levels/Level2.js).

### PlatformerGame - Level Management

Vi behöver nu uppdatera `PlatformerGame` för att använda vårt nya level-system. Vi importerar förstå de levels vi skapat och sedan så lägger vi till logik för att ladda och byta mellan levels.

Levels kommer att lagras som klasser i en array, och vi håller reda på vilken level som är aktiv med en index-variabel. När vi byter level så skapar vi en ny instans av den level-klassen och hämtar dess data för att sätta upp spelet.

```javascript
import Level1 from './levels/Level1.js'
import Level2 from './levels/Level2.js'

export default class PlatformerGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // Level management
        this.currentLevelIndex = 0
        this.levels = [Level1, Level2]
        this.currentLevel = null
        
        this.init()
    }
    
    init() {
        this.gameState = 'PLAYING'
        this.score = 0
        this.coinsCollected = 0
        this.loadLevel(this.currentLevelIndex)
    }
    
    loadLevel(levelIndex) {
        // Skapa level instance
        const LevelClass = this.levels[levelIndex]
        this.currentLevel = new LevelClass(this)
        
        // Hämta level data
        const data = this.currentLevel.getData()
        this.platforms = data.platforms
        this.coins = data.coins
        this.enemies = data.enemies
        this.totalCoins = this.coins.length
        
        // Skapa player på spawn position
        this.player = new Player(
            this, 
            data.playerSpawnX, 
            data.playerSpawnY, 
            50, 50, 'green'
        )
        
        this.projectiles = []
        this.camera.x = 0
        this.camera.y = 0
    }
    
    nextLevel() {
        this.currentLevelIndex++
        
        if (this.currentLevelIndex >= this.levels.length) {
            // Inga fler levels - spelet klart!
            this.gameState = 'WIN'
            return
        }
        
        this.loadLevel(this.currentLevelIndex)
        this.gameState = 'PLAYING'
    }
}
```

### Viktiga ändringar i `update()`

I `update()`-metoden i `PlatformerGame` behöver vi ändra hur vi kollar om spelaren har klarat leveln. Istället för att sätta `this.gameState = 'WIN'` direkt när alla mynt är samlade, så anropar vi `this.nextLevel()` för att ladda nästa nivå.

```javascript
// När alla mynt är samlade - gå till nästa level
if (this.coinsCollected === this.totalCoins && this.gameState === 'PLAYING') {
    this.nextLevel()  // Istället för this.gameState = 'WIN'
}
```

## Hur det fungerar

### När spelet startar

1. **PlatformerGame constructor**
   - Sätter `currentLevelIndex = 0`
   - Definierar `levels = [Level1, Level2]`
   - Anropar `init()`

2. **init() → loadLevel(0)**
   - Skapar `new Level1(this)`
   - Level1 constructor anropar `init()` som anropar:
     - `createPlatforms()` - skapar alla plattformar
     - `createCoins()` - skapar alla mynt
     - `createEnemies()` - skapar alla fiender

3. **loadLevel() fortsätter**
   - Hämtar data från level via `getData()`
   - Sätter `this.platforms = data.platforms`
   - Sätter `this.coins = data.coins`
   - Osv...

### När spelaren klarar en level

1. **Update loop upptäcker**
   ```javascript
   if (this.coinsCollected === this.totalCoins) {
       this.nextLevel()
   }
   ```

2. **nextLevel() körs**
   - Ökar `currentLevelIndex++`
   - Kollar om det finns fler levels
   - Om ja: `loadLevel(currentLevelIndex)` laddar nästa level
   - Om nej: `this.gameState = 'WIN'`

3. **Ny level laddas**
   - Samma process som vid start
   - Nya plattformar, mynt, fiender
   - Spelaren spawnas på ny position
   - Camera återställs

## Fördelar med Level System

### Separation of Concerns

**Före:**
```
PlatformerGame.init()
├── Game setup
├── Player creation
├── 70 rader platforms
├── 30 rader coins
└── 20 rader enemies
```

**Efter:**
```
PlatformerGame.init()
└── loadLevel() → Level1.init()
                  ├── createPlatforms()
                  ├── createCoins()
                  └── createEnemies()
```

### Enkelt lägga till nya levels

Skapa bara en ny fil `Level3.js`:

```javascript
import Level from '../Level.js'

export default class Level3 extends Level {
    createPlatforms() { /* design här */ }
    createCoins() { /* design här */ }
    createEnemies() { /* design här */ }
}
```

Lägg till i PlatformerGame:
```javascript
import Level3 from './levels/Level3.js'

this.levels = [Level1, Level2, Level3]
```

Klart! Ingen annan kod behöver ändras.

### Testa olika designs

Lätt att:
- Skapa varianter av samma level
- Testa olika svårighetsgrader
- A/B-testa level layouts
- Ha special-levels (bonus, boss, etc)

### Återanvändning

Samma Level-struktur kan användas för:
- Olika game modes (time trial, survival, etc)
- Level editor verktyg
- Procedural generation (skapa random levels)
- Load from file (JSON level data)

## Design Patterns

### Factory Pattern

`loadLevel(index)` fungerar som en factory:
- Tar in ett index
- Skapar rätt Level-instans
- Returnerar level data

### Strategy Pattern

Olika levels = olika strategier för level-design:
- Level1: Tutorial, enkelt
- Level2: Challenge, svårare
- Level3: Expert, extreme

Samma interface, olika implementationer.

### Template Method Pattern (igen!)

Level.init() definierar strukturen:
```
1. createPlatforms()
2. createCoins()
3. createEnemies()
```

Subklasser fyller i detaljerna, men ordningen är fix.

## OOP Principer

**Abstraktion**: Level-klassen definierar interface, subklasser implementerar

**Encapsulation**: Level data inkapsulad i Level-objekt, exponerad via `getData()`

**Single Responsibility**: 
- Level: Ansvarar för level-design
- PlatformerGame: Ansvarar för game mechanics

**Open/Closed**: Öppet för nya levels (extend Level), stängt för ändringar (ingen kod i PlatformerGame behöver ändras)

## Framtida möjligheter

Med detta level-system på plats kan vi enkelt:

1. **Level Selection** - Meny för att välja level
2. **Load from JSON** - Spara/ladda levels som JSON-filer
3. **Procedural Generation** - Generera random levels
4. **Level Statistics** - Spara bästa tid, high score per level
5. **Bonus Levels** - Special levels med unika mekaniker
6. **Boss Levels** - Levels med boss-strider
