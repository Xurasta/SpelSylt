# Branch 23: Tower Defense - Basic Implementation

## Översikt

I detta steg implementerar vi ett **Tower Defense spel** som demonstrerar:
- Grid-baserat placement system
- Mouse input för att bygga torn
- Path following med Vector2
- Range-baserat targeting och shooting
- Wave spawning system
- Event-driven game logic

Tower Defense är ett perfekt case för att visa **grid systems**, **pathfinding**, och hur tidigare byggda verktyg (Vector2, Events, Mouse Input) kan återanvändas i ett helt annat spelkoncept.

## Varför Tower Defense?

### 🎮 Pedagogiska fördelar

**1. Grid System - Abstraktion av spelvärlden**
- Diskret spelplan (rutor istället för kontinuerlig space)
- Enkel collision detection ("är det ett torn i denna ruta?")
- Foundation för pathfinding (A* i branch 24)
- Tydlig separation mellan grid coordinates och world coordinates

**2. Path Following - Vector2 i praktiken**
```javascript
// Enemy följer waypoints med Vector2
const direction = target.subtract(this.position).normalize()
this.velocity = direction.multiply(this.speed)
this.position.addScaled(this.velocity, deltaTime)
```
Visar praktisk användning av:
- `subtract()` för direction
- `normalize()` för unit vectors
- `multiply()` för velocity
- `distanceTo()` för waypoint checks

**3. Mouse Input - Återanvändning**
Kopiera mouse tracking från 31-twinstick, fungerar direkt i tower defense!

**4. Gameplay Loop**
- Resource management (gold)
- Strategic placement
- Wave progression
- Risk/reward decisions

## Grid System

### Vad är ett Grid?

Ett grid är en 2D-array som representerar spelplanen uppdelad i **tiles** (rutor). Varje ruta har:
- **Type**: `'empty'`, `'path'`, `'tower'`, `'blocked'`
- **Position**: row/col i grid
- **Data**: referens till torn om det finns

### Grid.js Implementation

```javascript
class Grid {
    constructor(rows, cols, tileSize) {
        this.rows = rows          // 10 rader
        this.cols = cols          // 15 kolumner
        this.tileSize = tileSize  // 64 pixels per tile
        
        // Skapa 2D-array
        this.cells = []
        for (let row = 0; row < rows; row++) {
            this.cells[row] = []
            for (let col = 0; col < cols; col++) {
                this.cells[row][col] = {
                    type: 'empty',
                    tower: null,
                    row, col
                }
            }
        }
    }
}
```

### Koordinatsystem

**Tre olika koordinatsystem:**

| Screen Coordinates (Mouse) | Grid Coordinates      | World Coordinates      |
|----------------------------|----------------------|------------------------|
| (pixels från canvas)       | (row/col index)      | (pixels i game world)  |
| mouseX: 150                | col: 2               | x: 128                 |
| mouseY: 200                | row: 3               | y: 192                 |
| (var är musen?)            | (vilken ruta?)       | (var i världen?)       |

**Conversion Methods:**

```javascript
// Screen Grid (för mouse clicks)
getGridPosition(mouseX, mouseY) {
    const col = Math.floor(mouseX / this.tileSize)
    const row = Math.floor(mouseY / this.tileSize)
    return { row, col }
}

// Grid World (för att placera torn)
getWorldPosition(row, col) {
    return new Vector2(
        col * this.tileSize,     // X = kolumn * storlek
        row * this.tileSize      // Y = rad * storlek
    )
}

// Grid World Center (för enemies)
getCenterPosition(row, col) {
    return new Vector2(
        col * this.tileSize + this.tileSize / 2,
        row * this.tileSize + this.tileSize / 2
    )
}
```

**Varför detta är användbart:**
- Mouse click → Grid position → Kolla om ledig → Placera torn
- Grid path → World waypoints → Enemies följer
- Torn i grid → World position för rendering

### Path Definition

Path definieras som grid coordinates, sedan konverteras till world positions:

```javascript
// Definiera i grid coordinates (lätt att editera)
const pathCoords = [
    { row: 5, col: 0 },   // Start
    { row: 5, col: 3 },
    { row: 2, col: 3 },   // Upp
    { row: 2, col: 7 },   // Höger
    { row: 7, col: 7 },   // Ner
    { row: 7, col: 14 }   // Slut
]

// Markera i grid
this.grid.setPath(pathCoords)

// Konvertera till world positions för enemies
this.enemyPath = this.grid.pathToWorld(pathCoords)
// → [Vector2(32, 352), Vector2(224, 352), Vector2(224, 160), ...]
```

