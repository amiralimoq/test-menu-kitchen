const SB_URL = 'https://ducmehygksmijtynfuzt.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y21laHlna3NtaWp0eW5mdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTgyNTQsImV4cCI6MjA4MTIzNDI1NH0.Zo0RTm5fPn-sA6AkqSIPCCiehn8iW2Ou4I26HnC2CfU';
const supabase = supabase.createClient(SB_URL, SB_KEY);

let userPhone = localStorage.getItem('user_phone');
let cart = {}; 

// منو (در نسخه پیشرفته از دیتابیس خوانده میشود)
const menuItems = [
    { name: "Burger", price: 12, cat: "burger", img: "https://source.unsplash.com/200x200/?burger", rating: 4.5, discount: 0 },
    { name: "Pizza", price: 18, cat: "pizza", img: "https://source.unsplash.com/200x200/?pizza", rating: 4.2, discount: 10 }, 
    { name: "Salad", price: 9, cat: "salad", img: "https://source.unsplash.com/200x200/?salad", rating: 4.8, discount: 0 },
    { name: "Soda", price: 3, cat: "drinks", img: "https://source.unsplash.com/200x200/?drink", rating: 4.0, discount: 0 }
];

window.onload = async () => {
    if (!userPhone) document.getElementById('signup-modal').style.display = 'flex';
    else {
        const {data} = await supabase.from('customers').select('full_name').eq('phone', userPhone).single();
        if(data) document.getElementById('user-name-display').innerText = data.full_name;
        showMenu();
    }
}

// 1. ثبت نام (اصلاح شده: ترکیب نام و نام خانوادگی)
async function registerUser() {
    const fname = document.getElementById('reg-fname').value;
    const lname = document.getElementById('reg-lname').value;
    const phone = document.getElementById('reg-phone').value;
    
    if(!fname || !lname || !phone) return alert("All fields are required (*).");
    
    const fullName = `${fname} ${lname}`;
    const { error } = await supabase.from('customers').upsert([{phone, full_name: fullName}], {onConflict:'phone'});
    
    if(!error) {
        localStorage.setItem('user_phone', phone);
        userPhone = phone;
        document.getElementById('signup-modal').style.display = 'none';
        showMenu();
    } else {
        alert("Error: " + error.message);
    }
}

function showMenu() {
    const area = document.getElementById('content-area');
    area.innerHTML = `<div class="tabs">
        <div class="tab active" onclick="filterCat('all')">All</div>
        <div class="tab" onclick="filterCat('burger')">Burger</div>
        <div class="tab" onclick="filterCat('pizza')">Pizza</div>
        <div class="tab" onclick="filterCat('drinks')">Drinks</div>
    </div><div class="grid" id="menu-grid"></div>`;
    renderGrid(menuItems);
}

function filterCat(cat) { renderGrid(cat === 'all' ? menuItems : menuItems.filter(i => i.cat === cat)); }

function renderGrid(items) {
    document.getElementById('menu-grid').innerHTML = items.map(item => {
        const finalPrice = item.price * (1 - item.discount/100);
        const qty = cart[item.name]?.qty || 0;
        let stars = ''; for(let i=1;i<=5;i++) stars += i <= Math.round(item.rating) ? '<i class="ri-star-fill"></i>' : '<i class="ri-star-line"></i>';
        
        return `<div class="card">
            <img src="${item.img}" style="width:100%; height:150px; object-fit:cover; border-radius:10px;">
            <div style="margin-top:10px; display:flex; justify-content:space-between;"><h4>${item.name}</h4><span class="rating-stars">${stars}</span></div>
            <div style="margin:5px 0;">${item.discount > 0 ? `<span class="old-price">$${item.price}</span>` : ''} <b>$${finalPrice.toFixed(2)}</b></div>
            ${qty === 0 ? `<button class="btn" style="width:100%" onclick="addToCart('${item.name}', ${finalPrice})">Add</button>` :
            `<div style="display:flex; justify-content:center; gap:10px;"><button class="btn" onclick="updateQty('${item.name}', -1)">-</button><b>${qty}</b><button class="btn" onclick="updateQty('${item.name}', 1)">+</button></div>`}
        </div>`;
    }).join('');
}

function addToCart(name, price) { cart[name] = { price, qty: 1 }; showMenu(); }
function updateQty(name, chg) { if(cart[name]){ cart[name].qty+=chg; if(cart[name].qty<=0) delete cart[name]; } showMenu(); }

