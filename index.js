// Security System
class SecurityManager {
  constructor() {
    this.isAuthenticated = false;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.sessionTimer = null;
    this.warningTimer = null;
    this.defaultPassword = 'admin@123'; // Default password - user should change this
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.setupEventListeners();
    this.startSessionTimer();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    const setPasswordBtn = document.getElementById('setPasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    if (setPasswordBtn) {
      setPasswordBtn.addEventListener('click', () => this.showSetPasswordModal());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Reset session timer on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetSessionTimer(), true);
    });
  }

  checkAuthentication() {
    const storedPassword = localStorage.getItem('taskReminderPassword');
    const sessionData = localStorage.getItem('taskReminderSession');
    
    if (!storedPassword) {
      // First time setup - set default password
      this.setPassword(this.defaultPassword);
      this.showLoginScreen();
      return;
    }

    if (sessionData) {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      if (now - session.timestamp < this.sessionTimeout) {
        this.authenticate();
        return;
      } else {
        // Session expired
        localStorage.removeItem('taskReminderSession');
      }
    }

    this.showLoginScreen();
  }

  handleLogin(e) {
    e.preventDefault();
    const passwordInput = document.getElementById('passwordInput');
    const enteredPassword = passwordInput.value;
    const storedPassword = localStorage.getItem('taskReminderPassword');
    
    if (this.verifyPassword(enteredPassword, storedPassword)) {
      this.authenticate();
      this.hideError();
    } else {
      this.showError();
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  verifyPassword(entered, stored) {
    // Simple hash comparison (in production, use proper hashing)
    return this.simpleHash(entered) === stored;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  authenticate() {
    this.isAuthenticated = true;
    this.showMainApp();
    this.createSession();
    this.startSessionTimer();
    this.updateSecurityStatus(true);
    
    // Initialize the app after authentication
    if (typeof initializeApp === 'function') {
      initializeApp();
    }
  }

  logout() {
    this.isAuthenticated = false;
    this.showLoginScreen();
    this.clearSession();
    this.clearTimers();
    this.updateSecurityStatus(false);
    
    // Clear password input
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) passwordInput.value = '';
  }

  showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
    
    // Focus password input
    setTimeout(() => {
      const passwordInput = document.getElementById('passwordInput');
      if (passwordInput) passwordInput.focus();
    }, 100);
  }
  

  showMainApp() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
  }

  showError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 3000);
    }
  }

  hideError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) errorDiv.style.display = 'none';
  }

  setPassword(newPassword) {
    const hashedPassword = this.simpleHash(newPassword);
    localStorage.setItem('taskReminderPassword', hashedPassword);
    
  }

  showSetPasswordModal() {
    const currentPassword = prompt('Enter current password:');
    if (!currentPassword) return;
    else(resetpassword)

    const storedPassword = localStorage.getItem('taskReminderPassword');
    if (!this.verifyPassword(currentPassword, storedPassword)) {
      alert('❌ Incorrect current password!');
      return;
    }

    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      alert('❌ Password must be at least 6 characters long!');
      return;
    }

    const confirmPassword = prompt('Confirm new password:');
  
      

    this.setPassword(newPassword);
    alert('✅ Password changed successfully!');
  }

  createSession() {
    const session = {
      timestamp: Date.now(),
      authenticated: true
    };
    localStorage.setItem('taskReminderSession', JSON.stringify(session));
  }

  clearSession() {
    localStorage.removeItem('taskReminderSession');
  }

  startSessionTimer() {
    this.clearTimers();
    this.sessionTimer = setTimeout(() => {
      this.showSessionWarning();
    }, this.sessionTimeout - 60000); // Show warning 1 minute before timeout
  }

  resetSessionTimer() {
    if (this.isAuthenticated) {
      this.startSessionTimer();
    }
  }

  clearTimers() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  showSessionWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'session-warning';
    warningDiv.innerHTML = `
      <h3>⏰ Session Timeout Warning</h3>
      <p>Your session will expire in 1 minute due to inactivity.</p>
      <button class="btn" onclick="securityManager.extendSession()">Extend Session</button>
      <button class="btn" onclick="securityManager.logout()" style="background: #666;">Logout</button>
    `;
    
    document.body.appendChild(warningDiv);
    
    this.warningTimer = setTimeout(() => {
      this.logout();
      if (document.body.contains(warningDiv)) {
        warningDiv.remove();
      }
    }, 60000); // Auto logout after 1 minute
  }

  extendSession() {
    const warningDiv = document.querySelector('.session-warning');
    if (warningDiv) warningDiv.remove();
    
    this.clearTimers();
    this.createSession();
    this.startSessionTimer();
  }

  updateSecurityStatus(authenticated) {
    let statusDiv = document.querySelector('.security-status');
    
    if (!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.className = 'security-status';
      document.body.appendChild(statusDiv);
    }
    
    if (authenticated) {
      statusDiv.innerHTML = '🔒 Secured';
      statusDiv.classList.remove('locked');
    } else {
      statusDiv.innerHTML = '🔓 Locked';
      statusDiv.classList.add('locked');
    }
  }
}

