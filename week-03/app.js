"use strict";
const byId = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('.lesson')];
const navLinks = [...document.querySelectorAll('.nav a')];
const languageButtons = [...document.querySelectorAll('[data-language]')];
const staticText = [...document.querySelectorAll('[data-i18n]')].map(element => ({element, english:element.innerHTML, key:element.innerHTML.replace(/\s+/g,' ').trim()}));
const messages = new Map();
const traces = new Map();
let language = 'en';
function say(id, en, tr, kind) {
  messages.set(id, {en,tr});
  byId(id).textContent = language === 'tr' ? tr : en;
  if (kind !== undefined) byId(id).className = 'feedback' + (kind ? ' '+kind : '');
}
function changed(id) { say(id,'Inputs changed. Predict the result, then run the example.','Girdiler değişti. Sonucu tahmin edin ve örneği çalıştırın.',''); }
function setCode(id, source) { byId(id).querySelector('code').textContent = source; }
function integer(id, optional=false) {
  const input=byId(id);
  if (optional && input.value === '') return null;
  const value=Number(input.value);
  return input.value !== '' && input.checkValidity() && Number.isSafeInteger(value) ? value : undefined;
}
function repr(value) {
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) return '['+value.map(repr).join(', ')+']';
  if (value instanceof Map) return '{'+[...value].map(([key,item])=>repr(key)+': '+repr(item)).join(', ')+'}';
  if (typeof value !== 'string') return String(value);
  const quote=value.includes("'") && !value.includes('"') ? '"' : "'";
  const escapes={'\\':'\\\\','\n':'\\n','\r':'\\r','\t':'\\t'};
  return quote+Array.from(value).map(char=>{
    if (char===quote) return '\\'+char;
    if (Object.hasOwn(escapes,char)) return escapes[char];
    if (char!==' ' && /[\p{C}\p{Z}]/u.test(char)) {
      const point=char.codePointAt(0);
      return point<=255 ? '\\x'+point.toString(16).padStart(2,'0') : point<=65535 ? '\\u'+point.toString(16).padStart(4,'0') : '\\U'+point.toString(16).padStart(8,'0');
    }
    return char;
  }).join('')+quote;
}
function sequence(id, values, selected=[]) {
  const container=byId(id);
  container.replaceChildren();
  values.forEach((value,index)=>{
    const cell=document.createElement('div'); cell.className='sequence-cell'+(selected.includes(index)?' selected':'');
    const top=document.createElement('small'), body=document.createElement('code'), bottom=document.createElement('small');
    top.textContent=index; body.textContent=repr(value); bottom.textContent=index-values.length;
    cell.append(top,body,bottom); container.append(cell);
  });
}
function setLanguage(value) {
  language=value==='tr'?'tr':'en';
  document.documentElement.lang=language;
  staticText.forEach(({element,english,key})=>element.innerHTML=language==='tr' ? turkishTranslations[key] ?? english : english);
  messages.forEach(({en,tr},id)=>byId(id).textContent=language==='tr'?tr:en);
  languageButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  document.querySelector('.nav').setAttribute('aria-label',language==='tr'?'Ders bölümleri':'Lesson sections');
  byId('string-cells').setAttribute('aria-label',language==='tr'?'Karakter indeksleri':'Character indexes');
  document.querySelector('meta[name=description]').content=language==='tr'?'Hafta 3: kod ve etkileşimli örneklerle Python metinleri, listeler, demetler, sözlükler, kümeler ve referanslar.':'Week 3: Python strings, lists, tuples, dictionaries, sets, and references through code and interactive examples.';
  try { localStorage.setItem('algorithm101-language',language); } catch { /* Controls also work without storage. */ }
}
function showSection(id, focus=false) {
  let index=sections.findIndex(section=>section.id===id);
  if(index<0) index=0;
  sections.forEach((section,i)=>section.classList.toggle('active',i===index));
  navLinks.forEach((link,i)=>{if(i===index)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  byId('previous-section').disabled=index===0; byId('next-section').disabled=index===sections.length-1;
  say('section-position',`Section ${index+1} of ${sections.length}`,`Bölüm ${index+1} / ${sections.length}`);
  traces.forEach(trace=>trace.pause());
  navLinks[index].scrollIntoView({block:'nearest',inline:'nearest'});
  if(focus){ window.scrollTo(0,0); sections[index].querySelector('h1,h2').focus({preventScroll:true}); }
}
window.addEventListener('hashchange',()=>showSection(location.hash.slice(1),true));
navLinks.concat([...document.querySelectorAll('.route-card')]).forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault(); const id=link.getAttribute('href').slice(1);
  if(location.hash==='#'+id)showSection(id,true);else location.hash=id;
}));
byId('previous-section').addEventListener('click',()=>{const i=sections.findIndex(section=>section.classList.contains('active'));if(i>0)location.hash=sections[i-1].id;});
byId('next-section').addEventListener('click',()=>{const i=sections.findIndex(section=>section.classList.contains('active'));if(i<sections.length-1)location.hash=sections[i+1].id;});
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();byId('main').focus();byId('main').scrollIntoView({block:'start'});});

