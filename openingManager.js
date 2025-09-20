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
        this.isTestMode = false;
        this.isStartingTest = false;
        this.testMoves = [];
        this.currentTestMoveIndex = 0;
        this.voicesLoaded = false;
        this.preferredVoice = null;
    }

    async initialize() {
        try {
            console.log('🎯 OpeningManager: Initializing...');
            this.openingBook = await initializeOpeningBook();
            this.lineNames = getLineNames();
            
            // Initialize speech voices
            this.initializeVoices();
            
            this.updateOpeningMenu();
            console.log('🎯 OpeningManager: Initialization complete');
            return true;
        } catch (error) {
            console.error('Failed to initialize opening manager:', error);
            this.uiManager.showError('Could not load opening book from PGN files');
            return false;
        }
    }

    initializeVoices() {
        if ('speechSynthesis' in window) {
            // Load voices
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    this.voicesLoaded = true;
                    
                    // Find preferred UK English female voice
                    this.preferredVoice = voices.find(voice => 
                        voice.lang.includes('en-GB') && 
                        (voice.name.toLowerCase().includes('female') || 
                         voice.name.toLowerCase().includes('woman') ||
                         voice.name.toLowerCase().includes('karen') ||
                         voice.name.toLowerCase().includes('kate'))
                    ) || voices.find(voice => 
                        voice.lang.includes('en-GB')
                    ) || voices.find(voice => 
                        voice.name.toLowerCase().includes('female') ||
                        voice.name.toLowerCase().includes('woman')
                    );
                    
                    if (this.preferredVoice) {
                        console.log(`Selected voice: ${this.preferredVoice.name} (${this.preferredVoice.lang})`);
                    }
                }
            };
            
            // Try to load voices immediately
            loadVoices();
            
            // Also listen for the voiceschanged event
            window.speechSynthesis.onvoiceschanged = loadVoices;
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
        this.speakOpeningStart();
        
        try {
            await this.playOpeningMoves();
        } catch (error) {
            console.error('Error playing opening:', error);
            this.uiManager.setStatus('Error playing opening');
        } finally {
            this.isPlaying = false;
        }
    }

    speakOpeningStart() {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();
            const openingName = openingNames[this.selectedOpening] || this.selectedOpening;
            const lineName = this.lineNames[this.selectedLine] || this.selectedLine;
            
            utterance.text = `Playing ${openingName}, ${lineName}`;
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.volume = 0.8;
            utterance.lang = 'en-GB';
            
            // Use the preferred voice
            if (this.preferredVoice) {
                utterance.voice = this.preferredVoice;
            }
            
            window.speechSynthesis.speak(utterance);
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
                         move.san === expectedMove.replace(/[+#]/g, ''); // Remove check/checkmate symbols
        
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
                await this.speakMovePair(movePairMoves, moveIndex + 1);
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
        this.speakOpeningComplete(game);
    }

    speakOpeningComplete(game) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();
            const nextPlayer = game.turn() === 'w' ? 'White' : 'Black';
            
            utterance.text = `Opening complete. ${nextPlayer} to move.`;
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            utterance.lang = 'en-GB';
            
            // Use the preferred voice
            if (this.preferredVoice) {
                utterance.voice = this.preferredVoice;
            }
            
            // Add a small delay before speaking the completion
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 500);
        }
    }

    async speakMovePair(moves, moveNumber) {
        return new Promise((resolve) => {
            // Check if speech synthesis is supported
            if ('speechSynthesis' in window) {
                // Create utterance
                const utterance = new SpeechSynthesisUtterance();
                
                // Format the move pair for speaking (without move numbers)
                const spokenMoves = moves.map(move => this.formatMoveForSpeech(move)).join(', ');
                utterance.text = spokenMoves;
                
                // Set speech properties for UK English female voice
                utterance.rate = 0.8;
                utterance.pitch = 1;
                utterance.volume = 0.8;
                utterance.lang = 'en-GB'; // UK English
                
                // Use the pre-loaded preferred voice
                if (this.preferredVoice) {
                    utterance.voice = this.preferredVoice;
                    console.log(`Using voice: ${this.preferredVoice.name}`);
                } else {
                    // Fallback: try to find a voice now
                    const voices = window.speechSynthesis.getVoices();
                    const ukFemaleVoice = voices.find(voice => 
                        voice.lang.includes('en-GB') && 
                        (voice.name.toLowerCase().includes('female') ||
                         voice.name.toLowerCase().includes('woman'))
                    ) || voices.find(voice => 
                        voice.lang.includes('en-GB')
                    );
                    
                    if (ukFemaleVoice) {
                        utterance.voice = ukFemaleVoice;
                        console.log(`Using fallback voice: ${ukFemaleVoice.name}`);
                    }
                }
                
                // Set up event handler for when speech ends
                utterance.onend = () => {
                    console.log(`Finished speaking: ${utterance.text}`);
                    resolve();
                };
                
                utterance.onerror = () => {
                    console.log('Speech synthesis error');
                    resolve(); // Still resolve to prevent hanging
                };
                
                // Speak the move pair
                window.speechSynthesis.speak(utterance);
                
                console.log(`Speaking: ${utterance.text}`);
            } else {
                console.log('Speech synthesis not supported in this browser');
                resolve(); // Resolve immediately if speech not supported
            }
        });
    }

    formatMoveForSpeech(moveNotation) {
        // Convert chess notation to spoken format (without unnecessary details)
        let spokenMove = moveNotation;
        
        // Replace common chess notation with spoken equivalents
        spokenMove = spokenMove.replace(/O-O-O/g, 'castles queenside');
        spokenMove = spokenMove.replace(/O-O/g, 'castles kingside');
        spokenMove = spokenMove.replace(/\+/g, ' check');
        spokenMove = spokenMove.replace(/#/g, ' checkmate');
        spokenMove = spokenMove.replace(/x/g, ' takes ');
        spokenMove = spokenMove.replace(/=/g, ' promotes to ');
        
        // Handle piece moves - only add piece name if it's not a pawn move
        if (/^[NBRQK]/.test(spokenMove)) {
            // Check for disambiguation (like Nbd7, Nge5, N1f3, etc.)
            const hasDisambiguation = /^[NBRQK][a-h1-8]/.test(moveNotation);
            
            if (hasDisambiguation) {
                // Keep disambiguation for clarity (e.g., "Knight b d7")
                spokenMove = spokenMove.replace(/^N([a-h1-8])/, 'Knight $1 ');
                spokenMove = spokenMove.replace(/^B([a-h1-8])/, 'Bishop $1 ');
                spokenMove = spokenMove.replace(/^R([a-h1-8])/, 'Rook $1 ');
                spokenMove = spokenMove.replace(/^Q([a-h1-8])/, 'Queen $1 ');
                spokenMove = spokenMove.replace(/^K([a-h1-8])/, 'King $1 ');
            } else {
                // Simple piece moves without disambiguation
                spokenMove = spokenMove.replace(/^N/, 'Knight ');
                spokenMove = spokenMove.replace(/^B/, 'Bishop ');
                spokenMove = spokenMove.replace(/^R/, 'Rook ');
                spokenMove = spokenMove.replace(/^Q/, 'Queen ');
                spokenMove = spokenMove.replace(/^K/, 'King ');
            }
        }
        // For pawn moves (no piece letter), just say the move as is
        
        return spokenMove.trim();
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
