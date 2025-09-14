// assets/js/ai-enhance.js
// 4K向け：ESRGAN 4x + タイル推論 + 色味不変（輝度Yのみ差し替え）
// UpscalerJS のブラウザ実行を動的 import（ESM, CDN）

// ---- YCbCr（BT.601 近似）：色差(Cb/Cr)を保持し、輝度(Y)のみ差し替え ----
function rgb2ycbcr(r,g,b){const Y=0.299*r+0.587*g+0.114*b;return{Y,Cb:128+0.564*(b-Y),Cr:128+0.713*(r-Y)};}
function ycbcr2rgb(Y,Cb,Cr){
  const r=Y+1.403*(Cr-128), g=Y-0.344*(Cb-128)-0.714*(Cr-128), b=Y+1.773*(Cb-128);
  return [
    Math.max(0,Math.min(255,Math.round(r))),
    Math.max(0,Math.min(255,Math.round(g))),
    Math.max(0,Math.min(255,Math.round(b)))
  ];
}
function mergeLuma(srCanvas, baseCanvas){
  const w=srCanvas.width,h=srCanvas.height;
  const out=document.createElement('canvas'); out.width=w; out.height=h;
  const octx=out.getContext('2d');
  const sctx=srCanvas.getContext('2d'), bctx=baseCanvas.getContext('2d');
  const s=sctx.getImageData(0,0,w,h), b=bctx.getImageData(0,0,w,h);
  const d=s.data, bd=b.data;
  for(let i=0;i<d.length;i+=4){
    const {Cb,Cr}=rgb2ycbcr(bd[i],bd[i+1],bd[i+2]); // 色はベースから
    const {Y}=rgb2ycbcr(d[i],d[i+1],d[i+2]);        // 輝度はSRから
    const [r,g,bv]=ycbcr2rgb(Y,Cb,Cr);
    d[i]=r; d[i+1]=g; d[i+2]=bv; // alphaはそのまま
  }
  octx.putImageData(s,0,0);
  return out;
}

// ---- Utils ----
async function blobToDataURL(blob){return await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(blob);});}
async function imgFromDataURL(u){const img=new Image();img.decoding='async';img.src=u;await img.decode();return img;}
const fitWithin=(w,h,ar)=> (ar>(w/h))? [w, Math.round(w/ar)] : [Math.round(h*ar), h];

export class AIImageEnhancer {
  // targetResolution: 'auto' | '4k' | '1440p' | '1080p' | '720p' | 'original'
  async enhance(blob, targetResolution='auto') {
    // 1) UpscalerJS & 4x ESRGAN モデルをCDNから動的 import
    //   - esrgan-thick は高品質寄りのモデル群（ブラウザでも利用可だが重め）:contentReference[oaicite:1]{index=1}
    const Upscaler = (await import('https://esm.sh/upscaler@1?bundle')).default;
    const model    = (await import('https://esm.sh/@upscalerjs/esrgan-thick@1/4x?bundle')).default; // 4x モデル
    const upscaler = new Upscaler({ model });

    // 2) 入力読込
    const srcDataURL = await blobToDataURL(blob);
    const srcImg = await imgFromDataURL(srcDataURL);
    const ow = srcImg.naturalWidth, oh = srcImg.naturalHeight, ar = ow/oh;

    // 3) まず 4x 超解像（タイル推論＋padding で継ぎ目抑制）:contentReference[oaicite:2]{index=2}
    const srDataURL = await upscaler.upscale(srcDataURL, {
      patchSize: 256,   // 128〜256 で環境に合わせて
      padding: 16       // padding を必ず指定（未指定だと継ぎ目アーティファクト）:contentReference[oaicite:3]{index=3}
    });
    const srImg = await imgFromDataURL(srDataURL);

    // 4) 目標解像度に合わせる（4K最大・AR維持）
    let [tw, th] = [srImg.width, srImg.height];
    switch (targetResolution) {
      case '4k':    [tw,th]=fitWithin(3840,2160, ar); break;
      case '1440p': [tw,th]=fitWithin(2560,1440, ar); break;
      case '1080p': [tw,th]=fitWithin(1920,1080, ar); break;
      case '720p':  [tw,th]=fitWithin(1280, 720, ar); break;
      case 'original': [tw,th]=[ow,oh]; break;
      default:
        if (tw>3200){ const s=3200/tw; tw=Math.round(tw*s); th=Math.round(th*s); } // Auto: 軽く締める
    }

    // 5) 参照用のベース（高品質補間のみ）と SR を同サイズに揃える
    const mk=(w,h)=>{const c=document.createElement('canvas'); c.width=w; c.height=h; return c;};
    const base = mk(tw,th), bctx=base.getContext('2d');
    bctx.imageSmoothingEnabled = true; bctx.imageSmoothingQuality = 'high'; bctx.filter='none';
    bctx.drawImage(srcImg, 0, 0, tw, th);

    const sr   = mk(tw,th), sctx=sr.getContext('2d');
    sctx.imageSmoothingEnabled = true; sctx.imageSmoothingQuality = 'high'; sctx.filter='none';
    sctx.drawImage(srImg, 0, 0, tw, th);

    // 6) 輝度だけ SR に置き換え（= 彩度・色相は完全維持）
    const merged = mergeLuma(sr, base);

    // 7) 出力（元がPNGならPNG）
    return await new Promise(res => merged.toBlob(res, (blob.type==='image/png'?'image/png':'image/jpeg'), 1.0));
  }
}

// グローバル公開（download.js から参照）
window.AIImageEnhancer = AIImageEnhancer;
