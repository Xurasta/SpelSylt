# Steg 20: Vector2 System + Runner Game

## Översikt

I detta steg gör vi två viktiga förändringar samtidigt:

1. **Introducerar Vector2-systemet** - En matematisk grund för 2D-vektoroperationer
2. **Förenklar till Runner-spel** - Fokuserar på ett enkelt, klassiskt spelkoncept

Detta är en **refaktorering** och **förenkling** som skapar en bättre grund för att lära avancerade koncept (events, state machines) i kommande steg.

## Varför denna förändring?

### Problem med tidigare approach:

❌ För många koncept på en gång (plattformer, fiender, mynt, skjutning, health)  
❌ Vector2 introducerades i en komplex kontext  
❌ Svårt att se fördelarna med Vector2 bland all annan kod  
❌ Skalning för framtida events och state machines blir krångligt

### Lösning:

✅ **Vector2 + Runner** = Perfekt kombination  
✅ Enkelt spel visar Vector2 fördelarna tydligt  
✅ Fokus på fysik och rörelse (vektorns styrka)  
✅ Bättre grund för events (collision events) och FSM senare  
✅ Runner är **iconic** - alla känner igen Chrome dino

---

## Del 1: Vector2 System

### Vad är Vector2?

En **vektor** representerar en punkt i 2D-rummet eller en riktning med storlek. Istället för att hantera `x` och `y` separat skapar vi en klass som kapslar in vektoroperationer.

**Före (med separata x/y):**
```javascript
this.x += this.velocityX * deltaTime
this.y += this.velocityY * deltaTime

// Distansberäkning - måste komma ihåg Pythagoras
const dx = enemy.x - this.x
const dy = enemy.y - this.y
const distance = Math.sqrt(dx * dx + dy * dy)
```

**Efter (med Vector2):**
```javascript
this.position.addScaled(this.velocity, deltaTime)

// Tydlig intent, en rad
const distance = this.position.distanceTo(enemy.position)
```

### Vector2-klassen

Skapa [`src/Vector2.js`](src/Vector2.js)

```javascript
export default class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
    
    // Immutable - returnerar nya vektorer
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y)
    }
    
    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y)
    }
    
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar)
    }
    
    // Mutable - ändrar vektorn (performance)
    addInPlace(other) {
        this.x += other.x
        this.y += other.y
        return this
    }
    
    // Hybrid - vanligaste fallet
    addScaled(other, scalar) {
        this.x += other.x * scalar
        this.y += other.y * scalar
        return this
    }
    
    // Användbara metoder
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    
    distanceTo(other) {
        const dx = this.x - other.x
        const dy = this.y - other.y
        return Math.sqrt(dx * dx + dy * dy)
    }
    
    normalize() {
        const len = this.length()
        if (len === 0) return new Vector2(0, 0)
        return new Vector2(this.x / len, this.y / len)
    }
    
    // ... fler metoder
}
```

Se [src/Vector2.js](src/Vector2.js) för fullständig implementation.

### GameObject med Vector2

**Före:**
```javascript
class GameObject {
    constructor(game, x, y, width, height) {
        this.x = x
        this.y = y
    }
}
```

**Efter:**
```javascript
import Vector2 from './Vector2.js'

class GameObject {
    constructor(game, x, y, width, height) {
        this.position = new Vector2(x, y)
        
        // Getters/setters för bakåtkompatibilitet
        get x() { return this.position.x }
        set x(value) { this.position.x = value }
    }
}
```

---

## Del 2: Runner Game

### Vad är ett Runner-spel?

Ett **endless runner** är ett spel där spelaren springer automatiskt åt ett håll och måste hoppa över/ducka under hinder. Klassiska exempel:

- Chrome Dinosaur Game
- Temple Run
- Subway Surfers
- Geometry Dash

### Spelmekanik

**Enkelt och fokuserat:**
- 🏃 Spelaren springer automatiskt
- ⬆️ Space/Arrow Up för att hoppa
- 🌵 Hinder spawnar från höger
- 💀 One-hit death (inga health bars)
- 📊 Score baserat på distans

