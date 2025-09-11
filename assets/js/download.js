// assets/js/download.js
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const filenameInput = document.getElementById('filenameInput');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusMessage = document.getElementById('statusMessage');
    const enhanceQualityCheckbox = document.getElementById('enhanceQuality');
    const resolutionOptions = document.getElementById('resolutionOptions');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const youtubeOptions = document.getElementById('youtubeOptions');
    const formatSelect = document.getElementById('formatSelect');
    const videoQualityGroup = document.getElementById('videoQualityGroup');
    const videoQuality = document.getElementById('videoQuality');

    // ---------- UI handlers ----------
    enhanceQualityCheckbox.addEventListener('change', function() {
        resolutionOptions.style.display = this.checked ? 'block' : 'none';
    });

    formatSelect.addEventListener('change', function() {
        videoQualityGroup.style.display = this.value === 'video' ? 'block' : 'none';
    });

    urlInput.addEventListener('input', function() {
        const url = this.value;
        const isYouTube = isYouTubeUrl(url);
        if (isYouTube) {
            youtubeOptions.style.display = 'block';
            enhanceQualityCheckbox.parentElement.parentElement.style.display = 'none';
        } else {
            youtubeOptions.style.display = 'none';
            enhanceQualityCheckbox.parentElement.parentElement.style.display = 'block';
        }
    });

    filenameInput.addEventListener('input', function() {
        const value = this.value;
        const lastDot = value.lastIndexOf('.');
        if (lastDot > -1) {
            const base = value.substring(0, lastDot);
            const datalist = document.getElementById('extensionList');
            Array.from(datalist.options).forEach(option => {
                option.value = base + option.textContent;
            });
        }
    });

    // ---------- helpers ----------
    function isYouTubeUrl(url) {
        return url.includes('youtube.com/watch') ||
               url.includes('youtu.be/') ||
               url.includes('youtube.com/shorts/');
    }

    function extractYouTubeId(url) {
        const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
    }
    function hideStatus() { statusMessage.style.display = 'none'; }

    function getExtensionFromMimeType(mimeType) {
        if (!mimeType) return '';
        const mimeToExt = {
            'image/jpeg': '.jpg','image/jpg': '.jpg','image/png': '.png','image/gif': '.gif','image/webp': '.jpg',
            'image/bmp': '.bmp','image/svg+xml': '.svg','image/x-icon': '.ico','image/tiff': '.tiff',
            'text/plain': '.txt','text/html': '.html','application/json': '.json','application/xml': '.xml',
            'application/zip': '.zip','application/x-rar-compressed': '.rar','application/x-7z-compressed': '.7z',
            'video/mp4': '.mp4','video/webm': '.webm','audio/mpeg': '.mp3','audio/wav': '.wav'
        };
        return mimeToExt[mimeType] || '';
    }

    function adjustImageExtension(filename, mimeType) {
        if (!mimeType || !mimeType.startsWith('image/')) return filename;
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) return filename + getExtensionFromMimeType(mimeType);
        const nameWithoutExt = filename.substring(0, lastDotIndex);
        const currentExt = filename.substring(lastDotIndex).toLowerCase();
        if (currentExt === '.webp' || currentExt === '.avif' || currentExt === '.jfif') return nameWithoutExt + '.jpg';
        if (currentExt === '.gif' || currentExt === '.png' || currentExt === '.jpg' || currentExt === '.jpeg') return filename;
        return nameWithoutExt + getExtensionFromMimeType(mimeType);
    }

    function extractFilenameFromUrl(url, mimeType) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            let filename = pathname.split('/').pop();
            if (filename) filename = filename.split('?')[0];
            const fileParam = urlObj.searchParams.get('file');
            if (fileParam) filename = fileParam.split('/').pop();

            const hasWebPFormat = url.includes('format,webp') || url.includes('format=webp');
            const isOriginallyGif = (filename && filename.toLowerCase().includes('.gif')) ||
                                    url.includes('gif') ||
                                    (fileParam && fileParam.toLowerCase().includes('.gif'));

            if (!filename || !filename.includes('.')) {
                const extension = getExtensionFromMimeType(mimeType);
                filename = (filename || 'download') + extension;
            } else {
                if (hasWebPFormat || mimeType === 'image/webp') {
                    const lastDotIndex = filename.lastIndexOf('.');
                    if (lastDotIndex !== -1) {
                        const nameWithoutExt = filename.substring(0, lastDotIndex);
                        filename = nameWithoutExt + (isOriginallyGif ? '.gif' : '.jpg');
                    }
                } else {
                    filename = adjustImageExtension(filename, mimeType);
                }
            }
            return filename;
        } catch {
            return 'download';
        }
    }

    // DataURL <-> Blob
    async function blobToDataURL(blob) {
        return new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.readAsDataURL(blob);
        });
    }
    async function dataURLToBlob(dataURL) {
        const res = await fetch(dataURL);
        return await res.blob();
    }

    // YCbCr（BT.601近似）: 彩度・色相を維持するための輝度マージ
    function rgb2ycbcr(r,g,b){const Y=0.299*r+0.587*g+0.114*b;return{Y,Cb:128+0.564*(b-Y),Cr:128+0.713*(r-Y)};}
    function ycbcr2rgb(Y,Cb,Cr){
        const r=Y+1.403*(Cr-128), g=Y-0.344*(Cb-128)-0.714*(Cr-128), b=Y+1.773*(Cb-128);
        return [
            Math.max(0,Math.min(255,Math.round(r))),
            Math.max(0,Math.min(255,Math.round(g))),
            Math.max(0,Math.min(255,Math.round(b)))
        ];
    }
    function mergeLuma(esrCanvas, baseCanvas){
        const w=esrCanvas.width,h=esrCanvas.height;
        const out=document.createElement('canvas'); out.width=w; out.height=h;
        const octx=out.getContext('2d');
        const ectx=esrCanvas.getContext('2d'); const bctx=baseCanvas.getContext('2d');
        const e=ectx.getImageData(0,0,w,h), b=bctx.getImageData(0,0,w,h);
        const d=e.data, bd=b.data;
        for(let i=0;i<d.length;i+=4){
            const {Cb,Cr}=rgb2ycbcr(bd[i],bd[i+1],bd[i+2]); // 色はベースから
            const {Y}=rgb2ycbcr(d[i],d[i+1],d[i+2]);        // 輝度はESRGANから
            const [r,g,bb]=ycbcr2rgb(Y,Cb,Cr);
            d[i]=r; d[i+1]=g; d[i+2]=bb; // aはそのまま
        }
        octx.putImageData(e,0,0);
        return out;
    }

    // 画像の単純変換（色は変更しない）
    async function convertImageBlob(blob, targetFormat, enhanceQuality = false) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = function() {
                let width = img.width, height = img.height;
                if (enhanceQuality) {
                    const scaleFactor = (width < 500 || height < 500) ? 4 : 2;
                    width *= scaleFactor; height *= scaleFactor;
                }

                canvas.width = width; canvas.height = height;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.filter = 'none'; // 彩度・コントラストは触らない（MDNのfilter参照）
                ctx.drawImage(img, 0, 0, width, height);

                const quality = enhanceQuality ? 1.0 : 0.95;
                canvas.toBlob((newBlob)=>resolve(newBlob), targetFormat, quality);
            };
            img.src = URL.createObjectURL(blob);
        });
    }

    // ---------- YouTube 関連（既存のまま） ----------
    async function getYouTubeVideoInfo(videoId) {
        try {
            showStatus('動画情報を取得中...', 'info');
            const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
            const innertubeUrl = 'https://www.youtube.com/youtubei/v1/player';
            const requestBody = { videoId, context: { client: { hl:'ja', gl:'JP', clientName:'WEB', clientVersion:'2.20231219.01.00', platform:'DESKTOP' } } };
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(innertubeUrl + '?key=' + apiKey)}`, {
                method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(requestBody)
            });
            if (response.ok) return await response.json();

            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const oembedResponse = await fetch('https://corsproxy.io/?' + encodeURIComponent(oembedUrl));
            const oembedData = await oembedResponse.json();
            return { videoDetails: { title: oembedData.title, author: oembedData.author_name, videoId } };
        } catch { return null; }
    }

    async function getYouTubeStreams(videoId) {
        try {
            const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(videoPageUrl);
            showStatus('動画情報を解析中...', 'info');
            const response = await fetch(proxyUrl);
            const html = await response.text();
            const ytConfigMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (ytConfigMatch) {
                const playerResponse = JSON.parse(ytConfigMatch[1]);
                if (playerResponse.streamingData) {
                    const formats = [
                        ...(playerResponse.streamingData.formats || []),
                        ...(playerResponse.streamingData.adaptiveFormats || [])
                    ];
                    return formats.map(format => ({
                        itag: format.itag,
                        url: format.url || format.signatureCipher,
                        mimeType: format.mimeType,
                        quality: format.quality,
                        qualityLabel: format.qualityLabel,
                        hasAudio: !!format.audioQuality,
                        hasVideo: !!format.width,
                        width: format.width,
                        height: format.height,
                        contentLength: format.contentLength,
                        audioQuality: format.audioQuality
                    }));
                }
            }
            return [];
        } catch { return []; }
    }

    function decodeSignatureCipher(signatureCipher) {
        const params = new URLSearchParams(signatureCipher);
        const url = params.get('url'); const sp = params.get('sp') || 'signature'; const s = params.get('s');
        if (url && s) {
            const decodedSig = s.split('').reverse().join('');
            return `${url}&${sp}=${encodeURIComponent(decodedSig)}`;
        }
        return null;
    }

    async function downloadAndMergeStreams(videoUrl, audioUrl, filename) {
        try {
            showStatus('動画データをダウンロード中...', 'info');
            const videoResponse = await fetch(`https://corsproxy.io/?${encodeURIComponent(videoUrl)}`);
            const videoBlob = await videoResponse.blob();
            if (audioUrl) {
                showStatus('音声データをダウンロード中...', 'info');
                const audioResponse = await fetch(`https://corsproxy.io/?${encodeURIComponent(audioUrl)}`);
                const audioBlob = await audioResponse.blob();

                const videoLink = document.createElement('a');
                videoLink.href = URL.createObjectURL(videoBlob);
                videoLink.download = filename.replace('.mp4', '_video.mp4');
                videoLink.click();

                const audioLink = document.createElement('a');
                audioLink.href = URL.createObjectURL(audioBlob);
                audioLink.download = filename.replace('.mp4', '_audio.mp3');
                audioLink.click();

                showStatus('動画と音声を別々にダウンロードしました。動画編集ソフトで結合してください。', 'info');
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(videoBlob);
                link.download = filename;
                link.click();
                showStatus('ダウンロードが完了しました！', 'success');
            }
        } catch (error) {
            throw new Error('ダウンロード中にエラーが発生しました: ' + error.message);
        }
    }

    async function downloadYouTubeVideo(url, format, quality) {
        const videoId = extractYouTubeId(url);
        if (!videoId) throw new Error('無効なYouTube URLです');
        showStatus('YouTube動画情報を取得中...', 'info');
        try {
            const videoInfo = await getYouTubeVideoInfo(videoId);
            if (!videoInfo || !videoInfo.streamingData) {
                const streams = await getYouTubeStreams(videoId);
                if (!streams || streams.length === 0) throw new Error('動画ストリームが見つかりません');

                // レガシー処理
                await handleLegacyDownload(streams, format, quality, videoInfo);
                return;
            }

            const formats = [
                ...(videoInfo.streamingData.formats || []),
                ...(videoInfo.streamingData.adaptiveFormats || [])
            ];

            let selectedVideo = null;
            let selectedAudio = null;

            if (format === 'audio') {
                const audioFormats = formats.filter(f => f.mimeType && f.mimeType.startsWith('audio/'));
                selectedAudio = audioFormats.sort((a,b)=>(b.bitrate||0)-(a.bitrate||0))[0];
                if (selectedAudio) {
                    const audioUrl = selectedAudio.url || (selectedAudio.signatureCipher && decodeSignatureCipher(selectedAudio.signatureCipher));
                    if (audioUrl) {
                        showStatus('音声をダウンロード中...', 'info');
                        const link = document.createElement('a');
                        link.href = `https://corsproxy.io/?${encodeURIComponent(audioUrl)}`;
                        link.download = `${videoInfo.videoDetails?.title || videoId}.mp3`;
                        link.target = '_blank';
                        document.body.appendChild(link); link.click(); document.body.removeChild(link);
                        showStatus('音声のダウンロードを開始しました', 'success');
                        return;
                    }
                }
            } else {
                const videoFormats = formats.filter(f => f.mimeType && f.mimeType.startsWith('video/'));
                if (quality === 'highest') {
                    selectedVideo = videoFormats.sort((a,b)=>(b.height||0)-(a.height||0))[0];
                } else {
                    const targetHeight = parseInt(quality.replace('p',''));
                    selectedVideo = videoFormats.find(f=>f.height===targetHeight) ||
                                    videoFormats.find(f=>(f.height||0)<=targetHeight) ||
                                    videoFormats[0];
                }
                if (selectedVideo && selectedVideo.audioQuality) {
                    const videoUrl = selectedVideo.url || (selectedVideo.signatureCipher && decodeSignatureCipher(selectedVideo.signatureCipher));
                    if (videoUrl) {
                        showStatus('動画をダウンロード中...', 'info');
                        const link = document.createElement('a');
                        link.href = `https://corsproxy.io/?${encodeURIComponent(videoUrl)}`;
                        link.download = `${videoInfo.videoDetails?.title || videoId}.mp4`;
                        link.target = '_blank';
                        document.body.appendChild(link); link.click(); document.body.removeChild(link);
                        showStatus('動画のダウンロードを開始しました', 'success');
                        return;
                    }
                } else {
                    const audioFormats = formats.filter(f => f.mimeType && f.mimeType.startsWith('audio/'));
                    selectedAudio = audioFormats.sort((a,b)=>(b.bitrate||0)-(a.bitrate||0))[0];
                    const videoUrl = selectedVideo && (selectedVideo.url || (selectedVideo.signatureCipher && decodeSignatureCipher(selectedVideo.signatureCipher)));
                    const audioUrl = selectedAudio && (selectedAudio.url || (selectedAudio.signatureCipher && decodeSignatureCipher(selectedAudio.signatureCipher)));
                    if (videoUrl && audioUrl) {
                        const filename = `${videoInfo.videoDetails?.title || videoId}.mp4`;
                        await downloadAndMergeStreams(videoUrl, audioUrl, filename);
                        return;
                    }
                }
            }
            throw new Error('適切なストリームが見つかりませんでした');
        } catch (error) {
            console.error('YouTube download error:', error);
            showStatus(`エラー: ${error.message}`, 'error');
            showManualDownloadUI(videoId);
        }
    }

    function escapeHTML(str){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\//g,'&#x2F;');}
    function showManualDownloadUI(videoId) {
        const escapedVideoId = escapeHTML(videoId);
        const modalHtml = `
            <div id="ytDownloadModal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000; max-width: 500px;">
                <h3>YouTube動画ダウンロード</h3>
                <p>自動ダウンロードができませんでした。以下の方法をお試しください：</p>
                <ol>
                    <li>ブラウザの拡張機能を使用する</li>
                    <li>デスクトップアプリ（youtube-dl、yt-dlp）を使用する</li>
                    <li>オンラインサービスを利用する</li>
                </ol>
                <p>動画ID: <code>${escapedVideoId}</code></p>
                <button onclick="document.getElementById('ytDownloadModal').remove()"
                    style="background:#4CAF50;color:#fff;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;">閉じる</button>
            </div>
            <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999;"
                onclick="document.getElementById('ytDownloadModal').remove()"></div>
        `;
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv);
    }

    async function handleLegacyDownload(streams, format, quality, videoInfo) {
        let selectedStream = null;
        if (format === 'audio') {
            const audioStreams = streams.filter(s => s.hasAudio && !s.hasVideo);
            selectedStream = audioStreams[0];
        } else {
            const videoStreams = streams.filter(s => s.hasVideo);
            selectedStream = videoStreams[0];
        }
        if (selectedStream && selectedStream.url) {
            const link = document.createElement('a');
            link.href = selectedStream.url;
            link.download = `video.${format === 'audio' ? 'mp3' : 'mp4'}`;
            link.target = '_blank';
            link.click();
            showStatus('ダウンロードを開始しました', 'success');
        } else {
            throw new Error('ストリームが見つかりません');
        }
    }

    // ---------- ここが“効く”画質向上：UpscalerJS（ESRGAN） ----------
    // UpscalerJS を CDN（esm.sh）から動的 import。依存（tfjs 等）も bundle して取り込み。
    async function enhanceImageQuality(blob, targetResolution = 'auto') {
        try {
            const Upscaler = (await import('https://esm.sh/upscaler@1?bundle')).default;
            // モデルは 4x の軽量レガシー版。必要に応じて esrgan-medium / thick に差し替え可。
            const model = (await import('https://esm.sh/@upscalerjs/esrgan-legacy@1/4x?bundle')).default;
            const upscaler = new Upscaler({ model });

            // 入力を dataURL に
            const srcDataURL = await blobToDataURL(blob);

            // 4x アップスケール（タイルでメモリ節約）
            const upscaledDataURL = await upscaler.upscale(srcDataURL, {
                patchSize: 128, padding: 10,
            }); // base64 DataURL が返る

            // 目標解像度へ調整（色は保持するための下準備）
            const baseImg = new Image(); baseImg.src = srcDataURL; await baseImg.decode();
            const srImg = new Image();   srImg.src   = upscaledDataURL; await srImg.decode();

            const ow = baseImg.width, oh = baseImg.height;
            const ar = ow / oh;
            let width = srImg.width, height = srImg.height;

            switch (targetResolution) {
                case '4k':    if (ar>16/9){ width=3840; height=Math.round(3840/ar);} else { height=2160; width=Math.round(2160*ar);} break;
                case '1440p': if (ar>16/9){ width=2560; height=Math.round(2560/ar);} else { height=1440; width=Math.round(1440*ar);} break;
                case '1080p': if (ar>16/9){ width=1920; height=Math.round(1920/ar);} else { height=1080; width=Math.round(1080*ar);} break;
                case '720p':  if (ar>16/9){ width=1280; height=Math.round(1280/ar);} else { height= 720; width=Math.round( 720*ar);} break;
                case 'original': width=ow; height=oh; break;
                default:
                    // 4x結果が大きすぎる場合は軽く縮小して締める
                    if (width > 3200) { const s=3200/width; width=Math.round(width*s); height=Math.round(height*s); }
            }

            // ベース（バイキュービック相当）と SR を同サイズに描画
            const base = document.createElement('canvas'); base.width=width; base.height=height;
            const bctx = base.getContext('2d'); bctx.imageSmoothingEnabled=true; bctx.imageSmoothingQuality='high'; bctx.filter='none';
            bctx.drawImage(baseImg, 0, 0, width, height);

            const sr = document.createElement('canvas'); sr.width=width; sr.height=height;
            const srctx = sr.getContext('2d'); srctx.imageSmoothingEnabled=true; srctx.imageSmoothingQuality='high'; srctx.filter='none';
            srctx.drawImage(srImg, 0, 0, width, height);

            // 輝度（Y）のみ SR を採用して色（Cb/Cr）はベースから → 彩度/色相は不変
            const merged = mergeLuma(sr, base);

            // 出力 blob（元がPNGならPNG）
            return await new Promise(res => merged.toBlob(res, (blob.type === 'image/png' ? 'image/png' : 'image/jpeg'), 1.0));
        } catch (e) {
            console.warn('UpscalerJS が使えないため従来処理にフォールバックします:', e);
            // ---- フォールバック：従来のリサンプル＋ディテール強調（色は変えない） ----
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    const originalWidth = img.width;
                    const originalHeight = img.height;
                    const aspectRatio = originalWidth / originalHeight;
                    let width, height;

                    switch(targetResolution) {
                        case '4k':
                            if (aspectRatio > 16/9) { width = 3840; height = Math.round(3840 / aspectRatio); }
                            else { height = 2160; width = Math.round(2160 * aspectRatio); }
                            break;
                        case '1440p':
                            if (aspectRatio > 16/9) { width = 2560; height = Math.round(2560 / aspectRatio); }
                            else { height = 1440; width = Math.round(1440 * aspectRatio); }
                            break;
                        case '1080p':
                            if (aspectRatio > 16/9) { width = 1920; height = Math.round(1920 / aspectRatio); }
                            else { height = 1080; width = Math.round(1080 * aspectRatio); }
                            break;
                        case '720p':
                            if (aspectRatio > 16/9) { width = 1280; height = Math.round(1280 / aspectRatio); }
                            else { height = 720; width = Math.round(720 * aspectRatio); }
                            break;
                        case 'original':
                            width = originalWidth; height = originalHeight; break;
                        default:
                            let scaleFactor = 2;
                            if (originalWidth < 400 || originalHeight < 400) scaleFactor = 4;
                            else if (originalWidth < 800 || originalHeight < 800) scaleFactor = 3;
                            else if (originalWidth > 1500 || originalHeight > 1500) scaleFactor = 1.5;
                            width = Math.round(originalWidth * scaleFactor);
                            height = Math.round(originalHeight * scaleFactor);
                            if (width > 3840) { const s = 3840 / width; width = 3840; height = Math.round(height * s); }
                            if (height > 2160) { const s = 2160 / height; height = 2160; width = Math.round(width * s); }
                            break;
                    }
                    if (targetResolution !== 'original') {
                        if (width < originalWidth) width = originalWidth;
                        if (height < originalHeight) height = originalHeight;
                    }

                    const srcCanvas = document.createElement('canvas');
                    const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
                    srcCanvas.width = originalWidth; srcCanvas.height = originalHeight;
                    srcCtx.drawImage(img, 0, 0);

                    // 最終サイズへ（高品質補間 / フィルタ無し）
                    const finalCanvas = document.createElement('canvas');
                    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
                    finalCanvas.width = width; finalCanvas.height = height;
                    finalCtx.imageSmoothingEnabled = true;
                    finalCtx.imageSmoothingQuality = 'high';
                    finalCtx.filter = 'none';
                    finalCtx.drawImage(srcCanvas, 0, 0, width, height);

                    // 軽いディテール強調（RGB同一操作なので色相/彩度は実質維持）
                    let id = finalCtx.getImageData(0, 0, width, height);
                    const data = id.data, out = new Uint8ClampedArray(data);
                    const radius = 2, amount = 0.6;
                    const kSize = radius*2+1, sigma = radius*0.8+1.0;
                    const k = []; let sum=0; const c = Math.floor(kSize/2);
                    for(let y=0;y<kSize;y++){ k[y]=[]; for(let x=0;x<kSize;x++){ const dx=x-c,dy=y-c; const v=Math.exp(-(dx*dx+dy*dy)/(2*sigma*sigma)); k[y][x]=v; sum+=v; } }
                    for(let y=0;y<kSize;y++) for(let x=0;x<kSize;x++) k[y][x]/=sum;

                    // ぼかし
                    const blur = new Float32Array(width*height*3);
                    for(let y=0;y<height;y++){
                        for(let x=0;x<width;x++){
                            for(let ch=0;ch<3;ch++){
                                let acc=0, wsum=0;
                                for(let ky=0;ky<kSize;ky++){
                                    for(let kx=0;kx<kSize;kx++){
                                        const sx=Math.min(width-1, Math.max(0, x + kx - c));
                                        const sy=Math.min(height-1, Math.max(0, y + ky - c));
                                        const w=k[ky][kx];
                                        acc += data[(sy*width+sx)*4 + ch] * w; wsum += w;
                                    }
                                }
                                blur[(y*width+x)*3 + ch] = acc/(wsum||1);
                            }
                        }
                    }
                    for(let y=0;y<height;y++){
                        for(let x=0;x<width;x++){
                            const idx=(y*width+x)*4;
                            for(let ch=0;ch<3;ch++){
                                const yy = data[idx+ch];
                                const yb = blur[(y*width+x)*3 + ch];
                                const val = Math.max(0, Math.min(255, yy + amount*(yy - yb)));
                                out[idx+ch]=val;
                            }
                            out[idx+3]=255;
                        }
                    }
                    id.data.set(out); finalCtx.putImageData(id,0,0);

                    finalCanvas.toBlob((newBlob)=>resolve(newBlob), (blob.type==='image/png'?'image/png':'image/jpeg'), 1.0);
                };
                img.src = URL.createObjectURL(blob);
            });
        }
    }

    // ---------- ダウンロード本体 ----------
    async function extractActualImageUrl(url) {
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname === 'static.wikia.nocookie.net' ||
                /\.(gif|jpg|jpeg|png|webp)(\?.*)?$/i.test(parsedUrl.pathname)) {
                return url;
            }
        } catch {}
        return url;
    }

    async function downloadFile(url, filename) {
        try {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = `<span data-i18n="download.downloading">ダウンロード中</span><span class="loading"></span>`;

            if (isYouTubeUrl(url)) {
                const format = formatSelect.value;
                const quality = videoQuality.value;
                await downloadYouTubeVideo(url, format, quality);
                return;
            }

            const actualUrl = await extractActualImageUrl(url);
            if (actualUrl !== url) url = actualUrl;

            // HEADでMIME取得
            let mimeType = null;
            try {
                const headResponse = await fetch(url, { method:'HEAD', mode:'cors', credentials:'omit' });
                mimeType = headResponse.headers.get('content-type');
            } catch {}

            const response = await fetch(url, { mode:'cors', credentials:'omit' }).catch(async () => {
                const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
                const proxyResponse = await fetch(proxyUrl);
                if (proxyResponse.ok) return proxyResponse;

                // 最終手段：新規タブで開く
                const parsedUrl = new URL(url);
                if (!['http:','https:'].includes(parsedUrl.protocol)) {
                    showStatus('許可されていないプロトコルです。', 'error');
                    throw new Error('Disallowed protocol');
                }
                const a = document.createElement('a');
                a.href = parsedUrl.href; a.download = filename || 'download'; a.target = '_blank'; a.rel='noopener noreferrer';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                throw new Error('CORS制限により直接ダウンロードできません。新しいタブで開きます。');
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            let blob = await response.blob();
            if (!mimeType) mimeType = blob.type;

            if (mimeType && mimeType.startsWith('image/')) {
                const urlPath = new URL(url).pathname.toLowerCase();
                const originalFilename = urlPath.split('/').pop() || '';
                const shouldEnhance = enhanceQualityCheckbox.checked;

                const isOriginallyGif = originalFilename.includes('.gif') || url.includes('gif') || (url.includes('file=') && url.includes('.gif'));

                if (shouldEnhance && !isOriginallyGif) {
                    const selectedResolution = resolutionSelect.value;
                    const resText = selectedResolution === 'auto' ? '自動' : selectedResolution.toUpperCase();
                    showStatus(`AIで画質を向上中...（${resText}）`, 'info');
                    blob = await enhanceImageQuality(blob, selectedResolution);
                }

                if (mimeType === 'image/webp' || mimeType === 'image/avif' ||
                    url.includes('format,webp') || url.includes('format=webp')) {
                    if (!isOriginallyGif) {
                        blob = await convertImageBlob(blob, 'image/jpeg', false);
                        mimeType = 'image/jpeg';
                    } else {
                        mimeType = 'image/gif';
                    }
                }
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const finalFilename = filename || extractFilenameFromUrl(url, mimeType);

            const link = document.createElement('a');
            link.href = downloadUrl; link.download = finalFilename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            setTimeout(()=>window.URL.revokeObjectURL(downloadUrl), 100);
            showStatus(`ダウンロードが完了しました: ${finalFilename}`, 'success');
        } catch (error) {
            console.error('Download error:', error);
            if (String(error.message).includes('CORS')) showStatus(error.message, 'info');
            else showStatus(`エラー: ${error.message}`, 'error');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<span data-i18n="download.downloadButton">ダウンロード</span>';
        }
    }

    downloadBtn.addEventListener('click', async function() {
        const url = urlInput.value.trim();
        const filename = filenameInput.value.trim();
        if (!url) { showStatus('URLを入力してください', 'error'); return; }
        try { new URL(url); } catch { showStatus('有効なURLを入力してください', 'error'); return; }
        hideStatus();
        await downloadFile(url, filename);
    });

    urlInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') downloadBtn.click(); });
    filenameInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') downloadBtn.click(); });
});

// ---------- i18n ----------
let translations = {};
async function loadTranslations() {
    try {
        const response = await fetch('/Drowse-Lab/assets/data/translations.json');
        translations = await response.json();
        if (typeof window.loadLanguage === 'function') window.loadLanguage();
        applyTranslations();
    } catch (error) { console.error('Failed to load translations:', error); }
}
function applyTranslations() {
    const lang = localStorage.getItem('selectedLanguage') || 'ja';
    const trans = translations[lang] || translations['ja'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (trans[key]) el.textContent = trans[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (trans[key]) el.placeholder = trans[key];
    });
}
loadTranslations();
document.addEventListener('DOMContentLoaded', function() {
    const langToggleBtn = document.getElementById('langToggleBottom');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', function() {
            const currentLang = localStorage.getItem('selectedLanguage') || 'ja';
            const newLang = currentLang === 'ja' ? 'en' : 'ja';
            localStorage.setItem('selectedLanguage', newLang);
            applyTranslations();
        });
    }
});
