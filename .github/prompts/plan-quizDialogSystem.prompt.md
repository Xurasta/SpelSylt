# Plan: Quiz Dialog System för Tower Defense

## TL;DR
Skapa ett **QuizDialog-system** som kombinerar menysystemets struktur med dialog-funktionalitet. Mellan waves pausas spelet, spelaren svarar på pedagogiska frågor om kod/tower defense, och får gold för rätt svar. JSON-baserad frågebank gör det enkelt att lägga till nya frågor.

## Återanvänd vs Nytt System?

**Rekommendation: Hybrid-approach** 
- **Återanvänd** Menu.js som bas (input handling, navigation, draw structure)
- **Skapa nytt** QuizDialog.js (specifik logik för frågor/svar)
- **Återanvänd** event-systemet (game.events.emit('waveComplete'))

**Varför hybrid?**
- ✅ Menu.js har bra input handling (arrows, enter, keys)
- ✅ Liknande visuell struktur (titel, options, selection)
- ⚠️ Men quiz har speciell logik (rätt/fel svar, belöningar, resultat)
- ⚠️ Dialog är modal (blockerar spelet) men inte en fullständig meny

## Arkitektur

**Flöde:**
```
Wave Complete → QuizDialog öppnas (gameState = 'QUIZ')
  ↓
Visa fråga + 4 alternativ (A, B, C, D)
  ↓
Spelare väljer svar (arrow keys + enter ELLER tangent A-D)
  ↓
Visa resultat: Rätt → +gold | Fel → förklaring
  ↓
Nästa fråga (3 frågor per wave) ELLER Tillbaka till spel
  ↓
gameState = 'PLAYING' → Nästa wave startar
```

**Komponenter:**

1. **QuizDialog.js** - Dialog-klass som visar quiz
2. **QuizQuestion.js** - Data-klass för en fråga
3. **questions.json** - Frågebank (JSON)
4. **QuizManager.js** - Hanterar frågeval, progress, scoring

## Struktur

### questions.json:
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
      "explanation": "Komponenter kan kombineras fritt (t.ex. Ice + Splash tower), medan arv kräver nya klasser för varje kombination.",
      "reward": 50,
      "difficulty": "easy"
    },
    {
      "id": "comp-02",
      "question": "Hur får en komponent tillgång till sitt torn?",
      "options": [
        "Genom global variabel",
        "Genom this.tower referens",
        "Genom att anropa getTower()",
        "Genom game.towers array"
      ],
      "correctIndex": 1,
      "explanation": "I konstruktorn sparas 'this.tower = tower', vilket ger komponenten direkt tillgång.",
      "reward": 50,
      "difficulty": "medium"
    }
  ],
  "tower-defense": [
    {
      "id": "td-01",
      "question": "Vilket torn har splash damage?",
      "options": [
        "Cannon Tower",
        "Ice Tower",
        "Splash Tower",
        "Poison Tower"
      ],
      "correctIndex": 2,
      "explanation": "Splash Tower har SplashComponent som skadar alla fiender i en radie.",
      "reward": 30,
      "difficulty": "easy"
    }
  ]
}
```

### QuizDialog.js:
```javascript
export default class QuizDialog {
    constructor(game, questions, onComplete) {
        this.game = game
        this.questions = questions  // Array av QuizQuestion
        this.currentQuestionIndex = 0
        this.onComplete = onComplete
        
        // State
        this.selectedAnswer = 0
        this.hasAnswered = false
        this.isCorrect = false
        this.totalGold = 0
        
        // Visual
        this.backgroundColor = 'rgba(0, 0, 0, 0.9)'
        this.correctColor = '#4CAF50'
        this.incorrectColor = '#F44336'
        this.neutralColor = '#FFFFFF'
        
        // Input tracking
        this.lastKeys = new Set()
    }
    
    get currentQuestion() {
        return this.questions[this.currentQuestionIndex]
    }
    
    update(deltaTime) {
        const keys = this.game.inputHandler.keys
        
        // Om vi har svarat, vänta på Enter för nästa
        if (this.hasAnswered) {
            if (keys.has('Enter') && !this.lastKeys.has('Enter')) {
                this.nextQuestion()
            }
            this.lastKeys = new Set(keys)
            return
        }
        
        // Navigation
        if (keys.has('ArrowDown') && !this.lastKeys.has('ArrowDown')) {
            this.selectedAnswer = (this.selectedAnswer + 1) % this.currentQuestion.options.length
        }
        if (keys.has('ArrowUp') && !this.lastKeys.has('ArrowUp')) {
            this.selectedAnswer = (this.selectedAnswer - 1 + this.currentQuestion.options.length) % this.currentQuestion.options.length
        }
        
        // Svar med Enter eller A-D keys
        if (keys.has('Enter') && !this.lastKeys.has('Enter')) {
            this.submitAnswer(this.selectedAnswer)
        }
        
        // Quick-select med A-D
        ['a', 'b', 'c', 'd'].forEach((key, index) => {
            if (keys.has(key) && !this.lastKeys.has(key) && index < this.currentQuestion.options.length) {
                this.submitAnswer(index)
            }
        })
        
        this.lastKeys = new Set(keys)
    }
    
