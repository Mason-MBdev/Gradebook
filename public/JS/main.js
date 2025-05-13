// Global variables for storing courses and assignments
let courses = [];

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------Functions for adding new elements to the page------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Function to add a new assignment to a course
function addAssignment(courseId) {
    // Find the course by its ID
    const course = courses.find(course => course.id === courseId);
    if (!course) return;

    // Create a new assignment object
    const newAssignment = {
        name: '',
        score: '',
        weight: ''
    };

    // Add the new assignment to the course's assignments array
    course.assignments.push(newAssignment);

    // Re-render the assignments list for that course
    const assignmentsList = document.getElementById(`assignments-list-${courseId}`);
    assignmentsList.innerHTML = course.assignments.map((assignment, index) => `
        <tr>
            <td class="editable" contenteditable="true" data-type="name" data-index="${index}" oninput="updateAssignment(${courseId}, ${index}, 'name', this.innerText)">${assignment.name}</td>
            <td class="editable" contenteditable="true" data-type="score" data-index="${index}" oninput="updateAssignment(${courseId}, ${index}, 'score', this.innerText)">${assignment.score}</td>
            <td class="editable" contenteditable="true" data-type="weight" data-index="${index}" oninput="updateAssignment(${courseId}, ${index}, 'weight', this.innerText)">${assignment.weight}</td>
            <td data-type="operations"><button class="delete-assignment" onclick="this.closest('tr').remove(); courses.find(course => course.id === ${courseId}).assignments.splice(${index}, 1); updateCourseStats(${courseId});">Delete</button></td>
        </tr>
    `).join('');

    // Update the course stats
    updateCourseStats(courseId);

    // Scroll to the newly added assignment row
    const newAssignmentRow = assignmentsList.querySelector(`tr:nth-child(${course.assignments.length})`);
    newAssignmentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Function to create a new course card
function createCourseCard(courseId, courseTitle = "New Course") {
    // HTML structure for the course card
    const courseCardHTML = `
        <div class="card" data-course-id="${courseId}">
            <!-- Course Header with Title and Collapse Button -->
            <div class="course-header">
                <h2 class="title editable" contenteditable="true" data-type="title" data-id="${courseId}" oninput="updateCourseTitle(${courseId}, this.innerText)" onclick="selectText(this)">
                    ${courseTitle}
                </h2>
                <i class="collapse-arrow" id="collapse-${courseId}" onclick="toggleCollapse(${courseId})">&#9650;</i>
            </div>
            
            <!-- Course Stats Grid (Visible when expanded) -->
            <div id="grades-${courseId}">
                <div class="course-stats-grid">
                    <div class="course-stat-item">
                        <div class="course-stat-label">Grade</div>
                        <div class="course-stat-value" id="weighted-grade-${courseId}">0.00%</div>
                    </div>
                    <div class="course-stat-item">
                        <div class="course-stat-label">Assignments</div>
                        <div class="course-stat-value" id="completed-${courseId}">0 / 0</div>
                    </div>
                    <div class="course-stat-item">
                        <div class="course-stat-label">Completion</div>
                        <div class="course-stat-value" id="course-completion-${courseId}">0%</div>
                    </div>
                </div>
                
                <!-- Course Progress Bar -->
                <div class="course-progress-container">
                    <div class="course-progress-bar" id="course-progress-bar-${courseId}"></div>
                </div>
            </div>
            
            <!-- Assignments Section (Visible when expanded) -->
            <div class="assignments" id="assignments-${courseId}">
                <table class="assignments-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Grade %</th>
                            <th>Weight %</th>
                            <th>Operations</th>
                        </tr>
                    </thead>
                    <tbody id="assignments-list-${courseId}">
                        <!-- Dynamic assignment rows go here -->
                    </tbody>
                </table>
            </div>

            <!-- Course Operation Buttons -->
            <div class="course-operation-buttons" id="course-operation-buttons-${courseId}">
                <button class="add-assignment" onclick="addAssignment(${courseId})">Add Assignment</button>
                <button class="delete-course-button-show" id="delete-course-button-show-${courseId}" onclick="this.nextElementSibling.style.display = 'block'; this.style.display = 'none';">Delete Course</button>
                <button class="delete-course-button" id="delete-course-button-${courseId}" style="display:none;" onclick="this.parentElement.remove(); courses = courses.filter(course => course.id !== ${courseId}); renderallcoursesandassignments(); updateOverallStats();">Are you sure? (no going back)</button>
            </div>

            <!-- Collapsed View (Hidden by default) -->
            <div class="collapsed-view" id="collapsed-${courseId}" style="display:none;">
                <span id="collapsed-grade-${courseId}">0.00%</span> 
                <span id="collapsed-completed-${courseId}">0 / 0</span>
            </div>
        </div>
    `;

    // Convert the HTML string into a DOM element
    const template = document.createElement('div');
    template.innerHTML = courseCardHTML.trim(); // Creating a DOM element
    return template.firstChild; // Return the first child (the actual course card)
}

function graphSetup() {
    const graphContainer = document.querySelector('.graphbox');

    // canvas for graph
    const canvas = document.createElement('canvas');
    canvas.id = 'chart';
    graphContainer.appendChild(canvas);

    // Set canvas dimensions based on device
    const setCanvasDimensions = () => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // Set physical canvas dimensions for mobile - larger size
            canvas.width = canvas.offsetWidth;
            canvas.height = 300; // Fixed height for mobile
            canvas.style.height = '300px';
            canvas.style.width = '100%';
        } else {
            // Desktop dimensions with aspect ratio
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetWidth * (9/16); // 16:9 aspect ratio
        }
    };

    // Set initial dimensions
    setCanvasDimensions();

    // Buttons for different graph views
    const overallGradeButton = document.getElementById('graph-grades-button');
    const assignmentWeightButton = document.getElementById('graph-weight-button');
    const courseCompletionButton = document.getElementById('graph-completion-button');

    // Initialize Chart.js
    const ctx = canvas.getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Course names
            datasets: [{
                label: '',
                data: [],
                backgroundColor: [],
                borderColor: [],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: window.innerWidth > 768, // Don't maintain aspect ratio on mobile
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Handle resize events to adjust chart dimensions
    window.addEventListener('resize', () => {
        setCanvasDimensions();
        myChart.resize();
    });

    // Event listener for 'Show Overall Grades'
    overallGradeButton.addEventListener('click', () => {
        const courseNames = courses.map(course => course.title);
        const overallGrades = courses.map(course => {
            // Use the same weighted calculation as updateOverallStats
            let courseCompletedWeight = 0;
            let courseWeightedScore = 0;
            
            course.assignments.forEach(assignment => {
                const score = parseFloat(assignment.score) || 0;
                const weight = parseFloat(assignment.weight) || 0;
                
                if (score > 0) {
                    courseCompletedWeight += weight;
                    courseWeightedScore += score * weight;
                }
            });
            
            // Calculate course grade using the weighted method
            const courseGrade = courseCompletedWeight > 0 ? 
                (courseWeightedScore / courseCompletedWeight) : 0;
                
            return courseGrade;
        });
        updateGraph(overallGrades, courseNames, 'Overall Course Grade');
    });

    // Event listener for 'Show Assignment Weights'
    assignmentWeightButton.addEventListener('click', () => {
        const courseNames = courses.map(course => course.title);
        const decidedWeights = courses.map(course => {
            const totalWeight = course.assignments.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0);
            return totalWeight || 0;
        });
        updateGraph(decidedWeights, courseNames, 'Completed Assignment Weight');
    });

    // Event listener for 'Show Course Completion'
    courseCompletionButton.addEventListener('click', () => {
        const courseNames = courses.map(course => course.title);
        const completion = courses.map(course => {
            const completedAssignments = course.assignments.filter(a => a.score !== '').length;
            const totalAssignments = course.assignments.length;
            return totalAssignments === 0 ? 0 : (completedAssignments / totalAssignments) * 100;
        });
        updateGraph(completion, courseNames, 'Course Assignment Completion');
    });

    // Function to update the graph with new data
    function updateGraph(data, labels, labelText) {
        // Truncate long labels, especially for mobile
        const truncatedLabels = labels.map(label => {
            const maxLength = window.innerWidth < 768 ? 8 : 15; // shorter on mobile
            return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
        });
        
        myChart.data.datasets[0].data = data;
        myChart.data.labels = truncatedLabels;
        myChart.data.datasets[0].label = labelText;

        // Update bar colors based on the grade value (green for higher grades, red for lower)
        myChart.data.datasets[0].backgroundColor = data.map(value => getColorForGrade(value));
        myChart.update();
    }

    // Click on the "Grade" button to show the initial graph
    overallGradeButton.click();
}

