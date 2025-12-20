import UserInterface from '../UserInterface.js'

/**
 * TowerDefenseUI - Handles all canvas-based UI rendering
 * 
 * Responsibilities:
 * - Draw HUD (gold, lives, score, wave)
 * - Draw loading screen
 * - Draw tower placement preview
 * - Listen to game events for UI updates
 * - Keep UI state separate from game logic
 */
export default class TowerDefenseUI extends UserInterface {
    constructor(game) {
        super(game)
        
        // UI state (updated via events)
        this.gold = 0
        this.lives = 0
        this.score = 0
        this.wave = 0
        this.selectedTowerName = ''
        this.selectedTowerCost = 0
        
        // Loading state
        this.loadingProgress = 0
        this.loadingTotal = 0
        
        // Setup event listeners
        this.setupEventListeners()
    }
    
    setupEventListeners() {
        // Listen to game events to update UI state
        this.game.events.on('goldChanged', (data) => {
            this.gold = data.gold
        })
        
        this.game.events.on('livesChanged', (data) => {
            this.lives = data.lives
        })
        
        this.game.events.on('scoreChanged', (data) => {
            this.score = data.score
        })
        
        this.game.events.on('waveStart', (data) => {
            this.wave = data.wave
        })
        
        this.game.events.on('towerSelected', (data) => {
            // Get tower type details from game
            const towerType = this.game.towerManager.getSelectedTowerType()
            this.selectedTowerName = towerType.name
            this.selectedTowerCost = towerType.cost
        })
        
        this.game.events.on('loadingProgress', (data) => {
            this.loadingProgress = data.loaded
            this.loadingTotal = data.total
        })
    }
    
    /**
     * Main draw method
     */
    draw(ctx) {
        // Draw different UI based on game state
        const gameState = this.game.stateManager ? this.game.stateManager.getState() : 'LOADING'
        
        if (gameState === 'LOADING') {
            this.drawLoadingScreen(ctx)
        } else if (gameState === 'PLAYING') {
            this.drawHUD(ctx)
        }
        // QUIZ, MENU, GAME_OVER handled by DOM or other systems
    }
    
    /**
     * Draw loading screen
     */
    drawLoadingScreen(ctx) {
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height)
        
        ctx.fillStyle = 'white'
        ctx.font = '32px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Loading assets...', this.game.canvas.width / 2, this.game.canvas.height / 2)
        
        if (this.loadingTotal > 0) {
            const progress = (this.loadingProgress / this.loadingTotal) * 100
            ctx.font = '20px Arial'
            ctx.fillText(`${Math.floor(progress)}%`, this.game.canvas.width / 2, this.game.canvas.height / 2 + 40)
        }
        
        ctx.textAlign = 'left' // Reset
    }
    
    /**
     * Draw HUD during gameplay
     */
    drawHUD(ctx) {
        ctx.save()
        
        ctx.fillStyle = 'white'
        ctx.font = '20px Arial'
        
        // Gold
        ctx.fillText(`Gold: ${this.gold}`, 10, 30)
        
        // Lives
        ctx.fillText(`Lives: ${this.lives}`, 10, 60)
        
        // Score
        ctx.fillText(`Score: ${this.score}`, 10, 90)
        
        // Wave
        ctx.fillText(`Wave: ${this.wave}`, 10, 120)
        
        // Selected tower
        ctx.fillText(`Tower: ${this.selectedTowerName}`, 10, 150)
        ctx.fillText(`Cost: ${this.selectedTowerCost}G`, 10, 180)
        
        ctx.restore()
    }
    
    /**
     * Draw tower placement preview at mouse position
     */
    drawPlacementPreview(ctx, mouseX, mouseY, grid, canAfford, camera) {
        if (!canAfford) return
        
        grid.drawHover(ctx, mouseX, mouseY, camera, canAfford)
    }
    
    /**
     * Update UI state (for future animations, etc.)
     */
    update(deltaTime) {
        // Future: UI animations, notifications, etc.
    }
}
