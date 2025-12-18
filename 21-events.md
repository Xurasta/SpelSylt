# Steg 21: Event System (Observer Pattern)

Det här blir en stor och viktig del av spelets arkitektur. Vi implementerar ett **Event System** som gör att olika delar av spelet kan kommunicera utan att vara hårt kopplade till varandra. Det är ett designmönster som kallas **Observer Pattern**. Det är ett komplement till objektorienterad programmering och hjälper till att hålla koden modulär, flexibel och lätt att underhålla.

## Översikt

I detta steg implementerar vi ett **Event System** baserat på Observer Pattern. Detta ger oss **loose coupling** mellan objekt - objekt kan kommunicera utan att ha direkta referenser till varandra.

---

## Arkitektur: Före vs Efter

### FÖRE: Tight Coupling

```
Player.update()
    │
    └─> if (collision with obstacle)
            │
            ├─> game.gameOver()                    Direkt beroende
            ├─> game.audioManager.play('hit')      Player känner till Audio
            ├─> game.particles.emit('explosion')   Player känner till Particles
            └─> game.ui.flash('red')               Player känner till UI

Problem:
• Player måste känna till 4 olika system
• Svårt att testa Player isolerat
• Kan inte enkelt lägga till/ta bort features
• Ändring i ett system kan kräva ändringar i Player
• Cirkulära beroenden kan uppstå
```

**Konkret exempel - Lägg till ljud:**
```javascript
// Måste ändra i Player.js
if (this.player.intersects(obstacle)) {
    this.gameOver()
    this.audioManager.play('hit')  // NY RAD - ändrar Player kod
}
```

### EFTER: Loose Coupling med Events

```
Player.update()
    │
    └─> if (collision with obstacle)
            │
            └─> events.emit('obstacleHit', {
                    obstacle, player, score, time
                })
                        │
                        │ (alla lyssnar oberoende)
                        │
                        ├─> RunnerGame.gameOver()      Subscriber
                        ├─> AudioManager.play()        Subscriber
                        ├─> ParticleSystem.emit()      Subscriber
                        ├─> UI.flash()                 Subscriber
                        └─> AchievementSystem.check()  Subscriber

Fördelar:
• Player känner BARA till event systemet
• Enkelt att testa - mocka events.emit()
• Lägg till features utan att röra Player
• System bestämmer själva om de vill lyssna
• Inga cirkulära beroenden
```

**Konkret exempel - Lägg till ljud:**
```javascript
// Lägg till i AudioManager.js - Player påverkas inte
class AudioManager {
    constructor(game) {
        game.events.on('obstacleHit', () => this.play('hit'))
    }
}
```

### Informationsflöde

```
┌──────────┐
│  Player  │  Emits: 'playerJump', 'playerLanded'
└────┬─────┘
     │
     ├─> events (centralt system)
     │
     v
┌──────────────┐
│ ObstacleSpawner │  Emits: 'obstacleSpawned'
└────┬──────────┘
     │
     ├─> events
     │
     v
┌──────────────┐
│  RunnerGame  │  Emits: 'obstacleHit', 'scoreMilestone'
└────┬──────────┘     Listens: 'obstacleHit' -> gameOver()
     │
     └─> events
             │
             ├─> AudioManager (listens to all)
             ├─> ParticleSystem (listens to all)
             ├─> UI (listens to specific events)
             └─> Future systems...
```

**Varför detta är kraftfullt:**
1. **Separation**: Varje system har sitt eget ansvarsområde
2. **Modulärt**: System kan läggas till/tas bort utan konflikter
3. **Testbart**: Mocka events istället för hela spelet
4. **Skalbart**: Lägg till 10 nya listeners utan att röra emitern
5. **Underhållbart**: Bugg i ett system påverkar inte andra

---

## Varför Event System?



### Problem utan events:

```javascript
// Tight coupling - Player känner till RunnerGame
if (this.player.intersects(obstacle)) {
    this.gameOver()  // Direkt anrop
}

//  Svårt att lägga till nya features
// För att lägga till ljud-effekter måste vi ändra i Player.js
// För att lägga till partiklar måste vi ändra i RunnerGame.js
```

> 🛟 Tight coupling betyder att objekt är starkt beroende av varandra, vilket gör koden svår att underhålla och utöka. Vad är då ett starkt beroende? Det är när ett object förväntas känna till och direkt anropa metoder på ett annat objekt. Detta skapar en kedja av beroenden som gör det svårt att ändra en del av koden utan att påverka andra delar.

### Lösning med events:

