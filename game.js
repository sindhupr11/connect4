/**
 * Connect Four with Minimax & Alpha-Beta Pruning
 * Enhanced with Dynamic UI Animations, Sound Effects & Confetti FX
 */

class SoundController {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playDrop(row, isPlayer) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Base frequency higher for top rows, deeper thud for bottom rows
        const baseFreq = isPlayer ? 320 - row * 22 : 440 - row * 25;
        osc.type = isPlayer ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playWin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

            gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + idx * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + idx * 0.1);
            osc.stop(this.ctx.currentTime + idx * 0.1 + 0.4);
        });
    }

    playDefeat() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [350, 311.13, 277.18, 233.08];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + idx * 0.12);
            osc.stop(this.ctx.currentTime + idx * 0.12 + 0.22);
        });
    }
}

class ConfettiFX {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    burst() {
        this.particles = [];
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'];
        for (let i = 0; i < 110; i++) {
            this.particles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                y: this.canvas.height * 0.45,
                vx: (Math.random() - 0.5) * 18,
                vy: (Math.random() - 0.8) * 16,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                alpha: 1
            });
        }

        if (this.animId) cancelAnimationFrame(this.animId);
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.35; // gravity
            p.rotation += p.rotSpeed;
            p.alpha -= 0.008;

            if (p.alpha <= 0) {
                this.particles.splice(idx, 1);
                return;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
        });

        if (this.particles.length > 0) {
            this.animId = requestAnimationFrame(() => this.render());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

class ConnectFour {
    constructor(rows = 6, cols = 7) {
        this.rows = rows;
        this.cols = cols;
        this.board = Array.from({ length: rows }, () => Array(cols).fill(0));
        this.player = 1; // 1: Human, 2: AI
    }

    dropPiece(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                this.board[row][col] = this.player;
                return { row, col, player: this.player };
            }
        }
        return null;
    }

    getLandingRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) return row;
        }
        return null;
    }

    isValidMove(col) {
        return col >= 0 && col < this.cols && this.board[0][col] === 0;
    }

    getValidMoves() {
        const moves = [];
        for (let col = 0; col < this.cols; col++) {
            if (this.isValidMove(col)) moves.push(col);
        }
        return moves;
    }

    checkWinner() {
        const winInfo = this.getWinningCoordinates();
        return winInfo ? winInfo.winner : null;
    }

    getWinningCoordinates() {
        const b = this.board;
        // Horizontal
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 3; c++) {
                if (b[r][c] !== 0 &&
                    b[r][c] === b[r][c+1] &&
                    b[r][c] === b[r][c+2] &&
                    b[r][c] === b[r][c+3]) {
                    return {
                        winner: b[r][c],
                        coords: [[r, c], [r, c+1], [r, c+2], [r, c+3]]
                    };
                }
            }
        }

        // Vertical
        for (let r = 0; r < this.rows - 3; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (b[r][c] !== 0 &&
                    b[r][c] === b[r+1][c] &&
                    b[r][c] === b[r+2][c] &&
                    b[r][c] === b[r+3][c]) {
                    return {
                        winner: b[r][c],
                        coords: [[r, c], [r+1, c], [r+2, c], [r+3, c]]
                    };
                }
            }
        }

        // Diagonal (positive slope)
        for (let r = 0; r < this.rows - 3; r++) {
            for (let c = 0; c < this.cols - 3; c++) {
                if (b[r][c] !== 0 &&
                    b[r][c] === b[r+1][c+1] &&
                    b[r][c] === b[r+2][c+2] &&
                    b[r][c] === b[r+3][c+3]) {
                    return {
                        winner: b[r][c],
                        coords: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]]
                    };
                }
            }
        }

        // Diagonal (negative slope)
        for (let r = 3; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 3; c++) {
                if (b[r][c] !== 0 &&
                    b[r][c] === b[r-1][c+1] &&
                    b[r][c] === b[r-2][c+2] &&
                    b[r][c] === b[r-3][c+3]) {
                    return {
                        winner: b[r][c],
                        coords: [[r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]]
                    };
                }
            }
        }

        return null;
    }

    isBoardFull() {
        return this.getValidMoves().length === 0;
    }
}

class ConnectFourAI {
    constructor(game) {
        this.game = game;
    }

    evaluateWindow(window, piece) {
        let score = 0;
        const oppPiece = piece === 2 ? 1 : 2;

        const countPiece = window.filter(x => x === piece).length;
        const countOpp = window.filter(x => x === oppPiece).length;
        const countEmpty = window.filter(x => x === 0).length;

        if (countPiece === 4) {
            score += 10000000;
        } else if (countOpp === 3 && countEmpty === 1) {
            score -= 5000000;
        } else if (countPiece === 3 && countEmpty === 1) {
            score += 1000000;
        } else if (countOpp === 2 && countEmpty === 2) {
            score -= 800;
        } else if (countPiece === 2 && countEmpty === 2) {
            score += 1000;
        } else if (countPiece === 1 && countEmpty === 3) {
            score += 100;
        }

        return score;
    }

