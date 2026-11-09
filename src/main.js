import './style.css';
import {read, write, createItem, toggle} from './store.js';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
document.querySelector('#app').innerHTML = `
<main><header><a class="brand" href="/" aria-label="tiny ホーム"><span class="brand-icon">${check}</span>tiny<span class="brand-dot">.</span></a><button id="help" class="icon-button" aria-label="このアプリについて">?</button></header>
<section class="intro"><p class="eyebrow">LESS TO REMEMBER, MORE ROOM TO LIVE.</p><h1>ひとつずつ、<br>すっきり。</h1><p class="subtitle">買うものも、ふと思いついたことも。</p></section>
<section aria-label="ToDoリスト"><div class="list-heading"><h2>マイリスト <span id="count"></span></h2><span class="local"><i></i> この端末に保存</span></div><form id="add-form"><span class="plus" aria-hidden="true">＋</span><input id="title" aria-label="新しい項目のタイトル" placeholder="何をリストに入れる？" maxlength="200" autocomplete="off" required><button class="add" aria-label="項目を追加">追加 <span aria-hidden="true">↵</span></button></form><p class="hint">右にスワイプ、または ○ をタップして完了</p><div id="active" class="items"></div><div id="empty" class="empty" hidden><span>${check}</span><h3>頭の中に、余白を。</h3><p>買うものや、覚えておきたいことを<br>上の入力欄から追加しましょう。</p></div><section id="completed" hidden><div class="done-heading"><button id="fold" aria-expanded="true">完了した項目 <span id="done-count"></span> <span id="chevron">⌃</span></button><button id="clear">まとめて削除</button></div><div id="done" class="items"></div></section></section>
<footer><span class="small-mark">✳</span> 小さなリストで、軽やかな毎日を。</footer></main><div id="toast" role="status" hidden><span id="message"></span><button id="undo">元に戻す</button></div>
<dialog id="about"><button id="close-help" class="icon-button close" aria-label="閉じる">×</button><span class="eyebrow">YOUR OWN LITTLE SPACE</span><h2>あなたの端末だけに。</h2><p>タイトルだけの、小さなToDoリスト。右にスワイプするか、丸いボタンを押すと完了します。完了した項目も、同じ操作で戻せます。</p><p>データはこのブラウザに保存されます。同期やアカウント登録はありません。ブラウザのデータを消去するとリストも消えるため、大切な情報の唯一の保管場所にはしないでください。</p><p>AndroidのChromeメニューから「ホーム画面に追加」でアプリとして使えます。一度読み込めばオフラインでも利用できます。</p></dialog>`;
let items = [], folded = false, undo = null, toastTimer;
const $ = id => document.getElementById(id);
let storageAvailable = true;
try { items = read(localStorage); } catch { storageAvailable = false; }
function toast(message, action) { clearTimeout(toastTimer); undo = action; $('message').textContent = message; $('undo').hidden = !action; $('toast').hidden = false; toastTimer = setTimeout(() => {$('toast').hidden = true; undo = null;}, 7000); }
function commit(next, message) {
  try { write(localStorage, next); } catch { toast('保存できません。ブラウザの保存設定や空き容量をご確認ください。'); return false; }
  const previous = items; items = next; render();
  if (message) toast(message, () => commit(previous));
  return true;
}
function row(item) {
  const wrapper = document.createElement('div'); wrapper.className = 'swipe-row';
  const backdrop = document.createElement('div'); backdrop.className = 'swipe-back'; backdrop.innerHTML = check;
  const el = document.createElement('div'); el.className = 'item' + (item.done ? ' is-done' : '');
  const button = document.createElement('button'); button.className = 'check'; button.innerHTML = item.done ? check : ''; button.setAttribute('aria-label', `${item.title}を${item.done ? '未完了に戻す' : '完了にする'}`);
  const title = document.createElement('span'); title.className = 'item-title'; title.textContent = item.title;
  const grip = document.createElement('span'); grip.className = 'swipe-indicator'; grip.textContent = '→'; grip.setAttribute('aria-hidden','true');
  const act = () => commit(toggle(items, item.id), item.done ? '未完了に戻しました' : 'ひとつ、すっきりしました');
  button.onclick = act; el.append(button,title,grip); wrapper.append(backdrop,el);
  let start = null, dx = 0;
  el.onpointerdown = e => { if (e.target.closest('button') || !e.isPrimary || e.button !== 0) return; start = {x:e.clientX,y:e.clientY,id:e.pointerId}; dx=0; };
  el.onpointermove = e => { if (!start) return; const x=e.clientX-start.x,y=e.clientY-start.y; if (Math.abs(y)>12 && Math.abs(y)>Math.abs(x)) { reset(); return; } if (x>10) { el.setPointerCapture(e.pointerId); dx=Math.min(x,140); el.style.transform=`translateX(${dx}px)`; wrapper.classList.toggle('ready',dx>=80); } };
  function reset() { start=null; dx=0; el.style.transform=''; wrapper.classList.remove('ready'); }
  el.onpointerup = () => { const complete=dx>=80; reset(); if(complete) act(); }; el.onpointercancel=reset;
  return wrapper;
}
function render() {
  const active=items.filter(x=>!x.done), done=items.filter(x=>x.done);
  $('count').textContent=active.length; $('done-count').textContent=done.length;
  $('active').replaceChildren(...active.map(row)); $('done').replaceChildren(...done.map(row));
  $('empty').hidden=active.length>0; $('empty').querySelector('h3').textContent=done.length ? '全部できた。おつかれさま。' : '頭の中に、余白を。';
  $('completed').hidden=!done.length; $('done').hidden=folded; $('fold').setAttribute('aria-expanded',String(!folded)); $('chevron').textContent=folded?'⌄':'⌃';
}
$('add-form').onsubmit=e=>{e.preventDefault(); const item=createItem($('title').value); if(item && commit([...items,item])) {$('title').value=''; $('title').focus();}};
$('fold').onclick=()=>{folded=!folded;render();};
$('clear').onclick=()=>commit(items.filter(x=>!x.done),'完了した項目を削除しました');
$('undo').onclick=()=>{const action=undo; $('toast').hidden=true; undo=null; if(action)action();};
$('help').onclick=()=>$('about').showModal(); $('close-help').onclick=()=>$('about').close();
render();
if(!storageAvailable) toast('保存データを読み込めませんでした。ブラウザの設定をご確認ください。');
if('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(()=>toast('オフラインの準備ができませんでした。オンラインで再読み込みしてください。'));
