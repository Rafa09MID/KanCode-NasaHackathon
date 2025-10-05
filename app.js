// AcademiSearch - Academic Search with Gamification and Server Integration
class AcademiSearchApp {
    constructor() {
        // Server configuration - Change this URL to your server
        this.SERVER_URL = 'http://localhost:3000/search';
        
        // Mock server response (fallback when server is not available)
        this.mockServerResponse = {
            "query": "microgravity",
            "count": 3,
            "results": [
                {
                    "id": "68e17c80dfee150e615381af",
                    "title": "Changes in Nuclear Shape and Gene Expression in Response to Simulated Microgravity Are LINC Complex-Dependent",
                    "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7555797/",
                    "doi": "10.3390/ijms21186762",
                    "year": null,
                    "autores": "Neelam, Srujana; Richardson, Brian; Barker, Richard; Udave, Ceasar; Gilroy, Simon; Cameron, Mark J.; Levine, Howard G.; Zhang, Ye",
                    "categorias": "Article",
                    "tipo_articulo": "research-article",
                    "score": 0.7571909427642822,
                    "snippet": "Microgravity is known to affect the organization of the cytoskeleton, cell and nuclear morphology and to elicit differential expression of genes associated with the cytoskeleton, focal adhesions and the extracellular matrix. Although the nucleus is mechanically connected to the cytoskeleton through the Linker of Nucleoskeleton and Cytoskeleton (LINC) complex, the role of this group of proteins in these responses to microgravity has yet to be defined."
                },
                {
                    "id": "68e17c80dfee150e61538157",
                    "title": "Effects of angular frequency during clinorotation on mesenchymal stem cell morphology and migration",
                    "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5515506/",
                    "doi": "10.1038/npjmgrav.2015.7",
                    "year": null,
                    "autores": "Luna, Carlos; Yew, Alvin G; Hsieh, Adam H",
                    "categorias": "Article",
                    "tipo_articulo": "research-article",
                    "score": 0.7305088043212891,
                    "snippet": "Aims: To determine the short-term effects of simulated microgravity on mesenchymal stem cell behaviors as a function of clinorotation speed using time-lapse microscopy. Background: Ground-based microgravity simulation can reproduce the apparent effects of weightlessness in spaceflight using clinostats that continuously reorient the gravity vector on a specimen, creating a time-averaged nullification of the gravitational force."
                },
                {
                    "id": "68e17c80dfee150e615380d9",
                    "title": "Metabolomic Profiling of the Secretome from Human Neural Stem Cells Flown into Space",
                    "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10813126/",
                    "doi": "10.3390/bioengineering11010011",
                    "year": null,
                    "autores": "Biancotti, Juan Carlos; Espinosa-Jeffrey, Araceli",
                    "categorias": "Article",
                    "tipo_articulo": "research-article",
                    "score": 0.7265908718109131,
                    "snippet": "The change in gravitational force has a significant effect on biological tissues and the entire organism. As with any alteration in the environment, microgravity produces modifications in the system inducing adaptation to the new condition. In this study, we analyzed the effect of microgravity on neural stem cells (NSCs) following a space flight to the International Space Station (ISS)."
                }
            ]
        };

        // Game configuration
        this.gameSettings = {
            points: {
                search: 5,
                readArticle: 10,
                completeFlashcard: 15
            },
            levels: [
                {name: "Novato", min: 0, max: 50},
                {name: "Intermedio", min: 51, max: 150},
                {name: "Avanzado", min: 151, max: 300},
                {name: "Experto", min: 301, max: 999999}
            ],
            badges: [
                {id: "first_search", name: "Primera Búsqueda", description: "Realizaste tu primera búsqueda", icon: "🔍"},
                {id: "avid_reader", name: "Lector Ávido", description: "Leíste 10 artículos", icon: "📚"},
                {id: "explorer", name: "Explorador", description: "Exploraste 5 temas diferentes", icon: "🧭"},
                {id: "week_streak", name: "Racha Semanal", description: "7 días consecutivos usando la plataforma", icon: "🔥"}
            ]
        };

        // Current state
        this.currentProfile = 'estudiante';
        this.currentArticle = null;
        this.currentFlashCards = [];
        this.currentCardIndex = 0;
        this.isCardFlipped = false;
        this.filteredArticles = [];
        this.allArticles = [];
        this.serverConnected = false;
        this.searchTimeout = null;

        // Game progress
        this.gameProgress = this.loadGameProgress();

        // Initialize app
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateFilters();
        this.updateRewardsDisplay();
        this.updateStreakCounter();
        this.updateServerStatus();
    }

