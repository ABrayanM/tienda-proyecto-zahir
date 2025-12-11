/* app_full.js
   Versión con protección por sesión y roles (ADMIN / CAJERO).
   Mantiene: Productos (CRUD), Carrito, Ventas (historial), Reportes, Configuración (subir logo, reset).
   LocalStorage keys:
     - products_v2
     - sales_v1
     - store_settings_v1
     - cart_temp_v1
     - users_v1
     - sessionUser
*/

// Verificar sesión al cargar la página
(function checkSession() {
  const session = JSON.parse(localStorage.getItem('sessionUser'));
  if (!session) {
      // Si no hay sesión, redirigir al login
      window.location.href = 'login.html';
  } else {
      console.log(`Usuario logueado: ${session.username} (${session.role})`);
      // Opcional: mostrar el usuario en el panel
      // document.querySelector('.topbar h1').textContent += ` - ${session.role}`;
  }
})();


/* ===================== PROTECCIÓN / SESIÓN ===================== */
// Si no hay sesión activa, redirigir a login.html
const sessionUser = JSON.parse(localStorage.getItem('sessionUser') || 'null');
if (!sessionUser) {
  // si estamos ya en login.html no redirigimos
  if (!location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
  }
} else {
  // si hay sesión, asignamos variables
  var CURRENT_USER = sessionUser; // { username, role }
}

/* ===================== CONFIG ===================== */
const LS_PRODUCTS = 'products_v2';
const LS_SALES = 'sales_v1';
const LS_SETTINGS = 'store_settings_v1';
const LS_CART = 'cart_temp_v1';
const DEFAULT_LOGO = '/mnt/data/3fc39e9b-4ca9-4918-8387-6a814daa9f4a.png';

/* ===================== DOM ===================== */
const sidebarLinks = document.querySelectorAll('.menu a');
const contentRoot = document.querySelector('.content');
const sidebarLogoImg = document.querySelector('.logo img');
const topbarTitle = document.querySelector('.topbar h1');

/* Mostrar nombre de usuario en topbar */
if (typeof CURRENT_USER !== 'undefined' && topbarTitle) {
  topbarTitle.textContent = `Bienvenido, ${CURRENT_USER.username.toUpperCase()}`;
}

/* ===================== STORAGE HELPERS ===================== */
function loadProducts() { return JSON.parse(localStorage.getItem(LS_PRODUCTS) || '[]'); }
function saveProducts(list) { localStorage.setItem(LS_PRODUCTS, JSON.stringify(list)); }

function loadSales() { return JSON.parse(localStorage.getItem(LS_SALES) || '[]'); }
function saveSales(list) { localStorage.setItem(LS_SALES, JSON.stringify(list)); }

function loadSettings() { return JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}'); }
function saveSettings(s) { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); }

function loadCart() { return JSON.parse(localStorage.getItem(LS_CART) || '[]'); }
function saveCart(c) { localStorage.setItem(LS_CART, JSON.stringify(c)); }

/* ===================== INITIAL SEED ===================== */
if (loadProducts().length === 0) {
  const seed = [
    {id:1,name:'Arroz 1kg',category:'Granos',price:9.50,stock:50},
    {id:2,name:'Azúcar 1kg',category:'Dulces',price:4.20,stock:40},
    {id:3,name:'Aceite 1L',category:'Aceites',price:12.00,stock:30},
    {id:4,name:'Leche 1L',category:'Lácteos',price:3.80,stock:60},
    {id:5,name:'Fideos 500g',category:'Pastas',price:2.50,stock:80},
    {id:6,name:'Pollo entero',category:'Carnes',price:18.00,stock:15},
    {id:7,name:'Pan',category:'Panadería',price:1.20,stock:100},
    {id:8,name:'Café 250g',category:'Bebidas',price:8.75,stock:25}
  ];
  saveProducts(seed);
}

