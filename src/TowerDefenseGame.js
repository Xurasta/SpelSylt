import GameBase from './GameBase.js'
import Grid from './Grid.js'
import Camera from './Camera.js'
import QuizDialog from './quiz/QuizDialog.js'
import QuizManager from './quiz/QuizManager.js'
import SpriteManager from './SpriteManager.js'
import { PRELOAD_ASSETS, ground } from './assets.js'
import WaveManager from './managers/WaveManager.js'
import TowerManager from './managers/TowerManager.js'
import DecorationManager from './managers/DecorationManager.js'
import ProjectileManager from './managers/ProjectileManager.js'
import TowerDefenseUI from './managers/TowerDefenseUI.js'
import GameStateManager from './managers/GameStateManager.js'

/**
 * TowerDefenseGame - Tower Defense game orchestrator
 * 
 * Refactored for separation of concerns:
 * - Uses manager pattern for different systems
 * - Event-driven architecture for decoupling
 * - Clean state management
 * - Focused on coordinating systems, not implementing everything
 */
export default class TowerDefenseGame extends GameBase {
    constructor(canvas) {
        super(canvas)

        // Asset loading state
        this.assetsLoaded = false

        // Preload assets before starting game
        this.preloadAssets().then(() => {
            this.initialize()
        })
    }

    /**
     * Preload all sprites before game starts
     */
    async preloadAssets() {
        try {
            await SpriteManager.preloadAssetsWithProgress(
                PRELOAD_ASSETS,
                (loaded, total) => {
                    // Emit loading progress event for UI
                    this.events.emit('loadingProgress', { loaded, total })
                }
            )
            this.assetsLoaded = true
        } catch (error) {
            console.error('Failed to load assets:', error)
        }
    }

    /**
     * Initialize game after assets are loaded
     */
    initialize() {
        // State manager
        this.stateManager = new GameStateManager(this)
        
        // Grid setup (10 rows, 15 columns, 64px per tile)
        this.grid = new Grid(10, 15, 64)
        
        // Set ground texture
        const groundImg = SpriteManager.getImage(ground.flat)
        if (groundImg) {
            this.grid.setGroundTexture(groundImg)
        }

        // Camera (fixed for tower defense)
        this.camera = new Camera(0, 0, this.canvas.width, this.canvas.height)
        
        // Setup path for enemies
        const pathCoords = this.setupPath()

        // Initialize managers
        this.waveManager = new WaveManager(this, this.grid.pathToWorld(pathCoords))
        this.towerManager = new TowerManager(this, this.grid)
        this.decorationManager = new DecorationManager(this, this.grid, pathCoords)
        this.projectileManager = new ProjectileManager(this)
        
        // UI manager (replaces default UserInterface)
        this.ui = new TowerDefenseUI(this)

        // Game state
        this.gold = 500
        this.lives = 20
        this.score = 0

        // Quiz system
        this.quizManager = new QuizManager(this)
        this.quizManager.loadQuestions('./data/questions.json')
        this.currentQuiz = null

        // Setup event listeners
        this.setupEventListeners()
        
        // Emit initial state to UI AFTER UI is created
        this.emitStateToUI()
        
        // Change state to PLAYING
        this.stateManager.setState('PLAYING')
    }

    /**
     * Setup path for enemies
     */
    setupPath() {
        // Define path as grid coordinates
        const pathCoords = [
            { row: 5, col: 0 },   // Start left
            { row: 5, col: 3 },
            { row: 2, col: 3 },   // Up
            { row: 2, col: 7 },   // Right
            { row: 7, col: 7 },   // Down
            { row: 7, col: 11 },  // Right
            { row: 4, col: 11 },  // Up
            { row: 4, col: 14 }   // End right
        ]

        // Mark path in grid
        this.grid.setPath(pathCoords)
        
        // Return path coords for use by managers
        return pathCoords
    }
    
    /**
     * Emit current state to UI
     */
    emitStateToUI() {
        this.events.emit('goldChanged', { gold: this.gold })
        this.events.emit('livesChanged', { lives: this.lives })
        this.events.emit('scoreChanged', { score: this.score })
        this.events.emit('waveStart', { wave: 0 })  // Initial wave
        
        // Emit initial tower selection
        const selectedTower = this.towerManager.getSelectedTowerType()
        this.events.emit('towerSelected', {
            towerType: selectedTower.id,
            cost: selectedTower.cost
        })
    }

    /**
     * Setup event listeners for game events
     */
    setupEventListeners() {
        // Enemy reached end - reduce lives
        this.events.on('enemyReachedEnd', (data) => {
            this.lives--
            this.events.emit('livesChanged', { lives: this.lives })
            console.log('Enemy reached end! Lives left:', this.lives)

            if (this.lives <= 0) {
                this.gameOver()
            }
        })
        
        // Enemy killed - award gold and score
        this.events.on('enemyKilled', (data) => {
            this.gold += data.enemy.goldValue || 25
            this.score += data.enemy.scoreValue || 10
            
            this.events.emit('goldChanged', { gold: this.gold })
            this.events.emit('scoreChanged', { score: this.score })
        })
        
        // Tower built - deduct cost
        this.events.on('towerBuilt', (data) => {
            this.gold -= data.cost
            this.events.emit('goldChanged', { gold: this.gold })
        })
        
        // Wave complete - award bonus and start quiz
        this.events.on('waveComplete', (data) => {
            this.gold += data.bonus
            this.events.emit('goldChanged', { gold: this.gold })
            
            // Start quiz after wave
            setTimeout(() => this.startQuiz(), 2000)
        })
    }

