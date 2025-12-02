# Spelmotor för 2D-spel

## Introduktion

Det här repot är skapat med Vite och innehåller en enkel spelmotor för 2D-spel med JavaScript och HTML5 Canvas. Spelmotorn hanterar grundläggande funktioner som spelobjekt, uppdateringsloop, rendering och input-hantering.

Vi använder Vite för att snabbt kunna starta och utveckla spelet med moderna JavaScript-funktioner och modulhantering. Kommandot för att initiera ett projekt med Vite är:

```bash
npm create vite@latest
```

Men det är redan gjort i detta repo, så du kan klona det direkt och börja utveckla ditt spel.

```bash
git clone <repo-url>
cd <repo-directory>
npm install
npm run dev
```

## Filstruktur

- `index.html`: Huvud-HTML-filen som laddar spelet.
- `src/`: Källkoden för spelet.
  - `Game.js`: Huvudklassen för spelet som hanterar spelloopen och spelobjekten.
  - `GameObject.js`: Bas-klass för alla spelobjekt.
  - `Rectangle.js`: Exempel på ett spelobjekt som är en rektangel.
  - `InputHandler.js`: Hanterar användarinput från tangentbordet.
- `style.css`: Grundläggande CSS för spelet.

## Kodstil

I det här projektet så använder vi import och export för att hantera moduler. Varje klass är sin egen fil och importeras där den behövs.

**Namnkonventioner:**
- Variabler och funktioner: `camelCase` (t.ex. `deltaTime`, `gameObjects`)
- Klasser: `PascalCase` (t.ex. `GameObject`, `Rectangle`)
- Klassfiler: `PascalCase.js` (t.ex. `Game.js`, `GameObject.js`)
- Konstanter: `UPPER_SNAKE_CASE` (t.ex. `MAX_SPEED`, `CANVAS_WIDTH`)

**Kodformat:**
- Inga semikolon i slutet av rader (modern JavaScript-standard)
- 4 mellanslag för indentering
- En klass per fil

## Förklaring av koden

Varje del i projektet har sin egen roll och ansvar. När vi startar spelet så fungerar det genom att de olika filerna samarbetar.

1. `index.html` laddar `main.js`.
2. `main.js` skapar en instans av `Game`-klassen och startar spelloopen.
3. `main.js` använder `requestAnimationFrame` för att skapa en loop som uppdaterar och renderar spelet varje frame med `game.update(deltaTime)` och `game.draw(ctx)`.
4. `Game.js` hanterar spelets logik, uppdateringar och rendering av spelobjekt.
5. `InputHandler.js` lyssnar på tangentbordsinput och sparar statusen för nedtryckta tangenter.
6. `GameObject.js` är bas-klassen för alla spelobjekt, och `Rectangle.js` är en specifik implementation av ett spelobjekt.

### main.js

Denna fil startar spelet genom att skapa en instans av `Game`-klassen och initiera spelloopen. Det är alltså setup-koden för spelet.

main.js importerar `Game`-klassen och skapar en ny spelinstans. Den använder `requestAnimationFrame` för att skapa en loop som uppdaterar och renderar spelet varje frame. Det vill säga den kallar på `game.update(deltaTime)` och `game.render(ctx)` varje gång webbläsaren är redo att rita en ny frame.

### Game.js

Denna fil innehåller `Game`-klassen som är hjärtat i spelmotorn. Den hanterar:
- Skapandet av spelobjekt i konstruktorn.
- Uppdateringsloopen som körs varje frame med `update(deltaTime)`-metoden. Denna metod uppdaterar alla spelobjekt genom att anropa deras egna `update(deltaTime)`-metoder.
- Rendering av spelobjekt på canvas med `draw(ctx)`-metoden. Denna metod ritar alla spelobjekt genom att anropa deras egna `draw(ctx)`-metoder.
- Hantering av användarinput via `InputHandler`-klassen. `InputHandler` lyssnar efter tangentbordsinput och sparar statusen för nedtryckta tangenter i en `Set`. Enskilda spelobjekt kan sedan kolla denna `Set` för att se om en viss tangent är nedtryckt och agera därefter.

Game.js roll är alltså att koordinera alla delar av spelet och se till att allt fungerar tillsammans.

### InputHandler.js

Denna fil innehåller `InputHandler`-klassen som lyssnar på tangentbordsinput. Klassen sparar status för nedtryckta tangenter och tillhandahåller metoder för att kontrollera dessa.

Vi kan använda detta för att påverka spelobjekt i `Game.js`, till exempel genom att öka hastigheten på en rektangel när en viss tangent är nedtryckt.

I exemplet kan du använda tangenterna 'r' och 'b' för att sätta fart på rektanglarna.

### GameObject.js

Denna fil innehåller bas-klass för alla spelobjekt. Den definierar grundläggande egenskaper som position, storlek och metoder för uppdatering och rendering. Alla specifika spelobjekt (som rektanglar) kommer att ärva från denna klass.

`GameObject`-klassen kommer aldrig att instansieras direkt, utan fungerar som en mall för andra spelobjekt (abstrakt). När vi använder den sedan så gör vi det genom att skapa subklasser som `Rectangle` som ärver från `GameObject`.
Syntax för att ärva från en klass i JavaScript ser ut så här:

```javascript
import GameObject from './GameObject.js'

export default class Rectangle extends GameObject {
    constructor(x, y, width, height, color) {
        super(x, y, width, height) // Anropa basklassens konstruktor
    }
}
```

Vi använder `super()` för att anropa basklassens konstruktor och skicka vidare nödvändiga parametrar.

