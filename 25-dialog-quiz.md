# Branch 25: Quiz Dialog System

## Översikt

I detta steg lägger vi till ett **quiz-system** mellan Tower Defense waves. Spelaren får svara på frågor om kod och spelmekanik, och tjänar gold för rätt svar. Detta visar hur man skapar **modal dialogs** och **JSON-driven content**.

### Varför Quiz System?

**Pedagogiska fördelar:**
- **Gamification av lärande** - Spelaren lär sig genom att spela
- **Immediate feedback** - Förklaring visas direkt efter svar
- **Progression** - Svårare frågor högre waves
- **Motivation** - Gold reward → köp torn → strategiskt bättre

**Tekniska koncept:**
- **Modal dialogs** - UI som blockerar spelet temporärt
- **JSON-driven content** - Lätt att lägga till nya frågor
- **State management** - QUIZ state parallellt med PLAYING
- **Text rendering** - Wrapping och formatting

## Arkitektur

### Komponenter

**QuizDialog** - Visar quiz och hanterar input
- Rendererar fråga + alternativ
- Hanterar keyboard navigation (↑↓ eller A-D)
- Visar resultat och förklaring
- Räknar total gold earned

**QuizManager** - Hanterar frågor
- Laddar JSON-fil med frågor
- Väljer random frågor per difficulty
- Trackar redan ställda frågor (undviker repetition)

**questions.json** - Frågebank
- Strukturerad data med categories
- Varje fråga har: question, options, correctIndex, explanation, reward, difficulty

### Flöde

```
Wave Complete → Wait 2s → startQuiz()
  ↓
gameState = 'QUIZ' (pausar spelet)
  ↓
QuizManager väljer 3 random frågor (based on difficulty)
  ↓
QuizDialog visar fråga 1/3
  ↓
Spelare svarar → Visa resultat + förklaring
  ↓
Enter → Nästa fråga (2/3, 3/3)
  ↓
Quiz färdigt → onComplete(totalGold)
  ↓
game.gold += totalGold
gameState = 'PLAYING'
  ↓
Wait 2s → startWave()
```

## JSON Struktur

**questions.json:**
```json
{
  "branch24-components": [
    {
      "id": "comp-01",
      "question": "Vad är den största fördelen med Component System över arv?",
      "options": [
        "Det är enklare att skriva",
        "Man kan kombinera behaviors fritt",
        "Det går snabbare att köra",
        "Det använder mindre minne"
      ],
      "correctIndex": 1,
      "explanation": "Komponenter kan kombineras fritt (t.ex. Ice + Splash tower)...",
      "reward": 50,
      "difficulty": "easy"
    }
  ],
  "tower-defense-basics": [...],
  "game-architecture": [...],
  "javascript-concepts": [...]
}
```

**Fält-förklaring:**
- `id` - Unikt ID för att tracka asked questions
- `question` - Själva frågan (wrappas om den är lång)
- `options` - Array med 4 alternativ
- `correctIndex` - Index för rätt svar (0-3)
- `explanation` - Förklaring som visas efter svar
- `reward` - Gold för rätt svar (30-100 beroende på difficulty)
- `difficulty` - 'easy', 'medium', eller 'hard'

## QuizDialog Implementation

Se [src/quiz/QuizDialog.js](src/quiz/QuizDialog.js) för full kod.

### Viktiga koncept

**1. Input Handling - Dubbla alternativ**
```javascript
// Arrow keys för navigation
if (keys.has('ArrowDown') && !this.lastKeys.has('ArrowDown')) {
    this.selectedAnswer = (this.selectedAnswer + 1) % options.length
}

// ELLER quick-select med A-D
['a', 'b', 'c', 'd'].forEach((key, index) => {
    if (keys.has(key) && !this.lastKeys.has(key)) {
        this.submitAnswer(index)
    }
})
```
**Varför båda?**
- Arrow keys: Familjärt från menus, "säkrare" (måste Enter för submit)
- A-D: Snabbare för erfarna spelare
- Flexibilitet = bättre UX

**2. State Management - hasAnswered**
```javascript
if (this.hasAnswered) {
    // Visa resultat + förklaring
    // Vänta på Enter för nästa
} else {
    // Visa alternativ som selectable
    // Lyssna på input
}
```
Enkel boolean men kraftfull - ändrar helt vad som visas och vilka inputs som lyssnas på.

