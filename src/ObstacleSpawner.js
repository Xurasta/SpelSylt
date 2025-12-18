import Obstacle from './Obstacle.js'

export default class ObstacleSpawner {
    constructor(game) {
        this.game = game
        this.spawnTimer = 0
        this.minSpawnInterval = 1200 // millisekunder
        this.maxSpawnInterval = 2500
        this.nextSpawnTime = this.getRandomSpawnTime()
        
        // Svårighetsökning
        this.difficultyTimer = 0
        this.difficultyInterval = 10000 // Öka svårighet var 10:e sekund
    }
    
    getRandomSpawnTime() {
        return Math.random() * (this.maxSpawnInterval - this.minSpawnInterval) + this.minSpawnInterval
    }
    
    update(deltaTime) {
        this.spawnTimer += deltaTime
        this.difficultyTimer += deltaTime
        
        // Öka svårighet över tid
        if (this.difficultyTimer >= this.difficultyInterval) {
            this.difficultyTimer = 0
            // Gör det svårare genom att minska spawn-intervallet
            this.minSpawnInterval = Math.max(800, this.minSpawnInterval - 100)
            this.maxSpawnInterval = Math.max(1500, this.maxSpawnInterval - 150)
        }
        
        // Spawna nytt hinder
        if (this.spawnTimer >= this.nextSpawnTime) {
            this.spawn()
            this.spawnTimer = 0
            this.nextSpawnTime = this.getRandomSpawnTime()
        }
    }
    
    spawn() {
        const types = ['cactus', 'bird', 'rock']
        const type = types[Math.floor(Math.random() * types.length)]
        
        let x = this.game.width
        let y = this.game.height - 100 // Ground level
        let width = 30
        let height = 40
        
        // Fåglar flyger högre
        if (type === 'bird') {
            y = this.game.height - 200
            width = 40
            height = 20
        }
        
        // Stenar är bredare
        if (type === 'rock') {
            width = 40
            height = 30
        }
        
        const obstacle = new Obstacle(this.game, x, y, width, height, type)
        this.game.obstacles.push(obstacle)
    }
    
    reset() {
        this.spawnTimer = 0
        this.difficultyTimer = 0
        this.minSpawnInterval = 1200
        this.maxSpawnInterval = 2500
        this.nextSpawnTime = this.getRandomSpawnTime()
    }
}
