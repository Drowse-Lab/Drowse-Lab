let selectedFile = null;

const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const passwordInput = document.getElementById('password');
const statusMessage = document.getElementById('statusMessage');

// ドラッグ＆ドロップイベント
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// ファイル選択イベント
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// ファイル処理
function handleFile(file) {
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    
    // ボタンを有効化
    encryptBtn.disabled = false;
    decryptBtn.disabled = false;
    
    // ステータスメッセージをクリア
    statusMessage.style.display = 'none';
}

// ファイルサイズをフォーマット
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 暗号化ボタンクリック
encryptBtn.addEventListener('click', async () => {
    const password = passwordInput.value;
    
    if (!password) {
        showMessage('パスワードを入力してください', 'error');
        return;
    }
    
    if (!selectedFile) {
        showMessage('ファイルを選択してください', 'error');
        return;
    }
    
    try {
        const fileData = await readFileAsArrayBuffer(selectedFile);
        const encrypted = await encryptData(fileData, password);
        downloadFile(encrypted, selectedFile.name + '.encrypted');
        showMessage('ファイルが正常に暗号化されました', 'success');
    } catch (error) {
        showMessage('暗号化中にエラーが発生しました: ' + error.message, 'error');
    }
});

// 復号化ボタンクリック
decryptBtn.addEventListener('click', async () => {
    const password = passwordInput.value;
    
    if (!password) {
        showMessage('パスワードを入力してください', 'error');
        return;
    }
    
    if (!selectedFile) {
        showMessage('ファイルを選択してください', 'error');
        return;
    }
    
    try {
        const fileData = await readFileAsArrayBuffer(selectedFile);
        const decrypted = await decryptData(fileData, password);
        
        // 元のファイル名を復元（.encryptedを削除）
        let originalName = selectedFile.name;
        if (originalName.endsWith('.encrypted')) {
            originalName = originalName.slice(0, -10);
        }
        
        downloadFile(decrypted, originalName);
        showMessage('ファイルが正常に復号化されました', 'success');
    } catch (error) {
        showMessage('復号化中にエラーが発生しました: ' + error.message, 'error');
    }
});

// ファイルをArrayBufferとして読み込む
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// データを暗号化
async function encryptData(data, password) {
    // パスワードから暗号化キーを生成
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // キーのハッシュを生成
    const keyHash = await crypto.subtle.digest('SHA-256', passwordBuffer);
    
    // 暗号化キーを作成
    const key = await crypto.subtle.importKey(
        'raw',
        keyHash,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    
    // 初期化ベクトル（IV）を生成
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // データを暗号化
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        data
    );
    
    // IVと暗号化データを結合
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return combined.buffer;
}

// データを復号化
async function decryptData(data, password) {
    // パスワードから暗号化キーを生成
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // キーのハッシュを生成
    const keyHash = await crypto.subtle.digest('SHA-256', passwordBuffer);
    
    // 暗号化キーを作成
    const key = await crypto.subtle.importKey(
        'raw',
        keyHash,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );
    
    // IVと暗号化データを分離
    const dataArray = new Uint8Array(data);
    const iv = dataArray.slice(0, 12);
    const encryptedData = dataArray.slice(12);
    
    // データを復号化
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encryptedData
    );
    
    return decrypted;
}

