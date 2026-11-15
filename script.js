// अपना 10 अंकों का WhatsApp नंबर country code सहित लिखें, जैसे भारत के लिए 91XXXXXXXXXX
const WHATSAPP_NUMBER = "91XXXXXXXXXX";

const products = [
  {id:1,name:"Premium Silicone Back Cover",hi:"प्रीमियम सिलिकॉन बैक कवर",model:"For popular Android models",category:"Back Cover",price:199,color:"#f39ab2"},
  {id:2,name:"Transparent Shockproof Cover",hi:"ट्रांसपेरेंट शॉकप्रूफ कवर",model:"Clear protective case",category:"Back Cover",price:149,color:"#a7c8ee"},
  {id:3,name:"Leather Flip Cover",hi:"लेदर फ्लिप कवर",model:"Wallet-style protection",category:"Flip Cover",price:249,color:"#b58b69"},
  {id:4,name:"Designer Printed Cover",hi:"डिजाइनर प्रिंटेड कवर",model:"Stylish printed finish",category:"Back Cover",price:179,color:"#a89af2"},
  {id:5,name:"Magnetic Flip Cover",hi:"मैग्नेटिक फ्लिप कवर",model:"Full body protection",category:"Flip Cover",price:299,color:"#7e8d9e"},
  {id:6,name:"9D Tempered Glass",hi:"9D टेम्पर्ड ग्लास",model:"Screen protection",category:"Tempered Glass",price:99,color:"#8ed5cb"},
  {id:7,name:"Matte Finish Back Cover",hi:"मैट फिनिश बैक कवर",model:"Anti-fingerprint finish",category:"Back Cover",price:189,color:"#e6b66e"},
  {id:8,name:"Camera Protection Cover",hi:"कैमरा प्रोटेक्शन कवर",model:"Raised camera guard",category:"Back Cover",price:219,color:"#b6a6e8"}
];
let cart = [];
let language = "hi";
let category = "All";

const grid = document.getElementById("productGrid");
const search = document.getElementById("searchInput");

function renderProducts(){
  const term = search.value.toLowerCase();
  const visible = products.filter(p => (category==="All" || p.category===category) &&
    (p.name.toLowerCase().includes(term) || p.hi.includes(term) || p.model.toLowerCase().includes(term)));
  grid.innerHTML = visible.length ? visible.map(p => `
    <article class="product-card">
      <div class="product-art"><div class="case-shape" style="--case:${p.color}"></div></div>
      <div class="product-info">
        <h3>${language==="hi"?p.hi:p.name}</h3>
        <p>${p.model}</p>
        <div class="price-row"><span class="price">₹${p.price}</span><button class="add-btn" onclick="addToCart(${p.id})">${language==="hi"?"कार्ट में जोड़ें":"Add to Cart"}</button></div>
      </div>
    </article>`).join("") : `<p class="empty">${language==="hi"?"कोई प्रोडक्ट नहीं मिला।":"No products found."}</p>`;
}
function addToCart(id){const item=cart.find(x=>x.id===id);if(item)item.qty++;else cart.push({id,qty:1});renderCart();}
function removeFromCart(id){cart=cart.filter(x=>x.id!==id);renderCart();}
function renderCart(){
  document.getElementById("cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
  const items=document.getElementById("cartItems");
  items.innerHTML=cart.length?cart.map(x=>{const p=products.find(y=>y.id===x.id);return `<div class="cart-line"><span>${language==="hi"?p.hi:p.name} × ${x.qty}<br><b>₹${p.price*x.qty}</b></span><button onclick="removeFromCart(${p.id})">${language==="hi"?"हटाएँ":"Remove"}</button></div>`}).join(""):`<p class="empty">${language==="hi"?"आपका कार्ट खाली है।":"Your cart is empty."}</p>`;
  const total=cart.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0);
  document.getElementById("cartTotal").textContent="₹"+total;
}
function setLanguage(){
  language=language==="hi"?"en":"hi";
  document.documentElement.lang=language;
  document.querySelectorAll("[data-hi]").forEach(el=>el.textContent=el.dataset[language]);
  document.getElementById("langBtn").textContent=language==="hi"?"English":"हिंदी";
  search.placeholder=language==="hi"?"मॉडल या प्रोडक्ट खोजें...":"Search model or product...";
  document.querySelectorAll(".filter").forEach(b=>b.textContent=b.dataset[language]);
  renderProducts();renderCart();
}
document.getElementById("langBtn").addEventListener("click",setLanguage);
document.getElementById("filters").addEventListener("click",e=>{const b=e.target.closest("button[data-category]");if(!b)return;category=b.dataset.category;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProducts();});
search.addEventListener("input",renderProducts);
const panel=document.getElementById("cartPanel"),overlay=document.getElementById("overlay");
function openCart(){panel.classList.add("open");overlay.classList.add("show");panel.setAttribute("aria-hidden","false");}
function closeCart(){panel.classList.remove("open");overlay.classList.remove("show");panel.setAttribute("aria-hidden","true");}
document.getElementById("cartBtn").addEventListener("click",openCart);
document.getElementById("closeCart").addEventListener("click",closeCart);
overlay.addEventListener("click",closeCart);
document.getElementById("checkoutBtn").addEventListener("click",()=>{
  if(!cart.length){alert(language==="hi"?"पहले कार्ट में प्रोडक्ट जोड़ें।":"Please add products to your cart first.");return;}
  if(WHATSAPP_NUMBER.includes("X")){alert(language==="hi"?"पहले script.js में अपना WhatsApp नंबर डालें।":"Please add your WhatsApp number in script.js first.");return;}
  const lines=cart.map(x=>{const p=products.find(y=>y.id===x.id);return `${language==="hi"?p.hi:p.name} x ${x.qty} = ₹${p.price*x.qty}`;});
  const total=cart.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0);
  const msg=(language==="hi"?"नमस्ते, मुझे ये प्रोडक्ट ऑर्डर करने हैं:\n":"Hello, I want to order:\n")+lines.join("\n")+`\nTotal: ₹${total}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank");
});
document.getElementById("year").textContent=new Date().getFullYear();
renderProducts();renderCart();
