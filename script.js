/* SELL ON PRODUCT - repaired admin workflow */
const $ = (id) => document.getElementById(id);
const say = (id, msg) => { const el=$(id); if(el) el.textContent=msg; };
let lang='hi', brands=[], models=[], products=[], selectedBrand=null, selectedModel=null, cart=[];
let sb=null, adminUser=null;

function initClient(){
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || String(window.SUPABASE_ANON_KEY).includes('PASTE_')) return false;
  sb=window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  return true;
}
function setLang(){
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-hi][data-en]').forEach(e=>e.textContent=e.dataset[lang]);
  $('langBtn').textContent=lang==='hi'?'English':'हिन्दी';
  $('search').placeholder=lang==='hi'?'कंपनी खोजें...':'Search brands...';
}
$('langBtn').addEventListener('click',()=>{lang=lang==='hi'?'en':'hi';setLang();renderBrands();});
function showAdmin(){ $('adminModal').hidden=false; }
$('adminOpen').addEventListener('click',()=>{showAdmin(); if(!sb) say('loginMsg','Supabase config.js या इंटरनेट कनेक्शन जाँचें।');});
$('adminClose').addEventListener('click',()=>{$('adminModal').hidden=true;});

async function loadAll(){
  if(!sb) return;
  const [b,m,p]=await Promise.all([
    sb.from('brands').select('*').order('name_en'),
    sb.from('models').select('*').order('model_name'),
    sb.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false})
  ]);
  const err=b.error||m.error||p.error;
  if(err){console.error('loadAll:',err);say('adminMsg','डेटाबेस से डेटा नहीं मिला: '+err.message);return;}
  brands=b.data||[]; models=m.data||[]; products=p.data||[];
  renderBrands();
  if(adminUser) await fillAdminSelects();
}
function renderBrands(){
  const host=$('brands'); host.innerHTML='';
  const q=$('search').value.trim().toLowerCase();
  const list=brands.filter(b=>(b.name_en+' '+(b.name_hi||'')).toLowerCase().includes(q));
  if(!list.length){host.textContent=lang==='hi'?'अभी कोई ब्रांड उपलब्ध नहीं है।':'No brands available yet.';return;}
  list.forEach(b=>{const d=document.createElement('button');d.className='card brand-card';d.textContent=lang==='hi'?(b.name_hi||b.name_en):b.name_en;d.addEventListener('click',()=>pickBrand(b));host.append(d);});
}
function pickBrand(b){
  selectedBrand=b; $('modelSection').hidden=false; $('productSection').hidden=true;
  $('modelTitle').textContent=(lang==='hi'?(b.name_hi||b.name_en):b.name_en)+' – '+(lang==='hi'?'मॉडल':'Models');
  const host=$('models');host.innerHTML='';
  const list=models.filter(m=>String(m.brand_id)===String(b.id));
  if(!list.length){host.textContent=lang==='hi'?'इस ब्रांड के मॉडल जल्द जोड़े जाएंगे।':'No models added for this brand yet.';}
  list.forEach(m=>{const d=document.createElement('button');d.className='card model-card';d.textContent=m.model_name;d.addEventListener('click',()=>pickModel(m));host.append(d);});
  $('modelSection').scrollIntoView({behavior:'smooth'});
}
function pickModel(m){selectedModel=m;$('productSection').hidden=false;$('productTitle').textContent=m.model_name+' – Covers';renderProducts();$('productSection').scrollIntoView({behavior:'smooth'});}
function renderProducts(){
  const host=$('products');host.innerHTML='';if(!selectedModel)return;
  const list=products.filter(p=>String(p.model_id)===String(selectedModel.id)&&(!$('typeFilter').value||p.cover_type===$('typeFilter').value));
  if(!list.length){host.textContent=lang==='hi'?'इस मॉडल के लिए अभी कवर उपलब्ध नहीं हैं।':'No covers available for this model yet.';return;}
  list.forEach(p=>{const d=document.createElement('div');d.className='card product-card';const img=document.createElement('img');img.src=p.image_url||'';img.alt=p.title;const h=document.createElement('h3');h.textContent=p.title;const price=document.createElement('p');price.className='price';price.textContent='₹'+p.price;const stock=document.createElement('p');stock.textContent=(lang==='hi'?'स्टॉक: ':'Stock: ')+p.stock;const btn=document.createElement('button');btn.textContent=lang==='hi'?'कार्ट में जोड़ें':'Add to Cart';btn.addEventListener('click',()=>{cart.push(p);renderCart();});d.append(img,h,price,stock,btn);host.append(d);});
}
$('search').addEventListener('input',renderBrands);
$('backBrands').addEventListener('click',()=>{$('modelSection').hidden=true;$('productSection').hidden=true;});
$('backModels').addEventListener('click',()=>{$('productSection').hidden=true;});
$('typeFilter').addEventListener('change',renderProducts);
function renderCart(){
  $('cartCount').textContent=cart.length;$('cartItems').innerHTML='';
  cart.forEach((p,i)=>{const row=document.createElement('p');row.textContent=`${p.title} – ₹${p.price} `;const x=document.createElement('button');x.textContent='Remove';x.addEventListener('click',()=>{cart.splice(i,1);renderCart();});row.append(x);$('cartItems').append(row);});
  $('cartTotal').textContent=(lang==='hi'?'कुल: ₹':'Total: ₹')+cart.reduce((s,p)=>s+Number(p.price),0);
}
$('cartBtn').addEventListener('click',()=>$('cartPanel').hidden=false);
$('cartClose').addEventListener('click',()=>$('cartPanel').hidden=true);
$('checkout').addEventListener('click',()=>{
  if(!cart.length)return alert(lang==='hi'?'कार्ट खाली है।':'Your cart is empty.');
  const n=String(window.WHATSAPP_NUMBER||'').replace(/\D/g,'');
  if(!n||n.includes('PASTE'))return alert('WhatsApp number config.js में सेट करें।');
  const total=cart.reduce((s,p)=>s+Number(p.price),0);
  const msg='SELL ON PRODUCT Order\n'+cart.map(p=>`${p.title} - ₹${p.price}`).join('\n')+'\nTotal: ₹'+total;
  window.open('https://wa.me/'+n+'?text='+encodeURIComponent(msg),'_blank');
});

