import GameObject from './GameObject.js'
import Vector2 from './Vector2.js'
import runSprite from './assets/Pixel Adventure 1/Main Characters/Mask Dude/Run (32x32).png'
import jumpSprite from './assets/Pixel Adventure 1/Main Characters/Mask Dude/Jump (32x32).png'
import fallSprite from './assets/Pixel Adventure 1/Main Characters/Mask Dude/Fall (32x32).png'

export default class Player extends GameObject {
    constructor(game, x, y, width, height, color) {
        super(game, x, y, width, height)
        this.color = color
        
        // Velocity som Vector2 (pixels per millisekund)
        this.velocity = new Vector2(0, 0)
        
        // Fysik egenskaper
        this.jumpPower = -0.7 // Starkare hopp för runner
        this.isGrounded = false
        
        // Sprite animation system
        this.loadSprite('run', runSprite, 12, 60) // Snabbare animation för runner
        this.loadSprite('jump', jumpSprite, 1)
        this.loadSprite('fall', fallSprite, 1)
        
        this.currentAnimation = 'run' // Börja med run i runner
    }

    update(deltaTime) {
        // Hopp - space eller upper arrow
        if ((this.game.inputHandler.keys.has(' ') || this.game.inputHandler.keys.has('ArrowUp')) && this.isGrounded) {
            this.velocity.y = this.jumpPower
            this.isGrounded = false
        }

        // Applicera gravitation
        this.velocity.y += this.game.gravity * deltaTime
        
        // Applicera luftmotstånd (friktion)
        if (this.velocity.y > 0) {
            this.velocity.y -= this.game.friction * deltaTime
            if (this.velocity.y < 0) this.velocity.y = 0
        }

        // Uppdatera position med Vector2
        this.position.addScaled(this.velocity, deltaTime)
        
        // Uppdatera animation
        if (!this.isGrounded && this.velocity.y < 0) {
            this.setAnimation('jump')
        } else if (!this.isGrounded && this.velocity.y > 0) {
            this.setAnimation('fall')
        } else {
            this.setAnimation('run') // Alltid springa på marken i runner
        }
        
        // Uppdatera animation frame
        this.updateAnimation(deltaTime)
    }

    handlePlatformCollision(platform) {
        const collision = this.getCollisionData(platform)
        
        if (collision) {
            if (collision.direction === 'top' && this.velocity.y > 0) {
                // Spelaren landar på plattformen
                this.position.y = platform.position.y - this.height
                this.velocity.y = 0
                this.isGrounded = true
            } else if (collision.direction === 'bottom' && this.velocity.y < 0) {
                // Spelaren träffar huvudet
                this.position.y = platform.position.y + platform.height
                this.velocity.y = 0
            }
        }
    }

    draw(ctx, camera = null) {
        // Beräkna screen position
        const screenX = camera ? this.position.x - camera.position.x : this.position.x
        const screenY = camera ? this.position.y - camera.position.y : this.position.y
        
        // Försök rita sprite, annars fallback till rektangel
        const spriteDrawn = this.drawSprite(ctx, camera, false)
        
        if (!spriteDrawn) {
            // Fallback: Rita spelaren som en rektangel
            ctx.fillStyle = this.color
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
    }
}
