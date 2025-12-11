import GameBase from '../GameBase.js'
import Background from '../Background.js'
import SpacePlayer from './SpacePlayer.js'
import EnemySpawner from './EnemySpawner.js'
import PowerUp from './PowerUp.js'

// Backgrounds
import spaceImage from '../assets/Shootem Up/Background_Space-0001.png'
import nebulaImage from '../assets/Shootem Up/Background_Nebula-0001.png'
import starsImage from '../assets/Shootem Up/Background_Stars-0001.png'
import smallStarsImage from '../assets/Shootem Up/Background_SmallStars-0001.png'

// Audio
import stormMusic from '../assets/sounds/Storm.mp3'

// Menus
import MainMenu from '../menus/MainMenu.js'
import GameOverMenu from '../menus/GameOverMenu.js'

export default class SpaceShooterGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // Space shooter world (scrolls vertically, full width)
        this.worldWidth = width
        this.worldHeight = height * 10
        
        // Setup space backgrounds with parallax
        this.setupSpaceBackgrounds()
        
        // Enemy spawning system
        this.enemySpawner = new EnemySpawner(this)
        
        // Background music
        this.backgroundMusic = new Audio(stormMusic)
        this.backgroundMusic.loop = true
        this.backgroundMusic.volume = 0.3
        
        // Escape key tracking
        this.escapePressed = false
        
        // Initialize game
        this.init()
        
        // Skapa meny
        this.currentMenu = new MainMenu(this)
    }
    
    showMainMenu() {
        this.gameState = 'MENU'
        this.currentMenu = new MainMenu(this)
    }
    
    setupSpaceBackgrounds() {
        // Parallax layers for space (from far to near)
        this.backgrounds = [
            new Background(this, spaceImage, {
                tiled: true,
                tileWidth: 320,
                tileHeight: 320,
                tileX: false,
                tileY: true,
                scrollSpeed: 0.1,
                autoScrollY: -0.02
            }),
            new Background(this, nebulaImage, {
                tiled: true,
                tileWidth: 320,
                tileHeight: 320,
                tileX: false,
                tileY: true,
                scrollSpeed: 0.3,
                autoScrollY: -0.05
            }),
            new Background(this, starsImage, {
                tiled: true,
                tileWidth: 320,
                tileHeight: 320,
                tileX: false,
                tileY: true,
                scrollSpeed: 0.5,
                autoScrollY: -0.08
            }),
            new Background(this, smallStarsImage, {
                tiled: true,
                tileWidth: 320,
                tileHeight: 320,
                tileX: false,
                tileY: true,
                scrollSpeed: 0.7,
                autoScrollY: -0.12
            })
        ]
    }
    
    init() {
        // Reset score
        this.score = 0
        this.playTime = 0
        
        // Create space player (centered horizontally, near bottom)
        this.player = new SpacePlayer(
            this,
            this.width / 2 - 32,
            this.height - 100,
            64,
            48
        )
        
        // Reset arrays
        this.enemies = []
        this.projectiles = []
        this.powerups = []
        
        // Reset enemy spawner
        this.enemySpawner.reset()
        
        // Camera setup - fixed for space shooter
        this.camera.x = 0
        this.camera.y = 0
        this.camera.setWorldBounds(this.worldWidth, this.worldHeight)
        
        // Start background music
        this.backgroundMusic.currentTime = 0
        this.backgroundMusic.play().catch(err => {
            console.log('Background music autoplay prevented:', err)
        })
    }
    
    restart() {
        this.gameState = 'PLAYING'
        this.currentMenu = null
        this.init()
    }
    
    tryDropPowerup(enemy) {
        if (Math.random() < enemy.dropChance) {
            const powerupType = Math.random() < 0.5 ? 'health' : 'shield'
            const powerup = new PowerUp(
                this,
                enemy.x + enemy.width / 2 - 15,
                enemy.y,
                powerupType
            )
            this.powerups.push(powerup)
        }
    }
    
    update(deltaTime) {
        // Kolla lose condition FÖRST (innan vi kollar gameState)
        if (this.player && this.player.health <= 0 && this.gameState === 'PLAYING') {
            this.gameState = 'GAME_OVER'
            this.currentMenu = new GameOverMenu(this)
            this.backgroundMusic.pause()
        }
        
        // Kolla Escape för att öppna menyn under spel (INNAN vi rensar keys)
        if (this.inputHandler.keys.has('Escape') && !this.escapePressed) {
            if (this.gameState === 'PLAYING') {
                this.escapePressed = true
                this.gameState = 'MENU'
                this.currentMenu = new MainMenu(this)
                this.backgroundMusic.pause()
                this.inputHandler.keys.clear()
                return
            }
        }
        
        // Reset escape flag när tangenten släpps
        if (!this.inputHandler.keys.has('Escape')) {
            this.escapePressed = false
        }
        
        // Uppdatera menyn om den är aktiv (både MENU och GAME_OVER)
        if ((this.gameState === 'MENU' || this.gameState === 'GAME_OVER') && this.currentMenu) {
            this.currentMenu.update(deltaTime)
            this.inputHandler.keys.clear()
            return
        }
        
        // Uppdatera bara om spelet är i PLAYING state
        if (this.gameState !== 'PLAYING') return
        
        // Update play time
        this.playTime += deltaTime
        
        // Uppdatera backgrounds
        this.backgrounds.forEach(bg => bg.update(deltaTime))
        
        // Uppdatera spelaren
        this.player.update(deltaTime)
        
        // Uppdatera fiender
        this.enemies.forEach(enemy => enemy.update(deltaTime))
        
        // Uppdatera projektiler och kolla kollisioner med fiender
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime)
            
            // Kolla kollision med fiender
            this.enemies.forEach(enemy => {
                if (projectile.intersects(enemy) && !enemy.markedForDeletion && !projectile.markedForDeletion) {
                    enemy.takeDamage(1)
                    projectile.markedForDeletion = true
                    // Add points and check for powerup drop if enemy dies
                    if (enemy.markedForDeletion && enemy.points) {
                        this.score += enemy.points
                        this.tryDropPowerup(enemy)
                    }
                }
            })
        })
        
        // Uppdatera powerups
        this.powerups.forEach(powerup => powerup.update(deltaTime))
        
        // Kontrollera kollision med fiender
        this.enemies.forEach(enemy => {
            if (this.player.intersects(enemy) && !enemy.markedForDeletion) {
                this.player.takeDamage(enemy.damage)
                enemy.markedForDeletion = true
            }
        })
        
        // Check collision with boss projectiles (they damage player)
        this.projectiles.forEach(projectile => {
            if (projectile.damage && this.player.intersects(projectile) && !projectile.markedForDeletion) {
                this.player.takeDamage(projectile.damage)
                projectile.markedForDeletion = true
            }
        })
        
        // Kontrollera kollision med powerups
        this.powerups.forEach(powerup => {
            if (this.player.intersects(powerup) && !powerup.markedForDeletion) {
                powerup.apply(this.player)
            }
        })
        
        // Ta bort alla objekt markerade för borttagning
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion)
        this.powerups = this.powerups.filter(powerup => !powerup.markedForDeletion)
        
        // Force camera to stay fixed for space shooter
        this.camera.x = 0
        this.camera.y = 0
        this.camera.update(deltaTime)
        
        // Enemy spawning
        this.enemySpawner.update(deltaTime)
    }
    
    draw(ctx) {
        // Rita backgrounds först
        this.backgrounds.forEach(bg => bg.draw(ctx, this.camera))
        
        // Rita game objects bara om vi spelar
        if (this.gameState === 'PLAYING') {
            if (this.player) {
                this.player.draw(ctx, this.camera)
            }
            
            // Rita fiender
            this.enemies.forEach(enemy => enemy.draw(ctx, this.camera))
            
            // Rita projektiler
            this.projectiles.forEach(projectile => projectile.draw(ctx, this.camera))
            
            // Rita powerups
            this.powerups.forEach(powerup => powerup.draw(ctx, this.camera))
            
            // Rita UI
            this.ui.draw(ctx)
        }
        
        // Menu (både main menu och game over menu)
        if ((this.gameState === 'MENU' || this.gameState === 'GAME_OVER') && this.currentMenu) {
            this.currentMenu.draw(ctx)
        }
    }
}
