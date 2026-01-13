import GameObject from '../GameObject.js'

/**
 * Exit object - trigger zone that player can walk through
 * Changes color when room is complete
 */
export default class Exit extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height)
        this.color = '#666666' // Gray when locked
        this.isUnlocked = false
    }
    
    unlock() {
        this.isUnlocked = true
        this.color = '#00ff00' // Green when unlocked
    }
    
    draw(ctx, camera = null) {
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Draw exit with pulsing effect when unlocked
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
        
        // Draw border
        ctx.strokeStyle = this.isUnlocked ? '#ffffff' : '#444444'
        ctx.lineWidth = 3
        ctx.strokeRect(screenX, screenY, this.width, this.height)
        
        // Draw arrow or text hint
        if (this.isUnlocked) {
            ctx.fillStyle = 'white'
            ctx.font = '16px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('EXIT', screenX + this.width / 2, screenY + this.height / 2 + 6)
            ctx.textAlign = 'left'
        }
    }
}
