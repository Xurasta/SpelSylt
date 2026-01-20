# Steg 1 - Player

Vi skapar en spelarklass med tangentbordskontroll och rörelse - grunden för alla interaktiva spel.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Arv (Inheritance)** - Player bygger vidare på GameObject
- **Input-hantering** - Koppla tangentbordet till spelarrörelse
- **DeltaTime** - Framrate-oberoende rörelse
- **Inkapsling** - Player äger sin egen data och beteende

## Översikt

För att skapa en kontrollerbar spelare behöver vi:
1. **Player-klass** - Ärver från GameObject, får grundläggande egenskaper
2. **Velocity-system** - Hastighet och riktning för rörelse
3. **Input-hantering** - Läsa tangentbordet via InputHandler
4. **Rendering** - Rita spelaren med ögon och mun som "tittar"

## Konstruktor

Konstruktorn tar emot `game`-instansen samt position och storlek för spelaren. Den initierar även hastighet och riktning.

```javascript
    constructor(game, x, y, width, height, color = "green") {
        super(game, x, y, width, height)
        this.color = color
        
        // Nuvarande hastighet (pixels per millisekund)
        this.velocityX = 0
        this.velocityY = 0

        // Rörelsehastighet (hur snabbt spelaren accelererar/rör sig)
        this.moveSpeed = 0.5
        this.directionX = 0
        this.directionY = 0
    }
```

Vi sätter egenskaper för färg, hastighet och riktning - ett standardmönster för spelobjekt. Notera standardparametern `color = "green"` som gör att vi kan skapa en grön spelare utan att ange färg explicit.

## Uppdateringsmetod

I uppdateringsmetoden händer mycket. Vi kollar vilka tangenter som är nedtryckta och uppdaterar spelarens hastighet och riktning baserat på detta. Vi sätter även variabler för spelarens riktning (`directionX` och `directionY`) som kan användas för att rita ögon som "tittar" i rörelseriktningen, eller för animationer och attacker.

```javascript
    update(deltaTime) {
        // Kolla input för rörelse
        if (this.game.input.isKeyPressed('ArrowUp')) {
            this.velocityY = -this.moveSpeed
            this.directionY = -1
        } else if (this.game.input.isKeyPressed('ArrowDown')) {
            this.velocityY = this.moveSpeed
            this.directionY = 1
        } else {
            this.velocityY = 0
            this.directionY = 0
        }

        // ... samma för vänster och höger

        // Uppdatera position baserat på hastighet
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
    }
```

Hanteringen av input och rörelse följer samma mönster för både X- och Y-axeln. Vi kollar om en tangent är nedtryckt och sätter hastigheten i den riktningen, annars nollställs hastigheten.

**Viktigt:** Vi hanterar rörelsen i två separata if-satser (inte `else if`) - fundera på varför. Ledtråd: Vad händer om spelaren trycker både upp OCH höger samtidigt?

Slutligen uppdaterar vi spelarens position baserat på hastigheten och `deltaTime` för att göra rörelsen framrate-oberoende.

### Stoppa spelaren från att gå utanför canvas

Om du vill kan du lägga till kod för att stoppa spelaren från att gå utanför canvasens gränser. Lägg till följande kod i slutet av `update`-metoden men innan vi uppdaterar positionen för spelaren.

```javascript
// stoppa från att gå utanför canvas
if (this.x < 0) this.x = 0
if (this.x + this.width > this.game.width) this.x = this.game.width - this.width
if (this.y < 0) this.y = 0
if (this.y + this.height > this.game.height) this.y = this.game.height - this.height
```

## Renderingsmetod

I draw ritar vi ut spelaren som en rektangel, precis som i `Rectangle`-klassen. Men här lägger vi även till ögon som "tittar" i den riktning spelaren rör sig för att ge karaktär.

Vi använder `directionX` och `directionY` (från `update`-metoden) för att påverka var ögonen ritas.

### Rita mun

I slutet av `draw`-metoden så ritar vi även en mun som ett streck. Detta gör vi med hjälp av `beginPath`, `moveTo`, `lineTo` och `stroke`-metoderna på canvas-kontexten.

```javascript
        // rita mun som ett streck
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.65)
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.65)
        ctx.stroke()
```

Detta ger spelaren ett enkelt ansikte med ögon och mun, vilket gör den mer levande och karaktärsfull.

## Uppgifter

### Glad och ledsen mun

Hur kan vi göra spelarens mun mer uttrycksfull? Experimentera med ritmetoderna för att göra munnen glad eller ledsen. Testa att styra det med inputs, eller varför inte göra spelaren ledsen när den inte rör sig?

## Uppgifter

### Glad och ledsen mun

Hur kan vi göra spelarens mun mer uttrycksfull? Experimentera med ritmetoderna för att göra munnen glad eller ledsen. Testa att styra det med inputs, eller varför inte göra spelaren ledsen när den inte rör sig?

### Animationer

Kan du göra spelaren mer levande genom att lägga till animationer? Till exempel att ögonen blinkar, munnen rör sig, eller att spelaren "hoppar" när den rör sig snabbt?

### Accelererande rörelse

Istället för att spelaren direkt får full hastighet när en tangent trycks ned, försök implementera mjuk acceleration och inbromsning. Detta ger en mer realistisk känsla.

Utgå då från att du har en `acceleration`-egenskap och en `friction`-egenskap i konstruktorn, och uppdatera hastigheten i `update`-metoden baserat på dessa. Det vill säga att innan du nått maxhastigheten så ökar du hastigheten med `acceleration` varje frame när en tangent är nedtryckt. När ingen tangent är nedtryckt så minskar du hastigheten med `friction` tills den når 0.

## Sammanfattning

I den här filen har vi skapat en `Player`-klass som hanterar spelarens rörelse och rendering. Vi har använt `InputHandler` för att läsa av tangentbordsinput och uppdaterat spelarens position baserat på detta.

Vi har även gett spelaren ett enkelt ansikte med ögon som tittar i rörelseriktningen för att göra den mer karaktärsfull. Du har nu en grund för att skapa ett spel där spelaren kan röra sig runt på canvasen.

### Testfrågor

1. Varför hanterar vi X- och Y-rörelsen i separata if-satser istället för att använda `else if`?
2. Hur används `directionX` och `directionY` för att få ögonen att "titta" åt rätt håll?
3. Varför multiplicerar vi position med `deltaTime` i update-metoden?
4. Hur fungerar det när vi stoppar spelaren från att gå utanför canvasens gränser?
5. Varför separerar vi position från velocity? Hur underlättar detta för kollisionsdetektering i nästa steg?
6. Vad händer om `deltaTime` varierar mycket mellan frames? Varför är detta ett problem för framtida physics?
7. Varför tänker vi på spelaren som en rektangel? Hur skulle du beskriva spelarens 'hitbox'?
8. Vilka problem ser du med nuvarande kodstruktur när vi ska lägga till kollision med plattformar?

## Nästa steg

För att lära dig om kollisionsdetektering och hur spelaren kan interagera med andra objekt, byt till `02-collision` branchen.

```bash
git checkout 02-collision
```

Öppna sedan [Steg 2 - Collision](02-collision.md).
