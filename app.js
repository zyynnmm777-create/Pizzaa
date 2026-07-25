let cart = [], orders = [], ratings = {}, user = null, userAvatar = '';
let pageHistory = ['home'];

try {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  orders = JSON.parse(localStorage.getItem("orders")) || [];
  ratings = JSON.parse(localStorage.getItem("ratings")) || {};
  user = JSON.parse(localStorage.getItem("user")) || null;
  userAvatar = localStorage.getItem("userAvatar") || '';
} catch(e) {
  console.error("Storage parsing error", e);
}

let currentProduct = null;
let currentCatProducts = [];
let activeCat = '';
let activeFilter = 'all';
let discount = 0;

function triggerFlash(containerId) {
  let el = document.getElementById(containerId);
  if(!el) return;
  el.classList.remove('flash-animate');
  void el.offsetWidth;
  el.classList.add('flash-animate');
}

function openCustomerService() {
  let msg = encodeURIComponent("مرحباً، أريد الاستفسار عن خدمة العملاء والطلبات في مطعم الفطيرة الساخنة 🍕");
  window.open(`https://wa.me/${RESTAURANT_PHONE}?text=${msg}`, '_blank');
}

function hidePages(){ 
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); 
}

function showPage(id, el, addToHist = true){
  let active = document.querySelector('.page.active');
  if(active && active.id !== id && addToHist) {
    if(pageHistory[pageHistory.length - 1] !== id) {
      pageHistory.push(id);
    }
  }
  
  hidePages();
  let targetPage = document.getElementById(id);
  if(targetPage) targetPage.classList.add('active');
  
  triggerFlash(id);

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-nav'));
  if(el) el.classList.add('active-nav');
  
  let floatingCartBtn = document.getElementById('floatingCartBtn');
  if(floatingCartBtn) {
    if(id === 'ordersPage' || id === 'profilePage') {
      floatingCartBtn.style.display = 'none';
    } else {
      floatingCartBtn.style.display = 'flex';
    }
  }
  
  if(id === 'offersPage') renderOffersPage();
  if(id === 'ordersPage') renderOrders();
  if(id === 'profilePage') renderProfile();
  
  closeMenu();
}

window.addEventListener('popstate', function(event) {
  closeMenu();
  goBack();
});

function goHome(){ 
  pageHistory = ['home'];
  showPage('home', null, false); 
  let navBtns = document.querySelectorAll('.nav-btn');
  if(navBtns.length > 0) navBtns[0].classList.add('active-nav'); 
}

function goBack(){ 
  closeMenu();
  if(pageHistory.length > 1) {
    pageHistory.pop();
    let targetId = pageHistory[pageHistory.length - 1];
    hidePages();
    let targetEl = document.getElementById(targetId);
    if(targetEl) targetEl.classList.add('active');
    triggerFlash(targetId);

    let floatingCartBtn = document.getElementById('floatingCartBtn');
    if(floatingCartBtn) {
      if(targetId === 'ordersPage' || targetId === 'profilePage') {
        floatingCartBtn.style.display = 'none';
      } else {
        floatingCartBtn.style.display = 'flex';
      }
    }
  } else {
    goHome();
  }
}

function openMenu(){ 
  let sideMenu = document.getElementById('sideMenu');
  let overlay = document.getElementById('overlay');
  if(sideMenu) sideMenu.style.right='0'; 
  if(overlay) overlay.style.display='block'; 
}

function closeMenu(){ 
  let sideMenu = document.getElementById('sideMenu');
  let overlay = document.getElementById('overlay');
  if(sideMenu) sideMenu.style.right='-270px'; 
  if(overlay) overlay.style.display='none'; 
}

function showToast(text){
  let x = document.getElementById('toast');
  if(!x) return;
  x.innerText = text; x.classList.add('show-toast');
  setTimeout(() => x.classList.remove('show-toast'), 2000);
}

