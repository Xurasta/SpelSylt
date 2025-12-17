# Twinstick Shooter & återanvändbara koncept

I detta steg skapar vi ett twinstick shooter-spel som demonstration av top-down gameplay. Men vi lägger fokus på återanvändbara koncept och mönster som kan användas i många olika speltyper.

## Översikt

Det främsta målet med detta steg är att visa på hur mekanik i spel kan brytas ner till återanvändbara byggstenar som fungerar oavsett spelgenre. 

1. **Timer Management System** - Generaliserad cooldown/duration hantering
2. **Line of Sight (Raycasting)** - Ett sätt att kolla om två objekt kan "se" varandra
3. **State-Based AI** - Enkelt men kraftfullt AI-system
4. **Player State System** - Flag-baserad hantering av olika lägen (dash, reload, etc)
5. **Wall Avoidance** - Geometrisk pathfinding runt hinder
6. **Wave Spawner System** - Generaliserad våg-baserad spawning

**Spel-specifikt för twinstick:**
- Top-down kamera som följer spelaren, du ser hur vi återanvänder Camera-klassen
- Mus-baserad aim och shooting, nytt för hur vi hanterear mouse input
- WASD movement + dash mekanik
- Ammo system med reload, ett alternativ till overheat som vi använder i spaceshootern

## Återanvändbara Koncept

### 1. Timer Management System

Ett generaliserat system för att hantera alla typer av timers: cooldowns, durations, delays.

**Problem det löser:**
- Duplicerad timer-kod överallt
- Inkonsistent timer-hantering mellan klasser
- Svårt att debugga timer-beteenden

**Lösning i GameObject.js:**

```javascript
/**
 * Hjälpmetod för att hantera timers (cooldowns, durations, etc)
 * @param {string} timerName - Namnet på timer-variabeln
 * @param {number} deltaTime - Tid sedan senaste frame
 * @returns {boolean} - true om timer är klar (timer <= 0)
 */
updateTimer(timerName, deltaTime) {
    if (this[timerName] > 0) {
        this[timerName] -= deltaTime
        if (this[timerName] < 0) this[timerName] = 0
        return false  // Timer fortfarande aktiv
    }
    return true  // Timer klar
}

/**
 * Starta en timer/cooldown
 */
startTimer(timerName, duration) {
    this[timerName] = duration
}

// Alias för tydlighet
updateCooldown(timerName, deltaTime) { return this.updateTimer(timerName, deltaTime) }
startCooldown(timerName, duration) { this.startTimer(timerName, duration) }
```

**Användning i TwinstickPlayer:**

```javascript
class TwinstickPlayer extends GameObject {
    constructor() {
        // Definiera timers
        this.shootCooldown = 0
        this.dashTimer = 0
        this.dashCooldown = 0
        this.reloadTimer = 0
        this.invulnerableTimer = 0
    }
    
    update(deltaTime) {
        // Uppdatera ALLA timers med samma metod
        this.updateTimer('shootCooldown', deltaTime)
        this.updateTimer('dashCooldown', deltaTime)
        this.updateTimer('invulnerableTimer', deltaTime)
        
        // Speciell hantering för reload (behöver callback när klar)
        if (this.isReloading) {
            if (this.updateTimer('reloadTimer', deltaTime)) {
                this.finishReload()  // Timer klar - slutför reload
            }
        }
        
        // Dash duration
        if (this.isDashing) {
            if (this.updateTimer('dashTimer', deltaTime)) {
                this.isDashing = false  // Dash klar
            }
        }
        
        // Starta nya timers när action aktiveras
        if (canDash) {
            this.startTimer('dashTimer', this.dashDuration)
            this.startTimer('dashCooldown', this.dashCooldownDuration)
        }
    }
}
```

Fördelarna med det här systemet är att vi kan samla all timer-logik på ett ställe och använda samma metoder överallt i koden. Vi skapar helt enkelt timers genom att ge dem ett namn och en duration, och sedan uppdaterar vi dem varje frame med `updateTimer`. När timern når noll vet vi att den är klar.