### Visualization

Grid ritas med semi-transparenta lines och colored tiles:

```javascript
draw(ctx, camera, showPath = true) {
    // Grid lines (vita, 30% opacity)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    for (let col = 0; col <= this.cols; col++) {
        // Vertikala linjer...
    }
    
    // Path cells (bruna, 80% opacity)
    if (showPath) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (cell.type === 'path') {
                    ctx.fillStyle = 'rgba(139, 69, 19, 0.8)'
                    ctx.fillRect(worldPos.x, worldPos.y, tileSize, tileSize)
                }
            }
        }
    }
}
```

**Hover Highlight:**
```javascript
drawHover(ctx, mouseX, mouseY, camera, canBuild) {
    const { row, col } = this.getGridPosition(mouseX, mouseY)
    const worldPos = this.getWorldPosition(row, col)
    
    // Grön om kan bygga, röd annars
    ctx.fillStyle = canBuild && this.canBuildAt(row, col)
        ? 'rgba(0, 255, 0, 0.3)'
        : 'rgba(255, 0, 0, 0.3)'
    
    ctx.fillRect(worldPos.x, worldPos.y, tileSize, tileSize)
}
```

## Mouse Input

### Återanvändning från 31-twinstick

När vi skapade InputHandler i 31-twinstick byggde vi in mouse tracking. Vi kan återanvända exakt samma kod här för att få musposition och knapptryckningar:

```javascript
// Från 31-twinstick (kopierat utan ändringar!)
this.mouseX = 0
this.mouseY = 0
this.mouseButtons = new Set()

window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    this.mouseX = event.clientX - rect.left
    this.mouseY = event.clientY - rect.top
})

canvas.addEventListener('mousedown', (event) => {
    this.mouseButtons.add(event.button)  // 0 = left click
})

window.addEventListener('mouseup', (event) => {
    this.mouseButtons.delete(event.button)
})
```

### Building Towers

```javascript
update(deltaTime) {
    // Kolla om vänster musknapp precis trycktes
    if (this.inputHandler.mouseButtons.has(0)) {
        this.handleMouseClick()
        // Rensa direkt så vi inte bygger varje frame
        this.inputHandler.mouseButtons.delete(0)
    }
}

handleMouseClick() {
    const mouseX = this.inputHandler.mouseX
    const mouseY = this.inputHandler.mouseY
    
    // Screen → Grid
    const { row, col } = this.grid.getGridPosition(mouseX, mouseY)
    
    // Validera
    if (!this.grid.canBuildAt(row, col)) return
    if (this.gold < this.towerCost) return
    
    // Grid → World
    const worldPos = this.grid.getWorldPosition(row, col)
    
    // Bygg torn
    const tower = new Tower(this, worldPos.x, worldPos.y)
    this.grid.placeTower(row, col, tower)
    this.towers.push(tower)
    this.gold -= this.towerCost
    
    // Emit event
    this.events.emit('towerBuilt', { tower, row, col })
}
```

**Flow:**
1. Mouse click → Screen coordinates
2. Screen → Grid coordinates
3. Grid → Check if buildable
4. Grid → World position
5. Create tower at world position
6. Register in grid + game

## Path Following

### Enemy Movement med Vector2

Enemies följer en path av waypoints (Vector2):

```javascript
class Enemy {
    constructor(game, path, config) {
        const start = path[0]
        super(game, start.x, start.y, 32, 32)
        
        this.path = path                  // Array<Vector2>
        this.currentWaypoint = 1          // Nästa waypoint att gå mot
        this.velocity = new Vector2(0, 0)
        this.speed = 0.08                 // pixels per ms
    }
    
    update(deltaTime) {
        // Hämta nästa waypoint
        const target = this.path[this.currentWaypoint]
        
        // Beräkna direction (Vector2!)
        const toTarget = target.subtract(this.position)
        const direction = toTarget.normalize()
        
        // Sätt velocity
        this.velocity = direction.multiply(this.speed)
        
        // Flytta
        this.position.addScaled(this.velocity, deltaTime)
        
        // Nått waypoint?
        if (this.position.distanceTo(target) < 5) {
            this.currentWaypoint++
            
            // Nått slutet?
            if (this.currentWaypoint >= this.path.length) {
                this.reachEnd()  // Skada player base
            }
        }
    }
}
```

**Varför Vector2 är perfekt här:**

| Operation | Vad det gör | Vector2 metod |
|-----------|-------------|---------------|
| Hitta direction | `target - current` | `subtract()` |
| Unit vector | Längd = 1 | `normalize()` |
| Skala till speed | Multiplicera | `multiply(speed)` |
| Flytta | `pos += vel * dt` | `addScaled(vel, dt)` |
| Avstånd till mål | Pythagoras | `distanceTo(target)` |

