// GHOSTRUNNER - Game Logic
class GhostrunnerGame {
    constructor() {
        // Game configuration
        this.config = {
            oxygenDecreaseRate: 1,
            warningThreshold: 20,
            initialOxygen: 100
        };
        
        // Game state
        this.gameState = {
            oxygen: 100,
            currentTask: 1,
            isPlaying: false,
            startTime: null,
            powerCellsPlaced: 0,
            quizCurrentQuestion: 0,
            quizCorrectAnswers: 0
        };
        
        // Power cells configuration
        this.powerCells = [
            {id: "quantum", name: "Quantum Core", shape: "hexagon", color: "blue"},
            {id: "fusion", name: "Fusion Reactor", shape: "rectangle", color: "red"}, 
            {id: "plasma", name: "Plasma Conduit", shape: "circle", color: "lime"},
            {id: "antimatter", name: "Antimatter Chamber", shape: "triangle", color: "magenta"}
        ];
        
        // Quiz questions
        this.quizQuestions = [
            {
                question: "Která hvězda je klíčová pro výpočet gravitačního driftu v hyperprostorovém tunelu 'Kepler-186f'?",
                options: ["Vega", "Proxima Centauri", "Kepler-186", "Alpha Centauri"],
                correct: 2
            },
            {
                question: "Co je 'neutronová hvězda' v terminologii hackerů z Deep Web?",
                options: ["Encrypted server", "Data compression algoritmus", "Kvantový procesor", "Neural network node"],
                correct: 0
            },
            {
                question: "Jaký je kódový název pro 'červeného obra' v korporátních archivech 'Ares Industries'?",
                options: ["RedGiant-7", "Crimson Protocol", "Mars-Alpha", "Titan-Core"],
                correct: 1
            },
            {
                question: "Které souhvězdí používají navigační systémy pro skok do quadrantu Alpha-7?",
                options: ["Orion", "Cassiopeia", "Ursa Major", "Draco"],
                correct: 0
            },
            {
                question: "Jaká je maximální vzdálenost pro bezpečný hyperspace jump podle Ghostrunner protokolů?",
                options: ["50 světelných let", "100 parsek", "25 AU", "500 světelných let"],
                correct: 1
            }
        ];
        
        // DOM elements
        this.elements = {};
        this.screens = {};
        
        // PWA variables
        this.deferredPrompt = null;
        
        // Timers
        this.oxygenTimer = null;
        
        // Drag and drop state
        this.draggedElement = null;
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initEventListeners();
        this.initPWA();
        this.loadGameState();
        this.updateUI();
    }
    
