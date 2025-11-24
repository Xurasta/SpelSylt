import GameObject from './GameObject.js'

export default class Rectangle extends GameObject {
    constructor(game, x, y, width, height, color = 'green') {
        super(game, x, y, width, height)
        this.color = color

        // hastighet
        this.vx = 0
        this.vy = 0
    }

    update(deltaTime) {
        // Uppdatera position baserat på hastighet
        this.x += this.vx * deltaTime
        this.y += this.vy * deltaTime

        // byt riktning om vi når kanvasens gränser
        if (this.x < 0 || this.x + this.width > this.game.width) {
            this.vx = -this.vx
        }
        if (this.y < 0 || this.y + this.height > this.game.height) {
            this.vy = -this.vy
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}