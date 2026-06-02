// ============ 全局變量 ============
let allWords = [];
let editingIndex = null;

// ============ 初始化應用 ============
document.addEventListener('DOMContentLoaded', () => {
    loadWords();
    renderWordList();
    setupFormListeners();
});

// ============ 事件監聽設置 ============
function setupFormListeners() {
    document.getElementById('addWordForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('autoFillBtn').addEventListener('click', handleAutoFill);
}

// ============ 表單提交 ============
function handleFormSubmit(e) {
    e.preventDefault();

    const word = document.getElementById('word').value.trim();
    const definition = document.getElementById('definition').value.trim();
    const partOfSpeech = document.getElementById('partOfSpeech').value.trim();
    const etymology = document.getElementById('etymology').value.trim();
    const example = document.getElementById('example').value.trim();

    // 驗證必填字段
    if (!word || !definition) {
        showNotification('請填寫英文單字和中文解釋', 'error');
        return;
    }

    const newWord = {
        word,
        definition,
        partOfSpeech,
        etymology,
        example,
        addedDate: new Date().toISOString()
    };

    if (editingIndex !== null) {
        allWords[editingIndex] = newWord;
        editingIndex = null;
    } else {
        allWords.push(newWord);
    }

    saveWords();
    resetForm();
    renderWordList();
    showNotification('✓ 單字已保存', 'success');
}

// ============ 自動填入功能 ============
async function handleAutoFill() {
    const wordInput = document.getElementById('word').value.trim();

    if (!wordInput) {
        showNotification('請先輸入英文單字', 'error');
        return;
    }

    const btn = document.getElementById('autoFillBtn');
    btn.disabled = true;
    showLoadingSpinner(true);

    try {
        // 1. 從 Free Dictionary API 獲取單字信息
        const dictData = await fetchFromDictionary(wordInput);

        if (dictData) {
            // 填入詞性
            if (dictData.partOfSpeech) {
                document.getElementById('partOfSpeech').value = dictData.partOfSpeech;
            }

            // 2. 獲取翻譯（中文解釋）
            if (!document.getElementById('definition').value) {
                const translation = await fetchTranslation(wordInput);
                if (translation) {
                    document.getElementById('definition').value = translation;
                }
            }

            // 3. 分析字根（簡單實現）
            const etymology = analyzeEtymology(wordInput);
            if (etymology && !document.getElementById('etymology').value) {
                document.getElementById('etymology').value = etymology;
            }

            // 4. 添加例句
            if (dictData.example && !document.getElementById('example').value) {
                document.getElementById('example').value = dictData.example;
            }

            showNotification('✓ 自動填入完成', 'success');
        } else {
            showNotification('⚠ 無法找到該單字的信息，請手動填寫', 'info');
        }
    } catch (error) {
        console.error('Error in auto-fill:', error);
        showNotification('✗ 自動填入失敗，請檢查網絡連接', 'error');
    } finally {
        btn.disabled = false;
        showLoadingSpinner(false);
    }
}

// ============ API 調用函數 ============

// 從 Free Dictionary API 獲取單字信息
async function fetchFromDictionary(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
        
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        
        if (data.length === 0) {
            return null;
        }

        const entry = data[0];
        let partOfSpeech = '';
        let example = '';

        // 獲取詞性和例句
        if (entry.meanings && entry.meanings.length > 0) {
            const meaning = entry.meanings[0];
            
            if (meaning.partOfSpeech) {
                partOfSpeech = getChinesePartOfSpeech(meaning.partOfSpeech);
            }

            if (meaning.definitions && meaning.definitions.length > 0) {
                example = meaning.definitions[0].example || '';
            }
        }

        return {
            partOfSpeech,
            example
        };
    } catch (error) {
        console.error('Dictionary API error:', error);
        return null;
    }
}

// 將英文詞性轉換為中文
function getChinesePartOfSpeech(englishPos) {
    const posMap = {
        'noun': 'n.',
        'verb': 'v.',
        'adjective': 'adj.',
        'adverb': 'adv.',
        'preposition': 'prep.',
        'conjunction': 'conj.',
        'pronoun': 'pron.',
        'interjection': 'int.',
        'article': 'art.'
    };
    return posMap[englishPos] || englishPos;
}

