import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'
import Enemy from '../Enemy.js'
import terrainSprite from '../assets/Pixel Adventure 1/Terrain/Terrain (16x16).png'

/**
 * Level 2 - Andra nivån med svårare utmaningar
 * Fler fiender, högre plattformar, mer precision krävs
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

    createPlatforms() {
        const height = this.game.height
        const worldWidth = this.game.worldWidth

        const stoneConfig = {
            image: terrainSprite,
            sourceWidth: 16,
            sourceHeight: 16,
            tile: 'both'
        }

        const grassCornerLeftConfig = {
            image: terrainSprite,
            sourceX: 96,
            sourceY: 0,
            sourceWidth: 16,
            sourceHeight: 16,
            tile: 'none'
        }
        const mudCornerLeftConfig = {
            image: terrainSprite,
            sourceX: 96,
            sourceY: 32,
            sourceWidth: 16,
            sourceHeight: 16,
            tile: 'none'
        }
        const grassCornerRightConfig = {
            image: terrainSprite,
            sourceX: 128,
            sourceY: 0,
            sourceWidth: 16,
            sourceHeight: 16,
            tile: 'none'
        }
        const mudCornerRightConfig = {
            image: terrainSprite,
            sourceX: 128,
            sourceY: 32,
            sourceWidth: 16,
            sourceHeight: 16,
            tile: 'none'
        }

        const grassMiddleConfig = {
            image: terrainSprite,
            sourceX: 112,
            sourceY: 0,
            sourceWidth: 16,
            sourceHeight: 16,
            tile: 'horizontal'
        }

        const mudMiddleConfig = {
            image: terrainSprite,
            sourceX: 112,
            sourceY: 32,
            sourceWidth: 16,
            sourceHeight: 16,
            tile: 'none'
        }


        this.platforms = [
            // Marken (hela nivån)
            new Platform(this.game, 0, height - 32, worldWidth, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 0, height - 16, worldWidth, 16, { sprite: mudMiddleConfig }),

            // fin och snygg plattform, men ganska orimligt sätt att bygga dem på
            // detta borde ske i plattform klassen
            new Platform(this.game, 184, height - 180, 16, 16, { sprite: grassCornerLeftConfig }),
            new Platform(this.game, 200, height - 180, 100, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 300, height - 180, 16, 16, { sprite: grassCornerRightConfig }),
            new Platform(this.game, 184, height - 164, 16, 16, { sprite: mudCornerLeftConfig }),
            new Platform(this.game, 200, height - 164, 100, 16, { sprite: mudMiddleConfig }),
            new Platform(this.game, 300, height - 164, 16, 16, { sprite: mudCornerRightConfig }),


            new Platform(this.game, 450, height - 280, 80, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 700, height - 200, 120, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 950, height - 320, 100, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 1200, height - 240, 90, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 1450, height - 360, 110, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 1700, height - 280, 100, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 1950, height - 200, 120, 16, { sprite: grassMiddleConfig }),
            new Platform(this.game, 2200, height - 320, 100, 16, { sprite: grassMiddleConfig }),
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
