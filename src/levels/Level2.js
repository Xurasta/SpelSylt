import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'
import Enemy from '../Enemy.js'
import Background from '../Background.js'
import BackgroundObject from '../BackgroundObject.js'
import pinkBg from '../assets/Pixel Adventure 1/Background/Pink.png'
import bigClouds from '../assets/clouds/Big Clouds.png'
import cloud1 from '../assets/clouds/Small Cloud 1.png'
import cloud2 from '../assets/clouds/Small Cloud 2.png'

/**
 * Level 2 - Andra nivån med svårare utmaningar
 * Fler fiender, högre plattformar, mer precision krävs
 * Rosa himmel för att signalera svårare level (skymning/kväll)
 */
export default class Level2 extends Level {
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
            // Far background - rosa himmel (skymning känsla, svårare level)
            new Background(this.game, pinkBg, {
                tiled: true,
                tileWidth: 64,
                tileHeight: 64,
                scrollSpeed: 0.3
            }),
            // Mid background - stora moln
            new Background(this.game, bigClouds, {
                tiled: true,
                tileWidth: 448,
                tileHeight: 101,
                tileY: false,
                scrollSpeed: 0.6,
                yPosition: this.game.height - 141,
                height: 101
            })
        ]
    }

    createBackgroundObjects() {
        const height = this.game.height

        this.backgroundObjects = [
            // Fler och snabbare moln för svårare level
            new BackgroundObject(this.game, 150, height - 320, cloud1, {
                speed: 0.025,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 500, height - 280, cloud2, {
                speed: 0.02,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 900, height - 300, cloud1, {
                speed: 0.028,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 1300, height - 260, cloud2, {
                speed: 0.022,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 1700, height - 340, cloud1, {
                speed: 0.026,
                scrollSpeed: 0.4
            }),
            new BackgroundObject(this.game, 2100, height - 290, cloud2, {
                speed: 0.024,
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
            
            // Svårare plattformar - högre hopp, längre gap
            new Platform(this.game, 200, height - 180, 100, 20, '#8B4513'),
            new Platform(this.game, 450, height - 280, 80, 20, '#8B4513'),
            new Platform(this.game, 700, height - 200, 120, 20, '#8B4513'),
            new Platform(this.game, 950, height - 320, 100, 20, '#8B4513'),
            new Platform(this.game, 1200, height - 240, 90, 20, '#8B4513'),
            new Platform(this.game, 1450, height - 360, 110, 20, '#8B4513'),
            new Platform(this.game, 1700, height - 280, 100, 20, '#8B4513'),
            new Platform(this.game, 1950, height - 200, 120, 20, '#8B4513'),
            new Platform(this.game, 2200, height - 320, 100, 20, '#8B4513'),
        ]
    }

    createCoins() {
        const height = this.game.height

        this.coins = [
            // Mynt placerade strategiskt på svåra platser
            new Coin(this.game, 250, height - 220),
            new Coin(this.game, 500, height - 320),
            new Coin(this.game, 750, height - 240),
            new Coin(this.game, 790, height - 240),
            new Coin(this.game, 1000, height - 360),
            new Coin(this.game, 1250, height - 280),
            new Coin(this.game, 1500, height - 400),
            new Coin(this.game, 1540, height - 400),
            new Coin(this.game, 1750, height - 320),
            new Coin(this.game, 2000, height - 240),
            new Coin(this.game, 2250, height - 360),
            new Coin(this.game, 2290, height - 360),
        ]
    }

    createEnemies() {
        const height = this.game.height

        this.enemies = [
            // Fler och snabbare fiender
            new Enemy(this.game, 300, height - 220, 40, 40, 100),
            new Enemy(this.game, 600, height - 240, 40, 40, 120),
            new Enemy(this.game, 850, height - 360, 40, 40, 80),
            new Enemy(this.game, 1100, height - 280, 40, 40, 150),
            new Enemy(this.game, 1350, height - 400, 40, 40, 90),
            new Enemy(this.game, 1600, height - 320, 40, 40, 120),
            new Enemy(this.game, 1850, height - 240, 40, 40, 100),
            new Enemy(this.game, 2100, height - 360, 40, 40, 130),
        ]
    }
}
