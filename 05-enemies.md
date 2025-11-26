# Steg 5 - Enemies - Fiender och Health System

I detta steg lägger vi till fiender med enkel AI(vad är AI? Vad räknas som intelligens?) och ett health-system för spelaren. Men det viktigaste är att vi står inför ett **arkitekturproblem** som kräver **refaktorisering**.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Separation of Concerns** - Vem äger vilken logik?
- **Single Responsibility Principle (SRP)** - En klass, ett ansvar
- **Code Duplication Problem** - DRY (Don't Repeat Yourself)
- **Refaktorisera** - Omstrukturera kod utan att ändra beteende
- **Arkitekturbeslut** - Tre olika lösningar på samma problem

## Problemet - När Game.js växer ohållbart

Titta på vad som händer när vi lägger till fiender:

```javascript
// Game.js update() - FÖRE enemies
update(deltaTime) {
    // Player physics
    this.player.velocityY += this.gravity * deltaTime
    this.player.update(deltaTime)
    
    // Platform collision för Player
    this.player.isGrounded = false
    this.platforms.forEach(platform => {
        const collision = this.player.getCollisionData(platform)
        if (collision) {
            if (collision.direction === 'top' && this.player.velocityY > 0) {
                this.player.y = platform.y - this.player.height
                this.player.velocityY = 0
                this.player.isGrounded = true
            }
            // ... 15 rader till med collision-logik
        }
    })
}
```

Nu vill vi lägga till fiender som också behöver:
- Gravitation
- Platform collision (exakt samma logik!)
- Gränskontroll

**Vad gör vi?**

### Alternativ 1: Copy-paste (Dåligt)

```javascript
update(deltaTime) {
    // Player physics + collision (20 rader kod)
    
    // Enemy physics + collision
    this.enemies.forEach(enemy => {
        enemy.velocityY += this.gravity * deltaTime
        enemy.isGrounded = false
        
        this.platforms.forEach(platform => {
            const collision = enemy.getCollisionData(platform)
            if (collision) {
                if (collision.direction === 'top' && enemy.velocityY > 0) {
                    enemy.y = platform.y - enemy.height
                    enemy.velocityY = 0
                    enemy.isGrounded = true
                }
                // ... SAMMA 15 rader igen! 😱
            }
        })
    })
}
```

**Problem med copy-paste:**
- Duplicerad kod (bryter mot DRY)
- Game.js blir massivt (snart 200+ rader)
- Bugfixar måste göras på två ställen
- Lägg till fler objekttyper? Copy-paste igen!
- Game.js ansvarar för ALLAs collision-logik (bryter mot SRP)

### Vad är problemet egentligen?

**Single Responsibility Principle - Vem ansvarar för vad?**

Just nu har `Game.js` FÖR MÅNGA ansvar:
1. Skapa och organisera objekt
2. Kalla update/draw på objekt
3. Avgöra VILKA objekt ska kolla kollision mot varandra
4. HANTERA collision-response för Player
5. HANTERA collision-response för Enemy
6. HANTERA collision-response för framtida Boss, NPC, MovingPlatform...

**Rätt fördelning:**
- `Game`: "Kolla om Player kolliderar med platforms" (organiserar)
- `Player`: "Om jag kolliderar uppifrån, stoppa mitt fall" (hanterar egen response)
- `Enemy`: "Om jag kolliderar från sidan, vänd riktning" (hanterar egen response)

## Tre lösningar på problemet

När vi ser denna duplicering har vi tre möjliga lösningar:

### Lösning 1: Flytta logiken till GameObject (Delad basmetod)

```javascript
// GameObject.js
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            this.y = platform.y - this.height
            this.velocityY = 0
            this.isGrounded = true
        }
        // ... samma för alla
    }
}

// Game.js
this.platforms.forEach(platform => {
    this.player.handlePlatformCollision(platform)
})
this.enemies.forEach(enemy => {
    this.platforms.forEach(platform => enemy.handlePlatformCollision(platform))
})
```

**Fördelar:**
- Ingen duplicering
- En metod att underhålla
- Game.js kortare

**Nackdelar:**
- Alla objekt får samma beteende (Enemy vänder inte vid vägg)
- Svårt att specialisera (Boss som studsar på plattformar?)
- GameObject blir "allt för alla" och växer

### Lösning 2: Skapa hjälpfunktion

```javascript
// utils/physics.js
export function handlePlatformCollision(entity, platform) {
    const collision = entity.getCollisionData(platform)
    // ... logik här
}

// Game.js
import { handlePlatformCollision } from './utils/physics.js'

this.platforms.forEach(platform => {
    handlePlatformCollision(this.player, platform)
})
this.enemies.forEach(enemy => {
    this.platforms.forEach(platform => handlePlatformCollision(enemy, platform))
})
```

**Fördelar:**
- Ingen duplicering
- Separation från GameObject-hierarkin
- Lättare att testa isolerat

**Nackdelar:**
- Samma rigida beteende för alla
- Entity vet inte om sin egen collision-handling
- Logiken är "extern" istället för inkapslade

### Lösning 3: Varje klass äger sin egen metod (Vi väljer denna)

```javascript
// Player.js
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            this.y = platform.y - this.height
            this.velocityY = 0
            this.isGrounded = true
        }
        // Player-specifik logik
    }
}

// Enemy.js
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            this.y = platform.y - this.height
            this.velocityY = 0
            this.isGrounded = true
        } else if (collision.direction === 'left' || collision.direction === 'right') {
            this.direction *= -1 // Vänd riktning! (Enemy-specifikt)
        }
    }
}

// Game.js - Blir MYCKET kortare
this.platforms.forEach(platform => {
    this.player.handlePlatformCollision(platform)
})
this.enemies.forEach(enemy => {
    this.platforms.forEach(platform => enemy.handlePlatformCollision(platform))
})
```

**Fördelar:**
- **Separation of Concerns**: Game organiserar, objekt hanterar
- **Single Responsibility**: Varje klass äger sin egen logik
- **Flexibilitet**: Enemy kan vända, Boss kan studsa, Player kan wall-jump
- **Inkapsling**: Kollisionslogik är del av objektet
- **Skalbarhet**: Lägg till fler objekttyper utan att röra Game.js

**Nackdelar:**
- Viss kod-duplicering (men med olika beteende)
- Varje klass måste implementera metoden

## Varför väljer vi Lösning 3?

**Separation of Concerns i praktiken:**

```
Game.js ansvarar för:
├── Skapa objekt
├── Organisera kollisionskontroller
├── Game state (score, health, level)
└── Koordinera game loop

Player.js ansvarar för:
├── Player input
├── Player movement
├── Player collision RESPONSE
└── Player rendering

Enemy.js ansvarar för:
├── Enemy AI (patrol)
├── Enemy movement  
├── Enemy collision RESPONSE (vänd vid vägg!)
└── Enemy rendering
```

**Jämför med före refactoring:**
```
Game.js ansvarade för:
├── Skapa objekt
├── Organisera kollisionskontroller  
├── Player collision response
├── Enemy collision response
├── Future Boss collision response
└── ... växer utan gräns
```

Detta är **Separation of Concerns** - varje klass har ett tydligt ansvarsområde och blandar inte ihop logik som hör hemma någon annanstans.

## Översikt - Vad ska vi bygga?

För att skapa ett enemy-system behöver vi:
1. **Enemy-klass** - Fiender som patrullerar och skadar spelaren.
2. **Refactoring** - Flytta `handlePlatformCollision()` till Player och Enemy.
3. **Health system** - Spelaren har health som minskar vid skada.
4. **Invulnerability** - Kort immunity efter skada för bättre spelupplevelse.
5. **Kollision för fiender** - Fiender kolliderar med plattformar, skärmkanter och varandra.
6. **UI för health** - Visa spelarens hälsa. 

## Fiender, skurakar och andra hemskheter

Vid det här laget så bör du vara ganska inne i arbetssättet vi har för att utveckla nya delar i spelet. Vi skapar en `Enemy` klass som ärver från `GameObject`, i klassen kan vi sedan börja lägga till det som gör en fiende till en fiende.

```javascript
export default class Enemy extends GameObject {
    constructor(game, x, y, width, height, patrolDistance = null) {
        super(game, x, y, width, height)
        this.color = 'red'
        
        // Fysik,samma som Player
        this.velocityX = 0
        this.velocityY = 0
        this.isGrounded = false
        
        // Patrol AI
        this.startX = x
        this.patrolDistance = patrolDistance
        this.endX = patrolDistance !== null ? x + patrolDistance : null
        this.speed = 0.1
        this.direction = 1 // 1 = höger, -1 = vänster
        
        this.damage = 1 // Hur mycket skada fienden gör
    }

    update(deltaTime) {
        // Applicera gravitation
        this.velocityY += this.game.gravity * deltaTime
        
        // Applicera luftmotstånd
        if (this.velocityY > 0) {
            this.velocityY -= this.game.friction * deltaTime
            if (this.velocityY < 0) this.velocityY = 0
        }
        
        // Patruller när på marken
        if (this.isGrounded) {
            this.velocityX = this.speed * this.direction
            
            // Om vi har en patrolldistans, vänd vid ändpunkter
            if (this.patrolDistance !== null) {
                if (this.x >= this.endX) {
                    this.direction = -1
                    this.x = this.endX
                } else if (this.x <= this.startX) {
                    this.direction = 1
                    this.x = this.startX
                }
            }
        } else {
            this.velocityX = 0
        }
        
        // Uppdatera position
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
    }
}
```

### Viktiga delar:

- **Ärver från GameObject** - Får `markedForDeletion`, `intersects()`, `getCollisionData()`.
- **Fysik** - Gravity och friction appliceras precis som för Player. Vi har viss duplicering av kod här men det är okej.
- **isGrounded** - Patruller endast när fienden står på en plattform.
- **Konfigurerbar patrol** - `patrolDistance = null` betyder kontinuerlig rörelse tills kollision.
- **Direction** - Håller reda på vilken riktning fienden rör sig.
- **Damage property** - Varje fiende äger sin egen skademängd.

## Refactoring - Flytta collision-response till objekten

Nu implementerar vi **Lösning 3** från diskussionen ovan. Detta är en **refactoring** - vi ändrar strukturen på koden utan att ändra beteendet.

**Vad är refactoring?**
- Omstrukturera kod för bättre design
- Beteendet förblir identiskt (inga nya features)
- Gör koden lättare att förstå och underhålla
- Förberedelse för framtida utökningar

### Steg 1: Skapa Player.handlePlatformCollision()

Vi flyttar kollisionslogiken från Game.js till Player-klassen. Koden är identisk, men nu **äger Player sin egen collision-response**.

```javascript
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            this.y = platform.y - this.height
            this.velocityY = 0
            this.isGrounded = true
        } else if (collision.direction === 'bottom' && this.velocityY < 0) {
            this.y = platform.y + platform.height
            this.velocityY = 0
        } else if (collision.direction === 'left' && this.velocityX > 0) {
            this.x = platform.x - this.width
        } else if (collision.direction === 'right' && this.velocityX < 0) {
            this.x = platform.x + platform.width
        }
    }
}
```

### Steg 2: Skapa Enemy.handlePlatformCollision()

Nu flyttar vi samma logik till Enemy-klassen. Men här ser vi **fördelen med Lösning 3** - Enemy kan ha sitt **egna beteende**!

```javascript
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            this.y = platform.y - this.height
            this.velocityY = 0
            this.isGrounded = true
        } else if (collision.direction === 'bottom' && this.velocityY < 0) {
            this.y = platform.y + platform.height
            this.velocityY = 0
        } else if (collision.direction === 'left' && this.velocityX > 0) {
            this.x = platform.x - this.width
            this.direction = -1 // Vänd riktning! ⭐ Enemy-specifikt beteende
        } else if (collision.direction === 'right' && this.velocityX < 0) {
            this.x = platform.x + platform.width
            this.direction = 1 // Vänd riktning! ⭐ Enemy-specifikt beteende
        }
    }
}
```

**Skillnaden mot Player:**
- Player: Stannar bara vid väggkollision
- Enemy: Vänder riktning (`this.direction *= -1`)
- Båda delar samma top/bottom-logik
- Varje klass kan specialisera beteendet!

**Reflektion om duplicering:**
Ja, vi har viss kod-duplicering (top/bottom-hantering). Men:
1. Beteendet är **inte identiskt** (Enemy vänder vid sidor)
2. Framtida objekt kan specialisera ytterligare (Boss studsar, MovingPlatform ignorerar gravity)
3. Om dupliceringen växer kan vi **senare** extrahera gemensam logik
4. Just nu prioriterar vi **flexibilitet** över **DRY**

**Design-princip:** "Föredra duplicering över felaktig abstraktion" - Det är lättare att extrahera gemensam kod senare än att bryta upp en för tidig abstraktion.

### Enemy.handleEnemyCollision()

För att fiender ska krocka med varandra så använder vi intersects metoden för att se om de krockar, om så är fallet så byter vi fiendens riktning.

```javascript
handleEnemyCollision(otherEnemy) {
    if (this.intersects(otherEnemy)) {
        this.direction *= -1
    }
}
```

### Enemy.handleScreenBounds()

Eftersom fienden patrullerar fram och tillbaka så vill vi att den ska vända när den når skärmens kanter (om den inte har en patrolDistance satt).

```javascript
handleScreenBounds(gameWidth) {
    if (this.patrolDistance === null) {
        if (this.x <= 0) {
            this.x = 0
            this.direction = 1
        } else if (this.x + this.width >= gameWidth) {
            this.x = gameWidth - this.width
            this.direction = -1
        }
    }
}
```

**Varför använder vi den här strukturen:**

**1. Single Responsibility Principle (SRP):**
- `Game`: Organiserar vilka objekt ska kolla kollision
- `Player`: Hanterar Players collision-response
- `Enemy`: Hanterar Enemys collision-response
- Varje klass har ETT väldefinierat ansvar

**2. Separation of Concerns:**
- Game-logik (koordinering) är separerad från Entity-logik (respons)
- Player vet hur Player ska reagera
- Enemy vet hur Enemy ska reagera
- Logik är inkapslade där den hör hemma

**3. Skalbarhet:**
Lägg till nya objekttyper utan att röra Game.js:
```javascript
// Boss.js - ny klass
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    if (collision?.direction === 'top') {
        this.bounce() // Boss studsar istället för att stanna!
    }
}

// Game.js - ingen ändring behövs, bara organisera
this.bosses.forEach(boss => {
    this.platforms.forEach(platform => boss.handlePlatformCollision(platform))
})
```

**4. Underhållbarhet:**
- Buggfix i Player-kollision? Ändra bara Player.js
- Ny funktion för Enemy? Ändra bara Enemy.js  
- Game.js växer inte längre för varje ny objekttyp

## Att krocka med en fiende gör ont

För att skapa en känsla av fara så kan vi lägga till hälsa för spelaren som vi minskar när spelaren krockar med en fiende. Vi lägger också till en kort period av invulnerability efter att ha tagit skada för att förbättra spelupplevelsen.

```javascript
// Health system
this.maxHealth = 3
this.health = this.maxHealth
this.invulnerable = false // Immun mot skada
this.invulnerableTimer = 0
this.invulnerableDuration = 1000 // 1 sekund
```

### Player.takeDamage() metod

När spelaren krockar med en fiende anropar vi `player.takeDamage(amount)`. Metoden ansvarar för att minska health, sätta invulnerability och markera spelaren för borttagning om health når 0. Vi kan styra hur mycket skada spelaren tar genom att skicka in ett värde som parameter, det låter oss skapa fiender med olika skadenivåer i framtiden.

```javascript
takeDamage(amount) {
    if (this.invulnerable) return
    
    this.health -= amount
    if (this.health < 0) this.health = 0
    
    // Sätt invulnerability
    this.invulnerable = true
    this.invulnerableTimer = this.invulnerableDuration
    
    // Spelaren dör om health når 0
    if (this.health <= 0) {
        this.markedForDeletion = true
    }
}
```

Osårbarhet (eng. invulnerability) förhindrar att spelaren tar skada flera gånger i snabb följd. Det ger även spelaren en chans att reagera efter att ha tagit skada samtidigt som spelaren kan utnyttja detta för att undvika mer skada när de plockar upp mynt.

### Invulnerability timer

Vår update metod använder hela tiden delta time för att räkna. Vi kan använda den för att skapa events som räknar med en timer. Detta passar perfekt för vår invulnerability period.

```javascript
if (this.invulnerable) {
    this.invulnerableTimer -= deltaTime
    if (this.invulnerableTimer <= 0) {
        this.invulnerable = false
    }
}
```

Timern räknar ner och när den når 0 kan spelaren skadas igen. Det här är en logisk del i koden som du kan applicera på många olika sätt i dina spel.

## Visuell feedback - berätta för spelaren att den är skadad / invulnerable

För att visa att spelaren är invulnerable så gör vi så att spelaren blinkar. Det är ett väldigt vanligt sätt att visa invulnerability i spel, så det är utmärkt att återanvända då detta mönster är välkänt av spelare.

```javascript
draw(ctx) {
    // Blinka när spelaren är invulnerable
    if (this.invulnerable) {
        const blinkSpeed = 100 // millisekunder per blink
        if (Math.floor(this.invulnerableTimer / blinkSpeed) % 2 === 0) {
            return // Skippa rendering för blink-effekt
        }
    }
    // ... normal rendering
}
```

**Hur det fungerar:**
- Delar `invulnerableTimer` med `blinkSpeed` (100ms)
- `Math.floor()` ger ett heltal
- `% 2` ger 0 eller 1 (jämnt eller udda)
- På jämna frames skippar vi rendering = blink

## Refaktoriserad kollisionshantering i Game.js

Nu när Player och Enemy äger sina egna `handlePlatformCollision()` metoder blir Game.js kortare och tydligare:

```javascript
// Game.js - tydlig och kortfattad
update(deltaTime) {
    // Spelarkollisioner med plattformar
    this.player.isGrounded = false
    this.platforms.forEach(platform => {
        this.player.handlePlatformCollision(platform)  // ← Delegerar till Player
    })

    // Fiendekollisioner
    this.enemies.forEach(enemy => {
        enemy.isGrounded = false
        
        // Plattformskollisioner
        this.platforms.forEach(platform => {
            enemy.handlePlatformCollision(platform)  // ← Delegerar till Enemy
        })
        
        // Skärmkanter
        enemy.handleScreenBounds(this.width)
    })

    // Fiende-fiende kollisioner
    this.enemies.forEach((enemy, index) => {
        this.enemies.slice(index + 1).forEach(otherEnemy => {
            enemy.handleEnemyCollision(otherEnemy)
            otherEnemy.handleEnemyCollision(enemy)
        })
    })

    // Spelaren tar skada från fiender
    this.enemies.forEach(enemy => {
        if (this.player.intersects(enemy) && !enemy.markedForDeletion) {
            this.player.takeDamage(enemy.damage)
        }
    })
}
```

**Varför intersects() för damage?**
- Vi behöver bara veta OM kollision sker
- Ingen riktning behövs (spelaren tar alltid skada)
- Enklare och snabbare än `getCollisionData()`

## Berätta för spelaren hur mycket health den har kvar

Det är viktigt att spelaren vet hur mycket health den har kvar. Vi kan visa detta i UI genom att rita text och hjärtan som representerar health. I det här fallet gör vi båda, men det är valfritt.

Vi använder oss av en loop så att om vi ändrar `maxHealth` så anpassas UI automatiskt.

```javascript
// Rita health text
const healthText = `Health: ${this.game.player.health}/${this.game.player.maxHealth}`
ctx.fillText(healthText, 20, 100)

// Rita hälso-fyrkanter
for (let i = 0; i < this.game.player.maxHealth; i++) {
    const heartX = 20 + i * 30
    const heartY = 110
    
    if (i < this.game.player.health) {
        ctx.fillStyle = '#FF0000' // Fyllt hjärta
    } else {
        ctx.fillStyle = '#333333' // Tomt hjärta
    }
    
    ctx.fillRect(heartX, heartY, 20, 20)
}
```

## Testa spelet

Nu kan du:
1. **Undvik fiender** - Röda fiender patruller
erar på plattformar
2. **Ta skada** - Spelaren blinkar och förlorar health
3. **Se health** - UI visar health som text och hjärtan
4. **Invulnerability** - Du kan inte ta skada direkt efter en hit

## Uppgifter

### En räserfiende

**Du lär dig att skapa olika fiendetyper med olika egenskaper.**

Testa nu att skapa olika typer av fiender, det kan vara en snabbare fiende som gör mindre skada, eller en starkare fiende som gör mer skada.
Du har kontroll över dessa egenskaper via `speed` och `damage` properties i Enemy-klassen.

### Hälsa och power-ups

**Du lär dig att ärva och skapa fler objekt med olika beteenden.**

Lägg till en power-up som återställer spelarens health när den plockas upp. Du kan skapa en ny klass `HealthPack` som ärver från `GameObject` och när spelaren krockar med den så ökar du spelarens health.
Du kan begränsa health till maxHealth så att den inte ökar för mycket.

Du kan också prova att göra en power-up som ger spelaren temporär ökad speed eller minskad skada från fiender. Du får då utgå från koden där vi skapade en timer för invulnerability. Hur kan du använda samma mönster för att skapa en temporär buff?

#### En health-bar

**Du lär dig rita ut andra former och styra dem med egenskaper från spelet.**

Om du vill så kan du testa att skapa en health-bar istället för hjärtan. En health-bar är en rektangel som fylls upp baserat på spelarens health. Du kan rita en rektangel med bredd baserad på `(player.health / player.maxHealth) * this.totalBarWidth`.

### Jakten på spelaren

**Är det här tecken på intelligens? Tveksamt men du lär dig styra objekt utifrån andra objekts position och rörelse.**

Du kanske vill prova att skapa en fiende som jagar spelaren istället för att patrullera. Här är ett enkelt exempel på hur du kan implementera detta i `update()` metoden för en ny fiendetyp:

```javascript
// Följe AI - jagar spelaren
update(deltaTime) {
    if (this.player.x < this.x) {
        this.x -= this.speed * deltaTime
    } else {
        this.x += this.speed * deltaTime
    }
}
```

### Krocka med känsla

**Genom att skapa en känsla av responsivitet i spelet förbättras spelupplevelsen och vi får mer juice.**

Ett sätt att få interaktionen att kännas bättre är att lägga till knockback när spelaren tar skada. Detta kan göras genom att justera spelarens velocity när `takeDamage()` anropas.

```javascript
takeDamage(amount, knockbackX = 0) {
    if (this.invulnerable) return
    
    this.health -= amount
    this.invulnerable = true
    this.invulnerableTimer = this.invulnerableDuration
    
    // Knockback
    this.velocityX = knockbackX
    this.velocityY = -0.3 // Studsa upp lite
}
```

### En fiende med massor av hälsa

**Genom att implementera ett health-system för fiender lär du dig mer om objektorienterad programmering och hur objekt kan interagera med varandra.**

Det här kräver att vi lägger till en `health` property i Enemy-klassen och en `takeDamage()` metod som minskar fiendens health när den träffas av spelaren (t.ex. via ett projektil). När health når 0 så markeras fienden för borttagning.

Du kan börja med implementeringen genom att göra så att fienden tar skada precis som spelaren gör när de krockar.

```javascript
// I Enemy.js
this.health = 3

takeDamage(amount) {
    this.health -= amount
    if (this.health <= 0) {
        this.markedForDeletion = true
        // Spawna coin eller poäng
    }
}
```

### Hoppa på fiender

**Du lär dig använda metoden för kollision och använda dess kollisionsdata för att skapa olika interaktioner beroende på krockens riktning.**

Vi har i systemet redan metoden för att kontrollera från vilket håll spelaren krockar med fienden. Använd detta för att implementera att spelaren kan hoppa på fiender för att skada dem istället för att ta skada själv.

Du får då använda `getCollisionData()` för att avgöra om spelaren krockar med fienden från toppen. Om så är fallet så anropar du fiendens `takeDamage()` metod och studsar spelaren uppåt.

## Sammanfattning

I detta steg har vi genomfört en viktig **arkitekturförändring** som förbereder kodebasen för framtida tillväxt:

**Refactoring och Separation of Concerns:**
- Flyttade collision-response från Game.js till respektive klass
- Game.js ansvarar för organisering, objekt ansvarar för sitt beteende
- Följer Single Responsibility Principle (SRP)

**Enemy System:**
- Fiender med patrol AI och physics
- Kollision med plattformar, skärmkanter och varandra
- Damage-system som skadar spelaren

**Health System:**
- Player har health som minskar vid damage
- Invulnerability med timer efter skada
- Visuell feedback med blink-effekt

**Arkitekturlektioner:**
- Tre olika lösningar på kod-duplicering problem
- Fördelar med distribuerad logik vs centraliserad
- Flexibilitet och specialisering per objekttyp
- "Who owns what" - tydliga ansvarsområden

## Testfrågor

### Arkitektur och Separation of Concerns

1. **Single Responsibility Principle:**
   - Lista Game.js ansvar FÖRE refactoring
   - Lista Game.js ansvar EFTER refactoring
   - Förklara hur detta följer SRP

2. **Tre lösningar på dupliceringen:**
   - Förklara varför L1 (GameObject.handlePlatformCollision) begränsar flexibilitet
   - Förklara varför L2 (utils/physics.js funktion) separerar logik från objekt
   - Förklara varför L3 (varje klass egen metod) ger mest flexibilitet
   - Vilken lösning skulle du välja för ett större spelprojekt? Varför?

3. **"Who owns what" - Ansvar:**
   - Vem äger beslutet "VILKA objekt ska kolla kollision"?
   - Vem äger beslutet "HUR ska jag reagera på kollision"?
   - Varför är denna separation viktig?

4. **Jämför före/efter:**
   - Hur många rader kod för platform collision i Game.js före refactoring?
   - Hur många rader efter?
   - Vad händer med Game.js om vi lägger till Boss, NPC, MovingPlatform?

### Refactoring

5. **Vad är refactoring?**
   - Definierar refactoring i dina egna ord
   - Varför behåller vi samma beteende?
   - När ska man refactorera vs skriva ny kod?

6. **Code smell - När behövs refactoring?**
   - Identifiera "smell" som indikerade behov av refactoring i Steg 5
   - Hur ser du när en klass har för många ansvar?
   - Ge exempel på andra "smells" som kräver refactoring

### Design decisions

7. **Duplicering vs Abstraktion:**
   - Enemy och Player har liknande handlePlatformCollision() - varför inte flytta till GameObject?
   - Förklara "Prefer duplication over wrong abstraction"
   - När är det OK med duplicering? När är det inte OK?

8. **Skalbarhet:**
   - Skriv pseudo-kod för en Boss som studsar på plattformar (använd handlePlatformCollision)
   - Skriv pseudo-kod för en NPC som går igenom plattformar
   - Hur enkelt var det att lägga till dessa utan att ändra Game.js?

### Tekniska koncept

9. **Enemy AI:**
   - Förklara hur patrol-logiken fungerar med startX, endX och direction
   - Varför patrullerar Enemy bara när isGrounded = true?
   - Hur skulle du implementera en Enemy som jagar spelaren?

10. **Invulnerability system:**
    - Förklara hela flödet från skada till invulnerability slutar
    - Hur fungerar blink-effekten? Förklara Math.floor() och % 2
    - Varför behöver vi invulnerability? Vad händer utan den?

11. **intersects() för damage:**
    - Varför använder vi intersects() för enemy damage men getCollisionData() för platforms?
    - Ge exempel på andra situationer där intersects() räcker
    - När MÅSTE vi använda getCollisionData()?

### Framtidsperspektiv

12. **Nästa steg mot komponentbaserad design:**
    - Vi har nu metoderna handlePlatformCollision(), handleEnemyCollision(), handleScreenBounds()
    - Hur skulle en PhysicsComponent se ut som äger alla dessa?
    - Förklara skillnaden mellan "Player ÄR EN GameObject" (arv) och "Player HAR EN PhysicsComponent" (komposition)

13. **Game.js roll:**
    - Game.js kallas ibland "Orchestrator" eller "Coordinator" - varför?
    - Vilka ansvar borde ALDRIG flyttas från Game.js?
    - Vilka ansvar borde ALLTID flyttas till objekten?

14. **Reflection - Återblick på hela tutorial-serien:**
    - Hur har Game.js roll förändrats från Steg 1 till Steg 5?
    - Vilka OOP-principer har vi använt? (Arv, Inkapsling, SRP, Separation of Concerns, DRY)
    - Hur förbereder denna struktur för ännu större spel?

## Nästa steg