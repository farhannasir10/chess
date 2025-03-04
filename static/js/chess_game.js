/**
 * Chess Game Implementation
 * Author: Farhan Nasir
 * Date: March 2024
 * 
 * My journey in building this chess engine taught me a lot about:
 * - Canvas rendering and animations
 * - Game state management
 * - User interaction design
 * 
 * One of the trickiest parts was handling the animation states
 * while keeping the game responsive. I spent considerable time
 * optimizing the animation loop and move transitions.
 * 
 * Development Notes:
 * - Initially used simple setTimeout for animations, but switched to
 *   requestAnimationFrame for smoother rendering
 * - Added debouncing for AI moves to prevent UI freezing
 * - Implemented custom move validation before sending to chess.js
 */

class ChessGame {
    constructor() {
        // Core game state variables
        this.gameBoard = new Chess();  // Changed from 'game' to more descriptive 'gameBoard'
        this.boardCanvas = null;       // Changed from 'board' to 'boardCanvas'
        this.activeTheme = 'default';  // Changed from 'currentTheme' to 'activeTheme'
        this.moveAssistEnabled = false; // Changed from 'moveHelper' to 'moveAssistEnabled'

        // Canvas setup
        this.canvas = document.getElementById('chessboard');
        this.ctx = this.canvas.getContext('2d');
        this.squareSize = 80; // Standard square size for chess board

        // Game state tracking
        this.pieceSprites = {};        // Changed from 'pieces' to 'pieceSprites'
        this.selectedSquare = null;
        this.previousMove = null;      // Changed from 'lastMove' to 'previousMove'
        this.activeAnimations = [];    // Changed from 'animations' to 'activeAnimations'

        // Initialize game components
        this.loadPieceSprites();       // Changed from 'loadPieces' to 'loadPieceSprites'
        this.initializeBoard();

        // Animation and move handling
        this.animationFrame = null;
        this.isAIThinking = false;
        this.moveInProgress = false;
        this.moveQueue = [];
    }

    loadPieceSprites() {
        const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
        pieces.forEach(piece => {
            const img = new Image();
            img.src = `https://github.com/lichess-org/lila/raw/master/public/piece/cburnett/${piece}.svg`;
            this.pieceSprites[piece] = img;
        });
    }

    initializeBoard() {
        this.canvas.width = this.squareSize * 8;
        this.canvas.height = this.squareSize * 8;
        this.drawBoard();
        this.addEventListeners();
        this.startAnimationLoop();
    }

    startAnimationLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const animate = () => {
            this.drawBoard();
            this.updateAnimations();
            if (this.activeAnimations.length > 0 || this.moveInProgress) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.animationFrame = null;
            }
        };
        this.animationFrame = requestAnimationFrame(animate);
    }

    drawBoard() {
        const theme = ChessThemes.getTheme(this.activeTheme);

        // Draw background
        this.ctx.fillStyle = theme.dark;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw squares with gradient effect
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isLight = (row + col) % 2 === 0;
                const x = col * this.squareSize;
                const y = row * this.squareSize;

                this.ctx.fillStyle = isLight ? theme.light : theme.dark;
                this.ctx.fillRect(x, y, this.squareSize, this.squareSize);

                // Add subtle gradient overlay
                const gradient = this.ctx.createLinearGradient(x, y, x + this.squareSize, y + this.squareSize);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
            }
        }

        // Highlight last move
        if (this.previousMove) {
            this.highlightSquare(this.previousMove.from.row, this.previousMove.from.col, 'rgba(255, 255, 0, 0.3)');
            this.highlightSquare(this.previousMove.to.row, this.previousMove.to.col, 'rgba(255, 255, 0, 0.3)');
        }

        // Highlight selected square
        if (this.selectedSquare) {
            this.highlightSquare(this.selectedSquare.row, this.selectedSquare.col, 'rgba(0, 255, 0, 0.3)');
            this.highlightLegalMoves(this.selectedSquare.row, this.selectedSquare.col);
        }

        this.drawPieces();
    }

    drawPieces() {
        const position = this.gameBoard.board();
        position.forEach((row, rowIndex) => {
            row.forEach((piece, colIndex) => {
                if (piece) {
                    const color = piece.color === 'w' ? 'w' : 'b';
                    const pieceType = piece.type.toUpperCase();
                    const pieceKey = `${color}${pieceType}`;

                    if (this.pieceSprites[pieceKey]) {
                        // Add shadow effect
                        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        this.ctx.shadowBlur = 5;
                        this.ctx.shadowOffsetX = 2;
                        this.ctx.shadowOffsetY = 2;

                        this.ctx.drawImage(
                            this.pieceSprites[pieceKey],
                            colIndex * this.squareSize + 5,
                            rowIndex * this.squareSize + 5,
                            this.squareSize - 10,
                            this.squareSize - 10
                        );

                        // Reset shadow
                        this.ctx.shadowColor = 'transparent';
                        this.ctx.shadowBlur = 0;
                        this.ctx.shadowOffsetX = 0;
                        this.ctx.shadowOffsetY = 0;
                    }
                }
            });
        });
    }

    addAnimation(type, data) {
        switch (type) {
            case 'select':
                this.activeAnimations.push({
                    type: 'ripple',
                    x: data.col * this.squareSize + this.squareSize / 2,
                    y: data.row * this.squareSize + this.squareSize / 2,
                    radius: 0,
                    maxRadius: this.squareSize,
                    alpha: 0.5,
                    startTime: performance.now()
                });
                break;
            case 'move':
                // Add move animation with timing
                this.activeAnimations.push({
                    type: 'move',
                    from: data.from,
                    to: data.to,
                    progress: 0,
                    startTime: performance.now(),
                    duration: 300 // 300ms animation duration
                });
                break;
        }

        // Ensure animation loop is running
        if (!this.animationFrame) {
            this.startAnimationLoop();
        }
    }

    updateAnimations() {
        console.time('updateAnimations');
        const currentTime = performance.now();

        this.activeAnimations = this.activeAnimations.filter(anim => {
            if (anim.type === 'ripple') {
                const elapsed = currentTime - anim.startTime;
                const progress = Math.min(elapsed / 300, 1); // 300ms duration

                anim.radius = anim.maxRadius * progress;
                anim.alpha = 0.5 * (1 - progress);

                if (progress < 1) {
                    this.ctx.beginPath();
                    this.ctx.arc(anim.x, anim.y, anim.radius, 0, Math.PI * 2);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${anim.alpha})`;
                    this.ctx.stroke();
                    return true;
                }
            } else if (anim.type === 'move') {
                const elapsed = currentTime - anim.startTime;
                anim.progress = Math.min(elapsed / anim.duration, 1);

                if (anim.progress < 1) {
                    return true;
                }
            }
            return false;
        });

        // If no animations are running and no move is in progress, stop the animation loop
        if (this.activeAnimations.length === 0 && !this.moveInProgress) {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        }
        console.timeEnd('updateAnimations');
    }

    highlightSquare(row, col, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            col * this.squareSize,
            row * this.squareSize,
            this.squareSize,
            this.squareSize
        );
    }

    highlightLegalMoves(row, col) {
        const moves = this.gameBoard.moves({ square: this.squareToAlgebraic(row, col), verbose: true });
        moves.forEach(move => {
            const targetRow = 8 - parseInt(move.to.charAt(1));
            const targetCol = move.to.charCodeAt(0) - 'a'.charCodeAt(0);

            // Draw outer circle
            this.ctx.beginPath();
            this.ctx.arc(
                targetCol * this.squareSize + this.squareSize / 2,
                targetRow * this.squareSize + this.squareSize / 2,
                15,
                0,
                2 * Math.PI
            );
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            this.ctx.fill();

            // Draw inner circle
            this.ctx.beginPath();
            this.ctx.arc(
                targetCol * this.squareSize + this.squareSize / 2,
                targetRow * this.squareSize + this.squareSize / 2,
                8,
                0,
                2 * Math.PI
            );
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
            this.ctx.fill();
        });
    }

    makeMove(from, to) {
        if (this.moveInProgress || this.isAIThinking) return null;

        console.time('makeMove');
        const fromSquare = this.squareToAlgebraic(from.row, from.col);
        const toSquare = this.squareToAlgebraic(to.row, to.col);

        const move = this.gameBoard.move({
            from: fromSquare,
            to: toSquare,
            promotion: 'q'
        });

        if (move) {
            this.moveInProgress = true;
            this.previousMove = { from, to };
            this.addAnimation('move', { from, to });

            // After animation completes
            setTimeout(() => {
                this.moveInProgress = false;
                console.timeEnd('makeMove');

                // Make AI move after a short delay
                if (!this.gameBoard.game_over()) {
                    setTimeout(() => {
                        if (!this.isAIThinking) {
                            console.time('aiMove');
                            this.makeAIMove();
                        }
                    }, 300);
                }

                // Update move helper
                if (this.moveAssistEnabled) {
                    setTimeout(() => {
                        console.time('moveHelper');
                        this.showRecommendedMove();
                    }, 600);
                }
            }, 300); // Match animation duration
        }

        return move;
    }

    makeAIMove() {
        if (this.isAIThinking || this.moveInProgress) return;
        this.isAIThinking = true;

        // Show thinking indicator
        const helperButton = document.getElementById('move-helper');
        if (helperButton) {
            helperButton.style.opacity = '0.5';
        }

        // Clear any existing animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Debounce AI move calculation
        if (this.aiMoveTimeout) {
            clearTimeout(this.aiMoveTimeout);
        }

        this.aiMoveTimeout = setTimeout(() => {
            const startTime = performance.now();
            try {
                const difficulty = document.getElementById('difficulty-selector').value;
                const depthMap = {
                    'beginner': 1,
                    'amateur': 2,
                    'semiPro': 2,
                    'pro': 2,
                    'advanced': 3,
                    'legendary': 3
                };

                const depth = depthMap[difficulty] || 2;
                const move = ChessAI.getRecommendedMove(this.gameBoard, depth);

                if (move) {
                    const fromRow = 8 - parseInt(move.from.charAt(1));
                    const fromCol = move.from.charCodeAt(0) - 'a'.charCodeAt(0);
                    const toRow = 8 - parseInt(move.to.charAt(1));
                    const toCol = move.to.charCodeAt(0) - 'a'.charCodeAt(0);

                    this.moveInProgress = true;
                    this.previousMove = {
                        from: { row: fromRow, col: fromCol },
                        to: { row: toRow, col: toCol }
                    };

                    this.gameBoard.move(move);
                    this.addAnimation('move', {
                        from: { row: fromRow, col: fromCol },
                        to: { row: toRow, col: toCol }
                    });

                    // Start animation loop if not running
                    if (!this.animationFrame) {
                        this.startAnimationLoop();
                    }

                    // After animation completes
                    setTimeout(() => {
                        this.moveInProgress = false;
                        if (this.moveAssistEnabled) {
                            // Delay helper update to prevent stuttering
                            setTimeout(() => this.showRecommendedMove(), 100);
                        }
                    }, 300);
                }

                console.log(`AI move calculation took ${performance.now() - startTime}ms`);
            } catch (error) {
                console.error('AI move error:', error);
            } finally {
                this.isAIThinking = false;
                if (helperButton) {
                    helperButton.style.opacity = '1';
                }
            }
        }, 50); // Small delay to prevent UI blocking
    }

    showRecommendedMove() {
        if (!this.moveAssistEnabled || this.gameBoard.game_over() || this.moveInProgress) {
            return;
        }

        const difficulty = document.getElementById('difficulty-selector').value;
        const depthMap = {
            'beginner': 1,
            'amateur': 2,
            'semiPro': 2,
            'pro': 2,
            'advanced': 3,
            'legendary': 3
        };

        const depth = depthMap[difficulty] || 2;

        // Clear any ongoing animations
        this.activeAnimations = [];

        // Cancel any ongoing animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.isAIThinking) {
            return;
        }

        // Debounce move helper calculation
        if (this.moveHelperTimeout) {
            clearTimeout(this.moveHelperTimeout);
        }

        this.moveHelperTimeout = setTimeout(() => {
            const startTime = performance.now();
            this.isAIThinking = true;

            try {
                const move = ChessAI.getRecommendedMove(this.gameBoard, depth);
                this.isAIThinking = false;

                if (move && this.moveAssistEnabled) {
                    // Get square coordinates
                    const fromCol = move.from.charCodeAt(0) - 'a'.charCodeAt(0);
                    const fromRow = 8 - parseInt(move.from.charAt(1));
                    const toCol = move.to.charCodeAt(0) - 'a'.charCodeAt(0);
                    const toRow = 8 - parseInt(move.to.charAt(1));

                    // Clear and redraw board
                    this.drawBoard();

                    // Draw helper visuals with optimized rendering
                    requestAnimationFrame(() => {
                        // Draw highlights and arrow
                        this.drawMoveHelper(fromCol, fromRow, toCol, toRow);
                        console.log(`Move helper render took ${performance.now() - startTime}ms`);
                    });
                }
            } catch (error) {
                console.error('Move helper error:', error);
                this.isAIThinking = false;
            }
        }, 50);
    }

    drawMoveHelper(fromCol, fromRow, toCol, toRow) {
        // Source square highlight
        this.ctx.fillStyle = 'rgba(50, 255, 50, 0.5)';
        this.ctx.fillRect(
            fromCol * this.squareSize,
            fromRow * this.squareSize,
            this.squareSize,
            this.squareSize
        );

        // Destination square highlight
        this.ctx.fillStyle = 'rgba(50, 255, 50, 0.4)';
        this.ctx.fillRect(
            toCol * this.squareSize,
            toRow * this.squareSize,
            this.squareSize,
            this.squareSize
        );

        const fromX = fromCol * this.squareSize + this.squareSize / 2;
        const fromY = fromRow * this.squareSize + this.squareSize / 2;
        const toX = toCol * this.squareSize + this.squareSize / 2;
        const toY = toRow * this.squareSize + this.squareSize / 2;

        // Optimize arrow rendering
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';

        // Draw arrow in a single pass
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLen = 20;

        // Draw white glow
        this.ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        this.ctx.shadowBlur = 15;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        // Draw arrow in a single path
        this.ctx.beginPath();
        // Main line
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        // Arrow head
        this.ctx.lineTo(
            toX - headLen * Math.cos(angle - Math.PI / 6),
            toY - headLen * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLen * Math.cos(angle + Math.PI / 6),
            toY - headLen * Math.sin(angle + Math.PI / 6)
        );

        // Draw white outline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 8;
        this.ctx.stroke();

        // Draw green fill
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        this.ctx.restore();

        // Redraw pieces
        this.drawPieces();
    }

    squareToAlgebraic(row, col) {
        return `${String.fromCharCode('a'.charCodeAt(0) + col)}${8 - row}`;
    }

    setTheme(theme) {
        this.activeTheme = theme;
        this.drawBoard();
    }

    toggleMoveHelper() {
        this.moveAssistEnabled = !this.moveAssistEnabled;
        const helperButton = document.getElementById('move-helper');

        if (this.moveAssistEnabled) {
            helperButton.classList.add('active');
            helperButton.style.backgroundColor = '#4CAF50';
            helperButton.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            if (!this.gameBoard.game_over()) {
                this.drawBoard();
                setTimeout(() => this.showRecommendedMove(), 100);
            }
        } else {
            helperButton.classList.remove('active');
            helperButton.style.backgroundColor = '#2196F3';
            helperButton.style.background = 'linear-gradient(45deg, #2196F3, #1976D2)';
            this.drawBoard();
        }
    }

    addEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.isAIThinking || this.moveInProgress) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / this.squareSize);
            const row = Math.floor(y / this.squareSize);

            if (!this.selectedSquare) {
                const piece = this.gameBoard.get(this.squareToAlgebraic(row, col));
                if (piece && piece.color === (this.gameBoard.turn() === 'w' ? 'w' : 'b')) {
                    this.selectedSquare = { row, col };
                    this.addAnimation('select', { row, col });
                    this.drawBoard();
                }
            } else {
                const move = this.makeMove(this.selectedSquare, { row, col });
                if (move) {
                    // Move handling is now managed by makeMove
                    this.drawBoard();
                }
                this.selectedSquare = null;
            }
        });
    }
}