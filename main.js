// Application State
let appState = {
    currentUser: null,
    reports: [],
    users: [],
    selectedLocation: { x: 50, y: 50, address: "Sector 4, Near City Park Entrance" }
};

// DOM Elements
const elements = {
    body: document.body,
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    
    // Auth Sections
    authSection: document.getElementById('auth-section'),
    appSection: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authSwitchLink: document.getElementById('auth-switch-link'),
    regSwitchLink: document.getElementById('reg-switch-link'),
    loginCard: document.getElementById('login-card'),
    registerCard: document.getElementById('register-card'),
    
    // Sidebar details
    sidebar: document.getElementById('sidebar'),
    profileName: document.getElementById('profile-name'),
    profileRole: document.getElementById('profile-role'),
    profileAvatar: document.getElementById('profile-avatar'),
    logoutBtn: document.getElementById('logout-btn'),
    navLinks: document.querySelectorAll('.nav-item a'),
    
    // Panels
    panels: {
        dashboard: document.getElementById('panel-dashboard'),
        volunteer: document.getElementById('panel-volunteer'),
        admin: document.getElementById('panel-admin'),
        guides: document.getElementById('panel-guides')
    },
    
    // Dashboard Panel Elements
    reportForm: document.getElementById('report-form'),
    mockMap: document.getElementById('mock-map'),
    mapPinSelector: document.getElementById('map-pin-selector'),
    locationInput: document.getElementById('location-input'),
    myReportsFeed: document.getElementById('my-reports-feed'),
    
    // Volunteer Panel Elements
    volunteerReportsFeed: document.getElementById('volunteer-reports-feed'),
    
    // Admin Panel Elements
    adminUsersTable: document.getElementById('admin-users-table'),
    adminReportsTable: document.getElementById('admin-reports-table'),
    
    // Common Dashboard Components
    stats: {
        pending: document.getElementById('stat-pending'),
        progress: document.getElementById('stat-progress'),
        rescued: document.getElementById('stat-rescued')
    },
    tickerText: document.getElementById('ticker-text')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkSession();
    setupEventListeners();
});

// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        elements.body.classList.add('light-theme');
        elements.themeToggleBtn.innerHTML = '🌙';
    } else {
        elements.body.classList.remove('light-theme');
        elements.themeToggleBtn.innerHTML = '☀️';
    }
}

function toggleTheme() {
    if (elements.body.classList.contains('light-theme')) {
        elements.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        elements.themeToggleBtn.innerHTML = '☀️';
    } else {
        elements.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        elements.themeToggleBtn.innerHTML = '🌙';
    }
}

// Session Check
async function checkSession() {
    try {
        const response = await fetch('/api/session');
        const data = await response.json();
        
        if (data.logged_in) {
            appState.currentUser = data.user;
            showApp();
        } else {
            showAuth();
        }
    } catch (err) {
        console.error('Session check failed:', err);
        showAuth();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Theme Switcher
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Auth Toggle links
    elements.authSwitchLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.loginCard.style.display = 'none';
        elements.registerCard.style.display = 'block';
    });
    
    elements.regSwitchLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.registerCard.style.display = 'none';
        elements.loginCard.style.display = 'block';
    });
    
    // Login Form Submit
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (response.ok) {
                appState.currentUser = data.user;
                showApp();
                showNotification(`Welcome back, ${data.user.name}!`);
            } else {
                showNotification(data.error || 'Login failed', 'danger');
            }
        } catch (err) {
            console.error('Login error:', err);
            showNotification('Server communication error', 'danger');
        }
    });
    
    // Register Form Submit
    elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Registration successful! Please log in.');
                elements.registerCard.style.display = 'none';
                elements.loginCard.style.display = 'block';
                elements.loginForm.reset();
            } else {
                showNotification(data.error || 'Registration failed', 'danger');
            }
        } catch (err) {
            console.error('Registration error:', err);
            showNotification('Server communication error', 'danger');
        }
    });
    
    // Logout Button
    elements.logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            appState.currentUser = null;
            showAuth();
            showNotification('Logged out successfully.');
        } catch (err) {
            console.error('Logout error:', err);
            showAuth();
        }
    });
    
    // Navigation routing
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const panelId = link.getAttribute('data-panel');
            switchPanel(panelId);
        });
    });
    
    // Report form click map interaction
    elements.mockMap.addEventListener('click', (e) => {
        const rect = elements.mockMap.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        appState.selectedLocation.x = x.toFixed(2);
        appState.selectedLocation.y = y.toFixed(2);
        
        // Update selector pin position
        elements.mapPinSelector.style.left = `${x}%`;
        elements.mapPinSelector.style.top = `${y}%`;
        elements.mapPinSelector.style.display = 'block';
        
        // Auto fill location details
        const speciesGuess = document.getElementById('report-animal-type').value || "Animal";
        const customAddr = `${speciesGuess} spotted near Grid X: ${x.toFixed(0)}, Y: ${y.toFixed(0)}`;
        appState.selectedLocation.address = customAddr;
        elements.locationInput.value = customAddr;
    });
    
    // Report distress form submit
    elements.reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const animal_type = document.getElementById('report-animal-type').value;
        const location = elements.locationInput.value;
        const description = document.getElementById('report-description').value;
        const image_url = document.getElementById('report-image').value || "/static/images/mock_dog.jpg"; // Mock image url
        
        try {
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    animal_type,
                    location,
                    description,
                    image_path: image_url,
                    map_x: appState.selectedLocation.x,
                    map_y: appState.selectedLocation.y
                })
            });
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Rescue report submitted successfully!');
                elements.reportForm.reset();
                elements.mapPinSelector.style.display = 'none';
                fetchData();
            } else {
                showNotification(data.error || 'Failed to submit report', 'danger');
            }
        } catch (err) {
            console.error('Report submission error:', err);
            showNotification('Server communication error', 'danger');
        }
    });
}