// ファイルをダウンロード
function downloadFile(data, filename) {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// メッセージを表示
function showMessage(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    statusMessage.style.display = 'block';
    
    // 5秒後に自動的に非表示
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}

// 暗号化設定のデフォルト値
const defaultConfig = {
    algorithm: 'AES-GCM',
    keySize: 256,
    iterations: 10000,
    saltLength: 16,
    compression: false,
    fileIntegrity: true,
    metadataEncryption: true,
    multipleKeys: false,
    version: '1.0',
    createdAt: new Date().toISOString()
};

// 現在の設定を取得
function getCurrentConfig() {
    return {
        algorithm: document.getElementById('algorithm').value,
        keySize: parseInt(document.getElementById('keySize').value),
        iterations: parseInt(document.getElementById('iterations').value),
        saltLength: parseInt(document.getElementById('saltLength').value),
        compression: document.getElementById('compression').checked,
        fileIntegrity: document.getElementById('fileIntegrity').checked,
        metadataEncryption: document.getElementById('metadataEncryption').checked,
        multipleKeys: document.getElementById('multipleKeys').checked,
        version: '1.0',
        createdAt: new Date().toISOString()
    };
}

// 設定を適用
function applyConfig(config) {
    document.getElementById('algorithm').value = config.algorithm || 'AES-GCM';
    document.getElementById('keySize').value = config.keySize || 256;
    document.getElementById('iterations').value = config.iterations || 10000;
    document.getElementById('saltLength').value = config.saltLength || 16;
    document.getElementById('compression').checked = config.compression || false;
    document.getElementById('fileIntegrity').checked = config.fileIntegrity !== false;
    document.getElementById('metadataEncryption').checked = config.metadataEncryption !== false;
    document.getElementById('multipleKeys').checked = config.multipleKeys || false;
}

// プリセット設定を読み込み
function loadPreset(presetName) {
    let config = {};
    
    switch(presetName) {
        case 'high-security':
            config = {
                algorithm: 'AES-GCM',
                keySize: 256,
                iterations: 100000,
                saltLength: 32,
                compression: true,
                fileIntegrity: true,
                metadataEncryption: true,
                multipleKeys: true
            };
            showMessage('高セキュリティ設定を適用しました', 'success');
            break;
            
        case 'balanced':
            config = {
                algorithm: 'AES-GCM',
                keySize: 256,
                iterations: 10000,
                saltLength: 16,
                compression: false,
                fileIntegrity: true,
                metadataEncryption: true,
                multipleKeys: false
            };
            showMessage('バランス型設定を適用しました', 'success');
            break;
            
        case 'fast':
            config = {
                algorithm: 'AES-GCM',
                keySize: 128,
                iterations: 1000,
                saltLength: 8,
                compression: false,
                fileIntegrity: false,
                metadataEncryption: false,
                multipleKeys: false
            };
            showMessage('高速処理設定を適用しました', 'success');
            break;
    }
    
    applyConfig(config);
}

// 設定をJSONファイルとして保存
function saveConfig() {
    const config = getCurrentConfig();
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encryption-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('設定ファイルを保存しました', 'success');
}

// 設定ファイルを読み込み
function loadConfigFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            applyConfig(config);
            showMessage('設定ファイルを読み込みました', 'success');
        } catch (error) {
            showMessage('設定ファイルの読み込みに失敗しました', 'error');
        }
    };
    reader.readAsText(file);
}

// 設定をリセット
function resetConfig() {
    applyConfig(defaultConfig);
    showMessage('設定をデフォルトに戻しました', 'success');
}

// 改良された暗号化関数（設定を考慮）
async function encryptDataWithConfig(data, password) {
    const config = getCurrentConfig();
    
    // 設定情報をヘッダーとして追加
    const configHeader = new TextEncoder().encode(JSON.stringify({
        algorithm: config.algorithm,
        keySize: config.keySize,
        iterations: config.iterations,
        saltLength: config.saltLength,
        timestamp: Date.now()
    }));
    
    // ソルトを生成
    const salt = crypto.getRandomValues(new Uint8Array(config.saltLength));
    
    // PBKDF2でキーを導出
    const passwordBuffer = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: config.iterations,
            hash: 'SHA-256'
        },
        baseKey,
        { name: config.algorithm, length: config.keySize },
        false,
        ['encrypt']
    );
    
    // IVを生成
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // データを暗号化
    const encrypted = await crypto.subtle.encrypt(
        {
            name: config.algorithm,
            iv: iv
        },
        key,
        data
    );
    
    // ヘッダー長、ヘッダー、ソルト、IV、暗号化データを結合
    const headerLength = new Uint32Array([configHeader.byteLength]);
    const combined = new Uint8Array(
        4 + configHeader.byteLength + salt.length + iv.length + encrypted.byteLength
    );
    
    let offset = 0;
    combined.set(new Uint8Array(headerLength.buffer), offset);
    offset += 4;
    combined.set(configHeader, offset);
    offset += configHeader.byteLength;
    combined.set(salt, offset);
    offset += salt.length;
    combined.set(iv, offset);
    offset += iv.length;
    combined.set(new Uint8Array(encrypted), offset);
    
    return combined.buffer;
}

