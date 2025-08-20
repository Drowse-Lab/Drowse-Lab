// フッターナビゲーションの表示制御
document.addEventListener('DOMContentLoaded', function() {
    const footerNav = document.querySelector('.footer-nav');
    if (!footerNav) return;
    
    // 初期状態では非表示
    footerNav.style.transform = 'translateY(100%)';
    footerNav.style.transition = 'transform 0.3s ease';
    
    // スクロールイベントの処理
    let isScrolling = false;
    
    function handleScroll() {
        if (!isScrolling) {
            window.requestAnimationFrame(function() {
                // ページの高さとスクロール位置を取得
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                
                // ページの最下部付近（底から100px以内）にいるかチェック
                const isNearBottom = (scrollTop + windowHeight) >= (documentHeight - 100);
                
                // フッターナビゲーションの表示/非表示
                if (isNearBottom) {
                    footerNav.style.transform = 'translateY(0)';
                } else {
                    footerNav.style.transform = 'translateY(100%)';
                }
                
                isScrolling = false;
            });
            isScrolling = true;
        }
    }
    
    // スクロールイベントリスナーを追加
    window.addEventListener('scroll', handleScroll);
    
    // 初期チェック
    handleScroll();
    
    // ウィンドウリサイズ時も再チェック
    window.addEventListener('resize', handleScroll);
});