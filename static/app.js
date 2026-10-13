(function(){
'use strict';
const messages=window.NONOGRAM_MESSAGES, locales=window.NONOGRAM_LOCALES;
const $=selector=>document.querySelector(selector);
const rowsN=$('#rowsN'), colsN=$('#colsN'), rowsInput=$('#rowsInput'), colsInput=$('#colsInput');
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
  rowsN.setAttribute('aria-label',tr('rowsLabel'));colsN.setAttribute('aria-label',tr('colsLabel'));
  rowsInput.setAttribute('aria-label',tr('rowsLabel'));colsInput.setAttribute('aria-label',tr('colsLabel'));
  setStatus(statusState.title,statusState.message,statusState.type,statusState.args);
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
  }catch(_){resetBoard('adjustTitle','adjustText');setStatus('badInput','serviceError','error')}
  finally{document.body.classList.remove('busy');$('#solveBtn').disabled=false}
}
$('#languageSelect').addEventListener('change',event=>{language=messages[event.target.value]?event.target.value:'zh';try{localStorage.setItem('nonogram-language',language)}catch(_){}renderLanguage()});
$('#sampleBtn').addEventListener('click',setSample);$('#solveBtn').addEventListener('click',solve);
$('#clearBtn').addEventListener('click',()=>{resetBoard('cleared','clearedHint');setStatus('ready','readyHint')});
$('#copyBtn').addEventListener('click',async()=>{
  const text=lastGrid.map(row=>row.map(cell=>cell?'■':'·').join(' ')).join('\n');
  try{await navigator.clipboard.writeText(text);setStatus('copied','copied','ok')}catch(_){setStatus('copyFailed','copyFailedHint','error')}
});
rowsN.addEventListener('input',syncSize);colsN.addEventListener('input',syncSize);
renderLanguage();setStatus('ready','readyHint');setSample();
})();
