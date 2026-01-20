import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'
import Enemy from '../Enemy.js'
import Background from '../Background.js'
import BackgroundObject from '../BackgroundObject.js'
import blueBg from '../assets/Pixel Adventure 1/Background/Blue.png'
import bigClouds from '../assets/clouds/Big Clouds.png'
import cloud1 from '../assets/clouds/Small Cloud 1.png'
import cloud2 from '../assets/clouds/Small Cloud 2.png'
import cloud3 from '../assets/clouds/Small Cloud 3.png'

/**
 * Level 1 - Den första nivån i spelet
 * Enklare layout för att introducera spelmekaniker
 */
export default class Level1 extends Level {
    constructor(game) {
        super(game)
        
        // Player spawn position för denna level
        this.playerSpawnX = 50
        this.playerSpawnY = 50
        
        // Initiera level
        this.init()
    }

    createBackgrounds() {
        this.backgrounds = [
            // Far background - blå himmel
            new Background(this.game, blueBg, {
                tiled: true,
                tileWidth: 64,
                tileHeight: 64,
                scrollSpeed: 0.3 // Långsam parallax (långt bort)
            }),
            // Mid background - stora moln
            new Background(this.game, bigClouds, {
                tiled: true,
                tileWidth: 448,
                tileHeight: 101,
                tileY: false, // Tila bara horisontellt
                scrollSpeed: 0.6, // Mellan-parallax
                yPosition: this.game.height - 141, // Precis ovanför marken
                height: 101
            })
        ]
    }

    createBackgroundObjects() {
        const height = this.game.height

        this.backgroundObjects = [
            // Små moln som rör sig oberoende
            new BackgroundObject(this.game, 200, height - 300, cloud1, {
                speed: 0.02,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 600, height - 250, cloud2, {
                speed: 0.015,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 1200, height - 280, cloud3, {
                speed: 0.018,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 1800, height - 320, cloud1, {
                speed: 0.022,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 2200, height - 260, cloud2, {
                speed: 0.016,
                scrollSpeed: 0.4
            })
        ]
    }

    createPlatforms() {
        const height = this.game.height
        const worldWidth = this.game.worldWidth

        this.platforms = [
            // Marken (hela nivån)
            new Platform(this.game, 0, height - 40, worldWidth, 40, '#654321'),
            
            // Plattformar (utspridda över nivån)
            new Platform(this.game, 150, height - 140, 150, 20, '#8B4513'),
            new Platform(this.game, 400, height - 200, 120, 20, '#8B4513'),
            new Platform(this.game, 100, height - 280, 100, 20, '#8B4513'),
            new Platform(this.game, 550, height - 160, 100, 20, '#8B4513'),
            new Platform(this.game, 350, height - 320, 140, 20, '#8B4513'),
            // Nya plattformar längre bort
            new Platform(this.game, 900, height - 180, 140, 20, '#8B4513'),
            new Platform(this.game, 1100, height - 240, 120, 20, '#8B4513'),
            new Platform(this.game, 1300, height - 160, 100, 20, '#8B4513'),
            new Platform(this.game, 1500, height - 280, 150, 20, '#8B4513'),
            new Platform(this.game, 1750, height - 200, 120, 20, '#8B4513'),
            new Platform(this.game, 1950, height - 320, 140, 20, '#8B4513'),
            new Platform(this.game, 2150, height - 180, 100, 20, '#8B4513'),
        ]
    }

    createCoins() {
        const height = this.game.height

        this.coins = [
            new Coin(this.game, 200, height - 180),
            new Coin(this.game, 240, height - 180),
            new Coin(this.game, 450, height - 240),
            new Coin(this.game, 150, height - 320),
            new Coin(this.game, 190, height - 320),
            new Coin(this.game, 600, height - 200),
            new Coin(this.game, 380, height - 360),
            new Coin(this.game, 420, height - 360),
            // Nya mynt längre bort
            new Coin(this.game, 950, height - 220),
            new Coin(this.game, 1150, height - 280),
            new Coin(this.game, 1350, height - 200),
            new Coin(this.game, 1550, height - 320),
            new Coin(this.game, 1800, height - 240),
            new Coin(this.game, 2000, height - 360),
            new Coin(this.game, 2200, height - 220),
        ]
    }

    createEnemies() {
        const height = this.game.height

        this.enemies = [
            new Enemy(this.game, 200, height - 220, 40, 40, 80),
            new Enemy(this.game, 450, height - 240, 40, 40),
            new Enemy(this.game, 360, height - 440, 40, 40, 50),
            // Nya fiender längre bort
            new Enemy(this.game, 1000, height - 220, 40, 40, 100),
            new Enemy(this.game, 1400, height - 200, 40, 40),
            new Enemy(this.game, 1800, height - 240, 40, 40, 150),
        ]
    }
}
