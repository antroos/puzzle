// Глобальні змінні
let currentImage = null;
let pieces = [];
let correctPieces = 0;
let totalPieces = 0;
let pieceSize = 100;
let boardWidth = 0;
let boardHeight = 0;

// Функція вибору файлу
function selectFile() {
    document.getElementById('fileInput').click();
}

// Додаємо клік на upload area (окрім кнопки)
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.querySelector('.upload-area');
    const uploadBtn = document.querySelector('.upload-btn');
    
    uploadArea.addEventListener('click', function(e) {
        // Якщо клікнули не по кнопці, то відкриваємо файловий діалог
        if (e.target !== uploadBtn) {
            selectFile();
        }
    });
});

// Функція завантаження зображення
function loadImage(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            showDifficultySelector();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Показати селектор складності
function showDifficultySelector() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('difficultySection').style.display = 'block';
}

// Початок гри
function startGame(pieces) {
    totalPieces = pieces;
    correctPieces = 0;
    
    // Визначаємо сітку
    let cols, rows;
    if (pieces === 6) { cols = 3; rows = 2; }
    else if (pieces === 12) { cols = 4; rows = 3; }
    else { cols = 5; rows = 4; }
    
    // Розраховуємо розміри
    const maxWidth = 400;
    const maxHeight = 300;
    const aspectRatio = currentImage.width / currentImage.height;
    
    if (aspectRatio > maxWidth / maxHeight) {
        boardWidth = maxWidth;
        boardHeight = maxWidth / aspectRatio;
    } else {
        boardHeight = maxHeight;
        boardWidth = maxHeight * aspectRatio;
    }
    
    pieceSize = Math.min(boardWidth / cols, boardHeight / rows);
    boardWidth = pieceSize * cols;
    boardHeight = pieceSize * rows;
    
    createPuzzle(cols, rows);
    showGameSection();
}

// Створення пазлу
function createPuzzle(cols, rows) {
    // Створюємо canvas з зображенням
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = boardWidth;
    canvas.height = boardHeight;
    ctx.drawImage(currentImage, 0, 0, boardWidth, boardHeight);
    
    // Налаштовуємо дошку
    const puzzleBoard = document.getElementById('puzzleBoard');
    puzzleBoard.style.width = boardWidth + 'px';
    puzzleBoard.style.height = boardHeight + 'px';
    puzzleBoard.innerHTML = '';
    
    // Налаштовуємо область шматочків
    const piecesArea = document.getElementById('piecesArea');
    piecesArea.innerHTML = '';
    
    pieces = [];
    
    // Створюємо шматочки
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Створюємо canvas для шматочка
            const pieceCanvas = document.createElement('canvas');
            const pieceCtx = pieceCanvas.getContext('2d');
            pieceCanvas.width = pieceSize;
            pieceCanvas.height = pieceSize;
            
            // Витягуємо частину зображення
            pieceCtx.drawImage(
                canvas,
                col * pieceSize, row * pieceSize, pieceSize, pieceSize,
                0, 0, pieceSize, pieceSize
            );
            
            // Створюємо елемент шматочка
            const pieceElement = document.createElement('div');
            pieceElement.className = 'puzzle-piece';
            pieceElement.style.width = pieceSize + 'px';
            pieceElement.style.height = pieceSize + 'px';
            pieceElement.style.backgroundImage = `url(${pieceCanvas.toDataURL()})`;
            pieceElement.style.backgroundSize = 'cover';
            pieceElement.draggable = true;
            
            const piece = {
                element: pieceElement,
                correctCol: col,
                correctRow: row,
                isCorrect: false
            };
            
            setupDragAndDrop(piece);
            pieces.push(piece);
            piecesArea.appendChild(pieceElement);
            
            // Створюємо зону для скидання
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.style.position = 'absolute';
            dropZone.style.left = (col * pieceSize) + 'px';
            dropZone.style.top = (row * pieceSize) + 'px';
            dropZone.style.width = pieceSize + 'px';
            dropZone.style.height = pieceSize + 'px';
            dropZone.style.border = '2px dashed transparent';
            dropZone.dataset.col = col;
            dropZone.dataset.row = row;
            
            puzzleBoard.appendChild(dropZone);
        }
    }
    
    shufflePieces();
    updatePiecesCounter();
}

