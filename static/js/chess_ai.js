const ChessAI = {
    difficulties: {
        beginner: 1,
        amateur: 2,
        semiPro: 3,
        pro: 4,
        advanced: 5,
        legendary: 6
    },

    // Piece-square tables for positional evaluation
    pieceSquareTables: {
        p: [ // Pawns
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        n: [ // Knights
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        b: [ // Bishops
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        r: [ // Rooks
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ],
        q: [ // Queen
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ],
        k: [ // King - Middle game
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ]
    },

    getRecommendedMove(game, depth) {
        console.time('getRecommendedMove');
        const startTime = Date.now();
        const timeLimit = 1000; // 1 second time limit
        const result = this.getBestMove(game, depth, startTime, timeLimit);
        console.timeEnd('getRecommendedMove');
        return result;
    },

    getBestMove(game, depth, startTime, timeLimit) {
        const moves = game.moves({ verbose: true });
        let bestMove = null;
        let bestValue = -Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        // If taking too long, return the best move found so far
        if (Date.now() - startTime > timeLimit) {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        // Sort moves for better alpha-beta pruning
        moves.sort((a, b) => {
            return this.getMoveScore(game, b) - this.getMoveScore(game, a);
        });

        for (const move of moves) {
            game.move(move);
            const value = -this.minimax(game, depth - 1, -beta, -alpha, false, startTime, timeLimit);
            game.undo();

            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }

        return bestMove || moves[Math.floor(Math.random() * moves.length)];
    },

    minimax(game, depth, alpha, beta, isMaximizing, startTime, timeLimit) {
        if (depth === 0 || game.game_over() || Date.now() - startTime > timeLimit) {
            return this.evaluatePosition(game);
        }

        const moves = game.moves();

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                game.move(move);
                const eval = this.minimax(game, depth - 1, alpha, beta, false, startTime, timeLimit);
                game.undo();
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                game.move(move);
                const eval = this.minimax(game, depth - 1, alpha, beta, true, startTime, timeLimit);
                game.undo();
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    },

    getMoveScore(game, move) {
        let score = 0;
        const piece = game.get(move.from);
        const capturedPiece = game.get(move.to);

        // Capturing moves
        if (capturedPiece) {
            score += 10 * this.getPieceValue(capturedPiece.type) - this.getPieceValue(piece.type);
        }

        // Pawn promotion
        if (move.promotion) {
            score += 800;
        }

        // Center control for knights and bishops
        if ((piece.type === 'n' || piece.type === 'b') && 
            (move.to.charAt(0) === 'd' || move.to.charAt(0) === 'e') && 
            (move.to.charAt(1) === '4' || move.to.charAt(1) === '5')) {
            score += 30;
        }

        // Penalize moving king in early/middle game except castling
        if (piece.type === 'k' && !this.isEndgame(game)) {
            if (move.flags.includes('k') || move.flags.includes('q')) {
                score += 40; // Encourage castling
            } else {
                score -= 50;
            }
        }

        return score;
    },

    isEndgame(game) {
        const board = game.board();
        let pieceCount = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col]) pieceCount++;
            }
        }
        return pieceCount <= 12;
    },

    evaluatePosition(game) {
        if (game.in_checkmate()) {
            return game.turn() === 'w' ? -Infinity : Infinity;
        }
        if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
            return 0;
        }

        const board = game.board();
        let score = 0;
        const isEndgame = this.isEndgame(game);

        // Material and position evaluation
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    // Base piece value
                    const pieceValue = this.getPieceValue(piece.type);
                    score += piece.color === 'w' ? pieceValue : -pieceValue;

                    // Position value
                    const positionValue = this.getPositionValue(piece, row, col, isEndgame);
                    score += piece.color === 'w' ? positionValue : -positionValue;
                }
            }
        }

        // Mobility evaluation
        const mobilityScore = this.evaluateMobility(game);
        score += mobilityScore;

        // Pawn structure evaluation
        const pawnScore = this.evaluatePawnStructure(board);
        score += pawnScore;

        // King safety
        const kingSafetyScore = this.evaluateKingSafety(game, board);
        score += kingSafetyScore;

        return score;
    },

    getPieceValue(pieceType) {
        const values = {
            p: 100,
            n: 320,
            b: 330,
            r: 500,
            q: 900,
            k: 20000
        };
        return values[pieceType];
    },

    getPositionValue(piece, row, col, isEndgame) {
        let table = this.pieceSquareTables[piece.type];
        if (piece.color === 'b') {
            // Flip the table for black pieces
            row = 7 - row;
        }
        return table[row][col];
    },

    evaluateMobility(game) {
        const moves = game.moves().length;
        return moves * 10; // Mobility bonus
    },

    evaluatePawnStructure(board) {
        let score = 0;
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        // Evaluate pawn structure
        for (let col = 0; col < 8; col++) {
            let isolatedPawn = true;
            let doubledPawns = 0;
            let previousPawn = false;

            for (let row = 0; row < 8; row++) {
                const piece = board[row][col];
                if (piece && piece.type === 'p') {
                    // Check for doubled pawns
                    if (previousPawn) {
                        doubledPawns++;
                        score -= 20; // Penalty for doubled pawns
                    }
                    previousPawn = true;

                    // Check for isolated pawns
                    if (col > 0) {
                        for (let r = 0; r < 8; r++) {
                            const leftPiece = board[r][col-1];
                            if (leftPiece && leftPiece.type === 'p' && leftPiece.color === piece.color) {
                                isolatedPawn = false;
                            }
                        }
                    }
                    if (col < 7) {
                        for (let r = 0; r < 8; r++) {
                            const rightPiece = board[r][col+1];
                            if (rightPiece && rightPiece.type === 'p' && rightPiece.color === piece.color) {
                                isolatedPawn = false;
                            }
                        }
                    }

                    if (isolatedPawn) {
                        score -= 15; // Penalty for isolated pawns
                    }
                }
            }
        }

        return score;
    },

    evaluateKingSafety(game, board) {
        let score = 0;
        const isEndgame = this.isEndgame(game);

        if (!isEndgame) {
            // Find kings
            let whiteKing = null;
            let blackKing = null;

            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const piece = board[row][col];
                    if (piece && piece.type === 'k') {
                        if (piece.color === 'w') {
                            whiteKing = {row, col};
                        } else {
                            blackKing = {row, col};
                        }
                    }
                }
            }

            // Evaluate pawn shield
            if (whiteKing) {
                score += this.evaluatePawnShield(board, whiteKing, 'w');
            }
            if (blackKing) {
                score -= this.evaluatePawnShield(board, blackKing, 'b');
            }
        }

        return score;
    },

    evaluatePawnShield(board, kingPos, color) {
        let score = 0;
        const direction = color === 'w' ? -1 : 1;

        // Check pawns in front of king
        for (let col = Math.max(0, kingPos.col - 1); col <= Math.min(7, kingPos.col + 1); col++) {
            let foundPawn = false;
            for (let row = kingPos.row; row !== kingPos.row + (2 * direction) && row >= 0 && row < 8; row += direction) {
                const piece = board[row][col];
                if (piece && piece.type === 'p' && piece.color === color) {
                    foundPawn = true;
                    score += 10; // Bonus for each pawn protecting the king
                    break;
                }
            }
            if (!foundPawn) {
                score -= 15; // Penalty for missing pawn shield
            }
        }

        return score;
    }
};