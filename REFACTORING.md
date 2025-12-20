# Tower Defense Refactoring - Arkitektur & Design

## Översikt

Detta dokument beskriver den stora refaktorering som gjordes av Tower Defense-spelet, där en monolitisk "God Object" på 835 rader omvandlades till ett modulärt system med separation of concerns.

## Problemet - Före Refaktorering

### God Object Anti-Pattern
`TowerDefenseGame.js` var en 835-radig fil som gjorde **allt**:
- Våg-hantering (spawna fiender, räkna vågor)
- Torn-hantering (bygga, välja, validera kostnader)
- Projektil-fysik och kollisionsdetektering
- UI-rendering (HUD, laddningsskärm, dekorationer)
- Dekoration-hantering (moln, träd, slott)
- Input-hantering (mus, tangentbord)
- Asset-laddning
- Quiz-logik
- State management

### Konsekvenser
- **Svårt att hitta kod** - 835 rader att leta igenom
- **Svårt att testa** - Allt är sammankopplat
- **Svårt att underhålla** - Ändringar påverkar mycket
- **Ingen separation of concerns** - Affärslogik blandat med rendering
- **Tight coupling** - Direkta referenser mellan system (`this.enemies`, `this.towers`, etc.)

## Lösningen - Manager Pattern

### Nya Manager-klasser

#### 1. **WaveManager** (`src/managers/WaveManager.js`)
**Ansvar:**
- Spawna fiender baserat på vågnummer
- Hantera våg-progression och timing
- Räkna levande fiender
- Emittera events för våg-start och våg-slut

**Varför?**
- Isolerar fiende-hantering från resten av spelet
- Gör det enkelt att ändra spawning-logik eller balansera svårighetsgrad
- Enkelt att testa våg-progression separat

**Event-driven:**
```javascript
// Lyssnar på:
- enemyKilled    → Ta bort fiende från tracking
- enemyReachedEnd → Ta bort fiende från tracking

// Emitterar:
- waveStart      → Ny våg börjar
- waveComplete   → Våg klar
- enemySpawned   → Ny fiende spawnad
```

---

#### 2. **TowerManager** (`src/managers/TowerManager.js`)
**Ansvar:**
- Hantera torn-selektion (vilken torntyp spelaren valt)
- Bygga torn på grid
- Validera placering och kostnad
- Hantera DOM UI för torn-selektion (tidigare i `main.js`)
- Keyboard shortcuts för torn-val

**Varför?**
- Separerar torn-logik från spel-loop
- DOM-UI kod flyttad från `main.js` till rätt plats
- Enkelt att lägga till nya torntyper

**Event-driven:**
```javascript
// Emitterar:
- towerBuilt    → Torn byggt (inkluderar kostnad så spelet kan dra av guld)
- towerSelected → Spelaren valde ny torntyp
```

---

#### 3. **DecorationManager** (`src/managers/DecorationManager.js`)
**Ansvar:**
- Sätta upp slott, moln, träd, buskar
- Uppdatera animerade dekorationer (moln rör sig, träd svajar)
- Rita dekorationer i rätt ordning (lager-system)
- Undvika att placera dekorationer på stigen

**Varför?**
- Visuella element ska inte blandas med spellogik
- Layer management (bakgrund → entities → UI)
- Enklare att lägga till/ta bort dekorationer

**Rendering layers:**
```javascript
1. Castle (bakgrund)
2. Static decorations + Trees (mellangrund)
3. [Game entities ritas av andra managers]
4. Clouds (förgrund, semi-transparent)
```

---

#### 4. **ProjectileManager** (`src/managers/ProjectileManager.js`)
**Ansvar:**
- Spawna projektiler när torn skjuter
- Uppdatera projektil-fysik (rörelse, distans)
- Kollisionsdetektering med fiender
- Applicera skada och specialeffekter (splash, poison)
- Städa upp döda projektiler

**Varför?**
- Fysik och kollision är komplext - behöver eget ansvar
- Separerar skjut-logik från torn-logik
- Enklare att debugga träff-problem