Nu är timern kopplad till objektet självt, men det kan också vara så att vi vill skapa timern i spelet för att hantera globala cooldowns eller liknande. Då kan vi skapa en TimerManager-klass som håller koll på alla timers i spelet.

**Kan användas för:**
- Shoot cooldowns
- Ability cooldowns (dash, special moves)
- Temporary effects (invulnerability, powerups)
- Animation timers
- Delay before action (countdown, charge time)
- Status effect durations (stun, slow, burn)

### 2. Line of Sight (Raycasting)

Geometrisk beräkning för att kolla om två objekt kan "se" varandra utan hinder emellan. Det här används i de flesta spel och spelmotorer för att räkna ut syn, AI-beteende, projektiler, osv.

Det fungerar så att vi "kastar" en linje (ray) mellan två objekt och kollar om den korsar några hinder (rektanglar). På det sättet kan vi avgöra om ett objekt har fri sikt till ett annat.

**Lösning i GameObject.js:**

```javascript
/**
 * Static helper: Kollar om en linje korsar en rektangel
 */
static lineIntersectsRect(x1, y1, x2, y2, rect) {
    // Kolla om någon ändpunkt är inuti rektangeln
    if (x1 >= rect.x && x1 <= rect.x + rect.width && 
        y1 >= rect.y && y1 <= rect.y + rect.height) return true
    if (x2 >= rect.x && x2 <= rect.x + rect.width && 
        y2 >= rect.y && y2 <= rect.y + rect.height) return true
    
    // Kolla om linjen korsar någon av rektangelns sidor
    if (this.lineIntersectsLine(x1, y1, x2, y2, 
        rect.x, rect.y, rect.x + rect.width, rect.y)) return true
    // ... alla 4 sidor
    
    return false
}

/**
 * Static helper: Kollar om två linjesegment korsar varandra
 */
static lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1))
    if (denom === 0) return false // Parallella linjer
    
    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denom
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denom
    
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
}

/**
 * Instance method: Kollar om detta objekt har line of sight till ett target
 */
hasLineOfSight(target, obstacles = []) {
    // Beräkna centrum för båda objekten
    const x1 = this.x + this.width / 2
    const y1 = this.y + this.height / 2
    const x2 = target.x + target.width / 2
    const y2 = target.y + target.height / 2
    
    // Kolla om linjen mellan objekten korsar något hinder
    for (const obstacle of obstacles) {
        if (GameObject.lineIntersectsRect(x1, y1, x2, y2, obstacle)) {
            return false // Hindret blockerar sikten
        }
    }
    
    return true // Fri sikt!
}
```

Men här hände något nytt, nämligen nyckelordet `static`. Det betyder att metoden är kopplad till klassen själv, inte till en instans av klassen. Vi använder det här för hjälpfunktioner som inte behöver någon instansdata, utan bara utför en generell beräkning.
Med det menas att vi kan använda en static metod utan att köra `new GameObject()`. Vi kan helt enkelt kalla på den direkt via klassen:

```javascript
GameObject.lineIntersectsRect(x1, y1, x2, y2, rect)
```

Varför göra på det här sättet? Jo, för att dessa metoder är generella och inte behöver någon instansdata. De är verktyg som kan användas av alla objekt utan att skapa onödiga instanser.

**Användning i TwinstickEnemy AI:**

I spelet så använder vi det här för att låta fiender reagera på om de kan se spelaren eller inte. När fiender inte ser spelaren så vill vi att de ska gå mot spelarens senaste kända position, inte att de ska stå och skjuta i tomma luften.

```javascript
update(deltaTime) {
    const player = this.game.player
    const walls = this.game.arena.getData().walls
    
    // Kolla line of sight till spelaren
    const hasLOS = this.hasLineOfSight(player, walls)
    
    if (hasLOS) {
        // Kan se spelaren - jaga eller skjut
        this.state = 'chase'
        this.lastSeenPosition = { x: player.x, y: player.y }
    } else {
        // Kan inte se spelaren - gå till senaste kända position
        this.state = 'seek'
        // Navigera mot lastSeenPosition
    }
}
```

