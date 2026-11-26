/* Phones: "add to home screen" sheet for the three web apps.
   HUB cannot install another site by itself (the browser only offers that on the app's own page),
   so the sheet explains the two taps for this phone and opens the app. Works after navigation.js
   swaps <main>, because the click is handled on the document. */
(() => {
 const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
 const icon = {
   share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
   menu: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
   open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>'
 };
 const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function steps(app) {
   return ios
     ? [`פתחו את ${app} ב־Safari, בכפתור למטה.`, `הקישו על כפתור השיתוף <span class="add-home-key">${icon.share}</span>.`, 'בחרו ״הוספה למסך הבית״ ואז ״הוסף״.']
     : [`פתחו את ${app}, בכפתור למטה.`, `הקישו על תפריט הדפדפן <span class="add-home-key">${icon.menu}</span>.`, 'בחרו ״התקנת אפליקציה״ או ״הוספה למסך הבית״.'];
 }
 function open(button) {
   const app = esc(button.dataset.addHome), url = button.dataset.appUrl;
   let sheet = document.getElementById('add-home-sheet');
   if (!sheet) {
     sheet = document.createElement('dialog');
     sheet.id = 'add-home-sheet';
     sheet.className = 'add-home-sheet';
     sheet.setAttribute('aria-labelledby', 'add-home-title');
     sheet.addEventListener('click', event => { if (event.target === sheet || event.target.closest('[data-close]')) sheet.close(); });
     document.body.append(sheet);
   }
   sheet.innerHTML = `<div class="add-home-body"><h2 id="add-home-title">${app} במסך הבית</h2>`
     + `<p class="add-home-lead">${app} ייפתח מהאייקון כמו אפליקציה, במסך מלא.</p>`
     + `<ol>${steps(app).map(s => `<li>${s}</li>`).join('')}</ol>`
     + `<a class="download-button" href="${esc(url)}" rel="noopener">${icon.open}<span>פתיחת ${app}</span></a>`
     + '<button type="button" class="add-home-close" data-close>סגירה</button></div>';
   if (typeof sheet.showModal === 'function') sheet.showModal();
   else location.assign(url);
 }
 document.addEventListener('click', event => {
   const button = event.target.closest?.('[data-add-home]');
   if (!button) return;
   event.preventDefault();
   open(button);
 });
})();