function renderallcoursesandassignments () {
    const courseContainer = document.querySelector('.course-display');
    courseContainer.innerHTML = ''; // Clear existing courses

    // Loop through each course and render it
    courses.forEach((course) => {
        const courseCard = createCourseCard(course.id, course.title);
        courseContainer.appendChild(courseCard);

        // update assignments for each course
        const assignmentsList = document.getElementById(`assignments-list-${course.id}`);
        assignmentsList.innerHTML = course.assignments.map((assignment, index) => `
            <tr>
                <td class="editable" contenteditable="true" data-type="name" data-index="${index}" oninput="updateAssignment(${course.id}, ${index}, 'name', this.innerText)">${assignment.name}</td>
                <td class="editable" contenteditable="true" data-type="score" data-index="${index}" oninput="updateAssignment(${course.id}, ${index}, 'score', this.innerText)">${assignment.score}</td>
                <td class="editable" contenteditable="true" data-type="weight" data-index="${index}" oninput="updateAssignment(${course.id}, ${index}, 'weight', this.innerText)">${assignment.weight}</td>
                <td data-type="operations"><button class="delete-assignment" onclick="this.closest('tr').remove(); courses.find(course => course.id === ${course.id}).assignments.splice(${index}, 1); updateCourseStats(${course.id});">Delete</button></td>
            </tr>
        `).join('');

        // Update course statistics
        updateCourseStats(course.id);
    });

    // Update overall statistics
    updateOverallStats();
    console.log("All courses and assignments rendered");
}


// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------Functions for updating elements or variables-------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function updateAssignment(courseId, assignmentIndex, field, value) {
    // Find the course and assignment to update
    const course = courses.find(course => course.id === courseId);
    if (!course) return;

    const assignment = course.assignments[assignmentIndex];
    if (!assignment) return;

    // Trim the value to remove any extra spaces or newlines
    const trimmedValue = value.trim();

    // If the score is empty (even after trimming), set it to an empty string
    if (field === 'score' && trimmedValue === '') {
        assignment.score = '';
    } else {
        assignment[field] = value; // Otherwise, update the field with the input value
    }

    // Update the number of completed assignments
    const completedAssignments = course.assignments.filter(a => a.score !== '').length;
    document.getElementById(`completed-${courseId}`).innerText = `${completedAssignments} / ${course.assignments.length}`;

    // Recalculate and update weighted grade and completed assignments
    updateCourseStats(courseId);
}

function updateCourseTitle(courseId, newTitle) {
    // Find the course in the global courses array
    const course = courses.find(course => course.id === courseId);
    if (!course) return;

    // Update the course title
    course.title = newTitle;
}

function updateCourseStats(courseId) {
    const course = courses.find(course => course.id === courseId);
    if (!course) return;

    // Calculate the total number of assignments and the number of completed assignments
    const totalAssignments = course.assignments.length;
    const completedAssignments = course.assignments.filter(a => a.score !== '').length;

    // Calculate completion percentage
    const completionPercentage = totalAssignments > 0 ? 
        (completedAssignments / totalAssignments * 100).toFixed(1) : 0;

    // Calculate the weighted grade for the course, excluding assignments without scores
    const totalWeight = course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.weight)) || a.score === '' ? 0 : parseFloat(a.weight)), 0);
    const weightedGrade = course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.score)) || isNaN(parseFloat(a.weight)) || a.score === '' ? 0 : parseFloat(a.score) * parseFloat(a.weight)), 0) / (totalWeight || 1);

    // Update the total assignments and grade information
    document.getElementById(`completed-${courseId}`).innerText = `${completedAssignments} / ${totalAssignments}`;
    document.getElementById(`weighted-grade-${courseId}`).innerText = `${(weightedGrade || 0).toFixed(2)}%`;
    
    // Update completion percentage and progress bar
    document.getElementById(`course-completion-${courseId}`).innerText = `${completionPercentage}%`;
    document.getElementById(`course-progress-bar-${courseId}`).style.width = `${completionPercentage}%`;
    
    // Update collapsed view
    document.getElementById(`collapsed-grade-${courseId}`).innerText = `${(weightedGrade || 0).toFixed(2)}%`;
    document.getElementById(`collapsed-completed-${courseId}`).innerText = `${completedAssignments} / ${totalAssignments}`;
}