**Visualisering (för debugging):**

För att göra det här tydligt så kan du trycka "p" i spelet för att visa fiendens line of sight. Grön linje betyder fri sikt, röd linje betyder blockerad sikt.

```javascript
// I draw() metoden - visa line of sight
if (this.game.debug) {
    const x1 = this.x + this.width / 2
    const y1 = this.y + this.height / 2
    const x2 = player.x + player.width / 2
    const y2 = player.y + player.height / 2
    
    ctx.strokeStyle = this.hasLineOfSight(player, walls) ? 'lime' : 'red'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x1 - camera.x, y1 - camera.y)
    ctx.lineTo(x2 - camera.x, y2 - camera.y)
    ctx.stroke()
}
```

**Kan användas för:**
- AI som reagerar på vad de ser
- Tower defense (torn skjuter vad de ser)
- Stealth mechanics (spelaren döljer sig bakom hinder)
- Projektiler som blockeras av väggar
- Spell targeting med line of sight
- Fog of war (RTS spel)

### 3. State-Based AI System

Enkelt men kraftfullt AI-system där fiender har olika beteenden baserat på state. Det betyder att vi kan låta fiender byta mellan olika states för att ändra deras beteende dynamiskt. I det här fallet har vi tre states: IDLE, CHASE och SEEK.

**Lösning i TwinstickEnemy.js:**

```javascript
export default class TwinstickEnemy extends GameObject {
    constructor(game, x, y, width, height, config = {}) {
        super(game, x, y, width, height)

        // State properties
        this.state = 'idle' // idle, chase, seek, shoot
        this.lastSeenPosition = { x: x, y: y }
        this.shootCooldown = 0
    }
    
    update(deltaTime) {
        const player = this.game.player
        
        // Beräkna avstånd till spelaren
        const dx = player.x - this.x
        const dy = player.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Uppdatera cooldowns (från GameObject)
        this.updateCooldown('shootCooldown', deltaTime)
        
        // Kolla Line of Sight (använder GameObject.hasLineOfSight)
        const arenaData = this.game.arena.getData()
        const hasLOS = this.hasLineOfSight(player, arenaData.walls)
        
        // Om vi har line of sight, uppdatera last seen position
        if (hasLOS) {
            this.lastSeenPosition.x = player.x
            this.lastSeenPosition.y = player.y
        }
        
        // AI beteende baserat på avstånd och LOS
        if (hasLOS && distance < this.shootRange) {
            // Inom skjutavstånd OCH har line of sight - stanna och skjut
            this.state = 'shoot'
            this.velocityX = 0
            this.velocityY = 0
            
            // Skjut om cooldown är klar
            if (this.shootCooldown <= 0) {
                this.shoot()
                this.startCooldown('shootCooldown', this.shootCooldownDuration)
            }
        } else if (hasLOS) {
            // Har line of sight men för långt bort - jaga spelaren direkt
            this.state = 'chase'
            
            // Normalisera riktningen
            const directionX = dx / distance
            const directionY = dy / distance
            
            // Rör sig mot spelaren
            this.velocityX = directionX * this.moveSpeed
            this.velocityY = directionY * this.moveSpeed
        } else {
            // Ingen line of sight - gå mot senaste kända position
            this.state = 'seek'
            
            const seekDx = this.lastSeenPosition.x - this.x
            const seekDy = this.lastSeenPosition.y - this.y
            const seekDistance = Math.sqrt(seekDx * seekDx + seekDy * seekDy)
            
            // Om vi är nära senaste kända position, stanna och leta
            if (seekDistance < 50) {
                this.velocityX = 0
                this.velocityY = 0
            } else {
                // Rör sig mot senaste kända position
                const seekDirX = seekDx / seekDistance
                const seekDirY = seekDy / seekDistance
                this.velocityX = seekDirX * this.moveSpeed
                this.velocityY = seekDirY * this.moveSpeed
            }
        }
        
        // Uppdatera position
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
    }
}
```

