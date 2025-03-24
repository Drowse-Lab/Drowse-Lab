document.getElementById('focusModeBtn').addEventListener('click', function() {
    switchMode('focus');
});

document.getElementById('relaxModeBtn').addEventListener('click', function() {
    switchMode('relax');
});

function switchMode(mode) {
    const bgm = document.getElementById('bgm');
    if (mode === 'focus') {
        bgm.src = 'path/to/focus-bgm.mp3'; // 集中できるBGMの正しいパス
    } else if (mode === 'relax') {
        bgm.src = 'path/to/relax-bgm.mp3'; // リラックスできるBGMの正しいパス
    }
    bgm.play();
}