function renderProducts(arr, target){
  let container = document.getElementById(target);
  if(!container) return;
  if(!arr || arr.length === 0){
    container.innerHTML = '<div class="empty-state">لا توجد وجبات لعرضها 🔍</div>';
    return;
  }
  let html = '';
  arr.forEach(p => {
    let displayPrice = Number(p.basePrice) || (p.prices ? p.prices[getSizeKey(activeFilter === 'all' ? 'صغير' : activeFilter)] : 0);
    let imgSrc = (p.imgs && p.imgs[0]) ? p.imgs[0] : '';
    html += `
    <div class="card" onclick="openProduct(${p.id})">
      <img src="${imgSrc}" loading="lazy">
      <div class="info">
        <div class="name">${p.name || ''}</div>
        <div class="price">${displayPrice.toLocaleString('en-US')} ل.س</div>
      </div>
    </div>`;
  });
  container.innerHTML = html;
  triggerFlash(target);
}

function renderHomeProducts() {
  let targetIDs = [102, 2, 1, 101, 5, 4];
  let selectedProducts = products.filter(p => targetIDs.includes(p.id));
  renderProducts(selectedProducts, 'homeProducts');
}

function openCategory(cat){
  activeCat = cat; activeFilter = 'all';
  showPage('categoryPage');
  
  let titles = {pizza:'🍕 قسم البيتزا', appetizers:'🍟 مقبلات وبطاطا', sauces:'🍯 صوصات وإضافات', drinks:'🥤 مشروبات باردة'};
  let catTitleEl = document.getElementById('catTitle');
  if(catTitleEl) catTitleEl.innerText = titles[cat] || 'القسم';
  
  currentCatProducts = products.filter(p => p.category === cat);
  
  if(cat === 'pizza') {
    let storageKey = 'pizza_shuffled_order';
    let shuffledIds = [];
    try { shuffledIds = JSON.parse(localStorage.getItem(storageKey)); } catch(e) {}
    
    if(!shuffledIds) {
      shuffledIds = currentCatProducts.map(p => p.id).sort(() => Math.random() - 0.5);
      try { localStorage.setItem(storageKey, JSON.stringify(shuffledIds)); } catch(e) {}
    }
    
    currentCatProducts.sort((a, b) => shuffledIds.indexOf(a.id) - shuffledIds.indexOf(b.id));
  }
  
  let subcats = [];
  if(cat === 'pizza') {
    subcats = ['all', 'كبير', 'وسط', 'صغير', 'اكس سمول'];
  } else {
    subcats = ['all', ...new Set(currentCatProducts.map(p => p.subcat))];
  }

  let bar = document.getElementById("filterBar");
  if(bar) {
    bar.innerHTML = subcats.map(s => {
      let name = s === 'all' ? 'الكل' : s;
      return `<button class="filter-btn ${s==='all'?'active-filter':''}" onclick="filterCat('${s}', this)">${name}</button>`;
    }).join('');
  }
  
  renderCatProducts(currentCatProducts);
}

function filterCat(subcat, btn){
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter'));
  if(btn) btn.classList.add('active-filter');
  activeFilter = subcat;
  
  let filtered = products.filter(p => p.category === activeCat);
  
  if(activeCat === 'pizza') {
    let storageKey = 'pizza_shuffled_order';
    let shuffledIds = [];
    try { shuffledIds = JSON.parse(localStorage.getItem(storageKey)) || []; } catch(e){}
    filtered.sort((a, b) => shuffledIds.indexOf(a.id) - shuffledIds.indexOf(b.id));
  }

  if(activeCat === 'pizza' && subcat !== 'all') {
    filtered = filtered.filter(p => p.prices && p.prices[getSizeKey(subcat)] !== undefined);
  } else if(subcat !== 'all') {
    filtered = filtered.filter(p => p.subcat === subcat);
  }
  
  renderCatProducts(filtered);
}

function getSizeKey(size) {
  if(size === 'اكس سمول') return 'xsmall';
  if(size === 'وسط') return 'medium';
  if(size === 'كبير') return 'large';
  return 'small';
}

