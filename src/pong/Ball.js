import Rectangle from '../Rectangle.js'

export default class Ball extends Rectangle {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height, '#fff')
        this.startX = x
        this.startY = y
        this.speed = 0.3
        this.bounce = 1.0  // Perfekt studs
        this.reset()
    }
    
    reset() {
        this.x = this.startX
        this.y = this.startY
        
        // Slumpmässig startriktning
        const angle = (Math.random() - 0.5) * Math.PI / 3  // ±30 grader
        const direction = Math.random() < 0.5 ? 1 : -1
        
        this.velocityX = Math.cos(angle) * this.speed * direction
        this.velocityY = Math.sin(angle) * this.speed
    }
    
    update(deltaTime) {
        // Flytta bollen
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Endast topp/botten studs (inte vänster/höger, det är mål)
        if (this.y < 0 || this.y + this.height > this.game.height) {
            this.velocityY = -this.velocityY * this.bounce
            // Fixa position
            if (this.y < 0) this.y = 0
            if (this.y + this.height > this.game.height) {
                this.y = this.game.height - this.height
            }
        }
    }
    
    bounceOffPaddle() {
        this.velocityX = -this.velocityX * 1.05  // Öka lite hastighet
    }
}