**Utan Vector2 (gammalt sätt):**
```javascript
// Mycket kod, lätt att göra fel
const dx = target.x - this.x
const dy = target.y - this.y
const length = Math.sqrt(dx * dx + dy * dy)
const dirX = dx / length
const dirY = dy / length
this.velocityX = dirX * this.speed
this.velocityY = dirY * this.speed
this.x += this.velocityX * deltaTime
this.y += this.velocityY * deltaTime
const distanceToTarget = Math.sqrt(
    (target.x - this.x) ** 2 + (target.y - this.y) ** 2
)
```

**Med Vector2 (5 rader!):**
```javascript
// Tydlig intention, svårt att göra fel
const direction = target.subtract(this.position).normalize()
this.velocity = direction.multiply(this.speed)
this.position.addScaled(this.velocity, deltaTime)
const distance = this.position.distanceTo(target)
```

## Tower & Shooting

### Range-Based Targeting

Tower hittar närmaste enemy inom range:

```javascript
class Tower {
    constructor(game, x, y) {
        super(game, x, y, 64, 64)
        this.range = 200       // Skjutavstånd
        this.fireRate = 1000   // 1 skott per sekund
        this.damage = 50
        this.cooldown = 0
    }
    
    update(deltaTime) {
        // Cooldown
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime
            return
        }
        
        // Hitta target
        const target = this.findClosestEnemy()
        
        if (target) {
            this.shoot(target)
            this.cooldown = this.fireRate
        }
    }
    
    findClosestEnemy() {
        let closest = null
        let closestDist = this.range
        
        const center = this.position.add(
            new Vector2(this.width / 2, this.height / 2)
        )
        
        for (const enemy of this.game.enemies) {
            if (enemy.health <= 0) continue
            
            const dist = center.distanceTo(enemy.position)
            if (dist < closestDist) {
                closest = enemy
                closestDist = dist
            }
        }
        
        return closest
    }
}
```

**Varför detta är smart:**
- Automatisk targeting - spelaren behöver inte mikro-managea
- Range-based - strategiskt placering av torn
- Cooldown - balanserat (inte instant death)
- Closest enemy - logisk prioritering

### Projectile Creation

```javascript
shoot(target) {
    // Skjut från tornets center
    const center = this.position.add(
        new Vector2(this.width / 2, this.height / 2)
    )
    
    // Direction till target (Vector2!)
    const targetCenter = target.position.add(
        new Vector2(target.width / 2, target.height / 2)
    )
    const direction = targetCenter.subtract(center).normalize()
    
    // Skapa projectile
    const projectile = this.game.createProjectile(
        center,
        direction,
        this.damage,
        this
    )
    
    this.game.projectiles.push(projectile)
}
```

### Projectile System

Projectiles använder Vector2 för movement:

```javascript
createProjectile(position, direction, damage, tower) {
    return {
        position: position.clone(),           // Start position
        velocity: direction.multiply(0.6),    // Speed 0.6 px/ms
        damage,
        tower,                                // Referens för stats
        width: 8, height: 8,
        distanceTraveled: 0,
        maxDistance: tower.range * 1.5,
        markedForDeletion: false
    }
}

// Update projectiles (reverse loop för att kunna splice)
for (let i = this.projectiles.length - 1; i >= 0; i--) {
    const projectile = this.projectiles[i]
    
    // Flytta med Vector2
    projectile.position.addScaled(projectile.velocity, deltaTime)
    projectile.distanceTraveled += projectile.velocity.length() * deltaTime
    
    // Max distance?
    if (projectile.distanceTraveled > projectile.maxDistance) {
        projectile.markedForDeletion = true
    }
    
    // Collision med enemies
    for (const enemy of this.enemies) {
        if (this.checkCollision(projectile, enemy)) {
            enemy.takeDamage(projectile.damage)
            projectile.markedForDeletion = true
            break
        }
    }
    
    // Ta bort om markerad
    if (projectile.markedForDeletion) {
        this.projectiles.splice(i, 1)
    }
}
```

**Jämfört med 08-projectiles:**
- Använder Vector2 istället för x/y
- Direction som normalized vektor
- Max distance istället för "off screen" check
- Event när träffar (för ljud/partiklar senare)

## Wave System

### Wave Spawning