**Event-driven:**
```javascript
// Lyssnar på:
- towerShoot → Spawna ny projektil

// Emitterar:
- projectileHit → Projektil träffade fiende
- enemyKilled   → Fiende dog av projektil
```

---

#### 5. **TowerDefenseUI** (`src/managers/TowerDefenseUI.js`)
**Ansvar:**
- Rita HUD (guld, liv, poäng, våg)
- Rita laddningsskärm
- Rita torn-placerings-preview
- Lyssna på events för UI-uppdateringar

**Varför?**
- UI ska ALDRIG vara blandat med spellogik
- Event-driven UI → Spelet ändrar state, UI uppdateras automatiskt
- Enklare att byta från Canvas till DOM senare

**Event-driven UI:**
```javascript
// Lyssnar på events istället för att läsa game state direkt:
goldChanged     → Uppdatera guld-display
livesChanged    → Uppdatera liv-display
scoreChanged    → Uppdatera poäng-display
waveStart       → Uppdatera våg-nummer
towerSelected   → Visa valt torn och kostnad
loadingProgress → Uppdatera laddnings-procent
```

---

#### 6. **GameStateManager** (`src/managers/GameStateManager.js`)
**Ansvar:**
- Hantera spel-states (LOADING, MENU, PLAYING, PAUSED, QUIZ, GAME_OVER)
- State transitions (övergångar mellan states)
- Emittera events vid state-ändringar
- Bestämma vad som ska uppdateras/ritas baserat på state

**Varför?**
- State management är viktigt och komplicerat
- Centraliserad kontroll över spel-flöde
- Enklare att lägga till nya states (t.ex. PAUSED)

**State Machine:**
```
LOADING → PLAYING → QUIZ → PLAYING → ... → GAME_OVER
              ↕
            PAUSED
```

---

### TowerDefenseGame - Ny Roll

**Från 835 rader till 379 rader** (55% reduktion!)

**Ny roll: Orchestrator**
- Koordinerar managers
- Hanterar högnivå spelflöde (quiz, game over)
- Äger resurs-state (guld, liv, poäng)
- Förmedlar events mellan managers

**Gör INTE längre:**
- ❌ Spawna fiender
- ❌ Bygga torn
- ❌ Rita UI
- ❌ Hantera dekorationer
- ❌ Kollisionsdetektering
- ❌ DOM UI setup

**Gör fortfarande:**
- ✅ Koordinera managers
- ✅ Hantera guld/liv/poäng
- ✅ Quiz-integration
- ✅ Event routing
- ✅ Game over logik

---

## OOP Principer

### 1. **Single Responsibility Principle (SRP)**
> En klass ska bara ha ett ansvar och en anledning att ändras

**Före:** TowerDefenseGame hade 10+ ansvarsområden  
**Efter:** Varje manager har ETT tydligt ansvar

**Exempel:**
- WaveManager: ENDAST våg-hantering
- TowerManager: ENDAST torn-hantering
- ProjectileManager: ENDAST projektil-fysik

---

### 2. **Separation of Concerns (SoC)**
> Separera olika aspekter av programmet

**Före:** Spellogik blandat med rendering blandat med input  
**Efter:**
- **Logik:** Managers hanterar affärslogik
- **Rendering:** UI-manager hanterar drawing
- **Input:** TowerManager tar emot input för torn
- **State:** GameStateManager hanterar states

---

### 3. **Loose Coupling via Events**
> Komponenter ska inte känna till varandra direkt

**Före:**
```javascript
// Tight coupling
this.gold -= cost
this.towers.push(tower)
this.ui.updateGold(this.gold)
```

**Efter:**
```javascript
// Loose coupling via events
this.events.emit('towerBuilt', { cost: 100 })

// Någon annanstans:
events.on('towerBuilt', (data) => {
    this.gold -= data.cost
    this.events.emit('goldChanged', { gold: this.gold })
})
```

