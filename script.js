class PuzzleGame {
    constructor() {
        this.currentImage = null;
        this.pieces = [];
        this.correctPieces = 0;
        this.totalPieces = 0;
        this.pieceSize = 100;
        this.boardWidth = 0;
        this.boardHeight = 0;
        
        this.initEventListeners();
    }

    initEventListeners() {
        // File upload
        const imageInput = document.getElementById('imageInput');
        const uploadArea = document.getElementById('uploadArea');
        
        imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Drag and drop for file upload
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.processImage(files[0]);
            }
        });
        
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pieces = parseInt(e.target.dataset.pieces);
                this.startGame(pieces);
            });
        });

        // Game controls
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('shuffleBtn').addEventListener('click', () => this.shufflePieces());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.goBack());
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImage(file);
        }
    }

    processImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.showDifficultySelector();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showDifficultySelector() {
        document.getElementById('difficultySelector').style.display = 'block';
        document.querySelector('.upload-area').style.display = 'none';
    }

    startGame(totalPieces) {
        this.totalPieces = totalPieces;
        this.correctPieces = 0;
        
        // Calculate grid size
        const aspectRatio = this.currentImage.width / this.currentImage.height;
        let cols, rows;
        
        if (totalPieces === 6) {
            cols = 3; rows = 2;
        } else if (totalPieces === 12) {
            cols = 4; rows = 3;
        } else {
            cols = 5; rows = 4;
        }

        // Calculate board size
        const maxWidth = 400;
        const maxHeight = 300;
        
        if (aspectRatio > maxWidth / maxHeight) {
            this.boardWidth = maxWidth;
            this.boardHeight = maxWidth / aspectRatio;
        } else {
            this.boardHeight = maxHeight;
            this.boardWidth = maxHeight * aspectRatio;
        }

        this.pieceSize = Math.min(this.boardWidth / cols, this.boardHeight / rows);
        this.boardWidth = this.pieceSize * cols;
        this.boardHeight = this.pieceSize * rows;

        this.createPuzzle(cols, rows);
        this.showGameSection();
    }

    createPuzzle(cols, rows) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.boardWidth;
        canvas.height = this.boardHeight;
        
        // Draw resized image
        ctx.drawImage(this.currentImage, 0, 0, this.boardWidth, this.boardHeight);
        
        // Setup puzzle board
        const puzzleBoard = document.getElementById('puzzleBoard');
        puzzleBoard.style.width = this.boardWidth + 'px';
        puzzleBoard.style.height = this.boardHeight + 'px';
        puzzleBoard.innerHTML = '';
        
        // Setup pieces area
        const piecesArea = document.getElementById('piecesArea');
        piecesArea.innerHTML = '';
        
        this.pieces = [];
        
        // Create pieces
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const piece = this.createPuzzlePiece(canvas, col, row, cols, rows);
                this.pieces.push(piece);
                piecesArea.appendChild(piece.element);
                
                // Create drop zone
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone';
                dropZone.style.left = (col * this.pieceSize) + 'px';
                dropZone.style.top = (row * this.pieceSize) + 'px';
                dropZone.style.width = this.pieceSize + 'px';
                dropZone.style.height = this.pieceSize + 'px';
                dropZone.dataset.correctCol = col;
                dropZone.dataset.correctRow = row;
                
                this.setupDropZone(dropZone);
                puzzleBoard.appendChild(dropZone);
            }
        }
        
        this.shufflePieces();
        this.updatePiecesCounter();
    }

    createPuzzlePiece(sourceCanvas, col, row, totalCols, totalRows) {
        const pieceCanvas = document.createElement('canvas');
        const ctx = pieceCanvas.getContext('2d');
        
        pieceCanvas.width = this.pieceSize;
        pieceCanvas.height = this.pieceSize;
        
        // Extract piece from source
        ctx.drawImage(
            sourceCanvas,
            col * this.pieceSize, row * this.pieceSize,
            this.pieceSize, this.pieceSize,
            0, 0,
            this.pieceSize, this.pieceSize
        );
        
        const pieceElement = document.createElement('div');
        pieceElement.className = 'puzzle-piece';
        pieceElement.style.width = this.pieceSize + 'px';
        pieceElement.style.height = this.pieceSize + 'px';
        pieceElement.style.backgroundImage = `url(${pieceCanvas.toDataURL()})`;
        pieceElement.style.backgroundSize = 'cover';
        pieceElement.draggable = true;
        
        const piece = {
            element: pieceElement,
            correctCol: col,
            correctRow: row,
            currentCol: -1,
            currentRow: -1,
            isCorrect: false
        };
        
        this.setupDragAndDrop(piece);
        
        return piece;
    }

    setupDragAndDrop(piece) {
        let isDragging = false;
        let startX, startY, offsetX, offsetY;

        piece.element.addEventListener('mousedown', (e) => {
            if (piece.isCorrect) return;
            
            isDragging = true;
            piece.element.classList.add('dragging');
            
            const rect = piece.element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            startX = e.clientX - offsetX;
            startY = e.clientY - offsetY;
            
            piece.element.style.position = 'fixed';
            piece.element.style.left = startX + 'px';
            piece.element.style.top = startY + 'px';
            piece.element.style.zIndex = '1000';
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || piece.isCorrect) return;
            
            piece.element.style.left = (e.clientX - offsetX) + 'px';
            piece.element.style.top = (e.clientY - offsetY) + 'px';
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging || piece.isCorrect) return;
            
            isDragging = false;
            piece.element.classList.remove('dragging');
            
            // Check if dropped on correct position
            const dropZone = this.getDropZoneUnderCursor(e.clientX, e.clientY);
            
            if (dropZone && this.isCorrectPosition(piece, dropZone)) {
                this.placePieceCorrectly(piece, dropZone);
            } else {
                // Return to pieces area
                this.returnPieceToArea(piece);
            }
        });

        // Touch events for mobile
        piece.element.addEventListener('touchstart', (e) => {
            if (piece.isCorrect) return;
            
            const touch = e.touches[0];
            isDragging = true;
            piece.element.classList.add('dragging');
            
            const rect = piece.element.getBoundingClientRect();
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            
            piece.element.style.position = 'fixed';
            piece.element.style.left = (touch.clientX - offsetX) + 'px';
            piece.element.style.top = (touch.clientY - offsetY) + 'px';
            piece.element.style.zIndex = '1000';
            
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging || piece.isCorrect) return;
            
            const touch = e.touches[0];
            piece.element.style.left = (touch.clientX - offsetX) + 'px';
            piece.element.style.top = (touch.clientY - offsetY) + 'px';
            
            e.preventDefault();
        });

        document.addEventListener('touchend', (e) => {
            if (!isDragging || piece.isCorrect) return;
            
            isDragging = false;
            piece.element.classList.remove('dragging');
            
            const touch = e.changedTouches[0];
            const dropZone = this.getDropZoneUnderCursor(touch.clientX, touch.clientY);
            
            if (dropZone && this.isCorrectPosition(piece, dropZone)) {
                this.placePieceCorrectly(piece, dropZone);
            } else {
                this.returnPieceToArea(piece);
            }
        });
    }

    setupDropZone(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('highlight');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('highlight');
        });
    }

    getDropZoneUnderCursor(x, y) {
        const elements = document.elementsFromPoint(x, y);
        return elements.find(el => el.classList.contains('drop-zone'));
    }

    isCorrectPosition(piece, dropZone) {
        const correctCol = parseInt(dropZone.dataset.correctCol);
        const correctRow = parseInt(dropZone.dataset.correctRow);
        
        return piece.correctCol === correctCol && piece.correctRow === correctRow;
    }

    placePieceCorrectly(piece, dropZone) {
        piece.isCorrect = true;
        piece.element.classList.add('correct');
        
        const puzzleBoard = document.getElementById('puzzleBoard');
        const boardRect = puzzleBoard.getBoundingClientRect();
        
        piece.element.style.position = 'absolute';
        piece.element.style.left = dropZone.style.left;
        piece.element.style.top = dropZone.style.top;
        piece.element.style.zIndex = '1';
        
        puzzleBoard.appendChild(piece.element);
        dropZone.style.display = 'none';
        
        this.correctPieces++;
        this.updatePiecesCounter();
        
        if (this.correctPieces === this.totalPieces) {
            setTimeout(() => this.showSuccess(), 500);
        }
    }

    returnPieceToArea(piece) {
        piece.element.style.position = 'relative';
        piece.element.style.left = 'auto';
        piece.element.style.top = 'auto';
        piece.element.style.zIndex = '1';
        
        const piecesArea = document.getElementById('piecesArea');
        piecesArea.appendChild(piece.element);
    }

    shufflePieces() {
        const piecesArea = document.getElementById('piecesArea');
        const incorrectPieces = this.pieces.filter(piece => !piece.isCorrect);
        
        // Shuffle array
        for (let i = incorrectPieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [incorrectPieces[i], incorrectPieces[j]] = [incorrectPieces[j], incorrectPieces[i]];
        }
        
        // Re-add to pieces area
        incorrectPieces.forEach(piece => {
            this.returnPieceToArea(piece);
        });
    }

    updatePiecesCounter() {
        const piecesLeft = this.totalPieces - this.correctPieces;
        document.getElementById('piecesLeft').textContent = `Залишилось: ${piecesLeft}`;
    }

    showGameSection() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('gameSection').style.display = 'block';
    }

    showSuccess() {
        document.getElementById('successModal').style.display = 'flex';
    }

    goBack() {
        document.getElementById('gameSection').style.display = 'none';
        document.getElementById('successModal').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('difficultySelector').style.display = 'none';
        document.querySelector('.upload-area').style.display = 'block';
        
        // Reset
        this.pieces = [];
        this.correctPieces = 0;
        this.currentImage = null;
        document.getElementById('imageInput').value = '';
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
});