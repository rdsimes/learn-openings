// Opening management for chess application
import { initializeOpeningBook, openingNames, getLineNames } from './openingBook.js';
import { SpeechManager } from './speechManager.js';

export class OpeningManager {
    constructor(chessBoardManager, uiManager) {
        this.chessBoardManager = chessBoardManager;
        this.uiManager = uiManager;
        this.openingBook = {};
        this.lineNames = {};
        this.selectedOpening = null;
        this.selectedLine = null;
        this.isPlaying = false;
        this.isTestMode = false;
        this.isStartingTest = false;
        this.testMoves = [];
        this.currentTestMoveIndex = 0;
        this.speechManager = new SpeechManager();
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
        this.uiManager.enableTestButton();
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
        // Don't reset title if we're in the middle of playing an opening or in test mode
        if (this.isPlaying || this.isTestMode) {
            return;
        }
        
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
        
        // Reset the game first (title won't reset due to isPlaying flag)
        this.chessBoardManager.reset();
        
        // Update UI to show opening is being played
        this.uiManager.setStatus('Playing opening...');
        
        // Announce the start of the opening
        const openingName = openingNames[this.selectedOpening] || this.selectedOpening;
        const lineName = this.lineNames[this.selectedLine] || this.selectedLine;
        this.speechManager.speakOpeningAnnouncement(openingName, lineName);
        
        try {
            await this.playOpeningMoves();
        } catch (error) {
            console.error('Error playing opening:', error);
            this.uiManager.setStatus('Error playing opening');
        } finally {
            this.isPlaying = false;
        }
    }

    async testOpening() {
        if (!this.selectedOpening || !this.selectedLine || this.isPlaying || this.isTestMode) {
            return;
        }

        this.isTestMode = true;
        this.isStartingTest = true; // Flag to prevent reset from exiting test mode
        this.currentTestMoveIndex = 0;
        
        // Reset the game first
        this.chessBoardManager.reset();
        
        // Clear the flag after reset
        this.isStartingTest = false;
        
        // Parse the opening moves
        const moves = this.openingBook[this.selectedOpening][this.selectedLine];
        this.testMoves = this.parseMovesForTest(moves);
        
        // Update UI to show test mode
        this.uiManager.setStatus(`Test Mode: Play ${this.testMoves[0]} (move 1 of ${this.testMoves.length})`);
        this.uiManager.setGameInfo(`Testing: ${openingNames[this.selectedOpening]} - ${this.lineNames[this.selectedLine]}`);
        
        // Enable user interaction
        this.chessBoardManager.enableUserMoves();
        
        console.log('Test mode started. Expected moves:', this.testMoves);
        console.log('isTestMode:', this.isTestMode);
    }

    parseMovesForTest(moves) {
        console.log('Parsing moves for test:', moves);
        const moveList = this.parseMoveString(moves);
        console.log('Move list after parsing:', moveList);
        const allMoves = [];
        
        for (const movePair of moveList) {
            const moves = movePair.trim().split(/\s+/);
            console.log('Processing move pair:', moves);
            if (moves[0]) {
                console.log('Adding white move:', moves[0]);
                allMoves.push(moves[0]); // White move
            }
            if (moves[1]) {
                console.log('Adding black move:', moves[1]);
                allMoves.push(moves[1]); // Black move
            }
        }
        
        console.log('Final test moves array:', allMoves);
        return allMoves;
    }

