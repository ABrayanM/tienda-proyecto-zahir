/* app_full.js - MySQL Backend Version
   Versión con protección por sesión y roles (ADMIN / CAJERO).
   Mantiene: Productos (CRUD), Carrito, Ventas (historial), Reportes, Configuración (subir logo, reset).
   Ahora usa MySQL a través de API REST en lugar de LocalStorage.
*/

// API Helper Functions
const API_BASE = '/api';

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      sessionStorage.removeItem('sessionUser');
      window.location.href = 'login.html';
      return null;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Verificar sesión al cargar la página
(async function checkSession() {
  const session = JSON.parse(sessionStorage.getItem('sessionUser'));
  if (!session) {
      window.location.href = 'login.html';
  } else {
      console.log(`Usuario logueado: ${session.username} (${session.role})`);
  }
})();

/* ===================== PROTECCIÓN / SESIÓN ===================== */
const sessionUser = JSON.parse(sessionStorage.getItem('sessionUser') || 'null');
if (!sessionUser) {
  if (!location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
  }
} else {
  var CURRENT_USER = sessionUser; // { username, role }
}

/* ===================== CONFIG ===================== */
const LS_CART = 'cart_temp_v1'; // Cart still in LocalStorage for performance
const DEFAULT_LOGO = './img/logo.png';

/* ===================== DOM ===================== */
const sidebarLinks = document.querySelectorAll('.menu a');
const contentRoot = document.querySelector('.content');
const sidebarLogoImg = document.querySelector('.logo img');
const topbarTitle = document.querySelector('.topbar h1');

/* Mostrar nombre de usuario en topbar */
if (typeof CURRENT_USER !== 'undefined' && topbarTitle) {
  topbarTitle.textContent = `Bienvenido, ${CURRENT_USER.username.toUpperCase()}`;
}

/* ===================== API HELPERS ===================== */
async function loadProducts() { 
  try {
    return await apiCall('/products');
  } catch (error) {
    alert('Error cargando productos');
    return [];
  }
}

async function saveProduct(product) {
  try {
    if (product.id) {
      return await apiCall(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(product)
      });
    } else {
      return await apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(product)
      });
    }
  } catch (error) {
    alert('Error guardando producto: ' + error.message);
    throw error;
  }
}

async function deleteProductAPI(id) {
  try {
    return await apiCall(`/products/${id}`, { method: 'DELETE' });
  } catch (error) {
    alert('Error eliminando producto: ' + error.message);
    throw error;
  }
}

async function loadSales() { 
  try {
    return await apiCall('/sales');
  } catch (error) {
    alert('Error cargando ventas');
    return [];
  }
}

async function saveSale(sale) {
  try {
    return await apiCall('/sales', {
      method: 'POST',
      body: JSON.stringify(sale)
    });
  } catch (error) {
    alert('Error guardando venta: ' + error.message);
    throw error;
  }
}

async function deleteSaleAPI(id) {
  try {
    return await apiCall(`/sales/${id}`, { method: 'DELETE' });
  } catch (error) {
    alert('Error eliminando venta: ' + error.message);
    throw error;
  }
}

async function clearAllSales() {
  try {
    return await apiCall('/sales', { method: 'DELETE' });
  } catch (error) {
    alert('Error limpiando ventas: ' + error.message);
    throw error;
  }
}

async function loadSettings() { 
  try {
    return await apiCall('/settings');
  } catch (error) {
    return {};
  }
}

async function saveSetting(key, value) {
  try {
    return await apiCall(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  } catch (error) {
    alert('Error guardando configuración: ' + error.message);
    throw error;
  }
}

// Cart still uses localStorage for performance
function loadCart() { return JSON.parse(localStorage.getItem(LS_CART) || '[]'); }
function saveCart(c) { localStorage.setItem(LS_CART, JSON.stringify(c)); }

/* ===================== UTIL HELPERS ===================== */
function escapeHtml(s) {
  return String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"}[c]));
}
function formatDateIso(iso){ const d=new Date(iso); return d.toLocaleString(); }
function getProductName(item){ return item.product_name || item.name || 'Desconocido'; }

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
    // ocultar stock, reportes y config del sidebar para cajeros
    const stockLink = document.getElementById('menu-stock');
    const reportLink = document.getElementById('menu-reportes');
    const configLink = document.getElementById('menu-config');
    const prodLink = document.getElementById('menu-productos');
    if(stockLink) stockLink.style.display = 'none';
    if(reportLink) reportLink.style.display = 'none';
    if(configLink) configLink.style.display = 'none';
    // ventas visible para cajeros
  }
}