function sortProducts(type){
  let items = products.filter(p => p.category === activeCat);
  let currentSizeKey = getSizeKey(activeFilter === 'all' ? 'صغير' : activeFilter);
  
  if(activeCat === 'pizza') {
    let storageKey = 'pizza_shuffled_order';
    let shuffledIds = [];
    try { shuffledIds = JSON.parse(localStorage.getItem(storageKey)) || []; } catch(e){}
    items.sort((a, b) => shuffledIds.indexOf(a.id) - shuffledIds.indexOf(b.id));
  }

  if(activeCat === 'pizza' && activeFilter !== 'all') {
    items = items.filter(p => p.prices && p.prices[currentSizeKey] !== undefined);
  } else if(activeFilter !== 'all') {
    items = items.filter(p => p.subcat === activeFilter);
  }
  
  if(type === 'asc') items.sort((a,b) => (Number(a.basePrice || (a.prices ? a.prices[currentSizeKey] : 0))||0) - (Number(b.basePrice || (b.prices ? b.prices[currentSizeKey] : 0))||0));
  if(type === 'desc') items.sort((a,b) => (Number(b.basePrice || (b.prices ? b.prices[currentSizeKey] : 0))||0) - (Number(a.basePrice || (a.prices ? a.prices[currentSizeKey] : 0))||0));
  
  renderCatProducts(items);
}

function renderCatProducts(arr){ renderProducts(arr, 'catProducts'); }

function openProduct(id){
  showPage('productPage');
  
  currentProduct = products.find(x => x.id === id);
  if(!currentProduct) return;
  
  let productImgsEl = document.getElementById('productImgs');
  if(productImgsEl && currentProduct.imgs) {
    productImgsEl.innerHTML = currentProduct.imgs.map(img=>`<img src="${img}" loading="lazy">`).join('');
  }
  let productNameEl = document.getElementById('productName');
  let productDescEl = document.getElementById('productDesc');
  if(productNameEl) productNameEl.innerText = currentProduct.name || '';
  if(productDescEl) productDescEl.innerText = currentProduct.desc || '';
  
  let optionsContainer = document.getElementById('productOptionsContainer');
  if(currentProduct.category === 'pizza'){
    if(optionsContainer) optionsContainer.style.display = 'block';
    let sizeSelect = document.getElementById('sizeSelect');
    let edgeSelect = document.getElementById('edgeSelect');
    if(sizeSelect) sizeSelect.value = (activeFilter !== 'all') ? activeFilter : 'صغير';
    if(edgeSelect) edgeSelect.selectedIndex = 0;
    updateDynamicPrice();
  } else {
    if(optionsContainer) optionsContainer.style.display = 'none';
    let productPriceEl = document.getElementById('productPrice');
    if(productPriceEl) productPriceEl.innerText = (Number(currentProduct.basePrice)||0).toLocaleString('en-US') + ' ل.س';
  }
  
  let currentRate = ratings[id] || 0;
  displayStars(currentRate);
}

function updateDynamicPrice(){
  if(!currentProduct || currentProduct.category !== 'pizza') return;
  
  let sizeSelect = document.getElementById('sizeSelect');
  let edgeSelect = document.getElementById('edgeSelect');
  if(!sizeSelect || !edgeSelect) return;

  let size = sizeSelect.value;
  let sizeKey = getSizeKey(size);

  let baseItemPrice = (currentProduct.prices && currentProduct.prices[sizeKey]) ? currentProduct.prices[sizeKey] : 0;
  
  let edge = edgeSelect.value;
  let edgeExtra = 0;
  if(edge === 'محشية الاطراف') {
    edgeExtra = (size === 'كبير') ? 200 : 100;
  }
  
  let finalPrice = baseItemPrice + edgeExtra;
  let productPriceEl = document.getElementById('productPrice');
  if(productPriceEl) productPriceEl.innerText = finalPrice.toLocaleString('en-US') + ' ل.س';
  
  triggerFlash('productPrice');
}

