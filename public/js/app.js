/* app.js - Frontend application adapted for Node.js backend with MySQL */

/* ===================== UTIL HELPERS ===================== */
function escapeHtml(s) {
  return String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"}[c]));
}
function formatDateIso(iso){ const d=new Date(iso); return d.toLocaleString(); }
function downloadText(text, filename, type='text/plain'){ const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

/* ===================== DOM ===================== */
const sidebarLinks = document.querySelectorAll('.menu a');
const contentRoot = document.querySelector('.content');
const sidebarLogoImg = document.querySelector('#sidebarLogo');
const topbarTitle = document.querySelector('#topbarTitle');

/* ===================== UI HELPERS ===================== */
function clearMain(){
  contentRoot.innerHTML = '';
  return contentRoot;
}

/* ===================== ROLE HELPERS ===================== */
function isAdmin(){ return CURRENT_USER && CURRENT_USER.role === 'ADMIN'; }
function isCashier(){ return CURRENT_USER && CURRENT_USER.role === 'CAJERO'; }

/* ===================== API HELPERS ===================== */
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

/* Logout */
async function logout(){
  const result = await apiRequest('/auth/logout', { method: 'POST' });
  if (result.success) {
    window.location.href = '/login';
  }
}

/* Conectar logout link */
const logoutLink = document.getElementById('menu-logout');
if (logoutLink) logoutLink.onclick = logout;

/* ===================== PRODUCTS VIEW (CRUD) ===================== */
let productsCache = [];
let editingProductId = null;

async function renderProductsView(){
  const content = clearMain();

  // Load products from API
  const result = await apiRequest('/api/products');
  if (!result.success) {
    content.innerHTML = '<div class="panel"><p>Error cargando productos</p></div>';
    return;
  }
  productsCache = result.products;

  // controls
  const controls = document.createElement('div');
  controls.className = 'actions';

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

  // new/edit form
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
    };
  }

  // form submit handler
  async function productFormSubmitHandler(e){
    e.preventDefault();
    const fName = document.getElementById('fName').value.trim();
    const fPrice = parseFloat(document.getElementById('fPrice').value) || 0;
    const fCategory = document.getElementById('fCategory').value.trim() || 'General';
    const fStock = parseInt(document.getElementById('fStock').value) || 0;

    let result;
    if(editingProductId === null){
      // create
      result = await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify({ name: fName, category: fCategory, price: fPrice, stock: fStock })
      });
    } else {
      // update
      result = await apiRequest(`/api/products/${editingProductId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: fName, category: fCategory, price: fPrice, stock: fStock })
      });
    }

    if (result.success) {
      alert(result.message);
      editingProductId = null;
      formBox.querySelector('#productFormNew').classList.add('hidden');
      formBox.querySelector('#productFormNew').reset();
      renderProductsView(); // reload
    } else {
      alert('Error: ' + result.message);
    }
  }

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
}

/* ========== OPEN FORM TO EDIT PRODUCT ========== */
async function openProductForm(id){
  if (!isAdmin()) { alert('No tienes permisos para editar productos'); return; }

  const p = productsCache.find(x => x.id === id);
  if(!p) { alert('Producto no encontrado'); return; }

  renderProductsView();
  setTimeout(()=>{
    const form = document.getElementById('productFormNew');
    if(!form) { alert('Formulario no disponible'); return; }
    editingProductId = id;
    form.classList.remove('hidden');
    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.getElementById('fName').value = p.name;
    document.getElementById('fPrice').value = p.price;
    document.getElementById('fCategory').value = p.category || '';
    document.getElementById('fStock').value = p.stock || 0;
  }, 80);
}

/* ========== DELETE PRODUCT ========== */
async function deleteProduct(id){
  if (!isAdmin()) { alert('No tienes permisos para eliminar productos'); return; }
  if(!confirm('¿Seguro que deseas eliminar este producto?')) return;
  
  const result = await apiRequest(`/api/products/${id}`, { method: 'DELETE' });
  
  if (result.success) {
    alert(result.message);
    const active = Array.from(document.querySelectorAll('.menu a')).find(a => a.classList.contains('active'));
    if(active && active.textContent.trim() === 'Productos') renderProductsView();
  } else {
    alert('Error: ' + result.message);
  }
}

/* ===================== CART LOGIC ===================== */
let CART = [];

function addToCart(productId, qty){
  const p = productsCache.find(x => x.id === productId);
  if(!p) { alert('Producto no encontrado'); return; }
  if(p.stock !== undefined && qty > p.stock) { alert('Cantidad mayor al stock disponible'); return; }

  const existing = CART.find(x => x.id === productId);
  if(existing) existing.qty += qty;
  else CART.push({ id: productId, name: p.name, price: p.price, qty });
  
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
    removeBtn.onclick = ()=> { CART.splice(idx, 1); renderCartContents(); };
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

  const result = await apiRequest('/api/sales', {
    method: 'POST',
    body: JSON.stringify({ items: CART })
  });

  if (result.success) {
    alert('Venta registrada. Total S/ ' + result.sale.total.toFixed(2));
    CART = [];
    renderCartContents();
    const active = Array.from(document.querySelectorAll('.menu a')).find(a => a.classList.contains('active'));
    if(active && active.textContent.trim() === 'Productos') renderProductsView();
  } else {
    alert('Error: ' + result.message);
  }
}

/* global click handlers for cart buttons */
document.addEventListener('click', (e) => {
  if(e.target && e.target.id === 'clearCartBtn'){ 
    if(!confirm('Vaciar carrito?')) return; 
    CART = []; 
    renderCartContents(); 
  }
  if(e.target && e.target.id === 'checkoutBtn'){ processCheckout(); }
});

/* ===================== SALES / HISTORIAL ===================== */
async function renderSalesView(){
  const content = clearMain();
  
  const result = await apiRequest('/api/sales');
  if (!result.success) {
    content.innerHTML = '<div class="panel"><p>Error cargando ventas</p></div>';
    return;
  }

  const actions = document.createElement('div'); actions.className='actions';
  actions.innerHTML = `<button id="exportSalesBtn" class="btn">⬇ Exportar Ventas (CSV)</button>`;
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
    const sales = result.sales.slice().reverse();
    const tbody = tableWrap.querySelector('#salesTbody'); tbody.innerHTML='';
    if(sales.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted)">No hay ventas</td></tr>';
      return;
    }
    sales.forEach(s=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDateIso(s.created_at)}</td>
        <td>${s.items.map(i=>`${escapeHtml(i.product_name)} x${i.quantity}`).join('<br>')}</td>
        <td>${Number(s.total).toFixed(2)}</td>
        <td>${isAdmin() ? `<button class="btn" data-id="${s.id}">Eliminar</button>` : ''}</td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-id]').forEach(btn => btn.onclick = async ()=>{ 
      const id = Number(btn.dataset.id); 
      if(!confirm('Eliminar venta?')) return; 
      const delResult = await apiRequest(`/api/sales/${id}`, { method: 'DELETE' });
      if (delResult.success) {
        alert(delResult.message);
        renderSalesView();
      }
    });
  }

  actions.querySelector('#exportSalesBtn').onclick = ()=> {
    const data = result.sales;
    if(data.length === 0) return alert('No hay ventas para exportar');
    const rows = []; rows.push(['id','date','items','total']);
    for(const s of data) rows.push([s.id, s.created_at, s.items.map(it=>`${it.product_name} x${it.quantity}`).join('; '), Number(s.total).toFixed(2)]);
    const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadText(csv,'ventas.csv','text/csv');
  };

  draw();
}

/* ===================== REPORTS ===================== */
async function renderReportsView(){
  if (!isAdmin()) {
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

  let currentReport = null;

  async function generate(){
    const result = await apiRequest(`/api/sales/reports/summary?period=${period.value}`);
    
    if (!result.success) {
      area.innerHTML = '<div class="panel"><p>Error generando reporte</p></div>';
      return;
    }

    currentReport = result.report;
    const { totalIncome, topProducts } = result.report;

    area.innerHTML = `
      <div class="panel">
        <h3>Ingresos Totales</h3>
        <p><strong>S/ ${Number(totalIncome).toFixed(2)}</strong></p>
      </div>
      <div class="panel" style="margin-top:12px">
        <h3>Productos más vendidos</h3>
        <ol id="topList">${topProducts.slice(0,10).map(a=>`<li>${escapeHtml(a.name)} — ${a.qty} unidades</li>`).join('')}</ol>
      </div>
    `;

    btnExp.onclick = ()=>{
      if (!currentReport) return;
      const rows=[]; rows.push(['product_name','units_sold']);
      for(const a of currentReport.topProducts) rows.push([a.name, a.qty]);
      const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      downloadText(csv,'reporte_productos.csv','text/csv');
    };
  }

  btnGen.onclick = generate;
  generate();
}

/* ===================== SETTINGS ===================== */
async function renderSettingsView(){
  if (!isAdmin()) {
    const c = clearMain();
    c.innerHTML = `<div class="panel"><p>No tienes permisos para ver la configuración.</p></div>`;
    return;
  }

  const content = clearMain();
  
  // Get current logo from settings
  const logoResult = await apiRequest('/api/settings/logo');
  const logo = logoResult.value || '/img/logo.png';

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
      const result = await apiRequest('/api/settings/logo', {
        method: 'POST',
        body: JSON.stringify({ value: data })
      });
      
      if (result.success) {
        document.getElementById('logoPreview').src = data;
        alert('Logo actualizado');
        if(sidebarLogoImg) sidebarLogoImg.src = data;
      } else {
        alert('Error actualizando logo');
      }
    };
    reader.readAsDataURL(f);
  };

  content.querySelector('#resetBtn').onclick = async function(){
    if(!confirm('Esto eliminará productos, ventas y ajustes. Continuar?')) return;
    
    const result = await apiRequest('/api/settings/reset/all', { method: 'POST' });
    
    if (result.success) {
      alert(result.message);
      location.reload();
    } else {
      alert('Error: ' + result.message);
    }
  };
}

/* ===================== NAVIGATION SETUP ===================== */
sidebarLinks.forEach(a=>{
  a.onclick = (e)=>{
    e.preventDefault();
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
(async function init(){
  // Load initial logo
  if (isAdmin()) {
    const logoResult = await apiRequest('/api/settings/logo');
    if (logoResult.value && sidebarLogoImg) {
      sidebarLogoImg.src = logoResult.value;
    }
  }

  // default view
  const prodLink = document.getElementById('menu-productos');
  if(prodLink) prodLink.click(); else renderProductsView();
})();
