import GameObject from './GameObject.js'
import Sprite from './Sprite.js'

export default class Platform extends GameObject {
    constructor(game, x, y, width, height, options = {}) {
        super(game, x, y, width, height)
        
        // Options
        this.color = options.color || '#8B4513' // Fallback color
        
        // Create sprite if sprite config is provided
        if (options.sprite) {
            this.sprite = new Sprite(options.sprite)
        }
    }

    update(deltaTime) {
        // Plattformar är statiska, gör inget
    }

    draw(ctx, camera = null) {
        // Beräkna screen position (om camera finns)
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Try to draw sprite first if available
        if (this.sprite && this.sprite.draw(ctx, screenX, screenY, this.width, this.height)) {
            // Sprite drawn successfully
            return
        }
        
        // Fallback: Rita färgad rektangel (om sprite laddas eller saknas)
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
        
        // Rita en enkel kant/skugga för att ge djup
        ctx.strokeStyle = '#654321'
        ctx.lineWidth = 2
        ctx.strokeRect(screenX, screenY, this.width, this.height)
    }
}