function updateOverallStats() {
    if (courses.length === 0) {
        document.getElementById('overall-grade').textContent = 'N/A';
        document.getElementById('overall-completed-weight').textContent = 'N/A';
        document.getElementById('overall-assignments-complete').textContent = 'N/A';
        document.getElementById('collapsed-grade').textContent = 'N/A';
        document.getElementById('collapsed-completed-weight').textContent = 'N/A';
        document.getElementById('collapsed-assignments-completed').textContent = 'N/A';
        document.getElementById('course-count').textContent = '0';
        document.getElementById('highest-grade').textContent = 'N/A';
        document.getElementById('lowest-grade').textContent = 'N/A';
        document.getElementById('overall-progress').textContent = '0%';
        document.getElementById('overall-progress-bar').style.width = '0%';
        return;
    }

    // Calculate overall stats
    let overallWeightedScore = 0;
    let totalWeight = 0;
    let completedAssignments = 0;
    let totalAssignments = 0;
    let highestGrade = -1;
    let lowestGrade = 101;
    let highestCourseName = '';
    let lowestCourseName = '';
    let completedWeight = 0;

    // First pass: calculate each course's grade
    const courseGrades = courses.map(course => {
        let courseCompletedWeight = 0;
        let courseWeightedScore = 0;
        
        course.assignments.forEach(assignment => {
            totalAssignments++;
            const score = parseFloat(assignment.score) || 0;
            const weight = parseFloat(assignment.weight) || 0;
            
            if (score > 0) {
                completedAssignments++;
                courseCompletedWeight += weight;
                courseWeightedScore += score * weight;
                completedWeight += weight;
            }
            
            totalWeight += weight;
        });

        // Calculate course grade
        const courseGrade = courseCompletedWeight > 0 ? 
            (courseWeightedScore / courseCompletedWeight) : 0;
            
        return {
            courseId: course.id,
            title: course.title,
            grade: courseGrade,
            weight: totalWeight,
            hasCompletedAssignments: courseCompletedWeight > 0
        };
    });

    // Find highest and lowest grades
    courseGrades.forEach(course => {
        if (course.hasCompletedAssignments) {
            if (course.grade > highestGrade) {
                highestGrade = course.grade;
                highestCourseName = course.title;
            }
            
            if (course.grade < lowestGrade) {
                lowestGrade = course.grade;
                lowestCourseName = course.title;
            }
            
            // Add to overall weighted score
            overallWeightedScore += course.grade;
        }
    });

    // Calculate overall grade (average of course grades)
    const overallGrade = courseGrades.filter(c => c.hasCompletedAssignments).length > 0 ?
        overallWeightedScore / courseGrades.filter(c => c.hasCompletedAssignments).length : 0;

    // Format the overall stats
    const overallGradeFormatted = overallGrade.toFixed(2) + '%';
    const overallCompletedWeightFormatted = `${completedWeight.toFixed(2)}/${totalWeight.toFixed(2)}`;
    const overallAssignmentsFormatted = `${completedAssignments} / ${totalAssignments}`;

    // Format highest and lowest grades
    const highestGradeFormatted = highestGrade >= 0 ? `${highestGrade.toFixed(2)}%` : 'N/A';
    const lowestGradeFormatted = lowestGrade <= 100 ? `${lowestGrade.toFixed(2)}%` : 'N/A';
    
    // Calculate overall progress
    const overallProgress = totalAssignments > 0 ? 
        (completedAssignments / totalAssignments * 100).toFixed(1) + '%' : '0%';
    
    // Update the DOM elements
    document.getElementById('overall-grade').textContent = overallGradeFormatted;
    document.getElementById('overall-completed-weight').textContent = overallCompletedWeightFormatted;
    document.getElementById('overall-assignments-complete').textContent = overallAssignmentsFormatted;
    document.getElementById('collapsed-grade').textContent = overallGradeFormatted;
    document.getElementById('collapsed-completed-weight').textContent = overallCompletedWeightFormatted;
    document.getElementById('collapsed-assignments-completed').textContent = overallAssignmentsFormatted;
    
    // Update new stats
    document.getElementById('course-count').textContent = courses.length;
    document.getElementById('highest-grade').textContent = highestGradeFormatted;
    document.getElementById('lowest-grade').textContent = lowestGradeFormatted;
    document.getElementById('overall-progress').textContent = overallProgress;
    document.getElementById('overall-progress-bar').style.width = overallProgress;
    
    // Update time remaining
    updateTimeRemaining();
}

