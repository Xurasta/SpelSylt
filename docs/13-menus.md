# Steg 13: Menysystem

I detta steg implementerar vi ett flexibelt menysystem med OOP-arv. Istället för att ha spelaren hamna direkt i spelet när det laddas, visar vi en huvudmeny där spelaren kan välja att starta, se kontroller, eller i framtiden lägga till fler alternativ som inställningar eller en shop.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Abstract Base Class** - Skapa en basklass som andra klasser ärver från
- **Inheritance** - Återanvända kod genom arv
- **Game States** - Hantera olika tillstånd i spelet (MENU, PLAYING, etc.)
- **Separation of Concerns** - Hålla menykod separat från spelkod
- **Modularitet** - Göra det enkelt att lägga till nya menyer

## Problemet - Inget sätt att pausa eller navigera

Hittills startar spelet direkt när sidan laddas. Det finns inget sätt att, pausa spelet, öppna en meny eller visa information.

Vi vill skapa ett menysystem så att vi kan visa olika menyer (huvudmeny, kontroller, inställningar) och låta spelaren navigera mellan dem. Det låter oss också skapa en grund för att lägga till fler menyer i framtiden.

## Designmönster - Abstract Base Class

I grunden så kommer vi skapa en abstrakt basklass `Menu` som hanterar all gemensam menylogik (input, rendering). Sedan skapar vi specifika menyer som ärver från denna klass och implementerar sina egna titlar och alternativ. 
Du känner förhoppningsvis igen detta mönster från `GameObject`-hierarkin vi skapade tidigare.

```
Menu (abstract)
  ├── getTitle() - abstract metod
  ├── getOptions() - abstract metod
  ├── update() - konkret implementering
  └── draw() - konkret implementering
      ↓
MainMenu extends Menu
  ├── getTitle() → "Game Menu"
  └── getOptions() → [Start Game, Controls]
      ↓
ControlsMenu extends Menu
  ├── getTitle() → "Controls"
  └── getOptions() → [Arrow Keys..., Back]
```

Fördelarna med att göra på det här sättet är att all menylogik (navigation, rendering) är i `Menu`-klassen, medan varje specifik meny bara behöver definiera sin titel och sina alternativ. Detta gör det enkelt att lägga till nya menyer i framtiden utan att ändra befintlig kod.
Som av en händelse så lär vi oss mer om arv och abstrakta klasser, vilket är viktiga OOP-koncept (Programmering 2).

## Menu - Abstract Base Class

För att skapa menysystemet så skapar vi först en abstrakt basklass `Menu`. Eftersom menyerna kommer bli flera så skapar vi en egen mapp `src/menus/` för dem.

Du kan hitta koden i [src/menus/Menu.js](src/menus/Menu.js).

### Viktiga delar i Menu.js

#### Abstrakta metoder

```javascript
getTitle() {
    throw new Error('Menu subclass must implement getTitle()')
}
```

JavaScript har inte inbyggt stöd för abstrakta klasser, så vi simulerar det genom att kasta fel om någon försöker använda basklassen direkt. Detta tvingar subklasser att implementera metoderna.

#### Konstruktorn

I konstruktorn anropar vi de abstrakta metoderna för att få menyens titel och alternativ.

```javascript
this.title = this.getTitle()
this.options = this.getOptions()
```
#### Uppdateringsmetod

I update metoden hanterar vi meny-navigering med piltangenter och Enter. Men vi behöver tillgång till spelets InputHandler för att läsa tangentbordsinput, men samtidigt så vill vi inte skapa en ny InputHandler för varje meny (det skulle skapa dubbla event listeners på window). Istället så skickar vi in en referens till spelet i konstruktorn och använder dess InputHandler.

```javascript
update(deltaTime) {
    const keys = this.game.inputHandler.keys
    // ...
}
```

Menyn använder samma InputHandler som spelet istället för att skapa en egen. Detta är enklare och undviker dubbla event listeners på `window`. PlatformerGame ansvarar för att rensa keys efter menu-update med `inputHandler.keys.clear()` för att förhindra att knapptryckningar "läcker" från menyn till spelet.

