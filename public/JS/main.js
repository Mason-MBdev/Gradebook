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
            <!-- Course Title -->
            <h2 class="title editable" contenteditable="true" data-type="title" data-id="${courseId}" oninput="updateCourseTitle(${courseId}, this.innerText)" onclick="selectText(this)">
                ${courseTitle}
            </h2>

            <!-- Collapsible Arrow -->
            <i class="collapse-arrow" id="collapse-${courseId}" onclick="toggleCollapse(${courseId})">&#9650;</i>
            
            <!-- Grades Section (Visible when expanded) -->
            <div class="grades" id="grades-${courseId}">
                <p><strong>Weighted Grade:</strong> <span id="weighted-grade-${courseId}">0.00%</span></p>
            </div>
            
            <!-- Assignments Section (Visible when expanded) -->
            <div class="assignments" id="assignments-${courseId}">
                <p><strong>Assignments Completed:</strong> <span id="completed-${courseId}">0 / 0</span></p>
                <table class="assignments-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Grade (%)</th>
                            <th>Weight</th>
                            <th>Operations</th>
                        </tr>
                    </thead>
                    <tbody id="assignments-list-${courseId}">
                        <!-- Dynamic assignment rows go here -->
                    </tbody>
                </table>
            </div>

            <div class="course-operation-buttons" id="course-operation-buttons-${courseId}" style="display: flex; flex-direction: row;>
                <!-- Add Assignment Section -->
                <div  id="add-assignment-${courseId}">
                    <button class="add-assignment" onclick="addAssignment(${courseId})">Add Assignment</button>

                    <!-- Button that makes the delete course button appear -->
                    <button class="delete-course-button-show" id="delete-course-button-show-${courseId}" onclick="this.nextElementSibling.style.display = 'block'; this.style.display = 'none';">Delete Course</button>
                    <!-- Delete Course Button -->
                    <button class="delete-course-button" id="delete-course-button-${courseId}" style="display:none;" onclick="this.parentElement.remove(); courses = courses.filter(course => course.id !== ${courseId}); renderallcoursesandassignments(); updateOverallStats();">Are you sure? (no going back)</button>
                </div>
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
    graphContainer.appendChild(canvas);

    // Buttons for different graph views
    const overallGradeButton = document.getElementById('graph-grades-button');
    const assignmentWeightButton = document.getElementById('graph-weight-button');
    const courseCompletionButton = document.getElementById('graph-completion-button');

    // Initialize Chart.js
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
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

    // Event listener for 'Show Overall Grades'
    overallGradeButton.addEventListener('click', () => {
        const courseNames = courses.map(course => course.title);
        const overallGrades = courses.map(course => {
            const completedAssignments = course.assignments.filter(a => a.score !== '').length;
            const totalWeight = course.assignments.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0);
            const weightedGrade = course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.score)) ? 0 : parseFloat(a.score)), 0) / (completedAssignments || 1);
            return weightedGrade || 0;
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
        chart.data.datasets[0].data = data;
        chart.data.labels = labels;
        chart.data.datasets[0].label = labelText;

        // Update bar colors based on the grade value (green for higher grades, red for lower)
        chart.data.datasets[0].backgroundColor = data.map(value => getColorForGrade(value));
        chart.update();
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

    // Calculate the weighted grade for the course, excluding assignments without scores
    const totalWeight = course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.weight)) || a.score === '' ? 0 : parseFloat(a.weight)), 0);
    const weightedGrade = course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.score)) || isNaN(parseFloat(a.weight)) || a.score === '' ? 0 : parseFloat(a.score) * parseFloat(a.weight)), 0) / (totalWeight || 1);

    // Update the total assignments and grade information
    document.getElementById(`completed-${courseId}`).innerText = `${completedAssignments} / ${totalAssignments}`;
    document.getElementById(`weighted-grade-${courseId}`).innerText = `${(weightedGrade || 0).toFixed(2)}%`;
}

