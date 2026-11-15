/* SELL ON PRODUCT - PRODUCT FOLDER SYSTEM */

const $ = (id) => document.getElementById(id);

const say = (id, msg) => {
  const el = $(id);
  if (el) el.textContent = msg;
};

let lang = 'hi';

let brands = [];
let models = [];
let products = [];

let selectedBrand = null;
let selectedModel = null;

let cart = [];

let sb = null;
let adminUser = null;

/* PHOTO VIEWER */

let currentPhotos = [];
let currentPhotoIndex = 0;

/* SUPABASE CONNECTION */

function initClient() {
  if (
    !window.supabase ||
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY ||
    String(window.SUPABASE_ANON_KEY).includes('PASTE_')
  ) {
    return false;
  }

  sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  return true;
}

/* LANGUAGE */

function setLang() {
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-hi][data-en]').forEach(e => {
    e.textContent = e.dataset[lang];
  });

  $('langBtn').textContent =
    lang === 'hi' ? 'English' : 'हिन्दी';

  $('search').placeholder =
    lang === 'hi'
      ? 'कंपनी खोजें...'
      : 'Search brands...';
}

$('langBtn').addEventListener('click', () => {
  lang = lang === 'hi' ? 'en' : 'hi';
  setLang();
  renderBrands();
});

/* ADMIN MODAL */

function showAdmin() {
  $('adminModal').hidden = false;
}

$('adminOpen').addEventListener('click', () => {
  showAdmin();

  if (!sb) {
    say(
      'loginMsg',
      'Supabase config.js या इंटरनेट कनेक्शन जाँचें।'
    );
  }
});

$('adminClose').addEventListener('click', () => {
  $('adminModal').hidden = true;
});

/* LOAD DATA */

async function loadAll() {
  if (!sb) return;

  const [b, m, p] = await Promise.all([
    sb.from('brands')
      .select('*')
      .order('name_en'),

    sb.from('models')
      .select('*')
      .order('model_name'),

    sb.from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
  ]);

  const err = b.error || m.error || p.error;

  if (err) {
    console.error(err);

    say(
      'adminMsg',
      'डेटाबेस से डेटा नहीं मिला: ' + err.message
    );

    return;
  }

  brands = b.data || [];
  models = m.data || [];
  products = p.data || [];

  renderBrands();

  if (adminUser) {
    await fillAdminSelects();
  }
}

/* SHOW BRANDS */

function renderBrands() {
  const host = $('brands');
  host.innerHTML = '';

  const q = $('search').value.trim().toLowerCase();

  const list = brands.filter(b =>
    (b.name_en + ' ' + (b.name_hi || ''))
      .toLowerCase()
      .includes(q)
  );

  if (!list.length) {
    host.textContent = lang === 'hi'
      ? 'अभी कोई ब्रांड उपलब्ध नहीं है।'
      : 'No brands available yet.';

    return;
  }

  list.forEach(b => {
    const d = document.createElement('button');

    d.className = 'card brand-card';

    d.textContent = lang === 'hi'
      ? (b.name_hi || b.name_en)
      : b.name_en;

    d.addEventListener('click', () => pickBrand(b));

    host.append(d);
  });
}

/* SELECT BRAND */

function pickBrand(b) {
  selectedBrand = b;

  $('modelSection').hidden = false;
  $('productSection').hidden = true;

  $('modelTitle').textContent =
    (lang === 'hi'
      ? (b.name_hi || b.name_en)
      : b.name_en) +
    ' – ' +
    (lang === 'hi' ? 'मॉडल' : 'Models');

  const host = $('models');

  host.innerHTML = '';

  const list = models.filter(m =>
    String(m.brand_id) === String(b.id)
  );

  if (!list.length) {
    host.textContent = lang === 'hi'
      ? 'इस ब्रांड के मॉडल जल्द जोड़े जाएंगे।'
      : 'No models added for this brand yet.';
  }

  list.forEach(m => {
    const d = document.createElement('button');

    d.className = 'card model-card';
    d.textContent = m.model_name;

    d.addEventListener('click', () => pickModel(m));

    host.append(d);
  });

  $('modelSection').scrollIntoView({
    behavior: 'smooth'
  });
}

/* SELECT MODEL */

