// Chess board management class for better encapsulation and maintainability
import { Chess } from 'https://unpkg.com/chess.js@1.0.0-beta.6/dist/esm/chess.js';

export class ChessBoardManager {
    constructor() {
        this.game = null;
        this.board = null;
        this.config = null;
        this.openingManager = null; // Reference to opening manager for test mode
    }

    async initialize(boardElementId) {
        // Check dependencies
        if (typeof Chessboard === 'undefined') {
            throw new Error('Chessboard.js library not found');
        }

        // Initialize game
        this.game = new Chess();
        
        // Setup board configuration
        this.config = {
            draggable: false, // Start with dragging disabled
            position: 'start',
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            pieceTheme: 'img/chesspieces/wikipedia/{piece}.png'
        };

        // Create board
        this.board = Chessboard(boardElementId, this.config);
        return this;
    }

    onDragStart(source, piece, position, orientation) {
        // Do not allow moves if dragging is disabled
        if (!this.config.draggable) return false;
        
        // Do not pick up pieces if the game is over
        if (this.game.isGameOver()) return false;

        // Only pick up pieces for the side to move
        if ((this.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (this.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
        return true;
    }

    onDrop(source, target) {
        try {
            const move = this.game.move({
                from: source,
                to: target,
                promotion: 'q' // Always promote to a queen for simplicity
            });

            // Illegal move
            if (move === null) return 'snapback';

            // Check with opening manager if in test mode
            if (this.openingManager && !this.openingManager.handleTestMove(move)) {
                // Move was rejected by test mode, undo it
                this.game.undo();
                return 'snapback';
            }

            // Notify of move made (could be enhanced with events)
            this.onMoveCompleted?.(move);
            return true;
        } catch (error) {
            console.error('Move error:', error);
            return 'snapback';
        }
    }

    onSnapEnd() {
        this.board.position(this.game.fen());
    }

    // Game control methods
    reset() {
        this.game = new Chess();
        this.board.position('start');
        
        // Disable user moves on reset
        this.disableUserMoves();
        
        // Only exit test mode if we're not starting a new test
        if (this.openingManager && this.openingManager.isTestMode && !this.openingManager.isStartingTest) {
            this.openingManager.exitTestMode();
        }
        
        this.onGameStateChanged?.();
        this.onGameReset?.();
    }

    flip() {
        this.board.flip();
    }

    undo() {
        const undoResult = this.game.undo();
        if (undoResult) {
            this.board.position(this.game.fen());
            this.onGameStateChanged?.();
        }
        return undoResult;
    }

    makeMove(moveNotation) {
        const move = this.game.move(moveNotation);
        if (move) {
            this.board.position(this.game.fen());
            this.onMoveCompleted?.(move);
        }
        return move;
    }

    // Game state accessors
    getGame() {
        return this.game;
    }

    getBoard() {
        return this.board;
    }

    getFen() {
        return this.game.fen();
    }

    getHistory(options) {
        return this.game.history(options);
    }

    isGameOver() {
        return this.game.isGameOver();
    }

    // Method to set opening manager reference
    setOpeningManager(openingManager) {
        this.openingManager = openingManager;
    }

    // Enable/disable user moves
    enableUserMoves() {
        if (this.config) {
            this.config.draggable = true;
        }
        
        // Remove disabled visual state
        const boardElement = document.getElementById('chessboard');
        if (boardElement) {
            boardElement.classList.remove('disabled');
        }
    }

    disableUserMoves(showOverlay = true) {
        if (this.config) {
            this.config.draggable = false;
        }
        
        // Handle disabled visual state
        const boardElement = document.getElementById('chessboard');
        if (boardElement) {
            if (showOverlay) {
                boardElement.classList.add('disabled');
            } else {
                boardElement.classList.remove('disabled');
            }
        }
    }

    // Event handlers (can be set from outside)
    onMoveCompleted = null;
    onGameStateChanged = null;
}
