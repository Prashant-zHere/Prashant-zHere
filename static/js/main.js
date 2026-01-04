// ===== Global Variables =====
let windowZIndex = 100;
let openWindows = [];
let currentTheme = portfolioData.theme || 'windows';
let isDragging = false;
let isResizing = false;
let currentDragElement = null;
let dragOffset = { x: 0, y: 0 };

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', function() {
    initializeOS();
});

function initializeOS() {
    // Boot sequence
    setTimeout(() => {
        document.getElementById('boot-screen').classList.add('hidden');
        document.getElementById('lock-screen').classList.remove('hidden');
        updateLockTime();
    }, 3000);
    
    // Update time every second
    setInterval(updateTime, 1000);
    updateTime();
    
    // Initialize event listeners
    initDesktopEvents();
    initDragAndDrop();
    initContextMenu();
    initKeyboardShortcuts();
}

// ===== Lock Screen =====
function unlockScreen() {
    const lockScreen = document.getElementById('lock-screen');
    lockScreen.style.animation = 'fadeOut 0.5s ease forwards';
    setTimeout(() => {
        lockScreen.classList.add('hidden');
        document.getElementById('desktop').classList.remove('hidden');
    }, 500);
}

function updateLockTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('lock-time').textContent = timeStr;
    document.getElementById('lock-date').textContent = dateStr;
}

// ===== Time Updates =====
function updateTime() {
    const now = new Date();
    
    // Windows format
    const winTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const winDate = now.toLocaleDateString('en-US');
    
    // macOS format
    const macTime = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const taskbarTime = document.getElementById('taskbar-time');
    const taskbarDate = document.getElementById('taskbar-date');
    const menubarTime = document.getElementById('menubar-time');
    
    if (taskbarTime) taskbarTime.textContent = winTime;
    if (taskbarDate) taskbarDate.textContent = winDate;
    if (menubarTime) menubarTime.textContent = macTime;
    
    updateLockTime();
}

// ===== Desktop Events =====
function initDesktopEvents() {
    // Desktop icon double-click
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('dblclick', handleIconDoubleClick);
        icon.addEventListener('click', handleIconClick);
    });
    
    // Close menus when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
            document.getElementById('start-menu').classList.add('hidden');
        }
        if (!e.target.closest('.apple-menu-dropdown') && !e.target.closest('.apple-menu')) {
            document.getElementById('apple-menu-dropdown').classList.add('hidden');
        }
        if (!e.target.closest('.context-menu')) {
            document.getElementById('context-menu').classList.add('hidden');
        }
    });
}

function handleIconClick(e) {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    e.currentTarget.classList.add('selected');
}

function handleIconDoubleClick(e) {
    const icon = e.currentTarget;
    const action = icon.dataset.action;
    const id = icon.dataset.id;
    
    switch(action) {
        case 'open_resume':
            openResume();
            break;
        case 'open_link':
            window.open(icon.dataset.url, '_blank');
            break;
        case 'open_email':
            window.location.href = `mailto:${icon.dataset.email}`;
            break;
        case 'open_folder':
            if (id === 'projects') {
                openProjectsFolder();
            } else if (id === 'skills') {
                openSkills();
            }
            break;
        case 'open_text':
            openAbout();
            break;
        case 'open_terminal':
            openTerminal();
            break;
    }
}

// ===== Helper Functions to Get Data =====
function getDesktopItem(id) {
    return portfolioData.desktop_items.find(item => item.id === id);
}

function getGitHubUrl() {
    const github = getDesktopItem('github');
    return github ? github.url : 'https://github.com';
}

function getLinkedInUrl() {
    const linkedin = getDesktopItem('linkedin');
    return linkedin ? linkedin.url : 'https://linkedin.com';
}

function getEmail() {
    const email = getDesktopItem('email');
    return email ? email.email : 'example@email.com';
}

