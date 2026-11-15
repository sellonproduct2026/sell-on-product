/* =====================================
   SELL ON PRODUCT
   COMPLETE SCRIPT - PART 1/5
===================================== */

const $ = id => document.getElementById(id);

let lang = 'hi';

let sb = null;
let adminUser = null;

let brands = [];
let models = [];
let products = [];

let selectedBrand = null;
let selectedModel = null;

let cart = [];

let currentPhotos = [];
let currentPhotoIndex = 0;


/* =====================================
   SUPABASE INITIALIZATION
===================================== */

function initClient() {
  if (!window.supabase) {
    alert('Supabase library load नहीं हुई।');
    return;
  }

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    alert('config.js में Supabase Configuration चेक करें।');
    return;
  }

  sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );
}


/* =====================================
   LANGUAGE SYSTEM
===================================== */

function setLang() {
  lang = lang === 'hi' ? 'en' : 'hi';

  document.querySelectorAll('[data-hi][data-en]').forEach(el => {
    el.textContent = el.dataset[lang];
  });

  document.querySelectorAll('[data-ph-hi][data-ph-en]').forEach(el => {
    el.placeholder = el.dataset[
      lang === 'hi' ? 'phHi' : 'phEn'
    ];
  });

  const btn = $('langBtn');

  if (btn) {
    btn.textContent = lang === 'hi' ? 'English' : 'हिंदी';
  }

  renderBrands();
  renderModels();
  renderProducts();
}

if ($('langBtn')) {
  $('langBtn').addEventListener('click', setLang);
}


/* =====================================
   ADMIN MODAL OPEN / CLOSE
===================================== */

function openAdmin() {
  const modal = $('adminModal');

  if (modal) {
    modal.hidden = false;
  }
}

function closeAdmin() {
  const modal = $('adminModal');

  if (modal) {
    modal.hidden = true;
  }
}

if ($('adminOpen')) {
  $('adminOpen').addEventListener('click', openAdmin);
}

if ($('adminClose')) {
  $('adminClose').addEventListener('click', closeAdmin);
}


/* =====================================
   LOAD ALL DATA
===================================== */

async function loadAll() {
  if (!sb) return;

  const [brandResult, modelResult, productResult] =
    await Promise.all([
      sb.from('brands').select('*').order('name'),
      sb.from('models').select('*').order('name'),
      sb.from('products').select('*').order('created_at', {
        ascending: false
      })
    ]);

  if (brandResult.error) {
    console.error('Brand Error:', brandResult.error);
  }

  if (modelResult.error) {
    console.error('Model Error:', modelResult.error);
  }

  if (productResult.error) {
    console.error('Product Error:', productResult.error);
  }

  brands = brandResult.data || [];
  models = modelResult.data || [];
  products = productResult.data || [];

  renderBrands();
  renderModels();
  renderProducts();
}


/* =====================================
   RENDER BRANDS
===================================== */

function renderBrands() {
  const box = $('brands');

  if (!box) return;

  const search = $('search')?.value.toLowerCase().trim() || '';

  const filtered = brands.filter(brand => {
    const name = (brand.name || '').toLowerCase();
    return name.includes(search);
  });

  if (filtered.length === 0) {
    box.innerHTML = '<p>कोई कंपनी नहीं मिली।</p>';
    return;
  }

  box.innerHTML = filtered.map(brand => `
    <button
      class="brand-card"
      type="button"
      onclick="pickBrand('${brand.id}')">
      ${brand.name}
    </button>
  `).join('');
}


/* =====================================
   SELECT BRAND
===================================== */

function pickBrand(brandId) {
  selectedBrand = brands.find(b => b.id === brandId);

  if (!selectedBrand) return;

  selectedModel = null;

  if ($('modelTitle')) {
    $('modelTitle').textContent = selectedBrand.name;
  }

  if ($('modelSection')) {
    $('modelSection').hidden = false;
  }

  if ($('productSection')) {
    $('productSection').hidden = true;
  }

  renderModels();

  $('modelSection')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}


/* =====================================
   RENDER MODELS
===================================== */

function renderModels() {
  const box = $('models');

  if (!box) return;

  if (!selectedBrand) {
    box.innerHTML = '';
    return;
  }

  const filtered = models.filter(
    model => model.brand_id === selectedBrand.id
  );

  if (filtered.length === 0) {
    box.innerHTML = '<p>इस कंपनी का कोई मॉडल उपलब्ध नहीं है।</p>';
    return;
  }

  box.innerHTML = filtered.map(model => `
    <button
      class="model-card"
      type="button"
      onclick="pickModel('${model.id}')">
      ${model.name}
    </button>
  `).join('');
}