    submitAnswer(answerIndex) {
        this.hasAnswered = true
        this.isCorrect = answerIndex === this.currentQuestion.correctIndex
        
        if (this.isCorrect) {
            this.totalGold += this.currentQuestion.reward
            this.game.events.emit('quizCorrect', {
                question: this.currentQuestion,
                reward: this.currentQuestion.reward
            })
        } else {
            this.game.events.emit('quizIncorrect', {
                question: this.currentQuestion
            })
        }
    }
    
    nextQuestion() {
        this.currentQuestionIndex++
        
        if (this.currentQuestionIndex >= this.questions.length) {
            // Quiz färdigt
            this.onComplete(this.totalGold)
        } else {
            // Reset för nästa fråga
            this.hasAnswered = false
            this.selectedAnswer = 0
        }
    }
    
    draw(ctx) {
        // Bakgrund
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0, 0, this.game.width, this.game.height)
        
        ctx.save()
        
        const question = this.currentQuestion
        
        // Progress
        ctx.fillStyle = '#888888'
        ctx.font = '20px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`Question ${this.currentQuestionIndex + 1}/${this.questions.length}`, this.game.width / 2, 40)
        
        // Fråga
        ctx.fillStyle = this.neutralColor
        ctx.font = 'bold 24px Arial'
        this.drawWrappedText(ctx, question.question, this.game.width / 2, 100, 700, 30)
        
        // Alternativ
        const startY = 200
        const lineHeight = 60
        
        question.options.forEach((option, index) => {
            const y = startY + index * lineHeight
            const letter = String.fromCharCode(65 + index) // A, B, C, D
            
            // Färg baserat på state
            let color = this.neutralColor
            if (this.hasAnswered) {
                if (index === question.correctIndex) {
                    color = this.correctColor  // Rätt svar
                } else if (index === this.selectedAnswer && !this.isCorrect) {
                    color = this.incorrectColor  // Fel valt svar
                }
            } else if (index === this.selectedAnswer) {
                color = '#FFD700'  // Selected
            }
            
            ctx.fillStyle = color
            ctx.font = '20px Arial'
            ctx.fillText(`[${letter}] ${option}`, this.game.width / 2, y)
        })
        
        // Om svarat, visa förklaring och reward
        if (this.hasAnswered) {
            const resultY = startY + question.options.length * lineHeight + 40
            
            // Resultat
            ctx.font = 'bold 28px Arial'
            ctx.fillStyle = this.isCorrect ? this.correctColor : this.incorrectColor
            ctx.fillText(this.isCorrect ? '✓ CORRECT!' : '✗ INCORRECT', this.game.width / 2, resultY)
            
            // Reward (om rätt)
            if (this.isCorrect) {
                ctx.font = '24px Arial'
                ctx.fillStyle = '#FFD700'
                ctx.fillText(`+${question.reward} gold`, this.game.width / 2, resultY + 40)
            }
            
            // Förklaring
            ctx.font = '18px Arial'
            ctx.fillStyle = '#CCCCCC'
            this.drawWrappedText(ctx, question.explanation, this.game.width / 2, resultY + 80, 700, 24)
            
            // Instruktion
            ctx.font = '20px Arial'
            ctx.fillStyle = '#888888'
            const instructionText = this.currentQuestionIndex < this.questions.length - 1 
                ? 'Press Enter for next question' 
                : 'Press Enter to continue'
            ctx.fillText(instructionText, this.game.width / 2, this.game.height - 40)
        } else {
            // Instruktioner
            ctx.fillStyle = '#888888'
            ctx.font = '18px Arial'
            ctx.fillText('Use Arrow Keys or A-D to select, Enter to submit', this.game.width / 2, this.game.height - 40)
        }
        
        // Total gold earned
        ctx.fillStyle = '#FFD700'
        ctx.font = '20px Arial'
        ctx.textAlign = 'right'
        ctx.fillText(`Total Earned: ${this.totalGold} gold`, this.game.width - 20, 40)
        
        ctx.restore()
    }
    
    // Helper för att wrappa lång text
    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ')
        let line = ''
        let currentY = y
        
        words.forEach(word => {
            const testLine = line + word + ' '
            const metrics = ctx.measureText(testLine)
            
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, x, currentY)
                line = word + ' '
                currentY += lineHeight
            } else {
                line = testLine
            }
        })
        
        ctx.fillText(line, x, currentY)
    }
}
```

### QuizManager.js:
```javascript
export default class QuizManager {
    constructor(game) {
        this.game = game
        this.questions = []
        this.questionsAsked = new Set()  // Track vilket questions.id som redan ställts
    }
    
