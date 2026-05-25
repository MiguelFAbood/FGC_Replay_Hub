// Grab the text inputs
const p1Input = document.getElementById('p1-input');
const p2Input = document.getElementById('p2-input');
const resultsContainer = document.getElementById('video-results');

// Global State (Updated for Pagination)
let activeChar1 = "";
let activeChar2 = "";
let allReplays = [];
let activeFilteredReplays = []; 
let currentPage = 1; // Tracks the current page
const VIDEOS_PER_PAGE = 15; // Videos per page

// 1. Fetch the data
fetch('replays.json')
    .then(response => response.json())
    .then(data => {
        allReplays = data;
        activeFilteredReplays = data; // Initially, the filtered list is everything
        renderVideos(); 
    })
    .catch(error => {
        console.error("Error loading replays:", error);
        resultsContainer.innerHTML = '<p style="color: #ff3366; text-align: center; width: 100%;">Could not load replays. Check the developer console.</p>';
    });

// 2. Custom Dropdown Logic
function setupCharacterSelector(activePortraitId, optionsId, isPlayer1) {
    const activePortraitBox = document.getElementById(activePortraitId);
    const activeImage = activePortraitBox.querySelector('img');
    const optionsDropdown = document.getElementById(optionsId);
    const optionRows = optionsDropdown.querySelectorAll('.dropdown-item');

    activePortraitBox.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (isPlayer1) {
            document.getElementById('p2-options').classList.add('hidden');
        } else {
            document.getElementById('p1-options').classList.add('hidden');
        }
        optionsDropdown.classList.toggle('hidden');
    });

    optionRows.forEach(row => {
        row.addEventListener('click', () => {
            const charName = row.getAttribute('data-char');
            const imgSrc = row.querySelector('img').src;

            activeImage.src = imgSrc;

            if (isPlayer1) {
                activeChar1 = charName;
            } else {
                activeChar2 = charName;
            }

            optionsDropdown.classList.add('hidden');
            filterReplays();
        });
    });
}

setupCharacterSelector('p1-active-portrait', 'p1-options', true);
setupCharacterSelector('p2-active-portrait', 'p2-options', false);

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-char-select')) {
        document.getElementById('p1-options').classList.add('hidden');
        document.getElementById('p2-options').classList.add('hidden');
    }
});

// 3. The Filter Function
function filterReplays() {
    const p1 = p1Input.value.toLowerCase().trim();
    const p2 = p2Input.value.toLowerCase().trim();
    const c1 = activeChar1.toLowerCase();
    const c2 = activeChar2.toLowerCase();

    activeFilteredReplays = allReplays.filter(replay => {
        const matchP1 = replay.player1.toLowerCase().includes(p1);
        const matchP2 = replay.player2.toLowerCase().includes(p2);
        const matchC1 = c1 === "" || replay.character1.toLowerCase().includes(c1);
        const matchC2 = c2 === "" || replay.character2.toLowerCase().includes(c2);

        return matchP1 && matchP2 && matchC1 && matchC2;
    });

    // Reset to the first page whenever the user searches something new!
    currentPage = 1;
    renderVideos();
}

// 4. The Render Function (Updated for Pages)
function renderVideos() {
    resultsContainer.innerHTML = ''; 

    if (activeFilteredReplays.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #888; text-align: center; width: 100%; grid-column: 1 / -1;">No matches found.</p>';
        return;
    }

    // Calculate which videos to show based on the current page
    const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
    const endIndex = startIndex + VIDEOS_PER_PAGE;
    const slicedVideos = activeFilteredReplays.slice(startIndex, endIndex);

    // Render the videos
    slicedVideos.forEach(match => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <iframe 
                width="100%" 
                height="180" 
                src="https://www.youtube-nocookie.com/embed/${match.videoId}" 
                title="${match.fullTitle}" 
                frameborder="0" 
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
            <div class="video-info">
                <h3>${match.player1} (${match.character1}) vs ${match.player2} (${match.character2})</h3>
                <p>Date: ${new Date(match.date).toLocaleDateString()}</p>
            </div>
        `;
        resultsContainer.appendChild(card);
    });

    // 5. Render Pagination Controls
    const totalPages = Math.ceil(activeFilteredReplays.length / VIDEOS_PER_PAGE);

    if (totalPages > 1) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-controls';
        
        // Previous Button
        const prevBtn = document.createElement('button');
        prevBtn.innerText = '◄ Prev';
        prevBtn.disabled = currentPage === 1; // Disable if on page 1
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderVideos();
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back up
            }
        });

        // Page Text
        const pageText = document.createElement('span');
        pageText.innerText = `Page ${currentPage} of ${totalPages}`;

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.innerText = 'Next ►';
        nextBtn.disabled = currentPage === totalPages; // Disable if on last page
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderVideos();
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back up
            }
        });

        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageText);
        paginationContainer.appendChild(nextBtn);
        resultsContainer.appendChild(paginationContainer);
    }
}

// 6. The Debounce Function (Wait before searching)
let typingTimer;
const typingInterval = 300; 

function handleInputDebounce() {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(filterReplays, typingInterval); 
}

p1Input.addEventListener('input', handleInputDebounce);
p2Input.addEventListener('input', handleInputDebounce);