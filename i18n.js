/* StrongGym — idioma (PT/EN) e tema (escuro/claro).
   A interface é escrita em português; em inglês, cada texto apresentado é traduzido
   através do dicionário (i18n-en.js) e dos padrões dinâmicos abaixo. */
(function(){
  'use strict';
  const store={get(k){try{return localStorage.getItem(k);}catch(_){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(_){}}};
  const root=document.documentElement;
  let lang=store.get('stronggym-lang')==='en'?'en':'pt';
  let theme=store.get('stronggym-theme')==='light'?'light':'dark';
  root.lang=lang==='en'?'en':'pt-PT';
  root.dataset.theme=theme;

  const SG=window.SG={
    get lang(){return lang;},
    get theme(){return theme;},
    locale(){return lang==='en'?'en-GB':'pt-PT';},
    L(pt,en){return lang==='en'?en:pt;},
    setLang(next){lang=next==='en'?'en':'pt';store.set('stronggym-lang',lang);root.lang=lang==='en'?'en':'pt-PT';},
    setTheme(next){theme=next==='light'?'light':'dark';store.set('stronggym-theme',theme);root.dataset.theme=theme;const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=theme==='light'?'#ffffff':'#000000';},
    t(text){return translate(text);},
    dict:{},
    patterns:[]
  };

  function translate(text){
    if(lang!=='en'||text==null)return text;
    const raw=String(text);
    const trimmed=raw.trim();
    if(!trimmed)return raw;
    const lead=raw.slice(0,raw.indexOf(trimmed)),tail=raw.slice(raw.indexOf(trimmed)+trimmed.length);
    let out=SG.dict[trimmed];
    if(out===undefined){
      for(const [re,rep] of SG.patterns){
        if(re.test(trimmed)){out=trimmed.replace(re,typeof rep==='function'?(...a)=>rep(...a):rep);break;}
      }
    }
    return out===undefined?raw:lead+out+tail;
  }
  /* Traduções dentro de padrões: traduz um fragmento capturado, se existir no dicionário. */
  SG.tx=s=>{const v=SG.dict[String(s).trim()];return v===undefined?s:v;};

  const ATTRS=['placeholder','aria-label','title'];
  function translateTree(node){
    if(lang!=='en'||!node)return;
    if(node.nodeType===3){const v=translate(node.nodeValue);if(v!==node.nodeValue)node.nodeValue=v;return;}
    if(node.nodeType!==1)return;
    if(node.closest&&node.closest('[data-no-translate]'))return;
    for(const a of ATTRS){if(node.hasAttribute(a)){const v=translate(node.getAttribute(a));if(v!==node.getAttribute(a))node.setAttribute(a,v);}}
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:n=>n.nodeType===1&&n.hasAttribute('data-no-translate')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    let n;
    while((n=walker.nextNode())){
      if(n.nodeType===3){if(n.parentNode&&/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName))continue;const v=translate(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;}
      else for(const a of ATTRS){if(n.hasAttribute(a)){const v=translate(n.getAttribute(a));if(v!==n.getAttribute(a))n.setAttribute(a,v);}}
    }
  }
  SG.translateTree=translateTree;
  const observer=new MutationObserver(list=>{
    if(lang!=='en')return;
    for(const m of list){
      if(m.type==='characterData')translateTree(m.target);
      else if(m.type==='attributes')translateTree(m.target.nodeType===1?m.target:null);
      else m.addedNodes.forEach(translateTree);
    }
  });
  function start(){translateTree(document.documentElement);observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
