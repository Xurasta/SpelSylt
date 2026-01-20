import Menu from './Menu.js'
import ControlsMenu from './ControlsMenu.js'

export default class MainMenu extends Menu {
    getTitle() {
        return 'Game Menu'
    }
    
    getOptions() {
        const options = []
        
        // Visa "Continue" om det finns sparad data
        if (this.game.saveManager.hasSave()) {
            const saveInfo = this.game.saveManager.getSaveInfo()
            options.push({
                text: `Continue (Level ${saveInfo.level})`,
                key: 'c',
                action: () => {
                    this.game.loadGame()
                    this.game.inputHandler.keys.clear()
                }
            })
        }
        
        // Start Game (eller New Game om det finns en save)
        options.push({
            text: this.game.saveManager.hasSave() ? 'New Game' : 'Start Game',
            key: ' ',
            action: () => {
                this.game.restart() // Restart för att starta från början
                this.game.inputHandler.keys.clear()
            }
        })
        
        // Controls
        options.push({
            text: 'Controls',
            key: 'k',
            action: () => {
                this.game.currentMenu = new ControlsMenu(this.game)
            }
        })
        
        // Clear Save (om det finns sparad data)
        if (this.game.saveManager.hasSave()) {
            options.push({
                text: 'Delete Save',
                key: 'd',
                action: () => {
                    this.game.saveManager.clear()
                    // Uppdatera menyn för att visa nya alternativ
                    this.game.currentMenu = new MainMenu(this.game)
                }
            })
        }
        
        return options
    }
}