    initElements() {
        // Screens
        this.screens = {
            home: document.getElementById('homeScreen'),
            game: document.getElementById('gameScreen'),
            win: document.getElementById('winScreen'),
            lose: document.getElementById('loseScreen')
        };
        
        // Main UI elements
        this.elements = {
            // Home screen buttons
            newGameBtn: document.getElementById('newGameBtn'),
            continueBtn: document.getElementById('continueBtn'),
            installBtn: document.getElementById('installBtn'),
            shareBtn: document.getElementById('shareBtn'),
            
            // Game HUD
            oxygenFill: document.getElementById('oxygenFill'),
            oxygenText: document.getElementById('oxygenText'),
            
            // Tasks
            task1: document.getElementById('task1'),
            task2: document.getElementById('task2'),
            
            // Quiz elements
            currentQuestion: document.getElementById('currentQuestion'),
            totalQuestions: document.getElementById('totalQuestions'),
            questionText: document.getElementById('questionText'),
            answerOptions: document.getElementById('answerOptions'),
            quizProgress: document.getElementById('quizProgress'),
            
            // Result screens
            finalOxygen: document.getElementById('finalOxygen'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            retryBtn: document.getElementById('retryBtn'),
            
            // Overlays
            lowOxygenOverlay: document.getElementById('lowOxygenOverlay'),
            notification: document.getElementById('notification')
        };
    }
    
    initEventListeners() {
        // Home screen buttons
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.elements.continueBtn.addEventListener('click', () => this.continueGame());
        this.elements.installBtn.addEventListener('click', () => this.installApp());
        this.elements.shareBtn.addEventListener('click', () => this.shareGame());
        
        // Result screen buttons
        this.elements.playAgainBtn.addEventListener('click', () => this.startNewGame());
        this.elements.retryBtn.addEventListener('click', () => this.startNewGame());
        
        // Drag and drop for power cells
        this.initDragAndDrop();
        
        // Quiz total questions
        this.elements.totalQuestions.textContent = this.quizQuestions.length;
    }
    
    initPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
        
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.elements.installBtn.style.display = 'block';
        });
        
        // Check if app is already installed
        window.addEventListener('appinstalled', () => {
            this.elements.installBtn.style.display = 'none';
            this.showNotification('Hra byla úspěšně nainstalována!');
        });
    }
    
    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.showNotification('Instalace zahájena...');
            } else {
                this.showNotification('Instalace zrušena');
            }
            
            this.deferredPrompt = null;
        } else {
            this.showNotification('Instalace není dostupná v tomto prohlížeči');
        }
    }
    
    async shareGame() {
        const shareData = {
            title: 'GHOSTRUNNER - Neo-Kyoto 2077',
            text: 'Zahraj si futuristickou hru o hackerovi na vesmírné stanici!',
            url: window.location.href
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                this.showNotification('Hra byla sdílena!');
            } else {
                // Fallback - copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                this.showNotification('Odkaz zkopírován do schránky!');
            }
        } catch (err) {
            console.log('Error sharing:', err);
            this.showNotification('Sdílení se nezdařilo');
        }
    }
    
    startNewGame() {
        this.gameState = {
            oxygen: this.config.initialOxygen,
            currentTask: 1,
            isPlaying: true,
            startTime: Date.now(),
            powerCellsPlaced: 0,
            quizCurrentQuestion: 0,
            quizCorrectAnswers: 0
        };
        
        this.showScreen('game');
        this.resetTasks();
        this.startOxygenTimer();
        this.updateUI();
        this.saveGameState();
        
        this.simulateSound('gameStart');
        this.showNotification('Mise zahájena! Oprav systémy stanice Kibō-7');
    }
    
    continueGame() {
        if (this.hasValidSaveGame()) {
            this.showScreen('game');
            this.startOxygenTimer();
            this.updateUI();
            this.simulateSound('gameStart');
            this.showNotification('Pokračování v misi...');
        }
    }
    
    startOxygenTimer() {
        if (this.oxygenTimer) {
            clearInterval(this.oxygenTimer);
        }
        
        this.oxygenTimer = setInterval(() => {
            if (this.gameState.isPlaying) {
                this.gameState.oxygen = Math.max(0, this.gameState.oxygen - this.config.oxygenDecreaseRate);
                this.updateOxygenDisplay();
                this.saveGameState();
                
                if (this.gameState.oxygen <= 0) {
                    this.endGame(false);
                }
            }
        }, 1000);
    }
    
    updateOxygenDisplay() {
        const oxygenPercent = Math.max(0, this.gameState.oxygen);
        this.elements.oxygenFill.style.width = `${oxygenPercent}%`;
        this.elements.oxygenText.textContent = `${Math.round(oxygenPercent)}%`;
        
        // Warning effects
        if (oxygenPercent <= this.config.warningThreshold) {
            this.elements.oxygenFill.classList.add('warning');
            this.elements.lowOxygenOverlay.classList.add('active');
            
            if (oxygenPercent <= 10) {
                this.simulateSound('criticalWarning');
            }
        } else {
            this.elements.oxygenFill.classList.remove('warning');
            this.elements.lowOxygenOverlay.classList.remove('active');
        }
    }
    
    initDragAndDrop() {
        // Make power cells draggable
        const powerCells = document.querySelectorAll('.power-cell');
        const powerSlots = document.querySelectorAll('.power-slot');
        
        powerCells.forEach(cell => {
            cell.addEventListener('dragstart', this.handleDragStart.bind(this));
            cell.addEventListener('dragend', this.handleDragEnd.bind(this));
            
            // Add touch support for mobile
            cell.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            cell.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            cell.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        });
        
        powerSlots.forEach(slot => {
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('dragenter', this.handleDragEnter.bind(this));
            slot.addEventListener('dragleave', this.handleDragLeave.bind(this));
            slot.addEventListener('drop', this.handleDrop.bind(this));
            
            // Add visual hints
            this.addSlotHints(slot);
        });
    }
    
    addSlotHints(slot) {
        const slotType = slot.dataset.type;
        const slotIndicator = slot.querySelector('.slot-indicator');
        
        // Add shape hint to slot indicator
        switch(slotType) {
            case 'quantum':
                slotIndicator.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)';
                slotIndicator.style.borderColor = 'var(--neon-blue)';
                break;
            case 'fusion':
                slotIndicator.style.borderRadius = 'var(--radius-sm)';
                slotIndicator.style.borderColor = 'var(--neon-red)';
                break;
            case 'plasma':
                slotIndicator.style.borderRadius = '50%';
                slotIndicator.style.borderColor = 'var(--neon-lime)';
                break;
            case 'antimatter':
                slotIndicator.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
                slotIndicator.style.borderColor = 'var(--neon-magenta)';
                break;
        }
    }
    
    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.dataTransfer.effectAllowed = 'move';
        this.simulateSound('dragStart');
        
        // Highlight compatible slots
        this.highlightCompatibleSlots(e.target.dataset.type);
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
        
        // Remove all highlights
        this.clearAllHighlights();
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleDragEnter(e) {
        e.preventDefault();
        const slot = e.currentTarget;
        if (!slot.classList.contains('filled')) {
            slot.classList.add('drag-over');
        }
    }
    
    handleDragLeave(e) {
        const slot = e.currentTarget;
        slot.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        const slot = e.currentTarget;
        slot.classList.remove('drag-over');
        
        const cellType = e.dataTransfer.getData('text/plain');
        const slotType = slot.dataset.type;
        
        this.attemptPlacement(cellType, slotType, slot);
    }
    
    // Touch support for mobile devices
    handleTouchStart(e) {
        e.preventDefault();
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        this.simulateSound('dragStart');
        this.highlightCompatibleSlots(e.target.dataset.type);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (this.draggedElement) {
            const touch = e.touches[0];
            this.draggedElement.style.position = 'fixed';
            this.draggedElement.style.zIndex = '1000';
            this.draggedElement.style.left = (touch.clientX - 40) + 'px';
            this.draggedElement.style.top = (touch.clientY - 40) + 'px';
            this.draggedElement.style.pointerEvents = 'none';
            
            // Find element under touch
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const slot = elementBelow?.closest('.power-slot');
            
            // Update drag-over states
            document.querySelectorAll('.power-slot').forEach(s => s.classList.remove('drag-over'));
            if (slot && !slot.classList.contains('filled')) {
                slot.classList.add('drag-over');
            }
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        if (this.draggedElement) {
            const touch = e.changedTouches[0];
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const slot = elementBelow?.closest('.power-slot');
            
            // Reset dragged element style
            this.draggedElement.style.position = '';
            this.draggedElement.style.zIndex = '';
            this.draggedElement.style.left = '';
            this.draggedElement.style.top = '';
            this.draggedElement.style.pointerEvents = '';
            this.draggedElement.classList.remove('dragging');
            
            // Clear highlights
            this.clearAllHighlights();
            
            if (slot) {
                const cellType = this.draggedElement.dataset.type;
                const slotType = slot.dataset.type;
                this.attemptPlacement(cellType, slotType, slot);
            }
            
            this.draggedElement = null;
        }
    }
    
    highlightCompatibleSlots(cellType) {
        const compatibleSlot = document.querySelector(`.power-slot[data-type="${cellType}"]`);
        if (compatibleSlot && !compatibleSlot.classList.contains('filled')) {
            compatibleSlot.classList.add('compatible-highlight');
        }
    }
    
    clearAllHighlights() {
        document.querySelectorAll('.power-slot').forEach(slot => {
            slot.classList.remove('drag-over', 'compatible-highlight');
        });
    }
    
    attemptPlacement(cellType, slotType, slot) {
        if (cellType === slotType && !slot.classList.contains('filled')) {
            // Correct placement
            slot.classList.add('filled');
            
            // Hide the dragged cell
            const draggedCell = document.querySelector(`[data-type="${cellType}"].power-cell`);
            if (draggedCell) {
                draggedCell.style.display = 'none';
            }
            
            this.gameState.powerCellsPlaced++;
            this.simulateSound('correctPlacement');
            this.showNotification(`${this.getCellName(cellType)} připojen!`);
            
            // Check if all power cells are placed
            if (this.gameState.powerCellsPlaced >= 4) {
                setTimeout(() => {
                    this.completeTask1();
                }, 1000);
            }
            
            this.saveGameState();
        } else if (slot.classList.contains('filled')) {
            // Slot already filled
            this.showNotification('Slot je již obsazen!');
        } else {
            // Incorrect placement
            this.simulateSound('incorrectPlacement');
            this.showNotification(`Nesprávné připojení ${this.getCellName(cellType)}! Zkus správný slot.`);
            
            // Penalty: lose oxygen faster
            this.gameState.oxygen = Math.max(0, this.gameState.oxygen - 5);
            this.updateOxygenDisplay();
        }
    }
    
    getCellName(cellType) {
        const names = {
            quantum: 'Quantum Core',
            fusion: 'Fusion Reactor',
            plasma: 'Plasma Conduit',
            antimatter: 'Antimatter Chamber'
        };
        return names[cellType] || cellType;
    }
    
    completeTask1() {
        this.gameState.currentTask = 2;
        this.elements.task1.style.display = 'none';
        this.elements.task2.style.display = 'block';
        
        this.simulateSound('taskComplete');
        this.showNotification('Napájení obnoveno! Aktivuj navigační systém.');
        
        this.startQuiz();
        this.saveGameState();
    }
    
    startQuiz() {
        this.gameState.quizCurrentQuestion = 0;
        this.gameState.quizCorrectAnswers = 0;
        this.showQuizQuestion();
    }
    
    showQuizQuestion() {
        const questionIndex = this.gameState.quizCurrentQuestion;
        const question = this.quizQuestions[questionIndex];
        
        this.elements.currentQuestion.textContent = questionIndex + 1;
        this.elements.questionText.textContent = question.question;
        
        // Clear previous options
        this.elements.answerOptions.innerHTML = '';
        
        // Create answer options
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'answer-option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => this.selectAnswer(index));
            this.elements.answerOptions.appendChild(optionElement);
        });
        
        // Update progress
        const progress = ((questionIndex) / this.quizQuestions.length) * 100;
        this.elements.quizProgress.style.width = `${progress}%`;
    }
    
    selectAnswer(selectedIndex) {
        const questionIndex = this.gameState.quizCurrentQuestion;
        const question = this.quizQuestions[questionIndex];
        const options = this.elements.answerOptions.querySelectorAll('.answer-option');
        
        // Disable all options
        options.forEach(option => {
            option.style.pointerEvents = 'none';
        });
        
        // Show correct/incorrect
        options[selectedIndex].classList.add(selectedIndex === question.correct ? 'correct' : 'incorrect');
        
        if (selectedIndex !== question.correct) {
            options[question.correct].classList.add('correct');
        }
        
        if (selectedIndex === question.correct) {
            this.gameState.quizCorrectAnswers++;
            this.simulateSound('correctAnswer');
            this.showNotification('Správná odpověď!');
        } else {
            this.simulateSound('incorrectAnswer');
            this.showNotification('Nesprávná odpověď! Kyslík uniká rychleji.');
            // Penalty: faster oxygen decrease
            this.gameState.oxygen = Math.max(0, this.gameState.oxygen - 10);
            this.updateOxygenDisplay();
        }
        
        // Move to next question after delay
        setTimeout(() => {
            this.gameState.quizCurrentQuestion++;
            
            if (this.gameState.quizCurrentQuestion >= this.quizQuestions.length) {
                this.completeQuiz();
            } else {
                this.showQuizQuestion();
            }
            
            this.saveGameState();
        }, 2000);
    }
    
    completeQuiz() {
        // Quiz complete - check if player won
        if (this.gameState.quizCorrectAnswers >= 3) {
            this.endGame(true);
        } else {
            this.simulateSound('missionFailed');
            this.showNotification('Nedostatek správných odpovědí! Navigační systém selhal.');
            this.endGame(false);
        }
    }
    
    endGame(victory) {
        this.gameState.isPlaying = false;
        
        if (this.oxygenTimer) {
            clearInterval(this.oxygenTimer);
        }
        
        if (victory) {
            this.elements.finalOxygen.textContent = `${Math.round(this.gameState.oxygen)}%`;
            this.showScreen('win');
            this.simulateSound('victory');
        } else {
            this.showScreen('lose');
            this.simulateSound('defeat');
        }
        
        this.clearSaveGame();
    }
    
    resetTasks() {
        // Reset Task 1
        this.elements.task1.style.display = 'block';
        this.elements.task2.style.display = 'none';
        
        // Reset power cells
        const powerCells = document.querySelectorAll('.power-cell');
        const powerSlots = document.querySelectorAll('.power-slot');
        
        powerCells.forEach(cell => {
            cell.style.display = 'flex';
            cell.style.position = '';
            cell.style.zIndex = '';
            cell.style.left = '';
            cell.style.top = '';
            cell.style.pointerEvents = '';
        });
        
        powerSlots.forEach(slot => {
            slot.classList.remove('filled', 'drag-over', 'compatible-highlight');
        });
        
        // Reset quiz
        this.elements.answerOptions.innerHTML = '';
        this.elements.quizProgress.style.width = '0%';
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }
    
    updateUI() {
        this.updateOxygenDisplay();
        
        // Show continue button if save game exists
        if (this.hasValidSaveGame()) {
            this.elements.continueBtn.style.display = 'block';
        } else {
            this.elements.continueBtn.style.display = 'none';
        }
    }
    
    saveGameState() {
        try {
            localStorage.setItem('ghostrunner_save', JSON.stringify(this.gameState));
        } catch (e) {
            console.warn('Could not save game state:', e);
        }
    }
    
    loadGameState() {
        try {
            const saved = localStorage.getItem('ghostrunner_save');
            if (saved) {
                const parsedState = JSON.parse(saved);
                if (parsedState.isPlaying) {
                    this.gameState = { ...this.gameState, ...parsedState };
                }
            }
        } catch (e) {
            console.warn('Could not load game state:', e);
        }
    }
    
    hasValidSaveGame() {
        try {
            const saved = localStorage.getItem('ghostrunner_save');
            if (saved) {
                const parsedState = JSON.parse(saved);
                return parsedState.isPlaying && parsedState.oxygen > 0;
            }
        } catch (e) {
            return false;
        }
        return false;
    }
    
    clearSaveGame() {
        try {
            localStorage.removeItem('ghostrunner_save');
        } catch (e) {
            console.warn('Could not clear save game:', e);
        }
    }
    
    showNotification(message) {
        this.elements.notification.textContent = message;
        this.elements.notification.classList.add('show');
        
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, 3000);
    }
    
    simulateSound(soundType) {
        // Sound effect simulation with console logs and vibration
        const sounds = {
            gameStart: 'System activated - Mission commenced',
            dragStart: 'Power cell selected',
            correctPlacement: 'Connection established - Energy flowing',
            incorrectPlacement: 'Connection failed - Sparks detected',
            taskComplete: 'System restored - Task completed',
            correctAnswer: 'Access granted - Navigation updated',
            incorrectAnswer: 'Access denied - Oxygen leak detected',
            criticalWarning: 'CRITICAL - Oxygen levels dangerous',
            victory: 'Mission successful - Escape pod activated',
            defeat: 'System failure - Mission terminated',
            missionFailed: 'Navigation system offline'
        };
        
        console.log(`🔊 SOUND: ${sounds[soundType] || soundType}`);
        
        // Vibration feedback on mobile devices
        if (navigator.vibrate) {
            const vibrationPatterns = {
                correctPlacement: [100],
                incorrectPlacement: [200, 100, 200],
                taskComplete: [100, 50, 100, 50, 100],
                victory: [200, 100, 200, 100, 200],
                defeat: [500],
                criticalWarning: [100, 100, 100]
            };
            
            if (vibrationPatterns[soundType]) {
                navigator.vibrate(vibrationPatterns[soundType]);
            }
        }
    }
}