// These guided previews implement the specific Python statements shown in the lesson.
// No arbitrary source code is evaluated in the browser.
function objects(id, items) {
  const container=byId(id); container.replaceChildren();
  items.forEach(item=>{
    const row=document.createElement('div'); row.className='object-row';
    const names=document.createElement('code'); names.className='object-names'; names.textContent=item.names.join(' / ');
    const arrow=document.createElement('span'); arrow.className='object-arrow'; arrow.textContent='→'; arrow.setAttribute('aria-hidden','true');
    const box=document.createElement('div'); box.className='object-box';
    const label=document.createElement('small'); label.textContent=item.id;
    const value=document.createElement('code'); value.textContent=item.value;
    box.append(label,value); row.append(names,arrow,box); container.append(row);
  });
}
function mountTrace(id, build, inputs=[]) {
  let frames=[], index=0, timer=null;
  function pause(){clearInterval(timer);timer=null;say(id+'-run','Run','Çalıştır');}
  function reset(){
    pause();index=0;frames=build();
    byId(id+'-memory').replaceChildren();byId(id+'-output').textContent='—';
    byId(id+'-step').disabled=!frames;byId(id+'-run').disabled=!frames;
    if(!frames){say(id+'-feedback','Enter whole numbers within the displayed limits.','Gösterilen sınırlar içinde tam sayılar girin.','error');return;}
    const code=byId(id+'-code');code.replaceChildren();
    frames.forEach(frame=>{const line=document.createElement('li');line.textContent=frame.code;code.append(line);});
    say(id+'-feedback','Step through the code and follow the values.','Kodda ilerleyerek değerlerin değişimini izleyin.','');
  }
  function step(){
    if(!frames || index>=frames.length)return false;
    const frame=frames[index];
    [...byId(id+'-code').children].forEach((line,i)=>{line.classList.toggle('current',i===index);line.classList.toggle('visited',i<index);});
    objects(id+'-memory',frame.objects);
    byId(id+'-output').textContent=frame.output.length?frame.output.join('\n'):'—';
    say(id+'-feedback',frame.note[0],frame.note[1],index===frames.length-1?'success':'');
    index++;
    if(index===frames.length){pause();byId(id+'-step').disabled=true;byId(id+'-run').disabled=true;return false;}
    return true;
  }
  byId(id+'-step').addEventListener('click',()=>{pause();step();});
  byId(id+'-run').addEventListener('click',()=>{if(timer){pause();return;}if(!step())return;say(id+'-run','Pause','Duraklat');timer=setInterval(()=>{if(!step())pause();},850);});
  byId(id+'-reset').addEventListener('click',reset);
  inputs.forEach(input=>byId(input).addEventListener('input',reset));
  traces.set(id,{pause,reset});reset();
}
const object=(names,id,value)=>({names,id,value});
const frame=(code,items,output,en,tr)=>({code,objects:items,output,note:[en,tr]});
mountTrace('recap',()=>{
  const score=object(['score'],'int','72'), first=object(['first'],'int','72');
  const list=value=>object(['scores'],'list',repr(value));
  return [
    frame('score = 72',[score],[],'score refers to an integer.','score bir tam sayıya referans verir.'),
    frame('scores = [72, 85, 91]',[score,list([72,85,91])],[],'scores refers to a list with three items.','scores üç öğeli bir listeye referans verir.'),
    frame('first = scores[0]',[score,list([72,85,91]),first],[],'Read index 0 and assign the integer 72 to first.','0 indeksini okuyup 72 tam sayısını first değişkenine atayın.'),
    frame('scores[0] = 99',[score,list([99,85,91]),first],[],'Replace the first list item; first still refers to 72.','Listenin ilk öğesi değişir; first hâlâ 72 değerine referans verir.'),
    frame('print(first)',[score,list([99,85,91]),first],['72'],'Print the saved integer.','Saklanan tam sayıyı yazdırın.'),
    frame('print(scores)',[score,list([99,85,91]),first],['72','[99, 85, 91]'],'Print the changed list.','Değişmiş listeyi yazdırın.')
  ];
});