function pickModel(m) {
  selectedModel = m;

  $('productSection').hidden = false;

  $('productTitle').textContent =
    m.model_name + ' – Covers';

  renderProducts();

  $('productSection').scrollIntoView({
    behavior: 'smooth'
  });
}
/* GET ALL PRODUCT PHOTOS */

function getProductImages(p) {
  let urls = [];

  if (Array.isArray(p.image_urls)) {
    urls = p.image_urls;
  } else if (typeof p.image_urls === 'string') {
    try {
      urls = JSON.parse(p.image_urls);
    } catch (e) {}
  }

  if (!Array.isArray(urls)) {
    urls = [];
  }

  if (!urls.length && p.image_url) {
    urls = [p.image_url];
  }

  return urls.filter(Boolean);
}

/* SHOW PRODUCTS */

function renderProducts() {
  const host = $('products');

  host.innerHTML = '';

  if (!selectedModel) return;

  const list = products.filter(p =>
    String(p.model_id) === String(selectedModel.id) &&
    (!$('typeFilter').value ||
      p.cover_type === $('typeFilter').value)
  );

  if (!list.length) {
    host.textContent = lang === 'hi'
      ? 'इस मॉडल के लिए अभी कवर उपलब्ध नहीं हैं।'
      : 'No covers available for this model yet.';

    return;
  }

  list.forEach(p => {
    const d = document.createElement('div');

    d.className = 'card product-card';

    const urls = getProductImages(p);

    const gallery = document.createElement('div');

    gallery.className = 'product-gallery';

    const img = document.createElement('img');

    img.src = urls[0] || '';
    img.alt = p.title;
    img.className = 'product-main-image';
    img.style.cursor = 'zoom-in';

    img.addEventListener('click', () => {
      if (urls.length) {
        openPhotoViewer(urls, 0);
      }
    });

    gallery.append(img);

    /* THUMBNAILS */

    if (urls.length > 1) {
      const thumbs = document.createElement('div');

      thumbs.className = 'product-thumbnails';

      urls.forEach((url, index) => {
        const t = document.createElement('img');

        t.src = url;
        t.alt = p.title + ' photo ' + (index + 1);
        t.className = 'product-thumb';

        t.addEventListener('click', () => {
          img.src = url;
        });

        thumbs.append(t);
      });

      gallery.append(thumbs);
    }

    const h = document.createElement('h3');

    h.textContent = p.title;

    const price = document.createElement('p');

    price.className = 'price';
    price.textContent = '₹' + p.price;

    const stock = document.createElement('p');

    stock.textContent =
      (lang === 'hi' ? 'स्टॉक: ' : 'Stock: ') + p.stock;

    const btn = document.createElement('button');

    btn.textContent =
      lang === 'hi' ? 'कार्ट में जोड़ें' : 'Add to Cart';

    btn.addEventListener('click', () => {
      cart.push(p);
      renderCart();
    });

    d.append(gallery, h, price, stock, btn);

    host.append(d);
  });
}

/* FULL SCREEN PHOTO VIEWER */

function createPhotoViewer() {
  let viewer = $('photoViewer');

  if (viewer) return viewer;

  viewer = document.createElement('div');

  viewer.id = 'photoViewer';

  viewer.innerHTML = `
    <button id="photoClose">✕</button>
    <button id="photoPrev">❮</button>
    <img id="photoFull" alt="Product Photo">
    <button id="photoNext">❯</button>
    <div id="photoCounter"></div>
  `;

  document.body.append(viewer);

  $('photoClose').addEventListener(
    'click',
    closePhotoViewer
  );

  $('photoPrev').addEventListener(
    'click',
    previousPhoto
  );

  $('photoNext').addEventListener(
    'click',
    nextPhoto
  );

  viewer.addEventListener('click', e => {
    if (e.target === viewer) {
      closePhotoViewer();
    }
  });

  /* MOBILE SWIPE */

  let touchStartX = 0;

  viewer.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  viewer.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;

    const difference = touchEndX - touchStartX;

    if (Math.abs(difference) > 50) {
      if (difference < 0) {
        nextPhoto();
      } else {
        previousPhoto();
      }
    }
  }, { passive: true });

  return viewer;
}

