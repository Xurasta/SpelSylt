import GameObject from '../GameObject.js'
import bulletsSprite from '../assets/Shootem Up/Bullets-0001.png'

export default class SpaceProjectile extends GameObject {
    constructor(game, x, y, width, height, velocityX, velocityY) {
        super(game, x, y, width, height)
        
        this.velocityX = velocityX
        this.velocityY = velocityY
        
        // Load bullet sprite sheet
        this.image = new Image()
        this.image.src = bulletsSprite
        this.imageLoaded = false
        
        this.image.onload = () => {
            this.imageLoaded = true
        }
        
        // Sprite sheet info (256x256, 4 per rad)
        // Rad 2 = gröna skott, andra i raden (3 projektiler, medium storlek)
        this.spriteWidth = 16 // 256 / 4
        this.spriteHeight = 32
        this.spriteX = 64 + 16 // Andra i raden (index 1)
        this.spriteY = 32 // Rad 2 (index 1)
        
        this.color = '#00ff00' // Grön laser (fallback)
    }
    
    update(deltaTime) {
        // Flytta projektilen
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Ta bort projektiler som lämnat skärmen
        if (this.y < -this.height || 
            this.y > this.game.height ||
            this.x < -this.width ||
            this.x > this.game.width) {
            this.markedForDeletion = true
        }
    }
    
    draw(ctx, camera) {
        // if (!this.imageLoaded) {
        //     // Fallback rectangle if image not loaded
        //     ctx.fillStyle = this.color
        //     ctx.fillRect(this.x, this.y, this.width, this.height)
        //     return
        // }
        
        // Rita bullet från sprite sheet
        ctx.drawImage(
            this.image,
            this.spriteX, this.spriteY, // Source position
            this.spriteWidth, this.spriteHeight, // Source size
            this.x - this.width, // Centrera (bullet sprite är större)
            this.y - this.height, 
            this.width * 3, // Gör den större för synlighet
            this.height * 3
        )
    }
}
