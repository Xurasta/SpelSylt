# Steg 20: Vector2 System + Runner Game

Vad är ett Vector2 system? Att arbeta med 2D-vektorer för position, hastighet och acceleration istället för separata x/y-värden är något som är vanligt i spelutveckling. I detta steg introducerar vi en komplett Vector2-klass. Klassen är i nuläget absolut overkill med massor av extra metoder, men det finns där för att visa kraften i vektorer och förbereda för framtida steg.

I det här steget kastar vi också lite gammal platforms-spelskod för att skapa ett enkelt endless runner-spel inspirerat av Chrome dino-spelet. Detta gör det förhoppningsvis lite enklare att se fördelarna med Vector2 i en enklare kontext.

## Översikt

I detta steg gör vi två viktiga förändringar samtidigt:

1. **Introducerar Vector2-systemet** - En matematisk grund för 2D-vektoroperations
2. **Förenklar till Runner-spel** - Ett Chrome dino-inspirerat endless runner-spel
3. **Polerad presentation** - Sprites, animations, menu-system, debug mode

Detta är en **refaktorering** och **förenkling** som skapar en bättre grund för att lära avancerade koncept (events, state machines) i kommande steg.


## Vector2 System

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

[`src/Vector2.js`](src/Vector2.js) innehåller 350+ rader med 40+ metoder:

#### Kategorier av metoder:

**1. Factory methods (static):**
```javascript
Vector2.zero()           // (0, 0)
Vector2.one()            // (1, 1)
Vector2.up()             // (0, -1)
Vector2.down()           // (0, 1)
Vector2.left()           // (-1, 0)
Vector2.right()          // (1, 0)
Vector2.fromAngle(rad)   // Skapa från vinkel
```

**2. Immutable operations (returnerar nya vektorer):**
```javascript
v1.add(v2)          // v1 + v2
v1.subtract(v2)     // v1 - v2
v1.multiply(5)      // v1 * 5
v1.divide(2)        // v1 / 2
v1.normalize()      // Enhetsvektor i samma riktning
v1.rotate(angle)    // Rotera vektor
```

**3. Mutable operations (ändrar vektorn, returnerar this):**
```javascript
v1.addInPlace(v2)       // v1 += v2
v1.subtractInPlace(v2)  // v1 -= v2
v1.multiplyInPlace(5)   // v1 *= 5
v1.normalizeInPlace()   // Normalisera in-place
```

**4. Hybrid operations (vanligaste fallet):**
```javascript
v1.addScaled(v2, scalar)       // v1 += v2 * scalar
v1.subtractScaled(v2, scalar)  // v1 -= v2 * scalar
v1.lerp(v2, t)                 // Linear interpolation
v1.moveTowards(target, maxDist) // Flytta mot target
```

**5. Query methods:**
```javascript
v1.length()              // Längd (magnitude)
v1.lengthSquared()       // Längd^2 (snabbare, för jämförelser)
v1.distanceTo(v2)        // Distans till annan vektor
v1.distanceSquaredTo(v2) // Distans^2 (snabbare)
v1.dot(v2)               // Dot product
v1.cross(v2)             // Cross product (z-komponent)
v1.angle()               // Vinkel i radianer
v1.angleTo(v2)           // Vinkel till annan vektor
v1.equals(v2)            // Jämförelse
```

**6. Utility methods:**
```javascript
v1.clone()               // Kopiera vektor
v1.set(x, y)            // Sätt x och y
v1.copy(v2)             // Kopiera från annan vektor
v1.negate()             // Negera (vänd riktning)
v1.negateInPlace()      // Negera in-place
v1.abs()                // Absoluta värden
v1.clamp(min, max)      // Begränsa längd
v1.reflect(normal)      // Reflektera mot normal
v1.project(onto)        // Projicera på annan vektor
```

### Varför tre typer av operationer?

**Immutable** - Functional programming style, säkert:
```javascript
const newPos = position.add(velocity)  // position oförändrad
```

**Mutable** - Performance, när du vet att du vill ändra:
```javascript
position.addInPlace(velocity)  // Ändrar position direkt
```

**Hybrid** - Bäst av båda världar:
```javascript
// Vanligaste fallet: position += velocity * deltaTime
position.addScaled(velocity, deltaTime)
```

---
## GameObject refaktorisering

Så med alla dessa ändringar och att vi ska ta bort samtliga referenser till `x` och `y` i koden, hur ser då GameObject-klassen ut?

### GameObject med Vector2

[`src/GameObject.js`](src/GameObject.js) är grunden för alla spelobjekt:

```javascript
export default class GameObject {
    constructor(game, x = 0, y = 0, width = 0, height = 0) {
        this.game = game
        this.position = new Vector2(x, y)  // Vector2!
        this.width = width
        this.height = height
        this.markedForDeletion = false
        
        // Animation properties
        this.animations = null
        this.currentAnimation = null
        this.frameIndex = 0
        this.frameTimer = 0
        this.frameInterval = 100
        this.spriteLoaded = false
    }
    
    // Collision detection med Vector2
    intersects(other) {
        return this.position.x < other.position.x + other.width &&
               this.position.x + this.width > other.position.x &&
               this.position.y < other.position.y + other.height &&
               this.position.y + this.height > other.position.y
    }
    
    // Sprite animation support
    loadSprite(animationName, imagePath, frames, frameInterval = null)
    updateAnimation(deltaTime)
    drawSprite(ctx, camera = null, flipHorizontal = false)
}
```

