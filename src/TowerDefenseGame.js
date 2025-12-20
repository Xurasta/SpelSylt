import GameBase from './GameBase.js'
import Grid from './Grid.js'
import Tower from './Tower.js'
import Enemy from './Enemy.js'
import Camera from './Camera.js'
import Vector2 from './Vector2.js'
import { TOWER_TYPES, getTowerType } from './TowerTypes.js'
import SplashComponent from './components/SplashComponent.js'
import PoisonComponent from './components/PoisonComponent.js'
import QuizDialog from './quiz/QuizDialog.js'
import QuizManager from './quiz/QuizManager.js'

/**
 * TowerDefenseGame - Tower Defense spel
 * 
 * Branch 24: Component system för olika tower types 
 * Branch 23: Basic implementation
 * - Grid system för att placera torn
 * - Mouse input för att bygga
 * - Path following för enemies
 * - Basic shooting
 */
export default class TowerDefenseGame extends GameBase {
    constructor(canvas) {
        super(canvas)

        // Grid setup (10 rader, 15 kolumner, 64px per tile)
        this.grid = new Grid(10, 15, 64)
        
        // Camera (fixed för tower defense, ingen scrolling)
        this.camera = new Camera(0, 0, canvas.width, canvas.height)
        
        // Game objects
        this.towers = []
        this.enemies = []
        this.projectiles = []
        
        // Game state
        this.gold = 500          // Startpengar
        this.lives = 20          // Liv
        this.wave = 0            // Nuvarande våg
        this.score = 0
        
        // Tower selection
        this.selectedTowerType = 'CANNON'  // Default till cannon
        this.towerCost = TOWER_TYPES.CANNON.cost
        
        // Wave spawning
        this.waveInProgress = false
        this.enemiesSpawned = 0
        this.enemiesToSpawn = 0
        this.spawnTimer = 0
        this.spawnInterval = 1000  // 1 sekund mellan varje enemy
        
        // Quiz system
        this.quizManager = new QuizManager(this)
        this.quizManager.loadQuestions('./data/questions.json')
        this.currentQuiz = null
        
        // Temporär: Definiera path (kommer från level data senare)
        this.setupPath()
        
        // Setup event listeners
        this.setupEventListeners()
        
        // Starta första vågen efter en liten fördröjning
        setTimeout(() => this.startWave(), 2000)
    }
    
    /**
     * Setup path för enemies
     * Senare kommer detta från level-data
     */
    setupPath() {
        // Definiera path som grid coordinates
        const pathCoords = [
            { row: 5, col: 0 },   // Start vänster
            { row: 5, col: 3 },
            { row: 2, col: 3 },   // Upp
            { row: 2, col: 7 },   // Höger
            { row: 7, col: 7 },   // Ner
            { row: 7, col: 11 },  // Höger
            { row: 4, col: 11 },  // Upp
            { row: 4, col: 14 }   // Slut höger
        ]
        
        // Markera path i grid
        this.grid.setPath(pathCoords)
        
        // Konvertera till world positions för enemies
        this.enemyPath = this.grid.pathToWorld(pathCoords)
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Lyssna på tower events
        this.events.on('towerShoot', (data) => {
            console.log('Tower shot at enemy')
        })
        
        this.events.on('towerBuilt', (data) => {
            console.log(`Tower built at row ${data.row}, col ${data.col}`)
        })
        
        // Lyssna på enemy events
        this.events.on('enemyReachedEnd', (data) => {
            console.log('Enemy reached end! Lives left:', this.lives)
            
            // Kolla game over
            if (this.lives <= 0) {
                console.log('GAME OVER!')
                this.gameOver()
            }
        })
    }
    
    /**
     * Starta ny våg
     */
    startWave() {
        if (this.waveInProgress) {
            return
        }
        
        this.wave++
        this.waveInProgress = true
        this.enemiesSpawned = 0
        
        // Antal enemies baserat på wave (5 + 3 per wave)
        this.enemiesToSpawn = 5 + (this.wave - 1) * 3
        
        console.log(`Wave ${this.wave} starting! Enemies: ${this.enemiesToSpawn}`)
        
        this.events.emit('waveStart', {
            wave: this.wave,
            enemies: this.enemiesToSpawn
        })
    }
    
