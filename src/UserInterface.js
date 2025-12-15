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

        // Top-left: Health hearts
        if (this.game.player) {
            // Rita health hearts (röda fyrkanter)
            this.drawHealthHearts(ctx, 20, 20)
        }
        
        // Top-right: Ammo display (twinstick)
        if (this.game.player && this.game.player.currentAmmo !== undefined) {
            this.drawAmmoBoxes(ctx, this.game.width - 20, 20)
        }
        
        // Om spelet har coins (platformer), visa dem
        if (this.game.coinsCollected !== undefined) {
            ctx.fillText(`Coins: ${this.game.coinsCollected}`, 20, 80)
        }

        // Bottom-right: Score
        ctx.textAlign = 'right'
        ctx.fillText(`Score: ${this.game.score}`, this.game.width - 20, this.game.height - 20)
        ctx.textAlign = 'left'

        ctx.restore()
        
        // Rita reload indicator ovanför spelaren (i world space)
        if (this.game.player && this.game.player.isReloading) {
            this.drawReloadIndicator(ctx)
        }
    }

    drawHealthHearts(ctx, x, y) {
        const heartSize = 24
        const heartSpacing = 4
        const totalHearts = this.game.player.maxHealth
        const currentHearts = this.game.player.health
        
        ctx.save()
        
        for (let i = 0; i < totalHearts; i++) {
            const heartX = x + i * (heartSize + heartSpacing)
            
            if (i < currentHearts) {
                // Full hälsa - röd fyrkant
                ctx.fillStyle = '#FF0000'
            } else {
                // Förlorad hälsa - mörk grå
                ctx.fillStyle = '#333333'
            }
            
            ctx.fillRect(heartX, y, heartSize, heartSize)
            
            // Vit kant
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 2
            ctx.strokeRect(heartX, y, heartSize, heartSize)
        }
        
        ctx.restore()
    }
    
    drawAmmoBoxes(ctx, x, y) {
        const boxSize = 16
        const boxSpacing = 4
        const maxDisplay = this.game.player.maxAmmo
        const totalAmmo = this.game.player.currentAmmo
        
        ctx.save()
        
        // Beräkna hur många rutor som ska visas
        const displayBoxes = Math.min(this.game.player.maxAmmo, maxDisplay)
        
        // Rita boxarna från höger till vänster
        for (let i = 0; i < displayBoxes; i++) {
            const boxX = x - (i + 1) * (boxSize + boxSpacing)
            
            if (i < totalAmmo) {
                // Ammo finns - gul box
                ctx.fillStyle = '#FFD700'
            } else {
                // Tom - mörk grå
                ctx.fillStyle = '#333333'
            }
            
            ctx.fillRect(boxX, y, boxSize, boxSize)
            
            // Vit kant
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 2
            ctx.strokeRect(boxX, y, boxSize, boxSize)
        }
        
        // Rita reserve ammo under boxarna
        const reserveY = y + boxSize * 2 + 8
        ctx.font = '18px Arial'
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'
        ctx.textAlign = 'right'
        ctx.shadowColor = '#000000'
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        ctx.shadowBlur = 2
        ctx.fillText(`+${this.game.player.reserveAmmo}`, x, reserveY)
        
        ctx.restore()
    }
    
    drawReloadIndicator(ctx) {
        // Rita ovanför spelaren i world space
        const player = this.game.player
        const camera = this.game.camera
        
        // Beräkna position ovanför spelaren
        const worldX = player.x + player.width / 2
        const worldY = player.y - 30
        const screenX = camera ? worldX - camera.x : worldX
        const screenY = camera ? worldY - camera.y : worldY
        
        ctx.save()
        
        // Reload progress bar
        const barWidth = 60
        const barHeight = 8
        const reloadPercent = 1 - (player.reloadTimer / player.reloadDuration)
        
        // Bakgrund
        ctx.fillStyle = '#333'
        ctx.fillRect(screenX - barWidth / 2, screenY, barWidth, barHeight)
        
        // Progress
        ctx.fillStyle = '#FFC107'
        ctx.fillRect(screenX - barWidth / 2, screenY, barWidth * reloadPercent, barHeight)
        
        // Kant
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 1
        ctx.strokeRect(screenX - barWidth / 2, screenY, barWidth, barHeight)
        
        // Text under progress bar
        ctx.font = '12px Arial'
        ctx.fillStyle = '#FFC107'
        ctx.textAlign = 'center'
        ctx.fillText('RELOADING', screenX, screenY + barHeight + 14)
        
        ctx.restore()
    }

    drawHealthBar(ctx, x, y) {
        const barWidth = 200
        const barHeight = 20
        const healthPercent = this.game.player.health / this.game.player.maxHealth

        ctx.save()

        // Bakgrund (grå)
        ctx.fillStyle = '#333'
        ctx.fillRect(x, y, barWidth, barHeight)

        // Nuvarande health (röd till grön gradient)
        const healthWidth = barWidth * healthPercent

        // Färg baserat på health procent
        if (healthPercent > 0.5) {
            ctx.fillStyle = '#4CAF50' // Grön
        } else if (healthPercent > 0.25) {
            ctx.fillStyle = '#FFC107' // Gul
        } else {
            ctx.fillStyle = '#F44336' // Röd
        }

        ctx.fillRect(x, y, healthWidth, barHeight)

        // Kant
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, barWidth, barHeight)

        ctx.restore()
    }
    // Obs: drawHealthBar() används fortfarande av platformer-spelet

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
