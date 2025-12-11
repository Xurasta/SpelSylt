import Menu from './Menu.js'

export default class GameOverMenu extends Menu {
    constructor(game) {
        super(game)
    }
    
    getTitle() {
        return 'GAME OVER'
    }
    
    getOptions() {
        return [
            {
                text: 'Restart',
                key: 'r',
                action: () => {
                    this.game.restart()
                }
            },
            {
                text: 'Main Menu',
                key: 'Escape',
                action: () => {
                    // Använd callback till SpaceShooterGame för att skapa MainMenu
                    if (this.game.showMainMenu) {
                        this.game.showMainMenu()
                    }
                }
            }
        ]
    }
    
    draw(ctx) {
        // Halvgenomskinlig bakgrund
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
        ctx.fillRect(0, 0, this.game.width, this.game.height)
        
        // Game Over titel (röd)
        ctx.save()
        ctx.fillStyle = '#FF0000'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#000000'
        ctx.shadowOffsetX = 3
        ctx.shadowOffsetY = 3
        ctx.shadowBlur = 5
        ctx.fillText('GAME OVER', this.game.width / 2, 150)
        
        // Score och tid
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '24px Arial'
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.shadowBlur = 3
        
        ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, 220)
        
        const minutes = Math.floor(this.game.playTime / 60000)
        const seconds = Math.floor((this.game.playTime % 60000) / 1000)
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
        ctx.fillText(`Time: ${timeString}`, this.game.width / 2, 260)
        
        ctx.restore()
        
        // Rita options (använd parent draw för resten)
        this.drawOptions(ctx)
    }
    
    drawOptions(ctx) {
        ctx.save()
        ctx.textAlign = 'center'
        
        const startY = 350
        const spacing = 60
        
        this.options.forEach((option, index) => {
            const y = startY + index * spacing
            const isSelected = index === this.selectedIndex
            
            // Highlight selected option
            if (isSelected) {
                ctx.fillStyle = this.selectedColor
                ctx.font = 'bold 28px Arial'
            } else {
                ctx.fillStyle = this.optionColor
                ctx.font = '24px Arial'
            }
            
            // Rita option text
            let displayText = option.text
            if (option.key) {
                ctx.fillText(displayText, this.game.width / 2, y)
                
                // Rita key hint
                ctx.fillStyle = this.keyColor
                ctx.font = '18px Arial'
                ctx.fillText(`[${option.key.toUpperCase()}]`, this.game.width / 2, y + 25)
            } else {
                ctx.fillText(displayText, this.game.width / 2, y)
            }
        })
        
        ctx.restore()
    }
}