> 🛟 Enter-problem? Om spelet startar och sedan direkt hoppar tillbaka till menyn? Det beror ofta på att knapptrycket registreras flera gånger. Se till att du använder en flagga eller keys.clear() precis när du byter state!

#### Rensa Input

Just `inputHandler.keys.clear()` är bra att känna till om det är något annat tillfälle när du kodar och du behöver rensa all input. Du kan även rensa enskilda tangenter med `inputHandler.keys.delete('Key')`.

> 🎮 Oj vi har nu tillgång till ett alldeles eget input? Har du spelat något spel som haft cheat codes i menyn? Vad sägs om godmode eller gigantiska projektiler?

#### lastKeys Tracking

```javascript
this.lastKeys = new Set()
// ...i update():
if (keys.has('Enter') && !this.lastKeys.has('Enter'))
```

Vi sparar vilka tangenter som var nedtryckta förra framen för att detektera **nya** knapptryckningar. Utan detta skulle menyn hoppa genom alla alternativ direkt när man håller ner piltangenten.

Du kan testa detta genom att ta bort `lastKeys`-logiken och se hur menyn beter sig.

#### Options Array Structure

Varje val i menyn är ett objekt med:

```javascript
{
    text: 'Start Game',      // Vad som visas
    key: ' ',                // Tangent för direkt åtkomst (space)
    action: () => {...}      // Callback-funktion att köra
}
```

Detta gör menyer flexibla - de kan ha klickbara alternativ, tangentbordsgenvägar, eller både och.

## MainMenu - Huvudmenyn

Game menu är den första meny som visas när spelet laddas. Koden för `src/menus/MainMenu.js` ser ut som följer. Förhoppningsvis är strukturen såpass tydlig att du kan förstå den utan alltför mycket förklaring.

```javascript
import Menu from './Menu.js'
import ControlsMenu from './ControlsMenu.js'

export default class MainMenu extends Menu {
    getTitle() {
        return 'Game Menu'
    }
    
    getOptions() {
        return [
            {
                text: 'Start Game',
                key: ' ',
                action: () => {
                    this.game.gameState = 'PLAYING'
                    this.game.currentMenu = null
                    this.game.inputHandler.keys.clear()
                }
            },
            {
                text: 'Controls',
                key: 'c',
                action: () => {
                    this.game.currentMenu = new ControlsMenu(this.game)
                }
            }
        ]
    }
}
```

### Viktiga delar

#### getTitle() Implementation

```javascript
getTitle() {
    return 'Game Menu'
}
```

Simpel implementation av den abstrakta metoden. Returnerar bara en sträng.

#### Start Game Action

```javascript
action: () => {
    this.game.gameState = 'PLAYING'
    this.game.currentMenu = null
    this.game.inputHandler.keys.clear()
}
```

När spelaren väljer "Start Game":
1. Sätt gameState till PLAYING
2. Ta bort menyn (null)
3. **Viktigt:** Rensa keys så spelaren inte börjar röra sig direkt

Utan `keys.clear()` skulle mellanslag (som användes för att välja) också göra att spelaren hoppar direkt.

#### Controls Action

```javascript
action: () => {
    this.game.currentMenu = new ControlsMenu(this.game)
}
```

Byt ut nuvarande meny mot Controls-menyn.

## ControlsMenu - Kontrollvisning

Som ett exempel för en andra meny skapar vi en `ControlsMenu` som visar kontrollerna för spelet. Koden för `src/menus/ControlsMenu.js` ser ut så här: 

```javascript
import Menu from './Menu.js'
import MainMenu from './MainMenu.js'

export default class ControlsMenu extends Menu {
    getTitle() {
        return 'Controls'
    }
    
    getOptions() {
        return [
            {
                text: 'Arrow Keys - Move',
                key: null,
                action: null
            },
            {
                text: 'Space - Jump',
                key: null,
                action: null
            },
            {
                text: 'X - Shoot',
                key: null,
                action: null
            },
            {
                text: 'Back to Menu',
                key: 'Escape',
                action: () => {
                    this.game.gameState = 'MENU'
                    this.game.currentMenu = new MainMenu(this.game)
                }
            }
        ]
    }
}
```