// ===== Window Management =====
function createWindow(options) {
    const { id, title, content, width = 800, height = 500, icon = 'fas fa-window-maximize' } = options;
    
    // Check if window already exists
    const existingWindow = document.querySelector(`[data-window-id="${id}"]`);
    if (existingWindow) {
        focusWindow(existingWindow);
        return existingWindow;
    }
    
    const windowsContainer = document.getElementById('windows-container');
    const template = document.getElementById('window-template');
    const windowClone = template.content.cloneNode(true);
    const windowElement = windowClone.querySelector('.window');
    
    windowElement.dataset.windowId = id;
    windowElement.querySelector('.window-title').textContent = title;
    windowElement.querySelector('.window-content').innerHTML = content;
    
    // Position window
    const offsetX = (openWindows.length % 5) * 30 + 100;
    const offsetY = (openWindows.length % 5) * 30 + 50;
    windowElement.style.left = `${offsetX}px`;
    windowElement.style.top = `${offsetY}px`;
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;
    windowElement.style.zIndex = ++windowZIndex;
    
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    windowElement.appendChild(resizeHandle);
    
    windowsContainer.appendChild(windowElement);
    
    // Add to taskbar
    addToTaskbar(id, title, icon);
    
    // Initialize window events
    initWindowEvents(windowElement);
    
    openWindows.push({ id, title, icon });
    
    return windowElement;
}

function initWindowEvents(windowElement) {
    const titlebar = windowElement.querySelector('.window-titlebar');
    const resizeHandle = windowElement.querySelector('.resize-handle');
    
    // Dragging
    titlebar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.control-btn')) return;
        if (windowElement.classList.contains('maximized')) return;
        
        isDragging = true;
        currentDragElement = windowElement;
        dragOffset = {
            x: e.clientX - windowElement.offsetLeft,
            y: e.clientY - windowElement.offsetTop
        };
        windowElement.style.zIndex = ++windowZIndex;
    });
    
    // Resizing
    resizeHandle.addEventListener('mousedown', (e) => {
        if (windowElement.classList.contains('maximized')) return;
        
        isResizing = true;
        currentDragElement = windowElement;
        dragOffset = {
            x: e.clientX,
            y: e.clientY,
            width: windowElement.offsetWidth,
            height: windowElement.offsetHeight
        };
        e.preventDefault();
    });
    
    // Focus on click
    windowElement.addEventListener('mousedown', () => {
        focusWindow(windowElement);
    });
}

function focusWindow(windowElement) {
    windowElement.style.zIndex = ++windowZIndex;
    
    // Update taskbar
    document.querySelectorAll('.taskbar-window-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.windowId === windowElement.dataset.windowId) {
            btn.classList.add('active');
        }
    });
}

function closeWindow(btn) {
    const windowElement = btn.closest('.window');
    const windowId = windowElement.dataset.windowId;
    
    windowElement.classList.add('closing');
    setTimeout(() => {
        windowElement.remove();
        removeFromTaskbar(windowId);
        openWindows = openWindows.filter(w => w.id !== windowId);
    }, 200);
}

function minimizeWindow(btn) {
    const windowElement = btn.closest('.window');
    windowElement.classList.add('minimizing');
    setTimeout(() => {
        windowElement.style.display = 'none';
        windowElement.classList.remove('minimizing');
    }, 300);
}

function maximizeWindow(btn) {
    const windowElement = btn.closest('.window');
    windowElement.classList.toggle('maximized');
}

function addToTaskbar(id, title, icon) {
    const taskbarWindows = document.getElementById('taskbar-windows');
    const btn = document.createElement('div');
    btn.className = 'taskbar-window-btn active';
    btn.dataset.windowId = id;
    btn.innerHTML = `<i class="${icon}"></i><span>${title}</span>`;
    btn.onclick = () => toggleWindowFromTaskbar(id);
    
    // Deactivate other buttons
    document.querySelectorAll('.taskbar-window-btn').forEach(b => b.classList.remove('active'));
    
    taskbarWindows.appendChild(btn);
}

function removeFromTaskbar(id) {
    const btn = document.querySelector(`.taskbar-window-btn[data-window-id="${id}"]`);
    if (btn) btn.remove();
}

function toggleWindowFromTaskbar(id) {
    const windowElement = document.querySelector(`[data-window-id="${id}"]`);
    if (!windowElement) return;
    
    if (windowElement.style.display === 'none') {
        windowElement.style.display = 'flex';
        focusWindow(windowElement);
    } else if (windowElement.style.zIndex == windowZIndex) {
        minimizeWindow(windowElement.querySelector('.control-btn.minimize'));
    } else {
        focusWindow(windowElement);
    }
}

