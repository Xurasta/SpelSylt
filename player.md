# Player

I den här delen så skapar vi en `Player`-klass som ärver från `GameObject`. Denna klass representerar spelaren i spelet och hanterar dess rörelse och rendering.

Klassen använder `InputHandler` för att läsa av tangentbordsinput och uppdatera spelarens position baserat på detta.

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

Inget jättekonstigt, vi sätter egenskaper för färg, hastighet och riktning. Men det är ett viktigt mönster för hur vi jobbar med klasserna för att skapa spelobjekt. Vi kan även sätta en standardfärg för spelaren här, i detta fall grön i konstruktorn.

## Uppdateringsmetod

I uppdateringsmetoden så händer det en hel del. Vi kollar vilka tangenter som är nedtryckta och uppdaterar spelarens hastighet och riktning baserat på detta. Utifrån det här sätter vi även en variabel för spelarens riktning. Det kan användas för bland annat att rita ut ögon som "tittar" i den riktningen spelaren rör sig, men det är även användbart för andra saker som animationer, attacker med mera.

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

Som du ser är hanteringen av input och rörelsen ganska likadan. Vi kollar om en viss tangent är nedtryckt, och om den är det så sätter vi hastigheten i den riktningen. Om ingen tangent är nedtryckt så sätter vi hastigheten till 0.

Fundera här varför vi hanterar rörelsen i två separata if-satser istället för att använda `else if` för både X- och Y-rörelsen.

Slutligen uppdaterar vi spelarens position baserat på hastigheten och `deltaTime`. Det är för att göra rörelsen framerate-oberoende.

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

I draw så ritar vi ut spelaren som en rektangel. Detta sker likadant som i `Rectangle`-klassen vi skapade tidigare. Men här så lägger vi även till ögon som "tittar" i den riktning spelaren rör sig. Detta för att ge spelaren karaktär.

För att flytta på ögonen så använder vi `directionX` och `directionY` som vi satte i `update`-metoden. Vi kan sedan påverka var vi ritar ut ögonen baserat på dessa värden.

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
5. Vilka Canvas-metoder används för att rita spelarens mun som ett streck?

## Nästa steg

För att lära dig om kollisionsdetektering och hur spelaren kan interagera med andra objekt, byt till `collision` branchen och se [collision.md](collision.md).

