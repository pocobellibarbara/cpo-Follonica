// ══════════════════════════════════════
// SUPABASE
// ══════════════════════════════════════
const SB_URL='https://nxcjpeahugyiuazflcvf.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Y2pwZWFodWd5aXVhemZsY3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjkwMDYsImV4cCI6MjA5NDU0NTAwNn0.tK1_2Zbg1NiHrj1IAsfKTbPzzMH86rAIpi7RzT8vYqE';
const H={'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Prefer':'return=representation'};
const HP={'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Prefer':'return=minimal'};

async function sbGet(t,f=''){ const r=await fetch(`${SB_URL}/rest/v1/${t}?order=creato_il.asc${f}`,{headers:H}); if(!r.ok)throw new Error(await r.text()); return r.json(); }
async function sbInsert(t,d){ const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:'POST',headers:H,body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); return r.json(); }
async function sbUpdate(t,id,d){ const r=await fetch(`${SB_URL}/rest/v1/${t}?id=eq.${id}`,{method:'PATCH',headers:HP,body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); }
async function sbUpdateWhere(t,col,val,d){ const r=await fetch(`${SB_URL}/rest/v1/${t}?${col}=eq.${encodeURIComponent(val)}`,{method:'PATCH',headers:HP,body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); }
async function sbUpsert(t,d){ const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:'POST',headers:{...H,'Prefer':'resolution=merge-duplicates'},body:JSON.stringify(d)}); if(!r.ok)throw new Error(await r.text()); }
async function sbDelete(t,id){ const r=await fetch(`${SB_URL}/rest/v1/${t}?id=eq.${id}`,{method:'DELETE',headers:H}); if(!r.ok)throw new Error(await r.text()); }
async function sbDeleteAll(t){ const r=await fetch(`${SB_URL}/rest/v1/${t}?id=gt.0`,{method:'DELETE',headers:H}); if(!r.ok)throw new Error(await r.text()); }
async function sbDeleteBySrc(src){ const r=await fetch(`${SB_URL}/rest/v1/eventi?src=eq.${src}`,{method:'DELETE',headers:H}); if(!r.ok)throw new Error(await r.text()); }

// ══════════════════════════════════════
// PASSWORD E RUOLI
// ══════════════════════════════════════
const K_PA='cpo_pass_admin', K_PV='cpo_pass_viewer';
function getPA(){ return localStorage.getItem(K_PA)||'cpoAdmin2026'; }
function getPV(){ return localStorage.getItem(K_PV)||'cpo2026'; }

// ══════════════════════════════════════
// STATO
// ══════════════════════════════════════
let events=[], docs=[], currentFilter='tutti';
let loggedIn=false, currentRole=null, selectedRole='viewer';
let curM=new Date().getMonth()+1, curY=new Date().getFullYear();

// ══════════════════════════════════════
// NAVIGAZIONE
// ══════════════════════════════════════
function showPage(n,b){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+n).classList.add('active');
  if(b) b.classList.add('active');
  window.scrollTo(0,0);
}
function toggleLogin(){ loggedIn?showPage('member',null):(document.getElementById('modal').style.display='flex'); }
function closeModal(){ document.getElementById('modal').style.display='none'; document.getElementById('pwd-err').style.display='none'; document.getElementById('pwd-input').value=''; }

function selectRole(role){
  selectedRole=role;
  document.getElementById('rc-viewer').classList.toggle('selected',role==='viewer');
  document.getElementById('rc-admin').classList.toggle('selected',role==='admin');
  document.getElementById('pwd-label').textContent=role==='admin'?'Password amministratrice':'Password commissaria';
  document.getElementById('btn-login').style.background=role==='admin'?'var(--oro)':'var(--blu)';
  document.getElementById('pwd-err').style.display='none';
  document.getElementById('pwd-input').value='';
  document.getElementById('pwd-input').focus();
}

function doLogin(){
  const pwd=document.getElementById('pwd-input').value;
  const isAdmin=pwd===getPA(), isViewer=pwd===getPV();
  if(!isAdmin&&!isViewer){ document.getElementById('pwd-err').style.display='block'; return; }
  if(selectedRole==='admin'&&!isAdmin){ document.getElementById('pwd-err').style.display='block'; return; }
  currentRole=isAdmin?'admin':'viewer';
  loggedIn=true; closeModal(); applyRole();
  showPage('member',null); loadAll();
}