```javascript
// Loose coupling - Obstacle känner inte till vem som lyssnar
this.events.emit('obstacleHit', { obstacle, player, score, time })

// Lätt att lägga till nya features
this.events.on('obstacleHit', () => // spela ljud för krock
this.events.on('obstacleHit', () => // skapa en partikel-effekt
this.events.on('obstacleHit', () => this.gameOver())
```

> 🎮 Testa att lägga till juice för när spelaren krockar med objekt. Du behöver skapa metoder i den relevanta klassen som lyssnar på `obstacleHit` eventet och triggar ljud och partiklar.

## EventEmitter Implementation

[`src/EventEmitter.js`](src/EventEmitter.js) - Komplett Observer Pattern:

```javascript
export default class EventEmitter {
    constructor() {
        this.events = new Map()  // eventName -> array of listeners
    }
    
    // Subscribe to events
    on(eventName, callback, context = null)
    once(eventName, callback, context = null)  // Auto-unsubscribe after first call
    
    // Unsubscribe
    off(eventName, callback)
    clear(eventName = null)  // Clear specific event or all
    
    // Emit events
    emit(eventName, data = null)
    
    // Query
    hasListeners(eventName)
    listenerCount(eventName)
    eventNames()
}
```

> 🧠 Observer patternas används i många andra sammanhang, inte bara spel. Till exempel i användargränssnitt, nätverkskommunikation och realtidsdatahantering.

### Viktiga features:

**1. Error handling:**
```javascript
emit(eventName, data = null) {
    for (const { callback, context } of listeners) {
        try {
            callback.call(context, data)
        } catch (error) {
            console.error(`Error in listener for '${eventName}':`, error)
        }
    }
}
```
Om en listener krashar påverkar det inte andra listeners.

**2. Safe iteration:**
```javascript
// Skapar kopia av listeners för att undvika problem
// om en listener tar bort sig själv under execution
const listenersCopy = [...listeners]
```

**3. Context binding:**
```javascript
// Kan specifica 'this' context för callbacks
this.events.on('jump', this.handleJump, this)
```

## Integration i GameBase

EventEmitter är centralt placerat i GameBase:

```javascript
export default class GameBase {
    constructor(width, height) {
        // ...
        
        // Event system - centralt för loose coupling
        this.events = new EventEmitter()
        
        // ...
    }
}
```

Nu har alla spel som extends GameBase tillgång till event systemet via `this.events`.

## Events i RunnerGame

Hur ska vi använda event systemet i RunnerGame?

### Setup Event Listeners

I RunnerGame constructor setup:

```javascript
setupEventListeners() {
    // Collision event
    this.events.on('obstacleHit', (data) => {
        console.log('Obstacle hit!', data)
        this.gameOver()
    })
    
    // Score milestones
    this.events.on('scoreMilestone', (data) => {
        console.log(`Score milestone reached: ${data.score}`)
    })
    
    // Debug events
    this.events.on('obstacleSpawned', (data) => {
        if (this.debug) {
            console.log('Obstacle spawned:', data.type)
        }
    })
    
    this.events.on('playerJump', () => {
        if (this.debug) console.log('Player jumped!')
    })
    
    this.events.on('playerLanded', () => {
        if (this.debug) console.log('Player landed!')
    })
}
```

### Emit Events

**Collision event:**

Så med dessa ändringar så fungerar en kollision väldigt annorlunda. Vi emitterar ett event istället för att direkt anropa `gameOver()`.
Sen lyssnar vi på detta event i `setupEventListeners()` och kallar `gameOver()` därifrån.

```javascript
// update() method
for (const obstacle of this.obstacles) {
    if (this.player.intersects(obstacle)) {
        // Emit event instead of direct call
        this.events.emit('obstacleHit', { 
            obstacle: obstacle,
            player: this.player,
            score: this.score,
            time: this.playTime
        })
        break
    }
}
```

**Score milestones:**
```javascript
// Track when score crosses 100-point boundaries
const oldScore = this.score
this.distance += this.distanceMultiplier * deltaTime
this.score = Math.floor(this.distance)

if (Math.floor(oldScore / 100) < Math.floor(this.score / 100)) {
    this.events.emit('scoreMilestone', { score: this.score })
}
```

---

## Events i Player

**Jump event:**
```javascript
update(deltaTime) {
    if ((keys.has(' ') || keys.has('ArrowUp')) && this.isGrounded) {
        this.velocity.y = this.jumpPower
        this.isGrounded = false
        
        // Emit jump event
        this.game.events.emit('playerJump', {
            position: this.position.clone(),
            velocity: this.velocity.clone()
        })
    }
}
```

