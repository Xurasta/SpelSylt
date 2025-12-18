import GameBase from "./GameBase.js"
import Player from "./Player.js"
import Platform from "./Platform.js"
import ObstacleSpawner from "./ObstacleSpawner.js"
import Background from "./Background.js"
import MainMenu from "./menus/MainMenu.js"

import bgImage from "./assets/clouds/Big Clouds.png"

export default class RunnerGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // Runner-specifika egenskaper
        this.gravity = 0.0015
        this.friction = 0.00005
        
        // Distance tracking (score)
        this.distance = 0
        this.distanceMultiplier = 0.1 // Pixels per frame
        
        // Game objects
        this.platforms = []
        this.obstacles = []
        this.obstacleSpawner = null
        
        // Backgrounds
        this.backgrounds = []
        
        this.init()
    }
    
    init() {
        this.gameState = 'MENU'
        this.distance = 0
        this.score = 0
        
        // Skapa main menu
        this.currentMenu = new MainMenu(this, () => this.restart())
        
        // Skapa bakgrund (auto-scrolling)
        this.backgrounds = [
            new Background(this, bgImage, {
                autoScrollX: -0.05,
                tileX: true,
                tileY: false
            })
        ]
        
        // Skapa mark (en lång platform)
        const groundY = this.height - 60
        this.platforms = [
            new Platform(this, 0, groundY, this.width * 3, 60, '#654321')
        ]
        
        // Skapa spelaren
        this.player = new Player(this, 100, groundY - 50, 50, 50, 'green')
        
        // Skapa obstacle spawner
        this.obstacleSpawner = new ObstacleSpawner(this)
        this.obstacles = []
    }
    
    restart() {
        this.gameState = 'PLAYING'
        this.distance = 0
        this.score = 0
        
        // Återställ spelaren
        const groundY = this.height - 60
        this.player = new Player(this, 100, groundY - 50, 50, 50, 'green')
        
        // Återställ obstacles
        this.obstacles = []
        this.obstacleSpawner.reset()
    }
    
    update(deltaTime) {
        // Kolla meny-state
        if (this.gameState === 'MENU' && this.currentMenu) {
            this.currentMenu.update(deltaTime)
            return
        }
        
        if (this.gameState !== 'PLAYING') return
        
        // Uppdatera distance (score)
        this.distance += this.distanceMultiplier * deltaTime
        this.score = Math.floor(this.distance)
        
        // Uppdatera bakgrunder
        this.backgrounds.forEach(bg => bg.update(deltaTime))
        
        // Uppdatera spelaren
        this.player.update(deltaTime)
        
        // Kolla kollision med mark
        this.platforms.forEach(platform => {
            if (this.player.intersects(platform)) {
                this.player.handlePlatformCollision(platform)
            }
        })
        
        // Spawna och uppdatera obstacles
        this.obstacleSpawner.update(deltaTime)
        this.obstacles.forEach(obstacle => obstacle.update(deltaTime))
        
        // Kolla kollision med obstacles
        for (const obstacle of this.obstacles) {
            if (this.player.intersects(obstacle)) {
                this.gameOver()
                break
            }
        }
        
        // Ta bort markerade obstacles
        this.obstacles = this.obstacles.filter(o => !o.markedForDeletion)
        
        // Uppdatera UI
        this.ui.update(deltaTime)
    }
    
    draw(ctx) {
        // Rensa canvas
        ctx.fillStyle = '#87CEEB' // Ljusblå himmel
        ctx.fillRect(0, 0, this.width, this.height)
        
        // Rita bakgrunder (ingen camera för runner)
        this.backgrounds.forEach(bg => bg.draw(ctx, null))
        
        // Rita mark
        this.platforms.forEach(platform => platform.draw(ctx, null))
        
        // Rita obstacles
        this.obstacles.forEach(obstacle => obstacle.draw(ctx, null))
        
        // Rita spelaren
        this.player.draw(ctx, null)
        
        // Rita UI
        this.ui.draw(ctx)
        
        // Rita meny
        if (this.currentMenu) {
            this.currentMenu.draw(ctx)
        }
    }
    
    gameOver() {
        this.gameState = 'GAME_OVER'
        
        // Visa Game Over menu (kan skapas senare)
        // För nu, bara visa text
    }
}