// Initialize security system
const securityManager = new SecurityManager();

const form  = document.getElementById('taskForm'),
      list  = document.getElementById('taskList'),
      count = document.getElementById('count'),
      theme = document.getElementById('themeBtn'),
      notificationIcon = document.getElementById('notificationIcon'),
      notificationText = document.getElementById('notificationText');

// Background video removed for better performance

// Service Worker Registration for Background Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Update notification status
      updateNotificationStatus(true);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      updateNotificationStatus(false);
    }
  });
}

// Notification Permission and Status
async function updateNotificationStatus(swRegistered) {
  const enableBtn = document.getElementById('enableNotifications');
  
  if (!('Notification' in window)) {
    notificationText.textContent = 'Notifications: Not supported';
    notificationIcon.textContent = '❌';
    enableBtn.style.display = 'none';
    return;
  }
  
  let permission = Notification.permission;
  
  if (permission === 'default') {
    enableBtn.style.display = 'inline-block';
    enableBtn.onclick = async () => {
      permission = await Notification.requestPermission();
      updateNotificationStatus(swRegistered);
    };
    notificationText.textContent = 'Notifications: Click Enable';
    notificationIcon.textContent = '🔔';
    return;
  }
  
  enableBtn.style.display = 'none';
  
  if (permission === 'granted' && swRegistered) {
    notificationText.textContent = 'Notifications: Active';
    notificationIcon.textContent = '🔔';
    
    // Show test buttons
    const testBtn = document.getElementById('testNotification');
    const testReminderBtn = document.getElementById('testReminder');
    
    testBtn.style.display = 'inline-block';
    testBtn.onclick = () => {
      speak('Test reminder');
      new Notification('Test Reminder', {
        body: 'This is a test notification to verify cross-screen functionality',
        requireInteraction: true,
        silent: false
      });
    };
    
    testReminderBtn.style.display = 'inline-block';
    testReminderBtn.onclick = () => {
      const testTime = new Date(Date.now() + 10000); // 10 seconds from now
      const testTask = {
        id: Date.now(),
        name: 'Test Reminder (10 seconds)',
        time: testTime.toISOString(),
        done: false,
        repeat: 'never',
        scheduled: true
      };
      
      console.log('Creating test reminder for:', testTask.name, 'at', testTime.toLocaleString());
      
      tasks.push(testTask);
      save();
      render();
      scheduleBackgroundReminder(testTask);
      
      alert(`Test reminder created! It will trigger in 10 seconds at ${testTime.toLocaleString()}`);
    };
  } else if (permission === 'granted') {
    notificationText.textContent = 'Notifications: Ready';
    notificationIcon.textContent = '🔔';
  } else {
    notificationText.textContent = 'Notifications: Blocked';
    notificationIcon.textContent = '🔕';
  }
}

// Background Notification System
async function scheduleBackgroundReminder(task) {
  console.log('Scheduling background reminder for:', task.name, 'at', new Date(task.time).toLocaleString());
  
  // Always schedule both background and regular reminders for reliability
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      // Store task for background processing
      const reminderData = {
        id: task.id,
        name: task.name,
        time: task.time,
        done: task.done,
        notified: false
      };
      
      // Store in IndexedDB for service worker access
      await storeReminderForBackground(reminderData);
      
      // Register background sync
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('task-reminder-sync');
      
      console.log('Background reminder scheduled for:', task.name);
    } catch (error) {
      console.error('Failed to schedule background reminder:', error);
    }
  }
  
  // Always schedule regular reminder as backup
  scheduleRegularReminder(task);
}

// Store reminder data for service worker
async function storeReminderForBackground(reminderData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskReminderDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['reminders'], 'readwrite');
      const store = transaction.objectStore('reminders');
      
      const addRequest = store.put(reminderData);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
    };
  });
}

