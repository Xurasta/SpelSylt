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
        ctx.fillText(`Score: ${this.game.score}`, 20, 40)
        
        // Rita time played
        const minutes = Math.floor(this.game.playTime / 60000)
        const seconds = Math.floor((this.game.playTime % 60000) / 1000)
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
        ctx.fillText(`Time: ${timeString}`, 20, 70)
        
        ctx.restore()
        
        // Rita health bar (egen metod)
        this.drawHealthBar(ctx, 20, 90)
        
        // Rita heat bar
        this.drawHeatBar(ctx, 20, 115)
    }
    
    drawHealthBar(ctx, x, y) {
        const barWidth = 200
        const barHeight = 20
        const healthPercent = this.game.player.health / this.game.player.maxHealth
        
        ctx.save()
        
        // Bakgrund (grå)
        ctx.fillStyle = '#333'
        ctx.fillRect(x, y, barWidth, barHeight)
        
        // Nuvarande health (röd till grön gradient, or cyan if shield active)
        const healthWidth = barWidth * healthPercent
        
        // Färg baserat på shield eller health procent
        if (this.game.player.shield) {
            ctx.fillStyle = '#00FFFF' // Cyan when shield active
        } else if (healthPercent > 0.5) {
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
    
    drawHeatBar(ctx, x, y) {
        const barWidth = 200
        const barHeight = 15
        const player = this.game.player
        
        ctx.save()
        
        // Background (dark gray)
        ctx.fillStyle = '#222'
        ctx.fillRect(x, y, barWidth, barHeight)
        
        // If overheated, show cooldown timer instead
        if (player.overheated) {
            // Flash red background
            const flash = Math.floor(player.overheatTimer / 200) % 2
            if (flash === 0) {
                ctx.fillStyle = '#FF0000'
                ctx.fillRect(x, y, barWidth, barHeight)
            }
            
            // Show cooldown progress
            const cooldownPercent = player.overheatTimer / player.overheatCooldownTime
            ctx.fillStyle = '#666'
            ctx.fillRect(x, y, barWidth * cooldownPercent, barHeight)
        } else {
            // Normal heat bar
            const heatPercent = player.heat / player.maxHeat
            const heatWidth = barWidth * heatPercent
            
            // Color based on heat level
            if (heatPercent < 0.5) {
                ctx.fillStyle = '#FFA500' // Orange
            } else if (heatPercent < 0.8) {
                ctx.fillStyle = '#FF6600' // Dark orange
            } else {
                ctx.fillStyle = '#FF0000' // Red - about to overheat!
            }
            
            ctx.fillRect(x, y, heatWidth, barHeight)
        }
        
        // Border
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, barWidth, barHeight)
        
        // Label
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '12px Arial'
        const label = player.overheated ? 'OVERHEATED!' : 'HEAT'
        ctx.fillText(label, x + barWidth + 10, y + barHeight - 2)
        
        ctx.restore()
    }
}
