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
            const response = await fetch('/assets/data/translations.json');
            this.translations = await response.json();
            this.applyTranslations();
            this.setupLanguageToggle();
        } catch (error) {
            console.error('Failed to load translations:', error);
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
                } else {
                    element.textContent = translation;
                }
            }
        });

        // ページのlang属性を更新
        document.documentElement.lang = this.currentLang;
        
        // 言語切り替えボタンのテキストを更新
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.textContent = this.currentLang === 'ja' ? 'EN' : '日本語';
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
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }
}

// ページ読み込み時に言語マネージャーを初期化
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});