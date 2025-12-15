import GameObject from '../GameObject.js'

export default class Paddle extends GameObject {
    constructor(game, x, y, width, height, upKey, downKey) {
        super(game, x, y, width, height)
        this.upKey = upKey
        this.downKey = downKey
        this.speed = 0.4  // pixels per millisekund
        this.color = '#fff'
    }
    
    update(deltaTime) {
        // Rörelse baserad på tangenter
        if (this.game.inputHandler.keys.has(this.upKey)) {
            this.y -= this.speed * deltaTime
        }
        if (this.game.inputHandler.keys.has(this.downKey)) {
            this.y += this.speed * deltaTime
        }
        
        // Begränsa till canvas
        if (this.y < 0) this.y = 0
        if (this.y + this.height > this.game.height) {
            this.y = this.game.height - this.height
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}