    handleTestMove(move) {
        console.log('handleTestMove called with:', move);
        
        if (!this.isTestMode) {
            console.log('Not in test mode, allowing move');
            return true; // Not in test mode, allow move
        }
        
        const expectedMove = this.testMoves[this.currentTestMoveIndex];
        console.log('Test move check:', {
            expectedMove,
            actualMove: move.san,
            actualMoveFrom: move.from,
            actualMoveTo: move.to,
            actualMoveNotation: move.from + move.to
        });
        
        // Try multiple comparison methods
        const isCorrect = move.san === expectedMove || 
                         move.from + move.to === expectedMove ||
                         move.from + move.to === expectedMove.toLowerCase() ||
                         move.san === expectedMove.replace(/[+#]/g, '') || // Remove check/checkmate symbols
                         this.compareMovesWithDisambiguation(move.san, expectedMove);
        
        if (isCorrect) {
            // Correct move!
            this.currentTestMoveIndex++;
            
            if (this.currentTestMoveIndex >= this.testMoves.length) {
                // Test completed successfully
                this.uiManager.setStatus('🎉 Perfect! You completed the opening correctly!');
                this.uiManager.setGameInfo(`Test completed: ${openingNames[this.selectedOpening]} - ${this.lineNames[this.selectedLine]}`);
                this.isTestMode = false;
            } else {
                // Show next expected move
                const nextMove = this.testMoves[this.currentTestMoveIndex];
                this.uiManager.setStatus(`✅ Correct! Next: ${nextMove} (move ${this.currentTestMoveIndex + 1} of ${this.testMoves.length})`);
            }
            return true; // Allow the move
        } else {
            // Wrong move
            this.uiManager.setStatus(`❌ Wrong move! Expected: ${expectedMove}, got: ${move.san}. Try again.`);
            return false; // Reject the move
        }
    }

    exitTestMode() {
        this.isTestMode = false;
        this.isStartingTest = false;
        this.currentTestMoveIndex = 0;
        this.testMoves = [];
        this.uiManager.setStatus('Test mode ended');
    }

    compareMovesWithDisambiguation(actualMove, expectedMove) {
        // Handle disambiguation cases where expected move has disambiguation but actual doesn't
        // Example: Expected "Ncb4" vs Actual "Nb4"
        
        // If both moves are the same, they match
        if (actualMove === expectedMove) {
            return true;
        }
        
        // Check if expected move has disambiguation that actual move doesn't
        const expectedRegex = /^([NBRQK])([a-h1-8])([a-h][1-8])([+#]?)$/;
        const actualRegex = /^([NBRQK])([a-h][1-8])([+#]?)$/;
        
        const expectedMatch = expectedMove.match(expectedRegex);
        const actualMatch = actualMove.match(actualRegex);
        
        if (expectedMatch && actualMatch) {
            const expectedPiece = expectedMatch[1];
            const expectedDisambiguation = expectedMatch[2];
            const expectedDestination = expectedMatch[3];
            const expectedSuffix = expectedMatch[4] || '';
            
            const actualPiece = actualMatch[1];
            const actualDestination = actualMatch[2];
            const actualSuffix = actualMatch[3] || '';
            
            // Check if piece type and destination match
            if (expectedPiece === actualPiece && 
                expectedDestination === actualDestination &&
                expectedSuffix === actualSuffix) {
                console.log(`Disambiguation match: Expected ${expectedMove} matches actual ${actualMove}`);
                return true;
            }
        }
        
        // Also handle the reverse case: actual has disambiguation, expected doesn't
        const reverseExpectedMatch = expectedMove.match(actualRegex);
        const reverseActualMatch = actualMove.match(expectedRegex);
        
        if (reverseExpectedMatch && reverseActualMatch) {
            const expectedPiece = reverseExpectedMatch[1];
            const expectedDestination = reverseExpectedMatch[2];
            const expectedSuffix = reverseExpectedMatch[3] || '';
            
            const actualPiece = reverseActualMatch[1];
            const actualDisambiguation = reverseActualMatch[2];
            const actualDestination = reverseActualMatch[3];
            const actualSuffix = reverseActualMatch[4] || '';
            
            if (expectedPiece === actualPiece && 
                expectedDestination === actualDestination &&
                expectedSuffix === actualSuffix) {
                console.log(`Reverse disambiguation match: Expected ${expectedMove} matches actual ${actualMove}`);
                return true;
            }
        }
        
        return false;
    }

    async playOpeningMoves() {
        const moves = this.openingBook[this.selectedOpening][this.selectedLine];
        const moveList = this.parseMoveString(moves);
        
        for (let moveIndex = 0; moveIndex < moveList.length; moveIndex++) {
            const movePair = moveList[moveIndex].trim().split(/\s+/);
            
            // Collect moves for this pair
            const movePairMoves = [];
            
            // Play white move
            if (movePair[0]) {
                const whiteMove = this.chessBoardManager.makeMove(movePair[0]);
                if (whiteMove) {
                    movePairMoves.push(whiteMove.san);
                    console.log(`Played white move: ${whiteMove.san}`);
                }
                await this.delay(400);
            }
            
            // Play black move
            if (movePair[1]) {
                const blackMove = this.chessBoardManager.makeMove(movePair[1]);
                if (blackMove) {
                    movePairMoves.push(blackMove.san);
                    console.log(`Played black move: ${blackMove.san}`);
                }
            }
            
            // Speak the move pair and wait for completion
            if (movePairMoves.length > 0) {
                await this.speechManager.speakMovePair(movePairMoves);
            }
            
            // Pause between move pairs (except for the last one)
            if (moveIndex < moveList.length - 1) {
                await this.delay(800);
            }
        }
        
        // Opening playback complete
        const game = this.chessBoardManager.getGame();
        this.uiManager.setStatus(
            `Opening complete - ${game.turn() === 'w' ? 'White' : 'Black'} to move`
        );
        
        // Announce completion
        const nextPlayer = game.turn() === 'w' ? 'White' : 'Black';
        this.speechManager.speakCompletion(nextPlayer);
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