`GameObject`-klassen definierar två metoder som måste implementeras av alla subklasser:
- `update(deltaTime)`: Metoden för att uppdatera objektets logik varje frame.
- `draw(ctx)`: Metoden för att rita objektet på canvas.

Det är viktigt att du följer det här mönstret för spelmotorn kommer att kalla dessa metoder på varje spelobjekt i `Game.js`. Om de saknas så kommer spelet att krascha med felmeddelandet att metoden inte är definierad.

#### Rectangle.js

Denna fil innehåller en specifik implementation av ett spelobjekt, nämligen en rektangel. Den ärver från `GameObject`-klassen och implementerar egna metoder för att rita sig själv på canvas och uppdatera.

I exemplet skapas två rektanglar med olika färger och positioner som rör sig när tangenterna 'r' och 'b' trycks ned.

## Uppgifter

I det här första steget så kommer vi titta på några uppgifter du kan göra för att förstå hur spelmotorn fungerar och för att experimentera med den.

### Rita något med rektanglar!

Använd Rectangle-klassen för att skapa något med rektanglar. Det kan vara ett hus, en bil, ett träd eller vad du vill. Använd din fantasi!

Du kan styra canvasets bakgrundsfärg genom att ändra `style.css`-filen.

```css
canvas {
    background-color: lightblue;
}
```

För att skapa nya rektanglar, lägg till dem i `Game.js`-konstruktorn:

```javascript
this.gameObjects.push(new Rectangle(50, 50, 100, 100, 'green'));
this.gameObjects.push(new Rectangle(200, 150, 150, 75, 'brown'));
```

#### Flytta de nya rektanglarna

Om du vill så kan du duplicera koden för att flytta rektanglarna i `update`-metoden i `Game.js`, precis som de befintliga rektanglarna.
Du kan också göra så att vi kan starta alla rektanglars rörelse med en och samma tangent genom att lägga till en loop som går igenom alla `gameObjects` och ökar deras `velocityX` när en viss tangent är nedtryckt.

### En ny form

Skapa en ny klass som ärver från GameObject, till exempel en cirkel eller en triangel. Implementera dess egna render-metod för att rita den på canvas. Lägg sedan till några instanser av denna nya klass i spelet och se hur de beter sig tillsammans med rektanglarna.

En Circle klass ärver från GameObject och du behöver sedan skapa en egen render-metod för att rita cirkeln.

```javascript
import GameObject from './GameObject.js'

export default class Circle extends GameObject {
    constructor(x, y, radius, color) {
        super(x, y, radius * 2, radius * 2) // Använd diameter för bredd och höjd
        this.radius = radius
        this.color = color
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
    }
}
```

### Visa tid

Rita en text på canvas som visar hur många sekunder spelet har varit igång. Använd `fillText`-metoden på canvas-kontexten för att rita text.

Den här koden ska du skriva i `Game.js`. Du behöver dels skapa en variabel för att hålla reda på den förflutna tiden, och sedan uppdatera och rita den varje frame. I `update`-metoden lägger du till så kan du öka `elapsedTime` med `deltaTime` eftersom `deltaTime` är hur många millisekunder som har gått sedan förra uppdateringen.

För att rita ut det behöver du sedan redigera `draw`-metoden för att rita ut text.

```javascript
ctx.fillStyle = 'black';
ctx.font = '20px Arial';
ctx.fillText(`Tid: ${(this.elapsedTime / 1000).toFixed(2)} s`, 10, 30);
```

### Kombinera former för att rita en figur

Använd både rektanglar och din nya form (t.ex. cirklar) för att skapa en mer komplex figur, som en robot eller ett djur. Placera formerna på rätt positioner för att få dem att se ut som en enhetlig figur.

Om du önskar kan du placera figuren i en separat klass som hanterar dess delar och deras positioner relativt till varandra.

```
   .---.
  /     \
 | o   o |
 |   ^   |
 \_/\_/\_/
 ```

## Sammanfattning

Det här repot ger en grundläggande struktur för att skapa 2D-spel med JavaScript och HTML5 Canvas. Genom att använda klasser och moduler kan vi organisera koden på ett tydligt sätt och enkelt utöka funktionaliteten. 

### Testfrågor

1. Vad är de tre huvudsakliga ansvarsområdena för Game-klassen?
2. Vad betyder deltaTime och varför används det i uppdateringsloopen?
3. Vilka tre egenskaper definierar position och storlek i GameObject-klassen?
4. Hur fungerar arv i spelmotorn? Ge ett exempel.
5. Vilken namnkonvention används för konstanter och ge ett exempel?
6. Vad händer i main.js och varför behövs requestAnimationFrame?
7. Hur sparar InputHandler information om nedtryckta tangenter?
8. Vilken Canvas-metod rensar skärmen mellan varje frame och varför behövs det?
9. Varför måste vi rensa canvas varje frame? Vad händer om vi skippar `clearRect()`?
10. Beskriv hela flödet från tangent-tryck till pixlar på skärmen. Vilka klasser är involverade?

## Nästa steg

Denna tutorial är uppdelad i steg som följer en logisk progression. Varje steg har sin egen git-branch (t.ex. `01-player`, `02-collision`, etc.) där koden för det steget finns implementerad.

När du har jobbat klart med materialet i det här steget, byt till nästa branch för att fortsätta till nästa del i guiden. Du kan antingen använda git-kommandon i terminalen eller klicka på branch-namnet längst ned till vänster i VSCode för att byta branch.

```bash
git checkout 01-player
```

Öppna sedan filen [Steg 1 - Player](01-player.md) för att fortsätta!