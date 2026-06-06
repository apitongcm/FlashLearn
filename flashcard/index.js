let flashcards = [];
let currentCard = null;

const csvFileInput = document.getElementById('csv-file');
const cardElement = document.getElementById('flashcard');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const resetBtn = document.getElementById('reset-btn');

// --- INITIALIZE APP & FETCH DEFAULT CSV ---
document.addEventListener('DOMContentLoaded', () => {
   // Note: Added this feature to speed up the system since it will not download csv everytime the user use the system. (06062026) 
   // Check if the user has a previously saved custom CSV in their cache
    const savedCards = localStorage.getItem('userFlashcards');
    
    if (savedCards) {
        console.log("Loading custom dataset from browser cache memory.");
        flashcards = JSON.parse(savedCards);
        showNextCard();
    } else {
        // If cache is empty, pull from your online default.csv file
        console.log("No cache found. Fetching default.csv.");
        fetchDefaultCSV();
    }
});

function fetchDefaultCSV() {

    // Looks for 'default.csv' in the same directory
    fetch('default.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error("Could not find default.csv file.");
            }
            return response.text();
        })
        .then(text => {
            parseCSVData(text);
            if (flashcards.length > 0) {
                showNextCard();
            }
        })
        .catch(error => {
            console.warn("Auto-fetch notice:", error.message);
            // Fallback placeholder message if they are opening raw html file without a server
            cardElement.innerHTML = `
                <div class="card-front">
                    <p class="placeholder-text" style="padding: 20px;">
                        Welcome! Please upload a CSV file to begin, or run a local server to auto-load default.csv.
                    </p>
                </div>
            `;
        });
}

// --- CACHE RESET CONTROLLER ---
resetBtn.addEventListener('click', () => {
    // Show a native confirmation prompt so users don't accidentally wipe their list
    const confirmReset = confirm("Are you sure you want to clear your custom uploaded list and return to the default flashcards?");
    
    if (confirmReset) {
        // Evict the key from browser cache memory
        localStorage.removeItem('userFlashcards');
        
        // Clear out the file input element visual state
        csvFileInput.value = "";
        
        // Re-trigger the background parser to fetch original default data
        fetchDefaultCSV();
        
        console.log("Cache cleared successfully. Reverted to default dataset.");
    }
});


// --- REUSABLE CSV PARSER ---
function parseCSVData(text) {
    const lines = text.split('\n');
    flashcards = []; // Clear existing cards

    lines.forEach(line => {
        // Handle basic comma separation
        const columns = line.split(',');
        if (columns.length >= 3) {
            flashcards.push({
                character: columns[0].trim(),
                pinyin: columns[1].trim(),
                english: columns[2].trim()
            });
        }
    });
}

// --- Custom File Upload ---
csvFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        parseCSVData(event.target.result);

        if (flashcards.length > 0) {
            // Note: Added this feature to speed up the system since it will not download csv everytime the user use the system. (06062026) 
            localStorage.setItem('userFlashcards', JSON.stringify(flashcards));
            showNextCard();
        } else {
            alert("No valid data found in your uploaded CSV. Format: Character,Pinyin,English");
        }
    };
    reader.readAsText(file);
});

// --- Card Management Engine ---
function showNextCard() {
    if (flashcards.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * flashcards.length);
    currentCard = flashcards[randomIndex];

    cardElement.classList.remove('flipped');

    cardElement.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <div class="character">${currentCard.character}</div>
            </div>
            <div class="card-back">
                <div class="pinyin">${currentCard.pinyin}</div>
                <div class="english">${currentCard.english}</div>
            </div>
        </div>
    `;
}

function revealCard() {
    if (currentCard) {
        cardElement.classList.toggle('flipped'); 
    }
}

// --- Fullscreen Engine ---
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        }).catch(err => {
            alert(`Error entering fullscreen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// --- Gesture & Interaction Listeners ---
cardElement.addEventListener('dblclick', () => {
    revealCard();
});

let touchstartX = 0;
let touchendX = 0;

cardElement.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
}, {passive: true});

cardElement.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipeGesture();
}, {passive: true});

function handleSwipeGesture() {
    if (touchendX < touchstartX - 50) {
        showNextCard();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === "Space") {
        e.preventDefault(); 
        showNextCard();
    }
});