import GameObject from './GameObject.js'

export default class BackgroundObject extends GameObject {
    constructor(game, x, y, imagePath, options = {}) {
        // Tillfällig width/height, uppdateras när bilden laddas
        super(game, x, y, options.width || 64, options.height || 64)
        
        this.image = new Image()
        this.image.src = imagePath
        this.imageLoaded = false
        
        this.image.onload = () => {
            this.imageLoaded = true
            // Uppdatera width/height från bilden om inte satta
            if (!options.width) this.width = this.image.width
            if (!options.height) this.height = this.image.height
        }
        
        // Parallax scroll speed (0.0-1.0+)
        this.scrollSpeed = options.scrollSpeed !== undefined ? options.scrollSpeed : 0.5
        
        // Auto-movement velocity (pixels per millisekund)
        this.velocity = {
            x: options.velocity?.x || 0,
            y: options.velocity?.y || 0
        }
        
        // Wrapping - om objektet ska loopa runt världen
        this.wrapX = options.wrapX !== undefined ? options.wrapX : true
        this.wrapY = options.wrapY !== undefined ? options.wrapY : false
        
        // Scale (om vi vill göra molnen större/mindre)
        this.scale = options.scale || 1
    }
    
    update(deltaTime) {
        // Flytta objektet baserat på velocity
        this.x += this.velocity.x * deltaTime
        this.y += this.velocity.y * deltaTime
        
        // Wrap horizontellt - respawn från vänster när vi exit höger
        if (this.wrapX) {
            // När molnet helt exit höger på world size, respawn från vänster
            if (this.x > this.game.worldWidth) {
                this.x = -this.width * this.scale
            } else if (this.x < -this.width * this.scale) {
                this.x = this.game.worldWidth
            }
        }
        
        // Wrap vertikalt
        if (this.wrapY) {
            if (this.y > this.game.worldHeight) {
                this.y = -this.height * this.scale
            } else if (this.y < -this.height * this.scale) {
                this.y = this.game.worldHeight
            }
        }
    }
    
    draw(ctx, camera) {
        if (!this.imageLoaded) return
        
        // Beräkna parallax offset
        const parallaxX = camera.x * this.scrollSpeed
        const parallaxY = camera.y * this.scrollSpeed
        
        // Screen position med parallax
        const screenX = this.x - parallaxX
        const screenY = this.y - parallaxY
        
        // Rita bilden med scale
        ctx.drawImage(
            this.image,
            screenX,
            screenY,
            this.width * this.scale,
            this.height * this.scale
        )
    }
}