// Fallback regular reminder scheduling - Fixed timing
function scheduleRegularReminder(task) {
  const taskTime = new Date(task.time).getTime();
  const now = Date.now();
  const delay = taskTime - now;
  
  console.log('Scheduling reminder:', {
    taskName: task.name,
    taskTime: new Date(task.time).toLocaleString(),
    delay: delay,
    delayMinutes: Math.round(delay / 60000)
  });
  
  if (delay > 0) {
    setTimeout(() => {
      console.log('Reminder triggered for:', task.name);
      remind(task);
    }, delay);
  } else if (delay > -60000) { // If within 1 minute of scheduled time, trigger immediately
    console.log('Reminder is due now, triggering immediately:', task.name);
    remind(task);
  }
}

// Simple mouse tracking for basic interactions
document.addEventListener('mousemove', (e) => {
  // Basic mouse position tracking for any future simple interactions
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  
  document.documentElement.style.setProperty('--mouse-x', `${x}%`);
  document.documentElement.style.setProperty('--mouse-y', `${y}%`);
});

// Secure task storage - only accessible when authenticated
function getTasks() {
  if (!securityManager.isAuthenticated) {
    return [];
  }
  return JSON.parse(localStorage.getItem('tasks') || '[]');
}

function setTasks(newTasks) {
  if (!securityManager.isAuthenticated) {
    return;
  }
  localStorage.setItem('tasks', JSON.stringify(newTasks));
}

let tasks = getTasks();

// Clean up tasks and prevent duplicates
function cleanupTasks() {
  const uniqueTasks = [];
  const seenIds = new Set();
  
  tasks.forEach(task => {
    if (!seenIds.has(task.id)) {
      seenIds.add(task.id);
      // Reset scheduled flag for existing tasks to allow re-scheduling
      if (task.scheduled === undefined) {
        task.scheduled = false;
      }
      uniqueTasks.push(task);
    }
  });
  
  tasks = uniqueTasks;
  save();
}

function save(){ 
  if (!securityManager.isAuthenticated) {
    return;
  }
  setTasks(tasks); 
  count.textContent = tasks.length; 
}
function render(){
  // Use document fragment for faster rendering
  const fragment = document.createDocumentFragment();
  
  tasks.forEach(t=>{
    const li=document.createElement('li');
    if(t.done) li.classList.add('done');
    
    const taskName = `<div class="task-name">${t.name}</div>`;
    const taskTime = `<div class="task-time">⏰ ${new Date(t.time).toLocaleString()}</div>`;
    const taskRepeat = t.repeat && t.repeat !== 'never' ? 
      `<div class="task-repeat ${t.repeat}">🔄 ${t.repeat}</div>` : '';
    
    li.innerHTML=`<span>${taskName}${taskTime}${taskRepeat}</span>
      <div class="task-actions">
        <button onclick="toggle(${t.id})" class="doneBtn">${t.done?'↩️ Undo':'✅ Done'}</button>
        <button onclick="edit(${t.id})" class="edit">✏️ Edit</button>
        <button onclick="removeT(${t.id})" class="del">🗑️ Delete</button>
      </div>`;
    fragment.appendChild(li);
  });
  
  list.innerHTML='';
  list.appendChild(fragment);
  count.textContent = tasks.length;
}

form.onsubmit=e=>{
  e.preventDefault();
  
  // Security check
  if (!securityManager.isAuthenticated) {
    alert('❌ Please log in to add tasks');
    return;
  }
  
  const name=document.getElementById('taskName').value.trim(),
        time=document.getElementById('taskTime').value,
        repeat=document.getElementById('repeatOption').value;
  if(!name||!time) return;
  
  const t={id:Date.now(),name,time,done:false,repeat,scheduled:true};
  
  console.log('Adding new task:', {
    name: t.name,
    time: t.time,
    scheduledFor: new Date(t.time).toLocaleString(),
    repeat: t.repeat
  });
  
  tasks.push(t); 
  save(); 
  render(); 
  scheduleBackgroundReminder(t); 
  form.reset();
  
  // Show confirmation
  alert(`Task "${t.name}" scheduled for ${new Date(t.time).toLocaleString()}`);
};

function removeT(id){ 
  if (!securityManager.isAuthenticated) {
    alert('❌ Please log in to delete tasks');
    return;
  }
  tasks=tasks.filter(x=>x.id!==id); 
  save();
  render(); 
}