**3. Text Wrapping - drawWrappedText()**

Se kod i QuizDialog.js för implementationen. Detta löser problemet att frågor och förklaringar kan vara för långa för en rad.

**Algoritm:**
1. Dela text i ord (`split(' ')`)
2. Testa att lägga till ord till current line
3. Om `ctx.measureText()` visar för brett → rita current line, börja ny
4. Fortsätt tills alla ord är ritade

**Varför behövs detta?**
Canvas har inget inbyggt text wrapping. Du måste implementera det själv för längre texter.

## QuizManager Implementation

Se [src/quiz/QuizManager.js](src/quiz/QuizManager.js) för full kod.

### Viktiga koncept

**1. Async Loading - loadQuestions()**
```javascript
async loadQuestions(jsonPath) {
    const response = await fetch(jsonPath)
    const data = await response.json()
    
    // Flatten categories till en array
    Object.values(data).forEach(categoryQuestions => {
        this.questions.push(...categoryQuestions)
    })
}
```
**async/await** behövs för fetch. Vi väntar på att JSON laddas innan vi använder den.

**Spread operator** (`...categoryQuestions`) pushar alla items från category-array till main array.

**2. Random Selection med Filter**
```javascript
getRandomQuestions(count, difficulty = null) {
    // 1. Filtrera bort redan ställda
    let available = this.questions.filter(q => !this.questionsAsked.has(q.id))
    
    // 2. Filtrera på difficulty
    if (difficulty) {
        available = available.filter(q => q.difficulty === difficulty)
    }
    
    // 3. Om inte tillräckligt, reset questionsAsked
    if (available.length < count) {
        this.questionsAsked.clear()
        available = this.questions  // Börja om
    }
    
    // 4. Shuffle och ta count antal
    const shuffled = available.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, count)
    
    // 5. Markera som asked
    selected.forEach(q => this.questionsAsked.add(q.id))
    
    return selected
}
```

**Set för tracking:**
`questionsAsked` är en `Set()` som håller redan ställda question IDs. Set är perfekt för "finns X i listan?" checks (`has()` är O(1)).

**Shuffle trick:**
`.sort(() => Math.random() - 0.5)` returnerar random -1, 0, eller 1 vilket shufflar arrayen. Inte perfekt random men enkelt och fungerar bra för vårt use case.

## Integration i TowerDefenseGame

Se uppdateringar i [src/TowerDefenseGame.js](src/TowerDefenseGame.js).

### Constructor
```javascript
// Quiz system
this.quizManager = new QuizManager(this)
this.quizManager.loadQuestions('./data/questions.json')
this.currentQuiz = null
```

### startQuiz() - Ny metod
```javascript
startQuiz() {
    this.gameState = 'QUIZ'  // Pausa spelet
    
    // Bestäm difficulty (wave 1-2: easy, 3-5: medium, 6+: hard)
    let difficulty = this.wave > 5 ? 'hard' : this.wave > 2 ? 'medium' : 'easy'
    
    const questions = this.quizManager.getRandomQuestions(3, difficulty)
    
    this.currentQuiz = new QuizDialog(this, questions, (totalGold) => {
        // Callback när quiz färdigt
        this.gold += totalGold
        this.gameState = 'PLAYING'
        this.currentQuiz = null
        setTimeout(() => this.startWave(), 2000)
    })
}
```

**Callback pattern:**
QuizDialog tar `onComplete` callback som anropas med `totalGold`. Detta separerar quiz-logik från game-logik.

### update() - Kolla QUIZ state
```javascript
update(deltaTime) {
    // Om quiz aktivt, uppdatera bara quiz
    if (this.gameState === 'QUIZ' && this.currentQuiz) {
        this.currentQuiz.update(deltaTime)
        return  // Exit early - spelet pausas
    }
    
    // ... normal game update ...
}
```

### draw() - Rita quiz överst
```javascript
draw(ctx) {
    // ... normal game rendering ...
    
    // Rita quiz överst (overlay)
    if (this.gameState === 'QUIZ' && this.currentQuiz) {
        this.currentQuiz.draw(ctx)
    }
}
```

**Varför rita spelet under?**
Spelaren ser fortfarande spelvärlden "paused" under quiz-dialogen. Detta ger kontext och ser bättre ut än blank screen.

## Difficulty Progression

**Wave 1-2:** easy (50 gold reward)
- Grundläggande frågor om torn och gameplay
- 4 alternativ, relativt tydliga svar

