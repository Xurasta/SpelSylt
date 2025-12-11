/**
 * HiScoreManager - Hanterar high scores med localStorage
 * Sparar top 3 scores med score, tid och datum
 */
export default class HiScoreManager {
    constructor(storageKey = 'space-shooter-hiscores') {
        this.storageKey = storageKey
        this.maxScores = 3
    }
    
    /**
     * Sparar en ny score om den är bland top 3
     * @param {number} score - Spelarens poäng
     * @param {number} playTime - Tid spelad i millisekunder
     * @returns {boolean} True om scoren sparades (var top 3)
     */
    saveScore(score, playTime) {
        const scores = this.getTopScores()
        
        // Skapa ny score entry
        const newScore = {
            score: score,
            time: playTime,
            date: new Date().toISOString()
        }
        
        // Lägg till och sortera (högsta först)
        scores.push(newScore)
        scores.sort((a, b) => {
            // Sortera först på score
            if (b.score !== a.score) {
                return b.score - a.score
            }
            // Om samma score, sortera på tid (snabbast först)
            return a.time - b.time
        })
        
        // Behåll bara top 3
        const topScores = scores.slice(0, this.maxScores)
        
        // Spara till localStorage
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(topScores))
            // Returnera true om den nya scoren kom med i top 3
            return topScores.some(s => 
                s.score === newScore.score && 
                s.time === newScore.time && 
                s.date === newScore.date
            )
        } catch (error) {
            console.error('Failed to save high score:', error)
            return false
        }
    }
    
    /**
     * Hämtar top scores från localStorage
     * @returns {Array} Array med score objects {score, time, date}
     */
    getTopScores() {
        try {
            const stored = localStorage.getItem(this.storageKey)
            if (!stored) return []
            
            const scores = JSON.parse(stored)
            // Validera att det är en array
            return Array.isArray(scores) ? scores : []
        } catch (error) {
            console.error('Failed to load high scores:', error)
            return []
        }
    }
    
    /**
     * Rensar alla sparade scores
     */
    clearScores() {
        try {
            localStorage.removeItem(this.storageKey)
            return true
        } catch (error) {
            console.error('Failed to clear high scores:', error)
            return false
        }
    }
    
    /**
     * Kollar om en score kvalificerar för top 3
     * @param {number} score - Poäng att kolla
     * @returns {boolean} True om scoren är bland top 3
     */
    isHighScore(score) {
        const scores = this.getTopScores()
        if (scores.length < this.maxScores) return true
        
        const lowestTopScore = scores[scores.length - 1].score
        return score > lowestTopScore
    }
    
    /**
     * Formaterar tid från millisekunder till MM:SS
     * @param {number} ms - Millisekunder
     * @returns {string} Formaterad tid
     */
    static formatTime(ms) {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    
    /**
     * Formaterar datum till läsbar sträng
     * @param {string} isoDate - ISO datum string
     * @returns {string} Formaterat datum
     */
    static formatDate(isoDate) {
        const date = new Date(isoDate)
        return date.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }
}
