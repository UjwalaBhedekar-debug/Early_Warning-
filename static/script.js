"use strict";

/* ==========================================
   STUDENTCARE - EARLY WARNING SYSTEM
   PART 1 OF 3
   Storage, validation, risk analysis
   ========================================== */

const STORAGE_KEY = "studentcare_students_v1";

const SUBJECTS = [
    { key: "english", name: "English" },
    { key: "maths", name: "Maths" },
    { key: "hindi", name: "Hindi" },
    { key: "marathi", name: "Marathi" },
    { key: "science", name: "Science" },
    { key: "history", name: "History" },
    { key: "geography", name: "Geography" }
];

let students = [];
let performanceChart = null;
let subjectChart = null;
let riskChart = null;

/* BASIC HELPERS */

function byId(id) {
    return document.getElementById(id);
}

function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[character];
    });
}

function numberValue(id) {
    return Number(byId(id).value);
}

function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function showMessage(message, type) {
    const element = byId("formMessage");
    element.textContent = message;
    element.className = "message " + type;
}

function clearMessage() {
    const element = byId("formMessage");
    element.textContent = "";
    element.className = "message";
}

/* LOCAL STORAGE */

function loadStudents() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];
        students = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to load student records:", error);
        students = [];
        alert("Saved student records could not be read. Check browser storage.");
    }
}

function saveStudents() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        return true;
    } catch (error) {
        console.error("Unable to save student records:", error);
        alert("Records could not be saved. Check browser storage settings.");
        return false;
    }
}

/* RISK ANALYSIS */

function analyseRisk(student) {
    let score = 0;

    if (student.attendance < 75) {
        score += 2;
    } else if (student.attendance < 90) {
        score += 1;
    }

    if (student.internalMarks < 50) {
        score += 2;
    } else if (student.internalMarks < 75) {
        score += 1;
    }

    if (student.assignmentStatus === "Not Submitted") {
        score += 2;
    } else if (student.assignmentStatus === "Late") {
        score += 1;
    }

    let level = "Low Risk";

    if (score >= 4) {
        level = "High Risk";
    } else if (score >= 2) {
        level = "Medium Risk";
    }

    return { score, level };
}

function subjectLevel(mark) {
    if (mark < 50) return "Weak";
    if (mark < 70) return "Needs Improvement";
    return "Good";
}

function subjectResults(student) {
    return SUBJECTS.map(subject => ({
        name: subject.name,
        mark: Number(student[subject.key]),
        level: subjectLevel(Number(student[subject.key]))
    }));
}

function supportSuggestions(student) {
    const suggestions = [];
    const risk = analyseRisk(student);

    if (student.attendance < 75) {
        suggestions.push(
            "Contact the family and prepare an attendance improvement plan."
        );
    } else if (student.attendance < 90) {
        suggestions.push(
            "Monitor attendance and encourage regular school participation."
        );
    }

    if (student.internalMarks < 50) {
        suggestions.push(
            "Arrange subject revision and individual teacher support."
        );
    } else if (student.internalMarks < 75) {
        suggestions.push(
            "Provide practice questions and monitor assessment progress."
        );
    }

    if (student.assignmentStatus === "Not Submitted") {
        suggestions.push(
            "Discuss missing assignments and set a clear submission deadline."
        );
    } else if (student.assignmentStatus === "Late") {
        suggestions.push(
            "Help the student plan assignment deadlines. Status: Low Submission."
        );
    }

    const weakSubjects = subjectResults(student)
        .filter(subject => subject.level === "Weak")
        .map(subject => subject.name);

    if (weakSubjects.length) {
        suggestions.push(
            "Provide additional practice in: " + weakSubjects.join(", ") + "."
        );
    }

    if (risk.level === "Low Risk" && suggestions.length === 0) {
        suggestions.push(
            "Continue regular monitoring and encourage consistent academic progress."
        );
    }

    return suggestions;
}

/* READ AND VALIDATE FORM */

function readStudentForm() {
    const student = {
        studentId: byId("studentId").value.trim(),
        studentName: byId("studentName").value.trim(),
        className: byId("className").value,
        age: numberValue("age"),
        attendance: numberValue("attendance"),
        internalMarks: numberValue("internalMarks"),
        previousMarks: numberValue("previousMarks"),
        assignmentStatus: byId("assignmentStatus").value
    };

    SUBJECTS.forEach(subject => {
        student[subject.key] = numberValue(subject.key);
    });

    return student;
}

