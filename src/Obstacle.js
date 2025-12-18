import GameObject from './GameObject.js'
import Vector2 from './Vector2.js'

export default class Obstacle extends GameObject {
    constructor(game, x, y, width, height, type = 'cactus') {
        super(game, x, y, width, height)
        this.type = type // 'cactus', 'bird', 'rock'
        this.speed = 0.3 // Hastighet mot vänster (pixels per ms)
        
        // Visuella egenskaper
        this.color = type === 'bird' ? '#555' : '#2d5016'
    }
    
    update(deltaTime) {
        // Flytta hindret mot vänster
        this.position.x -= this.speed * deltaTime
        
        // Ta bort när utanför skärmen
        if (this.position.x + this.width < 0) {
            this.markedForDeletion = true
        }
    }
    
    draw(ctx, camera = null) {
        const screenX = camera ? this.position.x - camera.x : this.position.x
        const screenY = camera ? this.position.y - camera.y : this.position.y
        
        ctx.fillStyle = this.color
        
        if (this.type === 'cactus') {
            // Rita en enkel kaktus
            ctx.fillRect(screenX, screenY, this.width, this.height)
            
            // Grenar
            ctx.fillRect(screenX - 5, screenY + 10, 5, 15)
            ctx.fillRect(screenX + this.width, screenY + 10, 5, 15)
        } else if (this.type === 'bird') {
            // Rita en fågel (enkel V-form)
            ctx.beginPath()
            ctx.moveTo(screenX, screenY + this.height / 2)
            ctx.lineTo(screenX + this.width / 2, screenY)
            ctx.lineTo(screenX + this.width, screenY + this.height / 2)
            ctx.strokeStyle = this.color
            ctx.lineWidth = 3
            ctx.stroke()
        } else {
            // Rita en sten
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
    }
}