## Runner spelet

Ytterligare ett exempel på hur vi kan använda vår spelmotor. Här gör vi det för att visa Vector2 i praktiken.

### Spelstruktur

```
RunnerGame (GameBase)
├── Player (GameObject)
├── Obstacles[] (GameObject)
│   ├── Rock Head (static sprite)
│   └── Saw (animated sprite)
├── Platforms[] (GameObject)
│   └── Tiled terrain (3 rows)
├── Backgrounds[]
│   ├── Blue tiled sky
│   └── Big clouds layer
├── BackgroundObjects[]
│   └── 5 small floating clouds
└── Menus
    ├── MainMenu
    └── GameOverMenu
```

### RunnerGame.js

Huvudklassen [`src/RunnerGame.js`](src/RunnerGame.js).

En sammanfattning av viktiga delar och förändringar, inklusive bakgrunds- och plattformsinställningar.

### Layered Background System

Runner använder flera parallax-lager:

```javascript
// 1. Static tiled sky
new Background(this, bgImage, {
    autoScrollX: 0,  // Ingen scroll
    tileX: true,
    tileY: true
})

// 2. Big clouds (slow scroll)
new Background(this, bigCloudsImage, {
    autoScrollX: -0.02,
    tileX: true,
    tileY: false,
    yPosition: this.height - 150,
    height: 200
})

// 3. Small floating clouds (faster scroll)
const cloudImages = [smallCloud1, smallCloud2, smallCloud3]
for (let i = 0; i < 5; i++) {
    const cloudImg = cloudImages[Math.floor(Math.random() * cloudImages.length)]
    const x = Math.random() * this.width * 2
    const y = 50 + Math.random() * 150
    const speed = -0.03 - Math.random() * 0.02
    
    this.backgroundObjects.push(
        new BackgroundObject(this, x, y, cloudImg, {
            velocity: { x: speed, y: 0 },
            wrapX: true,
            scale: 0.8 + Math.random() * 0.4
        })
    )
}
```

### Tiled Terrain Platform

3 separata platforms skapar marken:

```javascript
const groundY = this.height - 48
this.platforms = [
    // Row 1 (top)
    new Platform(this, 0, groundY, this.width * 3, 16, '#654321', {
        src: terrainImage,
        sourceX: 112,  // Column 7 (7 * 16px)
        sourceY: 0,    // Row 0
        width: 16,
        height: 16
    }),
    // Row 2 (middle)
    new Platform(this, 0, groundY + 16, this.width * 3, 16, '#654321', {
        src: terrainImage,
        sourceX: 112,
        sourceY: 16,   // Row 1
        width: 16,
        height: 16
    }),
    // Row 3 (bottom)
    new Platform(this, 0, groundY + 32, this.width * 3, 16, '#654321', {
        src: terrainImage,
        sourceX: 112,
        sourceY: 32,   // Row 2
        width: 16,
        height: 16
    })
]
```

### Förenklad Player

**Borttaget:**
- Health system
- Shooting
- Invulnerability
- Horizontal movement

**Behållet:**
- Jumping (space/arrow up)
- Gravity
- Animation (run/jump/fall)
- Vector2 för velocity

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

1. **Introducerat Vector2** (350+ rader, 40+ metoder) - Matematisk grund för all 2D-speldev
2. **Förenklat till Runner** - Chrome dino-inspirerat endless runner
3. **Tagit bort komplexitet** - Fiender, mynt, skjutning, levels (~430 rader borttaget)
4. **Tagit bort bakåtkompatibilitet** - Inga x/y getters/setters, ren Vector2-användning
5. **Lagt till sprites** - Rock Head, Saw, tiled terrain, layered backgrounds
6. **Menu-baserade screens** - MainMenu, GameOverMenu med key shortcuts
7. **Debug mode** - Press P för hitboxes och debug info
8. **Polerad presentation** - Multi-layer parallax, procedural clouds, timer

**Borttagna filer:**
- ❌ `Enemy.js`
- ❌ `Coin.js`
- ❌ `Projectile.js`
- ❌ `Level1.js`, `Level2.js`, `Level.js`
- ❌ `Rectangle.js`
- ❌ `PlatformerGame.js`

**Nya filer:**
- ✅ `Vector2.js` (350+ lines)
- ✅ `Obstacle.js`
- ✅ `ObstacleSpawner.js`
- ✅ `RunnerGame.js`
- ✅ `GameOverMenu.js`

**Viktiga arkitekturbeslut:**
1. Fixed camera (0, 0) - background scrollar istället
2. Inga bakåtkompatibilitetslager - tvingar Vector2
3. Menu-system för alla screens
4. Sprite-baserad rendering med tiling
5. Debug mode för utveckling

**Vector2 + Runner = Perfekt kombination för att lära speldev! 🎮🦖**

---

## Nästa steg

**Steg 21: Event System**
- Observer pattern
- Collision events
- Decoupling med events

**Steg 22: State Machine (FSM)**
- Player states
- Clean state transitions  
- FSM pattern

**Vector2 är grunden. Events och FSM är nästa nivå.** 🚀