function validateStudent(student) {
    if (!student.studentId || !student.studentName || !student.className) {
        return "Please enter the student ID, name and class.";
    }

    if (!Number.isFinite(student.age) ||
        student.age < 5 || student.age > 25) {
        return "Age must be between 5 and 25.";
    }

    const percentages = [
        ["Attendance", student.attendance],
        ["Internal marks", student.internalMarks],
        ["Previous marks", student.previousMarks],
        ...SUBJECTS.map(subject => [
            subject.name,
            student[subject.key]
        ])
    ];

    for (const [label, value] of percentages) {
        if (!Number.isFinite(value) || value < 0 || value > 100) {
            return label + " must be between 0 and 100.";
        }
    }

    if (!["On Time", "Late", "Not Submitted"].includes(
        student.assignmentStatus
    )) {
        return "Please select an assignment submission status.";
    }

    const editingId = byId("recordId").value;

    const duplicate = students.some(existing =>
        existing.studentId.toLowerCase() ===
            student.studentId.toLowerCase() &&
        existing.id !== editingId
    );

    if (duplicate) {
        return "This Student ID already exists. Please use a different ID.";
    }

    return "";
}

/* NAVIGATION */

function openPage(pageName) {
    const target = byId(pageName);

    if (!target || !target.classList.contains("page")) {
        console.error("Navigation target not found:", pageName);
        return;
    }

    document.querySelectorAll("main .page").forEach(page => {
        page.classList.remove("active");
        page.style.display = "none";
    });

    target.classList.add("active");
    target.style.display = "block";

    if (pageName === "dashboard") {
        renderDashboard();
    }

    if (pageName === "students") {
        renderStudentsTable();
        renderStudentAnalysisList();
    }

    if (pageName === "home") {
        renderHomeStats();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ==========================================
   PART 2 OF 3
   Save, analyse and manage student records
   ========================================== */

/* FORM RESET */

function resetStudentForm() {
    byId("studentForm").reset();
    byId("recordId").value = "";
    byId("formTitle").textContent = "Add Student";
    byId("saveButton").textContent = "Save & Analyse Student";
    byId("cancelEditButton").hidden = true;
    clearMessage();
    byId("studentAnalysis").innerHTML = "";
}

/* SAVE OR UPDATE STUDENT */

function handleStudentSubmit(event) {
    event.preventDefault();
    clearMessage();

    const student = readStudentForm();
    const validationError = validateStudent(student);

    if (validationError) {
        showMessage(validationError, "error");
        return;
    }

    const recordId = byId("recordId").value;
    const existingIndex = students.findIndex(
        item => item.id === recordId
    );

    if (existingIndex >= 0) {
        student.id = recordId;
        students[existingIndex] = student;
    } else {
        student.id = "record_" + Date.now() + "_" +
            Math.random().toString(36).slice(2, 8);

        students.push(student);
    }

    if (!saveStudents()) {
        loadStudents();
        renderAll();
        return;
    }

    renderAll();

    byId("studentAnalysis").innerHTML = buildAnalysisHTML(student);

    showMessage(
        existingIndex >= 0
            ? "Student record updated successfully."
            : "Student saved and analysed successfully.",
        "success"
    );

    byId("studentAnalysis").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    if (existingIndex < 0) {
        byId("studentForm").reset();
        byId("recordId").value = "";
        byId("formTitle").textContent = "Add Student";
        byId("saveButton").textContent = "Save & Analyse Student";
        byId("cancelEditButton").hidden = true;
    }
}

/* BUILD STUDENT ANALYSIS */

function buildAnalysisHTML(student) {
    const risk = analyseRisk(student);
    const results = subjectResults(student);
    const suggestions = supportSuggestions(student);

    const subjectHTML = results.map(subject => `
        <li>
            <span>${safeText(subject.name)}</span>
            <span>
                <strong>${subject.mark}%</strong>
                · ${safeText(subject.level)}
            </span>
        </li>
    `).join("");

    const suggestionsHTML = suggestions.map(item =>
        `<li>${safeText(item)}</li>`
    ).join("");

    const attentionHTML = risk.level === "Low Risk"
        ? `<p>No major attention area identified from the current risk indicators.</p>`
        : `<p><strong>Attention required:</strong> ${
            risk.level === "High Risk"
                ? "Prioritise timely teacher and family support."
                : "Monitor the student and provide support where needed."
        }</p>`;

    return `
        <article class="analysis-card">
            <h3>Student Analysis: ${safeText(student.studentName)}</h3>
            <p><strong>Student ID:</strong> ${safeText(student.studentId)}</p>
            <p><strong>Class:</strong> ${safeText(student.className)}</p>
            <p><strong>Risk Score:</strong> ${risk.score} / 6</p>
            <p><strong>Risk Level:</strong>
                <span class="risk-badge ${
                    risk.level === "High Risk" ? "risk-high" :
                    risk.level === "Medium Risk" ? "risk-medium" : "risk-low"
                }">${safeText(risk.level)}</span>
            </p>
            <p><strong>Attendance:</strong> ${student.attendance}%</p>
            <p><strong>Internal Marks:</strong> ${student.internalMarks}%</p>
            <p><strong>Previous Marks:</strong> ${student.previousMarks}%</p>
            <p><strong>Assignment:</strong> ${
                student.assignmentStatus === "On Time"
                    ? "On Time"
                    : "Low Submission (" +
                        safeText(student.assignmentStatus) + ")"
            }</p>
            ${attentionHTML}
        </article>

        <article class="analysis-card">
            <h3>Subject-wise Performance</h3>
            <ul class="subject-list">${subjectHTML}</ul>
        </article>

        <article class="analysis-card">
            <h3>Personalized Support</h3>
            <ul>${suggestionsHTML}</ul>
        </article>

        <article class="analysis-card">
            <h3>Risk Assessment Guide</h3>
            <p>Attendance below 75%: 2 points; 75–89.9%: 1 point.</p>
            <p>Internal marks below 50%: 2 points; 50–74.9%: 1 point.</p>
            <p>Late assignment: 1 point; not submitted: 2 points.</p>
            <p>0–1: Low Risk; 2–3: Medium Risk; 4–6: High Risk.</p>
        </article>
    `;
}

/* STATISTIC CARDS */

function makeStat(label, value, extraClass) {
    return `
        <article class="stat-card ${extraClass || ""}">
            <div class="stat-label">${safeText(label)}</div>
            <div class="stat-number">${safeText(value)}</div>
        </article>
    `;
}

/* HOME STATISTICS */

function renderHomeStats() {
    const high = students.filter(
        s => analyseRisk(s).level === "High Risk"
    ).length;

    const medium = students.filter(
        s => analyseRisk(s).level === "Medium Risk"
    ).length;

    const low = students.filter(
        s => analyseRisk(s).level === "Low Risk"
    ).length;

    byId("homeStats").innerHTML =
        makeStat("Total Students", students.length, "") +
        makeStat("High Risk", high, "high") +
        makeStat("Medium Risk", medium, "medium") +
        makeStat("Low Risk", low, "low");
}

/* STUDENT TABLE */

function renderStudentsTable() {
    const search = byId("studentSearch").value.trim().toLowerCase();

    const filtered = students.filter(student =>
        student.studentName.toLowerCase().includes(search) ||
        student.studentId.toLowerCase().includes(search)
    );

    byId("studentsTable").innerHTML = filtered.map(student => {
        const risk = analyseRisk(student);

        const badgeClass = risk.level === "High Risk"
            ? "risk-high"
            : risk.level === "Medium Risk"
                ? "risk-medium"
                : "risk-low";

        return `
            <tr>
                <td>${safeText(student.studentId)}</td>
                <td>${safeText(student.studentName)}</td>
                <td>${safeText(student.className)}</td>
                <td>${student.attendance}%</td>
                <td>${student.internalMarks}%</td>
                <td>${student.previousMarks}%</td>
                <td>${student.assignmentStatus === "On Time"
                    ? "On Time"
                    : "Low Submission"}</td>
                <td>${risk.score}/6</td>
                <td>
                    <span class="risk-badge ${badgeClass}">
                        ${safeText(risk.level)}
                    </span>
                </td>
                <td>
                    <button type="button" class="action-button"
                        data-action="view"
                        data-id="${safeText(student.id)}">View</button>

                    <button type="button" class="action-button"
                        data-action="edit"
                        data-id="${safeText(student.id)}">Edit</button>

                    <button type="button" class="action-button delete"
                        data-action="delete"
                        data-id="${safeText(student.id)}">Delete</button>
                </td>
            </tr>
        `;
    }).join("");

    byId("emptyStudents").hidden = filtered.length > 0;
}

/* SUBJECT-WISE STUDENT ANALYSIS */

function renderStudentAnalysisList() {
    const attentionStudents = students.filter(student =>
        analyseRisk(student).level !== "Low Risk"
    );

    byId("studentAnalysisList").innerHTML = attentionStudents.length
        ? attentionStudents.map(student => buildAnalysisHTML(student)).join("")
        : `
            <article class="analysis-card">
                <h3>No Major Attention Areas</h3>
                <p>There are no students currently classified as Medium Risk or High Risk.</p>
            </article>
        `;
}

/* FIND A STUDENT */

function findStudent(id) {
    return students.find(student => student.id === id);
}

/* VIEW STUDENT */

function viewStudent(id) {
    const student = findStudent(id);
    if (!student) return;

    openPage("students");

    byId("studentAnalysisList").innerHTML =
        buildAnalysisHTML(student);

    byId("studentAnalysisList").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* EDIT STUDENT */

function editStudent(id) {
    const student = findStudent(id);
    if (!student) return;

    openPage("add");

    byId("recordId").value = student.id;
    byId("studentId").value = student.studentId;
    byId("studentName").value = student.studentName;
    byId("className").value = student.className;
    byId("age").value = student.age;
    byId("attendance").value = student.attendance;
    byId("internalMarks").value = student.internalMarks;
    byId("previousMarks").value = student.previousMarks;
    byId("assignmentStatus").value = student.assignmentStatus;

    SUBJECTS.forEach(subject => {
        byId(subject.key).value = student[subject.key];
    });

    byId("formTitle").textContent = "Edit Student";
    byId("saveButton").textContent = "Update Student";
    byId("cancelEditButton").hidden = false;
    byId("studentAnalysis").innerHTML = "";

    clearMessage();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* DELETE STUDENT */

function deleteStudent(id) {
    const student = findStudent(id);
    if (!student) return;

    if (!confirm("Delete the record for " + student.studentName + "?")) {
        return;
    }

    const oldStudents = students.slice();

    students = students.filter(item => item.id !== id);

    if (!saveStudents()) {
        students = oldStudents;
        return;
    }

    renderAll();
}

/* ==========================================
   PART 3 OF 3
   Dashboard, charts and event listeners
   ========================================== */

/* DASHBOARD */

function renderDashboard() {
    const high = students.filter(
        s => analyseRisk(s).level === "High Risk"
    ).length;

    const medium = students.filter(
        s => analyseRisk(s).level === "Medium Risk"
    ).length;

    const low = students.filter(
        s => analyseRisk(s).level === "Low Risk"
    ).length;

    const avgAttendance = average(
        students.map(s => s.attendance)
    );

    const avgMarks = average(
        students.map(s => s.internalMarks)
    );

    const lowSubmission = students.filter(
        s => s.assignmentStatus !== "On Time"
    ).length;

    byId("dashboardStats").innerHTML =
        makeStat("Total Students", students.length, "") +
        makeStat("High Risk", high, "high") +
        makeStat("Medium Risk", medium, "medium") +
        makeStat("Low Submission", lowSubmission, "medium") +
        makeStat("Average Attendance", avgAttendance.toFixed(1) + "%", "") +
        makeStat("Average Internal Marks", avgMarks.toFixed(1) + "%", "");

    renderChartGraphs();
    renderDashboardAttention();
}

/* DASHBOARD CHARTS */

function destroyChart(chart) {
    if (chart) chart.destroy();
}

function renderChartGraphs() {
    if (typeof Chart === "undefined") {
        console.warn(
            "Chart.js did not load. Dashboard statistics remain available."
        );
        return;
    }

    const overallLabels = students.map(s => s.studentName);
    const attendanceData = students.map(s => s.attendance);
    const marksData = students.map(s => s.internalMarks);

    destroyChart(performanceChart);

    performanceChart = new Chart(byId("performanceChart"), {
        type: "bar",
        data: {
            labels: overallLabels,
            datasets: [
                {
                    label: "Attendance (%)",
                    data: attendanceData
                },
                {
                    label: "Internal Marks (%)",
                    data: marksData
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    const subjectAverages = SUBJECTS.map(subject =>
        average(students.map(s => Number(s[subject.key])))
    );

    destroyChart(subjectChart);

    subjectChart = new Chart(byId("subjectChart"), {
        type: "bar",
        data: {
            labels: SUBJECTS.map(s => s.name),
            datasets: [
                {
                    label: "Average Marks (%)",
                    data: subjectAverages
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    const high = students.filter(
        s => analyseRisk(s).level === "High Risk"
    ).length;

    const medium = students.filter(
        s => analyseRisk(s).level === "Medium Risk"
    ).length;

    const low = students.filter(
        s => analyseRisk(s).level === "Low Risk"
    ).length;

    destroyChart(riskChart);

    riskChart = new Chart(byId("riskChart"), {
        type: "doughnut",
        data: {
            labels: ["High Risk", "Medium Risk", "Low Risk"],
            datasets: [
                {
                    data: [high, medium, low]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/* STUDENTS REQUIRING ATTENTION */

function renderDashboardAttention() {
    const attentionStudents = students.filter(student =>
        analyseRisk(student).level !== "Low Risk"
    );

    byId("dashboardAnalysis").innerHTML = attentionStudents.length
        ? attentionStudents.map(student => {
            const risk = analyseRisk(student);

            const weakSubjects = subjectResults(student)
                .filter(subject => subject.level === "Weak")
                .map(subject => subject.name);

            const badgeClass = risk.level === "High Risk"
                ? "risk-high"
                : "risk-medium";

            return `
                <article class="analysis-card">
                    <h3>
                        ${safeText(student.studentName)}
                        <span class="risk-badge ${badgeClass}">
                            ${safeText(risk.level)}
                        </span>
                    </h3>

                    <p>Student ID: ${safeText(student.studentId)}</p>
                    <p>Risk score: ${risk.score}/6</p>
                    <p>Attendance: ${student.attendance}%</p>
                    <p>Internal marks: ${student.internalMarks}%</p>
                    <p>Weak subjects: ${
                        weakSubjects.length
                            ? safeText(weakSubjects.join(", "))
                            : "None below 50%"
                    }</p>

                    <button type="button" class="secondary"
                        data-action="view"
                        data-id="${safeText(student.id)}">
                        View Analysis
                    </button>
                </article>
            `;
        }).join("")
        : `
            <article class="analysis-card">
                <h3>No Students Requiring Attention</h3>
                <p>
                    No Medium Risk or High Risk students are currently recorded.
                </p>
            </article>
        `;
}

/* REFRESH WEBSITE SECTIONS */

function renderAll() {
    renderHomeStats();
    renderStudentsTable();
    renderStudentAnalysisList();

    if (byId("dashboard").classList.contains("active")) {
        renderDashboard();
    }
}

/* CONNECT ALL BUTTONS AND FORMS */

document.addEventListener("DOMContentLoaded", function () {
    loadStudents();

    /* Navigation */
    document.addEventListener("click", function (event) {
        const navButton = event.target.closest("[data-go]");

        if (navButton) {
            event.preventDefault();
            openPage(navButton.getAttribute("data-go"));
            return;
        }

        /* View, Edit and Delete buttons */
        const actionButton = event.target.closest("[data-action]");

        if (actionButton) {
            const action = actionButton.getAttribute("data-action");
            const id = actionButton.getAttribute("data-id");

            if (action === "view") {
                viewStudent(id);
            } else if (action === "edit") {
                editStudent(id);
            } else if (action === "delete") {
                deleteStudent(id);
            }
        }
    });

    /* Save and analyse student */
    byId("studentForm").addEventListener(
        "submit",
        handleStudentSubmit
    );

    /* Clear the form */
    byId("clearButton").addEventListener("click", function () {
        resetStudentForm();
    });

    /* Cancel editing */
    byId("cancelEditButton").addEventListener("click", function () {
        resetStudentForm();
    });

    /* Search student records */
    byId("studentSearch").addEventListener("input", function () {
        renderStudentsTable();
    });

    /* Start on the Home page */
    openPage("home");
    renderAll();
});