// Налаштування drag & drop
function setupDragAndDrop(piece) {
    let isDragging = false;
    let offsetX, offsetY;
    
    piece.element.addEventListener('mousedown', function(e) {
        if (piece.isCorrect) return;
        
        isDragging = true;
        const rect = piece.element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        piece.element.style.position = 'fixed';
        piece.element.style.zIndex = '1000';
        piece.element.style.left = (e.clientX - offsetX) + 'px';
        piece.element.style.top = (e.clientY - offsetY) + 'px';
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging || piece.isCorrect) return;
        
        piece.element.style.left = (e.clientX - offsetX) + 'px';
        piece.element.style.top = (e.clientY - offsetY) + 'px';
    });
    
    document.addEventListener('mouseup', function(e) {
        if (!isDragging || piece.isCorrect) return;
        
        isDragging = false;
        
        // Перевіряємо чи попав на правильне місце
        const dropZone = getDropZoneUnderCursor(e.clientX, e.clientY);
        
        if (dropZone && isCorrectPosition(piece, dropZone)) {
            placePieceCorrectly(piece, dropZone);
        } else {
            returnPieceToArea(piece);
        }
    });
}

// Знайти зону під курсором
function getDropZoneUnderCursor(x, y) {
    const elements = document.elementsFromPoint(x, y);
    return elements.find(el => el.classList.contains('drop-zone'));
}

// Перевірити правильність позиції
function isCorrectPosition(piece, dropZone) {
    const col = parseInt(dropZone.dataset.col);
    const row = parseInt(dropZone.dataset.row);
    return piece.correctCol === col && piece.correctRow === row;
}

// Розмістити шматочок правильно
function placePieceCorrectly(piece, dropZone) {
    piece.isCorrect = true;
    piece.element.classList.add('correct');
    
    const puzzleBoard = document.getElementById('puzzleBoard');
    piece.element.style.position = 'absolute';
    piece.element.style.left = dropZone.style.left;
    piece.element.style.top = dropZone.style.top;
    piece.element.style.zIndex = '1';
    
    puzzleBoard.appendChild(piece.element);
    dropZone.style.display = 'none';
    
    correctPieces++;
    updatePiecesCounter();
    
    if (correctPieces === totalPieces) {
        setTimeout(showSuccess, 500);
    }
}

// Повернути шматочок в область
function returnPieceToArea(piece) {
    piece.element.style.position = 'relative';
    piece.element.style.left = 'auto';
    piece.element.style.top = 'auto';
    piece.element.style.zIndex = '1';
    
    const piecesArea = document.getElementById('piecesArea');
    piecesArea.appendChild(piece.element);
}

// Перемішати шматочки
function shufflePieces() {
    const piecesArea = document.getElementById('piecesArea');
    const incorrectPieces = pieces.filter(piece => !piece.isCorrect);
    
    // Перемішуємо масив
    for (let i = incorrectPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrectPieces[i], incorrectPieces[j]] = [incorrectPieces[j], incorrectPieces[i]];
    }
    
    // Додаємо назад в область
    incorrectPieces.forEach(piece => {
        returnPieceToArea(piece);
    });
}

// Оновити лічильник
function updatePiecesCounter() {
    const piecesLeft = totalPieces - correctPieces;
    document.getElementById('piecesLeft').textContent = `Залишилось: ${piecesLeft}`;
}

// Показати ігрову секцію
function showGameSection() {
    document.getElementById('difficultySection').style.display = 'none';
    document.getElementById('gameSection').style.display = 'block';
}

// Показати модальне вікно перемоги
function showSuccess() {
    document.getElementById('successModal').style.display = 'flex';
}

// Повернутися назад
function goBack() {
    document.getElementById('gameSection').style.display = 'none';
    document.getElementById('successModal').style.display = 'none';
    document.getElementById('difficultySection').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'block';
    
    // Скидаємо все
    currentImage = null;
    pieces = [];
    correctPieces = 0;
    totalPieces = 0;
    document.getElementById('fileInput').value = '';
}