// Python slices clamp their endpoints. An omitted negative stop differs from explicit -1.
function sliceIndexes(length,start,stop,step) {
  const clamp=(v,low,high)=>Math.min(high,Math.max(low,v));
  const endpoint=v=>v<0?v+length:v;
  let first,last;
  if(step>0){first=start===null?0:clamp(endpoint(start),0,length);last=stop===null?length:clamp(endpoint(stop),0,length);}
  else{first=start===null?length-1:clamp(endpoint(start),-1,length-1);last=stop===null?-1:clamp(endpoint(stop),-1,length-1);}
  const indexes=[];
  for(let i=first;step>0?i<last:i>last;i+=step)indexes.push(i);
  return indexes;
}
function stringSource(){
  const mode=byId('string-mode').value, text=byId('string-text').value;
  const number=id=>byId(id).value===''?'':String(Number(byId(id).value));
  const expression=mode==='index'?`text[${number('string-index') || '0'}]`:mode==='member'?`${repr(byId('string-part').value)} in text`:`text[${number('slice-start')}:${number('slice-stop')}:${number('slice-step')}]`;
  return `text = ${repr(text)}\nresult = ${expression}\nprint(${mode==='member'?'result':'repr(result)'})`;
}
function resetStrings(){
  const mode=byId('string-mode').value;
  byId('string-index').closest('label').hidden=mode!=='index';
  ['slice-start','slice-stop','slice-step'].forEach(id=>byId(id).closest('label').hidden=mode!=='slice');
  byId('string-part').closest('label').hidden=mode!=='member';
  setCode('string-code',stringSource());
  sequence('string-cells',Array.from(byId('string-text').value));
  byId('string-output').textContent='—';byId('string-type').textContent='—';changed('string-feedback');
}
['string-text','string-mode','string-index','slice-start','slice-stop','slice-step','string-part'].forEach(id=>byId(id).addEventListener('input',resetStrings));
byId('string-run').addEventListener('click',()=>{
  const chars=Array.from(byId('string-text').value),mode=byId('string-mode').value;
  let result,selected=[];
  if(mode==='index'){
    let index=integer('string-index');
    if(index===undefined){say('string-feedback','Enter an integer index from −99 to 99.','−99 ile 99 arasında tam sayı indeks girin.','error');return;}
    if(index<0)index+=chars.length;
    if(index<0||index>=chars.length){byId('string-output').textContent='IndexError: string index out of range';say('string-feedback','This position does not exist. Slicing outside the range behaves differently.','Bu konum yok. Aralık dışına taşan dilimleme farklı davranır.','error');return;}
    selected=[index];result=chars[index];
  }else if(mode==='slice'){
    const start=integer('slice-start',true),stop=integer('slice-stop',true),rawStep=integer('slice-step',true),step=rawStep===null?1:rawStep;
    if([start,stop,step].includes(undefined)){say('string-feedback','Use whole-number endpoints and a step from −20 to 20, or leave them blank.','Tam sayı uç değerleri ve −20 ile 20 arasında adım kullanın veya alanları boş bırakın.','error');return;}
    if(step===0){byId('string-output').textContent='ValueError: slice step cannot be zero';say('string-feedback','A slice step cannot be zero.','Dilimleme adımı sıfır olamaz.','error');return;}
    selected=sliceIndexes(chars.length,start,stop,step);result=selected.map(i=>chars[i]).join('');
  }else{result=byId('string-text').value.includes(byId('string-part').value);}
  sequence('string-cells',chars,selected);byId('string-output').textContent=repr(result);byId('string-type').textContent=typeof result==='boolean'?'bool':'str';
  say('string-feedback',mode==='member'?'Membership checks a substring, including the empty string.':'The original text stays unchanged. The selected value is returned.',mode==='member'?'Üyelik, boş metin dahil bir alt metni arar.':'Özgün metin değişmez. Seçilen değer döndürülür.','success');
});
function slicePreset(step){byId('string-mode').value='slice';byId('slice-start').value='';byId('slice-stop').value='';byId('slice-step').value=step;resetStrings();}
byId('slice-reverse').addEventListener('click',()=>slicePreset(-1));byId('slice-all').addEventListener('click',()=>slicePreset(1));resetStrings();

