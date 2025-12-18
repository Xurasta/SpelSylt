import Vector2 from './Vector2.js'

/**
 * Grid - Hanterar 2D grid för Tower Defense
 * 
 * Representerar spelplanen som rutor (tiles) där torn kan placeras.
 * Varje cell kan vara: 'empty', 'path', 'tower', 'blocked'
 * 
 * @example
 * const grid = new Grid(10, 15, 64)  // 10 rader, 15 kolumner, 64px per tile
 * const { row, col } = grid.getGridPosition(mouseX, mouseY)
 * if (grid.canBuildAt(row, col)) {
 *   const worldPos = grid.getWorldPosition(row, col)
 *   // Placera torn här
 * }
 */
export default class Grid {
    /**
     * @param {number} rows - Antal rader
     * @param {number} cols - Antal kolumner
     * @param {number} tileSize - Storlek på varje tile i pixels
     */
    constructor(rows, cols, tileSize) {
        this.rows = rows
        this.cols = cols
        this.tileSize = tileSize
        this.cells = []
        
        // Skapa 2D-array av cells
        for (let row = 0; row < rows; row++) {
            this.cells[row] = []
            for (let col = 0; col < cols; col++) {
                this.cells[row][col] = {
                    type: 'empty',  // 'empty', 'path', 'tower', 'blocked'
                    tower: null,    // Referens till torn om det finns
                    row,
                    col
                }
            }
        }
    }
    
    /**
     * Konvertera mouse/screen position till grid coordinates
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @returns {{ row: number, col: number }} Grid coordinates
     */
    getGridPosition(x, y) {
        const col = Math.floor(x / this.tileSize)
        const row = Math.floor(y / this.tileSize)
        return { row, col }
    }
    
    /**
     * Konvertera grid coordinates till world position (top-left corner)
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {Vector2} World position
     */
    getWorldPosition(row, col) {
        return new Vector2(
            col * this.tileSize,
            row * this.tileSize
        )
    }
    
    /**
     * Hämta center position av en grid cell
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {Vector2} Center world position
     */
    getCenterPosition(row, col) {
        return new Vector2(
            col * this.tileSize + this.tileSize / 2,
            row * this.tileSize + this.tileSize / 2
        )
    }
    
    /**
     * Kolla om coordinates är inom grid bounds
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {boolean}
     */
    isInBounds(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols
    }
    
    /**
     * Hämta en cell
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {Object|null} Cell object eller null om utanför bounds
     */
    getCell(row, col) {
        if (!this.isInBounds(row, col)) {
            return null
        }
        return this.cells[row][col]
    }
    
    /**
     * Sätt cell type
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @param {string} type - Cell type: 'empty', 'path', 'tower', 'blocked'
     */
    setCellType(row, col, type) {
        if (!this.isInBounds(row, col)) {
            return
        }
        this.cells[row][col].type = type
    }
    
    /**
     * Kolla om en cell är ledig för att bygga torn
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {boolean}
     */
    canBuildAt(row, col) {
        if (!this.isInBounds(row, col)) {
            return false
        }
        const cell = this.cells[row][col]
        return cell.type === 'empty'
    }
    
    /**
     * Placera torn i grid
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @param {Object} tower - Tower object
     * @returns {boolean} True om lyckades placera
     */
    placeTower(row, col, tower) {
        if (this.canBuildAt(row, col)) {
            this.cells[row][col].type = 'tower'
            this.cells[row][col].tower = tower
            return true
        }
        return false
    }
    
    /**
     * Ta bort torn från grid
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {Object|null} Tornet som togs bort, eller null
     */
    removeTower(row, col) {
        if (!this.isInBounds(row, col)) {
            return null
        }
        
        const cell = this.cells[row][col]
        if (cell.type === 'tower') {
            const tower = cell.tower
            cell.type = 'empty'
            cell.tower = null
            return tower
        }
        return null
    }
    
    /**
     * Definiera path genom grid (för enemies)
     * @param {Array<{row: number, col: number}>} pathCoords - Array av grid coordinates för path
     */
    setPath(pathCoords) {
        for (const coord of pathCoords) {
            this.setCellType(coord.row, coord.col, 'path')
        }
    }
    
    /**
     * Konvertera path coordinates till world positions (Vector2 array)
     * @param {Array<{row: number, col: number}>} pathCoords - Grid coordinates
     * @returns {Array<Vector2>} World positions (center av varje cell)
     */
    pathToWorld(pathCoords) {
        return pathCoords.map(coord => 
            this.getCenterPosition(coord.row, coord.col)
        )
    }
    
