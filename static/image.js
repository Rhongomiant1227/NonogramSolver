(function(){
  'use strict';

  const FALLBACK_DIGITS={
    '0':'01110 10001 10011 10101 11001 10001 01110',
    '1':'00100 01100 00100 00100 00100 00100 01110',
    '2':'01110 10001 00001 00010 00100 01000 11111',
    '3':'11110 00001 00001 01110 00001 00001 11110',
    '4':'00010 00110 01010 10010 11111 00010 00010',
    '5':'11111 10000 10000 11110 00001 00001 11110',
    '6':'01110 10001 10000 11110 10001 10001 01110',
    '7':'11111 00001 00010 00100 01000 01000 01000',
    '8':'01110 10001 10001 01110 10001 10001 01110',
    '9':'01110 10001 10001 01111 00001 00001 01110'
  };
  let templateCache=null, textTemplateCache={};

  function median(values){
    const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y);
    if(!a.length)return 0; return a[Math.floor(a.length/2)];
  }
  function percentile(values,p){
    const a=values.slice().sort((x,y)=>x-y); if(!a.length)return 0;
    return a[Math.max(0,Math.min(a.length-1,Math.floor((a.length-1)*p)))];
  }
  function grayImage(imageData){
    const {data,width,height}=imageData, gray=new Uint8Array(width*height);
    for(let i=0,j=0;i<gray.length;i++,j+=4) gray[i]=Math.round(data[j]*.299+data[j+1]*.587+data[j+2]*.114);
    return gray;
  }
  function otsu(gray){
    const hist=new Uint32Array(256); for(const v of gray)hist[v]++;
    let sum=0,total=gray.length; for(let i=0;i<256;i++)sum+=i*hist[i];
    let wB=0,sumB=0,best=127,bestVar=0;
    for(let t=0;t<256;t++){
      wB+=hist[t]; if(!wB)continue; const wF=total-wB;if(!wF)break;
      sumB+=t*hist[t]; const mB=sumB/wB,mF=(sum-sumB)/wF;
      const v=wB*wF*(mB-mF)*(mB-mF); if(v>bestVar){bestVar=v;best=t;}
    }
    return best;
  }
  function makeMask(gray,threshold,invert){
    const out=new Uint8Array(gray.length); for(let i=0;i<gray.length;i++)out[i]=invert?gray[i]>threshold:gray[i]<threshold; return out;
  }
  function projections(mask,width,height,axis){
    const n=axis==='h'?height:width, out=new Array(n).fill(0);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(mask[y*width+x])out[axis==='h'?y:x]++;
    return out;
  }
  function cluster(values){
    const out=[]; let group=[];
    values.forEach((v,i)=>{if(!group.length||v===group[group.length-1]+1)group.push(v);else{out.push(group);group=[v];}});
    if(group.length)out.push(group); return out;
  }
  function lineCandidates(score,total,minStrength=.28){
    const max=Math.max(...score), threshold=Math.max(total*.28,max*.45);
    return cluster(score.map((v,i)=>v>=threshold?i:-1).filter(i=>i>=0)).map(g=>{
      let sum=0,weight=0;g.forEach(i=>{sum+=i*score[i];weight+=score[i]});
      return {pos:weight?sum/weight:(g[0]+g[g.length-1])/2, strength:Math.max(...g.map(i=>score[i]))/total};
    }).filter(v=>v.strength>minStrength);
  }
  function regularLineRun(candidates){
    const coords=candidates.map(c=>c.pos).sort((a,b)=>a-b); if(coords.length<2)return [];
    let best=[];
    for(let i=0;i<coords.length-1;i++){
      const first=coords[i+1]-coords[i]; if(first<7||first>180)continue;
      const run=[coords[i],coords[i+1]];
      for(let j=i+2;j<coords.length;j++){
        const d=coords[j]-coords[j-1]; if(d>=first*.52&&d<=first*1.48&&d>=7&&d<=180)run.push(coords[j]);else break;
      }
      if(run.length>best.length||(run.length===best.length&&variance(run)<variance(best)))best=run;
    }
    return best;
  }
  function variance(a){if(!a||a.length<3)return 1e9;const ds=a.slice(1).map((v,i)=>v-a[i]),m=ds.reduce((x,y)=>x+y,0)/ds.length;return ds.reduce((x,y)=>x+(y-m)*(y-m),0)/ds.length;}
  function detectGrid(gray,width,height){
    const threshold=Math.max(70,Math.min(190,otsu(gray)+18));let selected=null;
    for(const invert of [false,true]){
      const mask=makeMask(gray,threshold,invert),hs=lineCandidates(projections(mask,width,height,'h'),width,.28),vs=lineCandidates(projections(mask,width,height,'v'),height,.20),h=regularLineRun(hs),v=regularLineRun(vs);
      const score=(h.length*v.length)-Math.abs((h.length>=2?median(h.slice(1).map((z,i)=>z-h[i])):0)-(v.length>=2?median(v.slice(1).map((z,i)=>z-v[i])):0))*.01;
      if(!selected||score>selected.score)selected={mask,h,v,score,threshold,invert};
    }
    if(!selected||selected.h.length<2||selected.v.length<2)throw new Error('grid_not_found');
    const raw={mask:selected.mask,h:selected.h,v:selected.v,threshold:selected.threshold,invert:selected.invert,width,height},region=choosePuzzleRegion(raw);
    return {...raw,h:region.h,v:region.v};
  }
  function components(mask,width,height,x0,x1,y0,y1){
    x0=Math.max(0,Math.floor(x0));x1=Math.min(width,Math.ceil(x1));y0=Math.max(0,Math.floor(y0));y1=Math.min(height,Math.ceil(y1));
    const w=x1-x0,h=y1-y0,seen=new Uint8Array(Math.max(0,w*h)),out=[];
    for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
      const at=yy*w+xx;if(seen[at]||!mask[(y0+yy)*width+x0+xx])continue;
      seen[at]=1;const stack=[[xx,yy]],pixels=[];let minX=xx,maxX=xx,minY=yy,maxY=yy;
      while(stack.length){const [sx,sy]=stack.pop();pixels.push([sx,sy]);minX=Math.min(minX,sx);maxX=Math.max(maxX,sx);minY=Math.min(minY,sy);maxY=Math.max(maxY,sy);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=sx+dx,ny=sy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(!seen[ni]&&mask[(y0+ny)*width+x0+nx]){seen[ni]=1;stack.push([nx,ny]);}}
      }
      const cw=maxX-minX+1,ch=maxY-minY+1;if(pixels.length>=3&&cw<=w*.98&&ch<=h*.98){
        const local=new Uint8Array(cw*ch);pixels.forEach(([px,py])=>local[(py-minY)*cw+px-minX]=1);
        out.push({x:x0+minX,y:y0+minY,w:cw,h:ch,area:pixels.length,mask:local});
      }
    }
    return out;
  }
  function choosePuzzleRegion(grid){
    const {h,v,mask,width,height}=grid;if(h.length<7||v.length<7||h.length>42||v.length>42)return {h,v};
    const glyphs=components(mask,width,height,0,width,0,height).filter(c=>c.w<80&&c.h<80&&c.area<1200);
    let best=null,bestScore=0,checks=0;
    for(let r0=0;r0<h.length-5;r0++)for(let rows=5;rows<h.length-r0;rows++){
      const y0=h[r0],y1=h[r0+rows],cellH=(y1-y0)/rows;if(cellH<7||cellH>180)continue;
      for(let c0=0;c0<v.length-5;c0++)for(let cols=5;cols<v.length-c0;cols++){
        if(++checks>160000)return best||{h,v};
        const x0=v[c0],x1=v[c0+cols],cellW=(x1-x0)/cols,ratio=cellW/cellH;if(ratio<.58||ratio>1.75)continue;
        const topY=Math.max(0,y0-cellH*Math.min(12,rows)),leftX=Math.max(0,x0-cellW*Math.min(12,cols));let top=0,left=0,inside=0;
        for(const g of glyphs){if(g.w>cellW*.88||g.h>cellH*.88||g.area>cellW*cellH*.35)continue;const cx=g.x+g.w/2,cy=g.y+g.h/2;
          if(cx>=x0&&cx<=x1&&cy>=topY&&cy<y0)top++;
          else if(cx>=leftX&&cx<x0&&cy>=y0&&cy<=y1)left++;
          else if(cx>=x0&&cx<=x1&&cy>=y0&&cy<=y1)inside++;
        }
        if(top<2||left<2)continue;
        const score=Math.log1p(top)*Math.log1p(left)+Math.min(2,(rows*cols)/400)-inside*.25;
        if(score>bestScore){bestScore=score;best={h:h.slice(r0,r0+rows+1),v:v.slice(c0,c0+cols+1)};}
      }
    }
    return best||{h,v};
  }
  function splitWide(list){
    const medianW=Math.max(3,Math.min(...list.map(c=>c.w))); const result=[];
    for(const c of list){
      if(c.w<=medianW*1.65){result.push(c);continue;}
      // Digits that touch (for example 13 or 513) are kept as one glyph and
      // recognized as a short text string. Splitting them first makes the 1
      // lose its serif and is less reliable across fonts.
      if(c.w<=medianW*3.7){result.push({...c,compositeLength:Math.max(2,Math.min(3,Math.round(c.w/medianW)))});continue;}
      const sums=new Array(c.w).fill(0);for(let y=0;y<c.h;y++)for(let x=0;x<c.w;x++)sums[x]+=c.mask[y*c.w+x];
      const cuts=[];for(let x=2;x<c.w-2;x++)if(sums[x]<=Math.max(1,Math.floor(c.h*.12))&&sums[x]<=sums[x-1]&&sums[x]<=sums[x+1])cuts.push(x);
      const chosen=[];for(const cut of cuts){if(!chosen.length||cut-chosen[chosen.length-1]>3)chosen.push(cut);}
      if(!chosen.length&&c.w>medianW*2.2)chosen.push(Math.round(c.w/2));
      if(!chosen.length){result.push(c);continue;}
      let start=0;for(const end of [...chosen,c.w]){if(end-start>=2){const local=new Uint8Array((end-start)*c.h);for(let y=0;y<c.h;y++)for(let x=start;x<end;x++)local[y*(end-start)+x-start]=c.mask[y*c.w+x];result.push({x:c.x+start,y:c.y,w:end-start,h:c.h,area:local.reduce((a,b)=>a+b,0),mask:local});}start=end;}
    }
    return result;
  }
  function normalize(mask,w,h,tw=24,th=32){
    // Keep each glyph's aspect ratio. Stretching a narrow "1" to the full
    // template width makes it look like other digits and harms OCR across UI fonts.
    const out=new Uint8Array(tw*th),scale=Math.min((tw-4)/w,(th-4)/h),dw=Math.max(1,Math.round(w*scale)),dh=Math.max(1,Math.round(h*scale)),ox=Math.floor((tw-dw)/2),oy=Math.floor((th-dh)/2);
    for(let y=0;y<dh;y++)for(let x=0;x<dw;x++)out[(oy+y)*tw+ox+x]=mask[Math.min(h-1,Math.floor((y+.5)*h/dh))*w+Math.min(w-1,Math.floor((x+.5)*w/dw))];
    return out;
  }
  function cropMask(raw,width,height,minX,maxX,minY,maxY){
    const w=Math.max(1,maxX-minX+1),h=Math.max(1,maxY-minY+1),out=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)out[y*w+x]=raw[(minY+y)*width+minX+x];
    return {mask:out,width:w,height:h};
  }
  function hasHole(c){
    const w=c.w,h=c.h,seen=new Uint8Array(w*h),stack=[];
    for(let x=0;x<w;x++){if(!c.mask[x]){seen[x]=1;stack.push([x,0]);}if(!c.mask[(h-1)*w+x]&&!seen[(h-1)*w+x]){seen[(h-1)*w+x]=1;stack.push([x,h-1]);}}
    for(let y=0;y<h;y++){if(!c.mask[y*w]&&!seen[y*w]){seen[y*w]=1;stack.push([0,y]);}if(!c.mask[y*w+w-1]&&!seen[y*w+w-1]){seen[y*w+w-1]=1;stack.push([w-1,y]);}}
    while(stack.length){const [x,y]=stack.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<w&&ny<h){const i=ny*w+nx;if(!c.mask[i]&&!seen[i]){seen[i]=1;stack.push([nx,ny]);}}}}
    for(let i=0;i<w*h;i++)if(!c.mask[i]&&!seen[i])return true;return false;
  }
  function renderTemplates(){
    if(templateCache)return templateCache; const result={};
    for(const d of Object.keys(FALLBACK_DIGITS))result[d]=[];
    const fonts=[];
    for(const size of [11,12,13,14,15,16,17,18]){
      fonts.push(`normal ${size}px "Times New Roman"`,`bold ${size}px "Times New Roman"`,`normal ${size}px Georgia`,`bold ${size}px Georgia`,`normal ${size}px Arial`,`bold ${size}px Arial`,`normal ${size}px sans-serif`);
    }
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d',{willReadFrequently:true});
    for(const font of fonts)for(const d of Object.keys(result)){
      ctx.clearRect(0,0,64,64);ctx.fillStyle='black';ctx.font=font;ctx.textBaseline='alphabetic';ctx.fillText(d,8,45);const data=ctx.getImageData(0,0,64,64).data, raw=new Uint8Array(64*64);let minX=64,maxX=0,minY=64,maxY=0;
      for(let y=0;y<64;y++)for(let x=0;x<64;x++){if(data[(y*64+x)*4+3]>80){raw[y*64+x]=1;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
      if(maxX>=minX){const cropped=cropMask(raw,64,64,minX,maxX,minY,maxY);result[d].push(normalize(cropped.mask,cropped.width,cropped.height));}
    }
    for(const d of Object.keys(FALLBACK_DIGITS)){const rows=FALLBACK_DIGITS[d].split(' '),raw=new Uint8Array(5*7);rows.forEach((row,y)=>[...row].forEach((v,x)=>raw[y*5+x]=+v));result[d].push(normalize(raw,5,7));}
    templateCache=result;return result;
  }
  function renderTextTemplate(text){
    if(textTemplateCache[text])return textTemplateCache[text];const out=[];
    const fonts=[];for(const size of [11,12,13,14,15,16,17,18])fonts.push(`normal ${size}px "Times New Roman"`,`bold ${size}px "Times New Roman"`,`normal ${size}px Georgia`,`bold ${size}px Georgia`,`normal ${size}px Arial`,`bold ${size}px Arial`,`normal ${size}px sans-serif`);
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=64;const ctx=canvas.getContext('2d',{willReadFrequently:true});
    for(const font of fonts){ctx.clearRect(0,0,96,64);ctx.fillStyle='black';ctx.font=font;ctx.textBaseline='alphabetic';ctx.fillText(text,4,45);const data=ctx.getImageData(0,0,96,64).data,raw=new Uint8Array(96*64);let minX=96,maxX=0,minY=64,maxY=0;
      for(let y=0;y<64;y++)for(let x=0;x<96;x++){if(data[(y*96+x)*4+3]>80){raw[y*96+x]=1;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
      if(maxX>=minX){const cropped=cropMask(raw,96,64,minX,maxX,minY,maxY);out.push(normalize(cropped.mask,cropped.width,cropped.height));}
    }
    return textTemplateCache[text]=out;
  }
  function classify(c){
    if(c.compositeLength){
      const sums=new Array(c.w).fill(0);for(let y=0;y<c.h;y++)for(let x=0;x<c.w;x++)sums[x]+=c.mask[y*c.w+x];
      const center=c.w/2, cuts=[];for(let x=2;x<c.w-2;x++)if(Math.abs(x-center)<c.w*.35&&sums[x]<=Math.max(1,Math.floor(c.h*.15)))cuts.push(x);
      const cut=cuts.length?cuts.sort((a,b)=>Math.abs(a-center)-Math.abs(b-center))[0]:Math.round(center);
      const parts=[];for(const [start,end] of [[0,cut],[cut,c.w]]){const local=new Uint8Array((end-start)*c.h);for(let y=0;y<c.h;y++)for(let x=start;x<end;x++)local[y*(end-start)+x-start]=c.mask[y*c.w+x];parts.push({x:c.x+start,y:c.y,w:end-start,h:c.h,mask:local});}
      const left=classifySingle(parts[0]),right=classifySingle(parts[1]);
      return {digit:left.digit+right.digit,confidence:(left.confidence+right.confidence)/2};
    }
    return classifySingle(c);
  }
  function classifySingle(c){
    const f=normalize(c.mask,c.w,c.h), templates=renderTemplates(),scores={};
    for(const [d,arr] of Object.entries(templates))if(d!=='0')for(const t of arr){let diff=0;for(let i=0;i<f.length;i++)diff+=f[i]===t[i]?0:1;const score=diff/f.length;if(scores[d]===undefined||score<scores[d])scores[d]=score;}
    const alternatives=Object.entries(scores).sort((a,b)=>a[1]-b[1]);
    let [best,bestScore]=alternatives[0]||['?',1];
    // 3 and 5 have nearly identical silhouettes at small sizes. Their upper
    // half gives a stable cue: 5 carries ink on the upper-left stem, while 3
    // is weighted toward the upper-right bowl. Only override when the two
    // template scores are close, so other fonts remain template-driven.
    const score3=scores['3'],score5=scores['5'];
    if((best==='3'||best==='5')&&Number.isFinite(score3)&&Number.isFinite(score5)&&Math.abs(score3-score5)<.07){
      const mid=Math.max(1,Math.floor(c.w/2)),half=Math.max(1,Math.floor(c.h/2));let left=0,right=0;
      for(let y=0;y<half;y++)for(let x=0;x<c.w;x++){if(c.mask[y*c.w+x]){if(x<mid)left++;else right++;}}
      if(left>right*1.08){best='5';bestScore=score5;}else if(right>left*1.08){best='3';bestScore=score3;}
    }
    return {digit:best,confidence:Math.max(0,Math.min(1,1-bestScore*1.8)),alternatives:alternatives.slice(0,5).map(([digit,score])=>({digit,score}))};
  }
  function parseGroups(list,axis,cellSize){
    if(!list.length)return {values:[],confidence:1}; list.sort((a,b)=>axis==='x'?a.x-b.x:a.y-b.y);
    const glyphWidth=Math.max(3,Math.min(...list.map(c=>axis==='x'?c.w:c.h))), classified=list.map(c=>({...c,...classify(c)}));
    const groups=[]; for(const c of classified){const key=axis==='x'?'x':'y',end=axis==='x'?c.x+c.w:c.y+c.h;const last=groups[groups.length-1];
      if(!last||((axis==='x'?c.x:c.y)-(axis==='x'?last.end:last.end))>Math.max(2,glyphWidth*.55)){groups.push({items:[c],start:axis==='x'?c.x:c.y,end});}else{last.items.push(c);last.end=Math.max(last.end,end);}}
    const values=groups.map(g=>g.items.sort((a,b)=>axis==='x'?a.x-b.x:a.y-b.y).map(c=>c.digit).join('')).map(v=>Number(v)).filter(v=>Number.isFinite(v)&&v>0&&v<=120);
    const confidence=classified.reduce((s,c)=>s+c.confidence,0)/Math.max(1,classified.length);return {values,confidence};
  }
  function parseImage(image){
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height);const gray=grayImage(data),grid=detectGrid(gray,canvas.width,canvas.height),rows=[],cols=[],scores=[];
    for(let r=0;r<grid.h.length-1;r++){const y0=grid.h[r]+2,y1=grid.h[r+1]-2;const comps=splitWide(components(grid.mask,grid.width,grid.height,0,grid.v[0]-2,y0,y1));const parsed=parseGroups(comps,'x',grid.h[r+1]-grid.h[r]);rows.push(parsed.values);scores.push(parsed.confidence);}
    for(let c=0;c<grid.v.length-1;c++){const x0=grid.v[c]+2,x1=grid.v[c+1]-2;const comps=splitWide(components(grid.mask,grid.width,grid.height,x0,x1,0,grid.h[0]-2));const parsed=parseGroups(comps,'y',grid.v[c+1]-grid.v[c]);cols.push(parsed.values);scores.push(parsed.confidence);}
    if(!rows.some(line=>line.length)||!cols.some(line=>line.length))throw new Error('clues_not_found');
    const confidence=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;
    return {rows,cols,gridLines:{horizontal:grid.h,vertical:grid.v},width:canvas.width,height:canvas.height,confidence,dimensions:{rows:rows.length,cols:cols.length}};
  }
  async function loadFile(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{try{resolve({url,image:img,result:parseImage(img)});}catch(e){reject(e);} };img.onerror=()=>reject(new Error('image_load_failed'));img.src=url;});}
  window.NONOGRAM_IMAGE={loadFile,parseImage};
})();
