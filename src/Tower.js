import GameObject from './GameObject.js'
import Vector2 from './Vector2.js'

/**
 * Tower - Component-based tower system
 * 
 * Branch 24: Towers använder nu components för behavior.
 * Detta tillåter oss att kombinera olika behaviors för att skapa olika tower types.
 * 
 * Composition > Inheritance
 */
export default class Tower extends GameObject {
    /**
     * @param {Object} game - Game instance
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {Object} towerType - Tower type config from TowerTypes.js
     */
    constructor(game, x, y, towerType) {
        super(game, x, y, 64, 64)
        
        // Tower type info
        this.towerType = towerType
        this.name = towerType.name
        this.description = towerType.description
        
        // Visuellt från config
        this.color = towerType.color
        this.barrelColor = towerType.barrelColor
        
        // Components array
        this.components = []
        
        // Targeting (används av components)
        this.currentTarget = null
        this.targetAngle = 0
        
        // Stats för UI
        this.kills = 0
        this.totalDamage = 0
        
        // Lägg till components från config
        this.setupComponents(towerType.components)
    }
    
    /**
     * Setup components från tower type config
     */
    setupComponents(componentConfigs) {
        componentConfigs.forEach(componentConfig => {
            const ComponentClass = componentConfig.type
            const config = componentConfig.config || {}
            
            const component = new ComponentClass(this, config)
            this.addComponent(component)
        })
    }
    
    /**
     * Lägg till en component
     */
    addComponent(component) {
        this.components.push(component)
        
        if (component.onAdd) {
            component.onAdd()
        }
    }
    
    /**
     * Ta bort en component
     */
    removeComponent(component) {
        const index = this.components.indexOf(component)
        if (index !== -1) {
            if (component.onRemove) {
                component.onRemove()
            }
            this.components.splice(index, 1)
        }
    }
    
    /**
     * Hämta component by type
     */
    getComponent(ComponentClass) {
        return this.components.find(c => c instanceof ComponentClass)
    }
    
    /**
     * Uppdatera tower - kör alla components
     * @param {number} deltaTime - Tid sedan förra frame
     */
    update(deltaTime) {
        // Uppdatera alla components
        this.components.forEach(component => {
            if (component.enabled) {
                component.update(deltaTime)
            }
        })
    }
    
    /**
     * Kallas när tower får en kill
     */
    registerKill() {
        this.kills++
    }
    
    /**
     * Kallas när tower gör skada
     * @param {number} damage - Skada som gjordes
     */
    registerDamage(damage) {
        this.totalDamage += damage
    }
    
    /**
     * Rita tower
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Camera} [camera=null] - Optional camera
     */
    draw(ctx, camera = null) {
        const offsetX = camera ? camera.position.x : 0
        const offsetY = camera ? camera.position.y : 0
        
        const screenX = this.position.x - offsetX
        const screenY = this.position.y - offsetY
        
        // Rita tower base (fyrkant)
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
        
        // Rita tower kant
        ctx.strokeStyle = this.barrelColor
        ctx.lineWidth = 3
        ctx.strokeRect(screenX, screenY, this.width, this.height)
        
        // Rita barrel (riktad mot target)
        ctx.save()
        ctx.translate(
            screenX + this.width / 2,
            screenY + this.height / 2
        )
        ctx.rotate(this.targetAngle)
        
        // Barrel
        ctx.fillStyle = this.barrelColor
        ctx.fillRect(0, -4, 30, 8)
        
        ctx.restore()
        
        // Rita components (range circles, effects, etc)
        this.components.forEach(component => {
            if (component.draw) {
                component.draw(ctx, camera)
            }
        })
        
        // Rita tower name (om debug)
        if (this.game.inputHandler.debugMode) {
            ctx.fillStyle = 'white'
            ctx.font = '10px Arial'
            ctx.fillText(
                this.towerType.id.toUpperCase(),
                screenX,
                screenY - 5
            )
        }
    }
}
