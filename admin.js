// ==========================================
// تنظیمات اتصال به دیتابیس Supabase
// مقادیر زیر را از پنل Supabase > Project Settings > API کپی کنید
// ==========================================
const SUPABASE_URL = 'https://ducmehygksmijtynfuzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y21laHlna3NtaWp0eW5mdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTgyNTQsImV4cCI6MjA4MTIzNDI1NH0.Zo0RTm5fPn-sA6AkqSIPCCiehn8iW2Ou4I26HnC2CfU';

// راه‌اندازی کلاینت
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. خروج از حساب (Logout) ---
    const logoutBtn = document.querySelector('.logout');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    // --- 2. متغیرهای فرم ---
    const userInput = document.getElementById('new-user');
    const passInput = document.getElementById('new-pass');
    const createBtn = document.getElementById('create-btn');
    const userError = document.getElementById('user-error');
    const passError = document.getElementById('pass-error');
    const successMsg = document.getElementById('success-msg');
    
    // بارگذاری لیست کارمندان به محض باز شدن صفحه
    loadStaffList();

    // --- 3. کلیک روی دکمه ساخت اکانت ---
    if(createBtn) {
        createBtn.addEventListener('click', async () => {
            const username = userInput.value.trim();
            const password = passInput.value.trim();
            let isValid = true;

            // مخفی کردن پیام‌های قبلی
            userError.style.display = 'none';
            passError.style.display = 'none';
            successMsg.style.display = 'none';

            // الف) اعتبارسنجی نام کاربری (فقط حروف انگلیسی و عدد)
            const userRegex = /^[a-zA-Z0-9]+$/;
            if (!userRegex.test(username)) {
                userError.innerText = "Username must contain only English letters and numbers.";
                userError.style.display = 'block';
                isValid = false;
            }

            // ب) اعتبارسنجی رمز عبور (بزرگ، کوچک، عدد - انگلیسی)
            // حداقل یک حرف کوچک، یک بزرگ، یک عدد
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/;
            if (!passRegex.test(password)) {
                passError.innerText = "Password must include 1 Uppercase, 1 Lowercase, and 1 Number.";
                passError.style.display = 'block';
                isValid = false;
            }

            if (isValid) {
                // غیرفعال کردن دکمه تا پایان عملیات
                createBtn.innerText = "Saving...";
                createBtn.disabled = true;

                try {
                    // چک کردن تکراری نبودن نام کاربری در دیتابیس
                    const { data: existingUser } = await supabase
                        .from('staff')
                        .select('username')
                        .eq('username', username);

                    if (existingUser && existingUser.length > 0) {
                        userError.innerText = "This username is already taken!";
                        userError.style.display = 'block';
                    } else {
                        // ذخیره در دیتابیس Supabase
                        const { error } = await supabase
                            .from('staff')
                            .insert([{ username: username, password: password }]);

                        if (error) throw error;

                        // موفقیت
                        successMsg.style.display = 'block';
                        userInput.value = '';
                        passInput.value = '';
                        loadStaffList(); // به‌روزرسانی لیست پایین صفحه
                    }
                } catch (error) {
                    console.error(error);
                    alert("Database Error: " + error.message);
                } finally {
                    createBtn.innerText = "Create Account";
                    createBtn.disabled = false;
                }
            }
        });
    }

    // --- 4. تابع دریافت لیست کارمندان از دیتابیس ---
    async function loadStaffList() {
        const container = document.getElementById('staff-container');
        if(!container) return;

        // دریافت اطلاعات از جدول staff
        const { data, error } = await supabase
            .from('staff')
            .select('*')
            .order('id', { ascending: false });

        container.innerHTML = '';

        if (error) {
            container.innerHTML = '<p style="color:red">Error loading staff list.</p>';
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#aaa; font-size:13px;">No staff accounts created yet.</p>';
            return;
        }

        // ساخت HTML برای هر کارمند
        data.forEach(user => {
            const div = document.createElement('div');
            div.className = 'staff-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:30px; height:30px; background:#eee; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                        <i class="ri-user-line" style="color:#555;"></i>
                    </div>
                    <span style="font-weight:500; font-size:14px;">${user.username}</span>
                </div>
                <div class="btn-delete" onclick="deleteUser(${user.id})">
                    <i class="ri-delete-bin-line"></i> Delete
                </div>
            `;
            container.appendChild(div);
        });
    }

    // --- 5. تابع حذف کاربر (Global) ---
    window.deleteUser = async function(id) {
        if(confirm('Are you sure you want to remove this access?')) {
            const { error } = await supabase
                .from('staff')
                .delete()
                .eq('id', id);

            if (error) {
                alert("Error deleting user: " + error.message);
            } else {
                loadStaffList(); // رفرش لیست
            }
        }
    }
});