// 使用 MyMemory API 進行翻譯
async function fetchTranslation(word) {
    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-TW`
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }

        return null;
    } catch (error) {
        console.error('Translation API error:', error);
        return null;
    }
}

// 簡單的字根分析
function analyzeEtymology(word) {
    // 這是一個簡單的實現，可以根據常見的詞根進行分析
    const etymologies = {
        'un': '表示"不、無"',
        're': '表示"再、重新"',
        'pre': '表示"在...之前、預先"',
        'dis': '表示"不、分開"',
        'over': '表示"過度、超過"',
        'sub': '表示"下、次"',
        'inter': '表示"在...之間"',
        'super': '表示"超級、超過"',
        'trans': '表示"越過、轉移"',
        'able': '表示"能夠、可以"',
        'ible': '表示"能夠、可以"',
        'tion': '名詞後綴',
        'sion': '名詞後綴',
        'ment': '名詞後綴',
        'ness': '名詞後綴',
        'ing': '現在分詞、動名詞',
        'ed': '過去式、過去分詞',
        'er': '比較級、表示"做...的人"',
        'est': '最高級',
        'ly': '副詞後綴',
        'less': '表示"沒有、無"',
        'ful': '表示"充滿、有很多"',
        'ous': '形容詞後綴，表示"有...性質的"',
        'ive': '形容詞後綴',
        'al': '形容詞後綴',
        'ic': '形容詞後綴'
    };

    let etymology = '';
    const lowerWord = word.toLowerCase();

    // 檢查前綴
    for (const [prefix, meaning] of Object.entries(etymologies)) {
        if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length) {
            if (prefix.length <= 4) {
                etymology += `前綴 "${prefix}": ${meaning}\n`;
                break;
            }
        }
    }

    // 檢查後綴
    for (const [suffix, meaning] of Object.entries(etymologies)) {
        if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length) {
            if (suffix.length <= 4 || suffix === 'ment' || suffix === 'ness') {
                etymology += `後綴 "${suffix}": ${meaning}`;
                break;
            }
        }
    }

    return etymology.trim() || '無法分析字根';
}

// ============ 單字列表管理 ============
function renderWordList() {
    const wordList = document.getElementById('wordList');
    const wordCount = document.getElementById('wordCount');

    // 更新計數
    wordCount.textContent = allWords.length;

    // 清空列表
    wordList.innerHTML = '';

    if (allWords.length === 0) {
        wordList.innerHTML = '<p class="empty-message">還沒有新增單字，開始添加吧！</p>';
        return;
    }

    // 渲染每個單字
    allWords.forEach((word, index) => {
        const wordItem = createWordItem(word, index);
        wordList.appendChild(wordItem);
    });
}

function createWordItem(word, index) {
    const item = document.createElement('div');
    item.className = 'word-item';
    item.innerHTML = `
        <div class="word-item-word">${escapeHtml(word.word)}</div>
        <div class="word-item-definition">${escapeHtml(word.definition)}</div>
        <div class="word-item-meta">
            ${word.partOfSpeech ? `<span>詞性: ${escapeHtml(word.partOfSpeech)}</span>` : ''}
            ${word.addedDate ? `<span>添加於: ${new Date(word.addedDate).toLocaleDateString('zh-TW')}</span>` : ''}
        </div>
        ${word.etymology ? `<div class="word-item-definition"><strong>字根:</strong> ${escapeHtml(word.etymology)}</div>` : ''}
        <div class="word-item-actions">
            <button class="btn-small btn-edit" onclick="editWord(${index})">編輯</button>
            <button class="btn-small btn-delete" onclick="deleteWordItem(${index})">刪除</button>
        </div>
    `;
    return item;
}

function editWord(index) {
    const word = allWords[index];
    document.getElementById('word').value = word.word;
    document.getElementById('definition').value = word.definition;
    document.getElementById('partOfSpeech').value = word.partOfSpeech || '';
    document.getElementById('etymology').value = word.etymology || '';
    document.getElementById('example').value = word.example || '';

    editingIndex = index;

    // 滾動到表單
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('word').focus();
}

function deleteWordItem(index) {
    if (confirm(`確定要刪除 "${allWords[index].word}" 嗎？`)) {
        allWords.splice(index, 1);
        saveWords();
        renderWordList();
        showNotification('✓ 單字已刪除', 'success');
    }
}

// ============ 表單管理 ============
function resetForm() {
    document.getElementById('addWordForm').reset();
    editingIndex = null;
    document.getElementById('word').focus();
}

// ============ 本地存儲 ============
function loadWords() {
    const stored = localStorage.getItem('words');
    if (stored) {
        try {
            allWords = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading words:', e);
            allWords = [];
        }
    }
}

function saveWords() {
    localStorage.setItem('words', JSON.stringify(allWords));
}

// ============ 通知系統 ============
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============ 加載動畫 ============
function showLoadingSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

// ============ 工具函數 ============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