const scenarios={
  scores:{answer:'list',prompt:['Store exam scores in their original order, including duplicates.','Sınav puanlarını tekrar edenler dahil özgün sırasıyla saklayın.'],code:'scores = [80, 95, 80]'},
  point:{answer:'tuple',prompt:['Represent a coordinate pair whose positions should not be reassigned.','Konumları yeniden atanmayacak bir koordinat çiftini temsil edin.'],code:'point = (3, 5)'},
  record:{answer:'dict',prompt:['Look up a student’s details using field names.','Öğrenci bilgilerine alan adlarıyla erişin.'],code:'student = {"name": "Ada", "score": 90}'},
  unique:{answer:'set',prompt:['Keep unique skill names and compare membership between groups.','Benzersiz beceri adlarını saklayıp gruplar arasındaki üyeliği karşılaştırın.'],code:'skills = {"Python", "C"}'}
};
byId('choose-scenario').addEventListener('input',()=>{const s=scenarios[byId('choose-scenario').value];say('choose-prompt',...s.prompt);setCode('choose-code','# Choose a collection for this requirement.');document.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed','false'));say('choose-feedback','Choose a type and explain your choice.','Bir tür seçin ve seçiminizi açıklayın.','');});
document.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
  const s=scenarios[byId('choose-scenario').value],correct=button.dataset.choice===s.answer;
  document.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  setCode('choose-code',correct?s.code:'# Consider positions, named keys, or unique membership.');
  say('choose-feedback',correct?`${s.answer} fits this requirement.`:'Reconsider whether the task needs positions, named keys, or unique membership.',correct?`${s.answer} bu gereksinime uygundur.`:'Görevin konum, adlandırılmış anahtar veya benzersiz üyelik gerektirip gerektirmediğini düşünün.',correct?'success':'error');
}));

let listValues=[72,85,72], listHistory=['scores = [72, 85, 72]'],listSteps=0;
function listStatement(){
  const op=byId('list-operation').value,v=Number(byId('list-value').value),extra=Number(byId('list-extra').value),i=Number(byId('list-index').value);
  if(op==='set')return `scores[${i}] = ${v}`;
  if(op==='extend')return `result = scores.extend([${v}, ${extra}])`;
  if(op==='insert')return `result = scores.insert(${i}, ${v})`;
  return `result = scores.${op}(${['sort','reverse'].includes(op)?'':op==='pop'?i:v})`;
}
function previewList(){
  const op=byId('list-operation').value;
  byId('list-value').closest('label').hidden=!['append','extend','insert','set','remove'].includes(op);
  byId('list-extra').closest('label').hidden=op!=='extend';byId('list-index').closest('label').hidden=!['insert','set','pop'].includes(op);
  setCode('list-code',`scores = ${repr(listValues)}\n${listStatement()}\n${op==='set'?'':'print(result)\n'}print(scores)`);
  sequence('list-cells',listValues);byId('list-result').textContent='—';byId('list-output').textContent='—';changed('list-feedback');
}
['list-operation','list-value','list-extra','list-index'].forEach(id=>byId(id).addEventListener('input',previewList));
byId('list-reset').addEventListener('click',()=>{listValues=[72,85,72];listHistory=['scores = [72, 85, 72]'];listSteps=0;setCode('list-history',listHistory.join('\n'));previewList();});
byId('list-apply').addEventListener('click',()=>{
  const op=byId('list-operation').value,v=integer('list-value'),extra=integer('list-extra'),index=integer('list-index');
  const needsValue=['append','extend','insert','set','remove'].includes(op),needsIndex=['insert','set','pop'].includes(op);
  if((needsValue&&v===undefined)||(op==='extend'&&extra===undefined)||(needsIndex&&index===undefined)){say('list-feedback','Enter whole numbers within the displayed limits.','Gösterilen sınırlar içinde tam sayılar girin.','error');return;}
  if(listSteps>=20 || listValues.length+(op==='extend'?2:['append','insert'].includes(op)?1:0)>12){say('list-feedback','Preview limit reached. Reset to start a new program.','Önizleme sınırına ulaşıldı. Yeni program için sıfırlayın.','error');return;}
  let at=index<0?listValues.length+index:index,result=null,error='';
  const before=repr(listValues),statement=listStatement();
  if(op==='append')listValues.push(v);
  if(op==='extend')listValues.push(v,extra);
  if(op==='insert')listValues.splice(Math.min(listValues.length,Math.max(0,at)),0,v);
  if(op==='set'||op==='pop'){
    if(at<0||at>=listValues.length)error='IndexError';
    else if(op==='set')listValues[at]=v;else result=listValues.splice(at,1)[0];
  }
  if(op==='remove'){at=listValues.indexOf(v);if(at<0)error='ValueError';else listValues.splice(at,1);}
  if(op==='sort')listValues.sort((a,b)=>a-b);
  if(op==='reverse')listValues.reverse();
  setCode('list-code',`scores = ${before}\n${statement}\n${op==='set'?'':'print(result)\n'}print(scores)`);
  sequence('list-cells',listValues);
  if(error){byId('list-result').textContent=error;byId('list-output').textContent='—';say('list-feedback',`${error}: the operation stops before print(). The list is unchanged.`,`${error}: işlem print() öncesinde durur. Liste değişmez.`,'error');return;}
  byId('list-result').textContent=op==='set'?'—':repr(result);byId('list-output').textContent=(op==='set'?'':repr(result)+'\n')+repr(listValues);
  listSteps++;listHistory.push(statement,...(op==='set'?[]:['print(result)']),'print(scores)');setCode('list-history',listHistory.join('\n'));
  say('list-feedback',op==='pop'?'pop returns the removed item. The visual shows the list after removal.':op==='set'?'Assignment changes an item; it is a statement, not a returned value.':'The method changes the list and returns None.',op==='pop'?'pop çıkarılan öğeyi döndürür. Görsel, çıkarma sonrasındaki listeyi gösterir.':op==='set'?'Atama bir öğeyi değiştirir; değer döndüren ifade değil, bir yönergedir.':'Metot listeyi değiştirir ve None döndürür.','success');
});previewList();