function toggle(id){ 
  if (!securityManager.isAuthenticated) {
    alert('❌ Please log in to modify tasks');
    return;
  }
  let t=tasks.find(x=>x.id===id); 
  if(t){
    t.done=!t.done; 
    save();
    render();
  }
}
function edit(id){ 
  if (!securityManager.isAuthenticated) {
    alert('❌ Please log in to edit tasks');
    return;
  }
  
  let t=tasks.find(x=>x.id===id);
  if(t){ 
    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
      <div class="edit-overlay" onclick="closeEdit()"></div>
      <div class="edit-content">
        <h3>Edit Task</h3>
        <input type="text" id="editName" value="${t.name}" placeholder="Task Name">
        <input type="datetime-local" id="editTime" value="${new Date(t.time).toISOString().slice(0,16)}">
        <select id="editRepeat">
          <option value="never" ${t.repeat === 'never' ? 'selected' : ''}>Never</option>
          <option value="daily" ${t.repeat === 'daily' ? 'selected' : ''}>Daily</option>
          <option value="weekly" ${t.repeat === 'weekly' ? 'selected' : ''}>Weekly</option>
          <option value="monthly" ${t.repeat === 'monthly' ? 'selected' : ''}>Monthly</option>
        </select>
        <div class="edit-buttons">
          <button onclick="saveEdit(${t.id})" class="btn">Save</button>
          <button onclick="closeEdit()" class="btn" style="background: #666;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(editForm);
  }
}

function saveEdit(id){
  if (!securityManager.isAuthenticated) {
    alert('❌ Please log in to save changes');
    return;
  }
  
  const name = document.getElementById('editName').value.trim();
  const time = document.getElementById('editTime').value;
  const repeat = document.getElementById('editRepeat').value;
  
  if(!name || !time) {
    alert('Please fill in all fields');
    return;
  }
  
  let t = tasks.find(x => x.id === id);
  if(t){
    t.name = name;
    t.time = time;
    t.repeat = repeat;
    t.scheduled = true; // Mark as scheduled
    save();
    render();
    scheduleBackgroundReminder(t); // Re-schedule with new time
    closeEdit();
  }
}

function closeEdit(){
  const editForm = document.querySelector('.edit-form');
  if(editForm) editForm.remove();
}

function schedule(t){
  const taskTime = new Date(t.time).getTime();
  const now = Date.now();
  const delay = taskTime - now;
  
  console.log('Scheduling task:', {
    taskName: t.name,
    taskTime: new Date(t.time).toLocaleString(),
    delay: delay,
    delayMinutes: Math.round(delay / 60000)
  });
  
  if (delay > 0) {
    setTimeout(() => {
      console.log('Task reminder triggered:', t.name);
      remind(t);
    }, delay);
  } else if (delay > -60000) { // If within 1 minute, trigger immediately
    console.log('Task is due now, triggering immediately:', t.name);
    remind(t);
  }
}

function remind(t){
  if(t.done) return;
  
  console.log('Reminder triggered for:', t.name);
  
  // Add visual feedback on current screen
  showReminderAlert(t);
  
  // Speak the reminder
  speak(t.name);
  
  // Show notification on other screens with enhanced visibility
  if(Notification.permission==='granted') {
    const notification = new Notification(`⏰ Reminder: ${t.name}`, {
      body: `Time: ${new Date(t.time).toLocaleString()}`,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzRhOTBlMiIvPgo8cGF0aCBkPSJNOCAxMmw0IDRsOC04IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg==',
      requireInteraction: true,
      silent: false,
      tag: `reminder-${t.id}`,
      actions: [
        {
          action: 'mark-done',
          title: 'Mark Done'
        },
        {
          action: 'snooze',
          title: 'Snooze 5min'
        }
      ],
      data: {
        reminderId: t.id,
        taskName: t.name
      }
    });
    
    // Handle notification actions
    notification.onclick = (event) => {
      if (event.action === 'mark-done') {
        let x = tasks.find(x => x.id === t.id);
        if (x) { x.done = true; render(); }
      } else if (event.action === 'snooze') {
        snoozeTask(t.id, 5);
      } else {
        // Default click - focus window
        window.focus();
      }
    };
  }
  
  // Handle repeat logic
  if(t.repeat && t.repeat !== 'never'){
    scheduleNextRepeat(t);
  } else {
    let x=tasks.find(x=>x.id===t.id); if(x){x.done=true; render();}
  }
}