```javascript
startWave() {
    this.wave++
    this.waveInProgress = true
    this.enemiesSpawned = 0
    
    // Antal enemies: 5 + 3 per wave
    this.enemiesToSpawn = 5 + (this.wave - 1) * 3
    
    console.log(`Wave ${this.wave}: ${this.enemiesToSpawn} enemies`)
    
    this.events.emit('waveStart', {
        wave: this.wave,
        enemies: this.enemiesToSpawn
    })
}

update(deltaTime) {
    // Spawn enemies gradvis
    if (this.waveInProgress && this.enemiesSpawned < this.enemiesToSpawn) {
        this.spawnTimer += deltaTime
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy()
            this.spawnTimer = 0
        }
    }
    
    // Kolla om wave klar
    this.checkWaveComplete()
}

checkWaveComplete() {
    // Alla spawnade OCH alla döda?
    if (this.enemiesSpawned >= this.enemiesToSpawn && 
        this.enemies.length === 0) {
        
        this.waveInProgress = false
        
        // Bonus gold
        const bonus = 50 + this.wave * 10
        this.gold += bonus
        
        this.events.emit('waveComplete', { wave: this.wave, bonus })
        
        // Starta nästa wave efter 5s
        setTimeout(() => this.startWave(), 5000)
    }
}
```

### Difficulty Scaling

Enemies blir starkare varje wave:

```javascript
spawnEnemy() {
    const config = {
        health: 100 + (this.wave - 1) * 20,    // +20 hp per wave
        speed: 0.08 + (this.wave - 1) * 0.01,  // +0.01 speed per wave
        gold: 25 + (this.wave - 1) * 5,        // +5 gold per wave
        score: 10 + (this.wave - 1) * 2,
        color: this.getEnemyColor(this.wave)
    }
    
    const enemy = new Enemy(this, this.enemyPath, config)
    this.enemies.push(enemy)
}
```

**Wave 1:** 5 enemies, 100 hp, slow

**Wave 5:** 17 enemies, 180 hp, faster, more gold

## Event Integration

En stor del av att skapa ett tower defense är att det är ett utmärkt sätt att visa upp den event-drivna arkitekturen vi byggt tidigare. 

### Tower Defense Events

Här är en översikt över de events som används i spelet:

```javascript
// Wave events
'waveStart'          // { wave, enemies }
'waveComplete'       // { wave, bonus }
'gameOver'           // { wave, score }

// Enemy events
'enemySpawned'       // { enemy, wave, count, total }
'enemyKilled'        // { enemy, tower, position }
'enemyReachedEnd'    // { enemy, damage }

// Tower events
'towerBuilt'         // { tower, row, col, cost }
'towerShoot'         // { tower, target, position }

// Combat events
'projectileHit'      // { projectile, enemy, damage }
```

### Usage Examples

```javascript
// Lyssna på events
this.events.on('enemyKilled', (data) => {
    // Spela ljud
    this.audioManager.play('explosion')
    
    // Spawna partiklar
    this.particleSystem.emit('death', data.position, 20)
    
    // Uppdatera achievements
    this.achievements.increment('totalKills')
})

this.events.on('towerBuilt', (data) => {
    console.log(`Tower built at (${data.row}, ${data.col})`)
    this.audioManager.play('build')
})

this.events.on('waveComplete', (data) => {
    console.log(`Wave ${data.wave} complete! Bonus: ${data.bonus}G`)
    // Visa UI notification
})
```

**Fördelar:**
- Lätt att lägga till ljud (branch 14-audio)
- Lätt att lägga till partiklar (branch 15-particles)
- Lätt att lägga till achievements
- Loose coupling mellan systems


## Game Loop

### Resource Management

```javascript
// Start resources
this.gold = 500
this.lives = 20
this.wave = 0
this.score = 0

// Building costs gold
handleMouseClick() {
    if (this.gold < this.towerCost) {
        console.log('Not enough gold!')
        return
    }
    // ... build tower
    this.gold -= this.towerCost
}

// Killing enemies gives gold
if (enemy.takeDamage(proj.damage)) {
    this.gold += enemy.goldValue    // +25 gold
    this.score += enemy.scoreValue  // +10 score
}

// Enemies reaching end costs lives
reachEnd() {
    this.game.lives -= 1
    
    if (this.game.lives <= 0) {
        this.game.gameOver()
    }
}
```

### UI Display

```javascript
drawUI(ctx) {
    ctx.fillStyle = 'white'
    ctx.font = '20px Arial'
    
    ctx.fillText(`Gold: ${this.gold}`, 10, 30)
    ctx.fillText(`Lives: ${this.lives}`, 10, 60)
    ctx.fillText(`Score: ${this.score}`, 10, 90)
    ctx.fillText(`Wave: ${this.wave}`, 10, 120)
    ctx.fillText(`Tower: ${this.towerCost}G`, 10, 150)
    
    ctx.font = '14px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText('Click to build tower', 10, canvas.height - 40)
    ctx.fillText('Press P for debug mode', 10, canvas.height - 20)
}
```