function updateOverallStats() {
    // overall grade = sum of (weighted grade) / number of courses
    const overallGrade = courses.reduce((sum, course) => {
        const totalWeight = course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.weight)) || a.score === '' ? 0 : parseFloat(a.weight)), 0);
        const weightedGrade = course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.score)) || isNaN(parseFloat(a.weight)) || a.score === '' ? 0 : parseFloat(a.score) * parseFloat(a.weight)), 0) / (totalWeight || 1);
        return sum + (weightedGrade || 0);
    }, 0) / courses.length;
    
    // completed weight, sum the weight of all completed assignments / sum of total weight
    const completedWeight = courses.reduce((sum, course) => sum + course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.weight)) || a.score === '' ? 0 : parseFloat(a.weight)), 0), 0);
    const totalWeight = courses.reduce((sum, course) => sum + course.assignments.reduce((sum, a) => sum + (isNaN(parseFloat(a.weight)) ? 0 : parseFloat(a.weight)), 0), 0);
    const completedWeightPercentage = (completedWeight / totalWeight) * 100;
    
    // completed assignments = sum of completed assignments / sum of total assignments
    const completedAssignments = courses.reduce((sum, course) => sum + course.assignments.filter(a => a.score !== '').length, 0);
    const totalAssignments = courses.reduce((sum, course) => sum + course.assignments.length, 0);

    // update elemetns in the expanded view
    document.getElementById('overall-grade').innerText = isNaN(overallGrade) ? '0.00%' : `${overallGrade.toFixed(2)}%`;
    document.getElementById('overall-completed-weight').innerText = isNaN(completedWeightPercentage) ? '0.00%' : `${completedWeightPercentage.toFixed(2)}%`;
    document.getElementById('overall-assignments-complete').innerText = `${completedAssignments} / ${totalAssignments}`;
    
    //update elements in the collapsed view
    document.getElementById('collapsed-grade').innerText = isNaN(overallGrade) ? '0.00%' : `${overallGrade.toFixed(2)}%`;
    document.getElementById('collapsed-completed-weight').innerText = isNaN(completedWeightPercentage) ? '0.00%' : `${completedWeightPercentage.toFixed(2)}%`;
    document.getElementById('collapsed-assignments-completed').innerText = `${completedAssignments} / ${totalAssignments}`;
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
    const graphBox = document.querySelector('.graphbox');
    const collapseArrow = document.querySelector('.collapse-arrow');
    const graphButtonBox = document.getElementById('graph-button-box');
    const graphTitle = document.getElementById('graph-title');

    console.log(graphButtonBox);
    console.log(graphTitle);
    
    if (statsContent.style.display === 'none') {
        statsContent.style.display = 'block';
        collapsedView.style.display = 'none'; // Hide the collapsed view
        graphBox.style.display = 'block'; // Show the graph
        graphButtonBox.style.display = 'flex'; // Show the graph buttons
        graphTitle.style.display = 'block'; // Show the graph title
        collapseArrow.innerHTML = "&#9650;"; // Downward arrow for expanded state
    } else {
        statsContent.style.display = 'none';
        collapsedView.style.display = 'block'; // Show the collapsed view
        graphBox.style.display = 'none'; // Hide the graph
        graphTitle.style.display = 'none'; // Hide the graph title
        graphButtonBox.style.display = 'none'; // Hide the graph buttons
        collapseArrow.innerHTML = "&#9660;"; // Upward arrow for collapsed state
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

document.getElementById('close-login-popup').addEventListener('click', function() {
    const loginPopup = document.querySelector('.login-popup');
    loginPopup.style.display = 'none';
});

document.getElementById('close-signup-popup').addEventListener('click', function() {
    const signupPopup = document.querySelector('.signup-popup');
    signupPopup.style.display = 'none';
});

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
    // Convert the courses array to a JSON string
    const coursesJSON = JSON.stringify(courses);

    // Create a Blob from the JSON string
    const blob = new Blob([coursesJSON], { type: 'application/json' });

    // Create a link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'courses.json';

    // Append the link to the body
    document.body.appendChild(link);

    // Programmatically click the link to trigger the download
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);
}

function loadFromFile(file) {
    console.log('Loading file:', file.name);
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data)) {
                courses = data;
                // Re-render the courses
                const courseContainer = document.querySelector('.course-display');
                courseContainer.innerHTML = ''; // Clear existing courses
                courses.forEach(course => {
                    const courseCard = createCourseCard(course.id, course.title);
                    courseContainer.appendChild(courseCard);
                    // Re-render assignments for each course
                    const assignmentsList = document.getElementById(`assignments-list-${course.id}`);
                    assignmentsList.innerHTML = course.assignments.map((assignment, index) => `
                        <tr>
                            <td class="editable" contenteditable="true" data-type="name" data-index="${index}" oninput="updateAssignment(${course.id}, ${index}, 'name', this.innerText)">${assignment.name}</td>
                            <td class="editable" contenteditable="true" data-type="score" data-index="${index}" oninput="updateAssignment(${course.id}, ${index}, 'score', this.innerText)">${assignment.score}</td>
                            <td class="editable" contenteditable="true" data-type="weight" data-index="${index}" oninput="updateAssignment(${course.id}, ${index}, 'weight', this.innerText)">${assignment.weight}</td>
                            <td data-type="operations"><button class="delete-assignment" onclick="this.closest('tr').remove(); courses.find(course => course.id === ${courseId}).assignments.splice(${index}, 1); updateCourseStats(${courseId});">Delete</button></td>
                        </tr>
                    `).join('');
                    updateCourseStats(course.id);
                });
                updateOverallStats();
            } else {
                console.error('Invalid data format');
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };
    reader.readAsText(file);
}

// Graph setup
graphSetup();

// Initial update when the page loads or when the stats are updated
updateOverallStats();

// collapse overall stats
toggleOverallStats();