mountTrace('tuple',()=>{
  const x=integer('tuple-x'),y=integer('tuple-y');if(x===undefined||y===undefined)return null;
  const point=object(['point'],'tuple',`(${x}, ${y})`),items=[point,object(['x'],'int',String(x)),object(['y'],'int',String(y))];
  return [frame(`point = (${x}, ${y})`,[point],[],'Create a tuple with two items.','İki öğeli bir demet oluşturun.'),frame('x, y = point',items,[],'Assign the first item to x and the second to y.','İlk öğeyi x, ikinci öğeyi y değişkenine atayın.'),frame('print(x)',items,[String(x)],'Print x.','x değerini yazdırın.'),frame('print(y)',items,[String(x),String(y)],'Print y. The tuple remains unchanged.','y değerini yazdırın. Demet değişmez.')];
},['tuple-x','tuple-y']);
const tupleExamples={group:['value = (5)\nprint(type(value).__name__)','int'],single:['value = (5,)\nprint(type(value).__name__)','tuple'],empty:['value = ()\nprint(type(value).__name__)','tuple'],pair:['value = (3, 5)\nprint(type(value).__name__)','tuple'],error:['point = (3, 5)\npoint[0] = 9\nprint(point)','TypeError'],unpack:['x, y, z = (3, 5)\nprint(x, y, z)','ValueError']};
byId('tuple-expression').addEventListener('input',()=>{setCode('tuple-check-code',tupleExamples[byId('tuple-expression').value][0]);byId('tuple-check-output').textContent='—';changed('tuple-check-feedback');});
byId('tuple-check').addEventListener('click',()=>{
  const [source,result]=tupleExamples[byId('tuple-expression').value];setCode('tuple-check-code',source);byId('tuple-check-output').textContent=result;
  say('tuple-check-feedback',result==='TypeError'?'A tuple does not support replacing an item.':result==='ValueError'?'Two items cannot fill three variables.':'A comma creates a nonempty tuple. Parentheses alone can just group an expression.',result==='TypeError'?'Demetin öğesi başka bir değerle değiştirilemez.':result==='ValueError'?'İki öğe, üç değişkeni dolduramaz.':'Boş olmayan demeti virgül oluşturur. Parantezler tek başına yalnızca ifadeyi gruplayabilir.',result.endsWith('Error')?'error':'success');
});