Som sagt är detta ett exempel och vi kan använda upplägget för att skapa fler menyer i framtiden.

### Viktiga delar

#### Read-only Options

```javascript
{
    text: 'Arrow Keys - Move',
    key: null,
    action: null
}
```

Alternativ utan action-funktion är bara informativa. De kan inte väljas med Enter, men visas fortfarande i listan. Detta är perfekt för att visa information utan interaktion.

#### Back Navigation

```javascript
action: () => {
    this.game.gameState = 'MENU'
    this.game.currentMenu = new MainMenu(this.game)
}
```

Skapar en ny MainMenu-instans för att gå tillbaka. Vi skulle kunna ha sparat den gamla menyn, men att skapa en ny är enklare och fungerar bra.

## Uppdatera GameBase och PlatformerGame

Nu behöver vi integrera menysystemet i spelet. Eftersom menysystemet är universellt (alla speltyper behöver menyer) lägger vi `gameState` och `currentMenu` i `GameBase`. Sedan uppdaterar vi `PlatformerGame` för att hantera meny-logiken.

### Uppdatera GameBase.js

Först lägger vi till meny-state i `GameBase` eftersom alla speltyper behöver menyer:

```javascript
// I GameBase constructor:
this.gameState = 'MENU' // MENU, PLAYING, GAME_OVER, WIN
this.score = 0
this.currentMenu = null // Nuvarande meny som visas
```

Detta ger alla framtida speltyper (SpaceShooterGame, etc.) menu-support automatiskt!

### Import MainMenu i PlatformerGame

```javascript
import GameBase from './GameBase.js'
import Player from './Player.js'
// ... andra imports
import MainMenu from './menus/MainMenu.js'
```

### Uppdatera PlatformerGame Constructor

I konstruktorn skapar vi huvudmenyn efter `init()`:

```javascript
constructor(width, height) {
    super(width, height) // GameBase sätter gameState = 'MENU'
    
    // ... befintlig kod (worldWidth, gravity, levels, etc.)
    
    // Initiera spelet
    this.init()
    
    // Skapa och visa huvudmenyn
    this.currentMenu = new MainMenu(this)
}
```

Viktiga ändringar:
- `gameState` och `currentMenu` finns redan i GameBase (från `super()`)
- Skapa MainMenu efter init()
- **Observera:** `init()` skapar spelvärlden men ändrar inte `gameState` - det låter oss starta med meny

### Uppdatera init() Method

Vi behöver se till att `init()` inte återställer `gameState` till `'PLAYING'`. Om den gör det så skulle vi alltid hamna i spelet direkt efter init.

```javascript
init() {
    // Återställ score (men inte game state - det hanteras av constructor/restart)
    this.score = 0
    this.coinsCollected = 0
    
    // Återställ camera
    this.camera.x = 0
    this.camera.y = 0
    this.camera.targetX = 0
    this.camera.targetY = 0
    
    // Ladda level (som skapar player, platforms, coins, enemies)
    this.loadLevel(this.currentLevelIndex)
}
```

**Varför denna ändring?**
- Tidigare satte `init()` `gameState = 'PLAYING'` direkt
- Detta gjorde att konstruktorn inte kunde starta i MENU-läge
- Nu sätter GameBase `gameState = 'MENU'` i konstruktorn, `init()` behåller det

### Uppdatera restart() Method

Eftersom `init()` inte längre sätter `gameState`, måste `restart()` göra det:

```javascript
restart() {
    this.currentLevelIndex = 0
    this.init()
    this.gameState = 'PLAYING'
    this.currentMenu = null
}
```

När spelaren trycker R för att starta om från GAME_OVER/WIN:
1. Återställ till första level
2. `init()` laddar om level
3. `gameState` sätts explicit till PLAYING
4. Menyn rensas

### Uppdatera update() Method