**Fördelar:**
- TowerManager känner inte till guld-systemet
- UI känner inte till hur guld ändras
- Lätt att lägga till nya lyssnare

---

### 4. **Composition Over Inheritance**
> Bygg funktionalitet genom att komponera objekt

**Före:** Ett stort objekt gör allt  
**Efter:** TowerDefenseGame komponerar managers:

```javascript
class TowerDefenseGame {
    constructor() {
        this.waveManager = new WaveManager()
        this.towerManager = new TowerManager()
        this.decorationManager = new DecorationManager()
        // ...
    }
}
```

Detta mönster ses även i torn-systemet med Components!

---

### 5. **Dependency Injection**
> Skicka in beroenden istället för att skapa dem inuti

**Före:**
```javascript
class Tower {
    constructor() {
        this.game = globalGame  // ❌ Global dependency
    }
}
```

**Efter:**
```javascript
class WaveManager {
    constructor(game, enemyPath) {  // ✅ Injected
        this.game = game
        this.enemyPath = enemyPath
    }
}
```

**Fördelar:**
- Lättare att testa (mock dependencies)
- Ingen global state
- Tydliga dependencies

---

## Spelmotor Best Practices

### 1. **Manager Pattern**
Vanligt mönster i spelmotorer (Unity, Unreal, etc.):
- **SceneManager** → GameStateManager
- **AudioManager** → (kan läggas till)
- **InputManager** → InputHandler
- **EntityManager** → WaveManager + TowerManager

**Varför?**
- Organiserat och skalbart
- Lätt att hitta kod
- Standardmönster som andra känner igen

---

### 2. **Event-Driven Architecture**
Spelmotorer använder events/signals för loose coupling:
- Unity: `UnityEvent`, `Action`, `delegate`
- Godot: `signal`
- JavaScript: `EventEmitter`

**Vår implementation:**
```javascript
// Emit
this.events.emit('waveComplete', { wave: 5, bonus: 100 })

// Listen
this.events.on('waveComplete', (data) => {
    console.log(`Wave ${data.wave} done! +${data.bonus}G`)
})
```

---

### 3. **Update/Draw Separation**
Standard game loop pattern:

```javascript
gameLoop() {
    update(deltaTime)  // Logik
    draw(ctx)          // Rendering
}
```

**Viktigt:**
- Update: Ändra state, beräkna fysik
- Draw: Läs state, rita
- Aldrig blanda! (Draw ska inte ändra state)

---

### 4. **State Machine**
GameStateManager är en klassisk state machine:

```javascript
LOADING → PLAYING → QUIZ → PLAYING → GAME_OVER
```

**Används i:**
- AI (enemy states: patrol, chase, attack)
- Animation (idle, walk, jump)
- Game flow (menu, playing, paused)

---

### 5. **Layer-Based Rendering**
Explicit rendering order för korrekt visuellt resultat:

```javascript
draw() {
    // 1. Bakgrund
    decorationManager.drawCastle()
    
    // 2. Mellangrund
    decorationManager.drawDecorations()
    
    // 3. Entities
    towerManager.draw()
    waveManager.draw()
    projectileManager.draw()
    
    // 4. Förgrund
    decorationManager.drawClouds()
    
    // 5. UI (alltid överst)
    ui.draw()
}
```

---

## Event Flow - Exempel

### Exempel 1: Bygga ett torn

```
1. Användare klickar på canvas
   ↓
2. TowerDefenseGame ser mouse click
   ↓
3. TowerDefenseGame → TowerManager.handleMouseClick()
   ↓
4. TowerManager validerar position & kostnad
   ↓
5. TowerManager bygger torn
   ↓
6. TowerManager → events.emit('towerBuilt', { cost: 100 })
   ↓
7. TowerDefenseGame lyssnar → drar av guld
   ↓
8. TowerDefenseGame → events.emit('goldChanged', { gold: 400 })
   ↓
9. TowerDefenseUI lyssnar → uppdaterar guld-display
```