let record=new Map([['name','Ada'],['score',90]]);
function recordCells(){const container=byId('dict-cells');container.replaceChildren();record.forEach((value,key)=>{const cell=document.createElement('div'),k=document.createElement('code'),v=document.createElement('code');cell.className='dictionary-entry';k.textContent=repr(key);v.textContent=repr(value);cell.append(k,document.createTextNode(' → '),v);container.append(cell);});}
function dictValue(){return byId('dict-value-type').value==='str'?byId('dict-value').value:Number(byId('dict-value').value);}
function dictStatement(){
  const op=byId('dict-operation').value,key=repr(byId('dict-key').value);
  if(op==='set')return `student[${key}] = ${repr(dictValue())}`;
  if(op==='del')return `del student[${key}]`;
  const expression=op==='read'?`student[${key}]`:op==='get'?`student.get(${key}, "Not found")`:op==='in'?`${key} in student`:`list(student.${op}())`;
  return 'result = '+expression;
}
function previewDict(){
  const op=byId('dict-operation').value;
  byId('dict-key').closest('label').hidden=['keys','values','items'].includes(op);
  ['dict-value','dict-value-type'].forEach(id=>byId(id).closest('label').hidden=op!=='set');
  setCode('dict-code',`student = ${repr(record)}\n${dictStatement()}\nprint(${['set','del'].includes(op)?'student':'result'})`);
  recordCells();byId('dict-output').textContent='—';changed('dict-feedback');
}
['dict-operation','dict-key','dict-value','dict-value-type'].forEach(id=>byId(id).addEventListener('input',previewDict));
byId('dict-reset').addEventListener('click',()=>{record=new Map([['name','Ada'],['score',90]]);previewDict();});
byId('dict-apply').addEventListener('click',()=>{
  const op=byId('dict-operation').value,key=byId('dict-key').value,value=dictValue();
  if(op==='set'&&byId('dict-value-type').value==='int'&&(!/^[+-]?\d+$/.test(byId('dict-value').value)||!Number.isSafeInteger(value)||Math.abs(value)>9999)){say('dict-feedback','For int, enter a whole number from −9999 to 9999.','int için −9999 ile 9999 arasında bir tam sayı girin.','error');return;}
  if(op==='set'&&!record.has(key)&&record.size===8){say('dict-feedback','The preview holds up to 8 keys. Delete one or reset.','Önizleme en fazla 8 anahtar tutar. Birini silin veya sıfırlayın.','error');return;}
  setCode('dict-code',`student = ${repr(record)}\n${dictStatement()}\nprint(${['set','del'].includes(op)?'student':'result'})`);
  if(['read','del'].includes(op)&&!record.has(key)){byId('dict-output').textContent='KeyError: '+repr(key);say('dict-feedback','The key is absent. get() can return a default without inserting a key.','Anahtar yok. get(), anahtar eklemeden varsayılan değer döndürebilir.','error');return;}
  let result;
  if(op==='set'){record.set(key,value);result=repr(record);}
  if(op==='del'){record.delete(key);result=repr(record);}
  if(op==='read'||op==='get'){const v=record.has(key)?record.get(key):'Not found';result=typeof v==='string'?v:repr(v);}
  if(op==='in')result=repr(record.has(key));
  if(op==='keys')result=repr([...record.keys()]);
  if(op==='values')result=repr([...record.values()]);
  if(op==='items')result='['+[...record].map(([k,v])=>`(${repr(k)}, ${repr(v)})`).join(', ')+']';
  byId('dict-output').textContent=result;recordCells();
  say('dict-feedback','The output follows insertion order. Updating a key keeps its position; deleting and reinserting puts it last.','Çıktı ekleme sırasını izler. Anahtarı güncellemek konumunu korur; silip yeniden eklemek sona taşır.','success');
});previewDict();