    scorePosition(board, piece) {
        let score = 0;
        const rows = this.game.rows;
        const cols = this.game.cols;

        // Center column control
        const centerCol = Math.floor(cols / 2);
        const centerArray = [];
        for (let r = 0; r < rows; r++) centerArray.push(board[r][centerCol]);
        const centerCount = centerArray.filter(x => x === piece).length;
        score += centerCount * 2000;

        // Lower positions prioritization
        for (let r = 0; r < rows; r++) {
            const rowWeight = (rows - r) * 100;
            const rowArray = board[r];
            const pieceCount = rowArray.filter(x => x === piece).length;
            score += pieceCount * rowWeight;
        }

        // Horizontal
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 3; c++) {
                const window = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
                score += this.evaluateWindow(window, piece);
            }
        }

        // Vertical
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows - 3; r++) {
                const window = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
                score += this.evaluateWindow(window, piece);
            }
        }

        // Positive Diagonal
        for (let r = 0; r < rows - 3; r++) {
            for (let c = 0; c < cols - 3; c++) {
                const window = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
                score += this.evaluateWindow(window, piece);
            }
        }

        // Negative Diagonal
        for (let r = 3; r < rows; r++) {
            for (let c = 0; c < cols - 3; c++) {
                const window = [board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]];
                score += this.evaluateWindow(window, piece);
            }
        }

        return score;
    }

    checkWinnerOnBoard(board) {
        const rows = this.game.rows;
        const cols = this.game.cols;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 3; c++) {
                if (board[r][c] !== 0 &&
                    board[r][c] === board[r][c+1] &&
                    board[r][c] === board[r][c+2] &&
                    board[r][c] === board[r][c+3]) {
                    return board[r][c];
                }
            }
        }
        for (let r = 0; r < rows - 3; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c] !== 0 &&
                    board[r][c] === board[r+1][c] &&
                    board[r][c] === board[r+2][c] &&
                    board[r][c] === board[r+3][c]) {
                    return board[r][c];
                }
            }
        }
        for (let r = 0; r < rows - 3; r++) {
            for (let c = 0; c < cols - 3; c++) {
                if (board[r][c] !== 0 &&
                    board[r][c] === board[r+1][c+1] &&
                    board[r][c] === board[r+2][c+2] &&
                    board[r][c] === board[r+3][c+3]) {
                    return board[r][c];
                }
            }
        }
        for (let r = 3; r < rows; r++) {
            for (let c = 0; c < cols - 3; c++) {
                if (board[r][c] !== 0 &&
                    board[r][c] === board[r-1][c+1] &&
                    board[r][c] === board[r-2][c+2] &&
                    board[r][c] === board[r-3][c+3]) {
                    return board[r][c];
                }
            }
        }
        return null;
    }

    minimax(board, depth, alpha, beta, maximizingPlayer) {
        const validMoves = [];
        for (let c = 0; c < this.game.cols; c++) {
            if (board[0][c] === 0) validMoves.push(c);
        }

        const winner = this.checkWinnerOnBoard(board);
        const isTerminal = winner !== null || validMoves.length === 0;

        if (depth === 0 || isTerminal) {
            if (isTerminal) {
                if (winner === 2) return [null, 100000000000000];
                if (winner === 1) return [null, -100000000000000];
                return [null, 0];
            } else {
                return [null, this.scorePosition(board, 2)];
            }
        }

        if (maximizingPlayer) {
            let value = -Infinity;
            let column = validMoves[0] !== undefined ? validMoves[0] : null;

            for (const col of validMoves) {
                let row = null;
                for (let r = this.game.rows - 1; r >= 0; r--) {
                    if (board[r][col] === 0) {
                        row = r;
                        break;
                    }
                }
                if (row === null) continue;

                const tempBoard = board.map(r => [...r]);
                tempBoard[row][col] = 2;
                const newScore = this.minimax(tempBoard, depth - 1, alpha, beta, false)[1];

                if (newScore > value) {
                    value = newScore;
                    column = col;
                }
                alpha = Math.max(alpha, value);
                if (alpha >= beta) break;
            }
            return [column, value];
        } else {
            let value = Infinity;
            let column = validMoves[0] !== undefined ? validMoves[0] : null;

            for (const col of validMoves) {
                let row = null;
                for (let r = this.game.rows - 1; r >= 0; r--) {
                    if (board[r][col] === 0) {
                        row = r;
                        break;
                    }
                }
                if (row === null) continue;

                const tempBoard = board.map(r => [...r]);
                tempBoard[row][col] = 1;
                const newScore = this.minimax(tempBoard, depth - 1, alpha, beta, true)[1];

                if (newScore < value) {
                    value = newScore;
                    column = col;
                }
                beta = Math.min(beta, value);
                if (alpha >= beta) break;
            }
            return [column, value];
        }
    }

    getBestMove(depth = 3) {
        const [col] = this.minimax(this.game.board, depth, -Infinity, Infinity, true);
        return col;
    }
}