function openCart() {
    let total = 0, html = `<h3>Your Cart</h3><div class="form-group"><label class="required">Table Number</label><select id="table-num" class="form-control"><option value="">Select...</option>${[1,2,3,4,5].map(n=>`<option>${n}</option>`)}</select></div>`;
    Object.keys(cart).forEach(n => { total += cart[n].price * cart[n].qty; html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>${n} x${cart[n].qty}</span><span>$${(cart[n].price*cart[n].qty).toFixed(2)}</span></div>`; });
    
    if(total===0) html += "<p>Empty</p>";
    else html += `<hr><h4>Total: $${total.toFixed(2)}</h4><button class="btn" style="width:100%; margin-top:20px;" onclick="placeOrder(${total})">Place Order</button>`;
    
    document.getElementById('content-area').innerHTML = `<div class="card" style="max-width:500px; margin:0 auto;">${html}</div>`;
}

async function placeOrder(total) {
    const table = document.getElementById('table-num').value;
    if(!table) return alert("Select Table!");
    
    // 1. ثبت سفارش
    const { data: order, error } = await supabase.from('orders').insert([{ 
        customer_phone: userPhone, 
        table_number: table, 
        total_price: total, 
        final_price: total, 
        status: 'new' 
    }]).select().single();
    
    if(error) return alert(error.message);

    // 2. ثبت آیتم‌های سفارش (برای استفاده در تاریخچه و سفارش مجدد)
    const items = Object.keys(cart).map(k => ({ order_id: order.id, item_name: k, price: cart[k].price, qty: cart[k].qty }));
    await supabase.from('order_items').insert(items);

    // 3. آپدیت آمار مشتری
    const { data: cust } = await supabase.from('customers').select('total_orders, total_spent').eq('phone', userPhone).single();
    if(cust) {
        await supabase.from('customers').update({
            total_orders: (cust.total_orders || 0) + 1,
            total_spent: (cust.total_spent || 0) + total
        }).eq('phone', userPhone);
    }

    alert("Order Placed!");
    cart = {};
    showHistory();
}

// رزرو (اصلاح شده: نام و نام خانوادگی جدا)
function openReserve() { document.getElementById('reserve-modal').style.display='flex'; }
async function submitReserve() {
    const fname=document.getElementById('res-fname').value;
    const lname=document.getElementById('res-lname').value;
    const p=document.getElementById('res-phone').value;
    const g=document.getElementById('res-guests').value;
    const d=document.getElementById('res-date').value;
    const t=document.getElementById('res-time').value;

    if(!fname||!lname||!p||!g||!d||!t) return alert("All fields required");
    
    const fullName = `${fname} ${lname}`;
    const code = 'RES-'+Math.floor(Math.random()*10000);
    
    const {error} = await supabase.from('reservations').insert([{customer_name:fullName, phone:p, guests:g, reserve_date:d, reserve_time:t, reserve_code:code}]);
    if(!error) { alert("Code: "+code); document.getElementById('reserve-modal').style.display='none'; }
}

async function showLeaderboard() {
    const {data} = await supabase.from('customers').select('full_name, total_orders').order('total_orders',{ascending:false}).limit(10);
    let h = `<h3>Top Customers</h3><div class="card">`;
    data.forEach((c,i)=> h+=`<div style="padding:10px; border-bottom:1px solid #eee;">#${i+1} ${c.full_name} (${c.total_orders})</div>`);
    h+=`</div>`; document.getElementById('content-area').innerHTML = h;
}

// تاریخچه (اصلاح شده: دریافت آیتم‌ها برای سفارش مجدد)
async function showHistory() {
    const {data} = await supabase.from('orders').select('*, order_items(*)').eq('customer_phone', userPhone).eq('status','delivered').order('created_at',{ascending:false});
    
    let h = `<h3>History</h3>`;
    if(!data || data.length === 0) h += "<p>No orders yet.</p>";
    else {
        data.forEach(o => {
            // ساخت لیست آیتم‌ها برای نمایش در دکمه
            const itemsJson = JSON.stringify(o.order_items).replace(/"/g, "&quot;");
            
            h += `<div class="card">
                <div style="display:flex; justify-content:space-between;"><b>Order #${o.id}</b><span>$${o.final_price}</span></div>
                <div style="font-size:12px; color:#555; margin-bottom:10px;">
                    ${o.order_items.map(i => `${i.item_name} x${i.qty}`).join(', ')}
                </div>
                <div style="margin-top:10px; display:flex; gap:5px;">
                    <!-- دکمه سفارش مجدد: آیتم‌ها را به سبد می‌فرستد -->
                    <button class="btn btn-outline" onclick="reOrder('${itemsJson}')">Add to Cart</button>
                    ${!o.rating ? `<button class="btn" onclick="rateOrder(${o.id})">Rate</button>` : `<span>Rated: ${o.rating}</span>`}
                </div>
                ${o.review ? `<small style="color:grey; display:block; margin-top:5px;">Review: ${o.review}</small>` : ''}
            </div>`;
        });
    }
    document.getElementById('content-area').innerHTML = h;
}

// تابع سفارش مجدد واقعی (اضافه کردن به سبد)
function reOrder(itemsJson) {
    const items = JSON.parse(itemsJson);
    items.forEach(i => {
        if(cart[i.item_name]) cart[i.item_name].qty += i.qty;
        else cart[i.item_name] = { price: i.price, qty: i.qty };
    });
    alert("Items added to cart!");
    openCart();
}

async function rateOrder(id) {
    const s = prompt("Rate 1-5:"); if(s<1||s>5) return;
    const r = prompt("Review:");
    await supabase.from('orders').update({rating:s, review:r}).eq('id',id);
    if(s==1) await supabase.from('messages').insert([{title:'Low Rating!', content:`Order #${id} got 1 star: ${r}`}]);
    showHistory();
}