**State Diagram:**

```
    [IDLE]
       ↓
   har LOS?
       ↓ ja
       ├─→ avstånd < shootRange? → [SHOOT] (stanna och skjut)
       │                              ↓
       └─→ avstånd >= shootRange → [CHASE] (jaga direkt)
                                      ↓
                                  förlorar LOS
                                      ↓
                                   [SEEK] → når lastSeenPosition → [IDLE] (stanna)
```

**Visualisering (debug i TwinstickEnemy.draw()):**

I debug-läget (tryck "p") så ritar vi ut fiendens state, line of sight och skjutavstånd. Koden för detta kan du se i [TwinstickEnemy.js](./src/twinstick/TwinstickEnemy.js).

**Kan användas för:**
- Enemy AI (patrol → alert → attack → retreat)
- Boss phases (phase1 → phase2 → enrage)
- NPC behavior (idle → talk → follow → trade)
- Animal AI (wander → flee → hunt)
- Puzzle elements (inactive → active → triggered)

### 4. Player State System (Flag-Based)

Hantera olika player states med boolean flags och derived properties, det vill säga egenskaper som beräknas baserat på andra states.

**Problem det löser:**
- Player kan vara i flera states samtidigt, till exempel dash OCH reload
- Svårt att kolla kombinationer av states
- Risk för inkonsistent state

**Lösning i TwinstickPlayer:**

```javascript
class TwinstickPlayer extends GameObject {
    constructor() {
        // ===== Flag-based state system =====
        // isDashing, isReloading = mutually exclusive actions
        // invulnerable = derived status (via getter)
        
        this.isDashing = false
        this.dashTimer = 0
        
        this.isReloading = false
        this.reloadTimer = 0
        
        this.invulnerableTimer = 0
    }
    
    /**
     * Derived property: Spelaren är invulnerable under vissa conditions
     */
    get isInvulnerable() {
        return this.isDashing || this.invulnerableTimer > 0
    }
    
    update(deltaTime) {
        // Dash state
        if (this.isDashing) {
            if (this.updateTimer('dashTimer', deltaTime)) {
                this.isDashing = false
            }
            // Dash movement
            this.x += this.dashDirectionX * this.dashSpeed * deltaTime
            this.y += this.dashDirectionY * this.dashSpeed * deltaTime
        } else {
            // Normal movement (endast när inte dashar)
            // ...
        }
        
        // Reload state
        if (this.isReloading) {
            if (this.updateTimer('reloadTimer', deltaTime)) {
                this.finishReload()
            }
            // Kan inte skjuta under reload
            return
        }
        
        // Shooting (endast om INTE dashar ELLER reloadar)
        if (!this.isDashing && !this.isReloading && canShoot) {
            this.shoot()
        }
    }
    
    takeDamage(amount) {
        // Använd derived property
        if (this.isInvulnerable) return
        
        this.health -= amount
        this.startTimer('invulnerableTimer', 1000)
    }
    
    startDash() {
        this.isDashing = true
        this.startTimer('dashTimer', this.dashDuration)
        this.startTimer('dashCooldown', this.dashCooldownDuration)
        // Dash gör dig invulnerable (via isInvulnerable getter)
    }
}
```

**State Priority System:**

```javascript
// Mutually exclusive actions (bara en åt gången):
if (isDashing) {
    // Dash movement, ingen normal input
}
else if (isReloading) {
    // Kan inte skjuta, kan röra sig
}
else {
    // Normal state - allt är tillåtet
}

// Derived status (kan kombineras):
get isInvulnerable() {
    return isDashing || invulnerableTimer > 0
}

get canShoot() {
    return !isDashing && !isReloading && shootCooldown <= 0 && currentAmmo > 0
}
```