// UI Controller
class ConnectFourUI {
    constructor() {
        this.game = new ConnectFour();
        this.ai = new ConnectFourAI(this.game);
        this.sound = new SoundController();
        this.confetti = new ConfettiFX('confetti-canvas');

        this.isAiThinking = false;
        this.isGameOver = false;
        this.lastMove = null;

        this.scores = {
            human: parseInt(localStorage.getItem('c4_human_score') || '0', 10),
            ai: parseInt(localStorage.getItem('c4_ai_score') || '0', 10),
            tie: parseInt(localStorage.getItem('c4_tie_score') || '0', 10)
        };

        this.boardElement = document.getElementById('board');
        this.previewSlots = document.querySelectorAll('.preview-slot');
        this.statusText = document.getElementById('status-text');
        this.statusDot = document.getElementById('status-dot');
        this.humanCard = document.getElementById('human-card');
        this.aiCard = document.getElementById('ai-card');
        
        this.humanScoreEl = document.getElementById('human-score');
        this.aiScoreEl = document.getElementById('ai-score');
        this.tieScoreEl = document.getElementById('tie-score');

        this.restartBtn = document.getElementById('restart-btn');
        this.resetScoresBtn = document.getElementById('reset-scores-btn');
        this.soundToggleBtn = document.getElementById('sound-toggle');
        this.soundIcon = document.getElementById('sound-icon');

        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalIcon = document.getElementById('modal-icon');
        this.modalTitle = document.getElementById('modal-title');
        this.modalSubtitle = document.getElementById('modal-subtitle');
        this.modalRestartBtn = document.getElementById('modal-restart-btn');

        this.init();
    }

    init() {
        this.renderScores();
        this.createBoardUI();
        this.bindEvents();
        this.updateStatus();
    }

    renderScores() {
        this.humanScoreEl.textContent = this.scores.human;
        this.aiScoreEl.textContent = this.scores.ai;
        this.tieScoreEl.textContent = this.scores.tie;
    }

    saveScores() {
        localStorage.setItem('c4_human_score', this.scores.human);
        localStorage.setItem('c4_ai_score', this.scores.ai);
        localStorage.setItem('c4_tie_score', this.scores.tie);
        this.renderScores();
    }

    createBoardUI() {
        this.boardElement.innerHTML = '';

        for (let r = 0; r < this.game.rows; r++) {
            for (let c = 0; c < this.game.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                const disc = document.createElement('div');
                disc.className = 'cell-disc';
                cell.appendChild(disc);

                cell.addEventListener('click', () => this.handleHumanMove(c));
                cell.addEventListener('mouseenter', () => this.handleColumnHover(c));
                cell.addEventListener('mouseleave', () => this.clearColumnHover());

                this.boardElement.appendChild(cell);
            }
        }
    }

    bindEvents() {
        this.previewSlots.forEach((slot, col) => {
            slot.addEventListener('click', () => this.handleHumanMove(col));
            slot.addEventListener('mouseenter', () => this.handleColumnHover(col));
            slot.addEventListener('mouseleave', () => this.clearColumnHover());
        });

        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.modalRestartBtn.addEventListener('click', () => this.restartGame());

        this.resetScoresBtn.addEventListener('click', () => {
            this.scores = { human: 0, ai: 0, tie: 0 };
            this.saveScores();
        });

        this.soundToggleBtn.addEventListener('click', () => {
            this.sound.muted = !this.sound.muted;
            this.soundIcon.textContent = this.sound.muted ? '🔇' : '🔊';
        });
    }

    handleColumnHover(col) {
        if (this.isAiThinking || this.isGameOver || !this.game.isValidMove(col)) {
            this.clearColumnHover();
            return;
        }

        this.previewSlots.forEach((slot, c) => {
            const ghost = slot.querySelector('.ghost-disc');
            if (c === col) {
                ghost.classList.add('show');
            } else {
                ghost.classList.remove('show');
            }
        });
    }

    clearColumnHover() {
        this.previewSlots.forEach(slot => {
            const ghost = slot.querySelector('.ghost-disc');
            if (ghost) ghost.classList.remove('show');
        });
    }

