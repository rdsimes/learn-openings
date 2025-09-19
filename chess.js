import { Chess } from './node_modules/chess.js/dist/esm/chess.js';

// Opening book data
const openingBook = {
    italian: {
        classical: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. Re1 a6 8. Bb3 Ba7 9. h3 h6 10. Nbd2 Re8",
        aggressive: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Bxc3 9. d5 Bf6 10. Re1 Ne7",
        modern: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 a6 6. O-O d6 7. Re1 O-O 8. Nbd2 Be6 9. Bb3 Bxb3 10. axb3",
        knights: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Ncb4 9. Qe4 c6 10. d3",
        hungarian: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Be7 4. d3 Nf6 5. O-O O-O 6. Re1 d6 7. c3 Bg4 8. Nbd2 Nh5 9. h3 Bh5 10. Nf1"
    },
    ruylopez: {
        closed: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7",
        berlin: "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8 10. h3",
        morphy: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bc5 7. c3 d6 8. d4 Bb6 9. Re1 O-O 10. Nbd2"
    },
    queens: {
        declined: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7",
        accepted: "1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5 8. Bb3 Bb7 9. Rd1 Nbd7 10. Nc3",
        slav: "1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O Nbd7 9. Qe2 Bg6 10. e4"
    },
    sicilian: {
        najdorf: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. f3 b5 8. Qd2 Bb7 9. O-O-O Nbd7 10. h4",
        dragon: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. O-O-O Bd7 10. h4",
        accelerated: "1. e4 c5 2. Nf3 g6 3. d4 cxd4 4. Nxd4 Bg7 5. Nc3 Nc6 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Bd7 10. Qd2"
    }
};

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
    
    // Update status
    const openingNames = {
        italian: 'Italian Game',
        ruylopez: 'Ruy Lopez',
        queens: "Queen's Gambit",
        sicilian: 'Sicilian Defense'
    };
    
    const lineNames = {
        classical: 'Classical Variation',
        aggressive: "Bird's Attack",
        modern: 'Modern Defense',
        knights: 'Two Knights Defense',
        hungarian: 'Hungarian Defense',
        closed: 'Closed Defense',
        berlin: 'Berlin Defense',
        morphy: 'Morphy Defense',
        declined: 'Declined',
        accepted: 'Accepted',
        slav: 'Slav Defense',
        najdorf: 'Najdorf Variation',
        dragon: 'Dragon Variation',
        accelerated: 'Accelerated Dragon'
    };
    
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