function rateProd(val){
  if(!currentProduct) return;
  ratings[currentProduct.id] = val;
  try { localStorage.setItem("ratings", JSON.stringify(ratings)); } catch(e){}
  displayStars(val);
  showToast("شكراً لتقييمك وجبتك المفضلة! ⭐");
}

function displayStars(val){
  let stars = document.querySelectorAll('#starsRow .star');
  stars.forEach((s, idx) => {
    if(idx < val) s.classList.add('active');
    else s.classList.remove('active');
  });
  let ratingText = document.getElementById("ratingText");
  if(ratingText) ratingText.innerText = val > 0 ? `تقييمك: ${val} من 5` : "لم يتم التقييم بعد";
}

function renderOffersPage(){
  let offerIDs = [115, 103, 2];
  let offerItems = products.filter(p => offerIDs.includes(p.id));
  renderProducts(offerItems, 'offersItems');
}

function updateCartCounter(){
  let totalCount = cart.reduce((sum, item) => sum + (Number(item.qty)||0), 0);
  let floatingCount = document.getElementById("floatingCartCount");
  if(floatingCount) floatingCount.innerText = totalCount.toLocaleString('en-US');
  try { localStorage.setItem("cart", JSON.stringify(cart)); } catch(e){}
}

function openCart(){
  showPage('cartPage');
  renderCart();
}

function addToCart(){
  if(!currentProduct) return;
  
  let itemPrice = Number(currentProduct.basePrice) || 0;
  let size = '';
  let edge = 'أطراف عادية';
  let cartId = `${currentProduct.id}`;

  if(currentProduct.category === 'pizza'){
    let sizeSelect = document.getElementById("sizeSelect");
    let edgeSelect = document.getElementById("edgeSelect");
    size = sizeSelect ? sizeSelect.value : 'صغير';
    edge = edgeSelect ? edgeSelect.value : 'أطراف عادية';
    
    let sizeKey = getSizeKey(size);

    itemPrice = (currentProduct.prices && currentProduct.prices[sizeKey]) ? currentProduct.prices[sizeKey] : 0;
    let edgeExtra = 0;
    if(edge === 'محشية الاطراف') {
      edgeExtra = (size === 'كبير') ? 200 : 100;
    }
    itemPrice += edgeExtra;
    cartId = `${currentProduct.id}-${size}-${edge}`;
  }
  
  let exists = cart.find(i => i.cartId === cartId);
  
  if(exists){
    exists.qty = (Number(exists.qty)||0) + 1;
  } else {
    let imgSrc = (currentProduct.imgs && currentProduct.imgs[0]) ? currentProduct.imgs[0] : '';
    cart.push({
      id: currentProduct.id,
      name: currentProduct.name,
      category: currentProduct.category,
      imgs: [imgSrc],
      cartId: cartId,
      price: itemPrice,
      selectedSize: size,
      selectedEdge: edge,
      qty: 1
    });
  }
  updateCartCounter();
  showToast("تمت الإضافة إلى السلة بنجاح 🛒");
}

function changeQty(cartId, delta){
  let item = cart.find(i => i.cartId === cartId);
  if(!item) return;
  item.qty = (Number(item.qty)||0) + delta;
  if(item.qty <= 0) cart = cart.filter(i => i.cartId !== cartId);
  updateCartCounter();
  renderCart();
}

function removeFromCart(cartId){
  cart = cart.filter(i => i.cartId !== cartId);
  updateCartCounter();
  renderCart();
  showToast("تم حذف الوجبة ❌");
}

function applyCoupon(){
  let codeInput = document.getElementById("couponInput");
  if(!codeInput) return;
  let code = codeInput.value.trim().toUpperCase();
  if(COUPONS[code]){
    discount = COUPONS[code];
    showToast(`تم تطبيق كوبون الخصم بنجاح (${discount}%) 🎉`);
    renderCart();
  } else {
    showToast("كود الخصم غير صحيح أو منتهي الصلاحية ❌");
  }
}

