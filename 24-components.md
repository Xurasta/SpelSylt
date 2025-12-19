# Branch 24: Component System

## Översikt

I detta steg bygger vi om tornsystemet med ett **Component System**. Det är en designmetod där vi sätter ihop spelobjekt av små, självständiga delar (komponenter) istället för att använda arv. Detta ger oss flexibilitet, återanvändbarhet och bättre struktur när spelet växer.

## 🧩 Vad är ett Component System?

### Grundidé

**Arv (Inheritance):**
- Du skapar en klass för varje typ av torn.
- Problem: Om du vill ha en IceSplashTower måste du skapa en ny klass för varje kombination.

**Komposition (Composition):**
- Du skapar små komponenter, t.ex. ShootingComponent, SlowComponent, SplashComponent.
- Tornet blir en "container" som får de komponenter du vill ha.
- Du kan kombinera fritt: t.ex. ett torn med både slow och splash.

**Diagram:**
```
Tower + [Components]
├── Tower + [ShootingComponent]                    → Cannon
├── Tower + [ShootingComponent, SlowComponent]     → Ice
├── Tower + [ShootingComponent, SplashComponent]   → Splash
└── Tower + [ShootingComponent, PoisonComponent]   → Poison
```

### Konkret kodexempel: Arv vs Komposition

**Med arv:**
```javascript
class Tower { /* basic shooting */ }
class IceTower extends Tower { /* + slow logic */ }
class SplashTower extends Tower { /* + splash logic */ }
class IceSplashTower extends ??? // Problem! Måste duplicera kod eller multiple inheritance
```

**Med komponenter:**
```javascript
const iceTower = new Tower(game, x, y, {
    components: [ShootingComponent, SlowComponent]
})

const splashTower = new Tower(game, x, y, {
    components: [ShootingComponent, SplashComponent]
})

const iceSplashTower = new Tower(game, x, y, {
    components: [ShootingComponent, SlowComponent, SplashComponent]  // ✓ Fungerar!
})
```
**Resultat:** Ingen ny klass behövs för kombinationer!

## 🏗️ Arkitektur och Flöde

### Hur sätts ett torn ihop?

1. **TowerTypes.js** innehåller en lista med torn och vilka komponenter de ska ha.
2. När du bygger ett torn, skapas en Tower-instans med rätt komponenter.
3. Varje frame kör tornet alla sina komponenters `update()` och `draw()`.

**Kodreferens:**
```javascript
// TowerTypes.js
    ICE: {
        id: 'ice',
        name: 'Ice Tower',
        description: 'Slows enemies + shoots',
        cost: 150,
        color: 'lightblue',
        barrelColor: 'blue',
        components: [
            {
                type: ShootingComponent,
                config: {
                    damage: 30,
                    fireRate: 1200,
                    range: 180,
                    projectileSpeed: 0.5,
                    projectileColor: 'cyan'
                }
            },
            {
                type: SlowComponent,
                config: {
                    range: 150,
                    slowAmount: 0.5,  // 50% slower
                    duration: 3000,   // 3 seconds
                    tickRate: 500
                }
            }
        ]
    },
```

**Tower-konstruktorn:**

Förutom att sätta egenskaper som position och färg, anropar Tower-konstruktorn `setupComponents()` för att lägga till komponenterna från konfigurationen.

```javascript
/**
 * Setup components från tower type config
 */
setupComponents(componentConfigs) {
    componentConfigs.forEach(componentConfig => {
        const ComponentClass = componentConfig.type
        const config = componentConfig.config || {}
        
        const component = new ComponentClass(this, config)
        this.addComponent(component)
    })
}
```

---

### Flödesschema

```
Bygg torn → Skapa Tower → Lägg till komponenter → Varje frame: Tower kör alla komponenters update/draw
```

## 🔄 Exempel: Komponenter i praktiken

### 1. Cannon Tower (en komponent)

- Har bara ShootingComponent.
- Skjuter projektiler mot närmaste fiende.

**Diagram:**
```
┌─────────┐
│ Cannon  │
│ Tower   │
└────┬────┘
     │
 ┌───▼──────────┐
 │ Shooting     │
 │ Component    │
 └──────────────┘
```

### 2. Ice Tower (flera komponenter)

- Har ShootingComponent och SlowComponent.
- Skjuter projektiler och saktar ner fiender inom räckvidd.

**Diagram:**
```
┌─────────┐
│  Ice    │
│ Tower   │
└────┬────┘
     │
 ┌───▼──────────┐
 │ Shooting     │
 │ Component    │
 └──────────────┘
     │
 ┌───▼──────────┐
 │ Slow         │
 │ Component    │
 └──────────────┘
```

## 🎯 Fördelar med Component System

