
(function(){
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
      const {Cb,Cr}=rgb2ycbcr(bd[i],bd[i+1],bd[i+2]); // 色はベース
      const {Y}=rgb2ycbcr(d[i],d[i+1],d[i+2]);        // 輝度はSR
      const [r,g,bv]=ycbcr2rgb(Y,Cb,Cr);
      d[i]=r; d[i+1]=g; d[i+2]=bv; // alphaはそのまま
    }
    octx.putImageData(s,0,0);
    return out;
  }

  // ---- Utils ----
  async function blobToDataURL(blob){return await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(blob);});}
  async function imgFromDataURL(u){const img=new Image();img.decoding='async';img.src=u;await img.decode().catch(()=>{});return img;}
  const fitWithin=(w,h,ar)=> (ar>(w/h))? [w, Math.round(w/ar)] : [Math.round(h*ar), h];

  // ここから既存のクラス名・APIを維持
  class AIImageEnhancer {
    // targetResolution: 'auto' | '4k' | '1440p' | '1080p' | '720p' | 'original'
    async enhance(blob, targetResolution='auto') {
      // --- 1) まずESRGAN（UpscalerJS）を試す。失敗したら従来処理にフォールバック ---
      try {
        // 動的importは非モジュールでも使用可（MDN: import()）。CDNからESMを読み込み。 
        const Upscaler = (await import('https://esm.sh/upscaler@1?bundle')).default;
        // 高画質寄り：esrgan-thick/4x（重い場合は esrgan-medium/4x に差し替え可）
        const model = (await import('https://esm.sh/@upscalerjs/esrgan-thick@1/4x?bundle')).default;

        const upscaler = new Upscaler({ model });
        const srcDataURL = await blobToDataURL(blob);
        const srcImg = await imgFromDataURL(srcDataURL);
        const ow = srcImg.naturalWidth || srcImg.width;
        const oh = srcImg.naturalHeight || srcImg.height;
        const ar = ow/oh;

        // 4x超解像：タイル＋paddingで継ぎ目抑制（padding未指定はアーティファクトの原因）
        const srDataURL = await upscaler.upscale(srcDataURL, { patchSize: 256, padding: 16 });
        const srImg = await imgFromDataURL(srDataURL);

        // 目標解像度
        let tw = srImg.width, th = srImg.height;
        const fit = (mw,mh)=>fitWithin(mw,mh,ar);
        switch (targetResolution) {
          case '4k':    [tw,th]=fit(3840,2160); break;
          case '1440p': [tw,th]=fit(2560,1440); break;
          case '1080p': [tw,th]=fit(1920,1080); break;
          case '720p':  [tw,th]=fit(1280, 720); break;
          case 'original': tw=ow; th=oh; break;
          default: if (tw>3200){ const s=3200/tw; tw=Math.round(tw*s); th=Math.round(th*s); }
        }

        // ベース（元画像の高品質補間）とSRを同サイズに揃える
        const mk=(w,h)=>{const c=document.createElement('canvas'); c.width=w; c.height=h; return c;};
        const base = mk(tw,th), bctx=base.getContext('2d');
        bctx.imageSmoothingEnabled=true; bctx.imageSmoothingQuality='high'; bctx.filter='none';
        bctx.drawImage(srcImg,0,0,tw,th);

        const sr   = mk(tw,th), sctx=sr.getContext('2d');
        sctx.imageSmoothingEnabled=true; sctx.imageSmoothingQuality='high'; sctx.filter='none';
        sctx.drawImage(srImg,0,0,tw,th);

        // 輝度だけSRへ差し替え（色味は完全維持）
        const merged = mergeLuma(sr, base);

        // 出力
        return await new Promise(res => merged.toBlob(res, (blob.type==='image/png'?'image/png':'image/jpeg'), 1.0));
      } catch (e) {
        console.warn('[AIImageEnhancer] ESRGAN fallback:', e);
      }

      // --- 2) フォールバック：従来の補間（※色は変えない）。“効き”は弱め ---
      return await this._fallbackEnhance(blob, targetResolution);
    }

    // ===== 以下：あなたの従来ロジックを簡略化したフォールバック =====
    generateGaussianKernel(size, sigma) {
      const kernel = []; const c = Math.floor(size / 2); let sum = 0;
      for (let i = 0; i < size; i++) { kernel[i] = [];
        for (let j = 0; j < size; j++) { const x = i - c, y = j - c;
          const v = Math.exp(-(x*x + y*y) / (2*sigma*sigma)); kernel[i][j] = v; sum += v; } }
      for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) kernel[i][j] /= sum;
      return kernel;
    }

    // 既存のdenoiseAI / detectAndEnhanceFaces / adaptiveInterpolation を最小構成で利用
    // ----（あなたの元コードを流用：色を変える処理は削除済み）----
    denoiseAI(imageData) {
      const { data, width, height } = imageData;
      const out = new Uint8ClampedArray(data);
      const scales = [1,2]; const results=[];
      for (const scale of scales) {
        const scaled = new Uint8ClampedArray(data); const ws = scale*2+1;
        for (let y=ws; y<height-ws; y++) for (let x=ws; x<width-ws; x++) {
          const idx=(y*width+x)*4;
          for (let c=0;c<3;c++){
            const vals=[]; for(let dy=-scale;dy<=scale;dy++) for(let dx=-scale;dx<=scale;dx++){
              const n=((y+dy)*width+(x+dx))*4+c; vals.push(data[n]); }
            vals.sort((a,b)=>a-b); const med=vals[(vals.length/2)|0]; const cur=data[idx+c];
            const noise=Math.abs(cur-med); scaled[idx+c]= noise>25 ? med : (noise>12 ? ((cur*0.7+med*0.3)|0) : cur);
          }
        }
        results.push(scaled);
      }
      for (let i=0;i<out.length;i+=4) for(let c=0;c<3;c++){
        let sum=0, w=0; for(let s=0;s<results.length;s++){ sum+=results[s][i+c]*(1/(s+1)); w+=1/(s+1); }
        out[i+c]=(sum/w)|0; } imageData.data.set(out); return imageData;
    }

    detectAndEnhanceFaces(imageData) {
      const { data, width, height } = imageData; const mask=new Uint8Array(width*height);
      for(let y=0;y<height;y++) for(let x=0;x<width;x++){
        const i=(y*width+x)*4; const r=data[i],g=data[i+1],b=data[i+2];
        const Y=0.299*r+0.587*g+0.114*b, Cr=(r - Y)*0.713 + 128, Cb=(b - Y)*0.564 + 128;
        if (Cr>133 && Cr<173 && Cb>77 && Cb<127) mask[y*width+x]=1;
      }
      for(let y=1;y<height-1;y++) for(let x=1;x<width-1;x++) if(mask[y*width+x]){
        const i=(y*width+x)*4; for(let c=0;c<3;c++){
          let sum=0, cnt=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
            const n=((y+dy)*width+(x+dx))*4+c; const w=(dx===0&&dy===0)?2:1; sum+=data[n]*w; cnt+=w; }
          data[i+c]=(sum/cnt)|0;
        }
      }
      return imageData;
    }

    adaptiveInterpolation(imageData, scale) {
      const { data, width, height } = imageData;
      const newWidth=Math.round(width*scale), newHeight=Math.round(height*scale);
      const out=new Uint8ClampedArray(newWidth*newHeight*4);
      const R=3; const lanczos=(x)=> x===0?1:(Math.abs(x)>=R?0:((R*Math.sin(Math.PI*x)*Math.sin(Math.PI*x/R))/(Math.PI*x*Math.PI*x)));
      for(let y=0;y<newHeight;y++) for(let x=0;x<newWidth;x++){
        const sx=x/scale, sy=y/scale, sxi=Math.floor(sx), syi=Math.floor(sy);
        for(let c=0;c<3;c++){ let sum=0,w=0;
          for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){
            const px=Math.min(width-1,Math.max(0,sxi+dx)), py=Math.min(height-1,Math.max(0,syi+dy));
            const wx=lanczos(sx-(sxi+dx)), wy=lanczos(sy-(syi+dy)), ww=wx*wy;
            if(ww){ sum+=data[(py*width+px)*4+c]*ww; w+=ww; }
          }
          out[(y*newWidth+x)*4+c]= Math.min(255,Math.max(0,Math.round(w?sum/w:0)));
        }
        out[(y*newWidth+x)*4+3]=255;
      }
      return { data: out, width: newWidth, height: newHeight };
    }

    async _fallbackEnhance(blob, targetResolution='auto'){
      return new Promise((resolve)=>{
        const img=new Image(); img.decoding='async';
        img.onload=()=>{
          const ow=img.width, oh=img.height;
          let scale=2;
          switch (targetResolution) {
            case '4k': scale=Math.min(4,3840/ow); break;
            case '1440p': scale=Math.min(3,2560/ow); break;
            case '1080p': scale=Math.min(2,1920/ow); break;
            case '720p': scale=Math.min(1.5,1280/ow); break;
            case 'original': scale=1; break;
            default: scale=ow<500?4:2;
          }
          const can=document.createElement('canvas'); const ctx=can.getContext('2d',{willReadFrequently:true});
          can.width=ow; can.height=oh; ctx.drawImage(img,0,0);
          let id=ctx.getImageData(0,0,ow,oh);
          id=this.denoiseAI(id);
          id=this.detectAndEnhanceFaces(id);
          const up=this.adaptiveInterpolation(id, scale);

          const out=document.createElement('canvas'); out.width=up.width; out.height=up.height;
          const octx=out.getContext('2d'); const oid=octx.createImageData(up.width,up.height); oid.data.set(up.data); octx.putImageData(oid,0,0);

          const fin=document.createElement('canvas'); fin.width=up.width; fin.height=up.height;
          const fctx=fin.getContext('2d'); fctx.filter='none'; fctx.imageSmoothingEnabled=true; fctx.imageSmoothingQuality='high';
          fctx.drawImage(out,0,0);
          fin.toBlob((nb)=>resolve(nb), (blob.type==='image/png'?'image/png':'image/jpeg'), 1.0);
        };
        img.src=URL.createObjectURL(blob);
      });
    }
  }

  // グローバル公開（download.js から new AIImageEnhancer().enhance(...)）
  window.AIImageEnhancer = AIImageEnhancer;
})();