function renderCart(){
  let container = document.getElementById("cartItems");
  if(!container) return;
  container.innerHTML = "";
  let total = 0;
  
  if(!cart || cart.length === 0){
    container.innerHTML = '<div class="empty-state">سلة الوجبات فارغة حالياً 🍕</div>';
    let totalPriceEl = document.getElementById("totalPrice");
    let discountTextEl = document.getElementById("discountText");
    if(totalPriceEl) totalPriceEl.innerText = "الإجمالي: 0 ل.س";
    if(discountTextEl) discountTextEl.style.display = 'none';
    let whatsappContainer = document.getElementById("whatsappButtonContainer");
    if(whatsappContainer) whatsappContainer.innerHTML = "";
    return;
  }
  
  cart.forEach(item => {
    total += (Number(item.price)||0) * (Number(item.qty)||0);
    let detailsText = item.category === 'pizza' ? `(الحجم: ${item.selectedSize} - ${item.selectedEdge})` : '';
    let imgSrc = (item.imgs && item.imgs[0]) ? item.imgs[0] : '';
    container.innerHTML += `
    <div class="cart-box">
      <img src="${imgSrc}" class="cart-img" loading="lazy">
      <div class="cart-info">
        <div class="name">${item.name || ''} ${detailsText}</div>
        <div class="price">${(Number(item.price)||0).toLocaleString('en-US')} ل.س</div>
        <div class="qty-row">
          <button class="qty-btn" onclick="changeQty('${item.cartId}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.cartId}',1)">+</button>
          <button class="btn btn-dark" style="width:auto;padding:4px 10px;margin:0;font-size:12px;background:#b71c1c;" onclick="removeFromCart('${item.cartId}')">حذف</button>
        </div>
      </div>
    </div>`;
  });
  
  let finalTotal = total - (total * discount / 100);
  let totalPriceEl = document.getElementById("totalPrice");
  if(totalPriceEl) totalPriceEl.innerText = "الإجمالي النهائي: " + finalTotal.toLocaleString('en-US') + " ل.س";
  
  let discountTextEl = document.getElementById("discountText");
  if(discountTextEl){
    if(discount > 0){
      discountTextEl.style.display = 'block';
      discountTextEl.innerText = `💰 نسبة الخصم المطبقة: ${discount}%`;
    } else {
      discountTextEl.style.display = 'none';
    }
  }
  triggerFlash('cartPage');
}

function getMyLocation() {
  if (navigator.geolocation) {
    showToast("📍 جاري تحديد موقعك الجغرافي...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let lat = position.coords.latitude;
        let lng = position.coords.longitude;
        
        let latEl = document.getElementById('lat');
        let lngEl = document.getElementById('lng');
        let locValEl = document.getElementById('locationValue');
        if(latEl) latEl.value = lat;
        if(lngEl) lngEl.value = lng;
        if(locValEl) locValEl.value = `https://www.google.com/maps?q=${lat},${lng}`;
        showToast("تم تحديد موقعك بدقة بنجاح! ✅");
      },
      (error) => {
        showToast("تعذر الوصول للموقع. يرجى تفعيل الـ GPS.");
      },
      { enableHighAccuracy: true }
    );
  } else {
    showToast("متصفحك لا يدعم تحديد الموقع.");
  }
}

function sendOrderToDatabase(orderData) {
  const binId = process.env.JSONBIN_BIN_ID;
const apiKey = process.env.JSONBIN_API_KEY;

  fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
          'X-Master-Key': apiKey,
          'X-Access-Key': apiKey
      }
  })
  .then(response => {
      if (!response.ok) throw new Error("فشل في جلب الطلبات السابقة.");
      return response.json();
  })
  .then(data => {
      let currentOrders = [];
      if (data && data.record) {
          currentOrders = Array.isArray(data.record) ? data.record : (data.record.orders || []);
      }
      
      currentOrders.push(orderData);

      return fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': apiKey
          },
          body: JSON.stringify({ orders: currentOrders })
      });
  })
  .then(response => {
      if (!response.ok) throw new Error("فشل في تحديث قاعدة البيانات.");
      return response.json();
  })
  .catch(error => {
      console.error("خطأ في إرسال الطلب:", error);
  });
}