/* =====================================
   SELECT MODEL
===================================== */

function pickModel(modelId) {
  selectedModel = models.find(m => m.id === modelId);

  if (!selectedModel) return;

  if ($('productTitle')) {
    $('productTitle').textContent =
      selectedBrand.name + ' - ' + selectedModel.name;
  }

  if ($('productSection')) {
    $('productSection').hidden = false;
  }

  renderProducts();

  $('productSection')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}
/* =====================================
   GET PRODUCT IMAGES
===================================== */

function getProductImages(product) {
  let images = [];

  if (Array.isArray(product.image_urls)) {
    images = product.image_urls;
  } else if (typeof product.image_urls === 'string') {
    try {
      images = JSON.parse(product.image_urls);
    } catch (error) {
      images = [];
    }
  }

  if (!images.length && product.image_url) {
    images = [product.image_url];
  }

  return images.filter(Boolean);
}


/* =====================================
   RENDER PRODUCTS
===================================== */

function renderProducts() {
  const box = $('products');

  if (!box) return;

  if (!selectedModel) {
    box.innerHTML = '';
    return;
  }

  const filterType = $('typeFilter')?.value || '';

  const filtered = products.filter(product => {
    return (
      product.model_id === selectedModel.id &&
      product.is_active === true &&
      (!filterType || product.cover_type === filterType)
    );
  });

  if (filtered.length === 0) {
    box.innerHTML = '<p>इस मॉडल के लिए अभी कोई कवर उपलब्ध नहीं है।</p>';
    return;
  }

  box.innerHTML = filtered.map(product => {
    const images = getProductImages(product);

    const firstImage = images[0] || '';

    return `
      <div class="product-card">

        <div class="product-gallery">
          <img
            class="product-main-image"
            src="${firstImage}"
            alt="${product.title}"
            onclick="openPhotoViewer('${product.id}',0)"
          >

          <div class="product-thumbnails">
            ${images.map((image, index) => `
              <img
                src="${image}"
                alt="Product image ${index + 1}"
                onclick="openPhotoViewer('${product.id}',${index})"
              >
            `).join('')}
          </div>
        </div>

        <h3>${product.title}</h3>

        <p>${product.cover_type || ''}</p>

        <h3>₹${product.price}</h3>

        <p>Stock: ${product.stock}</p>

        <button
          type="button"
          onclick="addToCart('${product.id}')"
          ${Number(product.stock) <= 0 ? 'disabled' : ''}>
          ${Number(product.stock) <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>

      </div>
    `;
  }).join('');
}


/* =====================================
   PHOTO VIEWER
===================================== */

function createPhotoViewer() {
  if ($('photoViewer')) return;

  const viewer = document.createElement('div');

  viewer.id = 'photoViewer';

  viewer.style.cssText = `
    display:none;
    position:fixed;
    inset:0;
    z-index:99999;
    background:rgba(0,0,0,0.95);
    align-items:center;
    justify-content:center;
    flex-direction:column;
  `;

  viewer.innerHTML = `
    <button id="photoClose"
      style="position:absolute;top:15px;right:20px;font-size:30px;">
      ✕
    </button>

    <button id="photoPrev"
      style="position:absolute;left:10px;font-size:30px;">
      ❮
    </button>

    <img id="photoLarge"
      style="max-width:90%;max-height:75%;object-fit:contain;">

    <button id="photoNext"
      style="position:absolute;right:10px;font-size:30px;">
      ❯
    </button>

    <p id="photoCounter" style="color:white;"></p>
  `;

  document.body.appendChild(viewer);

  $('photoClose').addEventListener('click', closePhotoViewer);
  $('photoPrev').addEventListener('click', previousPhoto);
  $('photoNext').addEventListener('click', nextPhoto);
}


/* =====================================
   OPEN PHOTO VIEWER
===================================== */

function openPhotoViewer(productId, index) {
  const product = products.find(p => p.id === productId);

  if (!product) return;

  currentPhotos = getProductImages(product);

  if (!currentPhotos.length) return;

  currentPhotoIndex = index;

  createPhotoViewer();
  updatePhotoViewer();

  $('photoViewer').style.display = 'flex';
}


/* =====================================
   UPDATE PHOTO VIEWER
===================================== */