    /**
     * Start quiz between waves
     */
    startQuiz() {
        // Pause game
        this.stateManager.setState('QUIZ')

        // Determine difficulty based on wave
        const wave = this.waveManager.currentWave
        let difficulty = 'easy'
        if (wave > 5) {
            difficulty = 'hard'
        } else if (wave > 2) {
            difficulty = 'medium'
        }

        // Get 3 random questions
        const questions = this.quizManager.getRandomQuestions(3, difficulty)

        // If no questions, skip quiz
        if (questions.length === 0) {
            console.warn('No questions available, skipping quiz')
            this.stateManager.setState('PLAYING')
            return
        }

        // Create quiz dialog
        this.currentQuiz = new QuizDialog(this, questions, (totalGold) => {
            // Quiz complete - award gold
            this.gold += totalGold
            this.events.emit('goldChanged', { gold: this.gold })
            console.log(`Quiz complete! Earned ${totalGold} gold`)

            // Return to game
            this.stateManager.setState('PLAYING')
            this.currentQuiz = null

            // Start next wave
            setTimeout(() => this.waveManager.startWave(), 2000)
        })
    }

    /**
     * Game over
     */
    gameOver() {
        console.log('GAME OVER!')
        this.stateManager.setState('GAME_OVER')
        this.events.emit('gameOver', {
            wave: this.waveManager.currentWave,
            score: this.score
        })
    }

    /**
     * Reset game
     */
    reset() {
        this.gold = 500
        this.lives = 20
        this.score = 0
        
        this.waveManager.reset()
        this.towerManager.reset()
        this.projectileManager.reset()
        
        this.emitStateToUI()
        this.stateManager.setState('PLAYING')
    }
    /**
     * Update game
     */
    update(deltaTime) {
        // Show loading if assets not loaded
        if (!this.assetsLoaded) {
            return
        }

        // If quiz active, only update quiz
        if (this.stateManager.isQuizActive() && this.currentQuiz) {
            this.currentQuiz.update(deltaTime)
            return
        }

        // Only update game during PLAYING state
        if (!this.stateManager.isPlaying()) {
            return
        }

        // Update decorations
        if (this.decorationManager) {
            this.decorationManager.update(deltaTime)
        }

        // Handle tower selection via keyboard
        if (this.inputHandler.keys.has('1')) {
            this.towerManager.handleKeyPress('1')
            this.inputHandler.keys.delete('1')
        }
        if (this.inputHandler.keys.has('2')) {
            this.towerManager.handleKeyPress('2')
            this.inputHandler.keys.delete('2')
        }
        if (this.inputHandler.keys.has('3')) {
            this.towerManager.handleKeyPress('3')
            this.inputHandler.keys.delete('3')
        }
        if (this.inputHandler.keys.has('4')) {
            this.towerManager.handleKeyPress('4')
            this.inputHandler.keys.delete('4')
        }

        // Handle mouse click for tower building
        if (this.inputHandler.mouseButtons.has(0)) {
            this.towerManager.handleMouseClick(
                this.inputHandler.mouseX,
                this.inputHandler.mouseY,
                this.gold
            )
            this.inputHandler.mouseButtons.delete(0)
        }

        // Update managers
        this.waveManager.update(deltaTime)
        this.towerManager.update(deltaTime)
        this.projectileManager.update(deltaTime, this.waveManager.getEnemies())

        // Update UI
        this.ui.update(deltaTime)
    }

    /**
     * Draw game
     */
    draw(ctx) {
        // Clear canvas
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        // Show loading screen if assets not loaded
        if (!this.assetsLoaded) {
            // StateManager might not be initialized yet
            if (this.stateManager) {
                this.stateManager.setState('LOADING')
            }
            if (this.ui) {
                this.ui.draw(ctx)
            } else {
                // Fallback loading screen
                ctx.fillStyle = 'white'
                ctx.font = '32px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2)
                ctx.textAlign = 'left'
            }
            return
        }

        // Background
        ctx.fillStyle = '#2a2a2a'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        // Draw grid (always visible in tower defense)
        this.grid.draw(ctx, this.camera, true)

        // Draw decorations (castle, trees, etc.) - background layer
        if (this.decorationManager) {
            this.decorationManager.drawCastle(ctx, this.camera)
            this.decorationManager.drawDecorations(ctx, this.camera)
        }

        // Draw tower placement preview
        if (this.stateManager.isPlaying()) {
            const selectedTower = this.towerManager.getSelectedTowerType()
            const canAfford = this.gold >= selectedTower.cost
            this.ui.drawPlacementPreview(
                ctx,
                this.inputHandler.mouseX,
                this.inputHandler.mouseY,
                this.grid,
                canAfford,
                this.camera
            )
        }

        // Draw game entities
        this.towerManager.draw(ctx, this.camera)
        this.waveManager.draw(ctx, this.camera)
        this.projectileManager.draw(ctx, this.camera)

        // Draw clouds (top layer)
        if (this.decorationManager) {
            this.decorationManager.drawClouds(ctx)
        }

        // Draw UI (HUD, loading screen, etc.)
        this.ui.draw(ctx)

        // Quiz handled by DOM overlay
    }
}
