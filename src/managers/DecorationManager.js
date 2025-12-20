import SpriteManager from '../SpriteManager.js'
import CloudDecoration from '../CloudDecoration.js'
import TreeDecoration from '../TreeDecoration.js'
import Decoration from '../Decoration.js'
import { structures, decorations } from '../assets.js'

/**
 * DecorationManager - Manages all decorative elements
 * 
 * Responsibilities:
 * - Setup clouds, trees, castle, and static decorations
 * - Update animated decorations (clouds, trees)
 * - Draw decorations in proper layers
 * - Avoid path when placing decorations
 */
export default class DecorationManager {
    constructor(game, grid, pathCoords = null) {
        this.game = game
        this.grid = grid
        this.pathCoords = pathCoords
        
        // Decoration arrays
        this.clouds = []
        this.trees = []
        this.staticDecorations = []
        this.castle = null
        
        // Setup all decorations
        this.setupCastle()
        this.setupClouds()
        this.setupTrees()
        this.setupStaticDecorations()
    }
    
    /**
     * Setup castle at path end
     */
    setupCastle() {
        const pathCoords = this.pathCoords || this.grid.path
        if (!pathCoords || pathCoords.length === 0) {
            console.warn('No path defined for castle placement')
            return
        }
        
        const lastPoint = pathCoords[pathCoords.length - 1]
        const worldPos = this.grid.getWorldPosition(lastPoint.row, lastPoint.col)
        
        // Castle is 320x256, center on endpoint
        this.castle = {
            x: worldPos.x - 160,  // Center horizontally (320/2)
            y: worldPos.y - 200,  // Place above path
            image: structures.castle,
            width: 320,
            height: 256
        }
    }
    
    /**
     * Setup cloud decorations
     */
    setupClouds() {
        const cloudCount = 5
        const cloudVariants = decorations.clouds
        
        for (let i = 0; i < cloudCount; i++) {
            // Random cloud variant
            const cloudImage = cloudVariants[Math.floor(Math.random() * cloudVariants.length)]
            
            // Random position
            const x = Math.random() * this.game.width
            const y = Math.random() * (this.game.height * 0.4) // Upper 40%
            
            // Random scale for depth effect (0.5-1.0)
            const scale = 0.5 + Math.random() * 0.5
            
            // Base speed with parallax (20-40 px/s)
            const baseSpeed = 20 + Math.random() * 20
            
            this.clouds.push(new CloudDecoration(cloudImage, x, y, scale, baseSpeed))
        }
    }
    
    /**
     * Setup tree decorations (avoid path)
     */
    setupTrees() {
        const treeCount = 10
        const treeWidth = 64
        const treeHeight = Math.round(64 * (256 / 192))  // Maintain aspect ratio: 85
        
        for (let i = 0; i < treeCount; i++) {
            let row, col
            let attempts = 0
            
            // Find valid position (not on path)
            do {
                row = Math.floor(Math.random() * this.grid.rows)
                col = Math.floor(Math.random() * this.grid.cols)
                attempts++
            } while (this.grid.isPath(row, col) && attempts < 50)
            
            if (attempts < 50) {
                const worldPos = this.grid.getWorldPosition(row, col)
                // Random tree variant
                const treeImage = decorations.trees[Math.floor(Math.random() * decorations.trees.length)]
                
                // Position tree on tile (anchor at bottom)
                const x = worldPos.x
                const y = worldPos.y + this.grid.tileSize - treeHeight
                
                this.trees.push(new TreeDecoration(treeImage, x, y, treeWidth, treeHeight))
            }
        }
    }
    
    /**
     * Setup static decorations (rocks, bushes)
     */
    setupStaticDecorations() {
        const decoCount = 15
        const allDecorations = [
            ...(decorations.rocks || []),
            ...(decorations.bushes || [])
        ]
        
        for (let i = 0; i < decoCount; i++) {
            let row, col
            let attempts = 0
            
            // Find valid position (not on path)
            do {
                row = Math.floor(Math.random() * this.grid.rows)
                col = Math.floor(Math.random() * this.grid.cols)
                attempts++
            } while (this.grid.isPath(row, col) && attempts < 50)
            
            if (attempts < 50) {
                const worldPos = this.grid.getWorldPosition(row, col)
                // Random decoration
                const decoImage = allDecorations[Math.floor(Math.random() * allDecorations.length)]
                
                this.staticDecorations.push(new Decoration(decoImage, worldPos.x, worldPos.y, 64, 64))
            }
        }
    }
    
    /**
     * Update animated decorations
     */
    update(deltaTime) {
        // Update clouds
        this.clouds.forEach(cloud => cloud.update(deltaTime, this.game.width))
        
        // Update tree animations
        this.trees.forEach(tree => tree.update(deltaTime))
        
        // Static decorations don't need updating
    }
    
    /**
     * Draw castle (background layer)
     */
    drawCastle(ctx, camera) {
        if (!this.castle) return
        
        const img = SpriteManager.getImage(this.castle.image)
        if (!img || !img.complete) return
        
        const offsetX = camera ? camera.position.x : 0
        const offsetY = camera ? camera.position.y : 0
        
        ctx.drawImage(
            img,
            this.castle.x - offsetX,
            this.castle.y - offsetY,
            this.castle.width / 1.5,
            this.castle.height / 1.5
        )
    }
    
    /**
     * Draw tree and static decorations
     */
    drawDecorations(ctx, camera) {
        // Draw static decorations first
        this.staticDecorations.forEach(deco => {
            const img = SpriteManager.getImage(deco.image)
            if (!img || !img.complete) return
            deco.draw(ctx, img, camera)
        })
        
        // Draw trees
        this.trees.forEach(tree => {
            const img = SpriteManager.getImage(tree.image)
            if (!img || !img.complete) return
            tree.draw(ctx, img, camera)
        })
    }
    
    /**
     * Draw clouds (top layer)
     */
    drawClouds(ctx) {
        this.clouds.forEach(cloud => {
            const img = SpriteManager.getImage(cloud.image)
            cloud.draw(ctx, img)
        })
    }
    
    /**
     * Reset decorations
     */
    reset() {
        this.clouds = []
        this.trees = []
        this.staticDecorations = []
        this.castle = null
        
        // Re-setup
        this.setupCastle()
        this.setupClouds()
        this.setupTrees()
        this.setupStaticDecorations()
    }
}