    /**
     * Hitta grannar till en cell (för pathfinding senare)
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {Array<{row: number, col: number}>} Array av grann-coordinates
     */
    getNeighbors(row, col) {
        const neighbors = []
        const directions = [
            { row: -1, col: 0 },  // Upp
            { row: 1, col: 0 },   // Ner
            { row: 0, col: -1 },  // Vänster
            { row: 0, col: 1 }    // Höger
        ]
        
        for (const dir of directions) {
            const newRow = row + dir.row
            const newCol = col + dir.col
            if (this.isInBounds(newRow, newCol)) {
                neighbors.push({ row: newRow, col: newCol })
            }
        }
        
        return neighbors
    }
    
    /**
     * Rita grid lines (för debug/editor)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Camera} [camera=null] - Optional camera
     * @param {boolean} [showPath=true] - Visa path cells
     */
    draw(ctx, camera = null, showPath = true) {
        const offsetX = camera ? camera.position.x : 0
        const offsetY = camera ? camera.position.y : 0
        
        // Rita grid lines (mer synliga)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        
        // Vertikala linjer
        for (let col = 0; col <= this.cols; col++) {
            const x = col * this.tileSize - offsetX
            ctx.beginPath()
            ctx.moveTo(x, -offsetY)
            ctx.lineTo(x, this.rows * this.tileSize - offsetY)
            ctx.stroke()
        }
        
        // Horisontella linjer
        for (let row = 0; row <= this.rows; row++) {
            const y = row * this.tileSize - offsetY
            ctx.beginPath()
            ctx.moveTo(-offsetX, y)
            ctx.lineTo(this.cols * this.tileSize - offsetX, y)
            ctx.stroke()
        }
        
        // Rita path cells (om showPath är true)
        if (showPath) {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    const cell = this.cells[row][col]
                    if (cell.type === 'path') {
                        const worldPos = this.getWorldPosition(row, col)
                        ctx.fillStyle = 'rgba(139, 69, 19, 0.8)' // Brun för path (mycket synlig)
                        ctx.fillRect(
                            worldPos.x - offsetX,
                            worldPos.y - offsetY,
                            this.tileSize,
                            this.tileSize
                        )
                        // Path outline
                        ctx.strokeStyle = 'rgba(200, 100, 50, 1)'
                        ctx.lineWidth = 2
                        ctx.strokeRect(
                            worldPos.x - offsetX,
                            worldPos.y - offsetY,
                            this.tileSize,
                            this.tileSize
                        )
                    } else if (cell.type === 'blocked') {
                        const worldPos = this.getWorldPosition(row, col)
                        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)' // Grå för blocked
                        ctx.fillRect(
                            worldPos.x - offsetX,
                            worldPos.y - offsetY,
                            this.tileSize,
                            this.tileSize
                        )
                    }
                }
            }
        }
    }
    
    /**
     * Rita hover highlight (visar vilken cell musen är över)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     * @param {Camera} [camera=null] - Optional camera
     * @param {boolean} [canBuild=true] - Visar grön om kan bygga, röd annars
     */
    drawHover(ctx, mouseX, mouseY, camera = null, canBuild = true) {
        const { row, col } = this.getGridPosition(mouseX, mouseY)
        
        if (!this.isInBounds(row, col)) {
            return
        }
        
        const worldPos = this.getWorldPosition(row, col)
        const offsetX = camera ? camera.position.x : 0
        const offsetY = camera ? camera.position.y : 0
        
        // Färg baserat på om kan bygga
        const buildable = this.canBuildAt(row, col)
        ctx.fillStyle = buildable && canBuild 
            ? 'rgba(0, 255, 0, 0.3)'    // Grön om kan bygga
            : 'rgba(255, 0, 0, 0.3)'     // Röd om inte kan bygga
        
        ctx.fillRect(
            worldPos.x - offsetX,
            worldPos.y - offsetY,
            this.tileSize,
            this.tileSize
        )
        
        // Rita kant
        ctx.strokeStyle = buildable && canBuild ? '#00ff00' : '#ff0000'
        ctx.lineWidth = 2
        ctx.strokeRect(
            worldPos.x - offsetX,
            worldPos.y - offsetY,
            this.tileSize,
            this.tileSize
        )
    }
}