/* ===================== UTIL HELPERS ===================== */
function escapeHtml(s) {
  return String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"}[c]));
}
function formatDateIso(iso){ const d=new Date(iso); return d.toLocaleString(); }
function downloadText(text, filename, type='text/plain'){ const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

/* ===================== UI HELPERS ===================== */
function clearMain(){
  contentRoot.innerHTML = '';
  return contentRoot;
}

/* ===================== ROLE HELPERS ===================== */
function isAdmin(){ return typeof CURRENT_USER !== 'undefined' && CURRENT_USER.role === 'ADMIN'; }
function isCashier(){ return typeof CURRENT_USER !== 'undefined' && CURRENT_USER.role === 'CAJERO'; }

/* Oculta menú / controles según rol (ejecutar en init) */
function applyMenuRestrictions(){
  if (isCashier()){
    // ocultar reportes y config del sidebar
    const reportLink = document.getElementById('menu-reportes');
    const configLink = document.getElementById('menu-config');
    const prodLink = document.getElementById('menu-productos');
    if(reportLink) reportLink.style.display = 'none';
    if(configLink) configLink.style.display = 'none';
    // opcional: dejar ventas visible
  }
}

/* Logout */
function logout(){
  localStorage.removeItem('sessionUser');
  // mantén carrito? lo borramos también.
  // localStorage.removeItem(LS_CART);
  window.location.href = 'login.html';
}

/* Conectar logout link */
const logoutLink = document.getElementById('menu-logout');
if (logoutLink) logoutLink.onclick = logout;

/* ===================== PRODUCTS VIEW (CRUD) ===================== */
let productsCache = loadProducts(); // cached array used in rendering
let editingProductId = null; // null = creating new, otherwise id of product being edited

function renderProductsView(){
  const content = clearMain();

  // controls
  const controls = document.createElement('div');
  controls.className = 'actions';

  // If cashier, hide "Nuevo Producto" button
  const addButtonHtml = isAdmin() ? `<button id="openFormBtn" class="btn primary">➕ Nuevo Producto</button>` : ``;

  controls.innerHTML = `
    ${addButtonHtml}
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
      <input id="searchProd" placeholder="Buscar producto..." style="padding:8px;border-radius:6px;border:1px solid #ddd">
      <button id="viewCartBtn" class="btn">🛒 Ver Carrito</button>
    </div>
  `;
  content.appendChild(controls);

  // product table
  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';
  tableWrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Acciones</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Cantidad</th>
          <th>Agregar</th>
        </tr>
      </thead>
      <tbody id="productsTbody"></tbody>
    </table>
  `;
  content.appendChild(tableWrap);

  // new/edit form (hidden by default) — only add form if ADMIN
  const formBox = document.createElement('div');
  formBox.style.marginTop = '12px';
  formBox.innerHTML = `
    <form id="productFormNew" class="form hidden">
      <h3 id="formTitle">Nuevo Producto</h3>
      <label>Nombre</label>
      <input id="fName" required>
      <label>Precio (S/)</label>
      <input id="fPrice" type="number" step="0.01" min="0" required>
      <label>Categoría</label>
      <input id="fCategory">
      <label>Stock</label>
      <input id="fStock" type="number" min="0" value="0">
      <div style="display:flex;gap:8px">
        <button class="btn primary" type="submit">Guardar</button>
        <button type="button" id="cancelNew" class="btn">Cancelar</button>
      </div>
    </form>
  `;
  content.appendChild(formBox);

  if (isCashier()){
    // hide form entirely
    formBox.style.display = 'none';
  }

  // cart area
  const cartBox = document.createElement('div');
  cartBox.style.marginTop = '12px';
  cartBox.id = 'cartBox';
  cartBox.innerHTML = `
    <div id="cartContent" class="panel" style="display:none">
      <h3>Carrito</h3>
      <div id="cartItems"></div>
      <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center">
        <div><strong>Total:</strong> <span id="cartTotal">S/ 0.00</span></div>
        <div style="display:flex;gap:8px">
          <button id="clearCartBtn" class="btn">Vaciar</button>
          <button id="checkoutBtn" class="btn primary">Procesar Venta</button>
        </div>
      </div>
    </div>
  `;
  content.appendChild(cartBox);

  // draw product rows
  const products = loadProducts();
  productsCache = products.slice();
  const tbody = tableWrap.querySelector('#productsTbody');

  function drawRows(filter=''){
    tbody.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const filtered = productsCache.filter(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
    if(filtered.length === 0){
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:18px;color:var(--muted)">No hay productos</td></tr>`;
      return;
    }
    filtered.forEach(p=>{
      // action buttons only for ADMIN
      let actionButtons = '';
      if (isAdmin()){
        actionButtons = `
          <button class="action-btn edit-btn" data-id="${p.id}" title="Editar">✏️</button>
          <button class="action-btn delete-btn" data-id="${p.id}" title="Eliminar">🗑️</button>
        `;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${actionButtons}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category || '')}</td>
        <td>S/ ${Number(p.price).toFixed(2)}</td>
        <td>${(p.stock !== undefined && p.stock !== null) ? p.stock : ''}</td>
        <td><input type="number" min="1" max="${p.stock ?? 9999}" value="1" style="width:70px;padding:6px;border-radius:6px;border:1px solid #ddd" ${p.stock==0 ? 'disabled' : ''}></td>
        <td><button class="btn add-btn" data-id="${p.id}">➕ Añadir</button></td>
      `;
      tbody.appendChild(tr);
    });

    // attach events (edit/delete only show if present)
    tbody.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = ()=>{ openProductForm(Number(btn.dataset.id)); });
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = ()=>{ deleteProduct(Number(btn.dataset.id)); });
    tbody.querySelectorAll('button.add-btn').forEach(btn => {
      btn.onclick = (e) => {
        const id = Number(btn.dataset.id);
        const row = btn.closest('tr');
        const qtyInput = row.querySelector('input[type="number"]');
        const qty = Math.max(1, Number(qtyInput.value || 1));
        addToCart(id, qty);
      };
    });
  }

  drawRows('');

  // control buttons behavior
  const openFormBtn = controls.querySelector('#openFormBtn');
  if(openFormBtn){
    openFormBtn.onclick = ()=> {
      const form = formBox.querySelector('#productFormNew');
      editingProductId = null;
      form.reset();
      form.querySelector('#formTitle').textContent = 'Nuevo Producto';
      form.classList.remove('hidden');
    };
  }

  const cancelBtn = formBox.querySelector('#cancelNew');
  if(cancelBtn){
    cancelBtn.onclick = ()=> {
      const form = formBox.querySelector('#productFormNew');
      form.classList.add('hidden');
      editingProductId = null;
      // reset submit handler
      form.onsubmit = productFormSubmitHandler;
    };
  }

  // default submit handler (create new or update existing)
  function productFormSubmitHandler(e){
    e.preventDefault();
    const fName = document.getElementById('fName').value.trim();
    const fPrice = parseFloat(document.getElementById('fPrice').value) || 0;
    const fCategory = document.getElementById('fCategory').value.trim() || 'General';
    const fStock = parseInt(document.getElementById('fStock').value) || 0;

    let list = loadProducts();
    if(editingProductId === null){
      // create
      const id = list.length ? Math.max(...list.map(x=>x.id)) + 1 : 1;
      list.push({ id, name: fName, price: fPrice, category: fCategory, stock: fStock });
      saveProducts(list);
      alert('Producto agregado');
    } else {
      // update
      const idx = list.findIndex(x => x.id === editingProductId);
      if(idx >= 0){
        list[idx].name = fName;
        list[idx].price = fPrice;
        list[idx].category = fCategory;
        list[idx].stock = fStock;
        saveProducts(list);
        alert('Producto actualizado');
      } else {
        alert('Producto no encontrado al intentar actualizar');
      }
    }

    editingProductId = null;
    formBox.querySelector('#productFormNew').classList.add('hidden');
    formBox.querySelector('#productFormNew').reset();
    drawRows(controls.querySelector('#searchProd').value);
  }

  // attach the default submit handler if exists (and only for admin)
  const productForm = formBox.querySelector('#productFormNew');
  if (productForm && isAdmin()) productForm.onsubmit = productFormSubmitHandler;

  // search
  const searchEl = controls.querySelector('#searchProd');
  if(searchEl) searchEl.onkeyup = ()=> { drawRows(searchEl.value); };

  // view cart
  const viewCartBtn = controls.querySelector('#viewCartBtn');
  if(viewCartBtn) viewCartBtn.onclick = ()=> { toggleCart(); };

  // render cart contents initially
  renderCartContents();

  // apply role-specific UI tweaks
  applyRoleRestrictionsAfterRender();
}

/* apply further restrictions after a view is rendered (disable/hide certain controls) */
function applyRoleRestrictionsAfterRender(){
  if (isCashier()){
    // hide all edit/delete buttons (already not rendered), but also hide any "Add product" type controls
    const createBtns = document.querySelectorAll('#openFormBtn');
    createBtns.forEach(b => b.style.display = 'none');

    // remove config / reports links already done in applyMenuRestrictions (run at init)
  }
}

/* ========== OPEN FORM TO EDIT PRODUCT ========== */
/* This function fills the form with product data and sets editingProductId */
function openProductForm(id){
  if (!isAdmin()) { alert('No tienes permisos para editar productos'); return; }

  const list = loadProducts();
  const p = list.find(x => x.id === id);
  if(!p) { alert('Producto no encontrado'); return; }

  // ensure products view is rendered and form exists
  renderProductsView(); // this rebuilds UI and will re-create the form DOM
  setTimeout(()=>{ // small timeout to wait for DOM to build
    const form = document.getElementById('productFormNew');
    if(!form) { alert('Formulario no disponible'); return; }
    editingProductId = id;
    form.classList.remove('hidden');
    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.getElementById('fName').value = p.name;
    document.getElementById('fPrice').value = p.price;
    document.getElementById('fCategory').value = p.category || '';
    document.getElementById('fStock').value = p.stock || 0;

    // ensure submit will update the correct product (productFormSubmitHandler already uses editingProductId variable)
  }, 80);
}

/* ========== DELETE PRODUCT ========== */
function deleteProduct(id){
  if (!isAdmin()) { alert('No tienes permisos para eliminar productos'); return; }
  if(!confirm('¿Seguro que deseas eliminar este producto?')) return;
  let list = loadProducts();
  list = list.filter(p => p.id !== id);
  saveProducts(list);
  alert('Producto eliminado');
  // if currently on Products view, re-render
  const active = Array.from(document.querySelectorAll('.menu a')).find(a => a.classList.contains('active'));
  if(active && active.textContent.trim() === 'Productos') renderProductsView();
}

/* ===================== CART LOGIC ===================== */
let CART = loadCart(); // [{id,name,price,qty}]
function persistCart(){ saveCart(CART); }

function addToCart(productId, qty){
  const products = loadProducts();
  const p = products.find(x => x.id === productId);
  if(!p) { alert('Producto no encontrado'); return; }
  if(p.stock !== undefined && qty > p.stock) { alert('Cantidad mayor al stock disponible'); return; }

  const existing = CART.find(x => x.id === productId);
  if(existing) existing.qty += qty;
  else CART.push({ id: productId, name: p.name, price: p.price, qty });
  persistCart();
  renderCartContents();
}

function renderCartContents(){
  const cartPanel = document.getElementById('cartContent');
  if(!cartPanel) return;
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  if(!cartItemsEl || !cartTotalEl) return;

  if(CART.length === 0){
    cartItemsEl.innerHTML = '<div style="color:var(--muted)">Carrito vacío</div>';
    cartTotalEl.textContent = 'S/ 0.00';
    return;
  }

  cartItemsEl.innerHTML = '';
  let total = 0;
  CART.forEach((it, idx) => {
    const line = document.createElement('div');
    line.style.display = 'flex'; line.style.justifyContent = 'space-between'; line.style.gap = '12px'; line.style.padding = '8px 0';
    line.innerHTML = `<div><strong>${escapeHtml(it.name)}</strong> <small style="color:var(--muted)">x ${it.qty}</small></div><div>S/ ${(it.price*it.qty).toFixed(2)}</div>`;
    const removeBtn = document.createElement('button'); removeBtn.className = 'btn'; removeBtn.textContent = '❌';
    removeBtn.onclick = ()=> { CART.splice(idx, 1); persistCart(); renderCartContents(); };
    line.appendChild(removeBtn);
    cartItemsEl.appendChild(line);
    total += it.price * it.qty;
  });

  cartTotalEl.textContent = 'S/ ' + total.toFixed(2);
}

function toggleCart(){
  const panel = document.getElementById('cartContent');
  if(!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

/* process checkout */
function processCheckout(){
  if(CART.length === 0) { alert('Carrito vacío'); return; }

  // reduce stock
  const prod = loadProducts();
  for(const it of CART){
    const p = prod.find(x => x.id === it.id);
    if(p && p.stock !== undefined) p.stock = Math.max(0, p.stock - it.qty);
  }
  saveProducts(prod);

  // create sale record
  const sales = loadSales();
  const total = CART.reduce((s, it) => s + it.price * it.qty, 0);
  const sale = { id: Date.now(), date: new Date().toISOString(), items: CART.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })), total };
  sales.push(sale);
  saveSales(sales);

  // clear cart
  CART = [];
  persistCart();
  renderCartContents();
  alert('Venta registrada. Total S/ ' + total.toFixed(2));

  // refresh product list view if active
  const active = Array.from(document.querySelectorAll('.menu a')).find(a => a.classList.contains('active'));
  if(active && active.textContent.trim() === 'Productos') renderProductsView();
}

/* global click handlers for cart buttons */
document.addEventListener('click', (e) => {
  if(e.target && e.target.id === 'clearCartBtn'){ if(!confirm('Vaciar carrito?')) return; CART = []; persistCart(); renderCartContents(); }
  if(e.target && e.target.id === 'checkoutBtn'){ processCheckout(); }
});

/* ===================== SALES / HISTORIAL ===================== */
function renderSalesView(){
  const content = clearMain();
  const actions = document.createElement('div'); actions.className='actions';
  actions.innerHTML = `<button id="exportSalesBtn" class="btn">⬇ Exportar Ventas (CSV)</button> <button id="clearSales" class="btn">🗑️ Limpiar historial</button>`;
  content.appendChild(actions);

  const tableWrap = document.createElement('div');
  tableWrap.innerHTML = `
    <table class="table">
      <thead>
        <tr><th>Fecha</th><th>Items</th><th>Total (S/)</th><th>Acciones</th></tr>
      </thead>
      <tbody id="salesTbody"></tbody>
    </table>
  `;
  content.appendChild(tableWrap);

  function draw(){
    const sales = loadSales().slice().reverse();
    const tbody = tableWrap.querySelector('#salesTbody'); tbody.innerHTML='';
    if(sales.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted)">No hay ventas</td></tr>';
      return;
    }
    sales.forEach(s=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDateIso(s.date)}</td>
        <td>${s.items.map(i=>`${escapeHtml(i.name)} x${i.qty}`).join('<br>')}</td>
        <td>${Number(s.total).toFixed(2)}</td>
        <td><button class="btn" data-id="${s.id}">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-id]').forEach(btn => btn.onclick = ()=>{ const id = Number(btn.dataset.id); if(!confirm('Eliminar venta?')) return; const list = loadSales().filter(x => x.id !== id); saveSales(list); draw(); });
  }

  actions.querySelector('#exportSalesBtn').onclick = ()=> {
    const data = loadSales();
    if(data.length === 0) return alert('No hay ventas para exportar');
    const rows = []; rows.push(['id','date','items','total']);
    for(const s of data) rows.push([s.id, s.date, s.items.map(it=>`${it.name} x${it.qty}`).join('; '), Number(s.total).toFixed(2)]);
    const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadText(csv,'ventas.csv','text/csv');
  };

  actions.querySelector('#clearSales').onclick = ()=> { if(!confirm('Borrar todo el historial de ventas?')) return; saveSales([]); draw(); };

  draw();
}

/* ===================== REPORTS ===================== */
function renderReportsView(){
  if (!isAdmin()) { // only admin allowed
    clearMain();
    const c = clearMain();
    c.innerHTML = `<div class="panel"><p>No tienes permisos para ver reportes.</p></div>`;
    return;
  }

  const content = clearMain();
  content.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
      <select id="periodSelect" style="padding:8px;border-radius:6px;border:1px solid #ddd">
        <option value="all">Todo</option>
        <option value="today">Hoy</option>
        <option value="week">Esta semana</option>
        <option value="month">Este mes</option>
      </select>
      <button id="btnGenerate" class="btn primary">Generar Reporte</button>
      <button id="btnExportReport" class="btn">⬇ Exportar CSV</button>
    </div>
    <div id="reportsArea"></div>
  `;
  const btnGen = content.querySelector('#btnGenerate');
  const btnExp = content.querySelector('#btnExportReport');
  const period = content.querySelector('#periodSelect');
  const area = content.querySelector('#reportsArea');

  function generate(){
    const sales = loadSales();
    const filt = filterByPeriod(sales, period.value);

    const totalIncome = filt.reduce((s,x)=>s + Number(x.total), 0);
    const counts = {};
    for(const s of filt){ for(const it of s.items){ counts[it.id] = (counts[it.id]||0) + it.qty; }}
    const prod = loadProducts();
    const arr = Object.keys(counts).map(id=>({ id: Number(id), name: (prod.find(p=>p.id==id)||{}).name || 'Desconocido', qty: counts[id] }));
    arr.sort((a,b)=>b.qty-a.qty);

    area.innerHTML = `
      <div class="panel">
        <h3>Ingresos Totales</h3>
        <p><strong>S/ ${totalIncome.toFixed(2)}</strong></p>
      </div>
      <div class="panel" style="margin-top:12px">
        <h3>Productos más vendidos</h3>
        <ol id="topList">${arr.slice(0,10).map(a=>`<li>${escapeHtml(a.name)} — ${a.qty} unidades</li>`).join('')}</ol>
      </div>
    `;

    btnExp.onclick = ()=>{
      const rows=[]; rows.push(['product_id','product_name','units_sold']);
      for(const a of arr) rows.push([a.id, a.name, a.qty]);
      const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      downloadText(csv,'reporte_productos.csv','text/csv');
    };
  }

  btnGen.onclick = generate;
  generate();
}

function filterByPeriod(sales, period){
  if(period === 'all') return sales;
  const now = new Date();
  return sales.filter(s=>{
    const d = new Date(s.date);
    if(period === 'today') return d.toDateString() === now.toDateString();
    if(period === 'week'){
      const start = new Date(now);
      const day = (start.getDay()+6)%7;
      start.setDate(start.getDate()-day); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate()+7);
      return d >= start && d < end;
    }
    if(period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return true;
  });
}

/* ===================== SETTINGS (no dark mode) ===================== */
function renderSettingsView(){
  if (!isAdmin()) {
    clearMain();
    const c = clearMain();
    c.innerHTML = `<div class="panel"><p>No tienes permisos para ver la configuración.</p></div>`;
    return;
  }

  const content = clearMain();
  const settings = loadSettings();
  const logo = settings.logo || DEFAULT_LOGO;

  content.innerHTML = `
    <div class="panel">
      <h3>Configuración</h3>
      <div style="display:flex;align-items:center;gap:12px">
        <div><img id="logoPreview" src="${logo}" style="width:120px;height:120px;border-radius:8px;object-fit:cover;border:1px solid #ddd"></div>
        <div style="flex:1">
          <label>Subir nuevo logo</label>
          <input type="file" id="logoFile" accept="image/*"><br>
          <small>El logo se guarda en localStorage (dataURL).</small>
        </div>
      </div>
      <hr>
      <div style="margin-top:12px">
        <button id="resetBtn" class="btn danger">Restaurar datos (Borrar todo)</button>
      </div>
    </div>
  `;

  content.querySelector('#logoFile').onchange = function(e){
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      const data = reader.result;
      const s = loadSettings(); s.logo = data; saveSettings(s);
      document.getElementById('logoPreview').src = data;
      alert('Logo actualizado');
      // update sidebar logo if present
      const sidebarLogo = document.querySelector('.logo img');
      if(sidebarLogo) sidebarLogo.src = data;
    };
    reader.readAsDataURL(f);
  };

  content.querySelector('#resetBtn').onclick = function(){
    if(!confirm('Esto eliminará productos, ventas y ajustes. Continuar?')) return;
    localStorage.removeItem(LS_PRODUCTS); localStorage.removeItem(LS_SALES); localStorage.removeItem(LS_SETTINGS); localStorage.removeItem(LS_CART);
    location.reload();
  };
}

