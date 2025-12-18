import GameObject from './GameObject.js'

export default class Platform extends GameObject {
    constructor(game, x, y, width, height, color = '#8B4513', spriteConfig = null) {
        super(game, x, y, width, height)
        
        this.color = color
        this.sprite = null
        this.spriteLoaded = false
        this.spriteConfig = null
        
        // Load sprite if config provided
        if (spriteConfig) {
            this.spriteConfig = spriteConfig
            this.sprite = new Image()
            this.sprite.src = spriteConfig.src
            this.sprite.onload = () => {
                this.spriteLoaded = true
            }
        }
    }

    update(deltaTime) {
        // Plattformar är statiska, gör inget
    }

    draw(ctx, camera = null) {
        // Beräkna screen position (om camera finns)
        const screenX = camera ? this.position.x - camera.position.x : this.position.x
        const screenY = camera ? this.position.y - camera.position.y : this.position.y
        
        if (this.sprite && this.spriteLoaded && this.spriteConfig) {
            // Rita tiled terrain using sprite config (horizontal only)
            const { sourceX, sourceY, width: tileWidth, height: tileHeight } = this.spriteConfig
            
            const numTiles = Math.ceil(this.width / tileWidth)
            
            for (let i = 0; i < numTiles; i++) {
                const destX = screenX + i * tileWidth
                const destY = screenY
                
                ctx.drawImage(
                    this.sprite,
                    sourceX, sourceY, tileWidth, tileHeight,
                    destX, destY, tileWidth, tileHeight
                )
            }
        } else {
            // Rita med färg som fallback
            ctx.fillStyle = this.color
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
    }
}
