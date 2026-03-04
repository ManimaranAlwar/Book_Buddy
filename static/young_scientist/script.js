let recipes = [];
let selected = [];

async function loadGame() {
    const res = await fetch('/young-scientist/api/recipes');
    recipes = await res.json();

    // 1. Identify the current user
    const userName = document.getElementById('current-user').value;
    const storageKey = 'alchemist_items_' + userName;

    // 2. Define the 4 starting elements
    const defaultItems = ['🔥', '💧', '🌱', '💨'];

    // 3. Load items specific to THIS user, or give them the default 4
    let myItems = JSON.parse(localStorage.getItem(storageKey)) || defaultItems;

    updateInventoryUI(myItems);
}

function updateInventoryUI(items) {
    const grid = document.getElementById('inventory');
    grid.innerHTML = '';

    // Update count
    const countDisplay = document.getElementById('collected-count');
    if (countDisplay) countDisplay.innerText = items.length;

    items.forEach(emoji => {
        const div = document.createElement('div');
        div.className = 'w-14 h-14 glass rounded-2xl flex items-center justify-center text-2xl shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer select-none border border-theme-blue/5';
        div.innerText = emoji;
        div.onclick = () => selectItem(emoji);
        grid.appendChild(div);
    });
}

function selectItem(emoji) {
    if (selected.length < 2) {
        selected.push(emoji);
        document.getElementById(`slot${selected.length}`).innerText = emoji;
    }
    if (selected.length === 2) {
        setTimeout(checkRecipe, 300);
    }
}

function checkRecipe() {
    const cauldron = document.getElementById('main-cauldron');

    // 1. Identify the current logged-in user
    // Make sure you have <input type="hidden" id="current-user" value="{{ username }}"> in index.html
    const userName = document.getElementById('current-user').value;
    const storageKey = 'alchemist_items_' + userName;

    // 2. Find if the combination exists in your recipes
    const match = recipes.find(r =>
        (r.item1 === selected[0] && r.item2 === selected[1]) ||
        (r.item1 === selected[1] && r.item2 === selected[0])
    );

    // 3. Load progress for THIS specific user, or start with the 4 basic elements
    let myItems = JSON.parse(localStorage.getItem(storageKey)) || ['🔥', '💧', '🌱', '💨'];

    // Success: Recipe found AND user hasn't discovered it yet
    if (match && !myItems.includes(match.result)) {
        // Show discovery UI
        document.getElementById('new-emoji').innerText = match.result;
        document.getElementById('explanation-text').innerText = match.explanation;
        document.getElementById('discovery-box').classList.remove('hidden');

        // Update the user's specific list
        myItems.push(match.result);

        // 4. Save back to the user-specific storage key
        localStorage.setItem(storageKey, JSON.stringify(myItems));
        updateInventoryUI(myItems);
    }
    // "No Reaction" Logic: Recipe missing OR already exists in inventory
    else {
        cauldron.classList.add('shake');
        setTimeout(() => {
            cauldron.classList.remove('shake');
            clearSlots();
        }, 400);
    }
}

function clearSlots() {
    // 1. Reset the logic array so the game 'forgets' what you picked
    selected = [];

    // 2. Reset the visual display for both slots
    const s1 = document.getElementById('slot1');
    const s2 = document.getElementById('slot2');

    if (s1 && s2) {
        s1.innerText = "?";
        s2.innerText = "?";
    }

    console.log("Cauldron cleaned!"); // Check your browser console (F12) to see if this triggers
}

function closeDiscovery() {
    document.getElementById('discovery-box').classList.add('hidden');
    clearSlots();
}

loadGame();