    updateBoardUI() {
        for (let r = 0; r < this.game.rows; r++) {
            for (let c = 0; c < this.game.cols; c++) {
                const cell = this.boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                const val = this.game.board[r][c];

                cell.classList.remove('player-1', 'player-2', 'filled');

                if (val !== 0) {
                    cell.classList.add('filled', val === 1 ? 'player-1' : 'player-2');
                }
            }
        }
    }

    updateStatus() {
        if (this.isGameOver) return;

        if (this.isAiThinking) {
            this.statusText.textContent = 'AI is analyzing...';
            this.statusDot.className = 'status-dot yellow';
            this.humanCard.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            this.aiCard.style.borderColor = 'var(--ai-color)';
        } else {
            this.statusText.textContent = 'Your Turn';
            this.statusDot.className = 'status-dot red';
            this.humanCard.style.borderColor = 'var(--player-color)';
            this.aiCard.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }
    }

    animateDropInsertion(row, col, player, callback) {
        this.sound.playDrop(row, player === 1);
        this.updateBoardUI();

        setTimeout(() => {
            if (callback) callback();
        }, 160);
    }

    handleHumanMove(col) {
        if (this.isAiThinking || this.isGameOver) return;
        if (!this.game.isValidMove(col)) return;

        this.clearColumnHover();
        this.game.player = 1;
        const dropResult = this.game.dropPiece(col);
        if (!dropResult) return;

        this.isAiThinking = true; // Lock further input during drop animation
        this.lastMove = dropResult;

        this.animateDropInsertion(dropResult.row, dropResult.col, 1, () => {
            if (this.checkGameOver()) return;

            // Trigger AI Turn
            this.updateStatus();

            setTimeout(() => {
                this.handleAiMove(3);
            }, 260);
        });
    }

    handleAiMove(depth = 3) {
        this.game.player = 2;
        const aiCol = this.ai.getBestMove(depth);

        if (aiCol !== null && this.game.isValidMove(aiCol)) {
            // Briefly show AI ghost preview disc over chosen column
            const ghost = this.previewSlots[aiCol].querySelector('.ghost-disc');
            if (ghost) {
                ghost.classList.add('show', 'ai-turn');
            }

            setTimeout(() => {
                if (ghost) ghost.classList.remove('show', 'ai-turn');
                const dropResult = this.game.dropPiece(aiCol);
                if (dropResult) {
                    this.lastMove = dropResult;
                    this.animateDropInsertion(dropResult.row, dropResult.col, 2, () => {
                        this.isAiThinking = false;
                        if (!this.checkGameOver()) {
                            this.game.player = 1;
                            this.updateStatus();
                        }
                    });
                }
            }, 240);
        } else {
            this.isAiThinking = false;
        }
    }

    checkGameOver() {
        const winInfo = this.game.getWinningCoordinates();
        if (winInfo) {
            this.isGameOver = true;
            this.highlightWinningCells(winInfo.coords);

            if (winInfo.winner === 1) {
                this.scores.human++;
                this.saveScores();
                this.sound.playWin();
                this.confetti.burst();
                this.showGameOverModal('🏆', 'You Won!', 'Impressive! You outsmarted the Minimax AI.');
            } else {
                this.scores.ai++;
                this.saveScores();
                this.sound.playDefeat();
                this.showGameOverModal('🤖', 'AI Won!', 'The Minimax AI calculated the winning sequence.');
            }
            return true;
        }

        if (this.game.isBoardFull()) {
            this.isGameOver = true;
            this.scores.tie++;
            this.saveScores();
            this.showGameOverModal('🤝', "It's a Draw!", 'Every slot is filled with no 4-in-a-row.');
            return true;
        }

        return false;
    }

    highlightWinningCells(coords) {
        coords.forEach(([r, c]) => {
            const cell = this.boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) cell.classList.add('winning');
        });
    }

    showGameOverModal(icon, title, subtitle) {
        this.modalIcon.textContent = icon;
        this.modalTitle.textContent = title;
        this.modalSubtitle.textContent = subtitle;
        setTimeout(() => {
            this.modalOverlay.classList.add('show');
        }, 500);
    }

    restartGame() {
        this.game = new ConnectFour();
        this.ai = new ConnectFourAI(this.game);
        this.isAiThinking = false;
        this.isGameOver = false;
        this.lastMove = null;

        this.modalOverlay.classList.remove('show');
        this.clearColumnHover();
        
        // Remove win glows
        const winningCells = this.boardElement.querySelectorAll('.cell.winning');
        winningCells.forEach(cell => cell.classList.remove('winning'));

        this.updateBoardUI();
        this.updateStatus();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConnectFourUI();
});