- **Flexibilitet:** Kombinera komponenter fritt för att skapa nya torn.
- **Återanvändbarhet:** Samma komponent kan användas i flera torn.
- **Underhållbarhet:** En bugg i t.ex. SlowComponent fixas på ett ställe.
- **Skalbarhet:** Lätt att lägga till nya komponenter och torn.

## 💻 Pseudokod: Hur funkar en komponent?

```javascript
class ShootingComponent {
    constructor(tower, config) {
        this.tower = tower
        this.damage = config.damage
        this.fireRate = config.fireRate
        this.range = config.range
        this.cooldown = 0
    }
    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime
            return
        }
        const target = this.findClosestEnemy()
        if (target) {
            this.shoot(target)
            this.cooldown = this.fireRate
        }
    }
    shoot(target) {
        // Skapa projectile och lägg till i spelet
    }
}
```

Det fungerar sedan så att `update()` anropas i `Tower` som sedan i sin tur anropar varje komponents `update()` varje frame.

---

## 🔧 Tekniska detaljer

### Hur komponenter får tillgång till tornet

Varje komponent får en referens till sitt torn i konstruktorn:

```javascript
// I Component.js
class Component {
    constructor(tower, config = {}) {
        this.tower = tower;  // ← Sparat!
        // ...
    }
}
```

Detta betyder att komponenter kan:
- **Läsa tornets data:** `this.tower.position`, `this.tower.range`
- **Anropa tornets metoder:** `this.tower.getGame()`, `this.tower.getComponent()`
- **Kommunicera med andra komponenter:** 
  ```javascript
  const shooting = this.tower.getComponent(ShootingComponent);
  if (shooting) {
      // Använd shooting komponentens data/metoder
  }
  ```

**Exempel från ShootingComponent:**
```javascript
shoot(target) {
    const game = this.tower.getGame();  // ← Via tower referens
    game.projectiles.push({
        position: { ...this.tower.position },  // ← Tower position
        // ...
    });
}
```

### Komponentinteraktion: Splash-exemplet

**Problem:** Hur vet SplashComponent när en projektil träffar?

**Lösning:** Komponenter kan lyssna på events genom metoder som `onProjectileHit()`.

**Flöde:**
```
1. ShootingComponent skjuter projektil
   └── projectile.components = [SplashComponent instance]

2. TowerDefenseGame detekterar träff
   └── projectiles.forEach(proj => {
         enemies.forEach(enemy => {
           if (collision) {
             proj.components.forEach(comp => comp.onProjectileHit?.(enemy, pos))
           }
         })
       })

3. SplashComponent.onProjectileHit() körs
   └── Skadar alla fiender inom splashRadius
```

**Kod i SplashComponent.js:**
```javascript
onProjectileHit(enemy, projectilePosition) {
    const game = this.tower.getGame();
    const enemiesInRange = this.findEnemiesInRange(
        projectilePosition, 
        this.splashRadius, 
        game.enemies
    );
    
    enemiesInRange.forEach(e => {
        e.health -= this.splashDamage;
    });
    
    // Skapa explosion visuell effekt
    this.explosions.push({/* ... */});
}
```

**Varför det fungerar:**
- Projektiler har `components[]` array
- Komponenter kan ha `onProjectileHit()` metod (optional)
- Game loop anropar metoden när träff sker
- Komponenten kan då reagera och göra sitt (splash damage, poison, etc.)

### Debug mode

Tryck på **P** under spelet för att se debug-information:

**För ShootingComponent:**
- Visar range-cirkel (grön)
- Visar linje till målet (röd)

**För SlowComponent:**
- Visar slow-range (blå cirkel)
- Visar snöflingor på sakta fiender

**För SplashComponent:**
- Visar explosionsanimationer när projektil träffar
- Visar splash-radie (orange cirkel)

**För PoisonComponent:**
- Visar giftmoln på förgiftade fiender
- Visar tickande skada i konsolen

Debug-läget hjälper dig att förstå vad varje komponent gör visuellt och att felsöka problem.

---

## 📂 Filstruktur och läsordning

För att förstå komponent-systemet, läs filerna i denna ordning:

1. **`src/components/Component.js`** ← Bas-klassen, börja här
   - Förstå `constructor(tower, config)`
   - Förstå lifecycle: `onAdd()`, `update()`, `draw()`, `onRemove()`

2. **`src/components/ShootingComponent.js`** ← Enklaste komponenten
   - Se hur `this.tower` används
   - Förstå `findClosestEnemy()` och `shoot()`

3. **`src/components/SlowComponent.js`** ← Introduktion till effekter
   - Se hur fiender får slow-effekt
   - Förstå `tickRate` och duration

4. **`src/components/SplashComponent.js`** ← Projektil-interaktion
   - Studera `onProjectileHit()` metoden
   - Se hur area damage fungerar

