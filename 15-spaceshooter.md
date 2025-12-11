# Steg 15 - Space Shooter

I detta steg implementerar vi en vertikal space shooter som demonstration av hur GameBase-arkitekturen (från steg 09) fungerar för olika speltyper.

## Översikt

Space Shooter är ett vertikalt scrollande skjutspel där spelaren styr ett rymdskepp och bekämpar vågor av fiender. Detta steg bygger vidare på den refaktorering som gjordes i steg 09-14 och visar att GameBase verkligen är en återanvändbar foundation, inte bara platformer-kod med nya namn.

**Nyckelpunkter:**
- Använder GameBase som abstract base class
- Återanvänder InputHandler, Camera, UserInterface från tidigare steg
- Implementerar helt annorlunda spelmekanik (ingen gravity, vertikal scrollning, procedurell spawning)
- Integrerar med menysystemet från steg 13 och ljudsystemet från steg 14

## Arkitektur

### GameBase Foundation

Space Shooter bygger på GameBase-arkitekturen som introducerades i steg 09. Detta bevisar att refaktoringen skapade en verkligt återanvändbar foundation:

**Från GameBase (återanvänds direkt):**
- `inputHandler` - Hantering av tangenttryckningar
- `ui` - UserInterface för HUD (score, time, health bar, heat bar)
- `camera` - Kamerasystem (används fast, inte scrollande)
- `enemies[]` - Array för fiender
- `gameState` - MENU, PLAYING, GAME_OVER states
- `score`, `playTime` - Gemensam progression tracking

**SpaceShooterGame implementerar:**
- `init()` - Skapar SpacePlayer, resettar spawner, startar musik
- `restart()` - Återställer spelet till PLAYING state
- `update(deltaTime)` - Game loop med collision detection
- `draw(ctx)` - Rendering av backgrounds, objects, UI, menyer

### SpaceShooterGame vs PlatformerGame

| Feature | PlatformerGame | SpaceShooterGame |
|---------|---------------|------------------|
| **Arv** | Extends GameBase | Extends GameBase |
| **Scrollning** | Horisontell (följer spelare) | Vertikal (auto-scroll backgrounds) |
| **Kamera** | Följer spelarens X-position | Fixerad (x=0, y=0) |
| **Fysik** | Gravity + friction + plattformar | Ingen fysik, direkt velocity-baserad rörelse |
| **Level system** | Level-baserat (Level1.js, Level2.js) | Procedurell enemy spawning |
| **Progression** | Nivåer och coins | Score-baserad svårighet |
| **Spelaren** | Player (platformer) | SpacePlayer (heat system, shield) |
| **Fiender** | Enemy (patrullerar plattformar) | SpaceEnemy (12 typer, rör sig nedåt) |
| **Projektiler** | Projectile array i spel-klassen | SpaceProjectile + boss projectiles |
| **Powerups** | Coins (samlas för WIN) | PowerUp (health, shield - droppar från fiender) |
| **Ljud** | Bakgrundsmusik per spel-typ | Storm.mp3 (space theme) |

**Viktigt:** Båda spelen delar samma:
- Input system (InputHandler med keys Set)
- Menu system (MainMenu, GameOverMenu, ControlsMenu)
- UserInterface (HUD rendering)
- Camera (används olika, men samma klass)
- Background (generaliserad för både X och Y tiling/scrolling)

## Filstruktur

```
src/
  spaceshooter/
    SpaceShooterGame.js    # Huvudspel, ärver GameBase
    SpacePlayer.js         # Spelare med heat system
    SpaceEnemy.js          # 12 fiende-typer
    EnemySpawner.js        # Spawning system
    SpaceProjectile.js     # Projektiler
    PowerUp.js             # Health/Shield powerups
    BossEnemy.js           # Boss fiender
  assets/
    Shootem Up/            # Alla sprites
    sounds/
      Storm.mp3            # Bakgrundsmusik
```

## Komponenter

### SpaceShooterGame

Huvudspel-klassen som hanterar:
- 4 parallax bakgrunder med auto-scroll
- EnemySpawner för fiende-vågor
- Collision detection
- Score system
- Bakgrundsmusik

