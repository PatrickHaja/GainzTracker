class WorkoutTracker {
    constructor() {
        this.currentDay = 'maandag';
        this.exercises = this.loadData('exercises') || {};
        this.workoutHistory = this.loadData('workoutHistory') || [];
        this.progressData = this.loadData('progressData') || {};
        
        this.initializeEventListeners();
        this.displayExercisesForDay(this.currentDay);
        this.updateStatistics();
        this.initializeProgressChart();
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
        
        // If set was just completed, record workout activity
        if (exercise.completedSets[setIndex]) {
            this.recordWorkoutActivity(exercise, day);
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

    // Record progress data for charts
    recordProgressData(exercise) {
        const today = new Date().toDateString();
        
        if (!this.progressData[exercise.name]) {
            this.progressData[exercise.name] = [];
        }
        
        this.progressData[exercise.name].push({
            date: today,
            weight: exercise.weight
        });
        
        this.saveData('progressData', this.progressData);
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
            z-index: 1000;
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