```javascript
update(deltaTime) {
    // Uppdatera menyn om den är aktiv
    if (this.gameState === 'MENU' && this.currentMenu) {
        this.currentMenu.update(deltaTime)
        this.inputHandler.keys.clear() // Rensa keys så de inte läcker till spelet
        return
    }
    
    // Kolla Escape för att öppna menyn under spel
    if (this.inputHandler.keys.has('Escape') && this.gameState === 'PLAYING') {
        this.gameState = 'MENU'
        this.currentMenu = new MainMenu(this)
        return
    }
    
    // Kolla restart input
    if (this.inputHandler.keys.has('r') || this.inputHandler.keys.has('R')) {
        if (this.gameState === 'GAME_OVER' || this.gameState === 'WIN') {
            this.restart()
            return
        }
    }
    
    // Uppdatera bara om spelet är i PLAYING state
    if (this.gameState !== 'PLAYING') return
    
    // ... resten av update-logiken (gameObjects, platforms, etc.)
}
```

Viktiga ändringar:
- **Första kontrollen:** Om vi är i MENU, uppdatera menyn och returnera (pausa spelet)
- **`inputHandler.keys.clear()`**: Kritiskt! Rensar keys efter menu-update för att förhindra "key bleed"
- **Escape-tangent:** Öppna menyn från gameplay
- Befintlig kod fortsätter som vanligt

#### Varför inputHandler.keys.clear()?

Menyn använder samma `InputHandler` som spelet (shared state). Utan `clear()`:

**Problem:**
```
1. Player i menu trycker Space
2. Menu processar Space, startar game
3. gameState = 'PLAYING', currentMenu = null
4. Nästa frame: Space är fortfarande i inputHandler.keys
5. Player hoppar direkt!
```

**Lösning:**
```
1. Player i menu trycker Space
2. Menu processar Space
3. inputHandler.keys.clear(), rensar Space
4. gameState = 'PLAYING'
5. Nästa frame: Inga keys → player står still 
```

Detta är ett exempel på **shared state management** - menyn och spelet delar samma InputHandler, så vi måste vara noga med att rensa state när vi byter context.

### Uppdatera draw() Method

```javascript
draw(ctx) {
    // Rita alla plattformar med camera offset
    this.platforms.forEach(platform => {
        if (this.camera.isVisible(platform)) {
            platform.draw(ctx, this.camera)
        }
    })
    
    // ... befintlig rendering (coins, enemies, player, etc.)
    
    // Rita UI sist (utan camera offset - alltid synligt)
    this.ui.draw(ctx)
    
    // Rita meny överst om den är aktiv
    if (this.currentMenu) {
        this.currentMenu.draw(ctx)
    }
}
```

Viktig ändring:
- Menyn ritas **sist** så den ligger över allt annat
- Spelet fortsätter renderas i bakgrunden (pausad men synlig), vilket ger en trevlig effekt

## Hur det fungerar

### Game Flow

```
Spelet laddas
    ↓
gameState = 'MENU'
currentMenu = new MainMenu(this)
    ↓
Game Loop
    ├─ gameState === 'MENU'? → uppdatera bara menyn
    ├─ draw() → render game + menu
    └─ Repeat
        ↓
Spelaren väljer "Start Game" i menyn
    ↓
MainMenu action: gameState = 'PLAYING', currentMenu = null
    ↓
Game Loop
    ├─ gameState === 'PLAYING'? → uppdatera spelet normalt
    ├─ draw() → render game (no menu)
    └─ Repeat
        ↓
Spelaren trycker Escape under gameplay
    ↓
gameState = 'MENU', currentMenu = new MainMenu(this)
    ↓
Tillbaka till menyn (spelet pausat men synligt i bakgrunden)
```

## Uppgifter

### Lägg till en Shop-meny

En inte helt ovanlig funktion i spel är en shop där spelaren kan köpa uppgraderingar med poäng/mynt. Skapa en ny meny `ShopMenu` som ärver från `Menu`-klassen.

Detta kräver en del ändringar men grunden kan se ut så här:

```javascript
import Menu from './Menu.js'
import MainMenu from './MainMenu.js'

export default class ShopMenu extends Menu {
    getTitle() {
        return 'Shop'
    }
    
    getOptions() {
        return [
            {
                text: 'Health Upgrade (10 coins)',
                key: 'h',
                action: () => {
                    if (this.game.coinsCollected >= 10) {
                        this.game.player.maxHealth += 10
                        this.game.player.health = this.game.player.maxHealth
                        this.game.coinsCollected -= 10
                    }
                }
            },
            {
                text: 'Speed Upgrade (20 coins)',
                key: 's',
                action: () => {
                    if (this.game.coinsCollected >= 20) {
                        this.game.player.maxSpeed += 0.1
                        this.game.coinsCollected -= 20
                    }
                }
            },
            {
                text: 'Back',
                key: 'Escape',
                action: () => {
                    this.game.currentMenu = new MainMenu(this.game)
                }
            }
        ]
    }
}
```

Lägg till i MainMenu:

```javascript
import ShopMenu from './ShopMenu.js'

getOptions() {
    return [
        {text: 'Start Game', key: ' ', action: () => {...}},
        {text: 'Controls', key: 'c', action: () => {...}},
        {
            text: 'Shop',
            key: 's',
            action: () => {
                this.game.currentMenu = new ShopMenu(this.game)
            }
        }
    ]
}
```

Eftersom vi har skapat ett flexibelt menysystem är det enkelt att lägga till nya menyer och vi behöver inte ändra någon befintlig menylogik eller i `GameBase` eller `PlatformerGame`.

## Är du säker på?

Se om du kan skapa en dialog som frågar spelaren "Are you sure?" innan det gör något viktigt, som att avsluta spelet eller rensa framsteg. Detta kan göras genom att skapa en `ConfirmMenu` som ärver från `Menu`-klassen.

## Ljud

Lägg till ljud i menyerna, t.ex. ett klick-ljud när spelaren navigerar eller väljer ett alternativ. Du kan använda HTML5 Audio API för detta.

Vi behöver då ladda in ljudfiler och spela upp dem vid rätt tillfällen i `Menu`-klassen. Själva ljudfilerna blir assets precis som sprites.

Du laddar sedan in dem i ett `Audio`-objekt och anropar `play()` när ett alternativ väljs eller navigeras.

```javascript
const clickSound = new Audio('assets/click.mp3')
clickSound.play()
```

## Animerad bakgrund

Likt Mario så kanske du vill att spelets bakgrund ska vara animerad även när menyn visas. Detta kan göras genom att helt enkelt låta spelet uppdateras och ritas som vanligt även när menyn är aktiv.

Du behöver dock pausa spelaren så att den inte rör sig medan menyn är öppen. Detta kan göras genom att lägga till en kontroll i spelarens `update`-metod:

```javascript
update(deltaTime) {
    if (this.game.gameState !== 'PLAYING') return // Pausa spelaren om inte i PLAYING state
    // ... resten av spelarens update-logik
}
```

## Skapa en dialogruta

Skapa en `DialogMenu` som visar ett meddelande och har ett "OK"-alternativ för att stänga dialogen. Detta kan användas för att visa meddelanden till spelaren under spelets gång.

```javascript
import Menu from './Menu.js'
export default class DialogMenu extends Menu {
    constructor(game, message) {
        super(game)
        this.message = message
    }
    
    getTitle() {
        return 'Message'
    }
    
    getOptions() {
        return [
            {
                text: this.message,
                key: null,
                action: null
            },
            {
                text: 'OK',
                key: 'Enter',
                action: () => {
                    this.game.currentMenu = null
                    this.game.gameState = 'PLAYING'
                }
            }
        ]
    }
}
```

Prova nu att trigga-dialogen från spelet, t.ex. när spelaren samlar ett speciellt objekt.

### Testfrågor

1. Vad är en abstract base class och hur simulerar vi det i JavaScript?
2. Varför behöver vi `this.lastKeys` för att tracka knapptryckningar?
3. Vad händer om vi glömmer att anropa `this.game.inputHandler.keys.clear()` när vi startar spelet?
4. Varför ritar vi menyn **sist** i `Game.draw()`?
6. Hur skulle du implementera en nested meny (meny i meny, t.ex. Settings > Audio > Volume)?
7. Varför skapar vi en ny `MainMenu`-instans istället för att spara den gamla när vi går tillbaka från Controls?
8. Hur skulle du utöka systemet för att stödja dialog med NPCs som använder samma Menu base class?

## Nästa steg