5. **`src/components/PoisonComponent.js`** ← Mest komplex
   - Förstå damage-over-time (DoT)
   - Se hur effekter tickar varje frame

6. **`src/TowerTypes.js`** ← Configuration
   - Se hur komponenter kombineras till torn
   - Studera olika konfigurationer

7. **`src/Tower.js`** ← Komponent container
   - Se `setupComponents()` metoden
   - Förstå `addComponent()` och `getComponent()`

8. **`src/TowerDefenseGame.js`** ← Allt tillsammans
   - Se hur projektil-träffar hanteras
   - Förstå tower selection (tangent 1-4)

---

## 🎯 Konkret uppgift: Skapa FireTower

Nu ska du skapa ett eget torn med en ny komponent!

### Steg 1: Skapa FireComponent.js

```javascript
// src/components/FireComponent.js
import Component from './Component.js';

export default class FireComponent extends Component {
    constructor(tower, config = {}) {
        super(tower, config);
        this.burnDamage = config.burnDamage || 5;  // Skada per tick
        this.burnDuration = config.burnDuration || 2000;  // 2 sekunder
        this.tickRate = config.tickRate || 500;  // Tick var 0.5s
        this.range = config.range || 150;
        
        this.nextTickTime = this.tickRate;
    }

    update(deltaTime) {
        this.nextTickTime -= deltaTime;
        
        if (this.nextTickTime <= 0) {
            this.nextTickTime = this.tickRate;
            this.applyBurn();
        }
    }

    applyBurn() {
        const game = this.tower.getGame();
        const enemiesInRange = this.findEnemiesInRange(game.enemies);
        
        enemiesInRange.forEach(enemy => {
            if (!enemy.burnEffects) enemy.burnEffects = [];
            
            enemy.burnEffects.push({
                damage: this.burnDamage,
                duration: this.burnDuration,
                tickRate: this.tickRate,
                nextTick: this.tickRate
            });
        });
    }

    findEnemiesInRange(enemies) {
        return enemies.filter(enemy => {
            const dx = enemy.position.x - this.tower.position.x;
            const dy = enemy.position.y - this.tower.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= this.range;
        });
    }

    draw(ctx, camera) {
        if (!this.tower.getGame().debugMode) return;
        
        // Rita range-cirkel (orange)
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            this.tower.position.x - camera.x,
            this.tower.position.y - camera.y,
            this.range,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }
}
```

### Steg 2: Uppdatera Enemy.js

Lägg till burn-effekt hantering i Enemy.js `update()`:

```javascript
// I Enemy.js update() metod
if (this.burnEffects && this.burnEffects.length > 0) {
    this.burnEffects.forEach(effect => {
        effect.nextTick -= deltaTime;
        effect.duration -= deltaTime;
        
        if (effect.nextTick <= 0) {
            this.health -= effect.damage;
            effect.nextTick = effect.tickRate;
        }
    });
    
    // Ta bort utgångna effekter
    this.burnEffects = this.burnEffects.filter(e => e.duration > 0);
}
```

### Steg 3: Lägg till i TowerTypes.js

```javascript
// Importera först
import FireComponent from './components/FireComponent.js';

// Lägg till i TowerTypes objektet
FIRE: {
    id: 'fire',
    name: 'Fire Tower',
    description: 'Burns enemies over time',
    cost: 200,
    color: 'orange',
    barrelColor: 'red',
    components: [
        {
            type: ShootingComponent,
            config: {
                damage: 20,
                fireRate: 1000,
                range: 150,
                projectileSpeed: 0.4,
                projectileColor: 'orange'
            }
        },
        {
            type: FireComponent,
            config: {
                range: 150,
                burnDamage: 5,
                burnDuration: 2000,
                tickRate: 500
            }
        }
    ]
}
```

### Steg 4: Lägg till tangent i TowerDefenseGame.js

I `handleKeyDown()` metoden:

```javascript
case '5':
    this.selectTowerType('fire');
    break;
```

### Steg 5: Testa!

1. Starta spelet
2. Tryck på tangent **5**
3. Bygg ett Fire Tower
4. Tryck **P** för debug mode
5. Se orange range-cirkeln
6. Se fiender ta skada över tid

### Reflektion

- Hur skiljer sig FireComponent från PoisonComponent?
- Kan du kombinera FireComponent med SlowComponent?
- Vad händer om en fiende får flera burn-effekter samtidigt?



## 📝 Tips till dig som elev

- Titta i koden på t.ex. `Tower.js` och `components/ShootingComponent.js` för att se hur det fungerar i praktiken.
- Fundera på hur du skulle lägga till en ny effekt – du behöver bara skapa en ny komponent och lägga till den i en torntyp.
- Testa att kombinera olika komponenter för att skapa egna torn.