function setInput(id){const text=byId(id).value.trim();if(!text)return [];const parts=text.split(',').map(part=>part.trim());return parts.length<=10&&parts.every(part=>/^[+-]?\d+$/.test(part)&&Math.abs(Number(part))<=99)?parts.map(Number):null;}
const setLiteral=values=>values.length?'{'+values.join(', ')+'}':'set()';
function setSource(){
  const a=setInput('set-a'),b=setInput('set-b'),v=integer('set-value'),op=byId('set-operation').value;
  if(!a||!b||(['add','discard','member'].includes(op)&&v===undefined))return null;
  const expr={union:'a | b',intersection:'a & b',difference:'a - b',symmetric:'a ^ b',add:`a.add(${v})`,discard:`a.discard(${v})`,member:`${v} in a`}[op];
  return `a = ${setLiteral(a)}\nb = ${setLiteral(b)}\nresult = ${expr}\n`+(['add','discard'].includes(op)?'print(result)\nprint(sorted(a))':op==='member'?'print(result)':'print(sorted(result))');
}
function showSetRegions(a,b,selected){
  const groups=[['set-only-a',[...a].filter(v=>!b.has(v))],['set-both',[...a].filter(v=>b.has(v))],['set-only-b',[...b].filter(v=>!a.has(v))]];
  groups.forEach(([id,values])=>{const container=byId(id);container.replaceChildren();values.sort((x,y)=>x-y).forEach(value=>{const cell=document.createElement('code');cell.textContent=value;cell.className='set-member'+(selected.has(value)?' selected':'');container.append(cell);});});
}
function previewSet(){const source=setSource(),op=byId('set-operation').value;byId('set-value').closest('label').hidden=!['add','discard','member'].includes(op);setCode('set-code',source||'# Enter valid whole numbers to build the example.');byId('set-output').textContent='—';showSetRegions(new Set(setInput('set-a')||[]),new Set(setInput('set-b')||[]),new Set());changed('set-feedback');}
['set-a','set-b','set-value','set-operation'].forEach(id=>byId(id).addEventListener('input',previewSet));
byId('set-run').addEventListener('click',()=>{
  const source=setSource();if(!source){say('set-feedback','Use up to 10 comma-separated whole numbers from −99 to 99, or leave a group empty.','Virgülle ayrılmış, −99 ile 99 arasında en fazla 10 tam sayı kullanın; grup boş da olabilir.','error');return;}
  const a=new Set(setInput('set-a')),b=new Set(setInput('set-b')),value=integer('set-value'),op=byId('set-operation').value;
  let result;
  if(op==='union')result=new Set([...a,...b]);
  if(op==='intersection')result=new Set([...a].filter(v=>b.has(v)));
  if(op==='difference')result=new Set([...a].filter(v=>!b.has(v)));
  if(op==='symmetric')result=new Set([...a,...b].filter(v=>a.has(v)!==b.has(v)));
  if(op==='add'){a.add(value);result=a;}
  if(op==='discard'){a.delete(value);result=a;}
  if(op==='member')result=new Set(a.has(value)?[value]:[]);
  setCode('set-code',source);showSetRegions(a,b,result);
  byId('set-output').textContent=op==='member'?repr(a.has(value)):(['add','discard'].includes(op)?'None\n':'')+repr([...result].sort((x,y)=>x-y));
  say('set-feedback',op==='member'?'Membership returns a Boolean. Duplicate inputs count as one member.':'Highlighted members form the result. Display order comes from sorted(), not from the set.',op==='member'?'Üyelik Boole değeri döndürür. Tekrar eden girdiler tek üye sayılır.':'Vurgulanan üyeler sonucu oluşturur. Gösterim sırası kümeden değil, sorted() işleminden gelir.','success');
});previewSet();

mountTrace('refs',()=>{
  const mode=byId('refs-mode').value;
  if(mode==='nested'){
    const outer=object(['groups'],'outer list A','[→ inner list C]'),copy=object(['backup'],'outer list B','[→ inner list C]');
    const inner=v=>object(['A[0] / B[0]'],'inner list C',repr(v));
    return [frame('groups = [[80, 90]]',[outer,object(['A[0]'],'inner list C','[80, 90]')],[],'The outer list refers to an inner list.','Dış liste bir iç listeye referans verir.'),frame('backup = groups.copy()',[outer,copy,inner([80,90])],[],'The outer lists are distinct; both refer to the same inner list.','Dış listeler farklıdır; ikisi de aynı iç listeye referans verir.'),frame('backup[0].append(100)',[outer,copy,inner([80,90,100])],[],'Change the shared inner list. Both paths see it.','Paylaşılan iç liste değişir. İki erişim yolu da değişikliği görür.'),frame('print(groups)',[outer,copy,inner([80,90,100])],['[[80, 90, 100]]'],'Print through groups.','groups üzerinden yazdırın.'),frame('print(groups is backup)',[outer,copy,inner([80,90,100])],['[[80, 90, 100]]','False'],'The outer lists are different objects.','Dış listeler farklı nesnelerdir.'),frame('print(groups[0] is backup[0])',[outer,copy,inner([80,90,100])],['[[80, 90, 100]]','False','True'],'The inner list is the same object.','İç liste aynı nesnedir.')];
  }
  const alias=mode==='alias',initial=object(['scores'],'list A','[80, 90]');
  const before=alias?[object(['scores','backup'],'list A','[80, 90]')]:[initial,object(['backup'],'list B','[80, 90]')];
  const after=alias?[object(['scores','backup'],'list A','[80, 90, 100]')]:[object(['scores'],'list A','[80, 90, 100]'),object(['backup'],'list B','[80, 90]')];
  const backup=alias?'[80, 90, 100]':'[80, 90]';
  return [frame('scores = [80, 90]',[initial],[],'Create the list.','Listeyi oluşturun.'),frame(alias?'backup = scores':'backup = scores.copy()',before,[],alias?'Both names refer to list A.':'copy() creates a distinct list B.',alias?'İki isim de A listesine referans verir.':'copy(), farklı bir B listesi oluşturur.'),frame('scores.append(100)',after,[],'Append to the object named by scores.','scores isminin referans verdiği nesneye ekleyin.'),frame('print(scores)',after,['[80, 90, 100]'],'Print scores.','scores değerini yazdırın.'),frame('print(backup)',after,['[80, 90, 100]',backup],alias?'backup reaches the same changed list.':'backup reaches the unchanged copy.',alias?'backup aynı değişmiş listeye erişir.':'backup değişmeyen kopyaya erişir.'),frame('print(scores is backup)',after,['[80, 90, 100]',backup,repr(alias)],'is compares object identity.','is, aynı nesne olup olmadığını karşılaştırır.')];
},['refs-mode']);