/* ===================== NAVIGATION SETUP ===================== */
sidebarLinks.forEach(a=>{
  a.onclick = (e)=>{
    e.preventDefault();
    // If clicking logout handled separately
    if (a.id === 'menu-logout') return;
    sidebarLinks.forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    const t = a.textContent.trim();
    if(t === 'Productos') renderProductsView();
    else if(t === 'Ventas') renderSalesView();
    else if(t === 'Reportes') renderReportsView();
    else if(t === 'Configuración') renderSettingsView();
  };
});

/* ===================== INITIALIZE ===================== */
(function init(){
  // apply menu restrictions before anything
  applyMenuRestrictions();

  // set sidebar logo from settings if exists
  const settings = loadSettings(); const logo = settings.logo || DEFAULT_LOGO;
  if(sidebarLogoImg) sidebarLogoImg.src = logo;

  // default view
  const prodLink = document.getElementById('menu-productos');
  if(prodLink) prodLink.click(); else renderProductsView();
})();

/* Expose helpers for debugging */
window._app = { loadProducts, saveProducts, loadSales, saveSales, loadSettings, saveSettings, loadCart, saveCart, logout };

// Logout
document.getElementById('menu-logout').addEventListener('click', () => {
  localStorage.removeItem('sessionUser'); // elimina la sesión
  window.location.href = 'login.html';    // vuelve al login
});
