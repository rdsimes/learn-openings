import { ChessBoardManager } from './chessBoardManager.js';
import { ChessUIManager } from './chessUIManager.js';
import { OpeningManager } from './openingManager.js';

// Application class for better organization
class ChessApplication {
    constructor() {
        this.chessBoardManager = null;
        this.uiManager = null;
        this.openingManager = null;
    }

    async initialize() {
        try {
            // Check if required dependencies are available
            this.checkDependencies();

            // Initialize chess board manager
            this.chessBoardManager = new ChessBoardManager();
            await this.chessBoardManager.initialize('chessboard');

            // Initialize UI manager
            this.uiManager = new ChessUIManager(this.chessBoardManager);

            // Initialize opening manager
            this.openingManager = new OpeningManager(this.chessBoardManager, this.uiManager);
            await this.openingManager.initialize();

            // Connect board reset event to opening manager
            this.chessBoardManager.onGameReset = () => this.openingManager.resetBoardTitle();
            
            // Set opening manager reference in board manager for test mode
            this.chessBoardManager.setOpeningManager(this.openingManager);

            // Make functions globally available for onclick handlers
            this.exposeGlobalFunctions();

            console.log('✅ Chess application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize chess application:', error);
            throw error;
        }
    }

    checkDependencies() {
        if (typeof $ === 'undefined') {
            throw new Error('jQuery not found. Make sure it is loaded.');
        }
        
        if (typeof Chessboard === 'undefined') {
            throw new Error('Chessboard.js not found. Make sure it is loaded.');
        }
    }

    exposeGlobalFunctions() {
        // Expose methods for HTML onclick handlers
        window.resetGame = () => this.chessBoardManager.reset();
        window.flipBoard = () => this.chessBoardManager.flip();
        window.undoMove = () => this.chessBoardManager.undo();
        window.playOpening = () => this.openingManager.playOpening();
        window.testOpening = () => this.openingManager.testOpening();
        window.toggleCategory = (categoryId) => this.openingManager.toggleCategory(categoryId);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    const app = new ChessApplication();
    
    try {
        await app.initialize();
    } catch (error) {
        console.error('Application initialization failed:', error);
        
        // Show error in UI if possible
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'Application failed to load: ' + error.message;
        }
    }
});