function toggleCollapse(courseId) {
    const arrow = document.getElementById(`collapse-${courseId}`);
    const expandedView = document.getElementById(`grades-${courseId}`);
    const collapsedView = document.getElementById(`collapsed-${courseId}`);
    const assignmentsView = document.getElementById(`assignments-${courseId}`);
    const courseoperationbuttons = document.getElementById(`course-operation-buttons-${courseId}`);

    // Toggle visibility
    if (expandedView.style.display === "none") {
        expandedView.style.display = "block";
        assignmentsView.style.display = "block";
        courseoperationbuttons.style.display = "flex";
        arrow.innerHTML = "&#9650;"; // Upward chevron for expanded state
    } else {
        expandedView.style.display = "none";
        assignmentsView.style.display = "none";
        courseoperationbuttons.style.display = "none";
        arrow.innerHTML = "&#9660;"; // downward arrow for collapsed state
    }

    console.log('Toggled collapse for course:', courseId);
}

function toggleOverallStats() {
    const statsContent = document.querySelector('.overall-statistics-content');
    const collapsedView = document.querySelector('.collapsed-view');
    const collapseArrow = document.querySelector('.collapse-arrow');
    const graphSection = document.querySelector('.stats-section');
    
    if (statsContent.style.display === 'none') {
        statsContent.style.display = 'flex';
        collapsedView.style.display = 'none'; // Hide the collapsed view
        graphSection.style.display = 'block'; // Show the graph section
        collapseArrow.innerHTML = "&#9650;"; // Upward arrow for expanded state
    } else {
        statsContent.style.display = 'none';
        collapsedView.style.display = 'flex'; // Show the collapsed view
        graphSection.style.display = 'none'; // Hide the graph section
        collapseArrow.innerHTML = "&#9660;"; // Downward arrow for collapsed state
    }
}


// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------Event listeners for user actions----------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Event listener to handle the "Add Course +" button click
document.getElementById('add-course-btn').addEventListener('click', () => {
    const courseContainer = document.querySelector('.course-display');

    // Get a unique ID for the new course (for simplicity, we're using Date.now())
    const newCourseId = Date.now();

    // Add a new course to the global courses array
    const course = {
        id: newCourseId,
        title: "",
        assignments: []
    };

    courses.push(course);
    
    const newCourseCard = createCourseCard(newCourseId);

    // Insert the new course card inot the .course-display container
    courseContainer.appendChild(newCourseCard);

    // Scroll to the newly added course card
    newCourseCard.scrollIntoView({ behavior: 'smooth' });
});

// Event listeners for Save and Load buttons
// document.getElementById('save-navbtn').addEventListener('click', saveToLocalStorage);
// document.getElementById('load-navbtn').addEventListener('click', function() {
//     // Create an input element of type file
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = '.json'; // Accept only JSON files

//     // Trigger the file input dialog
//     input.click();

//     // Add an event listener to handle the file selection
//     input.addEventListener('change', function(event) {
//         const file = event.target.files[0];
//         if (file) {
//             loadFromFile(file);
//         }
//     });
// });

document.getElementById('login-navbtn').addEventListener('click', function() {
    console.log("Login button clicked");
    const loginPopup = document.querySelector('.login-popup');
    loginPopup.style.display = 'block';
});

document.getElementById('signup-navbtn').addEventListener('click', function() {
    console.log("Login button clicked");
    const signupPopup = document.querySelector('.signup-popup');
    signupPopup.style.display = 'block';
});

document.getElementById('settings-navbtn').addEventListener('click', function() {
    console.log("Settings button clicked");
    const settingsPopup = document.querySelector('.settings-popup');
    settingsPopup.style.display = 'block';
    
    // Update the user email display
    updateUserEmailDisplay();
});

// Close popup event listeners
document.getElementById('close-login-popup').addEventListener('click', function() {
    const loginPopup = document.querySelector('.login-popup');
    loginPopup.style.display = 'none';
});

document.getElementById('close-signup-popup').addEventListener('click', function() {
    const signupPopup = document.querySelector('.signup-popup');
    signupPopup.style.display = 'none';
});

document.getElementById('close-settings-popup').addEventListener('click', function() {
    const settingsPopup = document.querySelector('.settings-popup');
    settingsPopup.style.display = 'none';
});

// Function to update the user email display in settings
function updateUserEmailDisplay() {
    const userEmailElement = document.getElementById('user-email');
    
    // Check if user is logged in (this would be integrated with your auth system)
    // This is a placeholder - you'll need to integrate with your actual auth system
    const user = getCurrentUser(); // Implement this function based on your auth system
    
    if (user && user.email) {
        userEmailElement.textContent = user.email;
    } else {
        userEmailElement.textContent = 'Guest';
    }
}

// Placeholder for getting current user
// Replace with your actual authentication implementation
function getCurrentUser() {
    // This is just a placeholder. In a real implementation, you would:
    // 1. Check if the user is logged in through your authentication system
    // 2. Return the user object with email, etc.
    
    // For testing, uncomment this to simulate a logged-in user
    // return { email: 'example@email.com' };
    
    // Return null if no user is logged in
    return null;
}

// Data management event listeners
document.getElementById('export-data').addEventListener('click', function() {
    saveToLocalStorage();
});

document.getElementById('import-data').addEventListener('click', function() {
    // Create an input element of type file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json'; // Accept only JSON files

    // Trigger the file input dialog
    input.click();

    // Add an event listener to handle the file selection
    input.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            // Confirm before loading
            if (courses.length > 0 && !confirm('Loading this file will replace your current data. Continue?')) {
                return;
            }
            loadFromFile(file);
        }
    });
});

