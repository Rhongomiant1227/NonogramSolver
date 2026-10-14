(function(){
'use strict';
const messages=window.NONOGRAM_MESSAGES, locales=window.NONOGRAM_LOCALES;
const extraMessages={
  en:{imagePanelTitle:'Screenshot recognition and automation',imageHelp:'Upload a clear screenshot containing the full grid and all row and column clues. Cropping to the puzzle area helps avoid unrelated page elements. You can also paste a screenshot with Ctrl+V.',imageUpload:'Choose screenshot',analyzeImage:'Recognize screenshot',automationTitle:'Mouse automation (optional)',markEmpty:'Also mark empty cells with right click (X)',mouseConfirm:'I confirm that the current screen shows the target Nonogram page',cluesReviewed:'I reviewed the recognized clues and solution',automationNote:'The screenshot must match the current screen position and scale. X/Y are screen offsets for a cropped screenshot; scale handles a different screenshot size. Without confirmation this is a safe dry run and will not move the mouse.',mouseFill:'Generate / run clicks',copyMouseScript:'Copy automation script',imageReady:'Screenshot loaded. Select Recognize screenshot.',imageWorking:'Detecting grid and reading clues…',imageSuccess:'Recognized {rows} × {cols}; confidence {confidence}%. The clues were copied into the input fields and the puzzle was solved.',imageLowConfidence:'Recognition is uncertain ({confidence}%). Check the clues above before using the result.',imageNoGrid:'Could not find a regular grid. Try a clearer screenshot with the full puzzle visible.',imageCluesNotFound:'A grid was detected, but no clue numbers could be read. Include both clue areas in the screenshot.',imageSolveFailed:'The grid was detected, but the recognized clues are not a valid puzzle yet. Adjust the clues and solve again.',mouseDry:'Dry run: {count} click operations prepared. Tick the confirmation box to operate the screen.',mouseDone:'Completed {count} mouse operations.',mouseBlocked:'Tick the confirmation box before allowing mouse control.',mouseNoResult:'Solve a recognized or manually entered puzzle first.',mouseScriptReady:'Automation script copied',mouseError:'Mouse automation failed: {message}'},
  zh:{imagePanelTitle:'截图识别与自动操作',imageHelp:'上传包含完整棋盘和全部行列线索的清晰截图。建议裁剪到题目区域，减少页面其他内容的干扰。也可以直接按 Ctrl+V 粘贴剪贴板中的截图。',imageUpload:'选择截图',analyzeImage:'识别截图',automationTitle:'鼠标自动填写（可选）',markEmpty:'同时用右键标记空格（叉号）',mouseConfirm:'我确认要操作当前屏幕上的 Nonogram 页面',cluesReviewed:'我已核对识别线索和求解结果',automationNote:'截图必须对应当前屏幕的位置和比例。偏移量用于裁剪截图：X、Y 是屏幕左上角坐标；缩放用于截图与屏幕尺寸不同的情况。未勾选确认时只进行安全演练，不会移动鼠标。',mouseFill:'生成/执行点击',copyMouseScript:'复制自动化脚本',imageReady:'截图已载入，点击“识别截图”。',imageWorking:'正在检测网格并识别线索…',imageSuccess:'已识别 {rows} × {cols}，置信度 {confidence}%。线索已填入输入框并自动求解。',imageLowConfidence:'识别置信度较低（{confidence}%），执行自动操作前请检查上方线索。',imageNoGrid:'没有找到规则网格，请上传包含完整题目的清晰截图。',imageCluesNotFound:'检测到棋盘，但没有读到行列线索。请确保截图同时包含两侧的数字线索。',imageSolveFailed:'识别完成，但线索暂时无法组成可行题目；请校准行列数字后再求解。',mouseDry:'安全演练：已准备 {count} 个点击操作。勾选确认后才会操作屏幕。',mouseDone:'已完成 {count} 个鼠标操作。',mouseBlocked:'请先勾选确认框，才允许控制鼠标。',mouseNoResult:'请先识别或手动输入并求解一道题。',mouseScriptReady:'自动化脚本已复制',mouseError:'鼠标自动操作失败：{message}'}
};
Object.keys(extraMessages).forEach(lang=>Object.assign(messages[lang],extraMessages[lang]));
const importLabels={
  ja:{imagePanelTitle:'画像認識と自動入力',imageHelp:'盤面と行列のヒント全体が写った画像を選択してください。盤面部分だけを切り抜くと精度が上がります。Ctrl+V でスクリーンショットを貼り付けることもできます。',imageUpload:'画像を選択',analyzeImage:'画像を認識',automationTitle:'マウス自動入力（任意）',markEmpty:'右クリックで空マスも印を付ける',cluesReviewed:'ヒントと解答を確認しました',mouseFill:'クリックを生成／実行',copyMouseScript:'操作スクリプトをコピー',originX:'画面 X オフセット',originY:'画面 Y オフセット',imageScale:'画像倍率'},
  ko:{imagePanelTitle:'이미지 인식 및 자동 입력',imageHelp:'전체 격자와 행·열 단서가 보이는 이미지를 선택하세요. 퍼즐 영역만 잘라내면 정확도가 높아집니다. Ctrl+V로 스크린샷을 붙여넣을 수도 있습니다.',imageUpload:'이미지 선택',analyzeImage:'이미지 인식',automationTitle:'마우스 자동 입력(선택)',markEmpty:'오른쪽 클릭으로 빈칸도 표시',cluesReviewed:'단서와 답을 확인했습니다',mouseFill:'클릭 생성/실행',copyMouseScript:'자동화 스크립트 복사',originX:'화면 X 오프셋',originY:'화면 Y 오프셋',imageScale:'이미지 배율'},
  es:{imagePanelTitle:'Reconocimiento y automatización',imageHelp:'Elige una imagen clara con la cuadrícula y todas las pistas. Recortar la zona del puzzle mejora la detección. También puedes pegar una captura con Ctrl+V.',imageUpload:'Elegir imagen',analyzeImage:'Reconocer imagen',automationTitle:'Relleno automático con ratón',markEmpty:'Marcar vacías con clic derecho',cluesReviewed:'He revisado las pistas y la solución',mouseFill:'Generar / ejecutar clics',copyMouseScript:'Copiar script',originX:'Desplazamiento X',originY:'Desplazamiento Y',imageScale:'Escala de imagen'},
  fr:{imagePanelTitle:'Reconnaissance et automatisation',imageHelp:'Choisissez une image nette montrant la grille et tous les indices. Recadrer le puzzle améliore la détection. Vous pouvez aussi coller une capture avec Ctrl+V.',imageUpload:'Choisir une image',analyzeImage:'Reconnaître l’image',automationTitle:'Remplissage automatique',markEmpty:'Marquer les cases vides avec le clic droit',cluesReviewed:'J’ai vérifié les indices et la solution',mouseFill:'Générer / exécuter les clics',copyMouseScript:'Copier le script',originX:'Décalage X écran',originY:'Décalage Y écran',imageScale:'Échelle de l’image'},
  de:{imagePanelTitle:'Bilderkennung und Automatisierung',imageHelp:'Wähle ein klares Bild mit vollständigem Raster und allen Hinweisen. Ein Zuschnitt auf das Rätsel verbessert die Erkennung. Du kannst einen Screenshot auch mit Strg+V einfügen.',imageUpload:'Bild auswählen',analyzeImage:'Bild erkennen',automationTitle:'Automatisches Ausfüllen',markEmpty:'Leere Felder per Rechtsklick markieren',cluesReviewed:'Ich habe Hinweise und Lösung geprüft',mouseFill:'Klicks erstellen / ausführen',copyMouseScript:'Skript kopieren',originX:'Bildschirmversatz X',originY:'Bildschirmversatz Y',imageScale:'Bildskalierung'},
  pt:{imagePanelTitle:'Reconhecimento e automação',imageHelp:'Escolha uma imagem nítida com a grelha e todas as pistas. Recortar a área do puzzle melhora o reconhecimento. Também pode colar uma captura com Ctrl+V.',imageUpload:'Escolher imagem',analyzeImage:'Reconhecer imagem',automationTitle:'Preenchimento automático',markEmpty:'Marcar vazias com clique direito',cluesReviewed:'Revisei as pistas e a solução',mouseFill:'Gerar / executar cliques',copyMouseScript:'Copiar script',originX:'Deslocamento X',originY:'Deslocamento Y',imageScale:'Escala da imagem'},
  hi:{imagePanelTitle:'चित्र पहचान और स्वचालन',imageHelp:'पूरी ग्रिड और सभी संकेतों वाला साफ़ चित्र चुनें। पहेली वाले हिस्से को काटकर देने से पहचान बेहतर होती है। Ctrl+V से स्क्रीनशॉट चिपका भी सकते हैं।',imageUpload:'चित्र चुनें',analyzeImage:'चित्र पहचानें',automationTitle:'माउस से स्वतः भरें',markEmpty:'दाएँ क्लिक से खाली खाने चिह्नित करें',cluesReviewed:'मैंने संकेत और उत्तर जाँच लिए हैं',mouseFill:'क्लिक बनाएँ / चलाएँ',copyMouseScript:'स्क्रिप्ट कॉपी करें',originX:'स्क्रीन X ऑफ़सेट',originY:'स्क्रीन Y ऑफ़सेट',imageScale:'चित्र स्केल'},
  ru:{imagePanelTitle:'Распознавание и автоматизация',imageHelp:'Выберите чёткий снимок со всей сеткой и подсказками. Обрезка до области головоломки улучшит распознавание. Скриншот также можно вставить сочетанием Ctrl+V.',imageUpload:'Выбрать изображение',analyzeImage:'Распознать изображение',automationTitle:'Автозаполнение мышью',markEmpty:'Отметить пустые клетки правой кнопкой',cluesReviewed:'Я проверил подсказки и ответ',mouseFill:'Создать / выполнить клики',copyMouseScript:'Скопировать скрипт',originX:'Смещение экрана X',originY:'Смещение экрана Y',imageScale:'Масштаб изображения'}
};
Object.keys(importLabels).forEach(lang=>Object.assign(messages[lang],importLabels[lang]));
Object.assign(messages.en,{originX:'Screen X offset',originY:'Screen Y offset',imageScale:'Image scale'});Object.assign(messages.zh,{originX:'屏幕 X 偏移',originY:'屏幕 Y 偏移',imageScale:'截图缩放'});
const $=selector=>document.querySelector(selector);
const rowsN=$('#rowsN'), colsN=$('#colsN'), rowsInput=$('#rowsInput'), colsInput=$('#colsInput');
const imageInput=$('#imageInput'), analyzeImageBtn=$('#analyzeImageBtn'), imagePreview=$('#imagePreview'), imagePreviewImg=$('#imagePreviewImg'), imageStatus=$('#imageStatus');
let recognizedImage=null, recognizedImageUrl='', importedImageFile=null, applyingRecognized=false;
let imageStatusState={key:'',args:{},type:''};
let language='zh', rowsData=[], colsData=[], lastGrid=[], currentResult=null, emptyState={title:'emptyTitle',message:'emptyText'};
let statusState={title:'ready',message:'readyHint',type:'',args:{}};
try{const saved=localStorage.getItem('nonogram-language');if(messages[saved]) language=saved}catch(_){}
function tr(key,args={}){
  const value=(messages[language]&&messages[language][key])||messages.en[key]||key;
  return value.replace(/\{(\w+)\}/g,(_,name)=>args[name]===undefined?'':args[name]);
}
function setStatus(title,message,type='',args={}){
  statusState={title,message,type,args};
  const el=$('#status');el.className='status '+type;
  el.querySelector('strong').textContent=tr(title,args);
  el.querySelector('span').textContent=tr(message,args);
}
function renderBoardMeta(){
  $('#boardMeta').textContent=currentResult?tr('solvedMeta',currentResult):tr('waiting');
}
function renderResult(){
  if(!currentResult){$('#resultBar').hidden=true;return}
  $('#resultBar').hidden=false;
  $('#resultText').textContent=tr(currentResult.status==='multiple'?'resultMultiple':'resultUnique',currentResult);
}
function renderLanguage(){
  document.documentElement.lang=locales[language]||'zh-CN';
  document.title='Nonogram Studio · '+tr('appTitle');
  $('#languageSelect').value=language;
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=tr(el.dataset.i18n)});
  $('#languageSelect').setAttribute('aria-label',tr('languageLabel'));
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',tr(el.dataset.i18nAria)));
  rowsN.setAttribute('aria-label',tr('rowsLabel'));colsN.setAttribute('aria-label',tr('colsLabel'));
  rowsInput.setAttribute('aria-label',tr('rowsLabel'));colsInput.setAttribute('aria-label',tr('colsLabel'));
  setStatus(statusState.title,statusState.message,statusState.type,statusState.args);
  setImageStatus(imageStatusState.key,imageStatusState.args,imageStatusState.type);
  renderBoardMeta();renderResult();
  const grid=$('.grid');
  if(grid){
    const columnCount=currentResult?.cols||Number(colsN.value)||1;
    grid.setAttribute('aria-label',tr('boardTitle'));
    grid.querySelectorAll('.cell').forEach((cell,index)=>{
      const row=Math.floor(index/columnCount)+1, column=index%columnCount+1;
      cell.setAttribute('aria-label',row+', '+column+': '+tr(cell.classList.contains('filled')?'legendFill':'legendEmpty'));
    });
  }
  const heading=$('#boardHost h2'), paragraph=$('#boardHost p');
  if(!currentResult&&heading){heading.textContent=tr(emptyState.title);paragraph.textContent=tr(emptyState.message)}
}
function syncSize(){
  const r=Math.max(1,Math.min(120,Number(rowsN.value)||1)), c=Math.max(1,Math.min(120,Number(colsN.value)||1));
  rowsN.value=r;colsN.value=c;$('#sizeText').textContent=r+' × '+c;
}
function invalid(key,args={}){const error=new Error(key);error.key=key;error.args=args;return error}
function setImageStatus(key,args={},type=''){imageStatusState={key,args,type};imageStatus.className='import-status '+type;imageStatus.textContent=key?tr(key,args):''}
function applyRecognizedClues(result){
  const rows=result.rows||[],cols=result.cols||[];
  applyingRecognized=true;rowsN.value=Math.max(1,Math.min(120,rows.length||1));colsN.value=Math.max(1,Math.min(120,cols.length||1));
  rowsInput.value=rows.map(line=>(line||[]).join(' ')).join('\n');colsInput.value=cols.map(line=>(line||[]).join(' ')).join('\n');syncSize();
  applyingRecognized=false;
}
function parseClues(text,count){
  const lines=text.replace(/\r/g,'').split('\n');
  if(lines.length>count&&lines.slice(count).some(line=>line.trim())) throw invalid('tooManyClues',{n:count});
  return Array.from({length:count},(_,index)=>{
    const line=(lines[index]||'').trim();if(!line)return[];
    const values=line.split(/[\s,，、]+/).filter(Boolean).map(Number);
    if(values.some(value=>!Number.isInteger(value)||value<1)) throw invalid('cluePositive');
    return values;
  });
}
function resetBoard(title='emptyTitle',message='emptyText'){
  currentResult=null;lastGrid=[];emptyState={title,message};
  const host=$('#boardHost');host.className='empty-state';host.replaceChildren();
  const wrap=document.createElement('div'),orb=document.createElement('div'),heading=document.createElement('h2'),paragraph=document.createElement('p');
  orb.className='orb';orb.setAttribute('aria-hidden','true');orb.textContent='✦';
  heading.textContent=tr(title);paragraph.textContent=tr(message);wrap.append(orb,heading,paragraph);host.append(wrap);
  renderBoardMeta();renderResult();
}
function setSample(){
  recognizedImage=null;importedImageFile=null;
  rowsN.value=10;colsN.value=10;
  rowsInput.value=['2 2','8','10','10','8','6','4','2','',''].join('\n');
  colsInput.value=['2','4','6','7','7','7','7','6','4','2'].join('\n');
  syncSize();setStatus('sampleLoaded','sampleHint');
}
function buildBoard(rows,cols,grid){
  const host=$('#boardHost');host.className='board-wrap';host.replaceChildren();
  const shell=document.createElement('div');shell.className='board-shell';
  const corner=document.createElement('div');corner.className='corner';shell.append(corner);
  const columnClues=document.createElement('div');columnClues.className='col-clues';columnClues.style.gridTemplateColumns='repeat('+cols+',var(--cell))';
  for(let c=0;c<cols;c++){const clue=document.createElement('div');clue.className='col-clue';for(const number of colsData[c]||[]){const span=document.createElement('span');span.textContent=number;clue.append(span)}columnClues.append(clue)}shell.append(columnClues);
  const rowClues=document.createElement('div');rowClues.className='row-clues';rowClues.style.gridTemplateRows='repeat('+rows+',var(--cell))';
  for(let r=0;r<rows;r++){const clue=document.createElement('div');clue.className='row-clue';clue.textContent=rowsData[r].join(' ')||'·';rowClues.append(clue)}shell.append(rowClues);
  const gridElement=document.createElement('div');gridElement.className='grid';gridElement.style.gridTemplateColumns='repeat('+cols+',var(--cell))';gridElement.setAttribute('role','grid');gridElement.setAttribute('aria-label',tr('boardTitle'));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const cell=document.createElement('div');const filled=Boolean(grid[r][c]);
    cell.className='cell'+(filled?' filled':'')+(c%5===4&&c<cols-1?' major-v':'')+(r%5===4&&r<rows-1?' major-h':'');
    cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',(r+1)+', '+(c+1)+': '+tr(filled?'legendFill':'legendEmpty'));
    cell.style.animationDelay=Math.min((r*cols+c)*3,600)+'ms';if(filled)cell.classList.add('animate');gridElement.append(cell);
  }
  shell.append(gridElement);host.append(shell);renderBoardMeta();
}
const serverErrors={totals_mismatch:['unsat','totalMismatch'],clue_out_of_range:['unsat','outOfRange'],no_solution:['unsat','noSolution'],patterns_limit:['hard','tooManyPatterns'],time_limit:['hard','timeLimit'],node_limit:['hard','nodeLimit'],invalid_dimensions:['badInput','invalidDimensions'],dimension_limit:['badInput','dimensionLimit'],invalid_clue_format:['badInput','invalidFormat']};
async function solve(){
  syncSize();let rowClues,columnClues;
  try{rowClues=parseClues(rowsInput.value,Number(rowsN.value));columnClues=parseClues(colsInput.value,Number(colsN.value))}
  catch(error){resetBoard('adjustTitle','adjustText');setStatus('badInput',error.key||'invalidFormat','error',error.args||{});return}
  const rowTooLong=rowClues.some(clues=>clues.length&&clues.reduce((a,b)=>a+b,0)+clues.length-1>Number(colsN.value));
  const colTooLong=columnClues.some(clues=>clues.length&&clues.reduce((a,b)=>a+b,0)+clues.length-1>Number(rowsN.value));
  if(rowTooLong||colTooLong){resetBoard('adjustTitle','adjustText');setStatus('badInput','lineOverrun','error');return}
  rowsData=rowClues;colsData=columnClues;resetBoard();setStatus('solving','solvingHint');document.body.classList.add('busy');$('#solveBtn').disabled=true;
  await new Promise(resolve=>setTimeout(resolve,120));
  try{
    const response=await fetch('/api/solve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:rowsData,cols:colsData})});
    const result=await response.json();
    if(result.status==='invalid'||result.status==='unsat'||result.status==='limit'||!response.ok){
      const pair=serverErrors[result.code]||['badInput','invalidFormat'];resetBoard('adjustTitle','adjustText');setStatus(pair[0],pair[1],'error');return;
    }
    lastGrid=result.grid;currentResult={status:result.status,rows:result.dimensions.rows,cols:result.dimensions.cols,count:result.count};
    buildBoard(result.dimensions.rows,result.dimensions.cols,result.grid);renderResult();
    setStatus(result.status==='multiple'?'multiple':'solved',result.status==='multiple'?'multipleHint':'uniqueHint','ok',{count:result.count});
    return result;
  }catch(_){resetBoard('adjustTitle','adjustText');setStatus('badInput','serviceError','error')}
  finally{document.body.classList.remove('busy');$('#solveBtn').disabled=false}
}
function buildMouseOperations(){
  if(!recognizedImage||!lastGrid.length)return [];
  const h=recognizedImage.gridLines.horizontal,v=recognizedImage.gridLines.vertical,scale=Number($('#imageScale').value)||1,ox=Number($('#originX').value)||0,oy=Number($('#originY').value)||0,markEmpty=$('#markEmpty').checked,operations=[];
  for(let r=0;r<lastGrid.length;r++)for(let c=0;c<lastGrid[r].length;c++){
    const filled=Boolean(lastGrid[r][c]);if(!filled&&!markEmpty)continue;
    operations.push({x:Math.round(ox+((v[c]+v[c+1])/2)*scale),y:Math.round(oy+((h[r]+h[r+1])/2)*scale),button:filled?'left':'right',row:r+1,col:c+1});
  }
  return operations;
}
function mouseScript(operations){
  return `// Nonogram Studio generated coordinates\nconst operations=${JSON.stringify(operations)};\nfor (const op of operations) {\n  await page.mouse.click(op.x, op.y, {button: op.button});\n  await page.waitForTimeout(35);\n}`;
}
async function runMouseFill(){
  if(!lastGrid.length){setImageStatus('mouseNoResult','', 'error');return}
  if(recognizedImage&&recognizedImage.confidence<.72&&!$('#cluesReviewed').checked){setImageStatus('imageLowConfidence',{confidence:Math.round(recognizedImage.confidence*100)},'error');return}
  const operations=buildMouseOperations();if(!operations.length){setImageStatus('mouseNoResult','', 'error');return}
  const confirmed=$('#mouseConfirm').checked;
  if(recognizedImage&&!$('#cluesReviewed').checked){setImageStatus('mouseBlocked','', 'error');return}
  if(!confirmed){setImageStatus('mouseDry',{count:operations.length},'');return}
  try{
    const response=await fetch('/api/mouse-fill',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operations,confirm:true})});
    const result=await response.json();if(!response.ok||result.error)throw new Error(result.error||'request_failed');setImageStatus('mouseDone',{count:result.count},'ok');
  }catch(error){setImageStatus('mouseError',{message:error.message||'request_failed'},'error')}
}
async function copyMouseScript(){
  const operations=buildMouseOperations();if(!operations.length){setImageStatus('mouseNoResult','', 'error');return}
  try{await navigator.clipboard.writeText(mouseScript(operations));setImageStatus('mouseScriptReady',{},'ok')}catch(_){setImageStatus('mouseError',{message:tr('copyFailedHint')},'error')}
}
window.NONOGRAM_IMPORT={setClues:applyRecognizedClues,solve,getGrid:()=>lastGrid,getImage:()=>recognizedImage};
$('#languageSelect').addEventListener('change',event=>{language=messages[event.target.value]?event.target.value:'zh';try{localStorage.setItem('nonogram-language',language)}catch(_){}renderLanguage()});
$('#sampleBtn').addEventListener('click',setSample);$('#solveBtn').addEventListener('click',solve);
$('#clearBtn').addEventListener('click',()=>{recognizedImage=null;importedImageFile=null;resetBoard('cleared','clearedHint');setStatus('ready','readyHint')});
$('#copyBtn').addEventListener('click',async()=>{
  const text=lastGrid.map(row=>row.map(cell=>cell?'■':'·').join(' ')).join('\n');
  try{await navigator.clipboard.writeText(text);setStatus('copied','copied','ok')}catch(_){setStatus('copyFailed','copyFailedHint','error')}
});
rowsN.addEventListener('input',syncSize);colsN.addEventListener('input',syncSize);
rowsInput.addEventListener('input',()=>{if(!applyingRecognized)$('#cluesReviewed').checked=false});colsInput.addEventListener('input',()=>{if(!applyingRecognized)$('#cluesReviewed').checked=false});
function acceptImageFile(file){
  if(!file||!String(file.type||'').startsWith('image/'))return false;
  importedImageFile=file;recognizedImage=null;$('#cluesReviewed').checked=false;$('#mouseConfirm').checked=false;
  if(recognizedImageUrl)URL.revokeObjectURL(recognizedImageUrl);
  recognizedImageUrl=URL.createObjectURL(file);imagePreviewImg.src=recognizedImageUrl;imagePreview.hidden=false;setImageStatus('imageReady');
  return true;
}
imageInput.addEventListener('change',()=>{acceptImageFile(imageInput.files&&imageInput.files[0])});
document.addEventListener('paste',event=>{
  const items=Array.from(event.clipboardData?.items||[]);
  const item=items.find(entry=>entry.kind==='file'&&String(entry.type||'').startsWith('image/'));
  if(!item)return;
  const target=event.target;
  const isTextInput=target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target?.isContentEditable;
  if(isTextInput&&!event.ctrlKey&&!event.metaKey)return;
  const file=item.getAsFile();
  if(!file||!acceptImageFile(file))return;
  event.preventDefault();
});
analyzeImageBtn.addEventListener('click',async()=>{
  const file=importedImageFile;if(!file){setImageStatus('imageNoGrid',{},'error');return}
  analyzeImageBtn.disabled=true;setImageStatus('imageWorking');
  try{
    const loaded=await window.NONOGRAM_IMAGE.loadFile(file);recognizedImage=loaded.result;applyRecognizedClues(recognizedImage);
    const confidence=Math.round((recognizedImage.confidence||0)*100);const result=await solve();
    if(!result||!['unique','multiple'].includes(result.status)){setImageStatus(confidence<72?'imageLowConfidence':'imageSolveFailed',{rows:recognizedImage.dimensions.rows,cols:recognizedImage.dimensions.cols,confidence},'error');}
    else{const key=confidence<72?'imageLowConfidence':'imageSuccess';setImageStatus(key,{rows:recognizedImage.dimensions.rows,cols:recognizedImage.dimensions.cols,confidence},confidence<72?'':'ok');}
  }catch(error){recognizedImage=null;setImageStatus(error.message==='clues_not_found'?'imageCluesNotFound':'imageNoGrid',{},'error')}
  finally{analyzeImageBtn.disabled=false}
});
$('#mouseFillBtn').addEventListener('click',runMouseFill);$('#copyMouseScriptBtn').addEventListener('click',copyMouseScript);
renderLanguage();setStatus('ready','readyHint');setSample();
})();