**Kan användas för:**
- Player abilities (dash, dodge, block, parry)
- Status effects (stunned, slowed, invisible)
- Temporary powerups (invincible, double damage)
- Animation states (attack, hurt, death)

### 5. Wall Avoidance (Pathfinding)

Enkel geometrisk pathfinding för att navigera runt hinder.

**Problem det löser:**
- AI fastnar mot väggar
- Fiender "glider" längs väggar konstigt
- Behov av basic pathfinding utan A*

**Lösning i TwinstickEnemy.js:**

```javascript
/**
 * Hanterar wall avoidance när fienden kolliderar i SEEK-läge
 * Försöker hitta en alternativ väg runt hindret
 */
handleWallAvoidance(deltaTime) {
    const arenaData = this.game.arena.getData()
    
    // Försök röra sig perpendiculärt till blockerat håll
    // Testa flera riktningar för att hitta en väg runt
    const testAngles = [
        Math.PI / 4,   // 45 grader höger
        -Math.PI / 4,  // 45 grader vänster
        Math.PI / 2,   // 90 grader höger
        -Math.PI / 2   // 90 grader vänster
    ]
    
    // Beräkna riktning mot målet (lastSeenPosition)
    const dx = this.lastSeenPosition.x - this.x
    const dy = this.lastSeenPosition.y - this.y
    const baseAngle = Math.atan2(dy, dx)
    
    // Testa varje alternativ riktning
    for (const offset of testAngles) {
        const testAngle = baseAngle + offset
        const testX = this.x + Math.cos(testAngle) * this.moveSpeed * deltaTime * 50
        const testY = this.y + Math.sin(testAngle) * this.moveSpeed * deltaTime * 50
        
        // Skapa en test-position
        const testPos = {
            x: testX,
            y: testY,
            width: this.width,
            height: this.height
        }
        
        // Kolla om denna riktning är fri (rektangel-kollision inline)
        let isFree = true
        for (const wall of arenaData.walls) {
            if (testPos.x < wall.x + wall.width &&
                testPos.x + testPos.width > wall.x &&
                testPos.y < wall.y + wall.height &&
                testPos.y + testPos.height > wall.y) {
                isFree = false
                break
            }
        }
        
        // Om riktningen är fri, använd den
        if (isFree) {
            this.velocityX = Math.cos(testAngle) * this.moveSpeed
            this.velocityY = Math.sin(testAngle) * this.moveSpeed
            break
        }
    }
}
```

**Användning i update():**

```javascript
update(deltaTime) {
    // AI beteende (chase/seek/shoot)...
    
    // Hantera väggar (undvik att fastna) - anropas alltid
    this.handleWallAvoidance(deltaTime, arenaData.walls)
    
    // Uppdatera position
    this.x += this.velocityX * deltaTime
    this.y += this.velocityY * deltaTime
}
```

**Kan användas för:**
- AI navigation runt hinder
- Vehicle steering (racing games)
- Projectile deflection
- Player slide/glide along walls

---

### 6. Wave Spawner System

Generaliserat system för att spawna vågor av fiender med progression. Nu hamnade det här systemet här, men det hade lika gärna kunnat spawna vågor i spaceshootern eller plattformsspelet.

**Problem det löser:**
- Hårdkodade spawn-positioner
- Svårt att balansera vågor
- Svårt att ändra spawning-logik

**Lösning i EnemySpawner.js:**