async function fillAdminSelects(){
  if(!sb)return;
  const {data,error}=await sb.from('brands').select('id,name_en').order('name_en');
  if(error){say('adminMsg','ब्रांड सूची लोड नहीं हुई: '+error.message);return;}
  brands=data||[];
  ['brandSelect','productBrand'].forEach(id=>{
    const sel=$(id);sel.innerHTML='';
    const ph=document.createElement('option');ph.value='';ph.textContent='-- पहले Brand चुनें --';sel.append(ph);
    brands.forEach(b=>{const o=document.createElement('option');o.value=b.id;o.textContent=b.name_en;sel.append(o);});
  });
  await fillModelOptions();
}
async function fillModelOptions(){
  const brandId=$('productBrand').value;
  const sel=$('productModel');sel.innerHTML='';
  const ph=document.createElement('option');ph.value='';ph.textContent='-- पहले Model चुनें --';sel.append(ph);
  if(!brandId)return;
  const {data,error}=await sb.from('models').select('id,model_name').eq('brand_id',brandId).order('model_name');
  if(error){say('adminMsg','मॉडल सूची लोड नहीं हुई: '+error.message);return;}
  (data||[]).forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.model_name;sel.append(o);});
  if(!(data||[]).length)say('adminMsg','इस Brand में अभी Model नहीं है। पहले नया Mobile Model जोड़ें।');
}
$('productBrand').addEventListener('change',fillModelOptions);
$('loginBtn').addEventListener('click',async()=>{
  if(!sb)return say('loginMsg','Supabase सेटिंग लोड नहीं हुई। पेज Refresh करें।');
  const email=$('email').value.trim(),password=$('password').value;
  if(!email||!password)return say('loginMsg','Email और Password दोनों भरें।');
  say('loginMsg','लॉगिन हो रहा है...');$('loginBtn').disabled=true;
  try{
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error){say('loginMsg','Login Error: '+error.message);return;}
    await adminReady(data.user);
  }catch(e){say('loginMsg','Error: '+e.message);}finally{$('loginBtn').disabled=false;}
});
async function adminReady(user){
  const {data,error}=await sb.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(error){say('loginMsg','Admin अनुमति जाँचने में समस्या: '+error.message);return;}
  if(!data){await sb.auth.signOut();say('loginMsg','इस Email को Admin अनुमति नहीं मिली है। Supabase में admin_users जाँचें।');return;}
  adminUser=user;$('loginBox').hidden=true;$('adminBox').hidden=false;$('adminEmail').textContent=user.email;
  say('adminMsg','Admin Login सफल। अब Brand चुनकर Model और Product जोड़ें।');
  await loadAll();await fillAdminSelects();await loadAdminProducts();
}
$('logoutBtn').addEventListener('click',async()=>{await sb.auth.signOut();adminUser=null;$('adminBox').hidden=true;$('loginBox').hidden=false;say('loginMsg','आप लॉगआउट हो गए हैं।');});
$('addBrand').addEventListener('click',async()=>{
  const name=$('brandEn').value.trim(),hi=$('brandHi').value.trim();
  if(!name)return say('adminMsg','Brand का English नाम लिखें।');
  say('adminMsg','Brand जोड़ा जा रहा है...');$('addBrand').disabled=true;
  try{const {data,error}=await sb.from('brands').insert({name_en:name,name_hi:hi||null}).select().single();
    if(error){say('adminMsg','Brand नहीं जुड़ा: '+error.message);return;}
    $('brandEn').value='';$('brandHi').value='';say('adminMsg','Brand सफलतापूर्वक जुड़ गया: '+data.name_en);await loadAll();await fillAdminSelects();
  }catch(e){say('adminMsg','Error: '+e.message);}finally{$('addBrand').disabled=false;}
});
$('addModel').addEventListener('click',async()=>{
  const brandId=$('brandSelect').value,name=$('modelName').value.trim();
  if(!brandId)return say('adminMsg','पहले Brand चुनें।');if(!name)return say('adminMsg','Mobile Model का नाम लिखें।');
  say('adminMsg','Mobile Model जोड़ा जा रहा है...');$('addModel').disabled=true;
  try{const {data,error}=await sb.from('models').insert({brand_id:brandId,model_name:name}).select().single();
    if(error){say('adminMsg','Model नहीं जुड़ा: '+error.message);return;}
    $('modelName').value='';say('adminMsg','Mobile Model सफलतापूर्वक जुड़ गया: '+data.model_name);await loadAll();await fillAdminSelects();$('brandSelect').value=brandId;
  }catch(e){say('adminMsg','Error: '+e.message);}finally{$('addModel').disabled=false;}
});
$('addProduct').addEventListener('click',async()=>{
  const modelId=$('productModel').value,file=$('productImage').files[0],title=$('productName').value.trim(),price=Number($('productPrice').value),stock=Number($('productStock').value||0);
  if(!modelId)return say('adminMsg','पहले Product Brand और उसका Mobile Model चुनें।');
  if(!file)return say('adminMsg','Cover की फोटो चुनें।');if(!Number.isFinite(price)||price<=0)return say('adminMsg','सही कीमत डालें।');if(stock<0)return say('adminMsg','Stock शून्य या उससे अधिक होना चाहिए।');
  say('adminMsg','फोटो अपलोड हो रही है...');$('addProduct').disabled=true;
  try{
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=Date.now()+'-'+safeName;
    const up=await sb.storage.from('product-images').upload(path,file,{upsert:false});if(up.error){say('adminMsg','फोटो अपलोड नहीं हुई: '+up.error.message);return;}
    const {data:urlData}=sb.storage.from('product-images').getPublicUrl(path);
    const {data,error}=await sb.from('products').insert({model_id:modelId,title:title||file.name,cover_type:$('productType').value,price,stock,image_url:urlData.publicUrl,is_active:true}).select().single();
    if(error){say('adminMsg','Product सेव नहीं हुआ: '+error.message);return;}
    $('productName').value='';$('productPrice').value='';$('productStock').value='';$('productImage').value='';say('adminMsg','Cover/Product सफलतापूर्वक जुड़ गया: '+data.title);await loadAll();await loadAdminProducts();
  }catch(e){say('adminMsg','Error: '+e.message);}finally{$('addProduct').disabled=false;}
});
async function loadAdminProducts(){
  const {data,error}=await sb.from('products').select('id,title,price,stock,is_active,models(model_name)').order('created_at',{ascending:false});
  if(error){say('adminMsg','आपके Products लोड नहीं हुए: '+error.message);return;}
  $('adminProducts').innerHTML='';(data||[]).forEach(p=>{const row=document.createElement('div');row.className='product-admin';const span=document.createElement('span');span.textContent=`${p.title} (${p.models?.model_name||''}) ₹${p.price} | Stock ${p.stock}`;const btn=document.createElement('button');btn.textContent=p.is_active?'Hide':'Show';btn.addEventListener('click',async()=>{const {error}=await sb.from('products').update({is_active:!p.is_active}).eq('id',p.id);if(error)say('adminMsg','Update Error: '+error.message);else{say('adminMsg','Product अपडेट हो गया।');await loadAll();await loadAdminProducts();}});row.append(span,btn);$('adminProducts').append(row);});
}
(async()=>{
  setLang();
  if(!initClient()){console.error('Supabase config missing');return;}
  await loadAll();
  const {data,error}=await sb.auth.getSession();
  if(error)console.error(error);
  if(data?.session)await adminReady(data.session.user);
})();
