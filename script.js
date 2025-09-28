// Глобальні змінні
let currentImage = null;
let pieces = [];
let correctPieces = 0;
let totalPieces = 0;
let pieceSize = 100;
let boardWidth = 0;
let boardHeight = 0;
let currentLanguage = 'uk';
let childName = '';
let parentEmail = '';

// Функція вибору файлу
function selectFile() {
    document.getElementById('fileInput').click();
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    // Додаємо обробник форми
    document.getElementById('welcomeForm').addEventListener('submit', handleWelcomeForm);
    
    // Додаємо клік на upload area (окрім кнопки)
    const uploadArea = document.querySelector('.upload-area');
    const uploadBtn = document.querySelector('.upload-btn');
    
    uploadArea.addEventListener('click', function(e) {
        // Якщо клікнули не по кнопці, то відкриваємо файловий діалог
        if (e.target !== uploadBtn) {
            selectFile();
        }
    });
    
    // Privacy Policy дата встановлена статично в HTML
});

// Обробка форми входу
function handleWelcomeForm(e) {
    e.preventDefault();
    
    childName = document.getElementById('childName').value.trim();
    parentEmail = document.getElementById('parentEmail').value.trim();
    const privacyConsent = document.getElementById('privacyConsent').checked;
    const marketingConsent = document.getElementById('marketingConsent').checked;
    
    if (!childName || !parentEmail || !privacyConsent) {
        alert(currentLanguage === 'uk' ? 
            'Будь ласка, заповніть всі поля та погодьтеся з політикою конфіденційності!' :
            'Please fill all fields and agree to the privacy policy!');
        return;
    }
    
    // Зберігаємо дані (в реальному проекті відправили б на сервер)
    console.log('User data:', { childName, parentEmail, marketingConsent });
    
    // Персоналізуємо заголовок
    updateGameTitle();
    
    // Показуємо гру
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('gameContent').style.display = 'block';
}

// Оновлення заголовку гри з ім'ям дитини
function updateGameTitle() {
    const gameTitle = document.getElementById('gameTitle');
    if (currentLanguage === 'uk') {
        gameTitle.textContent = `🧩 Пазли для ${childName} 🧩`;
    } else {
        gameTitle.textContent = `🧩 Puzzles for ${childName} 🧩`;
    }
}

// Перемикання мови
function switchLanguage(lang) {
    currentLanguage = lang;
    
    // Оновлюємо активну кнопку
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('lang' + lang.charAt(0).toUpperCase() + lang.slice(1)).classList.add('active');
    
    // Оновлюємо всі тексти
    document.querySelectorAll('[data-' + lang + ']').forEach(element => {
        element.textContent = element.getAttribute('data-' + lang);
    });
    
    // Оновлюємо заголовок гри якщо ім'я вже введено
    if (childName) {
        updateGameTitle();
    }
    
    // Оновлюємо лічильник шматочків
    if (totalPieces > 0) {
        updatePiecesCounter();
    }
}

// Показ політики конфіденційності
function showPrivacyPolicy() {
    document.getElementById('privacyModal').style.display = 'flex';
}

// Закриття політики конфіденційності
function closePrivacyPolicy() {
    document.getElementById('privacyModal').style.display = 'none';
}

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
    const text = currentLanguage === 'uk' ? `Залишилось: ${piecesLeft}` : `Remaining: ${piecesLeft}`;
    document.getElementById('piecesLeft').textContent = text;
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