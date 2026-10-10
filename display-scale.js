/* POP'n WASH — independent display preferences; no page-wide zoom. */
(()=>{
  'use strict';
  const STORAGE='popnwash-display-size';
  const levels=[80,90,100,110,120,130,140,150,160,170,180,190,200];
  const root=document.documentElement;
  const wrapper=document.getElementById('displaySizeControl');
  const trigger=document.getElementById('displaySizeButton');
  const panel=document.getElementById('displaySizePanel');
  // Detach from the translucent sticky header: backdrop-filter makes
  // position:fixed descendants move with that header during AAA reflow.
  // A body-level dialog stays put under the user's thumb.
  if(panel?.parentElement!==document.body)document.body.appendChild(panel);
  function stableDialogPosition(){
    if(!panel||!trigger)return;
    const rect=trigger.getBoundingClientRect();
    const top=Math.max(8,Math.min(Math.ceil(rect.bottom+12),Math.max(8,window.innerHeight-90)));
    panel.style.setProperty('--pop-size-dialog-top',top+'px');
  }

  const slider=document.getElementById('displaySizeRange');
  const reset=document.getElementById('displaySizeReset');
  const title=document.getElementById('displaySizeTitle');
  const description=document.getElementById('displaySizeDescription');
  const current=document.getElementById('displaySizeCurrent');
  const hint=document.getElementById('displaySizeHint');
  if(!wrapper||!trigger||!panel||!slider||!reset)return;
  const locales={
    fr:['Taille d’affichage','Ajustez la taille des textes et de la présentation.','Taille actuelle : ','Réinitialiser à 110 %','Votre préférence est enregistrée sur cet appareil.','Réglage de la taille d’affichage'],
    nl:['Weergavegrootte','Pas de tekst- en weergavegrootte aan.','Huidige grootte: ','Terugzetten naar 110 %','Uw voorkeur wordt op dit apparaat bewaard.','Weergavegrootte instellen'],
    en:['Display size','Adjust text and layout size.','Current size: ','Reset to 110%','Your preference is saved on this device.','Adjust display size'],
    de:['Anzeigegröße','Passen Sie Text und Darstellung an.','Aktuelle Größe: ','Auf 110 % zurücksetzen','Ihre Einstellung wird auf diesem Gerät gespeichert.','Anzeigegröße einstellen'],
    it:['Dimensione di visualizzazione','Regola le dimensioni di testi e layout.','Dimensione attuale: ','Ripristina al 110%','La preferenza viene salvata su questo dispositivo.','Regola la dimensione'],
    es:['Tamaño de visualización','Ajusta el tamaño del texto y del diseño.','Tamaño actual: ','Restablecer al 110 %','Tu preferencia se guarda en este dispositivo.','Ajustar el tamaño'],
    pt:['Tamanho de visualização','Ajuste o tamanho dos textos e do layout.','Tamanho atual: ','Repor 110 %','A preferência fica guardada neste dispositivo.','Ajustar o tamanho'],
    ro:['Dimensiunea afișării','Reglați dimensiunea textului și a aspectului.','Dimensiune actuală: ','Resetați la 110 %','Preferința este salvată pe acest dispozitiv.','Reglați dimensiunea'],
    pl:['Rozmiar wyświetlania','Dostosuj rozmiar tekstu i układu.','Aktualny rozmiar: ','Przywróć 110%','Ustawienie jest zapisane na tym urządzeniu.','Zmień rozmiar'],
    uk:['Розмір відображення','Налаштуйте розмір тексту та елементів.','Поточний розмір: ','Скинути до 110 %','Налаштування збережено на цьому пристрої.','Налаштувати розмір'],
    ru:['Размер отображения','Настройте размер текста и элементов.','Текущий размер: ','Сбросить до 110 %','Настройка сохранена на этом устройстве.','Настроить размер']
  };
  function read(){
    try{const n=Number(localStorage.getItem(STORAGE));return levels.includes(n)?n:110;}catch(e){return 110;}
  }
  let value=read();

  /* Content-aware navigation: long translations must never collide with AAA. */
  function synchronizeDesktopNavigation(){
    const header=document.querySelector('.site-header');
    const nav=header?.querySelector('.desktop-nav');
    if(!header||!nav)return;
    header.classList.remove('nav-fit-compact');
    if(getComputedStyle(nav).display==='none')return;
    const links=[...nav.querySelectorAll('a')];
    const collides=nav.getBoundingClientRect().right>trigger.getBoundingClientRect().left-8;
    const wraps=links.some(a=>a.getBoundingClientRect().height>44||a.scrollWidth>a.clientWidth+2);
    header.classList.toggle('nav-fit-compact',collides||wraps);
  }


  /* Preserve complete words in long translations without shrinking every title.
   * Only an overlong word is allowed to reduce its own heading's font size. */
  const fitContext=document.createElement('canvas').getContext('2d');
  function fitHeadingWords(){
    if(!fitContext)return;
    const targets=document.querySelectorAll('h1,h2,h3,h4,.visit-summary-copy strong,.tariff-copy strong');
    targets.forEach(el=>{
      // Reset the old fit first, otherwise scale changes would compound.
      el.style.removeProperty('font-size');
      el.removeAttribute('data-word-fit');
      const style=getComputedStyle(el),rect=el.getBoundingClientRect();
      const isCardLabel=el.matches('.visit-summary-copy strong,.tariff-copy strong');
      const available=isCardLabel?
        (el.parentElement?.getBoundingClientRect().width||rect.width):rect.width;
      if(available<25||rect.height===0)return;
      const fontSize=parseFloat(style.fontSize);
      if(!Number.isFinite(fontSize)||fontSize<=0)return;
      fitContext.font=style.fontStyle+' '+style.fontWeight+' '+fontSize+'px '+style.fontFamily;
      const spacing=parseFloat(style.letterSpacing)||0;
      const words=(el.textContent||'').match(/[\p{L}\p{N}][\p{L}\p{N}’'\-‑]{3,}/gu)||[];
      const maxWord=words.reduce((max,word)=>Math.max(max,
        fitContext.measureText(word).width+Math.max(0,word.length-1)*spacing),0);
      if(maxWord<=available-4)return;
      const minSize=isCardLabel?12:17;
      const font=Math.max(minSize,Math.floor(fontSize*(available-6)/maxWord*10)/10);
      if(font>=fontSize)return;
      el.style.setProperty('font-size',font+'px','important');
      el.dataset.wordFit=String(font);
    });
  }

  /* A slider input is a lightweight live preview, NOT a request to measure
     every title/header on every pixel movement. */
  let dragging=false,finishFrame=0;
  const frozen=[];
  function preview(n){
    if(!levels.includes(n))return;
    value=n;
    root.style.setProperty('--display-scale',String(n/100));
    root.dataset.displayScale=String(n);
    if(slider.value!==String(n))slider.value=String(n);
    slider.style.setProperty('--range-progress',((n-80)*100/120)+'%');
    current.textContent=n+' %';
    slider.setAttribute('aria-valuetext',n+' %');
    const t=locales[root.lang]||locales.fr;
    trigger.setAttribute('aria-label',t[5]+' : '+n+' %');
    trigger.title=t[5]+' : '+n+' %';
  }
  function translate(){
    const t=locales[root.lang]||locales.fr;
    title.textContent=t[0];description.textContent=t[1];hint.textContent=t[4];
    reset.textContent=t[3];current.textContent=value+' %';
    trigger.setAttribute('aria-label',t[5]+' : '+value+' %');
    trigger.title=t[5]+' : '+value+' %';
    panel.setAttribute('aria-label',t[0]);
    slider.setAttribute('aria-label',t[5]);
    slider.setAttribute('aria-valuetext',value+' %');
    if(dragging)return;
    synchronizeDesktopNavigation();
    fitHeadingWords();
  }
  function finish(persist=true){
    if(persist)try{localStorage.setItem(STORAGE,String(value));}catch(e){}
    translate();
  }
  function queueFinish(){
    if(finishFrame)cancelAnimationFrame(finishFrame);
    finishFrame=requestAnimationFrame(()=>{
      finishFrame=0;
      if(!dragging)finish();
    });
  }
  function beginDrag(){
    if(dragging||panel.hidden)return;
    dragging=true;
    document.body.classList.add('pop-aaa-dragging');
    const rect=panel.getBoundingClientRect();
    panel.style.setProperty('--pop-locked-dialog-height',Math.ceil(rect.height)+'px');
    panel.querySelectorAll('h2,p,button,.display-size-slider-caption,.display-size-range-limits').forEach(el=>{
      const style=getComputedStyle(el);
      frozen.push([el,el.style.getPropertyValue('font-size'),el.style.getPropertyPriority('font-size'),
                   el.style.getPropertyValue('line-height'),el.style.getPropertyPriority('line-height')]);
      el.style.setProperty('font-size',style.fontSize,'important');
      el.style.setProperty('line-height',style.lineHeight,'important');
    });
    if(finishFrame)cancelAnimationFrame(finishFrame);
    finishFrame=0;
  }
  function endDrag(){
    if(!dragging)return;
    dragging=false;
    document.body.classList.remove('pop-aaa-dragging');
    panel.style.removeProperty('--pop-locked-dialog-height');
    for(const [el,size,sizePriority,line,linePriority] of frozen){
      if(size)el.style.setProperty('font-size',size,sizePriority);
      else el.style.removeProperty('font-size');
      if(line)el.style.setProperty('line-height',line,linePriority);
      else el.style.removeProperty('line-height');
    }
    frozen.length=0;
    queueFinish();
    window.dispatchEvent(new Event('scroll'));
  }
  function setSize(n,persist=true){
    if(!levels.includes(n))return;
    preview(n);
    if(!dragging)finish(persist);
  }
  function show(open,restoreFocus=false){
    panel.hidden=!open;
    trigger.setAttribute('aria-expanded',String(open));
    wrapper.classList.toggle('is-open',open);
    document.body.classList.toggle('display-size-open',open);
    if(open){
      stableDialogPosition();
      const lang=document.getElementById('langMenu');
      const langButton=document.getElementById('langButton');
      if(lang){lang.hidden=true;if(langButton)langButton.setAttribute('aria-expanded','false');}
      const mobile=document.getElementById('mobileMenu');
      const mobileButton=document.getElementById('menuButton');
      if(mobile){mobile.hidden=true;if(mobileButton)mobileButton.setAttribute('aria-expanded','false');}
    }
    if(restoreFocus)trigger.focus();
  }
  trigger.addEventListener('click',()=>show(panel.hidden));
  slider.addEventListener('pointerdown',beginDrag);
  window.addEventListener('pointerup',endDrag,{passive:true});
  window.addEventListener('pointercancel',endDrag,{passive:true});
  window.addEventListener('blur',endDrag);
  slider.addEventListener('input',()=>{
    preview(Number(slider.value));
    if(!dragging)queueFinish();
  });
  slider.addEventListener('change',()=>{
    if(!dragging)queueFinish();
  });
  reset.addEventListener('click',()=>setSize(110));
  document.addEventListener('pointerdown',e=>{
    if(!panel.hidden&&!wrapper.contains(e.target)&&!panel.contains(e.target))show(false);
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!panel.hidden){e.preventDefault();show(false,true);}
  });
  document.getElementById('langButton')?.addEventListener('click',()=>show(false));
  document.getElementById('menuButton')?.addEventListener('click',()=>show(false));
  document.getElementById('themeSlider')?.addEventListener('input',()=>show(false));
  new MutationObserver(translate).observe(root,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('resize',()=>{
    if(dragging)return;
    synchronizeDesktopNavigation();
    fitHeadingWords();
    if(!panel.hidden)stableDialogPosition();
  },{passive:true});
  setSize(value,false);
  show(false);
})();