// Service Worker registration and PWA manifest
const manifest = {
    name: "GHOSTRUNNER - Neo-Kyoto 2077",
    short_name: "GHOSTRUNNER",
    description: "Elitní hacker v Neo-Kyoto 2077 - Unikni z rozpadající se vesmírné stanice!",
    start_url: "/",
    display: "fullscreen",
    background_color: "#0a0a0a",
    theme_color: "#ff3c00",
    orientation: "portrait-primary",
    icons: [
        {
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23ff3c00'/%3E%3Ctext x='256' y='280' font-family='Orbitron,monospace' font-size='120' font-weight='900' text-anchor='middle' fill='%23000'%3EGR%3C/text%3E%3C/svg%3E",
            sizes: "512x512",
            type: "image/svg+xml"
        }
    ]
};

// Create manifest.json dynamically
const manifestBlob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
const manifestURL = URL.createObjectURL(manifestBlob);
document.querySelector('link[rel="manifest"]').href = manifestURL;

// Simple Service Worker inline
const swCode = `
const CACHE_NAME = 'ghostrunner-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
`;

// Register service worker with inline code
if ('serviceWorker' in navigator) {
    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swURL = URL.createObjectURL(swBlob);
    
    navigator.serviceWorker.register(swURL)
        .then(registration => {
            console.log('ServiceWorker registration successful');
        })
        .catch(error => {
            console.log('ServiceWorker registration failed: ', error);
        });
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ghostrunnerGame = new GhostrunnerGame();
});

// Handle app lifecycle
window.addEventListener('beforeunload', () => {
    if (window.ghostrunnerGame && window.ghostrunnerGame.gameState.isPlaying) {
        window.ghostrunnerGame.saveGameState();
    }
});

// Handle visibility change for battery optimization
document.addEventListener('visibilitychange', () => {
    if (window.ghostrunnerGame) {
        if (document.hidden) {
            // App is hidden, pause oxygen timer
            if (window.ghostrunnerGame.oxygenTimer) {
                clearInterval(window.ghostrunnerGame.oxygenTimer);
            }
        } else {
            // App is visible, resume oxygen timer
            if (window.ghostrunnerGame.gameState.isPlaying) {
                window.ghostrunnerGame.startOxygenTimer();
            }
        }
    }
});

console.log(`
╔══════════════════════════════════════╗
║        GHOSTRUNNER ACTIVATED         ║
║          Neo-Kyoto 2077             ║
║                                      ║
║  > System online                     ║
║  > Oxygen levels: 100%               ║
║  > Station Kibō-7: CRITICAL          ║
║  > Mission: ESCAPE PROTOCOL          ║
║                                      ║
║  Ready for deployment, Ghostrunner   ║
╚══════════════════════════════════════╝
`);