```javascript
constructor(width, height) {
    super(width, height)
    this.worldHeight = height * 10
    
    // 4 parallax layers med olika scroll-hastigheter
    this.backgrounds = [
        new Background(this, spaceImage, { 
            autoScrollY: -0.02, tileX: false, tileY: true 
        }),
        new Background(this, nebulaImage, { 
            autoScrollY: -0.04, tileX: false, tileY: true 
        }),
        new Background(this, starsImage, { 
            autoScrollY: -0.08, tileX: false, tileY: true 
        }),
        new Background(this, smallStarsImage, { 
            autoScrollY: -0.12, tileX: false, tileY: true 
        })
    ]
    
    // Fixed camera
    this.camera.x = 0
    this.camera.y = 0
    
    // Background music
    this.music = new Audio(stormMusic)
    this.music.loop = true
    this.music.volume = 0.3
}
```

### SpacePlayer

Spelar-klass med:
- **Heat system**: Vapen värms upp vid skjutning
  - Max heat: 100
  - Heat per shot: +8
  - Cooldown: -0.02 per ms
  - Overheated: 3000ms lockout
- **Shield**: Powerup som absorberar skada
- **Health**: 3 HP med invulnerability
- **Direct movement**: Ingen fysik, direkt positionering

```javascript
// Heat system
this.heat = 0
this.maxHeat = 100
this.heatPerShot = 8
this.heatCooldownRate = 0.02
this.overheated = false
this.overheatDuration = 3000

shoot() {
    if (this.overheated) return
    if (this.heat >= this.maxHeat) {
        this.overheated = true
        this.overheatTimer = this.overheatDuration
        return
    }
    
    this.heat += this.heatPerShot
    // Create projectile...
}

update(deltaTime) {
    // Heat cooldown
    if (this.heat > 0) {
        this.heat -= this.heatCooldownRate * deltaTime
        this.heat = Math.max(0, this.heat)
    }
    
    // Overheat recovery
    if (this.overheated) {
        this.overheatTimer -= deltaTime
        if (this.overheatTimer <= 0) {
            this.overheated = false
            this.heat = 0
        }
    }
}
```

### SpaceEnemy

Fiende-system med 12 olika typer:
- **4 storlekar**: Large, Medium, Small, Tiny
- **3 färger**: Rad 0, 1, 2 i sprite sheet
- **Olika stats**: Health, Speed, Damage, Points, Drop Chance

Fiendernas sprite-sheet är inte symmetrisk, så vi definierar deras egenskaper i en array där vi anger startX och bredd för att kunna rita ut rätt del och visa skeppet.

```javascript
const enemyData = [
    // Large (0): health 3, speed 0.1, dropChance 0.4
    { startX: 0, width: 104, health: 3, damage: 2, speed: 0.1, points: 300, dropChance: 0.4 },
    // Medium (1): health 2, speed 0.15, dropChance 0.2
    { startX: 104, width: 82, health: 2, damage: 1, speed: 0.15, points: 200, dropChance: 0.2 },
    // Small (2): health 1, speed 0.18, dropChance 0.1
    { startX: 186, width: 69, health: 1, damage: 1, speed: 0.18, points: 100, dropChance: 0.1 },
    // Tiny (3): health 1, speed 0.2, dropChance 0.05
    { startX: 255, width: 32, health: 1, damage: 1, speed: 0.2, points: 50, dropChance: 0.05 }
]
```

### EnemySpawner

Spawning-system med progression:
- **Normal spawning**: Interval minskar från 1500ms till 500ms
- **Boss spawning**: Vid score 2000, 5000, 8000 (+3000)
- **Wave patterns**: Line, V-formation, Random
- **Under boss**: Spawn tiny enemies var 3000ms för powerups

```javascript
spawnWave(waveType) {
    switch(waveType) {
        case 'line':
            // Horisontell linje av 5 enemies
            for (let i = 0; i < 5; i++) {
                const x = (this.game.width / 6) * (i + 1)
                this.spawnEnemy(x, -50, enemyType)
            }
            break
            
        case 'v':
            // V-formation
            for (let i = 0; i < 5; i++) {
                const offset = Math.abs(2 - i) * 50
                const x = (this.game.width / 6) * (i + 1)
                this.spawnEnemy(x, -50 - offset, enemyType)
            }
            break
    }
}
```

### PowerUp

Powerups med olika typer:
- **Health**: +1 HP
- **Shield**: Temporary shield

Spawnas när fiender dödas baserat på dropChance. Kolla i assets mappen för sprite sheet, där finns det många fler powerup-typer som kan läggas till i framtiden.

