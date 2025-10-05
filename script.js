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
let uploadListenersInitialized = false;

// Функція вибору файлу
function selectFile() {
    console.log('selectFile викликано');
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.click();
        console.log('fileInput.click() викликано');
    } else {
        console.error('fileInput не знайдено');
    }
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    // Додаємо обробник форми
    document.getElementById('welcomeForm').addEventListener('submit', handleWelcomeForm);
    
    // Privacy Policy дата встановлена статично в HTML
    // Ініціалізуємо upload listeners одразу, щоб працювало навіть до сабміту форми
    initUploadArea();

    // Ініціалізація Google Sign-In кнопки (GIS)
    const gid = window.google && window.google.accounts && window.google.accounts.id;
    const clientId = (typeof process !== 'undefined' && process.env && process.env.GOOGLE_CLIENT_ID) ? process.env.GOOGLE_CLIENT_ID : undefined;
    if (gid) {
        gid.initialize({
            client_id: clientId || 'GOOGLE_CLIENT_ID_PLACEHOLDER',
            callback: handleGoogleCredential
        });
        const googleButton = document.getElementById('googleButton');
        if (googleButton) {
            gid.renderButton(googleButton, { theme: 'outline', size: 'large', type: 'standard' });
        }
    }
});

// Обробник токена від Google Identity Services
async function handleGoogleCredential(response) {
    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });
        const data = await res.json();
        if (data.ok) {
            // Автозаповнення імені, якщо є
            if (data.user && data.user.name) {
                childName = data.user.name.split(' ')[0];
                updateGameTitle();
            }
            document.getElementById('welcomeSection').style.display = 'none';
            document.getElementById('gameContent').style.display = 'block';
            initUploadArea();
        } else {
            alert('Google sign-in failed');
        }
    } catch (e) {
        console.error(e);
        alert('Network error');
    }
}

// Функція ініціалізації upload area (викликається після показу gameContent)
function initUploadArea() {
    if (uploadListenersInitialized) return;
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');
    
    if (uploadArea) {
        uploadArea.addEventListener('click', function(e) {
            selectFile();
        });
    }
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            selectFile();
        });
    }
    
    if (fileInput) {
        console.log('Додаємо обробник change для fileInput');
        fileInput.addEventListener('change', function(e) {
            console.log('fileInput change event:', e.target.files);
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                console.log('Обрано файл:', file.name, file.type);
                
                // Перевіряємо чи це зображення
                if (!file.type.startsWith('image/')) {
                    alert('Будь ласка, оберіть файл зображення!');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    console.log('FileReader завантажив файл');
                    const img = new Image();
                    img.onload = function() {
                        console.log('Зображення завантажено:', img.width, 'x', img.height);
                        currentImage = img;
                        document.getElementById('uploadSection').style.display = 'none';
                        document.getElementById('difficultySection').style.display = 'block';
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    } else {
        console.error('fileInput не знайдено в initUploadArea');
    }
    uploadListenersInitialized = true;
}

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
    
    // Відправляємо дані на сервер
    fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            childName,
            parentEmail,
            privacyConsent,
            marketingConsent
        })
    }).catch(console.error);
    
    // Персоналізуємо заголовок
    updateGameTitle();
    
    // Показуємо гру
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('gameContent').style.display = 'block';
    
    // Ініціалізуємо upload area після показу gameContent
    initUploadArea();
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
    // Показуємо ігрову секцію ПЕРЕД вимірюванням розмірів
    showGameSection();
    
    // Визначаємо сітку
    let cols, rows;
    if (pieces === 6) { cols = 3; rows = 2; }
    else if (pieces === 12) { cols = 4; rows = 3; }
    else { cols = 5; rows = 4; }
    
    // Отримуємо реальні розміри контейнера (після відображення)
    const puzzleContainer = document.querySelector('.puzzle-container');
    const containerRect = puzzleContainer.getBoundingClientRect();
    const gameAreaRect = document.querySelector('.game-area').getBoundingClientRect();
    const maxWidth = Math.max(0, containerRect.width - 40); // мінус padding
    const maxHeight = Math.max(0, gameAreaRect.height - 40); // висота всієї області гри мінус відступи
    
    // Розраховуємо розміри на основі пропорцій фото та сітки
    const imageAspectRatio = currentImage.width / currentImage.height;
    const gridAspectRatio = cols / rows;
    
    // Визначаємо, що обмежує: ширина чи висота
    let finalWidth, finalHeight;
    
    if (imageAspectRatio > maxWidth / maxHeight) {
        // Обмежує ширина
        finalWidth = maxWidth;
        finalHeight = maxWidth / imageAspectRatio;
    } else {
        // Обмежує висота
        finalHeight = maxHeight;
        finalWidth = maxHeight * imageAspectRatio;
    }
    
    // Розраховуємо розмір одного шматочка
    pieceSize = Math.min(finalWidth / cols, finalHeight / rows);
    
    // Фінальні розміри дошки (точно по сітці)
    boardWidth = pieceSize * cols;
    boardHeight = pieceSize * rows;
    
    console.log('Розрахунок розмірів:', {
        containerSize: { width: maxWidth, height: maxHeight },
        imageAspectRatio,
        gridSize: { cols, rows },
        pieceSize,
        boardSize: { width: boardWidth, height: boardHeight }
    });
    
    createPuzzle(cols, rows);
}

// Створення пазлу
function createPuzzle(cols, rows) {
    // Створюємо canvas з зображенням (без спотворення пропорцій)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = boardWidth;
    canvas.height = boardHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Фон (білий) під листбокс
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Масштаб "contain" всередині дошки
    const scale = Math.min(boardWidth / currentImage.width, boardHeight / currentImage.height);
    const drawW = currentImage.width * scale;
    const drawH = currentImage.height * scale;
    const dx = (boardWidth - drawW) / 2;
    const dy = (boardHeight - drawH) / 2;
    ctx.drawImage(currentImage, dx, dy, drawW, drawH);
    
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
            // Малюнок вже підрізаний під конкретний шматок, тож масштабуємо 1:1
            pieceElement.style.backgroundSize = '100% 100%';
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
            
            // Створюємо зону для скидання з точними розмірами
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