```javascript
export default class EnemySpawner {
    constructor(game, config = {}) {
        this.game = game
        
        // Spawn points (definieras av leveln)
        this.spawnPoints = config.spawnPoints || []
        
        // Wave konfiguration
        this.waves = config.waves || []
        this.currentWave = 0
        this.waveInProgress = false
        this.enemiesInWave = 0
        this.enemiesKilled = 0
        
        // Spawn timing
        this.spawnTimer = 0
        this.spawnDelay = 2000 // 2 sekunder mellan spawns
        this.waveDelay = 5000  // 5 sekunder mellan waves
        this.waveDelayTimer = 0
        
        // Countdown display
        this.countdownActive = false
        this.countdownTimer = 0
        this.countdownDuration = 3000 // 3 sekunder countdown
        this.countdownWaveNumber = 0
        
        // Wave state
        this.currentWaveEnemies = []
    }
    
    startNextWave() {
        if (this.currentWave >= this.waves.length) {
            console.log('Alla waves klara!')
            return
        }
        
        // Starta countdown
        this.countdownActive = true
        this.countdownTimer = this.countdownDuration
        this.countdownWaveNumber = this.currentWave + 1
    }
    
    beginWave() {
        const wave = this.waves[this.currentWave]
        console.log(`Wave ${this.currentWave + 1} börjar! ${wave.enemies.length} fiender`)
        
        this.waveInProgress = true
        this.currentWaveEnemies = [...wave.enemies] // Kopiera enemy-listan
        this.enemiesInWave = wave.enemies.length
        this.enemiesKilled = 0
        this.spawnTimer = 0
        this.countdownActive = false
    }
    
    spawnEnemy(enemyType) {
        if (this.spawnPoints.length === 0) return null
        
        // Välj en slumpmässig spawn point
        const spawnPoint = this.spawnPoints[
            Math.floor(Math.random() * this.spawnPoints.length)
        ]
        
        // Skapa rätt typ av fiende
        let enemy = null
        switch(enemyType) {
            case 'small':
                enemy = new SmallEnemy(this.game, spawnPoint.x, spawnPoint.y)
                break
            case 'medium':
                enemy = new MediumEnemy(this.game, spawnPoint.x, spawnPoint.y)
                break
            case 'large':
                enemy = new LargeEnemy(this.game, spawnPoint.x, spawnPoint.y)
                break
            case 'boss':
                enemy = new BossEnemy(this.game, spawnPoint.x, spawnPoint.y)
                break
        }
        
        return enemy
    }
    
    onEnemyKilled() {
        this.enemiesKilled++
        
        // Kolla om alla fiender i vågen är döda
        if (this.enemiesKilled >= this.enemiesInWave) {
            this.onWaveComplete()
        }
    }
    
    onWaveComplete() {
        console.log(`Wave ${this.currentWave + 1} klar!`)
        this.waveInProgress = false
        this.currentWave++
        
        // Spawna reward (10 ammo pickups)
        this.spawnWaveReward(10)
        
        // Starta delay före nästa wave
        this.waveDelayTimer = this.waveDelay
    }
    
    update(deltaTime) {
        // Hantera countdown
        if (this.countdownActive) {
            this.countdownTimer -= deltaTime
            if (this.countdownTimer <= 0) {
                this.beginWave()
            }
            return
        }
        
        // Om vi väntar mellan waves
        if (!this.waveInProgress && this.waveDelayTimer > 0) {
            this.waveDelayTimer -= deltaTime
            
            if (this.waveDelayTimer <= 0) {
                this.startNextWave()
            }
            return
        }
        
        // Spawna fiender från nuvarande wave
        if (this.waveInProgress && this.currentWaveEnemies.length > 0) {
            this.spawnTimer -= deltaTime
            
            if (this.spawnTimer <= 0) {
                // Spawna nästa fiende i listan
                const enemyType = this.currentWaveEnemies.shift()
                const enemy = this.spawnEnemy(enemyType)
                
                if (enemy) {
                    this.game.enemies.push(enemy)
                }
                
                // Återställ timer om det finns fler fiender kvar
                if (this.currentWaveEnemies.length > 0) {
                    this.spawnTimer = this.spawnDelay
                }
            }
        }
    }
    
    draw(ctx, camera) {
        // Rita countdown i mitten av skärmen
        if (this.countdownActive) {
            const countdown = Math.ceil(this.countdownTimer / 1000)
            
            ctx.save()
            ctx.fillStyle = 'white'
            ctx.font = 'bold 72px Arial'
            ctx.textAlign = 'center'
            
            // Visa nummer eller "Wave X starts"
            if (countdown > 0) {
                ctx.fillText(countdown, this.game.width / 2, this.game.height / 2)
            } else {
                ctx.font = 'bold 48px Arial'
                ctx.fillText(
                    `Wave ${this.countdownWaveNumber} starts!`, 
                    this.game.width / 2, 
                    this.game.height / 2
                )
            }
            
            ctx.restore()
        }
    }
}
```