/* Logout */
async function logout(){
  try {
    await apiCall('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  }
  sessionStorage.removeItem('sessionUser');
  localStorage.removeItem(LS_CART);
  window.location.href = 'login.html';
}

/* Conectar logout link */
const logoutLink = document.getElementById('menu-logout');
if (logoutLink) logoutLink.onclick = logout;

/* ===================== PRODUCTS VIEW (CRUD) ===================== */
let productsCache = []; // cached array used in rendering
let editingProductId = null; // null = creating new, otherwise id of product being edited

async function renderProductsView(){
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
  const products = await loadProducts();
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
  async function productFormSubmitHandler(e){
    e.preventDefault();
    const fName = document.getElementById('fName').value.trim();
    const fPrice = parseFloat(document.getElementById('fPrice').value) || 0;
    const fCategory = document.getElementById('fCategory').value.trim() || 'General';
    const fStock = parseInt(document.getElementById('fStock').value) || 0;

    try {
      if(editingProductId === null){
        // create
        await saveProduct({ name: fName, price: fPrice, category: fCategory, stock: fStock });
        alert('Producto agregado');
      } else {
        // update
        await saveProduct({ id: editingProductId, name: fName, price: fPrice, category: fCategory, stock: fStock });
        alert('Producto actualizado');
      }

      editingProductId = null;
      formBox.querySelector('#productFormNew').classList.add('hidden');
      formBox.querySelector('#productFormNew').reset();
      
      // Reload products
      const products = await loadProducts();
      productsCache = products.slice();
      drawRows(controls.querySelector('#searchProd').value);
    } catch (error) {
      // Error already shown in saveProduct
    }
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
async function openProductForm(id){
  if (!isAdmin()) { alert('No tienes permisos para editar productos'); return; }

  const p = productsCache.find(x => x.id === id);
  if(!p) { alert('Producto no encontrado'); return; }

  // ensure products view is rendered and form exists
  await renderProductsView(); // this rebuilds UI and will re-create the form DOM
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
async function deleteProduct(id){
  if (!isAdmin()) { alert('No tienes permisos para eliminar productos'); return; }
  if(!confirm('¿Seguro que deseas eliminar este producto?')) return;
  
  try {
    await deleteProductAPI(id);
    alert('Producto eliminado');
    // if currently on Products view, re-render
    const active = Array.from(document.querySelectorAll('.menu a')).find(a => a.classList.contains('active'));
    if(active && active.textContent.trim() === 'Productos') await renderProductsView();
  } catch (error) {
    // Error already shown in deleteProductAPI
  }
}

/* ===================== CART LOGIC ===================== */
let CART = loadCart(); // [{id,name,price,qty}]
function persistCart(){ saveCart(CART); }

async function addToCart(productId, qty){
  const p = productsCache.find(x => x.id === productId);
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
async function processCheckout(){
  if(CART.length === 0) { alert('Carrito vacío'); return; }

  try {
    const total = CART.reduce((s, it) => s + it.price * it.qty, 0);
    
    // Send sale to API
    await saveSale({
      items: CART.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      total: total
    });

    // clear cart
    CART = [];
    persistCart();
    renderCartContents();
    alert('Venta registrada. Total S/ ' + total.toFixed(2));

    // refresh product list view if active
    const active = Array.from(document.querySelectorAll('.menu a')).find(a => a.classList.contains('active'));
    if(active && active.textContent.trim() === 'Productos') await renderProductsView();
  } catch (error) {
    // Error already shown in saveSale
  }
}

/* global click handlers for cart buttons */
document.addEventListener('click', (e) => {
  if(e.target && e.target.id === 'clearCartBtn'){ if(!confirm('Vaciar carrito?')) return; CART = []; persistCart(); renderCartContents(); }
  if(e.target && e.target.id === 'checkoutBtn'){ processCheckout(); }
});

/* ===================== STOCK MANAGEMENT ===================== */
async function renderStockView(){
  const content = clearMain();
  topbarTitle.textContent = 'Gestión de Stock';
  
  // Only admins can add stock movements
  const controlsHtml = isAdmin() ? `
    <div class="actions">
      <button id="openStockFormBtn" class="btn primary">➕ Registrar Movimiento</button>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <select id="filterType" style="padding:8px;border-radius:6px;border:1px solid #ddd">
          <option value="">Todos</option>
          <option value="INGRESO">Ingresos</option>
          <option value="EGRESO">Egresos</option>
        </select>
        <select id="filterProduct" style="padding:8px;border-radius:6px;border:1px solid #ddd">
          <option value="">Todos los productos</option>
        </select>
      </div>
    </div>
  ` : `<div class="actions"><p>Vista de solo lectura para cajeros</p></div>`;
  
  content.innerHTML = controlsHtml;
  
  // Stock summary
  const summaryBox = document.createElement('div');
  summaryBox.className = 'panel';
  summaryBox.style.marginTop = '12px';
  summaryBox.innerHTML = `
    <h3>Resumen de Stock</h3>
    <div id="stockSummary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px"></div>
  `;
  content.appendChild(summaryBox);
  
  // Stock movements table
  const tableWrap = document.createElement('div');
  tableWrap.style.marginTop = '12px';
  tableWrap.innerHTML = `
    <h3>Historial de Movimientos</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Producto</th>
          <th>Tipo</th>
          <th>Cantidad</th>
          <th>Motivo</th>
          <th>Usuario</th>
        </tr>
      </thead>
      <tbody id="stockMovementsTbody"></tbody>
    </table>
  `;
  content.appendChild(tableWrap);
  
  // Form for adding stock movements (only for admins)
  if (isAdmin()) {
    const formBox = document.createElement('div');
    formBox.style.marginTop = '12px';
    formBox.innerHTML = `
      <form id="stockMovementForm" class="form hidden">
        <h3>Registrar Movimiento de Stock</h3>
        <label>Producto</label>
        <select id="smProduct" required>
          <option value="">Seleccione un producto</option>
        </select>
        <label>Tipo de Movimiento</label>
        <select id="smType" required>
          <option value="INGRESO">Ingreso</option>
          <option value="EGRESO">Egreso</option>
        </select>
        <label>Cantidad</label>
        <input id="smQuantity" type="number" min="1" required>
        <label>Motivo</label>
        <input id="smReason" placeholder="Ej: Compra a proveedor, Ajuste de inventario, etc.">
        <div style="display:flex;gap:8px">
          <button class="btn primary" type="submit">Registrar</button>
          <button type="button" id="cancelStockForm" class="btn">Cancelar</button>
        </div>
      </form>
    `;
    content.appendChild(formBox);
  }
  
  // Load products for filters and form (only if admin needs them)
  if (isAdmin()) {
    const products = await loadProducts();
    const filterProduct = document.getElementById('filterProduct');
    const smProduct = document.getElementById('smProduct');
    
    products.forEach(p => {
      if (filterProduct) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        filterProduct.appendChild(opt);
      }
      if (smProduct) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        smProduct.appendChild(opt);
      }
    });
  }
  
  async function loadStockSummary() {
    try {
      const summary = await apiCall('/stock-movements/summary');
      const summaryDiv = document.getElementById('stockSummary');
      summaryDiv.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${summary.total_ingresos || 0}</div>
          <div class="stat-label">Total Ingresos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summary.total_egresos || 0}</div>
          <div class="stat-label">Total Egresos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summary.current_total_stock || 0}</div>
          <div class="stat-label">Stock Total Actual</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summary.total_movements || 0}</div>
          <div class="stat-label">Total Movimientos</div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading stock summary:', error);
    }
  }
  
  async function loadStockMovements(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.movement_type) params.append('movement_type', filters.movement_type);
      if (filters.product_id) params.append('product_id', filters.product_id);
      params.append('limit', '100');
      
      const movements = await apiCall(`/stock-movements?${params.toString()}`);
      const tbody = document.getElementById('stockMovementsTbody');
      tbody.innerHTML = '';
      
      if (movements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">No hay movimientos registrados</td></tr>';
        return;
      }
      
      movements.forEach(m => {
        const tr = document.createElement('tr');
        const typeClass = m.movement_type === 'INGRESO' ? 'text-success' : 'text-danger';
        const typeIcon = m.movement_type === 'INGRESO' ? '⬆️' : '⬇️';
        tr.innerHTML = `
          <td>${formatDateIso(m.created_at)}</td>
          <td>${escapeHtml(m.product_name || 'N/A')}</td>
          <td class="${typeClass}">${typeIcon} ${m.movement_type}</td>
          <td>${m.quantity}</td>
          <td>${escapeHtml(m.reason || '-')}</td>
          <td>${escapeHtml(m.username || 'Sistema')}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error('Error loading stock movements:', error);
      alert('Error cargando movimientos de stock');
    }
  }
  
  // Event listeners for filters
  if (isAdmin()) {
    const filterType = document.getElementById('filterType');
    const filterProduct = document.getElementById('filterProduct');
    
    filterType.onchange = () => {
      loadStockMovements({
        movement_type: filterType.value,
        product_id: filterProduct.value
      });
    };
    
    filterProduct.onchange = () => {
      loadStockMovements({
        movement_type: filterType.value,
        product_id: filterProduct.value
      });
    };
    
    // Form handlers
    const openStockFormBtn = document.getElementById('openStockFormBtn');
    const stockMovementForm = document.getElementById('stockMovementForm');
    const cancelStockForm = document.getElementById('cancelStockForm');
    
    openStockFormBtn.onclick = () => {
      stockMovementForm.classList.remove('hidden');
      openStockFormBtn.disabled = true;
    };
    
    cancelStockForm.onclick = () => {
      stockMovementForm.classList.add('hidden');
      stockMovementForm.reset();
      openStockFormBtn.disabled = false;
    };
    
    stockMovementForm.onsubmit = async (e) => {
      e.preventDefault();
      
      const movement = {
        product_id: parseInt(document.getElementById('smProduct').value),
        movement_type: document.getElementById('smType').value,
        quantity: parseInt(document.getElementById('smQuantity').value),
        reason: document.getElementById('smReason').value
      };
      
      try {
        await apiCall('/stock-movements', {
          method: 'POST',
          body: JSON.stringify(movement)
        });
        
        alert('Movimiento registrado exitosamente');
        stockMovementForm.reset();
        stockMovementForm.classList.add('hidden');
        openStockFormBtn.disabled = false;
        
        // Reload data
        await loadStockSummary();
        await loadStockMovements();
        
      } catch (error) {
        alert('Error registrando movimiento: ' + error.message);
      }
    };
  }
  
  // Initial load
  await loadStockSummary();
  await loadStockMovements();
}

/* ===================== SALES / HISTORIAL ===================== */
async function renderSalesView(){
  const content = clearMain();
  const actions = document.createElement('div'); actions.className='actions';
  actions.innerHTML = `<button id="clearSales" class="btn">🗑️ Limpiar historial</button>`;
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

  async function draw(){
    const sales = (await loadSales()).slice().reverse();
    const tbody = tableWrap.querySelector('#salesTbody'); tbody.innerHTML='';
    if(sales.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted)">No hay ventas</td></tr>';
      return;
    }
    sales.forEach(s=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDateIso(s.date)}</td>
        <td>${s.items.map(i=>`${escapeHtml(getProductName(i))} x${i.qty}`).join('<br>')}</td>
        <td>${Number(s.total).toFixed(2)}</td>
        <td><button class="btn" data-id="${s.id}">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-id]').forEach(btn => btn.onclick = async ()=>{ 
      const id = Number(btn.dataset.id); 
      if(!confirm('Eliminar venta?')) return; 
      try {
        await deleteSaleAPI(id);
        await draw();
      } catch (error) {
        // Error already shown
      }
    });
  }

  actions.querySelector('#clearSales').onclick = async ()=> { 
    if(!confirm('Borrar todo el historial de ventas?')) return; 
    try {
      await clearAllSales();
      await draw();
    } catch (error) {
      // Error already shown
    }
  };

  await draw();
}

/* ===================== REPORTS ===================== */
async function renderReportsView(){
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
    </div>
    <div id="reportsArea"></div>
  `;
  const btnGen = content.querySelector('#btnGenerate');
  const period = content.querySelector('#periodSelect');
  const area = content.querySelector('#reportsArea');

  async function generate(){
    const sales = await loadSales();
    const filt = filterByPeriod(sales, period.value);

    const totalIncome = filt.reduce((s,x)=>s + Number(x.total), 0);
    const counts = {};
    for(const s of filt){ 
      for(const it of s.items){ 
        const itemId = it.product_id || it.id;
        const itemName = getProductName(it);
        counts[itemId] = {
          id: itemId,
          name: itemName,
          qty: (counts[itemId]?.qty || 0) + it.qty
        };
      }
    }
    const arr = Object.values(counts);
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
  }

  btnGen.onclick = generate;
  await generate();
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
async function renderSettingsView(){
  if (!isAdmin()) {
    clearMain();
    const c = clearMain();
    c.innerHTML = `<div class="panel"><p>No tienes permisos para ver la configuración.</p></div>`;
    return;
  }

  const content = clearMain();
  const settings = await loadSettings();
  const logo = settings.logo || DEFAULT_LOGO;

  content.innerHTML = `
    <div class="panel">
      <h3>Configuración</h3>
      <div style="display:flex;align-items:center;gap:12px">
        <div><img id="logoPreview" src="${logo}" style="width:120px;height:120px;border-radius:8px;object-fit:cover;border:1px solid #ddd"></div>
        <div style="flex:1">
          <label>Subir nuevo logo</label>
          <input type="file" id="logoFile" accept="image/*"><br>
          <small>El logo se guarda en la base de datos (dataURL).</small>
        </div>
      </div>
      <hr>
      <div style="margin-top:12px">
        <button id="resetBtn" class="btn danger">Restaurar datos (Borrar todo)</button>
      </div>
    </div>
  `;

  content.querySelector('#logoFile').onchange = async function(e){
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = async ()=>{
      const data = reader.result;
      try {
        await saveSetting('logo', data);
        document.getElementById('logoPreview').src = data;
        alert('Logo actualizado');
        // update sidebar logo if present
        const sidebarLogo = document.querySelector('.logo img');
        if(sidebarLogo) sidebarLogo.src = data;
      } catch (error) {
        // Error already shown
      }
    };
    reader.readAsDataURL(f);
  };

  content.querySelector('#resetBtn').onclick = async function(){
    if(!confirm('Esto eliminará productos, ventas y ajustes. Continuar?')) return;
    alert('Nota: Para restaurar completamente, ejecute "npm run init-db" desde el servidor');
    localStorage.removeItem(LS_CART);
    location.reload();
  };
}

/* ===================== NAVIGATION SETUP ===================== */
sidebarLinks.forEach(a=>{
  a.onclick = async (e)=>{
    e.preventDefault();
    // If clicking logout handled separately
    if (a.id === 'menu-logout') return;
    sidebarLinks.forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    const t = a.textContent.trim();
    if(t === 'Productos') await renderProductsView();
    else if(t === 'Gestión de Stock') await renderStockView();
    else if(t === 'Ventas') await renderSalesView();
    else if(t === 'Reportes') await renderReportsView();
    else if(t === 'Configuración') await renderSettingsView();
  };
});

/* ===================== INITIALIZE ===================== */
(async function init(){
  // apply menu restrictions before anything
  applyMenuRestrictions();

  // set sidebar logo from settings if exists
  const settings = await loadSettings(); 
  const logo = settings.logo || DEFAULT_LOGO;
  if(sidebarLogoImg) sidebarLogoImg.src = logo;

  // default view
  const prodLink = document.getElementById('menu-productos');
  if(prodLink) prodLink.click(); else await renderProductsView();
})();

/* Expose helpers for debugging */
window._app = { loadProducts, loadSales, loadSettings, loadCart, saveCart, logout };

// Logout
document.getElementById('menu-logout').addEventListener('click', logout);