// Display state controls
function showAuth() {
    elements.authSection.style.display = 'flex';
    elements.appSection.style.display = 'none';
    elements.loginCard.style.display = 'block';
    elements.registerCard.style.display = 'none';
}

function showApp() {
    elements.authSection.style.display = 'none';
    elements.appSection.style.display = 'grid';
    
    // Update User Profile Widgets
    elements.profileName.textContent = appState.currentUser.name;
    elements.profileRole.textContent = appState.currentUser.role;
    elements.profileAvatar.textContent = appState.currentUser.name.charAt(0).toUpperCase();
    
    // Adjust sidebar tabs based on role
    adjustNavigation(appState.currentUser.role);
    
    // Switch to default dashboard
    switchPanel('dashboard');
    
    // Load fresh data
    fetchData();
}

// Switch Sidebar Nav Tabs
function switchPanel(panelId) {
    // Update links styling
    elements.navLinks.forEach(link => {
        const item = link.parentElement;
        if (link.getAttribute('data-panel') === panelId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Show active panel
    Object.keys(elements.panels).forEach(key => {
        if (key === panelId) {
            elements.panels[key].classList.add('active');
        } else {
            elements.panels[key].classList.remove('active');
        }
    });
}

// Adjust sidebar controls based on permissions
function adjustNavigation(role) {
    const volunteerNavItem = document.querySelector('.nav-item[data-role-required="volunteer"]');
    const adminNavItem = document.querySelector('.nav-item[data-role-required="admin"]');
    
    if (role === 'admin') {
        volunteerNavItem.style.display = 'block';
        adminNavItem.style.display = 'block';
    } else if (role === 'volunteer') {
        volunteerNavItem.style.display = 'block';
        adminNavItem.style.display = 'none';
    } else {
        volunteerNavItem.style.display = 'none';
        adminNavItem.style.display = 'none';
    }
}

// Fetch all database records
async function fetchData() {
    try {
        const reportsRes = await fetch('/api/reports');
        const reportsData = await reportsRes.json();
        appState.reports = reportsData.reports;
        
        // If admin, fetch user list
        if (appState.currentUser.role === 'admin') {
            const usersRes = await fetch('/api/admin/users');
            const usersData = await usersRes.json();
            appState.users = usersData.users;
        }
        
        renderData();
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// Render data into tables, cards, maps, etc.
function renderData() {
    renderStats();
    renderTicker();
    renderMockMapPins();
    
    // Render My Reports (User Dashboard)
    renderMyReportsList();
    
    // Render Volunteer Workboard
    if (appState.currentUser.role === 'volunteer' || appState.currentUser.role === 'admin') {
        renderVolunteerReports();
    }
    
    // Render Admin Panels
    if (appState.currentUser.role === 'admin') {
        renderAdminTables();
    }
}

// Render Statistics
function renderStats() {
    let pendingCount = 0;
    let progressCount = 0;
    let rescuedCount = 0;
    
    appState.reports.forEach(report => {
        if (report.status === 'Pending') pendingCount++;
        else if (report.status === 'In Progress') progressCount++;
        else if (report.status === 'Rescued') rescuedCount++;
    });
    
    elements.stats.pending.textContent = pendingCount;
    elements.stats.progress.textContent = progressCount;
    elements.stats.rescued.textContent = rescuedCount;
}

// Update News Ticker
function renderTicker() {
    if (appState.reports.length === 0) {
        elements.tickerText.textContent = "No reports submitted yet. The community is safe.";
        return;
    }
    
    // Generate text summaries of current statuses
    const recentReports = appState.reports.slice(-4).reverse();
    const tickerStrings = recentReports.map(r => {
        const dateStr = new Date(r.date_reported).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `[${dateStr}] Urgent: ${r.animal_type} reported at "${r.location}" is currently ${r.status}.`;
    });
    
    elements.tickerText.textContent = tickerStrings.join("  |  ");
}

// Render Interactive Map Pins
function renderMockMapPins() {
    // Clear old pins (keep selector)
    const pins = elements.mockMap.querySelectorAll('.map-marker:not(#map-pin-selector)');
    const labels = elements.mockMap.querySelectorAll('.map-pin-label');
    pins.forEach(p => p.remove());
    labels.forEach(l => l.remove());
    
    appState.reports.forEach(report => {
        // Generate pseudo coordinates from report ID or name if none exist
        // to distribute them visually on the mock map.
        let x = 30 + (report.report_id * 17) % 60;
        let y = 20 + (report.report_id * 23) % 70;
        
        const pin = document.createElement('div');
        pin.className = `map-marker ${report.status.toLowerCase().replace(' ', '-')}`;
        pin.style.left = `${x}%`;
        pin.style.top = `${y}%`;
        
        const label = document.createElement('div');
        label.className = 'map-pin-label';
        label.style.left = `${x}%`;
        label.style.top = `${y}%`;
        label.innerHTML = `<strong>${report.animal_type}</strong> - ${report.status}<br><small>${report.location}</small>`;
        
        // Append to map
        elements.mockMap.appendChild(pin);
        elements.mockMap.appendChild(label);
        
        pin.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid setting custom coordinates
            showNotification(`Species: ${report.animal_type} | Location: ${report.location} | Status: ${report.status}`);
        });
    });
}

// Render User's Reported Cases
function renderMyReportsList() {
    elements.myReportsFeed.innerHTML = '';
    
    // Filter reports reported by current user (unless admin, who sees all)
    const userReports = appState.reports.filter(r => 
        appState.currentUser.role === 'admin' || r.reported_by === appState.currentUser.user_id
    );
    
    if (userReports.length === 0) {
        elements.myReportsFeed.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted-dark);">You have not reported any cases yet. Use the form above to report an animal in distress.</div>';
        return;
    }
    
    userReports.forEach(report => {
        const item = document.createElement('div');
        item.className = 'report-item glass-card';
        
        const statusBadge = `<span class="badge badge-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>`;
        const dateString = new Date(report.date_reported).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        // Use an emoji for visual layout since actual files are loaded dynamically
        const emojiMap = { dog: '🐶', cat: '🐱', bird: '🐦', default: '🐾' };
        const animalEmoji = emojiMap[report.animal_type.toLowerCase()] || emojiMap.default;
        
        item.innerHTML = `
            <div style="font-size: 2.2rem; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 12px; display:flex; align-items:center; justify-content:center; width:50px; height:50px;">
                ${animalEmoji}
            </div>
            <div class="report-details">
                <h3>${report.animal_type} Rescue Request ${statusBadge}</h3>
                <div class="report-meta">
                    <span>📍 ${report.location}</span>
                    <span>🕒 ${dateString}</span>
                </div>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-muted-dark);">${report.description}</p>
            </div>
            <div class="report-actions">
                ${report.status === 'Pending' ? `
                    <button class="btn-logout" onclick="deleteReport(${report.report_id})" style="margin: 0; padding: 0.5rem 0.85rem;">Cancel Report</button>
                ` : '<span style="font-size: 0.85rem; color: var(--success); font-weight:600;">🔒 Processing Rescue</span>'}
            </div>
        `;
        elements.myReportsFeed.appendChild(item);
    });
}

// Render Volunteer Workboard
function renderVolunteerReports() {
    elements.volunteerReportsFeed.innerHTML = '';
    
    if (appState.reports.length === 0) {
        elements.volunteerReportsFeed.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted-dark);">No active distress cases reported at the moment.</div>';
        return;
    }
    
    appState.reports.forEach(report => {
        const item = document.createElement('div');
        item.className = 'report-item glass-card';
        
        const statusBadge = `<span class="badge badge-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>`;
        const dateString = new Date(report.date_reported).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const emojiMap = { dog: '🐶', cat: '🐱', bird: '🐦', default: '🐾' };
        const animalEmoji = emojiMap[report.animal_type.toLowerCase()] || emojiMap.default;
        
        let actionButtons = '';
        
        if (report.status === 'Pending') {
            actionButtons = `<button class="btn-primary" onclick="claimReport(${report.report_id})" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Accept Rescue</button>`;
        } else if (report.status === 'In Progress' && report.assigned_to === appState.currentUser.user_id) {
            actionButtons = `<button class="btn-primary" onclick="completeRescue(${report.report_id})" style="padding: 0.5rem 1rem; font-size: 0.85rem; background: var(--success); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">Mark Rescued</button>`;
        } else if (report.status === 'In Progress') {
            actionButtons = `<span style="font-size: 0.85rem; color: var(--text-muted-dark);">Assigned to another rescuer</span>`;
        } else {
            actionButtons = `<span style="font-size: 0.85rem; color: var(--success); font-weight: 600;">✓ Completed Rescue</span>`;
        }
        
        item.innerHTML = `
            <div style="font-size: 2.2rem; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 12px; display:flex; align-items:center; justify-content:center; width:50px; height:50px;">
                ${animalEmoji}
            </div>
            <div class="report-details">
                <h3>${report.animal_type} Distress Alert ${statusBadge}</h3>
                <div class="report-meta">
                    <span>📍 ${report.location}</span>
                    <span>🕒 ${dateString}</span>
                    ${report.assigned_to_name ? `<span>👤 Rescuer: ${report.assigned_to_name}</span>` : ''}
                </div>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-muted-dark);">${report.description}</p>
            </div>
            <div class="report-actions">
                ${actionButtons}
            </div>
        `;
        elements.volunteerReportsFeed.appendChild(item);
    });
}

// Render Admin Tables
function renderAdminTables() {
    // 1. Users Table
    const usersBody = elements.adminUsersTable.querySelector('tbody');
    usersBody.innerHTML = '';
    
    appState.users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${user.user_id}</td>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-rescued' : user.role === 'volunteer' ? 'badge-progress' : 'badge-pending'}">${user.role}</span></td>
            <td>
                ${user.user_id !== appState.currentUser.user_id ? `
                    <button class="btn-logout" onclick="deleteUser(${user.user_id})" style="margin: 0; padding: 0.25rem 0.5rem; font-size: 0.75rem;">Delete User</button>
                ` : '<small>Active Session</small>'}
            </td>
        `;
        usersBody.appendChild(row);
    });
    
    // 2. Reports Table
    const reportsBody = elements.adminReportsTable.querySelector('tbody');
    reportsBody.innerHTML = '';
    
    appState.reports.forEach(report => {
        const row = document.createElement('tr');
        const dateString = new Date(report.date_reported).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
        row.innerHTML = `
            <td>#${report.report_id}</td>
            <td><strong>${report.animal_type}</strong></td>
            <td>${report.location}</td>
            <td><span class="badge badge-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></td>
            <td>${dateString}</td>
            <td>
                <button class="btn-logout" onclick="deleteReport(${report.report_id})" style="margin: 0; padding: 0.25rem 0.5rem; font-size: 0.75rem;">Delete</button>
            </td>
        `;
        reportsBody.appendChild(row);
    });
}

// Volunteer Action: Accept Rescue
window.claimReport = async (reportId) => {
    try {
        const response = await fetch(`/api/report/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_id: reportId })
        });
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Rescue claimed. Please head to the location.');
            fetchData();
        } else {
            showNotification(data.error || 'Claim request failed', 'danger');
        }
    } catch (err) {
        console.error('Claim report error:', err);
    }
};

