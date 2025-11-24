import GameObject from './GameObject.js'

export default class Rectangle extends GameObject {
    constructor(game, x, y, width, height, color = 'green') {
        super(game, x, y, width, height)
        this.color = color

        // Hastighet i x och y riktning
        this.vx = 0
        this.vy = 0
        
        // Studs-faktor (1.0 = perfekt studs, 0.8 = tappar energi)
        this.bounce = 1.0
    }

    update(deltaTime) {
        // Flytta baserat på hastighet
        this.x += this.vx * deltaTime
        this.y += this.vy * deltaTime

        // Studsa mot väggarna
        if (this.x < 0 || this.x + this.width > this.game.width) {
            this.vx = -this.vx * this.bounce  // Byt X-riktning
        }
        if (this.y < 0 || this.y + this.height > this.game.height) {
            this.vy = -this.vy * this.bounce  // Byt Y-riktning
        }
    }

    draw(ctx) {
        // Rita rektangeln
        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}