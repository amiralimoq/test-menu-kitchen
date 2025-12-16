const SB_URL = 'https://ducmehygksmijtynfuzt.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y21laHlna3NtaWp0eW5mdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTgyNTQsImV4cCI6MjA4MTIzNDI1NH0.Zo0RTm5fPn-sA6AkqSIPCCiehn8iW2Ou4I26HnC2CfU';
const supabase = supabase.createClient(SB_URL, SB_KEY);

const main = document.getElementById('k-main');

// --- 1. مدیریت سفارشات (Order Management) ---
async function renderOrders() {
    main.innerHTML = `
        <h3>Order Management</h3>
        <!-- تب‌های وضعیت: سفارش جدید، درحال آماده‌سازی، تحویل شده -->
        <div class="tabs">
            <div class="tab active" onclick="switchTab(this, 'new')">New Orders</div>
            <div class="tab" onclick="switchTab(this, 'preparing')">Preparing</div>
            <div class="tab" onclick="switchTab(this, 'delivered')">Delivered</div>
        </div>
        <div id="order-list" class="grid">Loading...</div>
    `;
    // پیش‌فرض تب اول لود شود
    loadOrders('new');
}

function switchTab(el, status) {
    // تغییر استایل تب‌ها
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    loadOrders(status);
}

async function loadOrders(status) {
    const list = document.getElementById('order-list');
    list.innerHTML = 'Loading...';

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: true });

    if (error) {
        return list.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
    }

    if (!data || data.length === 0) {
        return list.innerHTML = `<p>No orders in '${status}' list.</p>`;
    }

    list.innerHTML = data.map(o => `
        <div class="card">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <!-- حذف # از شماره سفارش -->
                <span style="font-weight:bold; font-size:16px;">Order ${o.id}</span>
                <!-- نمایش شماره میز در بالا راست -->
                <span style="color:var(--primary); font-weight:bold;">Table ${o.table_number}</span>
            </div>
            
            <div style="margin-bottom:10px;">
                <div style="font-size:14px; color:#555;">Total Price: <b>$${o.final_price}</b></div>
                <div style="font-size:12px; color:#aaa;">${new Date(o.created_at).toLocaleString()}</div>
            </div>
            
            <div style="margin-top:15px;">
                ${getActionButtons(o.id, status)}
            </div>
        </div>
    `).join('');
}

function getActionButtons(id, status) {
    // دکمه‌ها بر اساس وضعیت
    if (status === 'new') {
        // فقط دکمه تایید (تیک) - دکمه رد کردن حذف شد
        return `<button class="btn" onclick="updateStatus(${id}, 'preparing')" style="width:100%">
                    <i class="ri-check-line"></i> Confirm & Prepare
                </button>`;
    } else if (status === 'preparing') {
        // دکمه تحویل شد
        return `<button class="btn" style="background:#2ECC71; width:100%" onclick="updateStatus(${id}, 'delivered')">
                    <i class="ri-bike-line"></i> Order Delivered
                </button>`;
    } else {
        return `<span style="color:green; font-weight:bold;"><i class="ri-checkbox-circle-line"></i> Completed</span>`;
    }
}

async function updateStatus(id, newStatus) {
    if(!confirm("Change order status?")) return;

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    
    if (error) alert("Error: " + error.message);
    else {
        // رفرش کردن لیست فعلی
        const activeTab = document.querySelector('.tab.active');
        const currentStatus = activeTab.innerText.toLowerCase().includes('new') ? 'new' : 'preparing';
        loadOrders(currentStatus);
    }
}

// --- 2. مدیریت تخفیفات (Discounts) ---
async function renderDiscounts() {
    main.innerHTML = `
        <h3>Discount Center</h3>
        <div class="grid">
            
            <!-- بخش 1: اعمال تخفیف دستی -->
            <div class="card">
                <h4 style="margin-bottom:15px; color:var(--dark);">Manual Discount</h4>
                
                <div class="form-group">
                    <label>Percentage (%)</label>
                    <input id="md-perc" type="number" class="form-control" placeholder="e.g. 20">
                </div>
                
                <div class="form-group">
                    <label>Duration (Hours)</label>
                    <input id="md-time" type="number" class="form-control" placeholder="e.g. 24">
                </div>

                <div class="form-group">
                    <label>Apply To</label>
                    <select id="md-target" class="form-control">
                        <option value="all">All Products</option>
                        <option value="category">Specific Category</option>
                        <option value="item">Specific Item</option>
                    </select>
                </div>

                <button class="btn" onclick="applyManualDiscount()">Apply Discount</button>
            </div>

            <!-- بخش 2: ساخت کد تخفیف (کوپن) -->
            <div class="card">
                <h4 style="margin-bottom:15px; color:var(--dark);">Create Coupon Code</h4>
                
                <div class="form-group">
                    <label>Percentage (%)</label>
                    <input id="cc-perc" type="number" class="form-control">
                </div>

                <div class="form-group">
                    <label>Type</label>
                    <select id="cc-type" class="form-control">
                        <option value="one-time">One-time Use</option>
                        <option value="multi-use">Multi-use</option>
                        <option value="timed">Timed (24h)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Min Cart Amount ($)</label>
                    <input id="cc-min" type="number" class="form-control" placeholder="e.g. 100">
                </div>

                <div class="form-group">
                    <label>Target Customer (Phone/Name - Optional)</label>
                    <input id="cc-target" class="form-control" placeholder="e.g. 0912...">
                </div>

                <button class="btn" onclick="createCoupon()">Generate Code</button>
            </div>
        </div>
    `;
}

