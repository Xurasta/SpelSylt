/**
 * QuizDialog - Modal dialog för att visa quiz-frågor
 * 
 * Visar quiz-frågor med multipla alternativ mellan tower defense waves.
 * Ger spelaren gold för rätt svar som kan användas för att köpa torn.
 * 
 * HTML/CSS Version - Använder DOM manipulation istället för canvas rendering
 */

// Import CSS (Vite hanterar detta)
import "../styles/ui.css"

export default class QuizDialog {
    /**
     * @param {Object} game - Game instance
     * @param {Array} questions - Array av question objects från JSON
     * @param {Function} onComplete - Callback när quiz är färdigt (får totalGold som parameter)
     */
    constructor(game, questions, onComplete) {
        this.game = game
        this.questions = questions
        this.currentQuestionIndex = 0
        this.onComplete = onComplete
        
        // State
        this.selectedAnswer = 0
        this.hasAnswered = false
        this.isCorrect = false
        this.totalGold = 0
        
        // Input tracking (för att förhindra key repeat)
        this.lastKeys = new Set()
        
        // Skapa dialog DOM dynamiskt
        this.createDialogElements()
        
        // Render first question
        this.renderQuestion()
    }
    
    /**
     * Skapa dialog från HTML template
     */
    createDialogElements() {
        // Hämta template från DOM
        const template = document.getElementById("quiz-dialog-template")
        
        // Klona template innehåll
        const clone = template.content.cloneNode(true)
        
        // Hämta referenser till element från klonad template
        this.overlayEl = clone.querySelector("#quiz-dialog-overlay")
        this.dialogEl = clone.querySelector("#quiz-dialog")
        this.titleEl = clone.querySelector("#quiz-title")
        this.questionEl = clone.querySelector("#quiz-question")
        this.optionsEl = clone.querySelector("#quiz-options")
        this.resultEl = clone.querySelector("#quiz-result")
        this.resultTextEl = clone.querySelector("#result-text")
        this.resultExplanationEl = clone.querySelector("#result-explanation")
        this.resultRewardEl = clone.querySelector("#result-reward")
        this.continueButtonEl = clone.querySelector(".continue-button")
        
        // Lägg till event listener för continue knapp
        this.continueButtonEl.addEventListener("click", () => {
            this.nextQuestion()
        })
        
        // Lägg till i body
        document.body.appendChild(this.overlayEl)
    }
    
    /**
     * Hämta current question
     */
    get currentQuestion() {
        return this.questions[this.currentQuestionIndex]
    }
    
    /**
     * Render current question till DOM
     */
    renderQuestion() {
        const question = this.currentQuestion
        
        // Update title with progress
        this.titleEl.textContent = `Question ${this.currentQuestionIndex + 1}/${this.questions.length}`
        
        // Update question text
        this.questionEl.textContent = question.question
        
        // Clear previous options
        this.optionsEl.innerHTML = ""
        
        // Create option buttons
        question.options.forEach((option, index) => {
            const li = document.createElement("li")
            const button = document.createElement("button")
            button.classList.add("quiz-option", "button")
            button.dataset.index = index
            
            const letter = String.fromCharCode(65 + index) // A, B, C, D
            button.innerHTML = `<span class="option-label">[${letter}]</span> ${option}`
            
            // Mouse click handler
            button.addEventListener("click", () => {
                if (!this.hasAnswered) {
                    this.submitAnswer(index)
                }
            })
            
            // Mouse hover handler
            button.addEventListener("mouseenter", () => {
                if (!this.hasAnswered) {
                    this.selectOption(index)
                }
            })
            li.appendChild(button)
            this.optionsEl.appendChild(li)
        })
        
        // Select first option by default
        this.selectOption(0)
        
        // Hide result och rensa CSS-klasser från förra frågan
        this.resultEl.classList.add("hidden")
        this.resultEl.classList.remove("correct", "incorrect")
        this.resultTextEl.classList.remove("correct", "incorrect")
    }
    
    /**
     * Select ett alternativ (visuell feedback)
     * @param {number} index - Index för alternativet
     */
    selectOption(index) {
        this.selectedAnswer = index
        
        // Remove selected class from all options
        const buttons = this.optionsEl.querySelectorAll("#quiz-options button")
        buttons.forEach(btn => btn.classList.remove("selected"))
        
        // Add selected class to chosen option
        buttons[index].classList.add("selected")
    }
    
