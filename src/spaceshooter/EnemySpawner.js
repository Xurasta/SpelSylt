import SpaceEnemy from './SpaceEnemy.js'
import BossEnemy from './BossEnemy.js'

export default class EnemySpawner {
    constructor(game) {
        this.game = game
        
        // Regular enemy spawning
        this.enemySpawnTimer = 0
        this.enemySpawnInterval = 1500 // Initial spawn interval
        this.minSpawnInterval = 500
        this.spawnIntervalDecrease = 50
        
        // Boss spawning
        this.bossActive = false
        this.bossLevel = 0
        this.nextBossScore = 2000 // First boss at 2000 points
        this.bossScoreInterval = 3000 // Need 3000 more points for next boss
        
        // Mini enemies during boss fight
        this.bossEnemySpawnTimer = 0
        this.bossEnemySpawnInterval = 3000
        
        // Enemy type configurations - easy to add new types!
        this.enemyTypes = {
            random: () => Math.floor(Math.random() * 12), // Any of 12 types
            tiny: () => [3, 7, 11][Math.floor(Math.random() * 3)], // Small enemies
            medium: () => [1, 5, 9][Math.floor(Math.random() * 3)],
            large: () => [0, 4, 8][Math.floor(Math.random() * 3)]
        }
    }
    
    reset() {
        this.enemySpawnTimer = 0
        this.enemySpawnInterval = 1500
        this.bossActive = false
        this.bossLevel = 0
        this.nextBossScore = 2000
        this.bossEnemySpawnTimer = 0
    }
    
    update(deltaTime) {
        if (this.game.gameState !== 'PLAYING') return
        
        // Check if boss should spawn
        if (!this.bossActive && this.game.score >= this.nextBossScore) {
            this.spawnBoss()
        }
        
        // Regular enemy spawning (when no boss)
        if (!this.bossActive) {
            this.updateRegularSpawning(deltaTime)
        } else {
            this.updateBossPhaseSpawning(deltaTime)
        }
    }
    
    updateRegularSpawning(deltaTime) {
        this.enemySpawnTimer += deltaTime
        
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.spawnEnemy('random')
            this.enemySpawnTimer = 0
            
            // Progressive difficulty
            if (this.enemySpawnInterval > this.minSpawnInterval) {
                this.enemySpawnInterval -= this.spawnIntervalDecrease
            }
        }
    }
    
    updateBossPhaseSpawning(deltaTime) {
        // Spawn occasional small enemies for powerups
        this.bossEnemySpawnTimer += deltaTime
        
        if (this.bossEnemySpawnTimer >= this.bossEnemySpawnInterval) {
            this.spawnEnemy('tiny')
            this.bossEnemySpawnTimer = 0
        }
        
        // Check if boss is defeated
        const bossExists = this.game.enemies.some(enemy => enemy instanceof BossEnemy)
        if (!bossExists) {
            this.bossActive = false
            this.bossEnemySpawnTimer = 0
        }
    }
    
    spawnEnemy(typeKey = 'random', x = null, y = -60) {
        // Random X if not specified
        if (x === null) {
            x = Math.random() * (this.game.width - 50)
        }
        
        // Get enemy type from configuration
        const enemyType = this.enemyTypes[typeKey]()
        
        const enemy = new SpaceEnemy(this.game, x, y, 50, 50, enemyType)
        this.game.enemies.push(enemy)
        
        return enemy
    }
    
    spawnBoss() {
        const x = this.game.width / 2 - 75 // Center the 150px wide boss
        const y = -240
        
        const boss = new BossEnemy(this.game, x, y, this.bossLevel)
        this.game.enemies.push(boss)
        
        this.bossActive = true
        this.bossLevel++
        this.nextBossScore += this.bossScoreInterval
        
        return boss
    }
    
    // Easy to add new spawn patterns!
    spawnWave(count, typeKey = 'random', formation = 'line') {
        const enemies = []
        
        switch (formation) {
            case 'line':
                const spacing = this.game.width / (count + 1)
                for (let i = 0; i < count; i++) {
                    const x = spacing * (i + 1) - 25
                    enemies.push(this.spawnEnemy(typeKey, x))
                }
                break
                
            case 'V':
                // Could implement V formation
                break
                
            case 'random':
            default:
                for (let i = 0; i < count; i++) {
                    enemies.push(this.spawnEnemy(typeKey))
                }
                break
        }
        
        return enemies
    }
    
    // Could add special events
    spawnMiniBoss() {
        // Spawn a tough enemy but not full boss
        const x = Math.random() * (this.game.width - 60)
        const enemy = this.spawnEnemy('large', x)
        enemy.health *= 2 // Make it tougher
        enemy.points *= 2
        return enemy
    }
}
