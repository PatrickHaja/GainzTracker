class WorkoutTracker {
    constructor() {
        this.currentDay = 'maandag';
        this.exercises = this.loadData('exercises') || {};
        this.workoutHistory = this.loadData('workoutHistory') || [];
        this.progressData = this.loadData('progressData') || {};
        this.workoutSessions = this.loadData('workoutSessions') || [];
        this.exerciseRecords = this.loadData('exerciseRecords') || {};
        
        this.initializeEventListeners();
        this.displayExercisesForDay(this.currentDay);
        this.updateStatistics();
        this.initializeProgressChart();
        this.initializeModals();
    }

    // Data persistence methods
    saveData(key, data) {
        localStorage.setItem(`workoutTracker_${key}`, JSON.stringify(data));
    }

    loadData(key) {
        const data = localStorage.getItem(`workoutTracker_${key}`);
        return data ? JSON.parse(data) : null;
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Day selector buttons
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchDay(e.target.dataset.day);
            });
        });

        // Add exercise form
        document.getElementById('addExerciseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExercise();
        });

        // Progress and history buttons
        document.getElementById('showProgressBtn').addEventListener('click', () => {
            this.showProgressModal();
        });

        document.getElementById('showHistoryBtn').addEventListener('click', () => {
            this.showHistoryModal();
        });
    }

    // Initialize modal functionality
    initializeModals() {
        // Close modal functionality
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.style.display = 'none';
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // History period filter
        document.getElementById('historyPeriod').addEventListener('change', (e) => {
            this.updateHistoryDisplay(e.target.value);
        });

        // Prevent modal content click from closing modal
        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    // Switch between days
    switchDay(day) {
        // Update active button
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-day="${day}"]`).classList.add('active');
        
        this.currentDay = day;
        this.displayExercisesForDay(day);
        
        // Update form default day
        document.getElementById('exerciseDay').value = day;
    }

    // Add new exercise
    addExercise() {
        const name = document.getElementById('exerciseName').value.trim();
        const weight = parseFloat(document.getElementById('exerciseWeight').value);
        const sets = parseInt(document.getElementById('exerciseSets').value);
        const reps = parseInt(document.getElementById('exerciseReps').value);
        const day = document.getElementById('exerciseDay').value;

        if (!name || weight < 0 || sets < 1 || reps < 1) {
            alert('Vul alle velden correct in!');
            return;
        }

        // Initialize day if it doesn't exist
        if (!this.exercises[day]) {
            this.exercises[day] = [];
        }

        // Create new exercise
        const exercise = {
            id: Date.now().toString(),
            name,
            weight,
            sets,
            reps,
            completedSets: new Array(sets).fill(false),
            dateAdded: new Date().toISOString()
        };

        this.exercises[day].push(exercise);
        this.saveData('exercises', this.exercises);
        
        // Clear form
        document.getElementById('addExerciseForm').reset();
        document.getElementById('exerciseDay').value = this.currentDay;
        
        // Refresh display
        this.displayExercisesForDay(this.currentDay);
        this.updateStatistics();
        
        // Show success feedback
        this.showNotification('Oefening toegevoegd!', 'success');
    }

    // Display exercises for a specific day
    displayExercisesForDay(day) {
        const container = document.getElementById('currentDayExercises');
        const exercises = this.exercises[day] || [];

        if (exercises.length === 0) {
            container.innerHTML = '<p class="no-exercises">Geen oefeningen voor deze dag. Voeg er hieronder een toe!</p>';
            return;
        }

        container.innerHTML = exercises.map(exercise => this.createExerciseCard(exercise, day)).join('');
        
        // Add event listeners to the newly created elements
        this.addExerciseEventListeners(day);
    }

    // Create HTML for exercise card
    createExerciseCard(exercise, day) {
        const completedCount = exercise.completedSets.filter(set => set).length;
        const allCompleted = completedCount === exercise.sets;
        
        return `
            <div class="exercise-card fade-in">
                <div class="exercise-header">
                    <div>
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-weight">${exercise.weight}kg</div>
                    </div>
                    <div class="exercise-progress">
                        ${completedCount}/${exercise.sets} sets voltooid
                    </div>
                </div>
                
                <div class="sets-container">
                    ${exercise.completedSets.map((completed, index) => `
                        <button class="set-button ${completed ? 'completed' : ''}" 
                                data-exercise-id="${exercise.id}" 
                                data-set-index="${index}">
                            Set ${index + 1}<br>${exercise.reps} reps
                        </button>
                    `).join('')}
                </div>
                
                <div class="exercise-actions">
                    <button class="btn-increase-weight" 
                            data-exercise-id="${exercise.id}" 
                            ${!allCompleted ? 'disabled' : ''}>
                        ${allCompleted ? 'Gewicht +2.5kg' : 'Voltooi alle sets eerst'}
                    </button>
                    <button class="btn-delete" data-exercise-id="${exercise.id}">
                        Verwijderen
                    </button>
                </div>
            </div>
        `;
    }

    // Add event listeners to exercise elements
    addExerciseEventListeners(day) {
        // Set completion buttons
        document.querySelectorAll('.set-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.dataset.exerciseId;
                const setIndex = parseInt(e.target.dataset.setIndex);
                this.toggleSet(exerciseId, setIndex, day);
            });
        });

        // Weight increase buttons
        document.querySelectorAll('.btn-increase-weight').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.dataset.exerciseId;
                this.increaseWeight(exerciseId, day);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.dataset.exerciseId;
                this.deleteExercise(exerciseId, day);
            });
        });
    }

    // Toggle set completion
    toggleSet(exerciseId, setIndex, day) {
        const exercise = this.exercises[day].find(ex => ex.id === exerciseId);
        if (!exercise) return;

        exercise.completedSets[setIndex] = !exercise.completedSets[setIndex];
        
        // If set was just completed, record detailed workout data
        if (exercise.completedSets[setIndex]) {
            this.recordWorkoutActivity(exercise, day);
            this.recordExercisePerformance(exercise, setIndex, day);
        }
        
        this.saveData('exercises', this.exercises);
        this.displayExercisesForDay(day);
        this.updateStatistics();
    }

    // Increase weight by 2.5kg
    increaseWeight(exerciseId, day) {
        const exercise = this.exercises[day].find(ex => ex.id === exerciseId);
        if (!exercise) return;

        const allCompleted = exercise.completedSets.every(set => set);
        if (!allCompleted) {
            alert('Voltooi eerst alle sets voordat je het gewicht verhoogt!');
            return;
        }

        // Record progress data for chart
        this.recordProgressData(exercise);
        
        // Increase weight and reset sets
        exercise.weight += 2.5;
        exercise.completedSets = new Array(exercise.sets).fill(false);
        
        this.saveData('exercises', this.exercises);
        this.displayExercisesForDay(day);
        this.updateProgressChart();
        
        this.showNotification(`Gewicht verhoogd naar ${exercise.weight}kg!`, 'success');
    }

    // Delete exercise
    deleteExercise(exerciseId, day) {
        if (!confirm('Weet je zeker dat je deze oefening wilt verwijderen?')) return;

        this.exercises[day] = this.exercises[day].filter(ex => ex.id !== exerciseId);
        this.saveData('exercises', this.exercises);
        this.displayExercisesForDay(day);
        this.updateStatistics();
        
        this.showNotification('Oefening verwijderd!', 'warning');
    }

    // Record workout activity
    recordWorkoutActivity(exercise, day) {
        const today = new Date().toDateString();
        const existingWorkout = this.workoutHistory.find(w => w.date === today);
        
        if (existingWorkout) {
            if (!existingWorkout.exercises.some(e => e.id === exercise.id)) {
                existingWorkout.exercises.push({
                    id: exercise.id,
                    name: exercise.name,
                    weight: exercise.weight
                });
            }
        } else {
            this.workoutHistory.push({
                date: today,
                day: day,
                exercises: [{
                    id: exercise.id,
                    name: exercise.name,
                    weight: exercise.weight
                }]
            });
        }
        
        this.saveData('workoutHistory', this.workoutHistory);
    }

    // Record exercise performance for detailed tracking
    recordExercisePerformance(exercise, setIndex, day) {
        const now = new Date();
        const sessionId = `${now.toDateString()}_${day}`;
        
        // Find or create workout session
        let session = this.workoutSessions.find(s => s.id === sessionId);
        if (!session) {
            session = {
                id: sessionId,
                date: now.toISOString(),
                day: day,
                exercises: {},
                duration: 0,
                totalSets: 0,
                totalReps: 0
            };
            this.workoutSessions.push(session);
        }

        // Record exercise performance
        if (!session.exercises[exercise.id]) {
            session.exercises[exercise.id] = {
                name: exercise.name,
                weight: exercise.weight,
                targetSets: exercise.sets,
                targetReps: exercise.reps,
                completedSets: [],
                startTime: now.toISOString()
            };
        }

        // Record the completed set
        session.exercises[exercise.id].completedSets.push({
            setNumber: setIndex + 1,
            reps: exercise.reps,
            weight: exercise.weight,
            completedAt: now.toISOString()
        });

        // Update session totals
        session.totalSets++;
        session.totalReps += exercise.reps;

        this.saveData('workoutSessions', this.workoutSessions);
    }

    // Record progress data for charts
    recordProgressData(exercise) {
        const today = new Date().toDateString();
        
        if (!this.progressData[exercise.name]) {
            this.progressData[exercise.name] = [];
        }
        
        this.progressData[exercise.name].push({
            date: today,
            weight: exercise.weight,
            timestamp: new Date().toISOString()
        });
        
        // Keep exercise records for comparison
        if (!this.exerciseRecords[exercise.name]) {
            this.exerciseRecords[exercise.name] = {
                personalBest: exercise.weight,
                firstWeight: exercise.weight,
                totalWeightIncreases: 0,
                history: []
            };
        }

        const record = this.exerciseRecords[exercise.name];
        record.history.push({
            date: today,
            weight: exercise.weight,
            sets: exercise.sets,
            reps: exercise.reps
        });

        if (exercise.weight > record.personalBest) {
            record.personalBest = exercise.weight;
        }
        record.totalWeightIncreases++;

        this.saveData('progressData', this.progressData);
        this.saveData('exerciseRecords', this.exerciseRecords);
    }

    // Update statistics display
    updateStatistics() {
        const totalWorkouts = this.workoutHistory.length;
        const totalExercises = Object.values(this.exercises).flat().length;
        
        let completedSets = 0;
        let totalSets = 0;
        
        Object.values(this.exercises).flat().forEach(exercise => {
            completedSets += exercise.completedSets.filter(set => set).length;
            totalSets += exercise.sets;
        });
        
        const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
        
        document.getElementById('totalWorkouts').textContent = totalWorkouts;
        document.getElementById('totalExercises').textContent = totalExercises;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    }

    // Initialize progress chart
    initializeProgressChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Gewichtsprogressie per Oefening',
                        color: '#8b6508',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Datum',
                            color: '#8b6508'
                        },
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: '#2a3b5c'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Gewicht (kg)',
                            color: '#8b6508'
                        },
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: '#2a3b5c'
                        }
                    }
                }
            }
        });
        
        this.updateProgressChart();
    }

    // Update progress chart with current data
    updateProgressChart() {
        const colors = ['#8b6508', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];
        const datasets = [];
        
        Object.entries(this.progressData).forEach(([exerciseName, data], index) => {
            if (data.length > 0) {
                datasets.push({
                    label: exerciseName,
                    data: data.map(point => ({
                        x: new Date(point.date),
                        y: point.weight
                    })),
                    borderColor: colors[index % colors.length],
                    backgroundColor: colors[index % colors.length] + '20',
                    fill: false,
                    tension: 0.1
                });
            }
        });
        
        this.chart.data.datasets = datasets;
        this.chart.update();
    }

    // Show progress modal
    showProgressModal() {
        document.getElementById('progressModal').style.display = 'block';
        this.updateProgressChart();
        this.updateProgressSummary();
    }

    // Show history modal
    showHistoryModal() {
        document.getElementById('historyModal').style.display = 'block';
        this.updateHistoryDisplay('week');
    }

    // Update progress summary
    updateProgressSummary() {
        const summaryContainer = document.getElementById('progressSummary');
        const records = this.exerciseRecords;
        
        if (Object.keys(records).length === 0) {
            summaryContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nog geen voortgangsdata beschikbaar. Begin met trainen!</p>';
            return;
        }

        const totalExercises = Object.keys(records).length;
        const totalWeightIncreases = Object.values(records).reduce((sum, record) => sum + record.totalWeightIncreases, 0);
        const bestProgress = Object.entries(records).reduce((best, [name, record]) => {
            const improvement = record.personalBest - record.firstWeight;
            return improvement > best.improvement ? { name, improvement, weight: record.personalBest } : best;
        }, { improvement: 0, name: '', weight: 0 });

        summaryContainer.innerHTML = `
            <h3>Voortgang Samenvatting</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="summary-stat-number">${totalExercises}</span>
                    <span class="summary-stat-label">Oefeningen Gevolgd</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-stat-number">${totalWeightIncreases}</span>
                    <span class="summary-stat-label">Gewichtsverhogingen</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-stat-number">${bestProgress.improvement.toFixed(1)}kg</span>
                    <span class="summary-stat-label">Beste Verbetering</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-stat-number">${bestProgress.weight}kg</span>
                    <span class="summary-stat-label">Hoogste Gewicht</span>
                </div>
            </div>
            ${bestProgress.name ? `<p style="text-align: center; margin-top: 15px; color: var(--text-secondary);">
                Beste voortgang: <strong style="color: var(--primary-gold);">${bestProgress.name}</strong>
            </p>` : ''}
        `;
    }

    // Update history display based on selected period
    updateHistoryDisplay(period) {
        const historyContainer = document.getElementById('historyContent');
        const sessions = this.getFilteredSessions(period);

        if (sessions.length === 0) {
            historyContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Geen workout geschiedenis voor deze periode.</p>';
            return;
        }

        historyContainer.innerHTML = sessions.map(session => this.createWorkoutEntryHTML(session)).join('');
    }

    // Get filtered workout sessions based on period
    getFilteredSessions(period) {
        const now = new Date();
        let cutoffDate;

        switch (period) {
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3months':
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = new Date(0);
        }

        return this.workoutSessions
            .filter(session => new Date(session.date) >= cutoffDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Create HTML for workout entry
    createWorkoutEntryHTML(session) {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const exerciseEntries = Object.values(session.exercises);
        
        return `
            <div class="workout-entry">
                <div class="workout-date">${dateStr}</div>
                <div style="color: var(--text-secondary); margin-bottom: 15px;">
                    ${session.totalSets} sets • ${session.totalReps} reps • ${exerciseEntries.length} oefeningen
                </div>
                <div class="workout-summary">
                    ${exerciseEntries.map(exercise => `
                        <div class="exercise-summary">
                            <div class="exercise-summary-name">${exercise.name}</div>
                            <div class="exercise-summary-details">
                                ${exercise.weight}kg • ${exercise.completedSets.length}/${exercise.targetSets} sets • ${exercise.targetReps} reps
                            </div>
                            <div class="exercise-summary-details">
                                Voltooid: ${exercise.completedSets.length === exercise.targetSets ? '✅' : '⏳'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#8b6508'};
            color: white;
            border-radius: 8px;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the workout tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WorkoutTracker();
});