function openPhotoViewer(photos, index) {
  if (!photos || !photos.length) return;

  currentPhotos = photos;

  currentPhotoIndex = Math.max(0, index);

  const viewer = createPhotoViewer();

  viewer.style.display = 'flex';

  document.body.style.overflow = 'hidden';

  updatePhotoViewer();
}

function updatePhotoViewer() {
  if (!currentPhotos.length) return;

  $('photoFull').src =
    currentPhotos[currentPhotoIndex];

  $('photoCounter').textContent =
    (currentPhotoIndex + 1) +
    ' / ' +
    currentPhotos.length;
}

function nextPhoto() {
  if (!currentPhotos.length) return;

  currentPhotoIndex =
    (currentPhotoIndex + 1) % currentPhotos.length;

  updatePhotoViewer();
}

function previousPhoto() {
  if (!currentPhotos.length) return;

  currentPhotoIndex =
    (currentPhotoIndex - 1 + currentPhotos.length) %
    currentPhotos.length;

  updatePhotoViewer();
}

function closePhotoViewer() {
  const viewer = $('photoViewer');

  if (viewer) {
    viewer.style.display = 'none';
  }

  document.body.style.overflow = '';

  currentPhotos = [];

  currentPhotoIndex = 0;
}

/* KEYBOARD CONTROLS */

document.addEventListener('keydown', e => {
  const viewer = $('photoViewer');

  if (!viewer || viewer.style.display !== 'flex') return;

  if (e.key === 'Escape' || e.key === 'Backspace') {
    closePhotoViewer();
  }

  if (e.key === 'ArrowRight') {
    nextPhoto();
  }

  if (e.key === 'ArrowLeft') {
    previousPhoto();
  }
});

/* SEARCH AND FILTER */

$('search').addEventListener('input', renderBrands);

$('backBrands').addEventListener('click', () => {
  $('modelSection').hidden = true;
  $('productSection').hidden = true;
});

$('backModels').addEventListener('click', () => {
  $('productSection').hidden = true;
});

$('typeFilter').addEventListener('change', renderProducts);
/* =========================
   CART AND WHATSAPP CHECKOUT
========================= */

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);

  if (existing) {
    if (existing.qty < Number(product.stock)) {
      existing.qty++;
    } else {
      alert('इतना स्टॉक उपलब्ध नहीं है।');
      return;
    }
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

  item.qty += change;

  if (item.qty <= 0) {
    cart = cart.filter(p => p.id !== productId);
  } else if (item.qty > maxStock) {
    item.qty = maxStock;
    alert('इतना स्टॉक उपलब्ध नहीं है।');
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(p => p.id !== productId);
  renderCart();
}

function renderCart() {
  const cartItems = $('cartItems');
  const cartCount = $('cartCount');
  const cartTotal = $('cartTotal');

  if (!cartItems || !cartCount || !cartTotal) return;

  cartCount.textContent = cart.reduce((sum, p) => sum + p.qty, 0);

  if (cart.length === 0) {
    cartItems.innerHTML = '<p>आपकी कार्ट खाली है।</p>';
    cartTotal.textContent = '₹0';
    return;
  }

  let total = 0;

  cartItems.innerHTML = cart.map(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;

    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <p>₹${item.price}</p>

          <div class="qty-controls">
            <button onclick="changeQty('${item.id}',-1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${item.id}',1)">+</button>
          </div>

          <button onclick="removeFromCart('${item.id}')">
            हटाएँ
          </button>
        </div>
      </div>
    `;
  }).join('');

  cartTotal.textContent = '₹' + total;
}

function openCart() {
  const cartBox = $('cartModal');
  if (cartBox) cartBox.style.display = 'flex';
}

function closeCart() {
  const cartBox = $('cartModal');
  if (cartBox) cartBox.style.display = 'none';
}

if ($('cartBtn')) {
  $('cartBtn').addEventListener('click', openCart);
}

if ($('closeCart')) {
  $('closeCart').addEventListener('click', closeCart);
}

if ($('checkoutBtn')) {
  $('checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) {
      alert('आपकी कार्ट खाली है।');
      return;
    }

    let total = 0;

    let message = 'नमस्ते, मुझे ये प्रोडक्ट ऑर्डर करने हैं:%0A%0A';

    cart.forEach((item, index) => {
      const subtotal = item.price * item.qty;
      total += subtotal;

      message += `${index + 1}. ${item.title}%0A`;
      message += `Quantity: ${item.qty}%0A`;
      message += `Price: ₹${item.price}%0A`;
      message += `Total: ₹${subtotal}%0A%0A`;
    });

    message += `कुल कीमत: ₹${total}`;

    const whatsappNumber = '919584247135';

    window.open(
      `https://wa.me/${whatsappNumber}?text=${message}`,
      '_blank'
    );
  });
}