function applyRole(){
  const isAdmin=currentRole==='admin';
  const badge=document.getElementById('badge-role');
  badge.className='badge-role '+(isAdmin?'admin':'viewer');
  badge.innerHTML=isAdmin?'⚙️ Amministratrice — accesso completo':'👁️ Commissaria — sola visualizzazione';
  document.getElementById('ltog').textContent=isAdmin?'⚙️ Admin':'👁️ Area riservata';
  document.getElementById('ltog').className='lb '+(isAdmin?'on-admin':'on-view');
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=isAdmin?'':'none');
  document.querySelectorAll('.viewer-only').forEach(el=>el.style.display=isAdmin?'none':'');
  document.getElementById('tab-impost-btn').style.display=isAdmin?'':'none';
  // Mostra pulsante modifica descrizione solo se admin e siamo sulla home
  document.getElementById('hero-edit-btn').style.display=isAdmin?'inline-flex':'none';
}

function logout(){
  loggedIn=false; currentRole=null;
  document.getElementById('ltog').textContent='Area riservata';
  document.getElementById('ltog').className='lb';
  document.getElementById('hero-edit-btn').style.display='none';
  cancelEditDesc();
  showPage('home',document.querySelector('.nb'));
  document.querySelector('.nb').classList.add('active');
  selectRole('viewer');
}
function showTab(n,b){
  document.querySelectorAll('.tc').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+n).classList.add('active');
  if(b) b.classList.add('active');
}

// ══════════════════════════════════════
// CARICA TUTTO
// ══════════════════════════════════════
async function loadAll(){
  setDbStatus('caricamento');
  try{
    const [ev,dc]=await Promise.all([sbGet('eventi'),sbGet('documenti')]);
    events=ev; docs=dc;
    setDbStatus('ok');
    renderCalendar(); renderDocs();
  } catch(e){ setDbStatus('err'); console.error(e); }
}
function setDbStatus(s){
  const el=document.getElementById('db-status-bar');
  if(s==='ok') el.innerHTML='<span class="db-status ok">🟢 Database condiviso connesso</span>';
  else if(s==='err') el.innerHTML='<span class="db-status err">🔴 Errore connessione. Ricarica la pagina.</span>';
  else el.innerHTML='<span class="db-status ok" style="opacity:.6">⏳ Connessione...</span>';
}

// ══════════════════════════════════════
// DESCRIZIONE CPO — modificabile
// ══════════════════════════════════════
async function loadDesc(){
  try{
    const r=await fetch(`${SB_URL}/rest/v1/testi?chiave=eq.descrizione_cpo`,{headers:H});
    const data=await r.json();
    const testo=data[0]?.valore||'Organo consultivo del Comune di Follonica.';
    document.getElementById('hero-desc').textContent=testo;
  } catch(e){ document.getElementById('hero-desc').textContent='Organo consultivo del Comune di Follonica che promuove e tutela la parità di diritti e opportunità tra donne e uomini nel territorio comunale.'; }
}

function startEditDesc(){
  const testo=document.getElementById('hero-desc').textContent;
  document.getElementById('hero-textarea').value=testo;
  document.getElementById('hero-desc').style.display='none';
  document.getElementById('hero-edit-btn').style.display='none';
  document.getElementById('hero-editor').style.display='block';
  document.getElementById('hero-textarea').focus();
}
function cancelEditDesc(){
  document.getElementById('hero-editor').style.display='none';
  document.getElementById('hero-desc').style.display='block';
  if(currentRole==='admin') document.getElementById('hero-edit-btn').style.display='inline-flex';
}
async function saveDesc(){
  const testo=document.getElementById('hero-textarea').value.trim();
  if(!testo){ alert('Il testo non può essere vuoto.'); return; }
  try{
    // Usa PATCH per aggiornare la riga esistente tramite la chiave univoca
    const r=await fetch(`${SB_URL}/rest/v1/testi?chiave=eq.descrizione_cpo`,{
      method:'PATCH',
      headers:{...HP},
      body:JSON.stringify({valore:testo})
    });
    if(!r.ok){ const err=await r.text(); throw new Error(err); }
    document.getElementById('hero-desc').textContent=testo;
    cancelEditDesc();
    const ok=document.getElementById('desc-ok');
    ok.style.display='block'; setTimeout(()=>ok.style.display='none',3000);
  } catch(e){ alert('Errore nel salvataggio: '+e.message); }
}