// Volunteer Action: Mark Rescued
window.completeRescue = async (reportId) => {
    try {
        const response = await fetch(`/api/report/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_id: reportId })
        });
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Awesome! Animal marked as rescued.');
            fetchData();
        } else {
            showNotification(data.error || 'Completion request failed', 'danger');
        }
    } catch (err) {
        console.error('Complete rescue error:', err);
    }
};

// Admin/User Action: Delete/Cancel Report
window.deleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to remove this rescue request?')) return;
    
    try {
        const response = await fetch(`/api/report/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_id: reportId })
        });
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Rescue report deleted.');
            fetchData();
        } else {
            showNotification(data.error || 'Failed to delete report', 'danger');
        }
    } catch (err) {
        console.error('Delete report error:', err);
    }
};

// Admin Action: Delete User
window.deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user from the system?')) return;
    
    try {
        const response = await fetch(`/api/admin/delete-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        const data = await response.json();
        
        if (response.ok) {
            showNotification('User deleted.');
            fetchData();
        } else {
            showNotification(data.error || 'Failed to delete user', 'danger');
        }
    } catch (err) {
        console.error('Delete user error:', err);
    }
};

// Notifications Helper
function showNotification(message, type = 'success') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'glass-card';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '1rem 1.5rem';
    toast.style.zIndex = '1000';
    toast.style.boxShadow = 'var(--shadow-lg)';
    toast.style.borderLeft = `5px solid ${type === 'success' ? 'var(--primary)' : 'var(--danger)'}`;
    toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    toast.innerHTML = `<strong>${type === 'success' ? 'Rescue Notification' : 'Error'}</strong><br>${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Add CSS keyframes dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes fadeOut {
    to { opacity: 0; transform: translateY(10px); }
}
`;
document.head.appendChild(styleSheet);