/* =========================
   ADMIN BRAND AND MODEL LIST
========================= */

async function fillAdminSelects() {
  const brandSelect = $('modelBrand');
  const productBrandSelect = $('productBrand');

  if (brandSelect) {
    brandSelect.innerHTML = '<option value="">ब्रांड चुनें</option>';

    brands.forEach(brand => {
      brandSelect.innerHTML += `
        <option value="${brand.id}">${brand.name}</option>
      `;
    });
  }

  if (productBrandSelect) {
    productBrandSelect.innerHTML = '<option value="">ब्रांड चुनें</option>';

    brands.forEach(brand => {
      productBrandSelect.innerHTML += `
        <option value="${brand.id}">${brand.name}</option>
      `;
    });
  }

  await fillModelOptions();
}

async function fillModelOptions() {
  const modelSelect = $('productModel');
  if (!modelSelect) return;

  const brandId = $('productBrand')?.value;

  modelSelect.innerHTML = '<option value="">मोबाइल मॉडल चुनें</option>';

  if (!brandId) return;

  const filteredModels = models.filter(
    model => model.brand_id === brandId
  );

  filteredModels.forEach(model => {
    modelSelect.innerHTML += `
      <option value="${model.id}">${model.name}</option>
    `;
  });
}

if ($('productBrand')) {
  $('productBrand').addEventListener('change', fillModelOptions);
}


/* =========================
   ADMIN LOGIN AND LOGOUT
========================= */

async function adminReady() {
  if (!sb) return false;

  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
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
    await sb.auth.signOut();
    return false;
  }

  adminUser = session.user;

  return true;
}

if ($('adminLoginForm')) {
  $('adminLoginForm').addEventListener('submit', async event => {
    event.preventDefault();

    const email = $('adminEmail')?.value.trim();
    const password = $('adminPassword')?.value;

    if (!email || !password) {
      alert('ईमेल और पासवर्ड भरें।');
      return;
    }

    say('adminLoginMsg', 'लॉगिन हो रहा है...');

    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      say('adminLoginMsg', 'लॉगिन असफल: ' + error.message);
      return;
    }

    const { data: adminData, error: adminError } = await sb
      .from('admin_users')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (adminError || !adminData) {
      await sb.auth.signOut();
      say('adminLoginMsg', 'आपको Admin की अनुमति नहीं है।');
      return;
    }

    adminUser = data.user;

    say('adminLoginMsg', 'लॉगिन सफल!');

    if ($('adminLoginBox')) {
      $('adminLoginBox').style.display = 'none';
    }

    if ($('adminPanel')) {
      $('adminPanel').style.display = 'block';
    }

    await loadAdminProducts();
    await fillAdminSelects();
  });
}

if ($('adminLogout')) {
  $('adminLogout').addEventListener('click', async () => {
    await sb.auth.signOut();

    adminUser = null;

    if ($('adminPanel')) {
      $('adminPanel').style.display = 'none';
    }

    if ($('adminLoginBox')) {
      $('adminLoginBox').style.display = 'block';
    }

    alert('आप लॉगआउट हो गए हैं।');
  });
}


/* =========================
   ADD BRAND
========================= */

if ($('addBrandForm')) {
  $('addBrandForm').addEventListener('submit', async event => {
    event.preventDefault();

    if (!(await adminReady())) {
      alert('पहले Admin Login करें।');
      return;
    }

    const name = $('brandName')?.value.trim();

    if (!name) {
      alert('ब्रांड का नाम लिखें।');
      return;
    }

    const { error } = await sb
      .from('brands')
      .insert({ name });

    if (error) {
      alert('ब्रांड नहीं जुड़ा: ' + error.message);
      return;
    }

    $('brandName').value = '';

    alert('ब्रांड सफलतापूर्वक जुड़ गया।');

    await loadAll();
    await fillAdminSelects();
  });
}


