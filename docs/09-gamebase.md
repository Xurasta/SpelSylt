# Steg 9: GameBase - Abstraktion och återanvändning

Efter 8 steg har vi byggt ett komplett plattformsspel! Men vad händer om vi vill skapa ett annat typ av spel - ett space shooter till exempel? Då skulle vi behöva kopiera mycket kod från `Game.js`, och snart har vi duplicerad kod överallt. Det är här **abstraktion** och **arv** kommer in.

> 🎮 Syftet här är att få en spelmotor som ska göra det möjligt för dig att bygga det spel du önskar (inom gränser förstås). Vilket spel vill du bygga när du arbetat igenom materialet?

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Abstract Base Class** - Skapa en grundklass som andra klasser ärver från
- **Arv (Inheritance)** - Återanvänd gemensam funktionalitet
- **Template Method Pattern** - Definiera struktur, låt subklasser fylla i detaljer
- **Separation of Concerns** - Dela upp ansvar mellan klasser
- **DRY (Don't Repeat Yourself)** - Undvik duplicerad kod

## Översikt

För att göra vår kod återanvändbar skapar vi:
1. **GameBase** - Abstract basklass med gemensam funktionalitet
2. **PlatformerGame** - Refaktorerad från Game till att extendera GameBase
3. **Tydlig separation** - Vad är generellt vs plattformsspel-specifikt

## Problemet - Spelspecifik kod i Game.js

> 🛟 Nu ska vi stuva om och transplantera koden in i ett nytt skinn. Det är lätt att något går åt pipan i den processen, så ta för vanan att skapa backups eller jobba i en ny branch när du gör detta.

Efter 8 steg innehåller `Game.js` en stor blandning av generella spelfunktioner och plattformsspel-specifik logik. Det är något som byggts upp under de tidigare stegen. 
Det går att argumentera för att det är felaktiga designval att introducera så mycket spelspecifik logik i Game-klassen men samtidigt så blir det väldigt svårt att hänga med i vad vi gör om allt ska delas upp i för många filer och klasser från början.

Men för att nu refaktorisera spelmotorn så att den är redo för flera speltyper så behöver vi separera det som är **generellt** från det som är **plattformsspel-specifikt**. Ni känner förhoppningsvis igen tänket med att hitta det som är gemensamt och det som är specifikt.

**Generella saker (alla speltyper behöver):**
- InputHandler, UserInterface, Camera
- Game state (PLAYING, GAME_OVER, WIN)
- Score system
- Fiender och projektiler
- World dimensioner (worldWidth, worldHeight) - kan överskridas av subklasser

**Plattformsspel-specifika saker:**
- Gravity och friction
- Plattformar
- Mynt som samlas in
- Plattformskollisioner

**Vad händer om vi vill skapa ett space shooter?**
- Inget gravity system
- Inga plattformar
- Kanske power-ups istället för mynt
- Men samma input, UI, camera, score, fiender, projektiler!

## Lösningen - Abstract Base Class

Vi skapar `GameBase` - en abstrakt basklass som innehåller allt som är **gemensamt** för alla speltyper. Sedan låter vi `Game` ärva från `GameBase` och implementera all plattformsspel-specifik logik. Samma mönster som vi har använt för `GameObject` och `Rectangle`.

### Vad är en Abstract Base Class?

En abstract class är en klass som inte kan instansieras direkt. Den fungerar som en mall för andra klasser. Om vi ska använda hus-analogin från när vi förklarat OOP tidigare så är `GameBase` vad som krävs för att skapa ett hus, väggar och annat som krävs för att det ska bli ett hus. Sedan kan vi skapa olika typer av hus (t.ex. villa, lägenhet) som ärver från `GameBase` och lägger till sina egna specifika detaljer. Sedan när vi faktiskt bygger ett hus så skapar vi en instans av en specifik typ av hus, inte av `GameBase` direkt.

### Struktur

```
GameBase (abstract)
├── Properties: width, height, worldWidth (=width, ingen scrolling), score, gameState
├── Systems: camera, inputHandler, ui
├── Arrays: enemies
├── Abstract: init(), restart(), update(), draw()
│
├── PlatformerGame (plattformsspel)
│   ├── Extends GameBase
│   ├── Overrides: worldWidth = width * 3 (för sidoscrolling)
│   ├── Adds: gravity, friction, platforms, coins, projectiles
│   └── Implements: init(), restart(), update(), draw()
│
└── SpaceShooter (framtida)
    ├── Extends GameBase
    ├── Kan ha egen worldWidth för scrolling
    ├── Adds: asteroids, powerups, bullets, scrolling background
    └── Implements: init(), restart(), update(), draw()
```

> 🧠 SOLID är en objekorienterad princip. Det vi gör i det här steget är att vi tillämpar O:et i SOLID, nämligen Open/Closed Principle (Öppen/Stängd princip). Det innebär att klasser ska vara öppna för utökning men stängda för modifiering. Genom att använda en abstrakt basklass kan vi lägga till nya speltyper utan att ändra den generella spelmotorn.

## Implementering
### GameBase.js

Vi börjar med att skapa den abstrakta basklassen `GameBase.js`, du kan titta på koden i filen [src/GameBase.js](src/GameBase.js).

### Viktiga delar

#### Constructor check

I konstruktorn kollar vi om någon försöker skapa en instans av `GameBase` direkt, om så är fallet kastar vi ett error.

```javascript
if (new.target === GameBase) {
    throw new Error('GameBase är en abstract class')
}
```

#### Gemensamma properties

Här försöker vi samla alla properties som är gemensamma för alla speltyper. Det är inget facit eller rätt eller fel, utan en bedömning av vad som är generellt vs specifikt.
Om vi skapar en farming-simulator i framtiden så kanske vi inte behöver `enemies` eller `projectiles`.

- `width, height` - Canvas storlek
- `worldWidth, worldHeight` - Världens storlek (default: samma som canvas, ingen scrolling)
  - Subklasser kan överskriva för att aktivera scrolling (t.ex. PlatformerGame)
- `gameState` - State machine
- `score` - Poängsystem
- `inputHandler, ui, camera` - Gemensamma system
- `enemies[]` - De flesta spel har fiender

#### Abstract methods

Vissa av metoderna vill vi "tvinga" subklasser att implementera själva, eftersom de är spelspecifika. Vi gör detta genom att skapa **abstrakta metoder** som kastar ett error om de inte implementeras.
Det är mest ett hjälpmedel för att undvika misstag, inget måste. Men när vi har det på plats så berättar vi för andra utvecklare (och oss själva) att dessa metoder MÅSTE implementeras i subklasserna.

```javascript
init() {
    throw new Error('init() måste implementeras')
}
```

### PlatformerGame.js - Refaktorerad med arv

Nu kan vi komma igång med att refaktorisera `Game.js` till `PlatformerGame.js` för att ärva från `GameBase`. Titta på den refaktorerade koden i [src/PlatformerGame.js](src/PlatformerGame.js). Vi vill ladda in de plattformsspel-specifika delarna i `PlatformerGame.js` och låta `GameBase` hantera det generella.

### Vad händer när vi gör `new PlatformerGame(800, 600)`?

1. **PlatformerGame constructor körs**
   ```javascript
   constructor(width, height) {
       super(width, height)  // Anropar GameBase constructor
   ```

2. **GameBase constructor körs**
   - Sätter `width = 800`, `height = 600`
   - Sätter `worldWidth = 800`, `worldHeight = 600` (default: ingen scrolling)
   - Skapar `inputHandler`, `ui`, `camera`
   - Sätter `score = 0`, `gameState = 'PLAYING'`
   - Initialiserar `enemies = []`

3. **Tillbaka till PlatformerGame constructor**
   - Överskriver `worldWidth = width * 3` (aktiverar sidoscrolling)
   - Uppdaterar camera bounds med ny worldWidth
   - Lägger till `gravity`, `friction` (plattformsspel-specifikt)
   - Lägger till `coinsCollected`, `totalCoins`
   - Skapar `platforms = []`, `coins = []`, `projectiles = []`
   - Anropar `this.init()`

4. **PlatformerGame.init() körs**
   - Skapar `player`, `platforms`, `coins`, `enemies`

**Resultat:** Ett `PlatformerGame`-objekt som har både GameBase funktionalitet OCH plattformsspel-funktionalitet!

## Varför är detta bättre?

Förhoppningsvis är inte abstraktionen sådär jätteförvirrande och att du kan se fördelarna med att dela upp koden på detta sätt. Fördelarna är om vi tittar på vad Game.js innehöll så kan vi se att Input, UI, Camera, Score, GameState, Enemies och Projectiles är kod som skulle dupliceras i varje spel vi skapar. 

```
Tidigare Game.js (300 rader)
├── Input, UI, Camera (50 rader)        → Nu i GameBase
├── Score, GameState (20 rader)         → Nu i GameBase
├── Enemies, Projectiles (80 rader)     → Nu i GameBase
├── Platforms, Coins (50 rader)         → Kvar i PlatformerGame
└── Game loop (100 rader)               → Kvar i PlatformerGame

Nu:
GameBase.js (75 rader) - Återanvändbart!
PlatformerGame.js (285 rader) - Plattformsspel-specifikt
```

## Design patterns

### Template Method Pattern

GameBase definierar "mallen" för hur ett spel ska fungera:
```
1. Konstruktor, Skapa gemensamma system
2. init(), Skapa spelobjekt, tänk level
3. update(deltaTime), Uppdatera logik
4. draw(ctx), Rita logik
5. restart(), Återställ spelet
```

Subklasser "fyller i detaljerna" men följer samma struktur.

### Separation of Concerns

**GameBase ansvarar för:**
- Gemensamma system (input, UI, camera)
- Definiera interface (abstrakta metoder)
- Gemensamma properties (score, gameState, enemies)
- Default world size (worldWidth = width, ingen scrolling)

**PlatformerGame ansvarar för:**
- Plattformsspel-specifik logik
- Överskriva worldWidth för sidoscrolling
- Skapa och hantera plattformsobjekt (platforms, coins, projectiles)
- Implementera game loop för plattformsfysik (gravity, friction)
- Plattformsspel-specifik state (coinsCollected, totalCoins)

**Varför är detta bra?**
Varje klass har ett tydligt ansvar. Om något med camera är fel - kolla GameBase. Om plattformskollisioner är fel - kolla PlatformerGame.

### Open/Closed Principle

> "Open for extension, closed for modification"

- **Open:** Vi kan extendera GameBase med nya speltyper (PlatformerGame, SpaceShooter, TwinStick)
- **Closed:** Vi behöver inte ändra GameBase när vi lägger till nya spel
  - PlatformerGame lägger till platforms, coins, gravity
  - SpaceShooter skulle lägga till asteroids, powerups, scrolling
  - TwinStick skulle lägga till twin-stick controls, waves

Detta är en av SOLID-principerna för objektorienterad design.

> 🎮 Varför gör vi detta? Det verkar tråkigt nu, men när denna fil är klar äger du en Spelmotor. Vill du göra Flappy Bird? 
> * class FlappyGame extends GameBase
> * Ändra gravitationen.
> * Klart!?

## OOP principer och koncept

I det här steget så har vi använt flera viktiga OOP-principer och koncept. Vi börjar med arv, där `PlatformerGame` ärver från `GameBase`, vilket gör att vi kan återanvända gemensam funktionalitet utan att duplicera kod.

Men vi har också ett tydligt exempel på abstraktion, där `GameBase` fungerar som en abstrakt basklass som definierar ett interface för alla speltyper. Detta gör att vi kan skapa olika spel (som plattformsspel eller space shooter) utan att behöva oroa oss för de specifika detaljerna i varje speltyp.

Samtidigt så har vi också tittat på ett steg i vårt kodande där det var dags att refaktorisera och organisera koden bättre. Genom att skapa `GameBase` och byta namn på `Game` till `PlatformerGame` så har vi separerat det generella från det specifika, vilket gör koden mer modulär och lättare att underhålla.
Detta är också ett exempel på "Separation of Concerns", där varje klass har ett tydligt ansvar och fokus.

> 🛟 När vi refaktoriserar kod så betyder det att vi skriver om och flyttar delar av den, det är något som kan ställa till det då stora delar av koden plötsligt fungerar lite annorlunda. Om du kör fast, utgå från att du har koden i varje branch och bygg vidare på den.