    /**
     * Spawna en enemy
     */
    spawnEnemy() {
        // Enemy config baserat på wave
        const config = {
            health: 100 + (this.wave - 1) * 20,    // Mer health varje wave
            speed: 0.08 + (this.wave - 1) * 0.01,  // Lite snabbare varje wave
            gold: 25 + (this.wave - 1) * 5,
            score: 10 + (this.wave - 1) * 2,
            color: this.getEnemyColor(this.wave)
        }
        
        const enemy = new Enemy(this, this.enemyPath, config)
        this.enemies.push(enemy)
        
        this.enemiesSpawned++
        
        this.events.emit('enemySpawned', {
            enemy,
            wave: this.wave,
            count: this.enemiesSpawned,
            total: this.enemiesToSpawn
        })
    }
    
    /**
     * Hämta enemy färg baserat på wave
     */
    getEnemyColor(wave) {
        const colors = ['red', 'orange', 'purple', 'darkred', 'crimson']
        return colors[(wave - 1) % colors.length]
    }
    
    /**
     * Kolla om vågen är klar
     */
    checkWaveComplete() {
        if (!this.waveInProgress) {
            return
        }
        
        // Alla spawnade och alla döda?
        if (this.enemiesSpawned >= this.enemiesToSpawn && this.enemies.length === 0) {
            this.waveInProgress = false
            console.log(`Wave ${this.wave} complete!`)
            
            // Bonus gold för att klara wave
            const bonus = 50 + this.wave * 10
            this.gold += bonus
            
            this.events.emit('waveComplete', {
                wave: this.wave,
                bonus
            })
            
            // Starta quiz istället för att direkt starta nästa wave
            setTimeout(() => this.startQuiz(), 2000)
        }
    }
    
    /**
     * Starta quiz mellan waves
     */
    startQuiz() {
        // Pausa spelet
        this.gameState = 'QUIZ'
        
        // Bestäm difficulty baserat på wave number
        let difficulty = 'easy'
        if (this.wave > 5) {
            difficulty = 'hard'
        } else if (this.wave > 2) {
            difficulty = 'medium'
        }
        
        // Hämta 3 random frågor
        const questions = this.quizManager.getRandomQuestions(3, difficulty)
        
        // Om inga frågor finns, skippa quiz
        if (questions.length === 0) {
            console.warn('No questions available, skipping quiz')
            this.gameState = 'PLAYING'
            setTimeout(() => this.startWave(), 2000)
            return
        }
        
        // Skapa quiz dialog
        this.currentQuiz = new QuizDialog(this, questions, (totalGold) => {
            // Quiz färdigt - ge gold och fortsätt
            this.gold += totalGold
            console.log(`Quiz complete! Earned ${totalGold} gold`)
            
            // Tillbaka till spel
            this.gameState = 'PLAYING'
            this.currentQuiz = null
            
            // Starta nästa wave efter kort delay
            setTimeout(() => this.startWave(), 2000)
        })
    }
    
    /**
     * Game over
     */
    gameOver() {
        console.log('GAME OVER!')
        this.events.emit('gameOver', {
            wave: this.wave,
            score: this.score
        })
        // Här kan vi senare visa game over menu
    }
    
    /**
     * Reset spelet
     */
    reset() {
        this.towers = []
        this.enemies = []
        this.projectiles = []
        this.gold = 500
        this.lives = 20
        this.wave = 0
        this.score = 0
    }
    /**
     * Hantera mouse click för att bygga torn
     */
    handleMouseClick() {
        const mouseX = this.inputHandler.mouseX
        const mouseY = this.inputHandler.mouseY
        
        // Konvertera till grid position
        const { row, col } = this.grid.getGridPosition(mouseX, mouseY)
        
        // Kolla om kan bygga här
        if (!this.grid.canBuildAt(row, col)) {
            console.log('Cannot build here!')
            return
        }
        
        // Hämta tower type config
        const towerType = getTowerType(this.selectedTowerType)
        
        // Kolla om har råd
        if (this.gold < towerType.cost) {
            console.log(`Not enough gold! Need ${towerType.cost}G`)
            return
        }
        
        // Bygg torn med vald typ
        const worldPos = this.grid.getWorldPosition(row, col)
        const tower = new Tower(this, worldPos.x, worldPos.y, towerType)
        
        // Placera i grid
        if (this.grid.placeTower(row, col, tower)) {
            this.towers.push(tower)
            this.gold -= towerType.cost
            
            console.log(`Built ${towerType.name} for ${towerType.cost}G`)
            
            // Emit event
            this.events.emit('towerBuilt', {
                tower,
                towerType: towerType.id,
                row,
                col,
                cost: towerType.cost
            })
        }
    }
    