### Exempel 2: Torn skjuter projektil

```
1. ShootingComponent.update() hittar fiende
   ↓
2. ShootingComponent → events.emit('towerShoot', { projectile })
   ↓
3. ProjectileManager lyssnar → addProjectile()
   ↓
4. ProjectileManager.update() → kollision med fiende
   ↓
5. Enemy.takeDamage() → returns true (död)
   ↓
6. ProjectileManager → events.emit('enemyKilled', { enemy })
   ↓
7. TowerDefenseGame lyssnar → ger guld & poäng
   ↓
8. TowerDefenseGame → events.emit('goldChanged', { gold })
   ↓
9. TowerDefenseUI lyssnar → uppdaterar UI
```

---

## Före/Efter Jämförelse

### Radantal

| Fil/System | Före | Efter | Förändring |
|------------|------|-------|------------|
| TowerDefenseGame.js | 835 | 379 | -55% |
| WaveManager | - | 196 | NY |
| TowerManager | - | 201 | NY |
| DecorationManager | - | 225 | NY |
| ProjectileManager | - | 190 | NY |
| TowerDefenseUI | - | 144 | NY |
| GameStateManager | - | 147 | NY |
| main.js | 84 | 37 | -56% |
| **TOTAL** | 919 | 1519 | +65% |

**Notera:** Fler rader totalt, men:
- Mycket mer organiserat
- Lättare att hitta och ändra
- Varje fil är liten och fokuserad
- Bättre separation of concerns

### Komplexitet per fil

| Aspekt | Före | Efter |
|--------|------|-------|
| Max rader per fil | 835 | 225 |
| Ansvar per fil | 10+ | 1 |
| Testbarhet | Svår | Lätt |
| Underhåll | Svårt | Lätt |

---

## Lärdomar & Best Practices

### 1. **Börja inte med managers**
För små projekt är ett stort objekt OK. Refaktorera när det börjar bli rörigt.

### 2. **Events för kommunikation**
Använd events istället för direkta referenser mellan system.

### 3. **UI ska vara dum**
UI ska bara visa data, inte innehålla logik.

### 4. **En fil = Ett ansvar**
Om du inte kan förklara filenens ansvar i EN mening → dela upp den.

### 5. **Injicera dependencies**
Skicka in vad klassen behöver, skapa inte globala referenser.

---

## Framtida Förbättringar

### Möjliga nästa steg:

1. **ECS (Entity Component System)**
   - Istället för Manager pattern
   - Ännu mer flexibelt
   - Bättre performance för många entities

2. **State Pattern för AI**
   - Enemy state machine
   - Patrol → Chase → Attack → Retreat

3. **Command Pattern för Input**
   - Undo/Redo
   - Input replay
   - Better input handling

4. **Object Pool**
   - Återanvänd fiender/projektiler
   - Bättre performance
   - Mindre garbage collection

5. **Serialization System**
   - Spara/ladda spel
   - Level editor data
   - Tower presets

---

## Sammanfattning

### Vad vi uppnådde:
✅ **-55% rader i huvudfilen** (835 → 379)  
✅ **+6 fokuserade managers** med tydliga ansvar  
✅ **Event-driven arkitektur** för loose coupling  
✅ **Separation of concerns** mellan logik/rendering/state  
✅ **Bättre testbarhet** - varje manager kan testas separat  
✅ **Lättare underhåll** - ändringar påverkar mindre  

### OOP Principer som används:
- Single Responsibility Principle (SRP)
- Separation of Concerns (SoC)
- Loose Coupling (via Events)
- Composition Over Inheritance
- Dependency Injection

### Spelmotor Best Practices:
- Manager Pattern
- Event-Driven Architecture
- Update/Draw Separation
- State Machine
- Layer-Based Rendering

**Slutsats:** Från en 835-radig "God Object" till ett välstrukturerat, underhållbart system som följer branschstandard för spelmotor-arkitektur. Koden är nu enklare att förstå, testa och vidareutveckla.