/* =========================
   ADD MOBILE MODEL
========================= */

if ($('addModelForm')) {
  $('addModelForm').addEventListener('submit', async event => {
    event.preventDefault();

    if (!(await adminReady())) {
      alert('पहले Admin Login करें।');
      return;
    }

    const brandId = $('modelBrand')?.value;
    const modelName = $('modelName')?.value.trim();

    if (!brandId || !modelName) {
      alert('ब्रांड और मोबाइल मॉडल दोनों चुनें।');
      return;
    }

    const { error } = await sb
      .from('models')
      .insert({
        brand_id: brandId,
        name: modelName
      });

    if (error) {
      alert('मॉडल नहीं जुड़ा: ' + error.message);
      return;
    }

    $('modelName').value = '';

    alert('मोबाइल मॉडल सफलतापूर्वक जुड़ गया।');

    await loadAll();
    await fillAdminSelects();
  });
  }
/* =========================
   STORAGE IMAGE PATH HELPER
========================= */

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
    console.error('Image URL error:', error);
    return null;
  }
}


/* =========================
   ADD PRODUCT
   EACH PRODUCT GETS OWN FOLDER
========================= */

if ($('addProductForm')) {
  $('addProductForm').addEventListener('submit', async event => {
    event.preventDefault();

    if (!(await adminReady())) {
      alert('पहले Admin Login करें।');
      return;
    }

    const modelId = $('productModel')?.value;
    const title = $('productTitle')?.value.trim();
    const coverType = $('coverType')?.value || '';
    const price = Number($('productPrice')?.value);
    const stock = Number($('productStock')?.value);

    const imageInput = $('productImages');
    const files = Array.from(imageInput?.files || []);

    if (!modelId) {
      alert('मोबाइल मॉडल चुनें।');
      return;
    }

    if (!title) {
      alert('प्रोडक्ट का नाम लिखें।');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert('सही कीमत लिखें।');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      alert('सही स्टॉक लिखें।');
      return;
    }

    if (files.length < 6) {
      alert('कम से कम 6 फोटो अपलोड करें।');
      return;
    }

    say('productMsg', 'फोटो अपलोड हो रही हैं, कृपया इंतजार करें...');

    // हर प्रोडक्ट के लिए एक अलग यूनिक फोल्डर
    const folderId = (
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
    )
      ? window.crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2);

    const uploadedPaths = [];
    const imageUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const safeName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        );

        // हर फोटो इसी प्रोडक्ट के फोल्डर में जाएगी
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

        const { data: publicData } = sb
          .storage
          .from('product-images')
          .getPublicUrl(path);

        imageUrls.push(publicData.publicUrl);
      }

      say('productMsg', 'प्रोडक्ट सेव हो रहा है...');

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

      if ($('productTitle')) $('productTitle').value = '';
      if ($('productPrice')) $('productPrice').value = '';
      if ($('productStock')) $('productStock').value = '';
      if ($('productImages')) $('productImages').value = '';
      if ($('coverType')) $('coverType').value = '';

      say('productMsg', 'प्रोडक्ट सफलतापूर्वक जुड़ गया!');

      alert(
        'प्रोडक्ट सफलतापूर्वक जुड़ गया।\n' +
        'इसकी सभी फोटो अलग फोल्डर में सेव हुई हैं।'
      );

      await loadAll();
      await loadAdminProducts();

    } catch (error) {
      console.error('Add product error:', error);

      // गलती होने पर अपलोड की गई फोटो हटाने की कोशिश
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await sb
          .storage
          .from('product-images')
          .remove(uploadedPaths);

        if (cleanupError) {
          console.error('Image cleanup error:', cleanupError);
        }
      }

      say(
        'productMsg',
        'प्रोडक्ट सेव नहीं हुआ: ' + error.message
      );

      alert('प्रोडक्ट सेव नहीं हुआ: ' + error.message);
    }
  });
}
/* =========================
   LOAD ADMIN PRODUCTS
========================= */

