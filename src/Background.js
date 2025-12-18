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
        this.tileX = options.tileX !== undefined ? options.tileX : true
        this.tileWidth = options.tileWidth || 64
        this.tileHeight = options.tileHeight || 64
        this.tileY = options.tileY !== undefined ? options.tileY : true // Tila på Y-axeln?
        this.scrollSpeed = options.scrollSpeed !== undefined ? options.scrollSpeed : 1.0
        this.yPosition = options.yPosition !== undefined ? options.yPosition : 0 // Vertikal position (0 = top)
        this.height = options.height || null // Höjd att rita (null = full height)
        
        // Auto-scroll (för space shooter, runner, etc.)
        this.autoScrollX = options.autoScrollX || 0 // pixels per ms
        this.autoScrollY = options.autoScrollY || 0
        
        // För parallax - spara offset
        this.offsetX = 0
        this.offsetY = 0
    }
    
    update(deltaTime) {
        // Auto-scroll - flytta offset baserat på auto-scroll hastighet
        if (this.autoScrollX !== 0) {
            this.offsetX += this.autoScrollX * deltaTime
        }
        if (this.autoScrollY !== 0) {
            this.offsetY += this.autoScrollY * deltaTime
        }
    }
    
    draw(ctx, camera) {
        if (!this.imageLoaded) return
        
        // Om vi inte har auto-scroll, använd kamera för parallax
        // Annars har update() redan satt offsetX/Y
        if (this.autoScrollX === 0) {
            this.offsetX = camera.position.x * this.scrollSpeed
        }
        if (this.autoScrollY === 0) {
            this.offsetY = camera.position.y * this.scrollSpeed
        }
        
        if (this.tiled) {
            this.drawTiled(ctx, camera)
        } else {
            this.drawStretched(ctx, camera)
        }
    }
    
    drawTiled(ctx, camera) {
        // Beräkna den vertikala positionen och höjden att rita
        const drawHeight = this.height !== null ? this.height : camera.height
        const drawY = this.yPosition
        
        // Beräkna vilka tiles som är synliga (baserat på parallax offset)
        const startCol = Math.floor(this.offsetX / this.tileWidth)
        const endCol = Math.ceil((this.offsetX + camera.width) / this.tileWidth)
        
        let startRow, endRow
        if (this.tileY) {
            startRow = Math.floor((this.offsetY + drawY) / this.tileHeight)
            endRow = Math.ceil((this.offsetY + drawY + drawHeight) / this.tileHeight)
        } else {
            // Rita bara en rad, positionerad vid drawY
            startRow = 0
            endRow = 0
        }
        
        // Rita alla synliga tiles
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const x = Math.floor(col * this.tileWidth - this.offsetX)
                const y = this.tileY ? Math.floor(row * this.tileHeight - this.offsetY) : drawY
                
                // Skippa tiles som är utanför vårt vertikala område
                if (y + this.tileHeight < drawY || y > drawY + drawHeight) continue
                
                ctx.drawImage(this.image, x, y, this.tileWidth, this.tileHeight)
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
