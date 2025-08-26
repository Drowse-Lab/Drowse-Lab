// 言語設定の管理
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('selectedLanguage') || 'ja';
        this.translations = {};
        this.init();
    }

    async init() {
        // 翻訳データを読み込み
        try {
            // baseurl を考慮したパスを使用
            const baseUrl = document.querySelector('base')?.href || '';
            const translationPath = baseUrl ? `${baseUrl}/assets/data/translations.json` : '/Drowse-Lab/assets/data/translations.json';
            const response = await fetch(translationPath);
            this.translations = await response.json();
            this.applyTranslations();
            this.setupLanguageToggle();
        } catch (error) {
            console.error('Failed to load translations:', error);
            // フォールバックとして別のパスを試す
            try {
                const response = await fetch('/Drowse-Lab/assets/data/translations.json');
                this.translations = await response.json();
                this.applyTranslations();
                this.setupLanguageToggle();
            } catch (fallbackError) {
                console.error('Failed to load translations from fallback path:', fallbackError);
            }
        }
    }

    applyTranslations() {
        // data-i18n属性を持つ要素を翻訳
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else if (element.tagName === 'OPTION') {
                    element.textContent = translation;
                } else if (key.includes('feature')) {
                    // 機能リストの項目はHTMLを含む可能性がある
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // ページのlang属性を更新
        document.documentElement.lang = this.currentLang;
        
        // 言語切り替えボタンのテキストを更新
        const langToggleTop = document.getElementById('langToggle');
        const langToggleBottom = document.getElementById('langToggleBottom');
        
        if (langToggleTop) {
            langToggleTop.textContent = this.currentLang === 'ja' ? 'EN' : '日本語';
        }
        
        if (langToggleBottom) {
            langToggleBottom.textContent = this.currentLang === 'ja' ? 'English' : '日本語';
        }
    }

    getTranslation(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'ja' ? 'en' : 'ja';
        localStorage.setItem('selectedLanguage', this.currentLang);
        this.applyTranslations();
    }

    setupLanguageToggle() {
        // 上部と下部の言語切り替えボタンを取得
        const langToggleTop = document.getElementById('langToggle');
        const langToggleBottom = document.getElementById('langToggleBottom');
        
        if (langToggleTop) {
            langToggleTop.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
        
        if (langToggleBottom) {
            langToggleBottom.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }
}

// ページ読み込み時に言語マネージャーを初期化
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});