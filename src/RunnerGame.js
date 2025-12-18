import GameBase from "./GameBase.js"
import Player from "./Player.js"
import Platform from "./Platform.js"
import ObstacleSpawner from "./ObstacleSpawner.js"
import Background from "./Background.js"
import BackgroundObject from "./BackgroundObject.js"
import MainMenu from "./menus/MainMenu.js"
import GameOverMenu from "./menus/GameOverMenu.js"

import bgImage from "./assets/Pixel Adventure 1/Background/Blue.png"
import terrainImage from "./assets/Pixel Adventure 1/Terrain/Terrain (16x16).png"
import bigCloudsImage from "./assets/clouds/Big Clouds.png"
import smallCloud1 from "./assets/clouds/Small Cloud 1.png"
import smallCloud2 from "./assets/clouds/Small Cloud 2.png"
import smallCloud3 from "./assets/clouds/Small Cloud 3.png"

export default class RunnerGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // Runner-specifika egenskaper
        this.gravity = 0.0015
        this.friction = 0.00005
        
        // Distance tracking (score)
        this.distance = 0
        this.distanceMultiplier = 0.1 // Pixels per frame
        this.playTime = 0 // Time in seconds
        
        // Game objects
        this.platforms = []
        this.obstacles = []
        this.obstacleSpawner = null
        
        // Backgrounds
        this.backgrounds = []
        this.backgroundObjects = [] // Floating clouds
        
        // Debug
        this.lastDebugKey = false
        
        // Kamera - fixerad på (0, 0) för runner (ingen scrolling)
        this.camera.position.set(0, 0)
        this.camera.target.set(0, 0)
        
        this.init()
    }
    
    init() {
        this.gameState = 'MENU'
        this.distance = 0
        this.score = 0
        this.playTime = 0
        
        // Skapa main menu
        this.currentMenu = new MainMenu(this, () => this.restart())
        
        // Skapa bakgrund (auto-scrolling)
        this.backgrounds = [
            // Blue tiled background
            new Background(this, bgImage, {
                autoScrollX: 0,
                tileX: true,
                tileY: true
            }),
            // Big clouds layer
            new Background(this, bigCloudsImage, {
                autoScrollX: -0.02,
                tileX: true,
                tileY: false,
                yPosition: this.height - 150,
                height: 200
            })
        ]
        
        // Skapa small floating clouds
        const cloudImages = [smallCloud1, smallCloud2, smallCloud3]
        this.backgroundObjects = []
        for (let i = 0; i < 5; i++) {
            const cloudImg = cloudImages[Math.floor(Math.random() * cloudImages.length)]
            const x = Math.random() * this.width * 2
            const y = 50 + Math.random() * 150
            const speed = -0.03 - Math.random() * 0.02
            
            this.backgroundObjects.push(
                new BackgroundObject(this, x, y, cloudImg, {
                    velocity: { x: speed, y: 0 },
                    wrapX: true,
                    scale: 0.8 + Math.random() * 0.4
                })
            )
        }
        
        // Skapa mark (tiled terrain) - 3 rows
        const groundY = this.height - 48
        this.platforms = [
            new Platform(this, 0, this.height - 48, this.width * 3, 16, '#654321', {
                src: terrainImage,
                sourceX: 112,
                sourceY: 0,
                width: 16,
                height: 16
            }),
            new Platform(this, 0, this.height - 32, this.width * 3, 16, '#654321', {
                src: terrainImage,
                sourceX: 112,
                sourceY: 16,
                width: 16,
                height: 16
            }),
            new Platform(this, 0, this.height - 16, this.width * 3, 16, '#654321', {
                src: terrainImage,
                sourceX: 112,
                sourceY: 32,
                width: 16,
                height: 16
            })
        ]
        
        // Skapa spelaren
        this.player = new Player(this, 100, this.height - 100, 50, 50, 'green')
        
        // Skapa obstacle spawner
        this.obstacleSpawner = new ObstacleSpawner(this)
        this.obstacles = []
    }
    
    restart() {
        this.gameState = 'PLAYING'
        this.currentMenu = null
        this.distance = 0
        this.score = 0
        this.playTime = 0
        
        // Återställ spelaren
        const groundY = this.height - 60
        this.player = new Player(this, 100, groundY - 50, 50, 50, 'green')
        
        // Återställ obstacles
        this.obstacles = []
        this.obstacleSpawner.reset()
    }
    
    update(deltaTime) {
        // Toggle debug mode med P
        if (this.inputHandler.keys.has('p') && !this.lastDebugKey) {
            this.debug = !this.debug
        }
        this.lastDebugKey = this.inputHandler.keys.has('p')
        
        // Kolla meny-state
        if ((this.gameState === 'MENU' || this.gameState === 'GAME_OVER') && this.currentMenu) {
            this.currentMenu.update(deltaTime)
            return
        }
        
        if (this.gameState !== 'PLAYING') return
        
        // Uppdatera tid
        this.playTime += deltaTime / 1000
        
        // Uppdatera distance (score)
        this.distance += this.distanceMultiplier * deltaTime
        this.score = Math.floor(this.distance)
        
        // Uppdatera bakgrunder
        this.backgrounds.forEach(bg => bg.update(deltaTime))
        this.backgroundObjects.forEach(obj => obj.update(deltaTime))
        
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
        
        // Ta bort markerade obstacles (reverse loop för performance)
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            if (this.obstacles[i].markedForDeletion) {
                this.obstacles.splice(i, 1)
            }
        }
    }
    
    draw(ctx) {
        // Rensa canvas
        ctx.fillStyle = '#87CEEB' // Ljusblå himmel
        ctx.fillRect(0, 0, this.width, this.height)
        
        // Rita bakgrunder med fixerad kamera
        this.backgrounds.forEach(bg => bg.draw(ctx, this.camera))
        
        // Rita floating clouds
        this.backgroundObjects.forEach(obj => obj.draw(ctx, this.camera))
        
        // Rita mark
        this.platforms.forEach(platform => platform.draw(ctx, this.camera))
        
        // Rita obstacles
        this.obstacles.forEach(obstacle => obstacle.draw(ctx, this.camera))
        
        // Rita spelaren
        this.player.draw(ctx, this.camera)
        
        // Rita UI
        this.ui.draw(ctx)
        
        // Rita meny
        if (this.currentMenu) {
            this.currentMenu.draw(ctx)
        }
        
        // Debug mode
        if (this.debug) {
            this.drawDebug(ctx)
        }
    }
    
    drawDebug(ctx) {
        ctx.save()
        
        // Rita hitboxes
        ctx.strokeStyle = '#00FF00'
        ctx.lineWidth = 2
        
        // Player hitbox
        const playerScreenX = this.player.position.x - this.camera.position.x
        const playerScreenY = this.player.position.y - this.camera.position.y
        ctx.strokeRect(playerScreenX, playerScreenY, this.player.width, this.player.height)
        
        // Platform hitboxes
        ctx.strokeStyle = '#FFFF00'
        this.platforms.forEach(platform => {
            const screenX = platform.position.x - this.camera.position.x
            const screenY = platform.position.y - this.camera.position.y
            ctx.strokeRect(screenX, screenY, platform.width, platform.height)
        })
        
        // Obstacle hitboxes
        ctx.strokeStyle = '#FF0000'
        this.obstacles.forEach(obstacle => {
            const screenX = obstacle.position.x - this.camera.position.x
            const screenY = obstacle.position.y - this.camera.position.y
            ctx.strokeRect(screenX, screenY, obstacle.width, obstacle.height)
        })
        
        // Debug info text
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '16px monospace'
        ctx.fillText(`Debug Mode (P to toggle)`, 10, this.height - 60)
        ctx.fillText(`Obstacles: ${this.obstacles.length}`, 10, this.height - 40)
        ctx.fillText(`Player pos: (${Math.round(this.player.position.x)}, ${Math.round(this.player.position.y)})`, 10, this.height - 20)
        
        ctx.restore()
    }
    
    gameOver() {
        this.gameState = 'GAME_OVER'
        
        // Skapa Game Over menu
        this.currentMenu = new GameOverMenu(
            this,
            this.score,
            this.playTime,
            () => this.restart(),
            () => this.returnToMainMenu()
        )
    }
    
    returnToMainMenu() {
        this.init()
    }
}