async function loadAdminProducts() {
  if (!sb || !(await adminReady())) return;

  const list = $('adminProducts');
  if (!list) return;

  list.innerHTML = '<p>प्रोडक्ट लोड हो रहे हैं...</p>';

  const { data, error } = await sb
    .from('products')
    .select(`
      *,
      models (
        name,
        brands (
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML = '<p>प्रोडक्ट लोड नहीं हुए: ' + error.message + '</p>';
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<p>अभी कोई प्रोडक्ट नहीं है।</p>';
    return;
  }

  list.innerHTML = data.map(product => {
    const status = product.is_active ? 'Hide' : 'Show';

    const brandName = product.models?.brands?.name || '';
    const modelName = product.models?.name || '';

    return `
      <div class="admin-product-item">
        <div>
          <strong>${product.title}</strong>
          <p>${brandName} ${modelName}</p>
          <p>कीमत: ₹${product.price}</p>
          <p>स्टॉक: ${product.stock}</p>
          <p>स्थिति: ${product.is_active ? 'Active' : 'Hidden'}</p>
        </div>

        <div class="admin-product-actions">
          <button
            type="button"
            onclick="toggleProduct('${product.id}', ${!product.is_active})">
            ${status}
          </button>

          <button
            type="button"
            onclick="deleteProduct('${product.id}')">
            Delete Product
          </button>
        </div>
      </div>
    `;
  }).join('');
}


/* =========================
   HIDE / SHOW PRODUCT
========================= */

async function toggleProduct(productId, newStatus) {
  if (!(await adminReady())) {
    alert('पहले Admin Login करें।');
    return;
  }

  const { error } = await sb
    .from('products')
    .update({ is_active: newStatus })
    .eq('id', productId);

  if (error) {
    alert('स्थिति अपडेट नहीं हुई: ' + error.message);
    return;
  }

  await loadAll();
  await loadAdminProducts();
}


/* =========================
   DELETE PRODUCT + ITS PHOTOS
========================= */

async function deleteProduct(productId) {
  if (!(await adminReady())) {
    alert('पहले Admin Login करें।');
    return;
  }

  const confirmed = confirm(
    'क्या आप यह प्रोडक्ट और इसकी सभी फोटो डिलीट करना चाहते हैं?\n\n' +
    'यह काम वापस नहीं किया जा सकेगा।'
  );

  if (!confirmed) return;

  const { data: product, error: fetchError } = await sb
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    alert('प्रोडक्ट नहीं मिला: ' + (fetchError?.message || ''));
    return;
  }

  // प्रोडक्ट की सभी फोटो URL प्राप्त करें
  const imageUrls = getProductImages(product);

  // URL से Storage के अंदर का सही फाइल पाथ निकालें
  const storagePaths = [
    ...new Set(
      imageUrls
        .map(url => getStoragePathFromUrl(url))
        .filter(Boolean)
    )
  ];

  // पहले उस प्रोडक्ट की फोटो हटाएँ
  if (storagePaths.length > 0) {
    const { error: storageError } = await sb
      .storage
      .from('product-images')
      .remove(storagePaths);

    if (storageError) {
      alert(
        'फोटो डिलीट नहीं हो सकीं।\n\n' +
        'Storage Permission (DELETE Policy) चेक करें।\n\n' +
        storageError.message +
        '\n\nप्रोडक्ट अभी डिलीट नहीं किया गया है।'
      );
      return;
    }
  }

  // अब Database से प्रोडक्ट हटाएँ
  const { error: deleteError } = await sb
    .from('products')
    .delete()
    .eq('id', productId);

  if (deleteError) {
    alert(
      'फोटो हट गई हैं, लेकिन Database से प्रोडक्ट नहीं हट पाया।\n\n' +
      deleteError.message
    );
    return;
  }

  alert('प्रोडक्ट और उसकी फोटो डिलीट हो गई हैं।');

  await loadAll();
  await loadAdminProducts();
}


/* =========================
   WEBSITE INITIALIZATION
========================= */

(async function startWebsite() {
  try {
    initClient();

    await loadAll();

    const { data: { session } } = await sb.auth.getSession();

    if (session) {
      const isAdmin = await adminReady();

      if (isAdmin) {
        if ($('adminLoginBox')) {
          $('adminLoginBox').style.display = 'none';
        }

        if ($('adminPanel')) {
          $('adminPanel').style.display = 'block';
        }

        await loadAdminProducts();
        await fillAdminSelects();
      }
    }

    renderCart();

  } catch (error) {
    console.error('Website initialization error:', error);
  }
})();
