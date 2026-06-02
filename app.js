// ============ 全局變量 ============
let words = [];
let currentIndex = 0;

// ============ 初始化應用 ============
document.addEventListener('DOMContentLoaded', () => {
    loadWords();
    renderCard();
    setupEventListeners();
});

// ============ 事件監聽 ============
function setupEventListeners() {
    // 卡片點擊翻轉
    document.getElementById('card').addEventListener('click', toggleCardFlip);

    // 前後按鈕
    document.getElementById('prevBtn').addEventListener('click', prevCard);
    document.getElementById('nextBtn').addEventListener('click', nextCard);

    // 鍵盤快捷鍵
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        toggleCardFlip();
    } else if (e.code === 'ArrowLeft') {
        prevCard();
    } else if (e.code === 'ArrowRight') {
        nextCard();
    }
}

// ============ 卡片翻轉邏輯 ============
function toggleCardFlip() {
    const card = document.getElementById('card');
    card.classList.toggle('flipped');
}

// ============ 導航邏輯 ============
function prevCard() {
    if (currentIndex > 0) {
        currentIndex--;
        resetCard();
    }
}

function nextCard() {
    if (currentIndex < words.length - 1) {
        currentIndex++;
        resetCard();
    }
}

function resetCard() {
    const card = document.getElementById('card');
    card.classList.remove('flipped');
    renderCard();
}

// ============ 渲染卡片 ============
function renderCard() {
    // 更新按鈕狀態
    document.getElementById('prevBtn').disabled = currentIndex === 0;
    document.getElementById('nextBtn').disabled = currentIndex === words.length - 1;

    // 更新計數器
    if (words.length > 0) {
        document.getElementById('cardCounter').textContent = `${currentIndex + 1} / ${words.length}`;
    } else {
        document.getElementById('cardCounter').textContent = '0 / 0';
    }

    // 獲取當前單字
    if (words.length === 0) {
        // 沒有單字時顯示提示
        document.getElementById('frontWord').textContent = 'Click to start';
        document.getElementById('backDefinition').textContent = '-';
        document.getElementById('backPartOfSpeech').textContent = '-';
        document.getElementById('backEtymology').textContent = '-';
    } else {
        const currentWord = words[currentIndex];
        document.getElementById('frontWord').textContent = currentWord.word;
        document.getElementById('backDefinition').textContent = currentWord.definition;
        document.getElementById('backPartOfSpeech').textContent = currentWord.partOfSpeech || '-';
        document.getElementById('backEtymology').textContent = currentWord.etymology || '-';
    }
}

// ============ 本地存儲管理 ============
function loadWords() {
    const stored = localStorage.getItem('words');
    if (stored) {
        try {
            words = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading words:', e);
            words = [];
        }
    }
}

function saveWords() {
    localStorage.setItem('words', JSON.stringify(words));
}

// ============ 導出函數供 manage.js 使用 ============
function getWords() {
    return words;
}

function addWord(wordObj) {
    words.push(wordObj);
    saveWords();
}

function deleteWord(index) {
    words.splice(index, 1);
    saveWords();
}

function updateWord(index, wordObj) {
    words[index] = wordObj;
    saveWords();
}