document.getElementById('clear-data').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        courses = [];
        renderallcoursesandassignments();
        updateOverallStats();
        alert('All data has been cleared.');
    }
});

// Font size setting
document.getElementById('font-size').addEventListener('change', function() {
    const fontSize = this.value;
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add('font-' + fontSize);
    localStorage.setItem('gradebook-font-size', fontSize);
});

// End date setting
document.getElementById('end-date').addEventListener('change', function() {
    localStorage.setItem('gradebook-end-date', this.value);
    updateTimeRemaining();
});

// Load end date if it exists
const savedEndDate = localStorage.getItem('gradebook-end-date');
if (savedEndDate) {
    document.getElementById('end-date').value = savedEndDate;
    updateTimeRemaining();
}

// Load font size preference
const savedFontSize = localStorage.getItem('gradebook-font-size');
if (savedFontSize) {
    document.getElementById('font-size').value = savedFontSize;
    document.body.classList.add('font-' + savedFontSize);
} else {
    document.body.classList.add('font-medium'); // Default
}

document.addEventListener('keydown', function(event) {
    // Check if the pressed key is 'Enter' and the target is an editable element
    if (event.key === 'Enter') {
        const target = event.target;

        // Check if the element is contenteditable or an input/textarea field
        if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
            // Prevent the default Enter key behavior (which would be creating a new line)
            event.preventDefault();

            // If the target is contenteditable, we can blur it (focus out)
            if (target.isContentEditable) {
                target.blur(); // This will exit the contenteditable box
            }
            // For textareas or input fields, just blur as well (to exit the field)
            else {
                target.blur();
            }
        }
    }
});

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------Helper functions----------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Function to get color based on grade percentage
function getColorForGrade(grade) {
    if (grade >= 90) return 'rgb(0, 128, 255)'; // A+ (Light Blue)
    if (grade >= 85) return 'rgb(0, 191, 255)'; // A (Light Blue)
    if (grade >= 80) return 'rgb(64, 224, 208)'; // A- (Turquoise)
    if (grade >= 77) return 'rgb(0, 255, 0)'; // B+ (Green)
    if (grade >= 73) return 'rgb(50, 205, 50)'; // B (Lime Green)
    if (grade >= 70) return 'rgb(22, 172, 22)'; // B- (Forest Green)
    if (grade >= 67) return 'rgb(162, 255, 0)'; // C+ (Orange)
    if (grade >= 63) return 'rgb(255, 213, 0)'; // C (Dark Orange)
    if (grade >= 60) return 'rgb(255, 128, 0)'; // C- (Red-Orange)
    if (grade >= 57) return 'rgb(255, 69, 0)'; // D+ (Red-Orange)
    if (grade >= 53) return 'rgb(255, 69, 0)'; // D (Red-Orange)
    if (grade >= 50) return 'rgb(255, 69, 0)'; // D- (Red-Orange)
    return 'rgb(255, 0, 0)'; // F (Red)
}

// Function to select all text in an element
function selectText(element) {
    // Create a range to select the text
    const range = document.createRange();
    range.selectNodeContents(element);

    // Clear any previous selection
    const selection = window.getSelection();
    selection.removeAllRanges();

    // Add the range to the selection
    selection.addRange(range);
}