**Landed event:**
```javascript
handlePlatformCollision(platform) {
    if (collision.direction === 'top' && this.velocity.y > 0) {
        const wasGrounded = this.isGrounded
        this.position.y = platform.position.y - this.height
        this.velocity.y = 0
        this.isGrounded = true
        
        // Emit landed event (only if wasn't grounded before)
        if (!wasGrounded) {
            this.game.events.emit('playerLanded', {
                position: this.position.clone()
            })
        }
    }
}
```

**Viktigt:** Använd `clone()` för Vector2 när du skickar events för att undvika referens-problem. Det kan uppstå om mottagaren ändrar värdet, det vill säga att den muterar objektet.

## Events i ObstacleSpawner

```javascript
spawn() {
    // ... create obstacle ...
    
    this.game.obstacles.push(obstacle)
    
    // ✅ Emit spawned event
    this.game.events.emit('obstacleSpawned', {
        type: type,
        position: { x, y },
        size: { width, height }
    })
}
```


## Event-driven Architecture

### Före (Tight Coupling):

```
Player ──────> RunnerGame.gameOver()
    └──────> AudioManager.play()
    └──────> ParticleSystem.emit()
```
Player måste känna till alla system.

### Efter (Loose Coupling):

```
Player ──> emit('obstacleHit')
                    │
                    ├──> RunnerGame.gameOver()
                    ├──> AudioManager.play()
                    └──> ParticleSystem.emit()
```
Player känner bara till event systemet. Nya features kan läggas till utan att ändra Player.


## Event Naming Conventions

Hur ska vi namnge våra events för att vara konsekventa och tydliga? Det här handlar mycket om praxis och här är några rekommendationer:

```javascript
// Noun + past tense verb (händelse har inträffat)
'obstacleHit'
'playerLanded'
'enemyDestroyed'
'coinCollected'

// Progressive (händer nu)
'playerJumping'
'gameStarting'

// State changes
'gameStateChanged'
'healthChanged'

// Milestones
'scoreMilestone'
'levelComplete'
```

**Undvik:**
```javascript
// För generiskt
'update'
'change'

// Verbs i imperativ (låter som kommandon)
'jump'
'destroy'
```

---

## Best Practices

### 1. Clone objects när du emitar

Det här gör vi för att undvika att mottagaren muterar objektet (ändrar värdet) och påverkar andra lyssnare:

```javascript
// BAD - skickar referens
this.events.emit('jump', { position: this.position })

// GOOD - skickar kopia
this.events.emit('jump', { position: this.position.clone() })
```

### 2. Använd once() för one-time events

Det är användbart för events som bara ska hanteras en gång:

```javascript
// Lyssna bara på första collision
this.events.once('obstacleHit', () => {
    console.log('First hit!')
})
```

### 3. Cleanup event listeners

När vi inte längre behöver lyssna på ett event, t.ex. när ett objekt tas bort:

```javascript
// I en klass som kan tas bort
destroy() {
    this.game.events.off('obstacleHit', this.handleHit)
}
```

### 4. Error handling i listeners

EventEmitter hanterar fel automatiskt:
```javascript
this.events.on('test', () => {
    throw new Error('Oops!')  // Krashar inte hela spelet
})
```

### 5. Debug events

Använd debug mode för att logga events:
```javascript
if (this.debug) {
    console.log('Event emitted:', eventName, data)
}
```

---

## Framtida Extensions

Med event system på plats kan vi enkelt lägga till:

**Audio System:**
```javascript
class AudioManager {
    constructor(game) {
        this.game = game
        game.events.on('playerJump', () => this.play('jump'))
        game.events.on('obstacleHit', () => this.play('hit'))
        game.events.on('scoreMilestone', () => this.play('milestone'))
    }
}
```

**Particle System:**
```javascript
class ParticleSystem {
    constructor(game) {
        this.game = game
        game.events.on('obstacleHit', (data) => {
            this.emit('explosion', data.player.position)
        })
        game.events.on('playerLanded', (data) => {
            this.emit('dust', data.position)
        })
    }
}
```

**Achievements System:**
```javascript
class Achievements {
    constructor(game) {
        this.game = game
        game.events.on('scoreMilestone', (data) => {
            if (data.score >= 1000) {
                this.unlock('thousand_points')
            }
        })
    }
}
```

---

## Performance Considerations

**EventEmitter är optimerat för game loops:**

1. **Map** istället för Object - snabbare lookups
2. **Array copy** vid emit - undviker iteration-problem
3. **Try-catch** - isolerar fel
4. **Cleanup** - tar bort tomma event arrays