    /**
     * Välj tower type att bygga (kallas av key press)
     */
    selectTowerType(typeId) {
        const towerType = getTowerType(typeId)
        if (towerType) {
            this.selectedTowerType = typeId
            this.towerCost = towerType.cost
            console.log(`Selected: ${towerType.name} (${towerType.cost}G)`)
        }
    }
    
    /**
     * Update game
     * @param {number} deltaTime - Tid sedan förra frame
     */
    update(deltaTime) {
        // Om quiz är aktivt, uppdatera bara quiz
        if (this.gameState === 'QUIZ' && this.currentQuiz) {
            this.currentQuiz.update(deltaTime)
            return
        }
        
        // Hantera tower selection med number keys
        if (this.inputHandler.keys.has('1')) {
            this.selectTowerType('CANNON')
            this.inputHandler.keys.delete('1')
        }
        if (this.inputHandler.keys.has('2')) {
            this.selectTowerType('ICE')
            this.inputHandler.keys.delete('2')
        }
        if (this.inputHandler.keys.has('3')) {
            this.selectTowerType('SPLASH')
            this.inputHandler.keys.delete('3')
        }
        if (this.inputHandler.keys.has('4')) {
            this.selectTowerType('POISON')
            this.inputHandler.keys.delete('4')
        }
        
        // Spawn enemies om våg pågår
        if (this.waveInProgress && this.enemiesSpawned < this.enemiesToSpawn) {
            this.spawnTimer += deltaTime
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnEnemy()
                this.spawnTimer = 0
            }
        }
        
        // Hantera mouse click
        if (this.inputHandler.mouseButtons.has(0)) {
            this.handleMouseClick()
            // Rensa så vi inte bygger varje frame
            this.inputHandler.mouseButtons.delete(0)
        }
        
        // Uppdatera towers
        this.towers.forEach(tower => {
            tower.update(deltaTime)
        })
        
        // Uppdatera enemies
        this.enemies.forEach(enemy => {
            if (enemy.update) {
                enemy.update(deltaTime)
            }
        })
        
        // Uppdatera projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i]
            
            // Flytta projectile
            projectile.position.addScaled(projectile.velocity, deltaTime)
            projectile.distanceTraveled += projectile.velocity.length() * deltaTime
            
            // Max distance?
            if (projectile.distanceTraveled > projectile.maxDistance) {
                projectile.markedForDeletion = true
            }
            
            // Kollision med enemies
            if (!projectile.markedForDeletion) {
                for (const enemy of this.enemies) {
                    if (enemy.markedForDeletion || enemy.health <= 0) {
                        continue
                    }
                    
                    // Simple AABB collision
                    // Enemy position är center, så vi behöver justera
                    const projectileRect = {
                        x: projectile.position.x - projectile.width / 2,
                        y: projectile.position.y - projectile.height / 2,
                        width: projectile.width,
                        height: projectile.height
                    }
                    
                    const enemyRect = {
                        x: enemy.position.x - enemy.width / 2,
                        y: enemy.position.y - enemy.height / 2,
                        width: enemy.width,
                        height: enemy.height
                    }
                    
                    if (this.checkCollision(projectileRect, enemyRect)) {
                        // Skada enemy
                        if (enemy.takeDamage) {
                            const killed = enemy.takeDamage(projectile.damage)
                            
                            // Applicera poison om tornet har PoisonComponent
                            if (projectile.tower) {
                                const poisonComp = projectile.tower.getComponent(PoisonComponent)
                                if (poisonComp) {
                                    poisonComp.applyPoison(enemy)
                                }
                            }
                            
                            // Om enemy dog, ge gold och score
                            if (killed) {
                                this.gold += enemy.goldValue || 25
                                this.score += enemy.scoreValue || 10
                                
                                // Register kill på tower
                                if (projectile.tower) {
                                    projectile.tower.registerKill()
                                }
                                
                                this.events.emit('enemyKilled', {
                                    enemy,
                                    tower: projectile.tower,
                                    position: enemy.position.clone()
                                })
                            }
                            
                            // Register damage på tower
                            if (projectile.tower) {
                                projectile.tower.registerDamage(projectile.damage)
                            }
                        }
                        
                        // Applicera splash damage om tornet har SplashComponent
                        if (projectile.tower) {
                            const splashComp = projectile.tower.getComponent(SplashComponent)
                            if (splashComp) {
                                splashComp.onProjectileHit(projectile, enemy, projectile.position.clone())
                            }
                        }
                        
                        projectile.markedForDeletion = true
                        
                        this.events.emit('projectileHit', {
                            projectile: projectile,
                            enemy,
                            damage: projectile.damage
                        })
                        
                        break
                    }
                }
            }
            
