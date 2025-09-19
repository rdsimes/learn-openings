// Opening management for chess application
import { initializeOpeningBook, openingNames, getOpeningBook, getLineNames } from './openingBook.js';

export class OpeningManager {
    constructor(chessBoardManager, uiManager) {
        this.chessBoardManager = chessBoardManager;
        this.uiManager = uiManager;
        this.openingBook = {};
        this.lineNames = {};
        this.selectedOpening = null;
        this.selectedLine = null;
        this.isPlaying = false;
    }

    async initialize() {
        try {
            console.log('🎯 OpeningManager: Initializing...');
            this.openingBook = await initializeOpeningBook();
            this.lineNames = getLineNames();
            
            this.updateOpeningMenu();
            console.log('🎯 OpeningManager: Initialization complete');
            return true;
        } catch (error) {
            console.error('Failed to initialize opening manager:', error);
            this.uiManager.showError('Could not load opening book from PGN files');
            return false;
        }
    }

    updateOpeningMenu() {
        Object.keys(this.openingBook).forEach(openingKey => {
            const linesContainer = document.getElementById(openingKey + '-lines');
            if (linesContainer) {
                // Clear existing lines
                linesContainer.innerHTML = '';
                
                // Add lines from the loaded opening book
                Object.keys(this.openingBook[openingKey]).forEach(lineKey => {
                    const lineDiv = this.createOpeningLineElement(openingKey, lineKey);
                    linesContainer.appendChild(lineDiv);
                });
            }
        });
    }

    createOpeningLineElement(openingKey, lineKey) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'opening-line';
        lineDiv.setAttribute('data-opening', openingKey);
        lineDiv.setAttribute('data-line', lineKey);
        lineDiv.textContent = this.lineNames[lineKey] || lineKey;
        
        lineDiv.addEventListener('click', () => {
            this.selectOpening(openingKey, lineKey, lineDiv);
        });
        
        return lineDiv;
    }

    selectOpening(opening, line, element) {
        // Remove previous selection
        document.querySelectorAll('.opening-line').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selection to clicked element
        element.classList.add('selected');
        
        // Store selection
        this.selectedOpening = opening;
        this.selectedLine = line;
        
        // Update board title
        this.updateBoardTitle(opening, line);
        
        // Update UI
        this.uiManager.enablePlayButton();
        this.uiManager.setGameInfo(
            `Selected: ${openingNames[opening]} - ${this.lineNames[line] || line}`
        );
    }

    updateBoardTitle(opening, line) {
        const titleElement = document.querySelector('.board-section h1');
        if (titleElement) {
            const openingDisplayName = openingNames[opening] || opening;
            const lineDisplayName = this.lineNames[line] || line;
            titleElement.textContent = `${openingDisplayName} - ${lineDisplayName}`;
        }
    }

    resetBoardTitle() {
        const titleElement = document.querySelector('.board-section h1');
        if (titleElement) {
            titleElement.textContent = 'Interactive Chess Board';
        }
    }

    async playOpening() {
        if (!this.selectedOpening || !this.selectedLine || this.isPlaying) {
            return;
        }

        this.isPlaying = true;
        
        // Reset the game first
        this.chessBoardManager.reset();
        
        // Update UI to show opening is being played
        this.uiManager.setStatus('Playing opening...');
        
        try {
            await this.playOpeningMoves();
        } catch (error) {
            console.error('Error playing opening:', error);
            this.uiManager.setStatus('Error playing opening');
        } finally {
            this.isPlaying = false;
        }
    }

    async playOpeningMoves() {
        const moves = this.openingBook[this.selectedOpening][this.selectedLine];
        const moveList = this.parseMoveString(moves);
        
        for (let moveIndex = 0; moveIndex < moveList.length; moveIndex++) {
            const movePair = moveList[moveIndex].trim().split(/\s+/);
            
            // Play white move
            if (movePair[0]) {
                await this.playMove(movePair[0], 'white');
                await this.delay(400);
            }
            
            // Play black move
            if (movePair[1]) {
                await this.playMove(movePair[1], 'black');
                if (moveIndex < moveList.length - 1) {
                    await this.delay(800);
                }
            }
        }
        
        // Opening playback complete
        const game = this.chessBoardManager.getGame();
        this.uiManager.setStatus(
            `Opening complete - ${game.turn() === 'w' ? 'White' : 'Black'} to move`
        );
    }

    async playMove(moveNotation, color) {
        try {
            const move = this.chessBoardManager.makeMove(moveNotation);
            if (move) {
                console.log(`Played ${color} move: ${move.san}`);
            }
        } catch (error) {
            console.error(`Error playing ${color} move:`, moveNotation, error);
        }
    }

    parseMoveString(moves) {
        return moves.split(/\d+\.\s*/).filter(move => move.trim());
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    toggleCategory(categoryId) {
        const lines = document.getElementById(categoryId + '-lines');
        if (lines) {
            lines.classList.toggle('expanded');
        }
    }

    // Getters
    getSelectedOpening() {
        return this.selectedOpening;
    }

    getSelectedLine() {
        return this.selectedLine;
    }

    getOpeningBook() {
        return this.openingBook;
    }

    getLineNames() {
        return this.lineNames;
    }
}