// Mouse move and up for dragging/resizing
document.addEventListener('mousemove', (e) => {
    if (isDragging && currentDragElement) {
        currentDragElement.style.left = `${e.clientX - dragOffset.x}px`;
        currentDragElement.style.top = `${e.clientY - dragOffset.y}px`;
    }
    if (isResizing && currentDragElement) {
        const newWidth = dragOffset.width + (e.clientX - dragOffset.x);
        const newHeight = dragOffset.height + (e.clientY - dragOffset.y);
        currentDragElement.style.width = `${Math.max(400, newWidth)}px`;
        currentDragElement.style.height = `${Math.max(300, newHeight)}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    currentDragElement = null;
});

// ===== App Launchers =====
function openResume() {
    createWindow({
        id: 'resume',
        title: 'Resume.pdf',
        icon: 'fas fa-file-pdf',
        width: 900,
        height: 700,
        content: `
            <iframe class="pdf-viewer" src="/resume" title="Resume" style="width:100%; height:100%; border:none;"></iframe>
        `
    });
}

function openGitHub() {
    window.open(getGitHubUrl(), '_blank');
}

function openLinkedIn() {
    window.open(getLinkedInUrl(), '_blank');
}

function openAbout() {
    const userData = portfolioData;
    createWindow({
        id: 'about',
        title: 'About Me',
        icon: 'fas fa-user',
        width: 600,
        height: 550,
        content: `
            <div class="about-content">
                <div class="about-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <h2 class="about-name">${userData.user_name}</h2>
                <p class="about-title">${userData.user_title}</p>
                <p class="about-bio">
                    Passionate developer with expertise in building modern web applications. 
                    I love creating elegant solutions to complex problems and am always eager 
                    to learn new technologies. When I'm not coding, you can find me exploring 
                    new frameworks, contributing to open source, or enjoying a good cup of coffee.
                </p>
                <div class="about-links">
                    <a href="${getGitHubUrl()}" target="_blank" class="about-link">
                        <i class="fab fa-github"></i>
                    </a>
                    <a href="${getLinkedInUrl()}" target="_blank" class="about-link">
                        <i class="fab fa-linkedin"></i>
                    </a>
                    <a href="mailto:${getEmail()}" class="about-link">
                        <i class="fas fa-envelope"></i>
                    </a>
                    <a href="/resume" target="_blank" class="about-link">
                        <i class="fas fa-file-pdf"></i>
                    </a>
                </div>
            </div>
        `
    });
}

function openProjectsFolder() {
    const projectsData = getDesktopItem('projects');
    
    if (!projectsData || !projectsData.contents) {
        showToast('No projects found');
        return;
    }
    
    let projectsHTML = '<div class="projects-grid">';
    
    projectsData.contents.forEach(project => {
        projectsHTML += `
            <div class="project-card" onclick="window.open('${project.url}', '_blank')">
                <div class="project-image">
                    ${project.image ? `<img src="${project.image}" alt="${project.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-code\\'></i>'">` : '<i class="fas fa-code"></i>'}
                </div>
                <div class="project-info">
                    <h3 class="project-name">${project.name}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="project-tech">
                        ${project.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    projectsHTML += '</div>';
    
    createWindow({
        id: 'projects',
        title: 'My_Projects',
        icon: 'fas fa-folder',
        width: 900,
        height: 600,
        content: projectsHTML
    });
}

function openSkills() {
    const skillsData = getDesktopItem('skills');
    
    if (!skillsData || !skillsData.contents) {
        showToast('No skills data found');
        return;
    }
    
    let skillsHTML = '<div class="skills-content">';
    
    skillsHTML += '<div class="skill-category"><h4>Technical Skills</h4>';
    skillsData.contents.forEach(skill => {
        skillsHTML += `
            <div class="skill-item">
                <div class="skill-header">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-percent">${skill.level}%</span>
                </div>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${skill.level}%"></div>
                </div>
            </div>
        `;
    });
    skillsHTML += '</div></div>';
    
    createWindow({
        id: 'skills',
        title: 'Skills',
        icon: 'fas fa-chart-bar',
        width: 500,
        height: 500,
        content: skillsHTML
    });
}

function openTerminal() {
    createWindow({
        id: 'terminal',
        title: 'Terminal',
        icon: 'fas fa-terminal',
        width: 700,
        height: 450,
        content: `
            <div class="terminal-content">
                <div class="terminal-line">
                    <span class="terminal-prompt">Prashant@portfolio:~$</span>
                    <span class="terminal-command"> whoami</span>
                </div>
                <div class="terminal-line terminal-output">${portfolioData.user_name}</div>
                
                <div class="terminal-line">
                    <span class="terminal-prompt">Prashant@portfolio:~$</span>
                    <span class="terminal-command">cat skills.txt</span>
                </div>
                <div class="terminal-line terminal-output">
                    Languages: HTML5, CSS, Javascript, C/C++, Java, Python, PHP <br>
                    Database: MySQL<br>
                    Tools: Git, Github, Docker, GitHub Actions
                </div>
                
                <div class="terminal-line">
                    <span class="terminal-prompt">Prashant@portfolio:~$</span>
                    <span class="terminal-command"> cat contact.txt</span>
                </div>
                <div class="terminal-line terminal-output">
                    Email: ${getEmail()}<br>
                    GitHub: ${getGitHubUrl()}<br>
                    LinkedIn: ${getLinkedInUrl()}
                </div>
                
                <div class="terminal-line">
                    <span class="terminal-prompt">Prashant@portfolio:~$</span>
                    <span class="terminal-command"> echo "Thanks for visiting!"</span>
                </div>
                <div class="terminal-line terminal-output">Thanks for visiting!</div>
                
                <div class="terminal-line terminal-input-line">
                    <span class="terminal-prompt">Prashant@portfolio:~$</span>
                    <input type="text" class="terminal-input" placeholder=" Type a command...">
                    <span class="cursor-blink">|</span>
                </div>
            </div>
        `
    });
    
    // Add terminal input functionality
    setTimeout(() => {
        const input = document.querySelector('.terminal-input');
        if (input) {
            input.focus();
            input.addEventListener('keypress', handleTerminalInput);
        }
    }, 100);
}

function handleTerminalInput(e) {
    if (e.key === 'Enter') {
        const input = e.target;
        const command = input.value.trim().toLowerCase();
        const terminalContent = input.closest('.terminal-content');
        
        // Remove input line
        const inputLine = input.closest('.terminal-input-line');
        inputLine.innerHTML = `
            <span class="terminal-prompt">Prashant@portfolio:~$</span>
            <span class="terminal-command"> ${input.value}</span>
        `;
        inputLine.classList.remove('terminal-input-line');
        
        // Process command
        let output = '';
        switch(command) {
            case 'help':
                output = 'Available commands: help, whoami, skills, contact, projects, clear, exit';
                break;
            case 'clear':
                terminalContent.innerHTML = '';
                break;
            case 'exit':
                closeWindow(terminalContent.closest('.window').querySelector('.control-btn.close'));
                return;
            case 'projects':
                output = 'Opening projects folder...';
                setTimeout(openProjectsFolder, 500);
                break;
            case 'whoami':
                output = portfolioData.user_name;
                break;
            case 'skills':
                output = 'Opening skills window...';
                setTimeout(openSkills, 500);
                break;
            case 'contact':
                output = `Email: ${getEmail()}`;
                break;
            default:
                output = `Command not found: ${command}. Type 'help' for available commands.`;
        }
        
        if (output && command !== 'clear') {
            const outputLine = document.createElement('div');
            outputLine.className = 'terminal-line terminal-output';
            outputLine.innerHTML = output;
            terminalContent.appendChild(outputLine);
        }
        
        // Add new input line
        const newInputLine = document.createElement('div');
        newInputLine.className = 'terminal-line terminal-input-line';
        newInputLine.innerHTML = `
            <span class="terminal-prompt">Prashant@portfolio:~$</span>
            <input type="text" class="terminal-input" placeholder="">
            <span class="cursor-blink">|</span>
        `;
        terminalContent.appendChild(newInputLine);
        
        const newInput = newInputLine.querySelector('.terminal-input');
        newInput.focus();
        newInput.addEventListener('keypress', handleTerminalInput);
        
        // Scroll to bottom
        terminalContent.scrollTop = terminalContent.scrollHeight;
    }
}

function openSettings() {
    createWindow({
        id: 'settings',
        title: 'Settings',
        icon: 'fas fa-cog',
        width: 800,
        height: 500,
        content: `
            <div class="settings-content" style="display: flex; height: 100%;">
                <div class="settings-sidebar">
                    <div class="settings-option active">
                        <i class="fas fa-palette"></i>
                        <span>Appearance</span>
                    </div>
                    <div class="settings-option">
                        <i class="fas fa-desktop"></i>
                        <span>Display</span>
                    </div>
                    <div class="settings-option">
                        <i class="fas fa-info-circle"></i>
                        <span>About</span>
                    </div>
                </div>
                <div class="settings-main" style="flex: 1;">
                    <div class="settings-section">
                        <h3>Appearance</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Theme Mode</h4>
                                <p>Switch between Windows and macOS appearance</p>
                            </div>
                            <div class="toggle-switch ${currentTheme === 'macos' ? 'active' : ''}" 
                                 onclick="toggleTheme(); this.classList.toggle('active');">
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Current Theme</h4>
                                <p>${currentTheme === 'windows' ? 'Windows 11' : 'macOS Ventura'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    });
}

function openFinder() {
    openProjectsFolder();
}

// ===== Context Menu =====
function initContextMenu() {
    const desktop = document.getElementById('desktop');
    const contextMenu = document.getElementById('context-menu');
    
    desktop.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        if (e.target.closest('.window') || e.target.closest('.taskbar')) return;
        
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.classList.remove('hidden');
    });
}

// ===== Drag and Drop =====
function initDragAndDrop() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('dragstart', handleDragStart);
        icon.addEventListener('dragend', handleDragEnd);
    });
    
    const desktop = document.getElementById('desktop-icons');
    desktop.addEventListener('dragover', handleDragOver);
    desktop.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const icon = document.querySelector(`[data-id="${id}"]`);
    
    if (icon) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - 45;
        const y = e.clientY - rect.top - 45;
        
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
        
        // Save position
        fetch('/api/update-position', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                position: { x: x, y: y }
            })
        });
    }
}

// ===== Menu Functions =====
function toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.toggle('hidden');
}

function toggleAppleMenu() {
    const appleMenu = document.getElementById('apple-menu-dropdown');
    appleMenu.classList.toggle('hidden');
}

function toggleTheme() {
    fetch('/api/toggle-theme', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            currentTheme = data.theme;
            document.body.className = `${data.theme}-theme`;
            document.body.dataset.theme = data.theme;
            showToast(`Switched to ${data.theme === 'windows' ? 'Windows' : 'macOS'} theme`);
        });
}

function refreshDesktop() {
    location.reload();
}

// ===== Create New Items =====
function createNewFile() {
    const name = prompt('Enter file name:', 'New File.txt');
    if (!name) return;
    
    fetch('/api/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            type: 'file',
            icon: 'text',
            action: 'open_text',
            content: '',
            position: { x: 220, y: 20 }
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
    
    document.getElementById('context-menu').classList.add('hidden');
}

function createNewFolder() {
    const name = prompt('Enter folder name:', 'New Folder');
    if (!name) return;
    
    fetch('/api/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            type: 'folder',
            icon: 'folder',
            action: 'open_folder',
            contents: [],
            position: { x: 220, y: 120 }
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
    
    document.getElementById('context-menu').classList.add('hidden');
}

// ===== Keyboard Shortcuts =====
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // ESC to close menus/windows
        if (e.key === 'Escape') {
            document.getElementById('start-menu').classList.add('hidden');
            document.getElementById('context-menu').classList.add('hidden');
            document.getElementById('apple-menu-dropdown').classList.add('hidden');
        }
        
        // Windows key for start menu
        if (e.key === 'Meta' || e.key === 'OS') {
            e.preventDefault();
            toggleStartMenu();
        }
    });
}

// ===== Utility Functions =====
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showShutdown() {
    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('apple-menu-dropdown').classList.add('hidden');
    
    const shutdownScreen = document.createElement('div');
    shutdownScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 20000;
        color: white;
        font-size: 24px;
        animation: fadeIn 0.5s ease;
    `;
    shutdownScreen.innerHTML = '<div>Thanks for visiting! Goodbye...</div>';
    document.body.appendChild(shutdownScreen);
    
    setTimeout(() => {
        location.reload();
    }, 2000);
}