## Debug Mode

Tryck **P** för att toggla debug mode:

```javascript
// I InputHandler
if (event.key === 'p') {
    this.debugMode = !this.debugMode
}
```

**Vad visas:**

### Tower Range Circles
```javascript
if (this.game.inputHandler.debugMode) {
    ctx.strokeStyle = 'cyan'
    ctx.beginPath()
    ctx.arc(centerX, centerY, this.range, 0, Math.PI * 2)
    ctx.stroke()
}
```

### Enemy Path
```javascript
if (this.game.inputHandler.debugMode) {
    // Rita hela path
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
    for (let i = 0; i < this.path.length; i++) {
        const wp = this.path[i]
        // Rita linje mellan waypoints...
        
        // Rita waypoint som cirkel
        ctx.fillStyle = i === this.currentWaypoint ? 'yellow' : 'gray'
        ctx.arc(wp.x, wp.y, 5, 0, Math.PI * 2)
        ctx.fill()
    }
    
    // Rita velocity vector
    ctx.strokeStyle = 'cyan'
    ctx.moveTo(screenX, screenY)
    ctx.lineTo(
        screenX + this.velocity.x * 100,
        screenY + this.velocity.y * 100
    )
    ctx.stroke()
}
```

### Target Lines
```javascript
if (this.game.inputHandler.debugMode && this.currentTarget) {
    // Rita line från torn till target
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.lineTo(targetX, targetY)
    ctx.stroke()
}
```

**Debug mode är ovärderligt för:**
- 🔍 Förstå hur path following fungerar
- 🎯 Justera tower range
- 🐛 Debugga collision/targeting issues
- 📐 Visualisera Vector2 operations

## Jämförelse med andra speltyper

### Tower Defense vs Platformer

| Aspekt | Tower Defense | Platformer |
|--------|--------------|-----------|
| Movement | Grid-based placement | Continuous physics |
| Player control | Strategic clicks | Direct WASD |
| Camera | Fixed | Following |
| Collision | Grid lookup | AABB continuous |
| Pacing | Wave-based | Continuous |
| Complexity | Systems (towers, waves) | Physics (gravity, jump) |

### Loop Patterns i Tower Defense

För det mesta i projektet har vi använt `forEach` för att iterera över arrays. I vissa fall har vi använt indexed loops (for-loops) när vi behöver ta bort element under iteration, detta är en refaktor från att vi tidigare använder `array.filter()`, vilket var praktiskt men när vi gjorde det upprepade gånger i game loopen så riskerade det att påverka prestanda negativt.

**forEach för rendering och enkel update:**
```javascript
// Bra: Bara läsning, ingen array-modifikation
this.towers.forEach(tower => {
    tower.draw(ctx, this.camera)
})

this.enemies.forEach(enemy => {
    enemy.update(deltaTime)
})
```

**Reverse indexed loop för removal:**
```javascript
// Nödvändigt: Tar bort element under iteration
for (let i = this.projectiles.length - 1; i >= 0; i--) {
    const projectile = this.projectiles[i]
    // ... logic
    if (projectile.markedForDeletion) {
        this.projectiles.splice(i, 1)  // Safe removal
    }
}
```

**Varför forEach är bra:**
- Tydlig intention: "för varje element, gör detta"
- Funktionell stil (konsekvent med map, filter)
- Kan inte glömma increment (i++)
- Readability > micro-optimizations

**När inte använda forEach:**
- När du tar bort element (splice)
- När du behöver `break` eller `continue`
- När du behöver indexet för logic (inte bara lookup)

**Performance:**
- forEach är ~0.001ms långsamare per 1000 iterationer
- Game loop = 16.67ms per frame (60 FPS)
- För 100 game objects = +0.0001ms (~0.0006% av frame)
- **Helt försumbart!** Prioritera läsbarhet.

## Nästa steg

**Branch 24: Component System**
- Olika tower types (cannon, ice, poison)
- ShootingComponent, SlowComponent, PoisonComponent
- Mix and match behaviors
- Tower upgrades

**Branch 25: FSM för Enemies**
- Patrol → Attack → Die states
- Enemy behavior variations
- Boss enemies med complex FSM

**Branch 26: Pathfinding (A*)**
- Dynamisk pathfinding
- Blockera path med torn → enemies hittar ny väg
- Grid-based A* algorithm