            // Ta bort om markerad
            if (projectile.markedForDeletion) {
                this.projectiles.splice(i, 1)
            }
        }
        
        // Rensa döda enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].markedForDeletion) {
                this.enemies.splice(i, 1)
            }
        }
        
        // Kolla om wave är klar
        this.checkWaveComplete()
    }
    
    /**
     * Simple AABB collision check
     */
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y
    }
    
    /**
     * Draw game
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Rensa canvas
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        
        // Debug: Rita vit bakgrund för att se canvas
        ctx.fillStyle = '#2a2a2a'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        
        // Rita grid (alltid synlig i tower defense)
        this.grid.draw(ctx, this.camera, true)
        
        // Rita hover highlight vid mouse
        if (this.gold >= this.towerCost) {
            this.grid.drawHover(
                ctx,
                this.inputHandler.mouseX,
                this.inputHandler.mouseY,
                this.camera,
                this.gold >= this.towerCost
            )
        }
        
        // Rita towers
        this.towers.forEach(tower => {
            tower.draw(ctx, this.camera)
        })
        
        // Rita enemies
        this.enemies.forEach(enemy => {
            if (enemy.draw) {
                enemy.draw(ctx, this.camera)
            }
        })
        
        // Rita projectiles
        const offsetX = this.camera ? this.camera.position.x : 0
        const offsetY = this.camera ? this.camera.position.y : 0
        
        this.projectiles.forEach(projectile => {
            ctx.fillStyle = projectile.color || 'yellow'
            ctx.beginPath()
            ctx.arc(
                projectile.position.x - offsetX,
                projectile.position.y - offsetY,
                4,
                0,
                Math.PI * 2
            )
            ctx.fill()
        })
        
        // Rita UI
        this.drawUI(ctx)
        
        // Quiz hanteras nu av DOM, inte canvas
    }
    
    /**
     * Rita UI med gold, lives, etc
     */
    drawUI(ctx) {
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
        const selectedType = getTowerType(this.selectedTowerType)
        ctx.fillText(`Tower: ${selectedType.name}`, 10, 150)
        ctx.fillText(`Cost: ${selectedType.cost}G`, 10, 180)
        
        // Tower selection (höger sida)
        ctx.font = '16px Arial'
        ctx.fillStyle = 'white'
        ctx.fillText('Tower Types:', this.canvas.width - 200, 30)
        
        const towerTypes = [
            { key: '1', type: TOWER_TYPES.CANNON },
            { key: '2', type: TOWER_TYPES.ICE },
            { key: '3', type: TOWER_TYPES.SPLASH },
            { key: '4', type: TOWER_TYPES.POISON }
        ]
        
        towerTypes.forEach((item, index) => {
            const y = 60 + index * 70
            const isSelected = this.selectedTowerType === item.type.id.toUpperCase()
            
            // Background box
            ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)'
            ctx.fillRect(this.canvas.width - 200, y - 20, 190, 60)
            
            // Tower color swatch
            ctx.fillStyle = item.type.color
            ctx.fillRect(this.canvas.width - 195, y - 15, 30, 30)
            ctx.strokeStyle = item.type.barrelColor
            ctx.lineWidth = 2
            ctx.strokeRect(this.canvas.width - 195, y - 15, 30, 30)
            
            // Text
            ctx.fillStyle = isSelected ? 'yellow' : 'white'
            ctx.font = '14px Arial'
            ctx.fillText(`[${item.key}] ${item.type.name}`, this.canvas.width - 160, y)
            ctx.font = '12px Arial'
            ctx.fillStyle = 'lightgray'
            ctx.fillText(`${item.type.cost}G - ${item.type.description}`, this.canvas.width - 160, y + 20)
        })
        
        // Instructions
        ctx.font = '14px Arial'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.fillText('Press 1-4 to select tower', 10, this.canvas.height - 60)
        ctx.fillText('Click to build tower', 10, this.canvas.height - 40)
        ctx.fillText('Press P for debug mode', 10, this.canvas.height - 20)
    }
}
