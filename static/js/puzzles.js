class ChessPuzzles {
    constructor(game) {
        this.game = game;
        this.currentPuzzle = null;
        this.puzzles = [];
        this.loadPuzzles();
    }

    async loadPuzzles() {
        try {
            const response = await fetch('/puzzles');
            this.puzzles = await response.json();
        } catch (error) {
            console.error('Error loading puzzles:', error);
        }
    }

    startPuzzle(level) {
        const puzzle = this.puzzles.find(p => p.level === level);
        if (puzzle) {
            this.currentPuzzle = puzzle;
            this.game.game.load(puzzle.fen);
            this.game.drawBoard();
            return true;
        }
        return false;
    }

    checkPuzzleSolution(move) {
        if (!this.currentPuzzle) return false;
        
        const expectedMove = this.currentPuzzle.solution[0];
        return move.from === expectedMove.from && move.to === expectedMove.to;
    }
}
