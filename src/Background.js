export default class Background {
    constructor(game, imagePath, options = {}) {
        this.game = game
        this.image = new Image()
        this.image.src = imagePath
        this.imageLoaded = false
        
        this.image.onload = () => {
            this.imageLoaded = true
            // Om tile inte är satt, använd bildens storlek
            if (!options.tileWidth) {
                this.tileWidth = this.image.width
                this.tileHeight = this.image.height
            }
        }
        
        // Options med defaults
        this.tiled = options.tiled !== undefined ? options.tiled : true
        this.tileWidth = options.tileWidth || 64
        this.tileHeight = options.tileHeight || 64
        this.tileX = options.tileX !== undefined ? options.tileX : true // Tila på X-axeln?
        this.tileY = options.tileY !== undefined ? options.tileY : true // Tila på Y-axeln?
        this.scrollSpeed = options.scrollSpeed !== undefined ? options.scrollSpeed : 1.0
        this.yPosition = options.yPosition !== undefined ? options.yPosition : 0 // Vertikal position (0 = top)
        this.height = options.height || null // Höjd att rita (null = full height)
        
        // Auto-scroll velocity (för space shooter etc)
        this.autoScrollX = options.autoScrollX || 0 // Pixels per millisekund
        this.autoScrollY = options.autoScrollY || 0 // Pixels per millisekund
        
        // För parallax - spara offset
        this.offsetX = 0
        this.offsetY = 0
    }
    
    update(deltaTime) {
        // Auto-scroll (för space shooter etc)
        this.offsetX += this.autoScrollX * deltaTime
        this.offsetY += this.autoScrollY * deltaTime
    }
    
    draw(ctx, camera) {
        if (!this.imageLoaded) return
        
        // Beräkna parallax offset baserat på kamera och scroll speed
        // Plus auto-scroll offset
        const cameraOffsetX = camera.x * this.scrollSpeed
        const cameraOffsetY = camera.y * this.scrollSpeed
        
        // Kombinera camera parallax med auto-scroll
        this.offsetX += cameraOffsetX
        this.offsetY += cameraOffsetY
        
        if (this.tiled) {
            this.drawTiled(ctx, camera)
        } else {
            this.drawStretched(ctx, camera)
        }
        
        // Reset camera offsets (auto-scroll persists in update)
        this.offsetX -= cameraOffsetX
        this.offsetY -= cameraOffsetY
    }
    
    drawTiled(ctx, camera) {
        // Beräkna den vertikala positionen och höjden att rita
        const drawHeight = this.height !== null ? this.height : camera.height
        const drawY = this.yPosition
        
        // Wrap offsets to tile dimensions för seamless looping
        const wrappedOffsetX = ((this.offsetX % this.tileWidth) + this.tileWidth) % this.tileWidth
        const wrappedOffsetY = ((this.offsetY % this.tileHeight) + this.tileHeight) % this.tileHeight
        
        // Beräkna hur många tiles som behövs
        const numCols = this.tileX ? Math.ceil(camera.width / this.tileWidth) + 1 : 1
        const numRows = this.tileY ? Math.ceil(camera.height / this.tileHeight) + 1 : 1
        
        // Rita alla tiles
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                if (this.tileX && this.tileY) {
                    // Normalt tiling (både X och Y)
                    const x = Math.floor(col * this.tileWidth - wrappedOffsetX)
                    const y = Math.floor(row * this.tileHeight - wrappedOffsetY + drawY)
                    ctx.drawImage(this.image, x, y, this.tileWidth, this.tileHeight)
                } else if (!this.tileX && this.tileY) {
                    // Stretch X, tile Y (för space backgrounds)
                    // Behåll aspect ratio - använd original tileHeight
                    const x = 0
                    const y = Math.floor(row * this.tileHeight - wrappedOffsetY + drawY)
                    const width = camera.width
                    ctx.drawImage(this.image, x, y, width, this.tileHeight)
                } else if (this.tileX && !this.tileY) {
                    // Tile X, stretch Y (för horisontella lager)
                    const x = Math.floor(col * this.tileWidth - wrappedOffsetX)
                    const y = drawY
                    const height = drawHeight
                    ctx.drawImage(this.image, x, y, this.tileWidth, height)
                } else {
                    // Ingen tiling, bara stretch
                    ctx.drawImage(this.image, 0, drawY, camera.width, drawHeight)
                }
            }
        }
    }
    
    drawStretched(ctx, camera) {
        // Rita hela bilden stretched över hela världen
        ctx.drawImage(
            this.image,
            -this.offsetX,
            -this.offsetY,
            this.game.worldWidth,
            this.game.worldHeight
        )
    }
}