function checkout() {
  if (!cart || cart.length === 0) {
    showToast("السلة فارغة ⚠️");
    return;
  }
  if (!user) {
    showToast("يرجى تسجيل الدخول وإدخال العنوان أولاً 👤");
    showPage('profilePage');
    return;
  }

  let total = cart.reduce((sum, i) => sum + (Number(i.price)||0) * (Number(i.qty)||0), 0);
  let finalTotal = total - (total * discount / 100);
  
  let orderId = Date.now() + Math.floor(Math.random() * 900 + 100);
  let currentDate = new Date().toLocaleDateString('en-US');

  let newOrder = { 
    id: orderId, 
    date: currentDate, 
    customerName: user.name,
    customerPhone: user.phone,
    customerLocation: user.location,
    items: [...cart], 
    total: finalTotal, 
    status: 'قيد المراجعة ⏳' 
  };
  
  sendOrderToDatabase(newOrder);

  orders.unshift(newOrder);
  try { localStorage.setItem("orders", JSON.stringify(orders)); } catch(e){}

  cart = [];
  discount = 0;
  updateCartCounter();

  showToast("🎉 تم إرسال طلبك بنجاح للمطعم، جاري تجهيزه!");
  showPage('ordersPage');
}

function renderOrders() {
  let container = document.getElementById("ordersList");
  if (!container) return;

  if (!user || !user.phone) {
    container.innerHTML = '<div class="empty-state">👤 يرجى تسجيل الدخول وإدخال رقم الموبايل في صفحة "حسابي" لعرض طلباتك الخاصة</div>';
    return;
  }

  container.innerHTML = '<div style="text-align:center; color:#aaa;">جاري تحميل طلباتك...</div>';

  const binId = process.env.JSONBIN_BIN_ID;
const apiKey = process.env.JSONBIN_API_KEY;


  fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
          'X-Master-Key': apiKey,
          'X-Access-Key': apiKey
      }
  })
  .then(response => response.json())
  .then(data => {
      let remoteOrders = [];
      if (data && data.record) {
          remoteOrders = Array.isArray(data.record) ? data.record : (data.record.orders || []);
      }
      
      let myOrders = remoteOrders.filter(o => o.customerPhone === user.phone);

      if (myOrders.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="display:flex; flex-direction:column; align-items:center; gap:12px;">
            <div>لا يوجد طلبات في السجل</div>
            <div style="font-weight:bold; color:#fff;">اطلب الآن</div>
            <button class="btn" style="width:200px; margin-top:5px;" onclick="openMenu()">اطلب الآن</button>
          </div>`;
        return;
      }

      myOrders.sort((a, b) => b.id - a.id);

      let totalCount = myOrders.length;
      container.innerHTML = myOrders.map((o, index) => {
        let sequentialNum = String(totalCount - index).padStart(6, '0');
        return `
        <div class="order-card">
          <div style="font-weight:bold; display:flex; justify-content: space-between; align-items:center;">
            <span>طلب رقم: #${sequentialNum}</span>
            <span style="color:#ff4d4d">${(Number(o.total)||0).toLocaleString('en-US')} ل.س</span>
          </div>
          <div style="font-size:0.85em; margin: 6px 0; color:#aaa;">التاريخ: ${o.date || ''}</div>
          <div style="background:#222; color:#fff; padding:8px; border-radius:8px; text-align:center; margin-top:8px; font-weight:bold; border:1px solid #444;">
            الحالة الحالية: ${o.status || 'قيد المراجعة ⏳'}
          </div>
        </div>`;
      }).join('');
      
      triggerFlash('ordersPage');
  })
  .catch(error => {
      console.error("خطأ في جلب الطلبات:", error);
      container.innerHTML = '<div class="empty-state">تعذر تحميل الطلبات الحالية ⚠️</div>';
  });
}

function searchProducts(value){
  let v = value.trim().toLowerCase();
  let results = products.filter(p => p.name.toLowerCase().includes(v) || p.desc.toLowerCase().includes(v));
  renderProducts(results, 'searchResults');
}

function doLogin(){
  let nameEl = document.getElementById('loginName');
  let phoneEl = document.getElementById('loginPhone');
  let manualLocationEl = document.getElementById('loginLocation');
  let gpsLocationEl = document.getElementById('locationValue');

  if(!nameEl || !phoneEl) return;

  let name = nameEl.value.trim();
  let phone = phoneEl.phone ? phoneEl.phone.trim() : phoneEl.value.trim();
  let manualLocation = manualLocationEl ? manualLocationEl.value.trim() : '';
  let gpsLocation = gpsLocationEl ? gpsLocationEl.value.trim() : '';
  
  if(!name || !phone){
    showToast("⚠️ يرجى إدخال الاسم ورقم الموبايل!");
    return;
  }

  if (phone.length < 8 || isNaN(phone)) {
    showToast("⚠️ رقم الموبايل غير صحيح!");
    return;
  }

  let finalLocation = manualLocation;
  if (gpsLocation) {
    finalLocation = manualLocation + " - GPS: " + gpsLocation;
  }

  user = {name, phone, location: finalLocation};
  try { localStorage.setItem("user", JSON.stringify(user)); } catch(e){}

  showToast("✅ تم حفظ البيانات بنجاح!");
  showPage('profilePage');
}

function doLogout(){
  if(confirm("هل تريد تعديل بياناتك الشخصية أو العنوان؟")){
    user = null;
    try { localStorage.removeItem("user"); } catch(e){}
    renderProfile();
  }
}

function renderProfile(){
  let loginSec = document.getElementById('loginSection');
  let profileSec = document.getElementById('profileSection');
  if(!loginSec || !profileSec) return;

  let avatarContainer = document.getElementById('userAvatarContainer');
  if(avatarContainer) {
    if(userAvatar && userAvatar !== '') {
      avatarContainer.innerHTML = `<img src="${userAvatar}" loading="lazy">`;
    } else {
      avatarContainer.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
    }
  }

  let pName = document.getElementById('profileName');
  let pPhone = document.getElementById('profilePhone');

  if(user){
    loginSec.style.display = 'none';
    profileSec.style.display = 'block';
    if(pName) pName.innerText = user.name;
    if(pPhone) pPhone.innerText = user.phone;
  } else {
    loginSec.style.display = 'block';
    profileSec.style.display = 'none';
  }
  triggerFlash('profilePage');
}

function openAvatarModal() {
  let modal = document.getElementById('avatarModal');
  let previewContainer = document.getElementById('modalAvatarPreviewContainer');
  if(modal && previewContainer) {
    if(userAvatar && userAvatar !== '') {
      previewContainer.innerHTML = `<img src="${userAvatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
      previewContainer.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
    }
    modal.style.display = 'flex';
  }
}

function closeAvatarModal() {
  let modal = document.getElementById('avatarModal');
  if(modal) modal.style.display = 'none';
}

function handleFileSelected(event) {
  let file = event.target.files[0];
  if (file) {
    let reader = new FileReader();
    reader.onload = function(e) {
      userAvatar = e.target.result;
      try { localStorage.setItem("userAvatar", userAvatar); } catch(e){}
      let previewContainer = document.getElementById('modalAvatarPreviewContainer');
      let avatarContainer = document.getElementById('userAvatarContainer');
      
      if(previewContainer) previewContainer.innerHTML = `<img src="${userAvatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
      if(avatarContainer) avatarContainer.innerHTML = `<img src="${userAvatar}" loading="lazy">`;
      
      showToast("✅ تم تحديث صورة الحساب بنجاح!");
    };
    reader.readAsDataURL(file);
  }
}

window.onload = function() {
  renderHomeProducts();
  renderProfile();
  updateCartCounter();
};