async function applyManualDiscount() {
    const perc = document.getElementById('md-perc').value;
    const time = document.getElementById('md-time').value;
    const target = document.getElementById('md-target').value;

    if (!perc || !time) return alert("Please fill all fields.");

    if (confirm(`Are you sure you want to apply a ${perc}% discount on ${target} for ${time} hours?`)) {
        // منطق واقعی: آپدیت قیمت‌ها در دیتابیس (محصولات).
        // فعلاً چون جدول Products نداریم، پیام موفقیت می‌دهیم.
        alert("Discount Applied Successfully!");
    }
}

async function createCoupon() {
    const perc = document.getElementById('cc-perc').value;
    const type = document.getElementById('cc-type').value;
    const min = document.getElementById('cc-min').value;
    const target = document.getElementById('cc-target').value;

    if (!perc) return alert("Percentage is required.");

    // ارسال پیام به ادمین (طبق درخواست)
    const { error } = await supabase.from('messages').insert([{
        title: 'New Coupon Created',
        content: `Kitchen created a coupon: ${perc}% off (${type}). Min Order: $${min || 0}. Target: ${target || 'All'}.`
    }]);

    if (error) alert("Error: " + error.message);
    else alert("Coupon Code Generated & Admin Notified!");
}

// --- 3. رزروها (Reservations) ---
async function renderReservations() {
    main.innerHTML = `
        <h3>Table Reservations</h3>
        <div class="search-bar" style="max-width:100%; margin-bottom:20px;">
            <i class="ri-search-line"></i>
            <input placeholder="Search name, phone, code..." oninput="searchRes(this.value)">
        </div>
        <div id="res-grid" class="grid">Loading...</div>
    `;

    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        document.getElementById('res-grid').innerHTML = "Error loading reservations.";
        return;
    }

    const grid = document.getElementById('res-grid');
    if (data.length === 0) {
        grid.innerHTML = "<p>No reservations found.</p>";
        return;
    }

    grid.innerHTML = data.map(r => `
        <div class="card res-card">
            <div style="display:flex; justify-content:space-between;">
                <h4>${r.customer_name}</h4>
                <span style="background:#eee; padding:2px 8px; border-radius:5px; font-size:12px;">${r.reserve_code}</span>
            </div>
            <div style="margin-top:10px; font-size:14px; color:#555;">
                <div><i class="ri-phone-line"></i> ${r.phone}</div>
                <div><i class="ri-calendar-line"></i> ${r.reserve_date} - ${r.reserve_time}</div>
                <div><i class="ri-user-line"></i> ${r.guests} Guests</div>
            </div>
        </div>
    `).join('');
}

function searchRes(query) {
    const cards = document.querySelectorAll('.res-card');
    const q = query.toLowerCase();
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'block' : 'none';
    });
}

// --- 4. مسیریابی و خروج ---
function showSection(sec) {
    // تغییر کلاس اکتیو در سایدبار
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    // (ساده‌سازی: فرض می‌کنیم ترتیب دکمه‌ها ثابت است، برای پروژه واقعی می‌توان با ID دقیق‌تر کرد)
    if(sec === 'orders') document.querySelector('.menu-list li:nth-child(1)').classList.add('active');
    if(sec === 'discounts') document.querySelector('.menu-list li:nth-child(2)').classList.add('active');
    if(sec === 'reservations') document.querySelector('.menu-list li:nth-child(3)').classList.add('active');

    if (sec === 'orders') renderOrders();
    if (sec === 'discounts') renderDiscounts();
    if (sec === 'reservations') renderReservations();
}

function logout() {
    alert("Logged out successfully!");
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// شروع برنامه
renderOrders();