function updatePhotoViewer() {
  if (!currentPhotos.length) return;

  $('photoLarge').src = currentPhotos[currentPhotoIndex];

  $('photoCounter').textContent =
    `${currentPhotoIndex + 1} / ${currentPhotos.length}`;
}


/* =====================================
   NEXT PHOTO
===================================== */

function nextPhoto() {
  if (!currentPhotos.length) return;

  currentPhotoIndex++;

  if (currentPhotoIndex >= currentPhotos.length) {
    currentPhotoIndex = 0;
  }

  updatePhotoViewer();
}


/* =====================================
   PREVIOUS PHOTO
===================================== */

function previousPhoto() {
  if (!currentPhotos.length) return;

  currentPhotoIndex--;

  if (currentPhotoIndex < 0) {
    currentPhotoIndex = currentPhotos.length - 1;
  }

  updatePhotoViewer();
}


/* =====================================
   CLOSE PHOTO VIEWER
===================================== */

function closePhotoViewer() {
  if ($('photoViewer')) {
    $('photoViewer').style.display = 'none';
  }
}


/* =====================================
   PHOTO KEYBOARD CONTROLS
===================================== */

document.addEventListener('keydown', event => {
  if (!$('photoViewer')) return;

  if ($('photoViewer').style.display !== 'flex') return;

  if (event.key === 'ArrowRight') {
    nextPhoto();
  }

  if (event.key === 'ArrowLeft') {
    previousPhoto();
  }

  if (event.key === 'Escape') {
    closePhotoViewer();
  }
});


/* =====================================
   SEARCH AND FILTER
===================================== */

if ($('search')) {
  $('search').addEventListener('input', renderBrands);
}

if ($('typeFilter')) {
  $('typeFilter').addEventListener('change', renderProducts);
}


/* =====================================
   BACK BUTTONS
===================================== */

if ($('backBrands')) {
  $('backBrands').addEventListener('click', () => {
    selectedBrand = null;
    selectedModel = null;

    $('modelSection').hidden = true;
    $('productSection').hidden = true;

    renderBrands();
  });
}

if ($('backModels')) {
  $('backModels').addEventListener('click', () => {
    selectedModel = null;

    $('productSection').hidden = true;

    renderModels();
  });
}
/* =====================================
   CART SYSTEM
===================================== */

function addToCart(productId) {
  const product = products.find(p => p.id === productId);

  if (!product) return;

  if (Number(product.stock) <= 0) {
    alert('यह प्रोडक्ट अभी उपलब्ध नहीं है।');
    return;
  }

  const existing = cart.find(p => p.id === productId);

  if (existing) {
    if (existing.qty >= Number(product.stock)) {
      alert('इतना स्टॉक उपलब्ध नहीं है।');
      return;
    }

    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      qty: 1,
      image: getProductImages(product)[0] || ''
    });
  }

  renderCart();
}