    async loadQuestions(jsonPath) {
        const response = await fetch(jsonPath)
        const data = await response.json()
        
        // Flatten alla categories till en array
        Object.values(data).forEach(categoryQuestions => {
            this.questions.push(...categoryQuestions)
        })
    }
    
    getRandomQuestions(count, difficulty = null) {
        // Filtrera bort redan ställda frågor
        let available = this.questions.filter(q => !this.questionsAsked.has(q.id))
        
        // Filtrera på difficulty om specified
        if (difficulty) {
            available = available.filter(q => q.difficulty === difficulty)
        }
        
        // Om inte tillräckligt, reset asked
        if (available.length < count) {
            this.questionsAsked.clear()
            available = this.questions
        }
        
        // Shuffle och ta count antal
        const shuffled = available.sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, count)
        
        // Markera som asked
        selected.forEach(q => this.questionsAsked.add(q.id))
        
        return selected
    }
}
```

## Integration i TowerDefenseGame

**I TowerDefenseGame.js:**
```javascript
import QuizDialog from './quiz/QuizDialog.js'
import QuizManager from './quiz/QuizManager.js'

constructor(canvas) {
    super(canvas)
    // ... existing code ...
    
    // Quiz system
    this.quizManager = new QuizManager(this)
    this.quizManager.loadQuestions('./data/questions.json')
    this.currentQuiz = null
    
    // Listen to wave complete
    this.events.on('waveComplete', () => {
        this.startQuiz()
    })
}

startQuiz() {
    // Pausa spelet
    this.gameState = 'QUIZ'
    
    // Hämta 3 random frågor (svårare per wave)
    const difficulty = this.wave <= 2 ? 'easy' : this.wave <= 5 ? 'medium' : 'hard'
    const questions = this.quizManager.getRandomQuestions(3, difficulty)
    
    // Skapa quiz dialog
    this.currentQuiz = new QuizDialog(this, questions, (totalGold) => {
        // Quiz färdigt - ge gold och fortsätt
        this.gold += totalGold
        this.gameState = 'PLAYING'
        this.currentQuiz = null
        
        // Starta nästa wave efter kort delay
        setTimeout(() => this.startWave(), 2000)
    })
}

update(deltaTime) {
    // Quiz mode
    if (this.gameState === 'QUIZ' && this.currentQuiz) {
        this.currentQuiz.update(deltaTime)
        return
    }
    
    // ... existing update code ...
}

draw(ctx) {
    // ... existing draw code ...
    
    // Rita quiz överst
    if (this.gameState === 'QUIZ' && this.currentQuiz) {
        this.currentQuiz.draw(ctx)
    }
}
```

## Fördelar med detta system

✅ **Återanvänder Menu-patterns** - Input handling, navigation, visual structure
✅ **Event-driven** - game.events för koppla ihop systems
✅ **JSON-baserat** - Enkelt att lägga till frågor utan kod-ändringar
✅ **Pedagogiskt värdefullt** - Elever lär sig både genom att spela OCH svara
✅ **Modularitet** - QuizManager kan användas i andra speltyper
✅ **Progressivt** - Svårare frågor högre waves
✅ **Belöningssystem** - Gold för rätt svar → köp torn → bättre strategi

## Filstruktur

```
src/
  quiz/
    QuizDialog.js
    QuizManager.js
  TowerDefenseGame.js (updated)
  
data/
  questions.json
```

## Nästa steg efter implementation

**Branch 25: Quiz Dialog System**
1. Skapa QuizDialog.js och QuizManager.js
2. Skapa questions.json med 15-20 frågor
3. Integrera i TowerDefenseGame.js
4. Testa quiz-flow mellan waves
5. Dokumentera i 25-quiz-dialog.md

**Pedagogiskt värde:**
- JSON data structures
- Event-driven design
- Modal dialogs / overlays
- Text wrapping algorithm
- Quiz game mechanics
- Gamification av learning

## Designbeslut att fundera på

1. **Hur många frågor per wave?**
   - 3 frågor = lagom, inte för långt avbrott

2. **Ska fel svar ge något?**
   - Nuvarande: Inget gold för fel svar
   
3. **Ska det gå att skippa quiz?**
   - Kompromiss: Skip ger inget gold

4. **Vilken svårighetsgrad-progression?**
   - Wave 1-2: easy (50 gold)
   - Wave 3-5: medium (75 gold)
   - Wave 6+: hard (100 gold)

5. **Ska tidigare waves kunna repeatas för gold-farming?**
   - Pro: Spelaren kan grinda om de behöver pengar
   - Kompromiss: Minskad reward för repeated questions

6. **Quiz timing:**
   - Nuvarande: Efter varje wave
   - Rekommendation: Efter varje wave (tydlig break point)
