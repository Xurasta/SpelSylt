import Menu from './Menu.js'
import HiScoreManager from '../HiScoreManager.js'

export default class HiScoreMenu extends Menu {
    constructor(game) {
        super(game)
        this.hiScoreManager = new HiScoreManager()
    }
    
    getTitle() {
        return 'High Scores'
    }
    
    getOptions() {
        return [
            {
                text: 'Main Menu',
                key: 'Escape',
                action: () => {
                    if (this.game.showMainMenu) {
                        this.game.showMainMenu()
                    }
                }
            },
            {
                text: 'Clear Scores',
                key: 'c',
                action: () => {
                    this.hiScoreManager.clearScores()
                }
            }
        ]
    }
    
    draw(ctx) {
        // Halvgenomskinlig bakgrund
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
        ctx.fillRect(0, 0, this.game.width, this.game.height)
        
        ctx.save()
        
        // Titel
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#000000'
        ctx.shadowOffsetX = 3
        ctx.shadowOffsetY = 3
        ctx.shadowBlur = 5
        ctx.fillText('HIGH SCORES', this.game.width / 2, 100)
        
        // Hämta top scores
        const scores = this.hiScoreManager.getTopScores()
        
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.shadowBlur = 3
        
        if (scores.length === 0) {
            // Inga scores än
            ctx.fillStyle = '#CCCCCC'
            ctx.font = '24px Arial'
            ctx.fillText('No high scores yet!', this.game.width / 2, 200)
            ctx.fillText('Play to set a record!', this.game.width / 2, 240)
        } else {
            // Rita top 3 scores
            const startY = 180
            const spacing = 80
            
            scores.forEach((scoreData, index) => {
                const y = startY + index * spacing
                
                // Rank färg (guld, silver, brons)
                const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']
                ctx.fillStyle = rankColors[index] || '#FFFFFF'
                
                // Rank nummer
                ctx.font = 'bold 36px Arial'
                ctx.fillText(`#${index + 1}`, this.game.width / 2 - 150, y)
                
                // Score
                ctx.fillStyle = '#FFFFFF'
                ctx.font = 'bold 28px Arial'
                ctx.textAlign = 'left'
                ctx.fillText(`${scoreData.score}`, this.game.width / 2 - 80, y)
                
                // Time
                ctx.font = '24px Arial'
                ctx.fillStyle = '#AAAAAA'
                const timeStr = HiScoreManager.formatTime(scoreData.time)
                ctx.fillText(`Time: ${timeStr}`, this.game.width / 2 - 80, y + 25)
                
                // Date
                ctx.font = '18px Arial'
                ctx.fillStyle = '#888888'
                const dateStr = HiScoreManager.formatDate(scoreData.date)
                ctx.fillText(dateStr, this.game.width / 2 - 80, y + 45)
                
                ctx.textAlign = 'center'
            })
        }
        
        ctx.restore()
        
        // Rita options
        this.drawOptions(ctx)
    }
    
    drawOptions(ctx) {
        ctx.save()
        ctx.textAlign = 'center'
        
        const startY = this.game.height - 120
        const spacing = 50
        
        this.options.forEach((option, index) => {
            const y = startY + index * spacing
            const isSelected = index === this.selectedIndex
            
            // Highlight selected option
            if (isSelected) {
                ctx.fillStyle = this.selectedColor
                ctx.font = 'bold 24px Arial'
            } else {
                ctx.fillStyle = this.optionColor
                ctx.font = '20px Arial'
            }
            
            ctx.shadowColor = '#000000'
            ctx.shadowOffsetX = 2
            ctx.shadowOffsetY = 2
            ctx.shadowBlur = 3
            
            // Rita option text med key hint
            const displayText = `${option.text} [${option.key.toUpperCase()}]`
            ctx.fillText(displayText, this.game.width / 2, y)
        })
        
        ctx.restore()
    }
}
