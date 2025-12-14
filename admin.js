// ==========================================
// تنظیمات اتصال به دیتابیس Supabase
// ==========================================
const SUPABASE_URL = 'https://ducmehygksmijtynfuzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y21laHlna3NtaWp0eW5mdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTgyNTQsImV4cCI6MjA4MTIzNDI1NH0.Zo0RTm5fPn-sA6AkqSIPCCiehn8iW2Ou4I26HnC2CfU';

// اصلاح نام متغیر به supabaseClient
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {

    // --- Logout ---
    const logoutBtn = document.querySelector('.logout');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    // ============================================
    // 1. تغییر رمز خود مدیر
    // ============================================
    const adminPassInput = document.getElementById('admin-new-pass');
    const updateAdminBtn = document.getElementById('update-admin-btn');
    const adminError = document.getElementById('admin-error');
    const adminSuccess = document.getElementById('admin-success');

    if (updateAdminBtn) {
        updateAdminBtn.addEventListener('click', async () => {
            const newPass = adminPassInput.value.trim();
            adminError.style.display = 'none';
            adminSuccess.style.display = 'none';

            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/;
            if (!passRegex.test(newPass)) {
                adminError.innerText = "Password must include 1 Uppercase, 1 Lowercase, and 1 Number.";
                adminError.style.display = 'block';
                return;
            }

            updateAdminBtn.innerText = "Updating...";
            updateAdminBtn.disabled = true;

            // استفاده از supabaseClient
            const { error } = await supabaseClient
                .from('admins')
                .update({ password: newPass })
                .eq('username', 'admin');

            if (error) {
                adminError.innerText = "Error: " + error.message;
                adminError.style.display = 'block';
            } else {
                adminSuccess.style.display = 'block';
                adminPassInput.value = '';
            }
            updateAdminBtn.innerText = "Update My Password";
            updateAdminBtn.disabled = false;
        });
    }

    // ============================================
    // 2. مدیریت کارمندان
    // ============================================
    const userInput = document.getElementById('new-user');
    const passInput = document.getElementById('new-pass');
    const createBtn = document.getElementById('create-btn');
    const userError = document.getElementById('user-error');
    const passError = document.getElementById('pass-error');
    const staffSuccess = document.getElementById('staff-success');

    loadStaffList();

    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const username = userInput.value.trim();
            const password = passInput.value.trim();
            
            userError.style.display = 'none';
            passError.style.display = 'none';
            staffSuccess.style.display = 'none';
            let isValid = true;

            if (!/^[a-zA-Z0-9]+$/.test(username)) {
                userError.innerText = "Username: Only English letters and numbers allowed.";
                userError.style.display = 'block';
                isValid = false;
            }
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/;
            if (!passRegex.test(password)) {
                passError.innerText = "Password: Must have 1 Uppercase, 1 Lowercase, 1 Number.";
                passError.style.display = 'block';
                isValid = false;
            }

            if (isValid) {
                createBtn.innerText = "Saving...";
                createBtn.disabled = true;

                // استفاده از supabaseClient
                const { data: existing } = await supabaseClient.from('staff').select('username').eq('username', username);
                if (existing && existing.length > 0) {
                    userError.innerText = "Username already exists.";
                    userError.style.display = 'block';
                    createBtn.innerText = "Create Account";
                    createBtn.disabled = false;
                    return;
                }

                const { error } = await supabaseClient.from('staff').insert([{ username, password }]);
                
                if (!error) {
                    staffSuccess.style.display = 'block';
                    userInput.value = '';
                    passInput.value = '';
                    loadStaffList();
                } else {
                    alert(error.message);
                }
                createBtn.innerText = "Create Account";
                createBtn.disabled = false;
            }
        });
    }

    async function loadStaffList() {
        const container = document.getElementById('staff-container');
        if (!container) return;
        
        // استفاده از supabaseClient
        const { data, error } = await supabaseClient.from('staff').select('*').order('id', { ascending: false });

        if (error || !data) return;
        container.innerHTML = '';
        
        if (data.length === 0) {
            container.innerHTML = '<p style="color:#aaa">No staff found.</p>';
            return;
        }

        data.forEach(user => {
            const div = document.createElement('div');
            div.className = 'staff-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:35px; height:35px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                        <i class="ri-user-line"></i>
                    </div>
                    <span style="font-weight:500;">${user.username}</span>
                </div>
                <div class="staff-actions">
                    <button class="btn-action btn-reset" onclick="resetPassword(${user.id}, '${user.username}')">
                        <i class="ri-key-2-line"></i> New Pass
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteUser(${user.id})">
                        <i class="ri-delete-bin-line"></i> Delete
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    window.resetPassword = async function(id, username) {
        const newPass = prompt(`Enter NEW password for ${username}:`);
        
        if (newPass) {
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/;
            if (!passRegex.test(newPass)) {
                alert("Error: Password must include 1 Uppercase, 1 Lowercase, and 1 Number.");
                return;
            }

            // استفاده از supabaseClient
            const { error } = await supabaseClient
                .from('staff')
                .update({ password: newPass })
                .eq('id', id);

            if (error) {
                alert("Error updating password: " + error.message);
            } else {
                alert(`Password for ${username} updated successfully!`);
            }
        }
    }

    window.deleteUser = async function(id) {
        if(confirm('Are you sure you want to remove this user?')) {
            const { error } = await supabaseClient.from('staff').delete().eq('id', id);
            if(!error) loadStaffList();
        }
    }
});