    /**
     * Update quiz state och input handling
     * @param {number} deltaTime - Tid sedan förra frame
     */
    update(deltaTime) {
        const keys = this.game.inputHandler.keys
        
        // Om vi har svarat, vänta på Enter för nästa fråga
        if (this.hasAnswered) {
            if (keys.has("Enter") && !this.lastKeys.has("Enter")) {
                this.nextQuestion()
            }
            this.lastKeys = new Set(keys)
            return
        }
        
        // Navigation med arrow keys
        if (keys.has("ArrowDown") && !this.lastKeys.has("ArrowDown")) {
            this.selectOption((this.selectedAnswer + 1) % this.currentQuestion.options.length)
        }
        if (keys.has("ArrowUp") && !this.lastKeys.has("ArrowUp")) {
            this.selectOption((this.selectedAnswer - 1 + this.currentQuestion.options.length) % this.currentQuestion.options.length)
        }
        
        // Submit svar med Enter
        if (keys.has("Enter") && !this.lastKeys.has("Enter")) {
            this.submitAnswer(this.selectedAnswer)
        }
        
        // Quick-select med A-D keys
        const quickKeys = ["a", "b", "c", "d"]
        quickKeys.forEach((key, index) => {
            if (keys.has(key) && !this.lastKeys.has(key) && index < this.currentQuestion.options.length) {
                this.submitAnswer(index)
            }
        })
        
        // Uppdatera lastKeys för nästa frame
        this.lastKeys = new Set(keys)
    }
    
    /**
     * Submit svar och kolla om det är rätt
     * @param {number} answerIndex - Index för valt svar
     */
    submitAnswer(answerIndex) {
        this.hasAnswered = true
        this.selectedAnswer = answerIndex
        this.isCorrect = answerIndex === this.currentQuestion.correctIndex
        
        // Visa resultat i DOM
        this.showResult()
        
        if (this.isCorrect) {
            this.totalGold += this.currentQuestion.reward
            
            // Emit event för rätt svar
            this.game.events.emit("quizCorrect", {
                question: this.currentQuestion,
                reward: this.currentQuestion.reward
            })
        } else {
            // Emit event för fel svar
            this.game.events.emit("quizIncorrect", {
                question: this.currentQuestion
            })
        }
    }
    
    /**
     * Visa resultat i DOM (rätt/fel, förklaring, reward)
     */
    showResult() {
        const question = this.currentQuestion
        const buttons = this.optionsEl.querySelectorAll(".quiz-option")
        
        // Mark correct and incorrect options
        buttons.forEach((btn, index) => {
            btn.disabled = true
            btn.classList.remove("selected")
            
            if (index === question.correctIndex) {
                btn.classList.add("correct")
            } else if (index === this.selectedAnswer && !this.isCorrect) {
                btn.classList.add("incorrect")
            }
        })
        
        // Show result container
        this.resultEl.classList.remove("hidden")
        
        // Update result styling
        if (this.isCorrect) {
            this.resultEl.classList.add("correct")
            this.resultTextEl.classList.add("correct")
            this.resultTextEl.textContent = "✓ CORRECT!"
            this.resultRewardEl.textContent = `+${question.reward} gold`
        } else {
            this.resultEl.classList.add("incorrect")
            this.resultTextEl.classList.add("incorrect")
            this.resultTextEl.textContent = "✗ INCORRECT"
            this.resultRewardEl.textContent = ""
        }
        
        // Show explanation
        this.resultExplanationEl.textContent = question.explanation
    }
    
    /**
     * Gå till nästa fråga eller avsluta quiz
     */
    nextQuestion() {
        this.currentQuestionIndex++
        
        if (this.currentQuestionIndex >= this.questions.length) {
            // Quiz färdigt - dölj dialog och anropa callback
            this.hide()
            this.onComplete(this.totalGold)
        } else {
            // Reset state för nästa fråga
            this.hasAnswered = false
            this.selectedAnswer = 0
            this.renderQuestion()
        }
    }
    
    /**
     * Dölj quiz dialog
     */
    hide() {
        this.overlayEl.classList.add("hidden")
    }
    
    /**
     * Visa quiz dialog (om man vill återanvända)
     */
    show() {
        this.overlayEl.classList.remove("hidden")
    }
    
    /**
     * Ta bort dialog från DOM (cleanup)
     */
    destroy() {
        if (this.overlayEl && this.overlayEl.parentNode) {
            this.overlayEl.parentNode.removeChild(this.overlayEl)
        }
    }
}
