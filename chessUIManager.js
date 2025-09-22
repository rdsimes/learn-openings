// UI management for chess application
export class ChessUIManager {
    constructor(chessBoardManager) {
        this.chessBoardManager = chessBoardManager;
        this.elements = this.getElements();
        this.setupEventHandlers();
    }

    getElements() {
        return {
            status: document.getElementById('status'),
            gameInfo: document.getElementById('gameInfo'),
            moves: document.getElementById('moves'),
            moveHistory: document.getElementById('moveHistory'),
            playBtn: document.getElementById('playBtn'),
            testBtn: document.getElementById('testBtn')
        };
    }

    setupEventHandlers() {
        // Set up chess board event handlers
        this.chessBoardManager.onMoveCompleted = () => {
            this.updateStatus();
            this.updateMoveHistory();
        };

        this.chessBoardManager.onGameStateChanged = () => {
            this.updateStatus();
            this.updateMoveHistory();
        };
    }

    updateStatus() {
        // Don't override status during test mode or just after test completion
        if (this.chessBoardManager.openingManager && 
            (this.chessBoardManager.openingManager.isTestMode ||
             this.chessBoardManager.openingManager.justCompletedTest)) {
            return; // Keep the test mode status message
        }
        
        const game = this.chessBoardManager.getGame();
        let status = this.generateStatusText(game);
        
        this.elements.status.textContent = status;
        
        // Update game info
        let gameInfo = `Move: ${Math.ceil(game.history().length / 2)}`;
        if (game.isCheck()) gameInfo += ' | CHECK!';
        this.elements.gameInfo.textContent = gameInfo;
    }

    generateStatusText(game) {
        if (game.isGameOver()) {
            return this.getGameOverStatus(game);
        } else {
            return this.getActiveGameStatus(game);
        }
    }

    getGameOverStatus(game) {
        if (game.isCheckmate()) {
            return 'Game over - ' + (game.turn() === 'b' ? 'White' : 'Black') + ' wins by checkmate!';
        } else if (game.isDraw()) {
            if (game.isStalemate()) {
                return 'Game over - Draw by stalemate';
            } else if (game.isThreefoldRepetition()) {
                return 'Game over - Draw by threefold repetition';
            } else if (game.isInsufficientMaterial()) {
                return 'Game over - Draw by insufficient material';
            } else {
                return 'Game over - Draw by 50-move rule';
            }
        }
        return 'Game over';
    }

    getActiveGameStatus(game) {
        const turn = game.turn() === 'w' ? 'White' : 'Black';
        if (game.isCheck()) {
            return turn + ' is in check';
        } else {
            return turn + ' to move';
        }
    }

    updateMoveHistory() {
        const history = this.chessBoardManager.getHistory({ verbose: true });
        let movesDisplay = this.formatMoveHistory(history);
        
        this.elements.moves.innerHTML = movesDisplay;
        
        // Auto-scroll to bottom
        this.elements.moveHistory.scrollTop = this.elements.moveHistory.scrollHeight;
    }

    formatMoveHistory(history) {
        if (history.length === 0) {
            return 'Game started';
        }

        let movesDisplay = '';
        for (let i = 0; i < history.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const whiteMove = history[i].san;
            const blackMove = history[i + 1] ? history[i + 1].san : '';
            movesDisplay += `${moveNum}. ${whiteMove} ${blackMove}<br>`;
        }
        return movesDisplay;
    }

    setStatus(text) {
        this.elements.status.textContent = text;
    }

    setGameInfo(text) {
        this.elements.gameInfo.textContent = text;
    }

    enablePlayButton() {
        this.elements.playBtn.disabled = false;
    }

    disablePlayButton() {
        this.elements.playBtn.disabled = true;
    }

    enableTestButton() {
        this.elements.testBtn.disabled = false;
    }

    disableTestButton() {
        this.elements.testBtn.disabled = true;
    }

    showError(message) {
        this.setStatus(`Error: ${message}`);
        this.disablePlayButton();
        this.disableTestButton();
    }
}
