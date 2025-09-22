// Opening management for chess application
import { initializeOpeningBook, openingNames, getLineNames } from './openingBook.js';
import { SpeechManager } from './speechManager.js';
import { DOMUtils } from './domUtils.js';

export class OpeningManager {
    constructor(chessBoardManager, uiManager, options = {}) {
        this.chessBoardManager = chessBoardManager;
        this.uiManager = uiManager;
        this.openingBook = {};
        this.lineNames = {};
        this.selectedOpening = null;
        this.selectedLine = null;
        this.isPlaying = false;
        this.isTestMode = false;
        this.isStartingTest = false;
        this.shouldCancel = false; // Flag to cancel ongoing operations
        this.testMoves = [];
        this.currentTestMoveIndex = 0;
        this.justCompletedTest = false; // Flag to preserve completion message
        
        // Dependency injection for better testability
        this.speechManager = options.speechManager || new SpeechManager();
        this.domUtils = options.domUtils || new DOMUtils();
        this.openingBookLoader = options.openingBookLoader || initializeOpeningBook;
        this.lineNamesLoader = options.lineNamesLoader || getLineNames;
    }

    async initialize() {
        try {
            console.log('🎯 OpeningManager: Initializing...');
            this.openingBook = await this.openingBookLoader();
            this.lineNames = this.lineNamesLoader();
            
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
            const linesContainer = this.domUtils.getElementById(openingKey + '-lines');
            if (linesContainer) {
                // Clear existing lines
                this.domUtils.setInnerHTML(linesContainer, '');
                
                // Add lines from the loaded opening book
                Object.keys(this.openingBook[openingKey]).forEach(lineKey => {
                    const lineDiv = this.createOpeningLineElement(openingKey, lineKey);
                    this.domUtils.appendChild(linesContainer, lineDiv);
                });
            }
        });
    }

    createOpeningLineElement(openingKey, lineKey) {
        const lineDiv = this.domUtils.createElement('div');
        this.domUtils.addClass(lineDiv, 'opening-line');
        this.domUtils.setAttribute(lineDiv, 'data-opening', openingKey);
        this.domUtils.setAttribute(lineDiv, 'data-line', lineKey);
        this.domUtils.setAttribute(lineDiv, 'tabindex', '0'); // Make focusable
        this.domUtils.setAttribute(lineDiv, 'role', 'button'); // Accessibility
        this.domUtils.setTextContent(lineDiv, this.lineNames[lineKey] || lineKey);
        
        // Click handler
        this.domUtils.addEventListener(lineDiv, 'click', () => {
            this.selectOpening(openingKey, lineKey, lineDiv);
        });
        
        // Keyboard handler
        this.domUtils.addEventListener(lineDiv, 'keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.selectOpening(openingKey, lineKey, lineDiv);
            }
        });
        
        return lineDiv;
    }

    selectOpening(opening, line, element) {
        // Stop any current action (playing or testing) before selecting new opening
        this.stopCurrentAction();
        
        // Remove previous selection
        this.domUtils.querySelectorAll('.opening-line').forEach(el => {
            this.domUtils.removeClass(el, 'selected');
        });
        
        // Remove previous category highlights
        this.domUtils.querySelectorAll('.opening-category').forEach(cat => {
            this.domUtils.removeClass(cat, 'has-selection');
        });
        
        // Add selection to clicked element
        this.domUtils.addClass(element, 'selected');
        
        // Highlight parent category using DOM utilities
        const parentCategory = this.findParentCategory(element);
        if (parentCategory) {
            this.domUtils.addClass(parentCategory, 'has-selection');
        }
        
        // Store selection
        this.selectedOpening = opening;
        this.selectedLine = line;
        
        // Hide welcome state and selection prompt
        this.hideWelcomeElements();
        
        // Show chess board
        this.showChessBoard();
        
        // Update board title
        this.updateBoardTitle(opening, line);
        
        // Update UI with encouraging messages
        this.uiManager.enablePlayButton();
        this.uiManager.enableTestButton();
        this.uiManager.setStatus(`✨ ${openingNames[opening]} selected! Choose your learning mode below:`);
        this.uiManager.setGameInfo(
            `📖 ${this.lineNames[line] || line} variation selected. Click "Watch Opening" to see the moves demonstrated, or "Test Your Knowledge" to practice!`
        );
        
        // Ensure user moves are disabled until they choose a mode
        this.chessBoardManager.disableUserMoves();
        
        // Add progress indicator
        const moveCount = this.getMoveCount(opening, line);
        this.uiManager.setProgressInfo(`This opening has ${moveCount} moves to learn`);
    }

    updateBoardTitle(opening, line) {
        const titleElement = this.domUtils.querySelector('.board-section h1');
        if (titleElement) {
            const openingDisplayName = openingNames[opening] || opening;
            const lineDisplayName = this.lineNames[line] || line;
            this.domUtils.setTextContent(titleElement, `${openingDisplayName} - ${lineDisplayName}`);
        }
    }

    resetBoardTitle() {
        // Don't reset title if we're in the middle of playing an opening or in test mode
        if (this.isPlaying || this.isTestMode) {
            return;
        }
        
        const titleElement = this.domUtils.querySelector('.board-section h1');
        if (titleElement) {
            this.domUtils.setTextContent(titleElement, 'Learn Openings');
        }
        
        // Show welcome elements when no opening is selected
        if (!this.selectedOpening) {
            this.showWelcomeElements();
        }
    }

    // Stop any current action (playing or testing)
    stopCurrentAction() {
        // Set cancellation flag
        this.shouldCancel = true;
        
        // Cancel any ongoing speech synthesis
        this.speechManager.cancelSpeech();
        
        // Reset playing state
        if (this.isPlaying) {
            this.isPlaying = false;
            this.uiManager.updatePlayButtonText('▶️ Watch Opening');
            this.uiManager.enableTestButton();
        }
        
        // Reset test mode
        if (this.isTestMode) {
            this.isTestMode = false;
            this.isStartingTest = false;
            this.currentTestMoveIndex = 0;
            this.testMoves = [];
            this.uiManager.updateTestButtonText('🧠 Test Your Knowledge');
            this.uiManager.enablePlayButton();
        }
        
        // Reset the board
        this.chessBoardManager.reset();
        
        // Clear cancellation flag immediately since we've already reset everything
        this.shouldCancel = false;
    }

    async playOpening() {
        if (!this.selectedOpening || !this.selectedLine || this.isPlaying) {
            return;
        }

        this.isPlaying = true;
        
        // Reset the game first (title won't reset due to isPlaying flag)
        this.chessBoardManager.reset();
        
        // Disable user moves during playback but don't show overlay since user is watching
        this.chessBoardManager.disableUserMoves(false);
        
        // Update UI to show opening is being played
        this.uiManager.setStatus('🎬 Playing opening moves... Watch and learn!');
        this.uiManager.setStatusClass('');
        
        // Update button text during playback
        this.uiManager.updatePlayButtonText('⏸️ Playing...');
        this.uiManager.disableTestButton();
        
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
            // Reset button text
            this.uiManager.updatePlayButtonText('▶️ Watch Opening');
            this.uiManager.enableTestButton();
            // Keep moves disabled after watching - user must choose test mode to interact
            this.chessBoardManager.disableUserMoves();
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
        this.uiManager.setStatus(`🎯 Test Mode: Play ${this.testMoves[0]} (move 1 of ${this.testMoves.length})`);
        this.uiManager.setStatusClass('test-mode');
        this.uiManager.setGameInfo(`Testing: ${openingNames[this.selectedOpening]} - ${this.lineNames[this.selectedLine]}`);
        
        // Update button states
        this.uiManager.disablePlayButton();
        this.uiManager.updateTestButtonText('🔄 Exit Test');
        
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
                this.uiManager.setStatusClass('success');
                this.uiManager.setGameInfo(`🏆 Test completed: ${openingNames[this.selectedOpening]} - ${this.lineNames[this.selectedLine]}. Try another opening or watch this one again!`);
                this.isTestMode = false;
                this.justCompletedTest = true;
                
                // Disable moves after completion
                this.chessBoardManager.disableUserMoves();
                
                // Reset button states
                this.uiManager.enablePlayButton();
                this.uiManager.updateTestButtonText('🧠 Test Your Knowledge');
                
                // Clear the flag after a short delay to allow status to be preserved
                setTimeout(() => {
                    this.justCompletedTest = false;
                }, 3000);
            } else {
                // Show moves remaining instead of revealing the next move
                const movesRemaining = this.testMoves.length - this.currentTestMoveIndex;
                this.uiManager.setStatus(`✅ Correct! ${movesRemaining} moves to go`);
                this.uiManager.setStatusClass('success');
            }
            return true; // Allow the move
        } else {
            // Wrong move
            this.uiManager.setStatus(`❌ Wrong move! Expected: ${expectedMove}, got: ${move.san}. Try again.`);
            this.uiManager.setStatusClass('error');
            return false; // Reject the move
        }
    }

    exitTestMode() {
        this.isTestMode = false;
        this.isStartingTest = false;
        this.currentTestMoveIndex = 0;
        this.testMoves = [];
        this.justCompletedTest = false;
        
        // Disable user moves when exiting test mode
        this.chessBoardManager.disableUserMoves();
        
        // Reset UI state
        this.uiManager.setStatus('Test mode ended - Choose "Watch Opening" or "Test Your Knowledge" to continue');
        this.uiManager.setStatusClass('');
        this.uiManager.enablePlayButton();
        this.uiManager.updateTestButtonText('🧠 Test Your Knowledge');
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
            // Check if we should cancel
            if (this.shouldCancel) {
                console.log('Playback cancelled');
                return;
            }
            
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
                
                // Check cancellation after delay
                if (this.shouldCancel) {
                    console.log('Playback cancelled during white move delay');
                    return;
                }
            }
            
            // Play black move
            if (movePair[1]) {
                const blackMove = this.chessBoardManager.makeMove(movePair[1]);
                if (blackMove) {
                    movePairMoves.push(blackMove.san);
                    console.log(`Played black move: ${blackMove.san}`);
                }
            }
            
            // Check cancellation before speech
            if (this.shouldCancel) {
                console.log('Playback cancelled before speech');
                return;
            }
            
            // Speak the move pair and wait for completion
            if (movePairMoves.length > 0) {
                await this.speechManager.speakMovePair(movePairMoves);
            }
            
            // Pause between move pairs (except for the last one)
            if (moveIndex < moveList.length - 1) {
                await this.delay(800);
                
                // Check cancellation after delay
                if (this.shouldCancel) {
                    console.log('Playback cancelled during move pair delay');
                    return;
                }
            }
        }
        
        // Opening playback complete
        const game = this.chessBoardManager.getGame();
        this.uiManager.setStatus(
            `🎉 Opening demonstration complete! ${game.turn() === 'w' ? 'White' : 'Black'} to move next`
        );
        this.uiManager.setStatusClass('success');
        
        // Encourage testing
        this.uiManager.setGameInfo(
            `💡 Now try "Test Your Knowledge" to practice the moves yourself, or select another opening!`
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
        const lines = this.domUtils.getElementById(categoryId + '-lines');
        if (lines) {
            this.domUtils.toggleClass(lines, 'expanded');
        }
    }

    hideWelcomeElements() {
        const welcomeState = this.domUtils.getElementById('welcomeState');
        const selectionPrompt = this.domUtils.getElementById('selectionPrompt');
        
        if (welcomeState) {
            this.domUtils.addClass(welcomeState, 'hidden');
        }
        if (selectionPrompt) {
            this.domUtils.addClass(selectionPrompt, 'hidden');
        }
    }

    showChessBoard() {
        const chessboard = this.domUtils.getElementById('chessboard');
        if (chessboard) {
            this.domUtils.removeClass(chessboard, 'hidden');
            // Keep disabled class - user must choose watch or test mode
        }
    }

    getMoveCount(opening, line) {
        if (!this.openingBook[opening] || !this.openingBook[opening][line]) {
            return 0;
        }
        const moves = this.openingBook[opening][line];
        const moveList = this.parseMoveString(moves);
        let count = 0;
        for (const movePair of moveList) {
            const pairMoves = movePair.trim().split(/\s+/);
            count += pairMoves.filter(move => move && move.trim()).length;
        }
        return count;
    }

    findParentCategory(element) {
        // Walk up the DOM tree to find the parent .opening-category element
        let current = element;
        while (current && current.parentNode) {
            current = current.parentNode;
            if (current.classList && current.classList.contains('opening-category')) {
                return current;
            }
        }
        return null;
    }

    // Helper methods for UI enhancement
    hideWelcomeElements() {
        const welcomeState = this.domUtils.getElementById('welcomeState');
        const selectionPrompt = this.domUtils.getElementById('selectionPrompt');
        
        if (welcomeState) {
            this.domUtils.addClass(welcomeState, 'hidden');
        }
        if (selectionPrompt) {
            this.domUtils.addClass(selectionPrompt, 'hidden');
        }
    }
    
    showWelcomeElements() {
        const welcomeState = this.domUtils.getElementById('welcomeState');
        const selectionPrompt = this.domUtils.getElementById('selectionPrompt');
        
        if (welcomeState) {
            this.domUtils.removeClass(welcomeState, 'hidden');
        }
        if (selectionPrompt) {
            this.domUtils.removeClass(selectionPrompt, 'hidden');
        }
    }
    
    getMoveCount(opening, line) {
        const moves = this.openingBook[opening][line];
        return this.parseMovesForTest(moves).length;
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