function scheduleNextRepeat(t){
  const now = new Date();
  const originalTime = new Date(t.time);
  let nextTime = new Date(originalTime);
  
  switch(t.repeat){
    case 'daily':
      nextTime.setDate(now.getDate() + 1);
      nextTime.setHours(originalTime.getHours(), originalTime.getMinutes());
      break;
    case 'weekly':
      nextTime.setDate(now.getDate() + 7);
      nextTime.setHours(originalTime.getHours(), originalTime.getMinutes());
      break;
    case 'monthly':
      nextTime.setMonth(now.getMonth() + 1);
      nextTime.setHours(originalTime.getHours(), originalTime.getMinutes());
      break;
  }
  
  // Create new task for next occurrence
  const newTask = {
    id: Date.now(),
    name: t.name,
    time: nextTime.toISOString(),
    done: false,
    repeat: t.repeat,
    scheduled: true
  };
  
  tasks.push(newTask);
  save();
  render();
  scheduleBackgroundReminder(newTask);
}

// Visual reminder alert for current screen
function showReminderAlert(task) {
  // Create a prominent visual alert
  const alertDiv = document.createElement('div');
  alertDiv.className = 'reminder-alert';
  alertDiv.innerHTML = `
    <div class="reminder-content">
      <h2>⏰ REMINDER</h2>
      <p class="reminder-task">${task.name}</p>
      <p class="reminder-time">${new Date(task.time).toLocaleString()}</p>
      <div class="reminder-actions">
        <button onclick="markTaskDone(${task.id})" class="btn doneBtn">✅ Mark Done</button>
        <button onclick="snoozeTask(${task.id}, 5)" class="btn">⏰ Snooze 5min</button>
        <button onclick="closeReminderAlert()" class="btn" style="background: #666;">✕ Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto-close after 30 seconds
  setTimeout(() => {
    if (document.body.contains(alertDiv)) {
      closeReminderAlert();
    }
  }, 30000);
  
  // Make window visible and focused
  window.focus();
  if (document.hidden) {
    // Try to make tab visible (may not work in all browsers)
    document.title = `⏰ REMINDER: ${task.name}`;
  }
}

// Close reminder alert
function closeReminderAlert() {
  const alert = document.querySelector('.reminder-alert');
  if (alert) {
    alert.remove();
    document.title = 'Task Reminder - Background Notifications';
  }
}

// Mark task as done from reminder alert
function markTaskDone(id) {
  if (!securityManager.isAuthenticated) {
    alert('❌ Please log in to mark tasks as done');
    return;
  }
  
  let task = tasks.find(x => x.id === id);
  if (task) {
    task.done = true;
    save();
    render();
    closeReminderAlert();
  }
}

// Speech synthesis for task reminders
function speak(txt){
  if('speechSynthesis' in window){
    let u = new SpeechSynthesisUtterance(`Reminder: ${txt}`);
    u.lang = 'en-US'; 
    u.rate = 0.9; 
    u.pitch = 1;
    u.volume = 0.8;
    speechSynthesis.speak(u);
  }
}

if('Notification'in window && Notification.permission!=='granted') Notification.requestPermission();
theme.onclick=()=>{ document.body.classList.toggle('dark'); theme.textContent=document.body.classList.contains('dark')?'☀️ Light':'🌙 Dark'; };

// Initialize app only when authenticated
function initializeApp() {
  if (securityManager.isAuthenticated) {
    // Refresh tasks from secure storage
    tasks = getTasks();
    
    // Clean up any duplicate tasks first
    cleanupTasks();

    render(); 
    // Only schedule reminders for tasks that haven't been scheduled yet
    tasks.forEach(task => {
      if (!task.done && !task.scheduled) {
        task.scheduled = true; // Mark as scheduled to prevent duplicates
        scheduleBackgroundReminder(task);
      }
    });
  }
}

// Initialize app
initializeApp();

// Handle messages from service worker
navigator.serviceWorker.addEventListener('message', (event) => {
  const { type, reminderId, minutes, taskName } = event.data;
  
  switch (type) {
    case 'MARK_DONE':
      toggle(reminderId);
      break;
    case 'SNOOZE':
      snoozeTask(reminderId, minutes);
      break;
    case 'SPEAK_REMINDER':
      speak(taskName);
      break;
  }
});

// Snooze task function
function snoozeTask(reminderId, minutes) {
  if (!securityManager.isAuthenticated) {
    alert('❌ Please log in to snooze tasks');
    return;
  }
  
  const task = tasks.find(t => t.id === reminderId);
  if (task) {
    const newTime = new Date();
    newTime.setMinutes(newTime.getMinutes() + minutes);
    task.time = newTime.toISOString();
    save();
    render();
    scheduleBackgroundReminder(task);
  }
}

// Initialize notification status on page load
updateNotificationStatus(false);


