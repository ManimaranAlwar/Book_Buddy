/**
 * Classroom Games SDK
 * Handles Authentication, Streaks, and Progress Saving.
 */

const GamesSDK = {
    // Current User State
    user: null,

    init: function () {
        this.user = JSON.parse(localStorage.getItem('classroom_user'));
        this.updateUI();
    },

    login: function (name, avatar) {
        this.user = {
            id: Date.now().toString(),
            name: name,
            avatar: avatar,
            streaks: {}, // { 'anagram': 5, 'box_pick': 2 }
            totalStreak: 0,
            badges: []
        };
        this.saveUser();
        return this.user;
    },

    logout: function () {
        this.user = null;
        localStorage.removeItem('classroom_user');
        window.location.href = '/';
    },

    saveUser: function () {
        localStorage.setItem('classroom_user', JSON.stringify(this.user));
        this.updateUI();
    },

    /**
     * Call this when a game level/session is completed successfully.
     * @param {string} gameId - 'anagram', 'box_pick', 'cross_maths', 'matchup', 'space_run'
     */
    reportScore: function (gameId) {
        if (!this.user) return;

        // Simple Streak Logic: Just increment for now. 
        // Real streak logic requires checking the "last played date".
        const today = new Date().toDateString();
        const lastPlayed = this.user.lastPlayed || {};

        if (lastPlayed[gameId] !== today) {
            this.user.streaks[gameId] = (this.user.streaks[gameId] || 0) + 1;
            this.user.totalStreak++;
            lastPlayed[gameId] = today;
            this.user.lastPlayed = lastPlayed;

            this.checkBadges();
            this.saveUser();
            this.showToast(`🔥 Streak Up! ${this.user.streaks[gameId]} days!`);
        }
    },

    checkBadges: function () {
        // Example Badge Logic
        if (this.user.totalStreak >= 5 && !this.user.badges.includes('fire_starter')) {
            this.user.badges.push('fire_starter');
            this.showToast("🏆 Badge Unlocked: Fire Starter!");
        }
        if (this.user.streaks['matchup'] >= 3 && !this.user.badges.includes('memory_master')) {
            this.user.badges.push('memory_master');
            this.showToast("🧠 Badge Unlocked: Memory Master!");
        }
    },

    updateUI: function () {
        const profileEl = document.getElementById('user-profile-display');
        if (profileEl) {
            if (this.user) {
                profileEl.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${this.user.avatar}</span>
                        <span class="font-bold text-white">${this.user.name}</span>
                        <span class="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">🔥 ${this.user.totalStreak}</span>
                    </div>
                `;
            } else {
                profileEl.innerHTML = `<a href="/" class="text-white hover:underline">Login</a>`;
            }
        }
    },

    showToast: function (msg) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-green-500 z-50 animate-bounce-in';
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GamesSDK.init();
});