// ══════════════════════════════════════
// EXCEL IMPORT
// ══════════════════════════════════════
function handleXlDrop(ev){ ev.preventDefault(); document.getElementById('xl-drop').classList.remove('drag'); const f=ev.dataTransfer.files[0]; if(f) handleXlFile(f); }
function handleXlFile(file){
  if(!file||!file.name.match(/\.xlsx?$/i)){ alert('Carica un file .xlsx'); return; }
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
      const sn=wb.SheetNames.includes('Eventi CPO')?'Eventi CPO':wb.SheetNames[0];
      const ws=wb.Sheets[sn];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,dateNF:'DD/MM/YYYY'});
      let hr=-1;
      for(let i=0;i<rows.length;i++){ if(rows[i].map(c=>(c||'').toString().toLowerCase()).some(c=>c.includes('data'))){ hr=i; break; } }
      if(hr===-1){ showXlResult('Intestazioni non trovate. Usa il template.','warn'); return; }
      const hdr=rows[hr].map(c=>(c||'').toString().toLowerCase().trim());
      const iD=hdr.findIndex(c=>c.includes('data'));
      const iT=hdr.findIndex(c=>c.includes('titolo'));
      const iO=hdr.findIndex(c=>c.includes('orario')||c.includes('ora'));
      const iL=hdr.findIndex(c=>c.includes('luogo'));
      if(iD===-1||iT===-1){ showXlResult('Colonne Data e Titolo obbligatorie non trovate.','warn'); return; }
      const nuovi=[], saltati=[];
      for(let i=hr+1;i<rows.length;i++){
        const row=rows[i];
        const dr=((iD>=0?row[iD]:'')||'').toString().trim();
        const tit=((iT>=0?row[iT]:'')||'').toString().trim();
        if(!dr&&!tit) continue;
        if(!dr||!tit){ saltati.push(i+1); continue; }
        let p=null;
        let m=dr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if(m) p={giorno:+m[1],mese:+m[2],anno:+m[3]};
        if(!p){ m=dr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/); if(m) p={anno:+m[1],mese:+m[2],giorno:+m[3]}; }
        if(!p&&!isNaN(+dr)){ const d=XLSX.SSF.parse_date_code(+dr); if(d) p={anno:d.y,mese:d.m,giorno:d.d}; }
        if(!p){ saltati.push(i+1); continue; }
        nuovi.push({anno:p.anno,mese:p.mese,giorno:p.giorno,titolo:tit,
          ora:((iO>=0?row[iO]:'')||'').toString().trim(),
          luogo:((iL>=0?row[iL]:'')||'').toString().trim(),src:'excel'});
      }
      if(!nuovi.length){ showXlResult('Nessun evento valido trovato.','warn'); return; }
      showXlPreview(nuovi,saltati);
    } catch(err){ showXlResult('Errore: '+err.message,'warn'); }
  };
  reader.readAsArrayBuffer(file);
}
function showXlPreview(nuovi,saltati){
  const MS=['','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  let html=`<p style="font-size:12px;color:var(--verde);margin-bottom:6px;font-weight:500">✓ Trovati ${nuovi.length} eventi${saltati.length?' ('+saltati.length+' saltati)':''}:</p>`;
  html+=`<div style="max-height:180px;overflow-y:auto;border:.5px solid var(--br);border-radius:var(--r);margin-bottom:10px"><table class="preview-table"><thead><tr><th>Data</th><th>Titolo</th><th>Orario</th><th>Luogo</th></tr></thead><tbody>`;
  nuovi.forEach(e=>{ html+=`<tr><td>${e.giorno} ${MS[e.mese]} ${e.anno}</td><td>${e.titolo}</td><td>${e.ora||'—'}</td><td>${e.luogo||'—'}</td></tr>`; });
  html+=`</tbody></table></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-verde" id="btn-xl-confirm">✓ Importa ${nuovi.length} eventi</button><button class="btn-cancel" style="flex:0" onclick="resetXlPreview()">Annulla</button></div>`;
  const wrapper=document.getElementById('xl-preview');
  wrapper.innerHTML=html; wrapper._nuovi=nuovi;
  document.getElementById('btn-xl-confirm').onclick=()=>confirmImport();
  document.getElementById('xl-result').style.display='none';
}
async function confirmImport(){
  const nuovi=document.getElementById('xl-preview')._nuovi;
  if(!nuovi||!nuovi.length) return;
  const btn=document.getElementById('btn-xl-confirm');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span>Importando...';
  try{
    await sbDeleteBySrc('excel');
    await sbInsert('eventi',nuovi);
    resetXlPreview(); await loadAll();
    if(nuovi.length){ curM=nuovi[0].mese; curY=nuovi[0].anno; renderCalendar(); }
    showXlResult(`✓ ${nuovi.length} eventi importati!`,'ok');
  } catch(e){ btn.disabled=false; btn.textContent='✓ Importa'; showXlResult('Errore: '+e.message,'warn'); }
}
function resetXlPreview(){ document.getElementById('xl-preview').innerHTML=''; document.getElementById('xl-input').value=''; }
function showXlResult(msg,type){ const el=document.getElementById('xl-result'); el.textContent=msg; el.className='import-result '+type; el.style.display='block'; }

// ══════════════════════════════════════
// CALENDARIO
// ══════════════════════════════════════
const MONTHS=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MS=['','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

async function addEvent(){
  if(currentRole!=='admin') return;
  const d=document.getElementById('ev-data').value;
  const t=document.getElementById('ev-titolo').value.trim();
  if(!d||!t){ alert('Inserisci almeno la data e il titolo.'); return; }
  const p=d.split('-');
  const btn=document.getElementById('btn-add-ev');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span>Salvando...';
  try{
    await sbInsert('eventi',[{anno:+p[0],mese:+p[1],giorno:+p[2],titolo:t,
      ora:document.getElementById('ev-ora').value.trim(),
      luogo:document.getElementById('ev-luogo').value.trim(),src:'manual'}]);
    ['ev-data','ev-titolo','ev-ora','ev-luogo'].forEach(id=>document.getElementById(id).value='');
    await loadAll(); curM=+p[1]; curY=+p[0]; renderCalendar(); flash('ev-ok');
  } catch(e){ alert('Errore: '+e.message); }
  btn.disabled=false; btn.textContent='Aggiungi al calendario';
}
async function deleteEvent(id){
  if(currentRole!=='admin') return;
  if(!confirm('Eliminare questo evento?'))return;
  try{ await sbDelete('eventi',id); await loadAll(); renderCalendar(); } catch(e){ alert('Errore: '+e.message); }
}
async function clearEvents(){
  if(currentRole!=='admin') return;
  if(!confirm('Eliminare TUTTI gli eventi?'))return;
  try{ await sbDeleteAll('eventi'); await loadAll(); renderCalendar(); } catch(e){ alert('Errore: '+e.message); }
}
function renderCalendar(){
  document.getElementById('cal-title').textContent=MONTHS[curM-1]+' '+curY;
  const tot=events.length, xl=events.filter(e=>e.src==='excel').length;
  document.getElementById('ev-count').textContent=tot===0?'Nessun evento':`${tot} eventi${xl?' · '+xl+' da Excel':''}`;
  const grid=document.getElementById('cal-grid'); grid.innerHTML='';
  ['L','M','M','G','V','S','D'].forEach(d=>{ const el=document.createElement('div'); el.className='cdn'; el.textContent=d; grid.appendChild(el); });
  const first=new Date(curY,curM-1,1).getDay(), offset=first===0?6:first-1;
  const days=new Date(curY,curM,0).getDate(), today=new Date();
  for(let i=0;i<offset;i++){ const el=document.createElement('div'); el.className='cd empty'; grid.appendChild(el); }
  for(let d=1;d<=days;d++){
    const el=document.createElement('div'); el.className='cd'; el.textContent=d;
    if(d===today.getDate()&&curM===today.getMonth()+1&&curY===today.getFullYear()) el.classList.add('today');
    if(events.some(e=>e.giorno===d&&e.mese===curM&&e.anno===curY)) el.classList.add('has-event');
    grid.appendChild(el);
  }
  const evList=document.getElementById('ev-list');
  const me=events.filter(e=>e.mese===curM&&e.anno===curY).sort((a,b)=>a.giorno-b.giorno);
  const isAdmin=currentRole==='admin';
  evList.innerHTML=me.length===0?'<p class="empty-msg">Nessun evento in questo mese.</p>'
    :me.map(e=>`<div class="ev-item">
      <div class="ev-badge"><div class="day">${e.giorno}</div><div class="mon">${MS[e.mese]}</div></div>
      <div class="ev-info">
        <h4>${e.titolo} <span class="ev-src ${e.src||'manual'}">${e.src==='excel'?'Excel':'Manuale'}</span></h4>
        ${[e.ora,e.luogo].filter(Boolean).length?`<p>${[e.ora,e.luogo].filter(Boolean).join(' · ')}</p>`:''}
      </div>
      ${isAdmin?`<button class="btn-sm rosso" onclick="deleteEvent(${e.id})">✕ Elimina</button>`:''}
    </div>`).join('');
}
function prevMonth(){ curM--; if(curM<1){curM=12;curY--;} renderCalendar(); }
function nextMonth(){ curM++; if(curM>12){curM=1;curY++;} renderCalendar(); }

// ══════════════════════════════════════
// DOCUMENTI
// ══════════════════════════════════════
function driveToDownload(url){ if(!url)return''; const m=url.match(/\/d\/([a-zA-Z0-9_-]+)/); if(m)return`https://drive.google.com/uc?export=download&id=${m[1]}`; return url; }
const CAT_LABEL={verbale:'Verbale',lavoro:'Documento di lavoro',comunicazione:'Comunicazione',altro:'Altro'};
const CAT_OPTIONS=['verbale','lavoro','comunicazione','altro'];
const TIPO_ICO={pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',default:'📎'};
const TIPO_BG={pdf:'#FCEBEB',doc:'#E6F1FB',docx:'#E6F1FB',xls:'#E8F7EE',xlsx:'#E8F7EE',default:'#F5F5F0'};
function guessType(link){ if(!link)return'default'; const l=link.toLowerCase(); for(const e of['pdf','docx','doc','xlsx','xls'])if(l.includes(e))return e; return'default'; }

async function addDoc(){
  if(currentRole!=='admin') return;
  const nome=document.getElementById('doc-nome').value.trim();
  const link=document.getElementById('doc-link').value.trim();
  if(!nome||!link){ alert('Inserisci nome e link.'); return; }
  if(!link.includes('drive.google.com')){ alert('Inserisci un link di Google Drive valido.'); return; }
  const btn=document.getElementById('btn-add-doc');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span>Salvando...';
  try{
    await sbInsert('documenti',[{nome,cat:document.getElementById('doc-cat').value,
      data:document.getElementById('doc-data').value||null,link,tipo:guessType(link)}]);
    document.getElementById('doc-nome').value='';
    document.getElementById('doc-link').value='';
    document.getElementById('doc-data').value='';
    await loadAll(); flash('doc-ok');
  } catch(e){ alert('Errore: '+e.message); }
  btn.disabled=false; btn.textContent='Aggiungi documento';
}

async function deleteDoc(id){
  if(currentRole!=='admin') return;
  if(!confirm('Eliminare questo documento?'))return;
  try{ await sbDelete('documenti',id); await loadAll(); } catch(e){ alert('Errore: '+e.message); }
}
async function clearDocs(){
  if(currentRole!=='admin') return;
  if(!confirm('Eliminare TUTTI i documenti?'))return;
  try{ await sbDeleteAll('documenti'); await loadAll(); } catch(e){ alert('Errore: '+e.message); }
}

// MODIFICA DOCUMENTO INLINE
function toggleDocEditor(id){
  const edEl=document.getElementById('doc-editor-'+id);
  const isOpen=edEl.style.display==='block';
  // chiudi tutti gli altri editor aperti
  document.querySelectorAll('[id^=doc-editor-]').forEach(el=>el.style.display='none');
  document.querySelectorAll('[id^=doc-editbtn-]').forEach(el=>el.textContent='✏️ Modifica');
  if(!isOpen){
    edEl.style.display='block';
    document.getElementById('doc-editbtn-'+id).textContent='✕ Chiudi';
  }
}
async function saveDocEdit(id){
  const nome=document.getElementById('ed-nome-'+id).value.trim();
  const cat=document.getElementById('ed-cat-'+id).value;
  const data=document.getElementById('ed-data-'+id).value||null;
  const link=document.getElementById('ed-link-'+id).value.trim();
  if(!nome){ alert('Il nome non può essere vuoto.'); return; }
  const btn=document.getElementById('ed-save-'+id);
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span>';
  try{
    await sbUpdate('documenti',id,{nome,cat,data,link,tipo:guessType(link)});
    await loadAll();
    flash('doc-edit-ok-'+id);
  } catch(e){ alert('Errore: '+e.message); }
  btn.disabled=false; btn.textContent='✓ Salva';
}

function filterDocs(cat,btn){
  currentFilter=cat;
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderDocs();
}
function renderDocs(){
  const filtered=currentFilter==='tutti'?docs:docs.filter(d=>d.cat===currentFilter);
  const list=document.getElementById('doc-list');
  const isAdmin=currentRole==='admin';
  if(!filtered.length){ list.innerHTML='<p class="empty-msg">Nessun documento in questa categoria.</p>'; return; }
  list.innerHTML=filtered.map(d=>{
    const tipo=d.tipo||guessType(d.link);
    const dlUrl=driveToDownload(d.link);
    const dataFmt=d.data?new Date(d.data+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'}):'';
    const dlBtn=dlUrl?`<a class="btn-dl" href="${dlUrl}" target="_blank" rel="noopener">⬇ Scarica</a>`
      :`<span class="btn-dl" style="opacity:.4;cursor:default">⬇ Scarica</span>`;
    const catOpts=CAT_OPTIONS.map(c=>`<option value="${c}" ${d.cat===c?'selected':''}>${CAT_LABEL[c]}</option>`).join('');
    const adminActions=isAdmin?`
      <button class="btn-sm oro" id="doc-editbtn-${d.id}" onclick="toggleDocEditor(${d.id})">✏️ Modifica</button>
      <button class="btn-sm rosso" onclick="deleteDoc(${d.id})">✕ Elimina</button>` : '';
    const editor=isAdmin?`
      <div class="doc-editor" id="doc-editor-${d.id}">
        <div class="form-grid">
          <div class="fi full"><label style="font-size:11px">Nome documento</label>
            <input type="text" id="ed-nome-${d.id}" value="${d.nome.replace(/"/g,'&quot;')}">
          </div>
          <div class="fi"><label style="font-size:11px">Categoria</label>
            <select id="ed-cat-${d.id}">${catOpts}</select>
          </div>
          <div class="fi"><label style="font-size:11px">Data</label>
            <input type="date" id="ed-data-${d.id}" value="${d.data||''}">
          </div>
          <div class="fi full"><label style="font-size:11px">Link Google Drive</label>
            <input type="url" id="ed-link-${d.id}" value="${(d.link||'').replace(/"/g,'&quot;')}">
          </div>
        </div>
        <div class="doc-editor-btns">
          <button class="btn-sm verde" id="ed-save-${d.id}" onclick="saveDocEdit(${d.id})">✓ Salva modifiche</button>
          <button class="btn-sm grigio" onclick="toggleDocEditor(${d.id})">Annulla</button>
        </div>
        <p class="ok-msg" id="doc-edit-ok-${d.id}" style="font-size:11px">✓ Documento aggiornato!</p>
      </div>` : '';
    return `<div class="doc-item">
      <div class="doc-ico" style="background:${TIPO_BG[tipo]||TIPO_BG.default}">${TIPO_ICO[tipo]||'📎'}</div>
      <div class="doc-meta">
        <h4>${d.nome}</h4>
        <p>${CAT_LABEL[d.cat]||d.cat}${dataFmt?' · '+dataFmt:''}</p>
        <div class="doc-actions">
          ${dlBtn}
          ${adminActions}
        </div>
        ${editor}
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════
// IMPOSTAZIONI PASSWORD
// ══════════════════════════════════════
function changeViewPassword(){
  const nw=document.getElementById('pwd-view-new').value;
  const nw2=document.getElementById('pwd-view-new2').value;
  const err=document.getElementById('pwd-view-err'); err.style.display='none';
  if(nw.length<6){ err.textContent='Minimo 6 caratteri.'; err.style.display='block'; return; }
  if(nw!==nw2){ err.textContent='Le password non coincidono.'; err.style.display='block'; return; }
  localStorage.setItem(K_PV,nw);
  ['pwd-view-new','pwd-view-new2'].forEach(id=>document.getElementById(id).value='');
  flash('pwd-view-ok');
}
function changeAdminPassword(){
  const old=document.getElementById('pwd-admin-old').value;
  const nw=document.getElementById('pwd-admin-new').value;
  const nw2=document.getElementById('pwd-admin-new2').value;
  const err=document.getElementById('pwd-admin-err'); err.style.display='none';
  if(old!==getPA()){ err.textContent='Password attuale errata.'; err.style.display='block'; return; }
  if(nw.length<6){ err.textContent='Minimo 6 caratteri.'; err.style.display='block'; return; }
  if(nw!==nw2){ err.textContent='Le password non coincidono.'; err.style.display='block'; return; }
  localStorage.setItem(K_PA,nw);
  ['pwd-admin-old','pwd-admin-new','pwd-admin-new2'].forEach(id=>document.getElementById(id).value='');
  flash('pwd-admin-ok');
}

function flash(id){ const el=document.getElementById(id); if(!el)return; el.style.display='block'; setTimeout(()=>el.style.display='none',3500); }
function contactSent(){ document.getElementById('contact-ok').style.display='block'; }

// Carica la descrizione all'avvio
loadDesc();