**Wave Configuration Pattern:**

```javascript
// Enkel våg-definition som kan redigeras av designers
const waves = [
    // Våg 1: Tutorial
    {
        enemyCount: 3,
        enemyTypes: ['basic'],
        spawnInterval: 3000,
        description: 'Introduction - few slow enemies'
    },
    
    // Våg 2: Introduktion av ny fiendetyp
    {
        enemyCount: 5,
        enemyTypes: ['basic', 'fast'],
        spawnInterval: 2000,
        description: 'Introduce fast enemies'
    },
    
    // Våg 3: Blandad
    {
        enemyCount: 8,
        enemyTypes: ['basic', 'fast', 'tank'],
        spawnInterval: 1500,
        description: 'Mix all enemy types'
    },
    
    // Våg 4: Boss
    {
        enemyCount: 1,
        enemyTypes: ['boss'],
        spawnInterval: 0,
        description: 'Boss fight!'
    }
]
```

**Kan användas för:**
- Tower defense vågor
- Horde mode (överlevnad)
- Boss encounters med adds
- Rhythm-based spawning
- Procedurally generated difficulty curves

## Game Loop: TwinstickGame

Twinstick-spelet använder GameBase foundation med top-down kamera, vi låter kameran följa spelaren och kartan är lite större än skärmen. Vi har tagit bort alla fysik och plattformsrelaterade delar för att fokusera på twinstick-mekanik.

```javascript
class TwinstickGame extends GameBase {
    init() {
        // Skapa spelaren centrerat
        this.player = new TwinstickPlayer(...)
        
        // Ladda arena (väggar, spawn points)
        this.arena = new TwinstickArena()
        
        // Starta spawner
        this.spawner = new EnemySpawner(this)
        
        // Sätt kamera att följa spelaren
        this.camera.follow(this.player, 'center')
    }
    
    update(deltaTime) {
        // Uppdatera alla entiteter
        this.player.update(deltaTime)
        this.enemies.forEach(e => e.update(deltaTime))
        this.projectiles.forEach(p => p.update(deltaTime))
        
        // Spawner skapar nya fiender
        this.spawner.update(deltaTime)
        
        // Kollisionsdetektering
        this.handleCollisions()
        
        // Kamera följer spelaren
        this.camera.update(deltaTime)
    }
    
    handleCollisions() {
        // Projektil vs fiender
        for (const projectile of this.projectiles) {
            for (const enemy of this.enemies) {
                if (projectile.intersects(enemy)) {
                    enemy.takeDamage(projectile.damage)
                    projectile.markedForDeletion = true
                }
            }
        }
        
        // Spelare vs fiender
        for (const enemy of this.enemies) {
            if (this.player.intersects(enemy) && !this.player.isInvulnerable) {
                this.player.takeDamage(1)
                enemy.markedForDeletion = true
            }
        }
        
        // Rensa borttagna objekt
        this.enemies = this.enemies.filter(e => !e.markedForDeletion)
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion)
    }
}
```

## Sammanfattning: Återanvändbara Byggstenar

Nu hoppas jag att du ser hur många av de koncept och mönster vi har skapat genom hela denna tutorial-serie kan återanvändas i olika spelgenrer. Genom att bryta ner spelmekanik till generella byggstenar som timers, line of sight, state-based AI, player states, wall avoidance och wave spawners, kan du snabbt skapa nya spel med liknande grundläggande funktionalitet.

Ta dessa koncept och använd dem i dina egna spel! 🎮