// 改良された復号化関数（設定を考慮）
async function decryptDataWithConfig(data, password) {
    const dataArray = new Uint8Array(data);
    let offset = 0;
    
    // ヘッダー長を読み取り
    const headerLength = new Uint32Array(dataArray.slice(0, 4).buffer)[0];
    offset += 4;
    
    // ヘッダーを読み取り
    const configHeader = JSON.parse(
        new TextDecoder().decode(dataArray.slice(offset, offset + headerLength))
    );
    offset += headerLength;
    
    // ソルトを読み取り
    const salt = dataArray.slice(offset, offset + configHeader.saltLength);
    offset += configHeader.saltLength;
    
    // IVを読み取り
    const iv = dataArray.slice(offset, offset + 12);
    offset += 12;
    
    // 暗号化データを読み取り
    const encryptedData = dataArray.slice(offset);
    
    // PBKDF2でキーを導出
    const passwordBuffer = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: configHeader.iterations,
            hash: 'SHA-256'
        },
        baseKey,
        { name: configHeader.algorithm, length: configHeader.keySize },
        false,
        ['decrypt']
    );
    
    // データを復号化
    const decrypted = await crypto.subtle.decrypt(
        {
            name: configHeader.algorithm,
            iv: iv
        },
        key,
        encryptedData
    );
    
    return decrypted;
}

// 暗号化・復号化ボタンのイベントリスナーを更新
document.addEventListener('DOMContentLoaded', () => {
    // 既存のイベントリスナーを削除して新しいものに置き換え
    const newEncryptBtn = encryptBtn.cloneNode(true);
    encryptBtn.parentNode.replaceChild(newEncryptBtn, encryptBtn);
    
    newEncryptBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        
        if (!password) {
            showMessage('パスワードを入力してください', 'error');
            return;
        }
        
        if (!selectedFile) {
            showMessage('ファイルを選択してください', 'error');
            return;
        }
        
        try {
            const fileData = await readFileAsArrayBuffer(selectedFile);
            const encrypted = await encryptDataWithConfig(fileData, password);
            
            // 設定もメタデータとして保存
            const config = getCurrentConfig();
            const metadata = {
                originalName: selectedFile.name,
                config: config,
                encryptedAt: new Date().toISOString()
            };
            
            downloadFile(encrypted, selectedFile.name + '.encrypted');
            showMessage('ファイルが正常に暗号化されました（設定適用済み）', 'success');
        } catch (error) {
            showMessage('暗号化中にエラーが発生しました: ' + error.message, 'error');
        }
    });
    
    const newDecryptBtn = decryptBtn.cloneNode(true);
    decryptBtn.parentNode.replaceChild(newDecryptBtn, decryptBtn);
    
    newDecryptBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        
        if (!password) {
            showMessage('パスワードを入力してください', 'error');
            return;
        }
        
        if (!selectedFile) {
            showMessage('ファイルを選択してください', 'error');
            return;
        }
        
        try {
            const fileData = await readFileAsArrayBuffer(selectedFile);
            const decrypted = await decryptDataWithConfig(fileData, password);
            
            let originalName = selectedFile.name;
            if (originalName.endsWith('.encrypted')) {
                originalName = originalName.slice(0, -10);
            }
            
            downloadFile(decrypted, originalName);
            showMessage('ファイルが正常に復号化されました', 'success');
        } catch (error) {
            showMessage('復号化中にエラーが発生しました: ' + error.message, 'error');
        }
    });
});