function changeQty(productId, change) {
  const item = cart.find(p => p.id === productId);

  if (!item) return;

  const product = products.find(p => p.id === productId);
  const maxStock = product ? Number(product.stock) : 0;

  const newQty = item.qty + change;

  if (newQty <= 0) {
    cart = cart.filter(p => p.id !== productId);
  } else if (newQty > maxStock) {
    alert('इतना स्टॉक उपलब्ध नहीं है।');
  } else {
    item.qty = newQty;
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(p => p.id !== productId);
  renderCart();
}

function renderCart() {
  const box = $('cartItems');

  if (!box) return;

  const count = cart.reduce((sum, p) => sum + p.qty, 0);
  const total = cart.reduce((sum, p) => sum + p.price * p.qty, 0);

  if ($('cartCount')) {
    $('cartCount').textContent = count;
  }

  if ($('cartTotal')) {
    $('cartTotal').textContent = 'कुल: ₹' + total;
  }

  if (cart.length === 0) {
    box.innerHTML = '<p>आपका कार्ट खाली है।</p>';
    return;
  }

  box.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}">

      <div>
        <h4>${item.title}</h4>
        <p>₹${item.price}</p>

        <button onclick="changeQty('${item.id}',-1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty('${item.id}',1)">+</button>

        <button onclick="removeFromCart('${item.id}')">हटाएँ</button>
      </div>
    </div>
  `).join('');
}


/* =====================================
   OPEN / CLOSE CART
===================================== */

function openCart() {
  if ($('cartPanel')) {
    $('cartPanel').hidden = false;
  }
}

function closeCart() {
  if ($('cartPanel')) {
    $('cartPanel').hidden = true;
  }
}

if ($('cartBtn')) {
  $('cartBtn').addEventListener('click', openCart);
}

if ($('cartClose')) {
  $('cartClose').addEventListener('click', closeCart);
}


/* =====================================
   WHATSAPP CHECKOUT
===================================== */

if ($('checkout')) {
  $('checkout').addEventListener('click', () => {
    if (cart.length === 0) {
      alert('आपका कार्ट खाली है।');
      return;
    }

    let total = 0;

    let message = 'नमस्ते, मुझे ये प्रोडक्ट ऑर्डर करने हैं:\n\n';

    cart.forEach((item, index) => {
      const subtotal = item.price * item.qty;

      total += subtotal;

      message += `${index + 1}. ${item.title}\n`;
      message += `Quantity: ${item.qty}\n`;
      message += `Price: ₹${item.price}\n`;
      message += `Total: ₹${subtotal}\n\n`;
    });

    message += `कुल कीमत: ₹${total}`;

    const number = '919584247135';

    window.open(
      'https://wa.me/' + number + '?text=' +
      encodeURIComponent(message),
      '_blank'
    );
  });
}


/* =====================================
   ADMIN MESSAGE
===================================== */

function adminMessage(message) {
  if ($('loginMsg')) {
    $('loginMsg').textContent = message;
  }

  if ($('adminMsg')) {
    $('adminMsg').textContent = message;
  }
}


/* =====================================
   CHECK ADMIN USER
===================================== */

async function adminReady() {
  if (!sb) return false;

  const {
    data: { session },
    error: sessionError
  } = await sb.auth.getSession();

  if (sessionError || !session) {
    adminUser = null;
    return false;
  }

  const { data, error } = await sb
    .from('admin_users')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !data) {
    adminUser = null;
    return false;
  }

  adminUser = session.user;

  return true;
}


/* =====================================
   ADMIN LOGIN
===================================== */

if ($('loginBtn')) {
  $('loginBtn').addEventListener('click', async () => {
    if (!sb) {
      adminMessage('Supabase कनेक्शन उपलब्ध नहीं है।');
      return;
    }

    const email = $('email')?.value.trim();
    const password = $('password')?.value;

    if (!email || !password) {
      adminMessage('ईमेल और पासवर्ड भरें।');
      return;
    }

    $('loginBtn').disabled = true;
    $('loginBtn').textContent = 'Logging in...';

    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        adminMessage('Login Error: ' + error.message);
        return;
      }

      const { data: adminData, error: adminError } = await sb
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (adminError || !adminData) {
        await sb.auth.signOut();

        adminMessage('इस अकाउंट को Admin की अनुमति नहीं है।');
        return;
      }

      adminUser = data.user;

      $('loginBox').hidden = true;
      $('adminBox').hidden = false;

      if ($('adminEmail')) {
        $('adminEmail').textContent = data.user.email || '';
      }

      adminMessage('');

      await fillAdminSelects();
      await loadAdminProducts();

    } catch (error) {
      adminMessage('Error: ' + error.message);

    } finally {
      $('loginBtn').disabled = false;
      $('loginBtn').textContent = 'Login';
    }
  });
}


/* =====================================
   ADMIN LOGOUT
===================================== */

if ($('logoutBtn')) {
  $('logoutBtn').addEventListener('click', async () => {
    if (!sb) return;

    const { error } = await sb.auth.signOut();

    if (error) {
      alert('Logout Error: ' + error.message);
      return;
    }

    adminUser = null;

    $('adminBox').hidden = true;
    $('loginBox').hidden = false;

    if ($('email')) $('email').value = '';
    if ($('password')) $('password').value = '';

    adminMessage('आप सफलतापूर्वक Logout हो गए।');
  });
  }
/* =====================================
   FILL ADMIN BRAND SELECTS
===================================== */

async function fillAdminSelects() {
  const brandSelect = $('brandSelect');
  const productBrand = $('productBrand');

  if (brandSelect) {
    brandSelect.innerHTML = '<option value="">Select Brand</option>';

    brands.forEach(brand => {
      brandSelect.innerHTML += `
        <option value="${brand.id}">${brand.name}</option>
      `;
    });
  }

  if (productBrand) {
    productBrand.innerHTML = '<option value="">Select Brand</option>';

    brands.forEach(brand => {
      productBrand.innerHTML += `
        <option value="${brand.id}">${brand.name}</option>
      `;
    });
  }

  await fillModelOptions();
}


/* =====================================
   FILL MOBILE MODEL OPTIONS
===================================== */

async function fillModelOptions() {
  const modelSelect = $('productModel');

  if (!modelSelect) return;

  const brandId = $('productBrand')?.value;

  modelSelect.innerHTML = '<option value="">Select Model</option>';

  if (!brandId) return;

  const filtered = models.filter(
    model => model.brand_id === brandId
  );

  filtered.forEach(model => {
    modelSelect.innerHTML += `
      <option value="${model.id}">${model.name}</option>
    `;
  });
}

if ($('productBrand')) {
  $('productBrand').addEventListener('change', fillModelOptions);
}


/* =====================================
   ADD BRAND
===================================== */

if ($('addBrand')) {
  $('addBrand').addEventListener('click', async () => {
    if (!(await adminReady())) {
      alert('पहले Admin Login करें।');
      return;
    }

    const name = $('brandEn')?.value.trim();

    if (!name) {
      alert('Brand का नाम लिखें।');
      return;
    }

    const { error } = await sb
      .from('brands')
      .insert({
        name: name
      });

    if (error) {
      alert('Brand Error: ' + error.message);
      return;
    }

    $('brandEn').value = '';

    if ($('brandHi')) {
      $('brandHi').value = '';
    }

    alert('Brand सफलतापूर्वक जुड़ गया।');

    await loadAll();
    await fillAdminSelects();
  });
}


/* =====================================
   ADD MOBILE MODEL
===================================== */

if ($('addModel')) {
  $('addModel').addEventListener('click', async () => {
    if (!(await adminReady())) {
      alert('पहले Admin Login करें।');
      return;
    }

    const brandId = $('brandSelect')?.value;
    const modelName = $('modelName')?.value.trim();

    if (!brandId || !modelName) {
      alert('Brand और Model दोनों चुनें।');
      return;
    }

    const { error } = await sb
      .from('models')
      .insert({
        brand_id: brandId,
        name: modelName
      });

    if (error) {
      alert('Model Error: ' + error.message);
      return;
    }

    $('modelName').value = '';

    alert('Mobile Model सफलतापूर्वक जुड़ गया।');

    await loadAll();
    await fillAdminSelects();
  });
}


/* =====================================
   GET STORAGE IMAGE PATH
===================================== */

function getStoragePathFromUrl(url) {
  try {
    const parsed = new URL(url);

    const marker =
      '/storage/v1/object/public/product-images/';

    const index = parsed.pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(
      parsed.pathname.slice(index + marker.length)
    );

  } catch (error) {
    console.error('Image URL Error:', error);
    return null;
  }
}


/* =====================================
   ADD PRODUCT WITH SEPARATE FOLDER
===================================== */

if ($('addProduct')) {
  $('addProduct').addEventListener('click', async () => {
    if (!(await adminReady())) {
      alert('पहले Admin Login करें।');
      return;
    }

    const modelId = $('productModel')?.value;
    const title = $('productName')?.value.trim();
    const coverType = $('productType')?.value || '';

    const price = Number($('productPrice')?.value);
    const stock = Number($('productStock')?.value);

    const files = Array.from(
      $('productImage')?.files || []
    );

    if (!modelId) {
      alert('Mobile Model चुनें।');
      return;
    }

    if (!title) {
      alert('Product का नाम लिखें।');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert('सही Product Price लिखें।');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      alert('सही Stock लिखें।');
      return;
    }

    if (files.length < 6) {
      alert('कम से कम 6 फोटो चुनें।');
      return;
    }

    $('addProduct').disabled = true;
    $('addProduct').textContent = 'Uploading...';

    const folderId =
      window.crypto?.randomUUID?.() ||
      Date.now() + '-' + Math.random().toString(36).slice(2);

    const uploadedPaths = [];
    const imageUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const safeName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        );

        const path = `${folderId}/${i + 1}-${safeName}`;

        const { error: uploadError } = await sb
          .storage
          .from('product-images')
          .upload(path, file, {
            upsert: false,
            contentType: file.type
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(path);

        const { data } = sb
          .storage
          .from('product-images')
          .getPublicUrl(path);

        imageUrls.push(data.publicUrl);
      }

      const { error: insertError } = await sb
        .from('products')
        .insert({
          model_id: modelId,
          title: title,
          cover_type: coverType,
          price: price,
          stock: stock,
          image_url: imageUrls[0],
          image_urls: imageUrls,
          is_active: true
        });

      if (insertError) {
        throw insertError;
      }

      $('productName').value = '';
      $('productPrice').value = '';
      $('productStock').value = '';
      $('productImage').value = '';

      alert('Product सफलतापूर्वक जुड़ गया।');

      await loadAll();
      await loadAdminProducts();

    } catch (error) {
      console.error('Product Upload Error:', error);

      if (uploadedPaths.length) {
        const { error: cleanupError } = await sb
          .storage
          .from('product-images')
          .remove(uploadedPaths);

        if (cleanupError) {
          console.error('Cleanup Error:', cleanupError);
        }
      }

      alert('Product Upload Error: ' + error.message);

    } finally {
      $('addProduct').disabled = false;
      $('addProduct').textContent = 'Upload & Add Product';
    }
  });
}
/* =====================================
   LOAD ADMIN PRODUCTS
===================================== */

async function loadAdminProducts() {
  if (!sb || !(await adminReady())) return;

  const box = $('adminProducts');

  if (!box) return;

  box.innerHTML = '<p>Loading Products...</p>';

  const { data, error } = await sb
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    box.innerHTML = 'Error: ' + error.message;
    return;
  }

  if (!data || data.length === 0) {
    box.innerHTML = '<p>अभी कोई Product नहीं है।</p>';
    return;
  }

  box.innerHTML = data.map(product => `
    <div class="admin-product-item">
      <h4>${product.title}</h4>

      <p>Price: ₹${product.price}</p>
      <p>Stock: ${product.stock}</p>

      <p>
        Status:
        ${product.is_active ? 'Active' : 'Hidden'}
      </p>

      <button
        type="button"
        onclick="toggleProduct('${product.id}', ${!product.is_active})">
        ${product.is_active ? 'Hide Product' : 'Show Product'}
      </button>

      <button
        type="button"
        onclick="deleteProduct('${product.id}')">
        Delete Product
      </button>
    </div>
  `).join('');
}


/* =====================================
   HIDE / SHOW PRODUCT
===================================== */

async function toggleProduct(productId, status) {
  if (!(await adminReady())) {
    alert('पहले Admin Login करें।');
    return;
  }

  const { error } = await sb
    .from('products')
    .update({
      is_active: status
    })
    .eq('id', productId);

  if (error) {
    alert('Product Update Error: ' + error.message);
    return;
  }

  await loadAll();
  await loadAdminProducts();
}


/* =====================================
   DELETE PRODUCT AND IMAGES
===================================== */

async function deleteProduct(productId) {
  if (!(await adminReady())) {
    alert('पहले Admin Login करें।');
    return;
  }

  const confirmed = confirm(
    'क्या आप इस Product और इसकी सभी Photos को Delete करना चाहते हैं?'
  );

  if (!confirmed) return;

  const { data: product, error: fetchError } = await sb
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    alert('Product नहीं मिला।');
    return;
  }

  const imageUrls = getProductImages(product);

  const storagePaths = [
    ...new Set(
      imageUrls
        .map(url => getStoragePathFromUrl(url))
        .filter(Boolean)
    )
  ];

  // पहले Product की Photos हटाएँ
  if (storagePaths.length > 0) {
    const { error: storageError } = await sb
      .storage
      .from('product-images')
      .remove(storagePaths);

    if (storageError) {
      alert(
        'Photos Delete नहीं हुईं:\n' +
        storageError.message +
        '\n\nStorage DELETE Permission चेक करें।'
      );
      return;
    }
  }

  // फिर Database से Product हटाएँ
  const { error: deleteError } = await sb
    .from('products')
    .delete()
    .eq('id', productId);

  if (deleteError) {
    alert(
      'Photos हट गई हैं, लेकिन Product Database से नहीं हटा:\n' +
      deleteError.message
    );
    return;
  }

  alert('Product और उसकी Photos Delete हो गई हैं।');

  await loadAll();
  await loadAdminProducts();
}


/* =====================================
   INITIALIZE WEBSITE
===================================== */

(async function startWebsite() {
  try {
    initClient();

    if (!sb) return;

    await loadAll();

    const isAdmin = await adminReady();

    if (isAdmin) {
      if ($('loginBox')) {
        $('loginBox').hidden = true;
      }

      if ($('adminBox')) {
        $('adminBox').hidden = false;
      }

      if ($('adminEmail')) {
        $('adminEmail').textContent = adminUser.email || '';
      }

      await fillAdminSelects();
      await loadAdminProducts();
    }

    renderCart();

  } catch (error) {
    console.error('Website Start Error:', error);
  }
})();
