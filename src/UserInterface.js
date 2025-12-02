export default class UserInterface {
    constructor(game) {
        this.game = game
        this.fontSize = 24
        this.fontFamily = 'Arial'
        this.textColor = '#FFFFFF'
        this.shadowColor = '#000000'
    }

    draw(ctx) {
        // Rita HUD (score, health, etc)
        this.drawHUD(ctx)
        
        // Rita game state overlays
        if (this.game.gameState === 'GAME_OVER') {
            this.drawGameOver(ctx)
        } else if (this.game.gameState === 'WIN') {
            this.drawWin(ctx)
        }
    }
    
    drawHUD(ctx) {
        ctx.save()
        
        // Konfigurera text
        ctx.font = `${this.fontSize}px ${this.fontFamily}`
        ctx.fillStyle = this.textColor
        ctx.shadowColor = this.shadowColor
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.shadowBlur = 3
        
        // Rita score
        const scoreText = `Score: ${this.game.score}`
        ctx.fillText(scoreText, 20, 40)
        
        // Rita coins collected
        const coinsText = `Coins: ${this.game.coinsCollected}`
        ctx.fillText(coinsText, 20, 70)
        
        // Rita health
        const healthText = `Health: ${this.game.player.health}/${this.game.player.maxHealth}`
        ctx.fillText(healthText, 20, 100)
        
        // Rita health bars som hjärtan
        for (let i = 0; i < this.game.player.maxHealth; i++) {
            const heartX = 20 + i * 30
            const heartY = 110
            
            if (i < this.game.player.health) {
                // Fyllt hjärta
                ctx.fillStyle = '#FF0000'
            } else {
                // Tomt hjärta
                ctx.fillStyle = '#333333'
            }
            
            // Rita enkelt hjärta (rektangel för enkelhetens skull)
            ctx.fillRect(heartX, heartY, 20, 20)
        }
        
        ctx.restore()
    }
    
    drawGameOver(ctx) {
        // Halvgenomskinlig bakgrund
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, this.game.width, this.game.height)
        
        // Game Over text
        ctx.save()
        ctx.fillStyle = '#FF0000'
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('GAME OVER', this.game.width / 2, this.game.height / 2 - 50)
        
        // Score
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '30px Arial'
        ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, this.game.height / 2 + 20)
        ctx.fillText(`Coins: ${this.game.coinsCollected}/${this.game.totalCoins}`, this.game.width / 2, this.game.height / 2 + 60)
        
        // Restart instruktion
        ctx.font = '24px Arial'
        ctx.fillText('Press R to Restart', this.game.width / 2, this.game.height / 2 + 120)
        ctx.restore()
    }
    
    drawWin(ctx) {
        // Halvgenomskinlig bakgrund
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
        ctx.fillRect(0, 0, this.game.width, this.game.height)
        
        // Victory text
        ctx.save()
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('VICTORY!', this.game.width / 2, this.game.height / 2 - 50)
        
        // Score
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '30px Arial'
        ctx.fillText(`All Coins Collected!`, this.game.width / 2, this.game.height / 2 + 20)
        ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, this.game.height / 2 + 60)
        
        // Restart instruktion
        ctx.font = '24px Arial'
        ctx.fillText('Press R to Play Again', this.game.width / 2, this.game.height / 2 + 120)
        ctx.restore()
    }
}
