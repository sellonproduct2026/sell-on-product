(()=>{
"use strict";

const $=id=>document.getElementById(id);
const C=window.APP_CONFIG||{};
const T=C.TABLES||{};
const K=C.COLUMNS||{};

let db;
let brands=[],models=[],products=[];
let chosenBrand=null,chosenModel=null;
let cart=[],lang="hi",photos=[],photoAt=0;
let selectedCategory="";

const col=k=>K[k];
const table=k=>T[k];
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN");

const say=(id,t)=>{
const el=$(id);
if(el)el.textContent=t;
};

const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({
"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

function start(){

if($("year"))$("year").textContent=new Date().getFullYear();

if($("chatSupport")){
$("chatSupport").href=
`https://wa.me/${C.WHATSAPP_NUMBER}?text=${encodeURIComponent(C.CHAT_GREETING||"नमस्ते, मुझे सहायता चाहिए।")}`;
}

$("adminOpen").onclick=()=>$("adminModal").hidden=false;
$("adminClose").onclick=()=>$("adminModal").hidden=true;

$("cartBtn").onclick=()=>$("cartPanel").hidden=false;
$("cartClose").onclick=()=>$("cartPanel").hidden=true;

$("backBrands").onclick=()=>{
$("brandSection").hidden=false;
$("modelSection").hidden=true;
};

$("backModels").onclick=()=>{
$("modelSection").hidden=false;
$("productSection").hidden=true;
};

$("typeFilter").onchange=renderProducts;
$("search").oninput=search;

$("langBtn").onclick=()=>{
lang=lang==="hi"?"en":"hi";

say("brandHeading",
lang==="hi"?"मोबाइल कंपनी चुनें":"Choose a mobile brand");

say("heroTitle",
lang==="hi"?
"अपने मोबाइल के लिए शानदार कवर चुनें":
"Find the perfect cover for your phone");

renderBrands();
};

$("loginBtn").onclick=login;
$("logoutBtn").onclick=logout;
$("addBrand").onclick=addBrand;
$("addModel").onclick=addModel;
$("addProduct").onclick=addProduct;
$("checkout").onclick=checkout;

$("productBrand").onchange=fillModels;

$("photoClose").onclick=()=>$("photoModal").hidden=true;
$("photoPrev").onclick=()=>movePhoto(-1);
$("photoNext").onclick=()=>movePhoto(1);

initBanner();
initPhotoSwipe();

if(
!C.SUPABASE_URL||
C.SUPABASE_URL.includes("PASTE_")||
!C.SUPABASE_ANON_KEY||
C.SUPABASE_ANON_KEY.includes("PASTE_")
){
$("brands").innerHTML=
"<p>config.js में Supabase URL और Publishable/anon key भरें।</p>";
return;
}

db=window.supabase.createClient(
C.SUPABASE_URL,
C.SUPABASE_ANON_KEY
);

load();
}

/* BANNER SLIDER */

function initBanner(){

let slider=$("bannerSlider");
if(!slider)return;

let track=slider.querySelector(".bannerTrack");
if(!track)return;

let slides=[...track.children];
let dots=slider.querySelector(".bannerDots");

if(!slides.length)return;

let current=0;

if(dots){
dots.innerHTML=slides.map((_,i)=>
`<button class="${i===0?"active":""}"></button>`
).join("");
}

function go(n){

current=(n+slides.length)%slides.length;

track.style.transform=
`translateX(-${current*100}%)`;

if(dots){
[...dots.children].forEach((d,i)=>{
d.classList.toggle("active",i===current);
});
}

}

slider.querySelector(".bannerPrev").onclick=()=>go(current-1);
slider.querySelector(".bannerNext").onclick=()=>go(current+1);

if(dots){
[...dots.children].forEach((d,i)=>{
d.onclick=()=>go(i);
});
}

let startX=0;

slider.addEventListener("touchstart",e=>{
startX=e.touches[0].clientX;
},{passive:true});

slider.addEventListener("touchend",e=>{
let dx=e.changedTouches[0].clientX-startX;

if(Math.abs(dx)>45){
go(current+(dx<0?1:-1));
}
},{passive:true});

}

/* PRODUCT PHOTO SWIPE */

function initPhotoSwipe(){

let modal=$("photoModal");
if(!modal)return;

let sx=0,sy=0;

modal.addEventListener("touchstart",e=>{
sx=e.touches[0].clientX;
sy=e.touches[0].clientY;
},{passive:true});

modal.addEventListener("touchend",e=>{

let dx=e.changedTouches[0].clientX-sx;
let dy=e.changedTouches[0].clientY-sy;

if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){
movePhoto(dx<0?1:-1);
}

},{passive:true});

}

/* LOAD DATABASE */

async function load(){

try{

let [b,m,p]=await Promise.all([

db.from(table("brands")).select("*"),

db.from(table("models")).select("*"),

db.from(table("products")).select("*")

]);

if(b.error)throw b.error;
if(m.error)throw m.error;
if(p.error)throw p.error;

brands=b.data||[];
models=m.data||[];

products=(p.data||[]).filter(
x=>x[col("productActive")]!==false
);

renderBrands();
renderTrending();

}catch(e){

$("brands").innerHTML=
`डेटा लोड नहीं हुआ: ${safe(e.message)}. Supabase SELECT policies/table columns जाँचें।`;

}

}

/* BRAND */

function brandName(b){

return lang==="hi"?

(b[col("brandNameHi")]||b[col("brandNameEn")]||"Brand"):

(b[col("brandNameEn")]||b[col("brandNameHi")]||"Brand");

}

function renderBrands(){

$("brands").innerHTML=brands.map(b=>
`<button class="brand" data-b="${safe(b.id)}">
${safe(brandName(b))}
</button>`
).join("")||"कोई कंपनी नहीं मिली";

document.querySelectorAll("[data-b]").forEach(x=>{
x.onclick=()=>selectBrand(x.dataset.b);
});

}

function selectBrand(id){

chosenBrand=brands.find(b=>String(b.id)===String(id));

$("brandSection").hidden=true;
$("modelSection").hidden=false;
$("productSection").hidden=true;

say("modelTitle",brandName(chosenBrand));

let rows=models.filter(m=>
String(m[col("modelBrandId")])===String(id)
);

$("models").innerHTML=rows.map(m=>
`<button data-m="${safe(m.id)}">
${safe(m[col("modelName")])}
</button>`
).join("")||"कोई मॉडल नहीं";

document.querySelectorAll("[data-m]").forEach(x=>{
x.onclick=()=>selectModel(x.dataset.m);
});

}

function selectModel(id){

chosenModel=models.find(m=>String(m.id)===String(id));

$("modelSection").hidden=true;
$("productSection").hidden=false;

say("productTitle",
(chosenModel[col("modelName")]||"")+" — Covers");

renderProducts();

}

/* PRODUCT IMAGES */

function pics(p){

let a=p[col("productImages")];

if(typeof a==="string"){
try{a=JSON.parse(a)}catch{a=[]}
}

if(!Array.isArray(a))a=[];

return a.length?a:
(p[col("productImage")]?[p[col("productImage")]]:[]);

}

/* TRENDING PRODUCTS */

function renderTrending(){

let box=$("trendingProducts");
if(!box)return;

let list=products.slice(0,8);

box.innerHTML=list.map(p=>`

<article class="card">

<img
src="${safe(pics(p)[0]||"")}"
data-trend-photo="${safe(p.id)}"
loading="lazy"
>

<h3>${safe(p[col("productName")])}</h3>

<p>${safe(p[col("productType")])}</p>

<p>${money(p[col("productPrice")])}</p>

<button data-trend-add="${safe(p.id)}">
Add to Cart
</button>

</article>

`).join("")||"अभी कोई प्रोडक्ट उपलब्ध नहीं है";

document.querySelectorAll("[data-trend-add]").forEach(b=>{
b.onclick=()=>addCart(b.dataset.trendAdd);
});

document.querySelectorAll("[data-trend-photo]").forEach(b=>{

b.onclick=()=>{
let p=products.find(x=>String(x.id)===b.dataset.trendPhoto);
openPhotos(p);
};

});

}

/* PRODUCT DISPLAY */

function renderProducts(){

if(!chosenModel)return;

let list=products.filter(p=>

String(p[col("productModelId")])===String(chosenModel.id)

&&

(!$("typeFilter").value||
p[col("productType")]===$("typeFilter").value)

&&

(!selectedCategory||
p[col("productType")]===selectedCategory)

);

$("products").innerHTML=list.map(p=>`

<article class="card">

<img
src="${safe(pics(p)[0]||"")}"
data-p="${safe(p.id)}"
loading="lazy"
>

<h3>${safe(p[col("productName")])}</h3>

<p>
${safe(p[col("productType")])}
•
${money(p[col("productPrice")])}
</p>

<p>Stock: ${safe(p[col("productStock")])}</p>

<button data-add="${safe(p.id)}">
Add to Cart
</button>

</article>

`).join("")||"इस मॉडल के Products नहीं मिले";

document.querySelectorAll("[data-add]").forEach(x=>{
x.onclick=()=>addCart(x.dataset.add);
});

document.querySelectorAll("[data-p]").forEach(x=>{

x.onclick=()=>{
let p=products.find(z=>String(z.id)===x.dataset.p);
openPhotos(p);
};

});

}

/* CATEGORY FILTER */

document.querySelectorAll("[data-category]").forEach(btn=>{

btn.onclick=()=>{

selectedCategory=btn.dataset.category;

$("typeFilter").value=selectedCategory;

if(chosenModel){
$("productSection").hidden=false;
$("brandSection").hidden=true;
$("modelSection").hidden=true;
renderProducts();
}else{

$("brandSection").hidden=false;

$("brandHeading").textContent=
selectedCategory+" के लिए मोबाइल कंपनी चुनें";

$("brandSection").scrollIntoView({behavior:"smooth"});

}

};

});

/* SEARCH */

function search(){

let q=$("search").value.toLowerCase().trim();

if(!q){

if(chosenModel){
renderProducts();
}else{
renderBrands();
}

return;

}

let rows=products.filter(p=>
JSON.stringify(p).toLowerCase().includes(q)
);

$("brandSection").hidden=true;
$("modelSection").hidden=true;
$("productSection").hidden=false;

$("products").innerHTML=rows.map(p=>`

<article class="card">

<img src="${safe(pics(p)[0]||"")}" data-search-photo="${safe(p.id)}">

<h3>${safe(p[col("productName")])}</h3>

<p>${safe(p[col("productType")])}</p>

<p>${money(p[col("productPrice")])}</p>

<button data-search-add="${safe(p.id)}">
Add to Cart
</button>

</article>

`).join("")||"कोई परिणाम नहीं";

document.querySelectorAll("[data-search-add]").forEach(b=>{
b.onclick=()=>addCart(b.dataset.searchAdd);
});

document.querySelectorAll("[data-search-photo]").forEach(b=>{
b.onclick=()=>{
let p=products.find(x=>String(x.id)===b.dataset.searchPhoto);
openPhotos(p);
};
});

}

/* PHOTO GALLERY */

function openPhotos(p){

photos=pics(p);
photoAt=0;
showPhoto();

}

function showPhoto(){

if(!photos.length)return;

$("photoModal").hidden=false;

$("photoLarge").src=photos[photoAt];

say("photoCounter",
`${photoAt+1}/${photos.length}`);

$("photoPrev").style.display=
photos.length>1?"block":"none";

$("photoNext").style.display=
photos.length>1?"block":"none";

}

function movePhoto(d){

if(!photos.length)return;

photoAt=(photoAt+d+photos.length)%photos.length;

showPhoto();

}

/* CART */

function addCart(id){

let p=products.find(x=>String(x.id)===String(id));

if(!p)return;

let item=cart.find(x=>String(x.p.id)===String(id));

if(item)item.qty++;

else cart.push({p,qty:1});

renderCart();

}

function renderCart(){

$("cartCount").textContent=
cart.reduce((n,x)=>n+x.qty,0);

$("cartItems").innerHTML=cart.map(x=>`

<p>

${safe(x.p[col("productName")])}
× ${x.qty}
—
${money(Number(x.p[col("productPrice")])*x.qty)}

<button data-rm="${safe(x.p.id)}">−</button>

<button data-plus="${safe(x.p.id)}">+</button>

</p>

`).join("")||"Cart खाली है";

$("cartTotal").textContent=money(

cart.reduce((n,x)=>
n+Number(x.p[col("productPrice")])*x.qty,0)

);

document.querySelectorAll("[data-rm]").forEach(b=>{
b.onclick=()=>qty(b.dataset.rm,-1);
});

document.querySelectorAll("[data-plus]").forEach(b=>{
b.onclick=()=>qty(b.dataset.plus,1);
});

}

function qty(id,d){

let x=cart.find(x=>String(x.p.id)===String(id));

if(x){

x.qty+=d;

if(x.qty<1){
cart=cart.filter(y=>y!==x);
}

}

renderCart();

}

/* WHATSAPP ORDER */

function checkout(){

if(!cart.length)return alert("Cart खाली है");

let total=cart.reduce((n,x)=>
n+Number(x.p[col("productPrice")])*x.qty,0);

let txt="नमस्ते, मेरा ऑर्डर:\n"+

cart.map(x=>
`${x.p[col("productName")]} x ${x.qty}`
).join("\n")+

"\nकुल: "+money(total);

open(
`https://wa.me/${C.WHATSAPP_NUMBER}?text=${encodeURIComponent(txt)}`,
"_blank"
);

}

/* ADMIN LOGIN */

async function login(){

say("loginMsg","Login हो रहा है...");

let {data,error}=await db.auth.signInWithPassword({

email:$("email").value.trim(),

password:$("password").value

});

if(error){
say("loginMsg",error.message);
return;
}

let {data:admin,error:ae}=await db.from(table("adminUsers"))

.select("*")

.eq(col("adminUserId"),data.user.id)

.maybeSingle();

if(ae||!admin){

say("loginMsg",
ae?.message||"यह user admin_users में registered नहीं है");

await db.auth.signOut();

return;

}

$("loginBox").hidden=true;
$("adminBox").hidden=false;

say("adminEmail",data.user.email);

fillBrands();
adminList();

}

async function logout(){

await db.auth.signOut();

$("adminBox").hidden=true;
$("loginBox").hidden=false;

}

/* ADMIN BRANDS AND MODELS */

function fillBrands(){

let opts=brands.map(b=>
`<option value="${safe(b.id)}">${safe(brandName(b))}</option>`
).join("");

$("brandSelect").innerHTML=opts;
$("productBrand").innerHTML=opts;

fillModels();

}

function fillModels(){

let id=$("productBrand").value;

$("productModel").innerHTML=models.filter(m=>
String(m[col("modelBrandId")])===String(id)
).map(m=>
`<option value="${safe(m.id)}">
${safe(m[col("modelName")])}
</option>`
).join("");

}

async function addBrand(){

let en=$("brandEn").value.trim();
let hi=$("brandHi").value.trim();

let {error}=await db.from(table("brands")).insert({

[col("brandNameEn")]:en,

[col("brandNameHi")]:hi||en

});

if(error)return say("adminMsg",error.message);

say("adminMsg","Brand added");

await load();
fillBrands();

}

async function addModel(){

let {error}=await db.from(table("models")).insert({

[col("modelBrandId")]:$("brandSelect").value,

[col("modelName")]:$("modelName").value.trim()

});

if(error)return say("adminMsg",error.message);

say("adminMsg","Model added");

await load();
fillBrands();

}

/* ADD PRODUCT */

async function addProduct(){

let fs=[...$("productImage").files];

if(!fs.length){
return say("adminMsg","कम से कम एक फोटो चुनें");
}

try{

let urls=[];

for(let f of fs){

let path=
Date.now()+"-"+Math.random().toString(36).slice(2)+"-"+f.name;

let {error}=await db.storage

.from(C.STORAGE_BUCKET||"product-images")

.upload(path,f);

if(error)throw error;

urls.push(

db.storage

.from(C.STORAGE_BUCKET||"product-images")

.getPublicUrl(path).data.publicUrl

);

}

let row={

[col("productModelId")]:$("productModel").value,

[col("productName")]:$("productName").value.trim(),

[col("productType")]:$("productType").value,

[col("productPrice")]:Number($("productPrice").value),

[col("productStock")]:Number($("productStock").value),

[col("productImage")]:urls[0],

[col("productImages")]:JSON.stringify(urls),

[col("productActive")]:true

};

let {error}=await db.from(table("products")).insert(row);

if(error)throw error;

say("adminMsg","Product saved");

$("productName").value="";
$("productPrice").value="";
$("productStock").value="";
$("productImage").value="";

await load();
adminList();

}catch(e){

say("adminMsg",e.message);

}

}

/* ADMIN PRODUCT LIST */

function adminList(){

$("adminProducts").innerHTML=products.map(p=>`

<div class="adminrow">

${safe(p[col("productName")])}
—
${money(p[col("productPrice")])}

<button data-del="${safe(p.id)}">Delete</button>

</div>

`).join("");

document.querySelectorAll("[data-del]").forEach(b=>{

b.onclick=async()=>{

if(!confirm("Delete product?"))return;

let {error}=await db.from(table("products"))

.delete()

.eq("id",b.dataset.del);

if(error){

say("adminMsg",error.message);

}else{

await load();
adminList();

}

};

});

}

document.addEventListener("DOMContentLoaded",start);

})();