### Nya klasser

#### 1. Obstacle.js

```javascript
export default class Obstacle extends GameObject {
    constructor(game, x, y, width, height, type = 'cactus') {
        super(game, x, y, width, height)
        this.type = type // 'cactus', 'bird', 'rock'
        this.speed = 0.3 // Pixels per ms mot vänster
    }
    
    update(deltaTime) {
        // Flytta hindret mot vänster
        this.position.x -= this.speed * deltaTime
        
        // Ta bort när utanför skärmen
        if (this.position.x + this.width < 0) {
            this.markedForDeletion = true
        }
    }
}
```

#### 2. ObstacleSpawner.js

Ansvarar för att spawna hinder procedurellt:

```javascript
export default class ObstacleSpawner {
    constructor(game) {
        this.game = game
        this.minSpawnInterval = 1200 // ms
        this.maxSpawnInterval = 2500
        this.difficultyTimer = 0
    }
    
    update(deltaTime) {
        // Spawna hinder vid intervaller
        if (this.spawnTimer >= this.nextSpawnTime) {
            this.spawn()
        }
        
        // Öka svårighet över tid
        if (this.difficultyTimer >= 10000) {
            this.minSpawnInterval -= 100
            this.maxSpawnInterval -= 150
        }
    }
    
    spawn() {
        const types = ['cactus', 'bird', 'rock']
        const type = types[Math.floor(Math.random() * types.length)]
        const obstacle = new Obstacle(this.game, x, y, w, h, type)
        this.game.obstacles.push(obstacle)
    }
}
```

#### 3. RunnerGame.js

Huvudspel-klassen:

```javascript
export default class RunnerGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        this.obstacles = []
        this.obstacleSpawner = new ObstacleSpawner(this)
        this.distance = 0 // Score
    }
    
    update(deltaTime) {
        // Öka distans (score)
        this.distance += 0.1 * deltaTime
        
        // Spawna hinder
        this.obstacleSpawner.update(deltaTime)
        
        // Uppdatera hinder
        this.obstacles.forEach(o => o.update(deltaTime))
        
        // Kolla kollision
        for (const obstacle of this.obstacles) {
            if (this.player.intersects(obstacle)) {
                this.gameOver()
            }
        }
    }
}
```

### Förenklad Player

**Borttaget:**
- ❌ Health system
- ❌ Shooting
- ❌ Invulnerability
- ❌ Horizontal movement

**Behållet:**
- ✅ Jumping (space/arrow up)
- ✅ Gravity
- ✅ Animation (run/jump/fall)
- ✅ Vector2 för velocity

```javascript
export default class Player extends GameObject {
    constructor(game, x, y, width, height, color) {
        super(game, x, y, width, height)
        this.velocity = new Vector2(0, 0) // Vector2!
        this.jumpPower = -0.7
    }
    
    update(deltaTime) {
        // Hopp
        if (keys.has(' ') && this.isGrounded) {
            this.velocity.y = this.jumpPower
        }
        
        // Gravitation
        this.velocity.y += this.game.gravity * deltaTime
        
        // Uppdatera position med Vector2
        this.position.addScaled(this.velocity, deltaTime)
    }
}
```

---

## Fördelar med denna approach

### Pedagogiskt:

1. **Fokuserat lärande** - Ett koncept i taget (Vector2)
2. **Enklare kod** - Mindre distraktioner
3. **Tydliga exempel** - Runner visar Vector2 fördelarna
4. **Bättre progression** - Runner → Events → FSM → Complex platformer

### Tekniskt:

1. **Mindre kod** - Färre filer och klasser
2. **Bättre foundation** - Vector2 är grunden för allt
3. **Enklare att extendera** - Collision events blir tydligare senare
4. **Procedural generation** - Introducerar spawning patterns

### Speldesign:

1. **Iconic genre** - Runner är välkänt
2. **Endless gameplay** - Naturligt progressivt svårt
3. **High score focus** - Tävlingsmoment
4. **Simpel men rolig** - Bevisar att enkelt kan vara bra

---

## Vector2 i praktiken (Runner-exempel)

