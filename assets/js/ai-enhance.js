// AI画質向上エンジン - PicWish級の高度な処理（彩度・色相はオリジナル維持版）
class AIImageEnhancer {
    constructor() {
        this.kernels = {
            // SRCNN風のカーネル
            edge: [
                [-1, -1, -1],
                [-1,  9, -1],
                [-1, -1, -1]
            ],
            sharpen: [
                [ 0, -1,  0],
                [-1,  5, -1],
                [ 0, -1,  0]
            ],
            gaussian: this.generateGaussianKernel(5, 1.5)
        };
    }

    // ガウシアンカーネル生成
    generateGaussianKernel(size, sigma) {
        const kernel = [];
        const center = Math.floor(size / 2);
        let sum = 0;

        for (let i = 0; i < size; i++) {
            kernel[i] = [];
            for (let j = 0; j < size; j++) {
                const x = i - center;
                const y = j - center;
                const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
                kernel[i][j] = value;
                sum += value;
            }
        }

        // 正規化
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                kernel[i][j] /= sum;
            }
        }

        return kernel;
    }

    // ディープラーニング風の特徴抽出
    extractFeatures(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        // 複数の特徴マップを生成
        const features = {
            edges: new Float32Array(width * height),
            textures: new Float32Array(width * height),
            smooth: new Float32Array(width * height)
        };

        // エッジ特徴
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                let gx = 0, gy = 0;

                // Sobel演算子（輝度ベース）
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nIdx = ((y + dy) * width + (x + dx)) * 4;
                        const lum = data[nIdx] * 0.299 + data[nIdx + 1] * 0.587 + data[nIdx + 2] * 0.114;

                        // X方向
                        if (dx === -1) gx -= lum * (dy === 0 ? 2 : 1);
                        if (dx === 1)  gx += lum * (dy === 0 ? 2 : 1);

                        // Y方向
                        if (dy === -1) gy -= lum * (dx === 0 ? 2 : 1);
                        if (dy === 1)  gy += lum * (dx === 0 ? 2 : 1);
                    }
                }

                features.edges[idx] = Math.sqrt(gx * gx + gy * gy);
            }
        }

        // テクスチャ特徴（局所的な分散）
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                const idx = y * width + x;
                let mean = 0, variance = 0;
                const samples = [];

                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nIdx = ((y + dy) * width + (x + dx)) * 4;
                        const lum = data[nIdx] * 0.299 + data[nIdx + 1] * 0.587 + data[nIdx + 2] * 0.114;
                        samples.push(lum);
                        mean += lum;
                    }
                }

                mean /= 25;
                for (const sample of samples) {
                    variance += Math.pow(sample - mean, 2);
                }
                variance /= 25;

                features.textures[idx] = Math.sqrt(variance);
            }
        }

        // 平滑領域
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                features.smooth[idx] = 1.0 - Math.min(1.0, features.edges[idx] / 255);
            }
        }

        return features;
    }

    // 適応的補間（EDSR/RCAN風）
    adaptiveInterpolation(imageData, scale) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const newWidth = Math.round(width * scale);
        const newHeight = Math.round(height * scale);

        const output = new Uint8ClampedArray(newWidth * newHeight * 4);
        const features = this.extractFeatures(imageData);

        // Lanczos補間の実装
        const lanczosRadius = 3;

        function lanczos(x) {
            if (x === 0) return 1;
            if (Math.abs(x) >= lanczosRadius) return 0;
            const pix = Math.PI * x;
            return (lanczosRadius * Math.sin(pix) * Math.sin(pix / lanczosRadius)) / (pix * pix);
        }

        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const srcX = x / scale;
                const srcY = y / scale;
                const srcXInt = Math.floor(srcX);
                const srcYInt = Math.floor(srcY);

                // 特徴に基づく適応的な補間範囲
                const idx = Math.min(srcYInt * width + srcXInt, features.edges.length - 1);
                const edgeStrength = features.edges[idx] / 255;
                const textureStrength = features.textures[idx] / 255;

                // エッジが強い場所では狭い範囲、平滑な場所では広い範囲
                const adaptiveRadius = edgeStrength > 0.5 ? 2 : lanczosRadius;

                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let weight = 0;

                    for (let dy = -adaptiveRadius; dy <= adaptiveRadius; dy++) {
                        for (let dx = -adaptiveRadius; dx <= adaptiveRadius; dx++) {
                            const sx = Math.min(Math.max(srcXInt + dx, 0), width - 1);
                            const sy = Math.min(Math.max(srcYInt + dy, 0), height - 1);

                            const wx = lanczos(srcX - (srcXInt + dx));
                            const wy = lanczos(srcY - (srcYInt + dy));
                            const w = wx * wy;

                            if (w !== 0) {
                                sum += data[(sy * width + sx) * 4 + c] * w;
                                weight += w;
                            }
                        }
                    }

                    // テクスチャ強度に基づく補正（彩度を乱さないため色チャンネルにランダム値は入れない）
                    let value = weight > 0 ? sum / weight : 0;

                    // エッジ強調（RGB同一係数のため色相・彩度は維持）
                    if (edgeStrength > 0.3) {
                        value = value * (1 + edgeStrength * 0.3);
                    }

                    // ※ここで色チャンネルに別々のノイズを入れると色ズレ→彩度変化の原因になるため無効化
                    // if (textureStrength > 0.2) { /* disabled noisy texture restore */ }

                    output[(y * newWidth + x) * 4 + c] = Math.min(255, Math.max(0, Math.round(value)));
                }
                output[(y * newWidth + x) * 4 + 3] = 255;
            }
        }

        return { data: output, width: newWidth, height: newHeight };
    }

    // 顔検出と顔専用強化（簡易版）
    detectAndEnhanceFaces(imageData) {
        // 肌色検出による簡易的な顔領域の特定
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const skinMask = new Uint8Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // YCrCb色空間での肌色検出（BT.601近似）
                const Y = 0.299 * r + 0.587 * g + 0.114 * b;
                const Cr = (r - Y) * 0.713 + 128;
                const Cb = (b - Y) * 0.564 + 128;

                // 肌色の範囲
                if (Cr > 133 && Cr < 173 && Cb > 77 && Cb < 127) {
                    skinMask[y * width + x] = 1;
                }
            }
        }

        // 肌領域に対して特別な処理（色の増幅はしない＝彩度維持）
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (skinMask[y * width + x]) {
                    const idx = (y * width + x) * 4;

                    // 肌を滑らかにする（3x3の加重平均）
                    for (let c = 0; c < 3; c++) {
                        let sum = 0;
                        let count = 0;

                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + c;
                                const w = (dx === 0 && dy === 0) ? 2 : 1;
                                sum += data[nIdx] * w;
                                count += w;
                            }
                        }

                        data[idx + c] = Math.round(sum / count);
                    }

                    // 以前は R/G 増幅で色調補正していたが、彩度不変のため削除
                    // data[idx]     = Math.min(255, data[idx] * 1.05);
                    // data[idx + 1] = Math.min(255, data[idx + 1] * 1.02);
                }
            }
        }

        return imageData;
    }

    // AIノイズ除去（DnCNN風・簡易）
    denoiseAI(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const output = new Uint8ClampedArray(data);

        // マルチスケールノイズ除去
        const scales = [1, 2, 4];
        const denoised = [];

        for (const scale of scales) {
            const scaled = new Uint8ClampedArray(data);
            const windowSize = scale * 2 + 1;

            for (let y = windowSize; y < height - windowSize; y++) {
                for (let x = windowSize; x < width - windowSize; x++) {
                    const idx = (y * width + x) * 4;

                    for (let c = 0; c < 3; c++) {
                        // 適応的メディアンフィルタ
                        const values = [];

                        for (let dy = -scale; dy <= scale; dy++) {
                            for (let dx = -scale; dx <= scale; dx++) {
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + c;
                                values.push(data[nIdx]);
                            }
                        }

                        values.sort((a, b) => a - b);
                        const median = values[Math.floor(values.length / 2)];
                        const current = data[idx + c];

                        // ノイズの強さを推定
                        const noise = Math.abs(current - median);

                        // 適応的なフィルタリング
                        if (noise > 30) {
                            scaled[idx + c] = median;
                        } else if (noise > 15) {
                            scaled[idx + c] = Math.round(current * 0.7 + median * 0.3);
                        } else {
                            scaled[idx + c] = current;
                        }
                    }
                }
            }

            denoised.push(scaled);
        }

        // マルチスケール結果の統合
        for (let i = 0; i < output.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let s = 0; s < scales.length; s++) {
                    sum += denoised[s][i + c] * (1 / (s + 1));
                }
                output[i + c] = Math.round(sum / scales.reduce((a, _, i) => a + 1 / (i + 1), 0));
            }
        }

        imageData.data.set(output);
        return imageData;
    }

    // メイン処理
    async enhance(blob, targetResolution = 'auto') {
        return new Promise((resolve) => {
            const img = new Image();

            img.onload = async () => {
                const originalWidth = img.width;
                const originalHeight = img.height;

                // 目標解像度の計算
                let scale = 2;
                switch (targetResolution) {
                    case '4k':     scale = Math.min(4, 3840 / originalWidth); break;
                    case '1440p':  scale = Math.min(3, 2560 / originalWidth); break;
                    case '1080p':  scale = Math.min(2, 1920 / originalWidth); break;
                    case '720p':   scale = Math.min(1.5, 1280 / originalWidth); break;
                    case 'original': scale = 1; break;
                    default:       scale = originalWidth < 500 ? 4 : 2;
                }

                // Step 1: 元画像を取得
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = originalWidth;
                canvas.height = originalHeight;
                ctx.drawImage(img, 0, 0);

                let imageData = ctx.getImageData(0, 0, originalWidth, originalHeight);

                // Step 2: AIノイズ除去
                console.log('AIノイズ除去中...');
                imageData = this.denoiseAI(imageData);

                // Step 3: 顔検出と強化（色は変えない）
                console.log('顔領域を検出・強化中...');
                imageData = this.detectAndEnhanceFaces(imageData);

                // Step 4: 適応的超解像
                console.log(`AI超解像処理中... ${scale}倍`);
                const upscaled = this.adaptiveInterpolation(imageData, scale);

                // Step 5: 最終出力
                const outputCanvas = document.createElement('canvas');
                const outputCtx = outputCanvas.getContext('2d');
                outputCanvas.width = upscaled.width;
                outputCanvas.height = upscaled.height;

                const outputImageData = outputCtx.createImageData(upscaled.width, upscaled.height);
                outputImageData.data.set(upscaled.data);
                outputCtx.putImageData(outputImageData, 0, 0);

                // 最終調整（色は変えない）
                const finalCanvas = document.createElement('canvas');
                const finalCtx = finalCanvas.getContext('2d');
                finalCanvas.width = upscaled.width;
                finalCanvas.height = upscaled.height;

                // 彩度・コントラスト・明るさ等は変更しない
                finalCtx.filter = 'none';
                finalCtx.imageSmoothingEnabled = true;
                finalCtx.imageSmoothingQuality = 'high';
                finalCtx.drawImage(outputCanvas, 0, 0);

                // 最高品質で出力
                finalCanvas.toBlob((newBlob) => {
                    console.log(`AI画質向上完了: ${originalWidth}x${originalHeight} → ${upscaled.width}x${upscaled.height}`);
                    resolve(newBlob);
                }, blob.type === 'image/png' ? 'image/png' : 'image/jpeg', 1.0);
            };

            img.src = URL.createObjectURL(blob);
        });
    }
}

// グローバルに公開
window.AIImageEnhancer = AIImageEnhancer;