**Wave 3-5:** medium (75 gold reward)
- Lite djupare frågor om komponenter och arkitektur
- Kräver förståelse, inte bara memorering

**Wave 6+:** hard (100 gold reward)
- Avancerade koncept (FSM, events, deltaTime)
- Kräver reflektion och problemlösning

## Lärdomar och Design Decisions

### Varför inte göra quiz optional?

**Pro skip:**
- Spelaren kanske bara vill spela TD
- Kan kännas forced

**Contra skip:**
- Förlorar pedagogiskt syfte
- Gold balans blir knepig (hur mycket utan quiz?)

**Lösning:** Quiz är obligatorisk MEN:
- Endast 3 frågor per wave (går snabbt)
- Ingen stressig timer
- Ger värdefull reward (motivation)

### Varför JSON istället för hårdkodade frågor?

**JSON-fördelar:**
- **Separation of concerns** - Content != Code
- **Enkelt att lägga till frågor** - Lärare kan editera utan kod
- **Kategorisering** - Frågor per topic
- **Portabilitet** - Samma format för andra spel

**Nackdel:**
- Måste fetch async (men det är bra att lära sig!)

### Varför Set() för questionsAsked?

**Set vs Array:**
```javascript
// Array - O(n) lookup
questionsAsked.includes(q.id)  // Slow

// Set - O(1) lookup
questionsAsked.has(q.id)  // Fast
```
Set är optimerad för "finns X?" checks. När vi har 20 frågor spelar det ingen roll, men bra att lära sig rätt datastruktur.

## Uppgifter

### 1. Lägg till fler frågor

Skapa 5 nya frågor i `questions.json` om:
- Vector2 operations
- Grid coordinates
- Event-driven design
- deltaTime och frame-rate independence

**Tips:** Kolla befintliga frågor för format och difficulty examples.

### 2. Skapa streak bonus

Modifiera `QuizDialog` för att ge extra gold om spelaren får alla 3 rätt:

```javascript
// I onComplete callback
if (correctCount === 3) {
    const bonus = 50
    this.gold += bonus
    console.log(`Perfect score! Bonus: ${bonus}G`)
}
```

### 3. Visual improvements

Lägg till:
- Fade-in animation när quiz öppnas
- Sound effects för correct/incorrect (använd 14-audio branchen)
- Particle effect vid rätt svar

### 4. Svårighetsgrad anpassning

Låt spelaren välja svårighetsgrad i början:
- Easy mode: Alla frågor easy, mer gold från waves
- Normal mode: Nuvarande system
- Hard mode: Alla frågor hard, mindre gold från waves

## Testfrågor

1. Varför använder vi `this.lastKeys` i QuizDialog? Vad händer om vi tar bort den?
2. Förklara flödet från `checkWaveComplete()` till när nästa wave startar (inkl. quiz).
3. Hur fungerar `drawWrappedText()`? Varför kan vi inte bara använda `ctx.fillText()` direkt?
4. Vad är skillnaden mellan `Array.filter()` och `Array.forEach()`? När använder vi vilken?
5. Varför är `loadQuestions()` async? Vad händer om vi tar bort `async/await`?
6. Hur skulle du lägga till ett hint-system där spelaren kan få en ledtråd för 10 gold?
7. Vad är `correctIndex` för? Varför sparar vi index istället för själva svaret?
8. Hur kan du använda samma QuizDialog i andra speltyper (platformer, space shooter)?

## Sammanfattning

Vi har implementerat ett komplett quiz-system som:
- ✅ Laddar frågor från JSON
- ✅ Väljer random frågor med difficulty filtering
- ✅ Visar interaktiv dialog med keyboard navigation
- ✅ Ger feedback och förklaring
- ✅ Belönar rätt svar med gold
- ✅ Integrerar sömlöst i game loop (QUIZ state)

Detta system är **återanvändbart** - samma QuizDialog kan användas i vilken speltyp som helst för att gamifiera lärande.

## Nästa steg

Möjliga vidareutvecklingar:
- **Branch 26:** FSM för Enemy AI (använd quiz för att förklara states)
- **Branch 27:** A* Pathfinding (quiz om algoritmer)
- **Leaderboard:** Spara high scores per correct answers
- **Multiplayer quiz:** Två spelare svarar samtidigt, först till rätt svar vinner
