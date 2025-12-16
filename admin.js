const SB_URL = 'https://ducmehygksmijtynfuzt.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y21laHlna3NtaWp0eW5mdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTgyNTQsImV4cCI6MjA4MTIzNDI1NH0.Zo0RTm5fPn-sA6AkqSIPCCiehn8iW2Ou4I26HnC2CfU';
const supabase = supabase.createClient(SB_URL, SB_KEY);

const main = document.getElementById('main');

// --- 1. Dashboard ---
async function renderDashboard() {
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
    const end = new Date(); end.setMonth(end.getMonth()+1); end.setDate(0);
    const { data } = await supabase.rpc('get_sales_report', { start_date: start, end_date: end });
    const stats = data[0] || { total_orders: 0, total_revenue: 0 };

    main.innerHTML = `
        <h3>Dashboard (This Month)</h3>
        <div class="grid" style="margin-top:20px;">
            <div class="card"><div style="color:var(--grey)">Orders</div><h2>${stats.total_orders}</h2></div>
            <div class="card"><div style="color:var(--grey)">Revenue</div><h2 style="color:var(--primary)">$${stats.total_revenue}</h2></div>
            <div class="card"><h4>Admin</h4><button class="btn btn-outline" onclick="changeMyPassword()">Change My Password</button></div>
        </div>`;
}

async function changeMyPassword() {
    const newPass = prompt("Enter new password (Letters & Numbers):");
    if(!newPass) return;
    // استفاده از Regex ساده‌تر (حروف و اعداد)
    if (!/^[a-zA-Z0-9]+$/.test(newPass)) return alert("Password: Letters & Numbers only");
    const { error } = await supabase.rpc('update_admin_password', { new_password: newPass, target_user: 'admin' });
    if(error) alert("Error: " + error.message); else alert("Updated!");
}

// --- 2. Reports ---
async function renderReports() {
    main.innerHTML = `<h3>Sales Reports</h3><div class="card">
        <div class="tabs">
            <div class="tab" onclick="loadReport(1)">1 Day</div><div class="tab" onclick="loadReport(7)">7 Days</div>
            <div class="tab" onclick="loadReport(30)">1 Month</div><div class="tab" onclick="loadReport(365)">1 Year</div>
        </div>
        <div style="display:flex; gap:10px; margin-top:15px;"><input type="date" id="d1" class="form-control"><input type="date" id="d2" class="form-control"><button class="btn" onclick="loadCustomReport()">Check</button></div>
        <div id="rep-result" style="margin-top:20px; padding:20px; background:#f9f9f9;">Select range...</div>
    </div>`;
}
async function loadReport(days) { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - days); fetchStats(s, e); }
async function loadCustomReport() { const d1 = document.getElementById('d1').value, d2 = document.getElementById('d2').value; if(d1&&d2) fetchStats(new Date(d1), new Date(d2)); }
async function fetchStats(s, e) {
    const { data } = await supabase.rpc('get_sales_report', { start_date: s, end_date: e });
    const r = data[0] || {total_orders:0, total_revenue:0};
    document.getElementById('rep-result').innerHTML = `<b>Orders: ${r.total_orders}</b> | <b style="color:var(--primary)">Revenue: $${r.total_revenue}</b>`;
}

// --- 3. Club ---
async function renderClub() {
    const { data: all } = await supabase.from('customers').select('*');
    const loyal = all ? all.filter(c => c.total_orders > 3) : [];
    
    // نمایش نام، نام خانوادگی، تلفن (full_name در دیتابیس ترکیب این دو است)
    let h = `<h3>Customer Club</h3><div class="tabs"><div class="tab active" onclick="toggleClub('all',this)">All</div><div class="tab" onclick="toggleClub('loyal',this)">Loyal (>3)</div></div>`;
    
    h += `<div id="list-all" class="card"><h4>All Customers</h4>`;
    if(all) all.forEach(c => h+=`<div style="padding:10px; border-bottom:1px solid #eee;">${c.full_name} - ${c.phone}</div>`);
    h += `</div>`;

    h += `<div id="list-loyal" class="card" style="display:none"><h4>Loyal Customers</h4>`;
    loyal.forEach(c => h+=`<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;"><span>${c.full_name} (${c.phone})</span><span><b>${c.total_orders}</b> orders ($${c.total_spent})</span></div>`);
    h += `</div>`;
    main.innerHTML = h;
}
function toggleClub(t, b) { document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); document.getElementById('list-all').style.display=t==='all'?'block':'none'; document.getElementById('list-loyal').style.display=t==='loyal'?'block':'none'; }

// --- 4. Messages ---
async function renderMessages() {
    const { data } = await supabase.from('messages').select('*').order('created_at', {ascending:false});
    main.innerHTML = `<h3>Messages</h3><div class="card">${data.map(m=>`<div style="padding:10px; border-bottom:1px solid #eee; ${m.title.includes('Rating 1')?'background:#FFF0F0':''}"><b style="${m.title.includes('Rating 1')?'color:red':''}">${m.title}</b>: ${m.content}</div>`).join('')}</div>`;
}

// --- 5. Staff/Admin ---
async function renderStaff() {
    main.innerHTML = `<h3>User Management</h3><div class="grid">
        <div class="card"><h4>Create</h4>
            <select id="role" class="form-control" style="margin-bottom:10px"><option value="staff">Kitchen Staff</option><option value="admin">Admin</option></select>
            <input id="nu" class="form-control" placeholder="Username" style="margin-bottom:10px">
            <input id="np" class="form-control" placeholder="Password" style="margin-bottom:10px">
            <button class="btn" onclick="createUser()">Create</button>
        </div>
        <div class="card"><h4>Kitchen Staff</h4><div id="sl">Loading...</div></div>
    </div>`;
    loadStaffList();
}

async function createUser() {
    const role = document.getElementById('role').value;
    const u = document.getElementById('nu').value;
    const p = document.getElementById('np').value;
    // Regex ساده: حروف و اعداد
    if(!/^[a-zA-Z0-9]+$/.test(u) || !/^[a-zA-Z0-9]+$/.test(p)) return alert("Only Letters & Numbers allowed");

    if(role==='staff') {
        const { error } = await supabase.rpc('create_staff', { new_username: u, new_password: p });
        if(error) alert(error.message); else { alert("Staff Created"); loadStaffList(); }
    } else {
        const { error } = await supabase.from('admins').insert([{username:u, password:p}]);
        if(error) alert(error.message); else alert("Admin Created");
    }
}

async function loadStaffList() {
    const { data, error } = await supabase.rpc('get_staff_list');
    const c = document.getElementById('sl');
    if(error) return c.innerHTML='Error';
    c.innerHTML = data.map(s => `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;"><span>${s.username}</span><button class="btn" style="background:red; padding:5px;" onclick="delStaff(${s.id})">Del</button></div>`).join('');
}
async function delStaff(id) { if(confirm("Delete?")) { await supabase.rpc('delete_staff', {target_id:id}); loadStaffList(); } }

function showSection(s) {
    if(s==='dashboard') renderDashboard();
    if(s==='reports') renderReports();
    if(s==='club') renderClub();
    if(s==='messages') renderMessages();
    if(s==='staff') renderStaff();
}
renderDashboard();
