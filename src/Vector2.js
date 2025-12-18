/**
 * Vector2 - 2D Vector class för position, hastighet och riktning
 * 
 * Förenklar matematiska operationer och gör koden mer läsbar.
 * Används för position, velocity, acceleration, etc.
 */
export default class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }

    /**
     * Skapa en kopia av denna vektor
     */
    clone() {
        return new Vector2(this.x, this.y)
    }

    /**
     * Kopiera värden från en annan vektor
     */
    copy(other) {
        this.x = other.x
        this.y = other.y
        return this
    }

    /**
     * Sätt x och y värden
     */
    set(x, y) {
        this.x = x
        this.y = y
        return this
    }

    // ===== ADDITION =====

    /**
     * Addera en vektor (returnerar ny vektor)
     */
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y)
    }

    /**
     * Addera en vektor in-place (ändrar denna vektor)
     */
    addInPlace(other) {
        this.x += other.x
        this.y += other.y
        return this
    }

    /**
     * Addera en skalad vektor: this + (other * scalar)
     * Användbart för: position += velocity * deltaTime
     */
    addScaled(other, scalar) {
        this.x += other.x * scalar
        this.y += other.y * scalar
        return this
    }

    // ===== SUBTRAKTION =====

    /**
     * Subtrahera en vektor (returnerar ny vektor)
     */
    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y)
    }

    /**
     * Subtrahera en vektor in-place
     */
    subtractInPlace(other) {
        this.x -= other.x
        this.y -= other.y
        return this
    }

    // ===== MULTIPLIKATION =====

    /**
     * Multiplicera med scalar (returnerar ny vektor)
     */
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar)
    }

    /**
     * Multiplicera med scalar in-place
     */
    multiplyInPlace(scalar) {
        this.x *= scalar
        this.y *= scalar
        return this
    }

    // ===== DIVISION =====

    /**
     * Dividera med scalar (returnerar ny vektor)
     */
    divide(scalar) {
        if (scalar === 0) {
            console.warn('Vector2: Division by zero')
            return this.clone()
        }
        return new Vector2(this.x / scalar, this.y / scalar)
    }

    /**
     * Dividera med scalar in-place
     */
    divideInPlace(scalar) {
        if (scalar === 0) {
            console.warn('Vector2: Division by zero')
            return this
        }
        this.x /= scalar
        this.y /= scalar
        return this
    }

    // ===== LÄNGD OCH DISTANS =====

    /**
     * Längd (magnitude) av vektorn
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    /**
     * Längd i kvadrat (snabbare, använd för jämförelser)
     */
    lengthSquared() {
        return this.x * this.x + this.y * this.y
    }

    /**
     * Distans till en annan vektor
     */
    distanceTo(other) {
        const dx = this.x - other.x
        const dy = this.y - other.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    /**
     * Distans i kvadrat (snabbare, använd för jämförelser)
     */
    distanceSquaredTo(other) {
        const dx = this.x - other.x
        const dy = this.y - other.y
        return dx * dx + dy * dy
    }

    // ===== NORMALISERING =====

    /**
     * Normalisera vektorn (gör längden = 1)
     * Returnerar ny vektor
     */
    normalize() {
        const len = this.length()
        if (len === 0) {
            return new Vector2(0, 0)
        }
        return new Vector2(this.x / len, this.y / len)
    }

    /**
     * Normalisera in-place
     */
    normalizeInPlace() {
        const len = this.length()
        if (len === 0) {
            return this
        }
        this.x /= len
        this.y /= len
        return this
    }

    // ===== DOT OCH CROSS =====

    /**
     * Dot product (skalärprodukt)
     * Användbart för: projektion, vinkel mellan vektorer
     */
    dot(other) {
        return this.x * other.x + this.y * other.y
    }

    /**
     * Cross product (2D version, returnerar scalar)
     * Användbart för: rotation, sidokontroll
     */
    cross(other) {
        return this.x * other.y - this.y * other.x
    }

    // ===== ROTATION =====

    /**
     * Rotera vektorn med en vinkel (radianer)
     */
    rotate(angle) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        )
    }

    /**
     * Rotera in-place
     */
    rotateInPlace(angle) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const newX = this.x * cos - this.y * sin
        const newY = this.x * sin + this.y * cos
        this.x = newX
        this.y = newY
        return this
    }

    // ===== VINKEL =====

    /**
     * Vinkel av vektorn (radianer)
     */
    angle() {
        return Math.atan2(this.y, this.x)
    }

    /**
     * Vinkel till en annan vektor
     */
    angleTo(other) {
        return Math.atan2(other.y - this.y, other.x - this.x)
    }

    // ===== UTILITY =====

    /**
     * Begränsa vektorns längd till ett max-värde
     */
    limit(max) {
        const lengthSq = this.lengthSquared()
        if (lengthSq > max * max) {
            return this.normalize().multiplyInPlace(max)
        }
        return this
    }

    /**
     * Interpolate (lerp) mot en annan vektor
     * t = 0 ger denna vektor, t = 1 ger other
     */
    lerp(other, t) {
        return new Vector2(
            this.x + (other.x - this.x) * t,
            this.y + (other.y - this.y) * t
        )
    }

    /**
     * Kolla om vektorn är nära noll
     */
    isNearZero(epsilon = 0.0001) {
        return Math.abs(this.x) < epsilon && Math.abs(this.y) < epsilon
    }

    /**
     * Kolla om två vektorer är lika (inom epsilon)
     */
    equals(other, epsilon = 0.0001) {
        return Math.abs(this.x - other.x) < epsilon &&
               Math.abs(this.y - other.y) < epsilon
    }

    /**
     * ToString för debugging
     */
    toString() {
        return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`
    }

    // ===== STATISKA METODER =====

    /**
     * Skapa en noll-vektor
     */
    static zero() {
        return new Vector2(0, 0)
    }

    /**
     * Skapa en en-vektor
     */
    static one() {
        return new Vector2(1, 1)
    }

    /**
     * Skapa en upp-vektor
     */
    static up() {
        return new Vector2(0, -1)
    }

    /**
     * Skapa en ner-vektor
     */
    static down() {
        return new Vector2(0, 1)
    }

    /**
     * Skapa en vänster-vektor
     */
    static left() {
        return new Vector2(-1, 0)
    }

    /**
     * Skapa en höger-vektor
     */
    static right() {
        return new Vector2(1, 0)
    }

    /**
     * Skapa vektor från vinkel och längd
     */
    static fromAngle(angle, length = 1) {
        return new Vector2(
            Math.cos(angle) * length,
            Math.sin(angle) * length
        )
    }

    /**
     * Distans mellan två vektorer (statisk version)
     */
    static distance(a, b) {
        const dx = a.x - b.x
        const dy = a.y - b.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    /**
     * Lerp mellan två vektorer (statisk version)
     */
    static lerp(a, b, t) {
        return new Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
        )
    }
}