mountTrace('profile',()=>{
  const first=integer('profile-first'),second=integer('profile-second'),newScore=integer('profile-new');
  if([first,second,newScore].includes(undefined))return null;
  const scores=[first,second],all=[first,second,newScore],average=(first+second+newScore)/3;
  const view=(values,skills,includeAverage=false)=>[object(['student'],'dict',`{'name': 'Ada', 'scores': → list, 'skills': → set}`),object(['student["scores"]'],'list',repr(values)),object(['student["skills"]'],'set',skills),...(includeAverage?[object(['average'],'float',String(average)+(Number.isInteger(average)?'.0':''))]:[])];
  const initial=view(scores,"{'Python'}"),extended=view(all,"{'Python'}"),skilled=view(all,"{'Python', 'SQL'}"),complete=view(all,"{'Python', 'SQL'}",true);
  return [frame(`student = {"name": "Ada", "scores": [${first}, ${second}], "skills": {"Python"}}`,initial,[],'Create a record with a list and a set.','Liste ve küme içeren bir kayıt oluşturun.'),frame(`student["scores"].append(${newScore})`,extended,[],'Access the list by key, then append a score.','Listeye anahtarla erişip puan ekleyin.'),frame('student["skills"].add("SQL")',skilled,[],'Add one unique skill.','Benzersiz bir beceri ekleyin.'),frame('average = sum(student["scores"]) / len(student["scores"])',complete,[],'Use sum and len to calculate the mean.','Ortalamayı sum ve len ile hesaplayın.'),frame('print(student["name"])',complete,['Ada'],'Read the name by key.','Adı anahtarla okuyun.'),frame('print(student["scores"])',complete,['Ada',repr(all)],'Print the list in order.','Listeyi sırasıyla yazdırın.'),frame('print(sorted(student["skills"]))',complete,['Ada',repr(all),"['Python', 'SQL']"],'Sort the set members for predictable output.','Belirli sırada çıktı için küme üyelerini sıralayın.'),frame('print(f"Average: {average:.1f}")',complete,['Ada',repr(all),"['Python', 'SQL']",`Average: ${average.toFixed(1)}`],'Format the average with one decimal place.','Ortalamayı bir ondalık basamakla biçimlendirin.')];
},['profile-first','profile-second','profile-new']);

byId('quiz-check').addEventListener('click',()=>{
  const questions=[...document.querySelectorAll('.quiz-question')];let correct=0;
  questions.forEach(question=>{
    const selected=question.querySelector('input:checked'),answer=question.querySelector('.quiz-answer');answer.hidden=false;
    const ok=selected?.value===question.dataset.answer;if(ok)correct++;
    const en=selected?question.dataset.feedback:'Choose an answer first.',tr=selected?turkishTranslations[en]:'Önce bir yanıt seçin.';
    say(answer.id,(ok?'Correct. ':'')+en,(ok?'Doğru. ':'')+tr);answer.classList.toggle('correct',ok);
  });
  say('quiz-feedback',`${correct} of ${questions.length} correct. Review the feedback beside each program.`,`${questions.length} sorudan ${correct} doğru. Her programın yanındaki açıklamayı inceleyin.`,correct===questions.length?'success':'');
});
document.querySelectorAll('.quiz-question input').forEach(input=>input.addEventListener('change',()=>{const feedback=input.closest('fieldset').querySelector('.quiz-answer');feedback.hidden=true;messages.delete(feedback.id);say('quiz-feedback','Answers changed. Check them again.','Yanıtlar değişti. Yeniden kontrol edin.','');}));
languageButtons.forEach(button=>{button.addEventListener('click',()=>setLanguage(button.dataset.language));button.disabled=false;});
let savedLanguage='en';try{savedLanguage=localStorage.getItem('algorithm101-language')||'en';}catch{/* Default language. */}
setLanguage(savedLanguage);document.body.classList.add('enhanced');showSection(location.hash.slice(1));