### Exempel 1: Player movement

**Före:**
```javascript
this.y += this.velocityY * deltaTime
```

**Efter:**
```javascript
this.position.addScaled(this.velocity, deltaTime)
```

### Exempel 2: Obstacle movement

**Före:**
```javascript
this.x -= this.speed * deltaTime
```

**Efter:**
```javascript
this.position.x -= this.speed * deltaTime
```

*Eller med Vector2:*
```javascript
const moveDirection = new Vector2(-1, 0)
this.position.addScaled(moveDirection, this.speed * deltaTime)
```

### Exempel 3: Collision detection

Eftersom vi använder `position` istället för `x/y` separat:

```javascript
intersects(other) {
    return this.position.x < other.position.x + other.width &&
           this.position.x + this.width > other.position.x &&
           this.position.y < other.position.y + other.height &&
           this.position.y + this.height > other.position.y
}
```

---

## Vad har vi tagit bort?

**Filer borttagna:**
- ❌ `src/Enemy.js`
- ❌ `src/Coin.js`
- ❌ `src/Projectile.js`
- ❌ `src/levels/Level1.js`
- ❌ `src/levels/Level2.js`

**Funktionalitet borttagen:**
- ❌ Health system
- ❌ Shooting mechanics
- ❌ Enemy AI
- ❌ Coin collection
- ❌ Level-based progression
- ❌ Invulnerability frames
- ❌ Horizontal player movement

**Resultat:**
- ✅ ~300 rader mindre kod
- ✅ 5 färre filer att underhålla
- ✅ Enklare att förstå
- ✅ Bättre fokus på Vector2

---

## Nästa steg

Nu när vi har:
- ✅ Vector2 som matematisk grund
- ✅ Ett enkelt runner-spel
- ✅ Ren, fokuserad kod

Kan vi gå vidare till:

**Steg 21: Event System**
- Collision events (`'obstacleHit'`, `'scoreIncrease'`)
- Loose coupling mellan objekt
- Observer pattern

**Steg 22: State Machine**
- Player states (running, jumping, dead)
- Game states (menu, playing, game over)
- FSM pattern

**Steg 23: Återgå till Platformer (Advanced)**
- Med events och FSM på plats
- Mycket renare implementation
- Students förstår varför

---

## Uppgifter

### 1. Lägg till fler obstacle types

Skapa nya typer av hinder:
```javascript
// I Obstacle.js
if (this.type === 'double') {
    // Rita två kaktusar bredvid varandra
}
```

### 2. Implementera ducking

Lägg till möjlighet att ducka under höga hinder:
```javascript
// I Player.js
if (keys.has('ArrowDown') && this.isGrounded) {
    this.isDucking = true
    this.height = 25 // Hälften av normal höjd
}
```

### 3. Power-ups

Skapa power-ups som spawnar ibland:
```javascript
class PowerUp extends GameObject {
    constructor(game, x, y, type) {
        super(game, x, y, 20, 20)
        this.type = type // 'shield', 'magnet', 'speedboost'
    }
}
```

### 4. Bakgrundsparallax

Lägg till flera bakgrundslager med olika hastigheter:
```javascript
this.backgrounds = [
    new Background(this, bgImage1, { autoScrollX: -0.02 }),
    new Background(this, bgImage2, { autoScrollX: -0.05 }),
    new Background(this, bgImage3, { autoScrollX: -0.08 })
]
```

### 5. High score med localStorage

Spara bästa score:
```javascript
gameOver() {
    const highScore = localStorage.getItem('runnerHighScore') || 0
    if (this.score > highScore) {
        localStorage.setItem('runnerHighScore', this.score)
    }
}
```

---

## Sammanfattning

Detta steg har:

1. **Introducerat Vector2** - Matematisk grund för all 2D-speldev
2. **Förenklat till Runner** - Fokuserat, iconic, pedagogiskt
3. **Tagit bort komplexitet** - Fiender, mynt, skjutning, etc.
4. **Skapat bättre grund** - För events och FSM i nästa steg

**Vector2 + Runner = Perfekt kombination för att lära speldev! 🎮🦖**
