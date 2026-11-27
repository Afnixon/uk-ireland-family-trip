(()=>{'use strict';
const D=window.TRIP_DATA;if(!D){document.body.insertAdjacentHTML('beforeend','<p>Trip information is temporarily unavailable. Reload to try again.</p>');return;}
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const url=(name)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name);
const dateHuman=iso=>new Date(iso+'T12:00:00Z').toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'});
const mapsLink=(stops)=>{if(!stops.length)return '#';const origin=stops[0][0],dest=stops[stops.length-1][0],via=stops.slice(1,-1).map(s=>s[0]);return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(origin)+'&destination='+encodeURIComponent(dest)+'&travelmode=walking'+(via.length?'&waypoints='+encodeURIComponent(via.join('|')):'')};
const osm=(lat,lon,span=.016)=>'https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent((lon-span)+','+(lat-span*.65)+','+(lon+span)+','+(lat+span*.65))+'&layer=mapnik&marker='+lat+'%2C'+lon;
const state=()=>new URLSearchParams(location.search);
function hideBroken(img){img.style.display='none';const fallback=img.closest('.photo-card,.day-hero,.stay-hero,.hero,.page-hero');if(fallback)fallback.classList.add('broken-image')}
document.addEventListener('error',e=>{if(e.target?.tagName==='IMG')hideBroken(e.target)},true);
if('serviceWorker'in navigator&&location.protocol==='https:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
window.addEventListener('online',()=>{$('#offline-banner')?.classList.remove('show')});window.addEventListener('offline',()=>{$('#offline-banner')?.classList.add('show')});
const nav=document.querySelectorAll('.nav-links a');nav.forEach(a=>{if(a.pathname===location.pathname||(location.pathname.endsWith('/')&&a.getAttribute('href')==='./index.html'))a.classList.add('active')});
const blank='No itinerary details are currently available.';
function mapFrame(lat,lon,small=false){return '<iframe class="map-frame'+(small?' small':'')+'" title="Interactive neighbourhood map" loading="lazy" referrerpolicy="no-referrer" src="'+osm(lat,lon,small?.009:.018)+'"></iframe>'}
function badge(status){let t=String(status);let c=/booked|confirmed/i.test(t)?'booked':/critical/i.test(t)?'critical':/await|enquiry|to book|to verify|pending|not booked|request/i.test(t)?'pending':'optional';return '<span class="badge '+c+'">'+esc(t)+'</span>'}
function photo(src,alt,loading='lazy'){return src?'<img src="'+esc(src)+'" alt="'+esc(alt)+'" loading="'+loading+'" referrerpolicy="no-referrer">':''}
function placeMatches(p,kind,area,term){return (kind==='All'||p.type===kind)&&(area==='All'||p.area===area)&&(!term||(p.name+' '+p.description+' '+p.area+' '+p.type).toLowerCase().includes(term.toLowerCase()))}
function placeCard(p){return '<article class="surface place-card"><div class="meta">'+esc(p.area)+' · '+esc(p.type)+'</div><h3>'+esc(p.name)+'</h3><p>'+esc(p.description)+'</p><div style="margin-bottom:12px">'+(p.booked?badge('Booked'):p.day?badge('Suggested '+p.day.substring(5).replace('-','/')):badge('Other idea'))+'</div><div class="place-actions"><a href="'+url(p.name+', '+p.area)+'" target="_blank" rel="noopener">Map & directions ↗</a>'+(p.url?'<a href="'+esc(p.url)+'" target="_blank" rel="noopener">Official website ↗</a>':'')+'</div></article>'}
function bookLink(name){return url(name)}
function dayCard(d,sub=''){return '<a class="photo-card" href="./itinerary.html?day='+encodeURIComponent(d.id)+'" aria-label="Explore '+esc(dateHuman(d.id))+'">'+photo(d.photo,d.photoLabel)+'<div class="content"><div class="meta">'+esc(dateHuman(d.id))+' · '+esc(d.city)+'</div><h3>'+esc(d.title)+'</h3><p>'+esc(d.desc)+'</p><div class="more"><span>'+esc(sub||'VIEW DAILY PLAN')+'</span><span>↗</span></div></div></a>'}
function home(){
  const host=$('#featured-days');if(host){[6,8,9,16].forEach(i=>host.insertAdjacentHTML('beforeend','<article class="surface highlight-card"><span class="eyebrow">'+esc(dateHuman(D.days[i].id))+'</span><span class="n">0'+([6,8,9,16].indexOf(i)+1)+'</span><h3>'+esc(D.days[i].title)+'</h3><p>'+esc(D.days[i].desc)+'</p><a href="./itinerary.html?day='+D.days[i].id+'" class="btn small">View day ↗</a></article>'))}
  const cities=$('#destinations');if(cities){[5,11,14].forEach((i,j)=>{const d=D.days[i];let label=['London · 29 Dec–4 Jan','Dublin · 4–7 Jan','Belfast · 7–10 Jan'][j];cities.insertAdjacentHTML('beforeend',dayCard({...d,title:['London','Dublin','Belfast'][j],desc:['Six nights of history, museums, food and festive celebrations.','Three nights of Irish coffee, Guinness and discovering the city.','Three nights of Titanic history, pub culture and the Causeway Coast.'][j]},label))})}
  const quick=$('#next-day');if(quick){let now=new Date();const ymd=now.toLocaleDateString('en-CA',{timeZone:'Europe/London'});let d=D.days.find(x=>x.id===ymd)||D.days.find(x=>x.id>ymd)||D.days[D.days.length-1];quick.innerHTML='<a class="btn dark" href="./itinerary.html?day='+d.id+'">Open '+(ymd===d.id?"today's":"next")+' day · '+esc(d.date)+' ↗</a>'}
}
function itinerary(){
 const target=$('#itinerary-main'),strip=$('#date-strip');if(!target||!strip)return;
 let current=state().get('day');if(!D.days.some(x=>x.id===current))current=D.days[0].id;
 const jump=(id,update=true)=>{let d=D.days.find(x=>x.id===id)||D.days[0],idx=D.days.indexOf(d);
 if(update)history.replaceState({},'',location.pathname+'?day='+d.id);
 strip.innerHTML=D.days.map(x=>'<button class="date-btn '+(x.id===d.id?'active':'')+'" data-id="'+x.id+'"><span class="dow">'+esc(x.weekday)+'</span><strong>'+esc(x.date)+'</strong><em>'+esc(x.city)+'</em></button>').join('');
 strip.querySelector('.active')?.scrollIntoView({behavior:'auto',block:'nearest',inline:'center'});
 strip.querySelectorAll('button').forEach(b=>b.onclick=()=>jump(b.dataset.id));
 const itemRows=d.items.map(x=>'<div class="activity"><span class="clock">'+esc(x[0])+'</span><div><b>'+esc(x[1])+'</b><p>'+esc(x[2])+'</p>'+badge(x[3])+'</div></div>').join('');
 const recs=['☕ Coffee','🍽 Food','🍷 Drinks'].map((title,j)=>'<div><strong>'+title+'</strong><p>'+esc(d.recs[j]||blank)+'</p></div>').join('');
 const dayPlaces=D.places.filter(p=>p.day===d.id);
 const stoplist=d.stops.map((s,i)=>'<li><span>'+(i+1)+'. '+esc(s[0])+'</span><a href="'+url(s[0]+' '+d.city)+'" target="_blank" rel="noopener">Directions ↗</a></li>').join('');
 const mapbox=d.stops.length?mapFrame(d.stops[0][1],d.stops[0][2]):'<p class="muted">No fixed stops today. Use the city guide or open directions as needed.</p>';
 const tours=D.tours[d.id]||null;
 const tourHtml=tours?'<section class="tour-panel section-gap"><span class="eyebrow">Self-guided history walk</span><h3>Westminster · four historical stops</h3><p class="muted">Read the short story at each location and use Next Stop to follow the route.</p><div id="tour-widget"></div></section>':'';
 target.innerHTML='<div class="day-layout"><div><div class="day-hero">'+photo(d.photo,d.photoLabel,'eager')+'<span class="fallback">'+esc(d.emoji)+'</span><div class="text"><span class="eyebrow light">'+esc(dateHuman(d.id))+' · '+esc(d.area)+'</span><h2>'+esc(d.title)+'</h2><p>'+esc(d.desc)+'</p></div></div><div class="day-body">'+itemRows+'<h3 style="margin-top:23px">Coffee · food · drinks</h3><div class="day-recs">'+recs+'</div>'+(dayPlaces.length?'<section class="section-gap" style="margin-top:28px"><span class="eyebrow">Nearby recommendations</span><div class="grid two" style="margin-top:14px">'+dayPlaces.slice(0,8).map(placeCard).join('')+'</div><p><a href="./places.html?day='+d.id+'">Explore all places for this day ↗</a></p></section>':'')+tourHtml+'</div></div><aside class="side-stack"><div class="info-tile"><span class="eyebrow">Today's route</span><h3>Map & directions</h3>'+mapbox+'<ol class="stoplinks">'+stoplist+'</ol>'+(d.stops.length?'<a class="btn small dark" href="'+mapsLink(d.stops)+'" target="_blank" rel="noopener">Open walking directions ↗</a>':'')+'<p style="margin-top:10px">Map locations are planning references. Check your actual route and transit conditions before travelling.</p></div><div class="info-tile"><span class="eyebrow">What to wear</span><h3>Dress for the day</h3><p>'+esc(d.wear)+'</p></div><div class="info-tile"><span class="eyebrow">Winter conditions</span><h3>'+esc(d.city)+'</h3><p>'+esc(d.weather.climate)+'</p><p>Seasonal averages, not a live forecast.</p><a href="https://www.metoffice.gov.uk/weather" target="_blank" rel="noopener">Check the latest weather ↗</a></div><div class="info-tile"><span class="eyebrow">Share this day</span><h3>Family link</h3><p>Share this day's plan without personal booking references.</p><button id="share-day" class="btn small dark">Copy day link ↗</button><p id="share-status" aria-live="polite"></p></div></aside></div><nav class="day-bottomnav" aria-label="Adjacent days"><div>'+(idx?'<a class="btn" href="?day='+D.days[idx-1].id+'">← '+esc(D.days[idx-1].date)+'</a>':'')+'</div><div>'+(idx<D.days.length-1?'<a class="btn dark" href="?day='+D.days[idx+1].id+'">'+esc(D.days[idx+1].date)+' →</a>':'')+'</div></nav>';
 $('#share-day').onclick=async()=>{const link=location.href;try{await navigator.clipboard.writeText(link);$('#share-status').textContent='Link copied.'}catch{window.prompt('Copy this link',link)}};
 target.querySelectorAll('.day-bottomnav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();jump(new URL(a.href).searchParams.get('day'));window.scrollTo({top:0,behavior:'smooth'})}));
 if(tours)renderTour(tours);
 };
 jump(current,false);
 const auto=$('#today-jump');if(auto)auto.onclick=()=>{const ymd=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});jump(D.days.find(x=>x.id===ymd)?.id||D.days.find(x=>x.id>ymd)?.id||D.days[0].id)};
 window.addEventListener('popstate',()=>jump(state().get('day'),false));
}
function renderTour(stops){let i=0;const el=$('#tour-widget');if(!el)return;function draw(){const s=stops[i];el.innerHTML='<div class="eyebrow">Stop '+(i+1)+' of '+stops.length+' · '+esc(s.time)+'</div><h3>'+esc(s.name)+'</h3><p class="tour-story">'+esc(s.story)+'</p>'+mapFrame(s.lat,s.lng,true)+'<div class="route-tools"><a href="'+url(s.name+' London')+'" target="_blank" class="btn small" rel="noopener">Directions ↗</a><button id="tour-prev" class="btn small" '+(i===0?'disabled':'')+'>← Previous</button><button id="tour-next" class="btn small dark" '+(i===stops.length-1?'disabled':'')+'>Next stop →</button></div>';$('#tour-prev').onclick=()=>{i--;draw()};$('#tour-next').onclick=()=>{i++;draw()}}draw()}
function places(){
 const list=$('#places-list'),query=$('#place-search'),type=$('#place-type'),area=$('#place-area'),day=$('#place-day'),count=$('#place-count');if(!list)return;
 [...new Set(D.places.map(x=>x.type))].sort().forEach(v=>type.insertAdjacentHTML('beforeend','<option>'+esc(v)+'</option>'));
 [...new Set(D.places.map(x=>x.area))].sort().forEach(v=>area.insertAdjacentHTML('beforeend','<option>'+esc(v)+'</option>'));
 D.days.forEach(d=>day.insertAdjacentHTML('beforeend','<option value="'+d.id+'">'+esc(d.date)+' · '+esc(d.city)+'</option>'));
 if(state().has('day'))day.value=state().get('day');
 function render(){const q=query.value.trim(),k=type.value,a=area.value,chosen=day.value;const found=D.places.filter(p=>placeMatches(p,k,a,q)&&(!chosen||p.day===chosen));count.textContent=found.length+' places';list.innerHTML=found.length?found.map(placeCard).join(''):'<div class="notice">No matching places. Clear the filters to explore everything.</div>';}
 [query,type,area,day].forEach(el=>el.addEventListener('input',render));
 $('#clear-filters').onclick=()=>{query.value='';type.value='All';area.value='All';day.value='';render()};
 render();
}
function stays(){
 const list=$('#stay-cards');if(!list)return;
 list.innerHTML=D.stays.map(s=>'<article class="section-gap"><div class="stay-hero">'+photo(s.hero,s.city+' landmark')+'<div><span class="eyebrow light">'+esc(s.dates)+' · '+s.nights+' nights</span><h2>'+esc(s.name)+'</h2><p>'+esc(s.area)+'</p></div></div><div class="stay-main"><p class="photo-caption">'+esc(s.kind)+'</p><div class="notice">'+esc(s.note)+'</div><div class="stay-columns">'+[['☕ Breakfast & coffee',s.coffee],['🍽 Food',s.food],['🍷 Pubs & drinks',s.drinks],['🏛 Things nearby',s.sights]].map(x=>'<div class="stay-collection"><h3>'+x[0]+'</h3><p>'+x[1].map(esc).join(' · ')+'</p></div>').join('')+'</div><div class="stay-map"><span class="eyebrow">Neighbourhood map</span><h3>Explore '+esc(s.area)+'</h3>'+mapFrame(s.center[0],s.center[1])+'<ol class="stoplinks">'+s.spots.map(x=>'<li><span>'+esc(x[0])+'</span><a href="'+url(x[0]+', '+s.city)+'" target="_blank" rel="noopener">Directions ↗</a></li>').join('')+'</ol></div><a class="btn dark small" href="'+esc(s.link)+'" target="_blank" rel="noopener">Open neighbourhood in Maps ↗</a></div></article>').join('');
}
function checklist(){
 const root=$('#packing-root');if(!root)return;const storageKey='family-trip-packing-2026';let picked=[];try{picked=JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{}let names=D.packing.flatMap(g=>g.items);
 const progress=()=>{const n=names.filter(x=>picked.includes(x)).length;$('#packed-count').textContent=n+' of '+names.length+' packed';$('#packed-progress').style.width=100*n/names.length+'%'};
 root.innerHTML='<div class="packing-grid">'+D.packing.map(g=>'<div class="surface"><span class="eyebrow">'+esc(g.group)+'</span><div style="margin-top:17px">'+g.items.map(item=>'<label class="checkline '+(picked.includes(item)?'checked':'')+'"><input type="checkbox" data-name="'+esc(item)+'" '+(picked.includes(item)?'checked':'')+'><span>'+esc(item)+'</span></label>').join('')+'</div></div>').join('')+'</div>';
 root.querySelectorAll('input').forEach(el=>el.onchange=()=>{let name=el.dataset.name;picked=el.checked?[...new Set([...picked,name])]:picked.filter(x=>x!==name);el.closest('label').classList.toggle('checked',el.checked);try{localStorage.setItem(storageKey,JSON.stringify(picked))}catch{}progress()});
 $('#clear-packing').onclick=()=>{picked=[];try{localStorage.removeItem(storageKey)}catch{}root.querySelectorAll('input').forEach(el=>{el.checked=false;el.closest('label').classList.remove('checked')});progress()};
 $('#copy-packing').onclick=async()=>{let t=D.packing.map(g=>g.group+'\n'+g.items.map(x=>(picked.includes(x)?'[x] ':'[ ] ')+x).join('\n')).join('\n\n');try{await navigator.clipboard.writeText(t);$('#packing-message').textContent='Checklist copied.'}catch{window.prompt('Copy checklist',t)}};
 progress();
}
function travel(){
 const boxes=$('#travel-steps');if(!boxes)return;
 const rows=[["24 Dec","Belgrade → London","Alex arrives at Heathrow and collects the London rental car.","Booked"],["25 Dec","Fort Wayne → Heathrow","Karlea and Kermit arrive after the overnight connection.","Confirm flight details"],["29 Dec","Family arrival","Tad and Lisa land at Heathrow around 11:35.","Scheduled"],["4 Jan","BA830 · LHR → DUB","Heathrow T5 10:40 → Dublin T2 12:10. Five family tickets gifted by Alex.","Booked"],["7 Jan","Hire car · Dublin → Belfast","Thrifty Peugeot 5008 or similar for 7–10 January.","Booked"],["10 Jan","BA829 · DUB → LHR","Dublin T2 11:00 → Heathrow T5 12:30. Early Belfast departure essential.","Booked"]];
 boxes.innerHTML=rows.map(r=>'<div class="surface"><span class="eyebrow">'+esc(r[0])+'</span><h3>'+esc(r[1])+'</h3><p>'+esc(r[2])+'</p>'+badge(r[3])+'</div>').join('')
}
if($('#destinations'))home();if($('#itinerary-main'))itinerary();if($('#places-list'))places();if($('#stay-cards'))stays();if($('#packing-root'))checklist();if($('#travel-steps'))travel();
})();