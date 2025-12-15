import Platform from '../Platform.js'

/**
 * Arena för twinstick shooter
 * Skapar en arena med väggar runt kanterna och några hinder i mitten
 */
export default class TwinstickArena {
    constructor(game) {
        this.game = game
        this.tileSize = 64
        
        // Arena data
        this.walls = []
        this.floor = []
        
        // Spawn position för spelaren (mitt i arenan)
        this.playerSpawnX = game.worldWidth / 2
        this.playerSpawnY = game.worldHeight / 2
        
        // Skapa arena
        this.init()
    }

    init() {
        this.createFloor()
        this.createWalls()
    }

    createFloor() {
        // Skapa golv-tiles för visuell feedback
        const tilesX = Math.ceil(this.game.worldWidth / this.tileSize)
        const tilesY = Math.ceil(this.game.worldHeight / this.tileSize)
        
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                // Alternerande färg för checkerboard-mönster
                const isLight = (x + y) % 2 === 0
                const color = isLight ? '#2a2a2a' : '#222222'
                
                this.floor.push({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize,
                    color: color
                })
            }
        }
    }

    createWalls() {
        const wallThickness = this.tileSize
        const worldWidth = this.game.worldWidth
        const worldHeight = this.game.worldHeight
        
        // Väggar runt hela arenan (grå)
        const wallColor = '#666666'
        
        // Topp vägg
        this.walls.push(new Platform(this.game, 0, 0, worldWidth, wallThickness, wallColor))
        
        // Botten vägg
        this.walls.push(new Platform(this.game, 0, worldHeight - wallThickness, worldWidth, wallThickness, wallColor))
        
        // Vänster vägg
        this.walls.push(new Platform(this.game, 0, 0, wallThickness, worldHeight, wallColor))
        
        // Höger vägg
        this.walls.push(new Platform(this.game, worldWidth - wallThickness, 0, wallThickness, worldHeight, wallColor))
        
        // Två block i diagonal för visuell feedback när man rör sig
        const blockSize = this.tileSize * 2 // 128x128
        const blockColor = '#555555'
        
        // Block 1 - övre vänster kvadrant
        this.walls.push(new Platform(
            this.game,
            worldWidth / 3 - blockSize / 2,
            worldHeight / 3 - blockSize / 2,
            blockSize,
            blockSize,
            blockColor
        ))
        
        // Block 2 - nedre höger kvadrant (diagonal)
        this.walls.push(new Platform(
            this.game,
            (worldWidth * 2) / 3 - blockSize / 2,
            (worldHeight * 2) / 3 - blockSize / 2,
            blockSize,
            blockSize,
            blockColor
        ))
    }

    update(deltaTime) {
        // Arenan är statisk, ingen update behövs
    }

    draw(ctx, camera) {
        // Rita golvet först
        this.floor.forEach(tile => {
            const screenX = camera ? tile.x - camera.x : tile.x
            const screenY = camera ? tile.y - camera.y : tile.y
            
            // Endast rita tiles som är synliga
            if (camera && !camera.isVisible(tile)) {
                return
            }
            
            ctx.fillStyle = tile.color
            ctx.fillRect(screenX, screenY, tile.width, tile.height)
        })
        
        // Rita väggarna
        this.walls.forEach(wall => {
            wall.draw(ctx, camera)
        })
    }

    getData() {
        return {
            walls: this.walls,
            playerSpawnX: this.playerSpawnX,
            playerSpawnY: this.playerSpawnY
        }
    }
}
