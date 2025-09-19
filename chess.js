import { Chess } from './node_modules/chess.js/dist/esm/chess.js';
import { openingBook, openingNames, lineNames } from './openingBook.js';

// Global variables accessible to all functions
let selectedOpening = null;
let selectedLine = null;
let game = null;
let board = null;

// Update game status
function updateStatus() {
    let status = '';
    
    if (game.isGameOver()) {
        if (game.isCheckmate()) {
            status = 'Game over - ' + (game.turn() === 'b' ? 'White' : 'Black') + ' wins by checkmate!';
        } else if (game.isDraw()) {
            if (game.isStalemate()) {
                status = 'Game over - Draw by stalemate';
            } else if (game.isThreefoldRepetition()) {
                status = 'Game over - Draw by threefold repetition';
            } else if (game.isInsufficientMaterial()) {
                status = 'Game over - Draw by insufficient material';
            } else {
                status = 'Game over - Draw by 50-move rule';
            }
        }
    } else {
        let turn = game.turn() === 'w' ? 'White' : 'Black';
        if (game.isCheck()) {
            status = turn + ' is in check';
        } else {
            status = turn + ' to move';
        }
    }

    document.getElementById('status').textContent = status;
    
    // Update game info
    let gameInfo = `Move: ${Math.ceil(game.history().length / 2)}`;
    if (game.isCheck()) gameInfo += ' | CHECK!';
    document.getElementById('gameInfo').textContent = gameInfo;
    
    // Update undo button
    document.getElementById('undoBtn').disabled = game.history().length === 0;
}

// Update move history display
function updateMoveHistory() {
    let history = game.history({ verbose: true });
    let movesDisplay = '';
    
    if (history.length === 0) {
        movesDisplay = 'Game started';
    } else {
        for (let i = 0; i < history.length; i += 2) {
            let moveNum = Math.floor(i / 2) + 1;
            let whiteMove = history[i].san;
            let blackMove = history[i + 1] ? history[i + 1].san : '';
            movesDisplay += `${moveNum}. ${whiteMove} ${blackMove}<br>`;
        }
    }
    
    document.getElementById('moves').innerHTML = movesDisplay;
    
    // Auto-scroll to bottom of move history during opening playback
    const moveHistoryElement = document.getElementById('moveHistory');
    moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
}

// Reset the game
function resetGame() {
    game = new Chess();
    board.position('start');
    updateStatus();
    updateMoveHistory();
}

// Flip the board
function flipBoard() {
    board.flip();
}

// Undo the last move
function undoMove() {
    game.undo();
    board.position(game.fen());
    updateStatus();
    updateMoveHistory();
}

// Wait for DOM to be ready (since we can't use jQuery in modules easily)
document.addEventListener('DOMContentLoaded', function() {
    // Check if required dependencies are available
    if (typeof $ === 'undefined') {
        console.error('jQuery not found. Make sure it is loaded.');
        return;
    }
    
    if (typeof Chessboard === 'undefined') {
        console.error('Chessboard.js not found. Make sure it is loaded.');
        return;
    }

    // Initialize chess game and board
    game = new Chess();
    board = null;

    // Prevent dragging pieces when it's not the player's turn
    function onDragStart(source, piece, position, orientation) {
        // Do not pick up pieces if the game is over
        if (game.isGameOver()) return false;

        // Only pick up pieces for the side to move
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    // Handle piece drop
    function onDrop(source, target) {
        // See if the move is legal
        try {
            let move = game.move({
                from: source,
                to: target,
                promotion: 'q' // Always promote to a queen for simplicity
            });

            // Illegal move
            if (move === null) return 'snapback';

            updateStatus();
            updateMoveHistory();
        } catch (error) {
            console.error('Move error:', error);
            return 'snapback';
        }
    }

    // Update the board position after the piece snap
    function onSnapEnd() {
        board.position(game.fen());
    }

    // Configuration for the chess board
    let config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'img/chesspieces/wikipedia/{piece}.png'
    };

    // Initialize the board
    board = Chessboard('chessboard', config);
    updateStatus();

    // Make functions globally available for onclick handlers
    window.resetGame = resetGame;
    window.flipBoard = flipBoard;
    window.undoMove = undoMove;
    window.playOpening = playOpening;
    window.toggleCategory = toggleCategory;

    // Add event listeners for opening selection
    document.querySelectorAll('.opening-line').forEach(line => {
        line.addEventListener('click', function() {
            selectOpening(this.dataset.opening, this.dataset.line, this);
        });
    });
});

// Toggle opening category expansion
function toggleCategory(categoryId) {
    const lines = document.getElementById(categoryId + '-lines');
    lines.classList.toggle('expanded');
}

// Select an opening line
function selectOpening(opening, line, element) {
    // Remove previous selection
    document.querySelectorAll('.opening-line').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked element
    element.classList.add('selected');
    
    // Store selection
    selectedOpening = opening;
    selectedLine = line;
    
    // Enable play button
    document.getElementById('playBtn').disabled = false;
    
    // Update status using imported constants
    document.getElementById('gameInfo').textContent = 
        `Selected: ${openingNames[opening]} - ${lineNames[line]}`;
}

// Play the selected opening
function playOpening() {
    if (!selectedOpening || !selectedLine) return;
    
    // Reset the game first
    resetGame();
    
    // Update UI to show opening is being played
    document.getElementById('status').textContent = 'Playing opening...';
    
    // Get the moves for the selected opening
    const moves = openingBook[selectedOpening][selectedLine];
    const moveList = moves.split(/\d+\.\s*/).filter(move => move.trim());
    
    // Play moves with delay for visualization
    let moveIndex = 0;
    const playNextMove = () => {
        if (moveIndex < moveList.length) {
            const movePair = moveList[moveIndex].trim().split(/\s+/);
            
            // Play white move
            if (movePair[0]) {
                try {
                    const move = game.move(movePair[0]);
                    board.position(game.fen());
                    updateStatus();
                    updateMoveHistory();
                    console.log(`Played white move: ${move.san}`);
                } catch (error) {
                    console.error('Error playing white move:', movePair[0], error);
                }
            }
            
            // Play black move after a short delay
            setTimeout(() => {
                if (movePair[1]) {
                    try {
                        const move = game.move(movePair[1]);
                        board.position(game.fen());
                        updateStatus();
                        updateMoveHistory();
                        console.log(`Played black move: ${move.san}`);
                    } catch (error) {
                        console.error('Error playing black move:', movePair[1], error);
                    }
                }
                
                moveIndex++;
                if (moveIndex < moveList.length) {
                    setTimeout(playNextMove, 800);
                } else {
                    // Opening playback complete
                    document.getElementById('status').textContent = 
                        `Opening complete - ${game.turn() === 'w' ? 'White' : 'Black'} to move`;
                }
            }, 400);
        }
    };
    
    // Start playing moves
    setTimeout(playNextMove, 500);
}