### BossEnemy

Boss-fiende med:
- Multi-phase health
- Shoots projectiles
- Större sprite
- Högre poäng

## Meny System

Space Shooter använder samma meny-system som skapades i steg 13. En skillnad är nu att istället för att ha en statisk Game over screen och Win screen i UserInterface, så hanteras dessa via menyer. Så nu när vi får Game Over, skapas en GameOverMenu-instans som visar score och playTime.

### Implementerade Menyer

**MainMenu.js**
- Start Game, kör `game.restart()` (startar musik, skapar spelare, börjar spawna fiender)
- Controls, visar ControlsMenu

**GameOverMenu.js**
- Visa final score och playTime
- Restart, kör `game.restart()`
- Main Menu, kör `game.showMainMenu()`

**ControlsMenu.js**
- Visar kontroller för space shooter:
  - Arrow keys - Move
  - Space - Shoot
  - Escape - Pause

### Game Over Flow

1. `player.health <= 0` upptäcks i SpaceShooterGame.update()
2. `gameState = 'GAME_OVER'`, `currentMenu = new GameOverMenu(this)`
3. Musiken pausas
4. Nästa frame: Menu uppdateras och ritas
5. Spelaren kan trycka R (restart) eller Escape (main menu)

## Ljud

- **Bakgrundsmusik**: Storm.mp3 (loopas, volume 0.3)
- Enkelt ljudsystem: SpaceShooterGame äger sin musik
- Startas i `init()`, pausas vid MENU/GAME_OVER

## Bakgrundssystem

Background.js generaliserades från steg 12 och stödjer nu både horisontell och vertikal scrollning.

**Funktioner:**
- `tileX`: Tiling på X-axeln (true/false)
- `tileY`: Tiling på Y-axeln (true/false)
- `autoScrollX`: Auto-scroll pixels per millisekund (för platformer)
- `autoScrollY`: Auto-scroll pixels per millisekund (för space shooter)
- `Math.floor()`: Pixel-perfect rendering för att undvika tiling-linjer

**Space Shooter använder:**
```javascript
new Background(this, image, {
    tileX: false,      // Stretch horisontellt (480px bred)
    tileY: true,       // Tila vertikalt
    autoScrollY: -0.08 // Scroll nedåt (negativt Y)
})
```

**Parallax Layers:**
Space Shooter använder 4 bakgrunder med olika scroll-hastigheter för djupeffekt:
- Space (-0.02) - Långsammast, längst bort
- Nebula (-0.05)
- Stars (-0.08)
- Small Stars (-0.12) - Snabbast, närmast

**Viktigt fix:** `Math.floor(x)` och `Math.floor(y)` i `drawTiled()` eliminerar sub-pixel rendering som orsakar synliga linjer mellan tiles. Det sker alltså för att Canvas inte alltid ritar pixlar exakt på heltal, vilket kan leda till att kanterna på tiles inte linjerar perfekt, men genoma att avrunda positionerna till heltal undviker vi detta problem.

## GameBase arkitektur

Detta steg visar att refaktorering-arbetet från steg 09-14 tillsammans med den grund vi skapat för spelet faktiskt fungerar. Vi kan alltså ta grunden i motorn och göra andra spel med den.
Syftet är såklart att inspirera och visa vad som är möjligt samt ge en massa exempel och kod som du kan använda!

1. **Abstract Base Class fungerar**: GameBase ger oss en solid grund för olika speltyper
2. **Separation of Concerns**: Game-specifik logik i konkreta klasser
3. **Code Reuse**: InputHandler, Camera, UI, Background fungerar för båda spel-typerna
4. **Flexibilitet**: GameObject används olika (physics vs direct movement)
5. **Menu System**: Samma menyer, olika game callbacks
6. **Design Patterns**: Template Method, Composition, Encapsulation

### Några saker att ha koll på

- Se till att sökvägarna i imports är korrekta när du kopierar filer mellan mappar.
- Kom ihåg att anpassa canvas dimensioner i main.js för ditt spels layout (t.ex. portrait för space shooter).
- Ordningen på logik i update() är kritisk för game states och input hantering.
- Var sätter spelet gameState? Spelaren ska inte känna till game states, det är Game-klassen som hanterar det.
- Menyn och input kräver noggrann timing för att fungera korrekt. 