function saveToLocalStorage() {
    try {
        // Format current date for filename
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Convert the courses array to a JSON string
        const coursesJSON = JSON.stringify(courses);

        // Create a Blob from the JSON string
        const blob = new Blob([coursesJSON], { type: 'application/json' });

        // Create a link element
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gradebook_${dateStr}.json`;

        // Append the link to the body
        document.body.appendChild(link);

        // Programmatically click the link to trigger the download
        link.click();

        // Remove the link from the document
        document.body.removeChild(link);
        
        // Provide user feedback
        alert('Your gradebook has been saved successfully!');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('There was an error saving your data. Please try again.');
    }
}

function loadFromFile(file) {
    console.log('Loading file:', file.name);
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            if (Array.isArray(data)) {
                // Replace the courses array with the loaded data
                courses = data;
                
                // Re-render the courses
                renderallcoursesandassignments();
                
                // Provide user feedback
                alert('Your gradebook has been loaded successfully!');
            } else {
                throw new Error('Invalid data format: Expected an array of courses');
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Error loading file: ' + (error.message || 'Invalid file format'));
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        alert('Error reading file. Please try again with a different file.');
    };
    
    reader.readAsText(file);
}

// Graph setup
graphSetup();

// Initial update when the page loads or when the stats are updated
updateOverallStats();

// collapse overall stats
toggleOverallStats();

// Theme Switcher
document.addEventListener('DOMContentLoaded', function() {
    const themeSelector = document.getElementById('theme-selector');
    
    // Check if there's a saved theme
    const savedTheme = localStorage.getItem('gradebook-theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        themeSelector.value = savedTheme === '' ? 'default' : savedTheme;
        
        // Make sure font size class is preserved
        const savedFontSize = localStorage.getItem('gradebook-font-size');
        if (savedFontSize) {
            document.body.classList.add('font-' + savedFontSize);
        }
    }
    
    // Theme switching
    themeSelector.addEventListener('change', function() {
        // Store the font size class if it exists
        const fontSizeClass = Array.from(document.body.classList)
            .find(cls => cls.startsWith('font-'));
        
        // Remove all classes
        document.body.className = '';
        
        // Add selected theme class if not default
        if (this.value !== 'default') {
            document.body.classList.add(this.value);
        }
        
        // Restore font size class
        if (fontSizeClass) {
            document.body.classList.add(fontSizeClass);
        }
        
        // Save theme preference
        localStorage.setItem('gradebook-theme', this.value === 'default' ? '' : this.value);
    });
});

// Update time remaining based on end date
function updateTimeRemaining() {
    const endDateStr = localStorage.getItem('gradebook-end-date');
    if (!endDateStr) {
        document.getElementById('time-remaining').textContent = 'Set end date in settings';
        return;
    }
    
    const endDate = new Date(endDateStr);
    const today = new Date();
    
    // If end date is in the past
    if (endDate < today) {
        document.getElementById('time-remaining').textContent = 'Term ended';
        return;
    }
    
    // Calculate difference in days
    const diffTime = Math.abs(endDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    document.getElementById('time-remaining').textContent = `${diffDays} days`;
}

// Function to create charts with proper sizing for mobile
function createChart(chartType) {
    // Clear previous chart
    if (myChart) {
        myChart.destroy();
    }

    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');
    
    // Set proper dimensions based on device size
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Set physical canvas dimensions for mobile
        canvas.width = canvas.offsetWidth;
        canvas.height = 300;
    } else {
        // Maintain aspect ratio for desktop
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetWidth * (9/16); // 16:9 aspect ratio
    }
    
    // Chart data setup
    // ... existing chart code ...
    
    // Create appropriate chart type
    if (chartType === 'bar') {
        // ... existing bar chart code ...
    } else if (chartType === 'line') {
        // ... existing line chart code ...
    } else if (chartType === 'pie') {
        // ... existing pie chart code ...
    }
    
    // Add responsiveness but control dimensions
    myChart.options.responsive = true;
    myChart.options.maintainAspectRatio = !isMobile; // Don't maintain aspect ratio on mobile
    
    myChart.update();
}

// Update chart creation function with new sizing for mobile
// When switching chart types
document.querySelectorAll('.graph-button').forEach(button => {
    button.addEventListener('click', function() {
        const chartType = this.getAttribute('data-chart-type');
        createChart(chartType);
    });
});

// When window is resized, recreate chart with proper dimensions
window.addEventListener('resize', function() {
    if (myChart) {
        const currentType = myChart.config.type;
        createChart(currentType);
    }
});