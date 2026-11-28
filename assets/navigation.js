/* Progressive navigation: standalone URLs also work without JavaScript. */
(() => {
 const nav = document.querySelector('.hub-tabs');
 const home = document.querySelector('.hub-name');
 if (!nav || !home || !window.fetch || !window.history.pushState) return;
 const links = [...nav.querySelectorAll('a'), home];
 const urls = new Map(links.map(a => [a, new URL(a.href)]));
 const cache = new Map();
 const key = u => u.origin + u.pathname.replace(/index\.html$/, '');
 let current = key(new URL(location.href));
 let sequence = 0;
 let transition;
 // Keep the shell's paths stable after pushState changes the current folder.
 urls.forEach((u,a) => { a.href = u.href; });
 document.querySelectorAll('head link[href],head script[src]').forEach(el => {
   const attr = el.hasAttribute('href') ? 'href' : 'src';
   const value = el.getAttribute(attr);
   if (value && !/^[a-z]+:/i.test(value)) el.setAttribute(attr,new URL(value,location.href).href);
 });
 function absolute(node,base) {
   node.querySelectorAll('[href],[src]').forEach(el => {
     for (const attr of ['href','src']) {
       const value = el.getAttribute(attr);
       if (value && !value.startsWith('#')) el.setAttribute(attr,new URL(value,base).href);
     }
   });
 }
 absolute(document.querySelector('main'),location.href);
 function load(url) {
   const id = key(url);
   if (!cache.has(id)) {
     const request = fetch(url.href,{credentials:'same-origin'}).then(async response => {
       if (!response.ok) throw Error('Page unavailable');
       const doc = new DOMParser().parseFromString(await response.text(),'text/html');
       const main = doc.querySelector('main'), bg = doc.querySelector('.brand-background');
       if (!main || !bg || !doc.body.classList.contains('product-page')) throw Error('Invalid product page');
       absolute(main,response.url || url.href);
       await Promise.all([...main.querySelectorAll('.product-icon img, img.product-icon')].map(img => {
         const preload = new Image(); preload.src = img.src;
         // Never let a slow or background-throttled decode block navigation.
         const decoded = preload.decode ? preload.decode().catch(() => {}) : Promise.resolve();
         return Promise.race([decoded, new Promise(done => setTimeout(done, 600))]);
       }));
       return {main,bg,title:doc.title,bodyClass:doc.body.className,
         theme:doc.querySelector('meta[name="theme-color"]')?.content,
         icon:(()=>{const l=doc.querySelector('link[rel="icon"]');return l?new URL(l.getAttribute('href'),response.url||url.href).href:null;})(),
         description:doc.querySelector('meta[name="description"]')?.content};
     }).catch(error => {cache.delete(id);throw error;});
     cache.set(id,request);
   }
   return cache.get(id);
 }
 function active(url) {
   nav.querySelectorAll('a').forEach(a => {
     const selected = key(urls.get(a)) === key(url);
     a.classList.toggle('active',selected);
     if (selected) a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
   });
 }
 async function go(url,push) {
   const ticket = ++sequence;
   if (key(url) === current) {
     if (transition) transition.skipTransition();
     if (push) window.scrollTo({top:0,behavior:'instant'});
     return;
   }
   try {
     const page = await load(url);
     if (ticket !== sequence) return;
     if (transition) transition.skipTransition();
     let applied = false;
     const update = () => {
       if (applied || ticket !== sequence) return;
       applied = true;
       if (push) history.pushState(null,'',url.href);
       document.documentElement.classList.add('hub-navigated');
       document.body.className = page.bodyClass;
       document.title = page.title;
       for (const [name,value] of [['theme-color',page.theme],['description',page.description]]) {
         if (value != null) document.querySelector('meta[name="'+name+'"]')?.setAttribute('content',value);
       }
       document.querySelector('.brand-background').replaceWith(document.importNode(page.bg,true));
       document.querySelector('main').replaceWith(document.importNode(page.main,true));
       if (page.icon) document.querySelector('link[rel="icon"]')?.setAttribute('href',page.icon);
       active(url);current=key(url);window.scrollTo({top:0,behavior:'instant'});
       document.dispatchEvent(new CustomEvent('hub:pagechange'));
     };
     if (document.startViewTransition && document.visibilityState === 'visible' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
       transition=document.startViewTransition(update);
       transition.ready.catch(() => {}); // a skipped transition rejects `ready`; that's expected
       // A transition waits for a rendered frame; if none comes (throttled tab), swap without it.
       await Promise.race([transition.updateCallbackDone, new Promise(done => setTimeout(done, 800))]);
       if (!applied) { transition.skipTransition(); update(); }
     } else update();
   } catch(error) {
     if (ticket === sequence) {if(push)location.assign(url.href);else location.reload();}
   }
 }
 links.forEach(a => {
   const url=urls.get(a);
   a.addEventListener('click',event => {
     if(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
     event.preventDefault();go(url,true);
   });
   a.addEventListener('pointerenter',()=>load(url).catch(()=>{}),{passive:true});
   a.addEventListener('focus',()=>load(url).catch(()=>{}));
 });
 addEventListener('popstate',()=>{
   const url=new URL(location.href);
   if([...urls.values()].some(u=>key(u)===key(url)))go(url,false);else location.reload();
 });
 function warm(){for(const url of new Set([...urls.values()].map(u=>u.href)))load(new URL(url)).catch(()=>{});}
 if(document.readyState==='complete')warm();else addEventListener('load',warm,{once:true});
})();
