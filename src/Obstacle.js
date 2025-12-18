import GameObject from './GameObject.js'
import Vector2 from './Vector2.js'

import rockHeadIdle from './assets/Pixel Adventure 1/Traps/Rock Head/Idle.png'
import sawSprite from './assets/Pixel Adventure 1/Traps/Saw/On (38x38).png'

export default class Obstacle extends GameObject {
    constructor(game, x, y, width, height, type = 'rock') {
        super(game, x, y, width, height)
        this.type = type // 'rock', 'saw'
        this.speed = 0.3 // Hastighet mot vänster (pixels per ms)
        
        // Ladda sprites baserat på typ
        if (type === 'rock') {
            this.loadSprite('idle', rockHeadIdle, 1)
            this.setAnimation('idle')
        } else if (type === 'saw') {
            this.loadSprite('spin', sawSprite, 8, 100)
            this.setAnimation('spin')
        }
    }
    
    update(deltaTime) {
        // Uppdatera animation
        this.updateAnimation(deltaTime)
        
        // Flytta hindret mot vänster
        this.position.x -= this.speed * deltaTime
        
        // Ta bort när utanför skärmen
        if (this.position.x + this.width < 0) {
            this.markedForDeletion = true
        }
    }
    
    draw(ctx, camera = null) {
        // Försök rita sprite först
        const spriteDrawn = this.drawSprite(ctx, camera)
        
        // Om sprite inte ritades, rita fallback
        if (!spriteDrawn) {
            const screenX = camera ? this.position.x - camera.position.x : this.position.x
            const screenY = camera ? this.position.y - camera.position.y : this.position.y
            
            ctx.fillStyle = this.type === 'saw' ? '#888' : '#555'
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
    }
}