    // Server Integration
    async fetchFromServer(query) {
        try {
            document.getElementById('search-loading').classList.remove('hidden');
            
            const response = await fetch(`${this.SERVER_URL}?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add timeout
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.serverConnected = true;
            this.updateServerStatus();
            return data;

        } catch (error) {
            console.warn('Server connection failed, using mock data:', error);
            this.serverConnected = false;
            this.updateServerStatus();
            this.showErrorMessage();
            
            // Return mock data with search term
            return {
                ...this.mockServerResponse,
                query: query
            };
        } finally {
            document.getElementById('search-loading').classList.add('hidden');
        }
    }

    // Map server results to internal format
    mapServerResults(serverResponse) {
        return serverResponse.results.map(item => ({
            id: item.id,
            titulo: item.title,
            autor: item.autores,
            año: item.year || 'Sin año',
            tema: item.categorias,
            abstract: item.snippet,
            url: item.url,
            doi: item.doi,
            score: item.score,
            tipo: item.tipo_articulo
        }));
    }

    updateServerStatus() {
        const statusElement = document.getElementById('server-status');
        if (this.serverConnected) {
            statusElement.textContent = '🟢 Activo';
            statusElement.style.color = 'var(--color-success)';
        } else {
            statusElement.textContent = '🔴 Desconectado';
            statusElement.style.color = 'var(--color-error)';
        }
    }

    showErrorMessage() {
        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    // Game Progress Management
    loadGameProgress() {
        const saved = localStorage.getItem('gameProgress');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return {
            points: 0,
            level: 'Novato',
            unlockedBadges: [],
            searchCount: 0,
            articlesRead: [],
            themesExplored: [],
            streakDays: 0,
            lastVisit: new Date().toDateString(),
            flashcardsCompleted: 0
        };
    }

    saveGameProgress() {
        localStorage.setItem('gameProgress', JSON.stringify(this.gameProgress));
    }

    // Event Listeners
    setupEventListeners() {
        // Profile selector
        document.getElementById('profile-select').addEventListener('change', (e) => {
            this.currentProfile = e.target.value;
            this.renderResults();
        });

        // Search functionality with debounce
        document.getElementById('search-btn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Real-time search with debounce
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length > 2) {
                this.searchTimeout = setTimeout(() => {
                    this.performSearch();
                }, 500);
            }
        });

        // Filters
        document.getElementById('tema-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('score-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('type-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Modal events
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('view-article').addEventListener('click', () => {
            this.viewOriginalArticle();
        });

        // Flash card events
        document.getElementById('flip-card').addEventListener('click', () => {
            this.flipCard();
        });

        document.getElementById('prev-card').addEventListener('click', () => {
            this.previousCard();
        });

        document.getElementById('next-card').addEventListener('click', () => {
            this.nextCard();
        });

        document.getElementById('complete-study').addEventListener('click', () => {
            this.completeFlashcardStudy();
        });

        // Modal backdrop click
        document.querySelector('.modal__backdrop').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Initialize filters
    populateFilters() {
        // This will be populated after first search with actual categories from server
    }

    updateFilters() {
        const temaFilter = document.getElementById('tema-filter');
        const uniqueCategories = [...new Set(this.allArticles.map(article => article.tema))];
        
        // Clear existing options except "All"
        temaFilter.innerHTML = '<option value="">Todas las categorías</option>';
        
        uniqueCategories.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            temaFilter.appendChild(option);
        });
    }

    // Search functionality
    async performSearch() {
        const searchTerm = document.getElementById('search-input').value.trim();
        
        if (searchTerm.length === 0) return;

        try {
            // Fetch data from server
            const serverResponse = await this.getInfo(searchTerm); // fetchFromServer
            
            // Map server results to internal format
            this.allArticles = this.mapServerResults(serverResponse);
            
            // Award points for search
            this.awardPoints(this.gameSettings.points.search);
            this.gameProgress.searchCount++;

            // Check for first search badge
            this.checkBadgeUnlock('first_search');

            // Update UI
            document.getElementById('welcome-message').classList.add('hidden');
            document.getElementById('results-header').classList.remove('hidden');
            
            // Update filters with new data
            this.updateFilters();
            
            // Apply filters and render results
            this.applyFilters();
            this.saveGameProgress();

        } catch (error) {
            console.error('Search failed:', error);
            this.showErrorMessage();
        }
    }

    // Filter functionality
    applyFilters() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const temaFilter = document.getElementById('tema-filter').value;
        const scoreFilter = parseFloat(document.getElementById('score-filter').value) || 0;
        const typeFilter = document.getElementById('type-filter').value;

        this.filteredArticles = this.allArticles.filter(articulo => {
            const matchesSearch = !searchTerm || 
                articulo.titulo.toLowerCase().includes(searchTerm) ||
                articulo.abstract.toLowerCase().includes(searchTerm) ||
                articulo.autor.toLowerCase().includes(searchTerm);

            const matchesTema = !temaFilter || articulo.tema === temaFilter;
            const matchesScore = articulo.score >= scoreFilter;
            const matchesType = !typeFilter || articulo.tipo === typeFilter;

            return matchesSearch && matchesTema && matchesScore && matchesType;
        });

        // Sort by score (relevance) descending
        this.filteredArticles.sort((a, b) => b.score - a.score);

        this.renderResults();
    }

    clearFilters() {
        document.getElementById('tema-filter').value = '';
        document.getElementById('score-filter').value = '';
        document.getElementById('type-filter').value = '';
        this.applyFilters();
    }

    // Variante segura que usa la URL del servidor configurada (recomendada)
    async getInfo(query = "microgravity", k = 6) {
        const target = "https://outdoor-gyrostatic-hiedi.ngrok-free.dev/rag"; // intenta reusar SERVER_URL
        const controller = new AbortController();
        const timeoutMs = 8000;

        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(target, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    k,
                    // categorias: ["Article"],
                    generate: true
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                // lee texto de error si hay
                const text = await res.text().catch(() => '');
                console.error(`HTTP ${res.status} ${res.statusText}`, text);
                return null;
            }

            // intenta parsear JSON, si falla, muestra respuesta cruda
            try {
                const data = await res.json();
                console.log('Respuesta del servidor:', data);
                return data;
            } catch (parseErr) {
                const text = await res.text().catch(() => '');
                console.error('Respuesta no JSON:', text);
                return null;
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.error('La petición se canceló por timeout');
            } else {
                console.error('Error en la petición:', err);
            }
            return null;
        }
    }


    // Results rendering
    renderResults() {
        const resultsGrid = document.getElementById('results-grid');
        const resultsCount = document.getElementById('results-count');
        const noResults = document.getElementById('no-results');

        resultsCount.textContent = `${this.filteredArticles.length} artículos encontrados`;

        if (this.filteredArticles.length === 0) {
            resultsGrid.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }

        noResults.classList.add('hidden');
        
        resultsGrid.innerHTML = this.filteredArticles.map(articulo => 
            this.createArticleCard(articulo)
        ).join('');

        // Add click listeners to cards
        document.querySelectorAll('.article-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.openArticleModal(this.filteredArticles[index]);
            });
        });
    }

    createArticleCard(articulo) {
        const scorePercentage = Math.round(articulo.score * 100);
        return `
            <div class="card article-card" data-id="${articulo.id}">
                <div class="article-card__header">
                    <h3 class="article-card__title">${articulo.titulo}</h3>
                    <div class="article-card__meta">
                        <div><strong>Autores:</strong> ${articulo.autor}</div>
                        <div><strong>Año:</strong> ${articulo.año}</div>
                    </div>
                </div>
                <div class="article-card__body">
                    <p class="article-card__abstract">${articulo.abstract}</p>
                </div>
                <div class="article-card__footer">
                    <span class="article-card__tema">${articulo.tema}</span>
                    <div class="article-card__score">
                        <span>${scorePercentage}%</span>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${scorePercentage}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Modal functionality
    openArticleModal(articulo) {
        this.currentArticle = articulo;
        
        // Track themes explored
        if (!this.gameProgress.themesExplored.includes(articulo.tema)) {
            this.gameProgress.themesExplored.push(articulo.tema);
            this.checkBadgeUnlock('explorer');
        }

        // Track articles read
        if (!this.gameProgress.articlesRead.includes(articulo.id)) {
            this.gameProgress.articlesRead.push(articulo.id);
            this.awardPoints(this.gameSettings.points.readArticle);
            this.checkBadgeUnlock('avid_reader');
        }

        // Populate modal content
        document.getElementById('modal-title').textContent = articulo.titulo;
        document.getElementById('modal-author').textContent = articulo.autor;
        document.getElementById('modal-year').textContent = articulo.año;
        document.getElementById('modal-doi').textContent = articulo.doi || 'N/A';
        document.getElementById('modal-score').textContent = (articulo.score * 100).toFixed(1) + '%';

        // Content based on profile
        const contentBody = document.getElementById('modal-content-body');
        const flashcardsSection = document.getElementById('flashcards-section');

        contentBody.innerHTML = this.getModalContent(articulo);

        // Show/hide flashcards for students
        if (this.currentProfile === 'estudiante') {
            this.generateFlashCards(articulo);
            flashcardsSection.classList.remove('hidden');
        } else {
            flashcardsSection.classList.add('hidden');
        }

        // Show modal
        document.getElementById('article-modal').classList.remove('hidden');
        this.saveGameProgress();
    }

    getModalContent(articulo) {
        switch (this.currentProfile) {
            case 'estudiante':
                return `
                    <div>
                        <h4>📖 Resumen</h4>
                        <p>${articulo.abstract}</p>
                        <h4>🎯 Puntos Clave</h4>
                        <ul>
                            ${this.extractKeyPoints(articulo.abstract).map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                `;
            
            case 'investigador':
                return `
                    <div>
                        <h4>📊 Resumen Técnico</h4>
                        <p>${articulo.abstract}</p>
                        <h4>🔬 Información de Investigación</h4>
                        <p><strong>Tipo de artículo:</strong> ${articulo.tipo}</p>
                        <p><strong>Puntuación de relevancia:</strong> ${(articulo.score * 100).toFixed(1)}%</p>
                        <h4>📚 Metadatos</h4>
                        <p><strong>DOI:</strong> ${articulo.doi || 'No disponible'}</p>
                        <p><strong>Categoría:</strong> ${articulo.tema}</p>
                    </div>
                `;
            
            case 'gestor':
                return `
                    <div>
                        <h4>📈 Métricas de Impacto</h4>
                        <p><strong>Puntuación de relevancia:</strong> ${(articulo.score * 100).toFixed(1)}%</p>
                        <p><strong>Categoría:</strong> ${articulo.tema}</p>
                        <h4>🎯 Aplicaciones Prácticas</h4>
                        <p>Este artículo presenta información relevante para la gestión de proyectos en ${articulo.tema.toLowerCase()}.</p>
                        <h4>💡 Resumen Ejecutivo</h4>
                        <p>${articulo.abstract}</p>
                        <h4>📊 Datos Técnicos</h4>
                        <p><strong>Tipo:</strong> ${articulo.tipo}</p>
                        <p><strong>Año:</strong> ${articulo.año}</p>
                    </div>
                `;
            
            default:
                return `<p>${articulo.abstract}</p>`;
        }
    }

    extractKeyPoints(abstract) {
        // Extract key sentences from abstract for student view
        const sentences = abstract.split('. ');
        return sentences.slice(0, 3).map(sentence => sentence.trim() + (sentence.endsWith('.') ? '' : '.'));
    }

    closeModal() {
        document.getElementById('article-modal').classList.add('hidden');
        this.currentArticle = null;
        this.currentFlashCards = [];
        this.currentCardIndex = 0;
        this.isCardFlipped = false;
    }

    viewOriginalArticle() {
        if (this.currentArticle && this.currentArticle.url) {
            window.open(this.currentArticle.url, '_blank');
        }
    }

    // Flash Cards functionality - Generate from snippet
    generateFlashCards(articulo) {
        this.currentFlashCards = [];
        
        // Extract concepts from abstract/snippet
        const concepts = this.extractConcepts(articulo.abstract);
        
        // Generate flash cards from concepts
        concepts.forEach((concept, index) => {
            if (index < 5) { // Max 5 cards
                this.currentFlashCards.push({
                    question: `¿Qué puedes decir sobre ${concept}?`,
                    answer: `${concept} es un concepto importante en este estudio sobre "${articulo.titulo}". Se relaciona con el tema de ${articulo.tema}.`
                });
            }
        });

        // Add specific flash cards based on content
        this.currentFlashCards.push({
            question: `¿Cuál es el tema principal de este artículo?`,
            answer: `El tema principal es ${articulo.tema}, específicamente sobre "${articulo.titulo}".`
        });

        // Add methodology question
        this.currentFlashCards.push({
            question: `¿Qué tipo de investigación es este artículo?`,
            answer: `Es un ${articulo.tipo} con una puntuación de relevancia del ${(articulo.score * 100).toFixed(1)}%.`
        });

        this.currentCardIndex = 0;
        this.isCardFlipped = false;
        this.updateFlashCard();
    }

    extractConcepts(text) {
        // Simple concept extraction - look for important terms
        const words = text.toLowerCase().split(/\s+/);
        const concepts = [];
        const importantTerms = ['microgravity', 'cell', 'stem', 'neural', 'protein', 'gene', 'expression', 'cytoskeleton', 'morphology', 'space', 'flight', 'analysis', 'study', 'effect', 'system'];
        
        words.forEach(word => {
            const cleanWord = word.replace(/[^\w]/g, '');
            if (importantTerms.includes(cleanWord) && !concepts.includes(cleanWord)) {
                concepts.push(cleanWord);
            }
        });

        return concepts.slice(0, 5); // Return max 5 concepts
    }

    updateFlashCard() {
        if (this.currentFlashCards.length === 0) return;

        const card = this.currentFlashCards[this.currentCardIndex];
        document.getElementById('flashcard-question').textContent = card.question;
        document.getElementById('flashcard-answer').textContent = card.answer;
        document.getElementById('card-counter').textContent = 
            `${this.currentCardIndex + 1} / ${this.currentFlashCards.length}`;

        // Reset card to front
        document.getElementById('flashcard').classList.remove('flipped');
        this.isCardFlipped = false;

        // Update navigation buttons
        document.getElementById('prev-card').disabled = this.currentCardIndex === 0;
        document.getElementById('next-card').disabled = 
            this.currentCardIndex === this.currentFlashCards.length - 1;
    }

    flipCard() {
        const flashcard = document.getElementById('flashcard');
        if (this.isCardFlipped) {
            flashcard.classList.remove('flipped');
        } else {
            flashcard.classList.add('flipped');
        }
        this.isCardFlipped = !this.isCardFlipped;
    }

    previousCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.updateFlashCard();
        }
    }

    nextCard() {
        if (this.currentCardIndex < this.currentFlashCards.length - 1) {
            this.currentCardIndex++;
            this.updateFlashCard();
        }
    }

    completeFlashcardStudy() {
        this.awardPoints(this.gameSettings.points.completeFlashcard);
        this.gameProgress.flashcardsCompleted++;
        this.saveGameProgress();
        
        this.showAchievementNotification(
            "¡Flash Cards Completadas! 🎯", 
            `+${this.gameSettings.points.completeFlashcard} puntos por completar el estudio`
        );
    }

    // Points and rewards system
    awardPoints(points) {
        this.gameProgress.points += points;
        this.updateLevel();
        this.updateRewardsDisplay();
        this.showPointsAnimation(points);
    }

    updateLevel() {
        const currentPoints = this.gameProgress.points;
        const newLevel = this.gameSettings.levels.find(level => 
            currentPoints >= level.min && currentPoints <= level.max
        );
        
        if (newLevel && newLevel.name !== this.gameProgress.level) {
            this.gameProgress.level = newLevel.name;
            this.showAchievementNotification(
                "¡Nivel Subido! 🚀", 
                `Ahora eres ${newLevel.name}`
            );
        }
    }

    checkBadgeUnlock(badgeId) {
        if (this.gameProgress.unlockedBadges.includes(badgeId)) return;

        let shouldUnlock = false;
        
        switch (badgeId) {
            case 'first_search':
                shouldUnlock = this.gameProgress.searchCount >= 1;
                break;
            case 'avid_reader':
                shouldUnlock = this.gameProgress.articlesRead.length >= 10;
                break;
            case 'explorer':
                shouldUnlock = this.gameProgress.themesExplored.length >= 5;
                break;
            case 'week_streak':
                shouldUnlock = this.gameProgress.streakDays >= 7;
                break;
        }

        if (shouldUnlock) {
            this.gameProgress.unlockedBadges.push(badgeId);
            const badge = this.gameSettings.badges.find(b => b.id === badgeId);
            this.showAchievementNotification(
                `¡Insignia Desbloqueada! ${badge.icon}`,
                badge.name
            );
            this.updateRewardsDisplay();
        }
    }

    updateRewardsDisplay() {
        // Update points and level
        document.getElementById('current-points').textContent = this.gameProgress.points;
        document.getElementById('current-level').textContent = this.gameProgress.level;

        // Update progress bar
        const currentLevel = this.gameSettings.levels.find(l => l.name === this.gameProgress.level);
        const nextLevel = this.gameSettings.levels.find(l => l.min > currentLevel.max);
        
        if (nextLevel) {
            const progress = ((this.gameProgress.points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100;
            document.getElementById('progress-fill').style.width = `${Math.min(progress, 100)}%`;
            document.getElementById('progress-text').textContent = 
                `${this.gameProgress.points}/${nextLevel.min} pts para ${nextLevel.name}`;
        } else {
            document.getElementById('progress-fill').style.width = '100%';
            document.getElementById('progress-text').textContent = '¡Nivel máximo alcanzado!';
        }

        // Update badges
        this.renderBadges();
    }

    renderBadges() {
        const badgesGrid = document.getElementById('badges-grid');
        badgesGrid.innerHTML = this.gameSettings.badges.map(badge => {
            const isUnlocked = this.gameProgress.unlockedBadges.includes(badge.id);
            return `
                <div class="badge ${isUnlocked ? 'badge--unlocked' : 'badge--locked'}" 
                     title="${badge.description}">
                    <div class="badge__icon">${badge.icon}</div>
                    <div class="badge__name">${badge.name}</div>
                </div>
            `;
        }).join('');
    }

    updateStreakCounter() {
        const today = new Date().toDateString();
        const lastVisit = this.gameProgress.lastVisit;
        
        if (lastVisit !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastVisit === yesterday.toDateString()) {
                this.gameProgress.streakDays++;
            } else {
                this.gameProgress.streakDays = 1;
            }
            
            this.gameProgress.lastVisit = today;
            this.checkBadgeUnlock('week_streak');
            this.saveGameProgress();
        }

        document.getElementById('streak-days').textContent = this.gameProgress.streakDays;
    }

    // Animation methods
    showPointsAnimation(points) {
        const animation = document.getElementById('points-animation');
        const text = document.getElementById('points-text');
        
        text.textContent = `+${points} pts`;
        animation.classList.remove('hidden');
        
        setTimeout(() => {
            animation.classList.add('hidden');
        }, 1500);
    }

    showAchievementNotification(title, description) {
        const notification = document.getElementById('achievement-notification');
        const titleEl = notification.querySelector('.achievement-title');
        const descEl = document.getElementById('achievement-desc');
        
        titleEl.textContent = title;
        descEl.textContent = description;
        
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.academiSearchApp = new AcademiSearchApp();
    
    // Make functions available globally for external integration
    window.loadServerData = (data) => {
        if (window.academiSearchApp) {
            window.academiSearchApp.allArticles = window.academiSearchApp.mapServerResults(data);
            window.academiSearchApp.applyFilters();
        }
    };
    
    // Allow changing server URL
    window.setServerURL = (url) => {
        if (window.academiSearchApp) {
            window.academiSearchApp.SERVER_URL = url;
            console.log('Server URL updated to:', url);
        }
    };

    // // Ejecutar getInfo() al cargar para ver la respuesta en consola
    // if (window.academiSearchApp && typeof window.academiSearchApp.getInfo === 'function') {
    //     // Llamada no bloqueante; la propia función hace console.log del resultado
    //     window.academiSearchApp.getInfo();
    // }
});