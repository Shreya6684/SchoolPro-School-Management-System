
/* =========================================
   SCHOOLPRO - SCHOOL MANAGEMENT SYSTEM
   Complete Main JavaScript
   ========================================= */

"use strict";

/* =========================================
   1. LOCAL STORAGE DATABASE
   ========================================= */

const STORAGE = {
    users: "schoolpro_users",
    currentUser: "schoolpro_current_user",
    darkMode: "schoolpro_dark_mode",
    notifications: "schoolpro_notifications",
    students: "schoolpro_students"
};

function getData(key, fallback = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        console.error("Storage error:", error);
        return fallback;
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Unable to save data:", error);
        alert("Storage is full. Please use a smaller student photo.");
        return false;
    }
}

function getElement(id) {
    return document.getElementById(id);
}

function safeAddEvent(element, eventName, callback) {
    if (element) {
        element.addEventListener(eventName, callback);
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

/* =========================================
   2. INITIALIZE APPLICATION
   ========================================= */

function initializeApp() {
    let users = getData(STORAGE.users, []);
    let usersChanged = false;

    users = users.map(user => {
        if (user.role === "parent") {
            usersChanged = true;
            return { ...user, role: "student" };
        }

        return user;
    });

    const adminExists = users.some(
        user => user.email === "admin@schoolpro.com"
    );

    if (!adminExists) {
        users.push({
            id: "ADMIN001",
            name: "School Admin",
            email: "admin@schoolpro.com",
            password: "admin123",
            role: "admin",
            createdAt: new Date().toISOString()
        });

        usersChanged = true;
    }

    const demoAccounts = [
        {
            id: "TEACHER001",
            name: "Demo Teacher",
            email: "teacher@schoolpro.com",
            password: "teacher123",
            role: "teacher"
        },
        {
            id: "STUDENT001",
            name: "Demo Student",
            email: "student@schoolpro.com",
            password: "student123",
            role: "student"
        }
    ];

    demoAccounts.forEach(account => {
        const accountExists = users.some(
            user => String(user.email || "").toLowerCase() === account.email
        );

        if (!accountExists) {
            users.push({
                ...account,
                createdAt: new Date().toISOString()
            });
            usersChanged = true;
        }
    });

    if (usersChanged) saveData(STORAGE.users, users);

    if (!Array.isArray(getData(STORAGE.students, null))) {
        saveData(STORAGE.students, []);
    }

    initializeNotifications();
    initializeDarkMode();
}

function initializeNotifications() {
    let notifications = getData(STORAGE.notifications, null);

    if (!notifications) {
        notifications = [
            {
                id: 1,
                title: "Welcome to SchoolPro",
                message: "Your school management dashboard is ready.",
                read: false
            },
            {
                id: 2,
                title: "Academic Session 2026-27",
                message: "New academic session is active.",
                read: false
            }
        ];

        saveData(STORAGE.notifications, notifications);
    }
}

/* =========================================
   3. DOM ELEMENTS
   ========================================= */

const loginPage = getElement("loginPage");
const registerPage = getElement("registerPage");
const appContainer = getElement("appContainer");

const loginForm = getElement("loginForm");
const registerForm = getElement("registerForm");

const loginMessage = getElement("loginMessage");
const registerMessage = getElement("registerMessage");

const loginEmail = getElement("loginEmail");
const loginPassword = getElement("loginPassword");
const loginRole = getElement("loginRole");

const togglePassword = getElement("togglePassword");

const showRegister = getElement("showRegister");
const showLogin = getElement("showLogin");

const logoutButton = getElement("logoutButton");

const sidebar = getElement("sidebar");
const menuToggle = getElement("menuToggle");
const sidebarClose = getElement("sidebarClose");
const sidebarOverlay = getElement("sidebarOverlay");

const pageTitle = getElement("pageTitle");

const navigationLinks = document.querySelectorAll(".nav-link");

/* =========================================
   4. LOGIN AND REGISTER PAGE VISIBILITY
   ========================================= */

function showLoginPage() {
    if (loginPage) loginPage.classList.remove("hidden");
    if (registerPage) registerPage.classList.add("hidden");
    if (appContainer) appContainer.classList.add("hidden");
}

function showRegisterPage() {
    if (loginPage) loginPage.classList.add("hidden");
    if (registerPage) registerPage.classList.remove("hidden");
    if (appContainer) appContainer.classList.add("hidden");
}

function showDashboard() {
    if (loginPage) loginPage.classList.add("hidden");
    if (registerPage) registerPage.classList.add("hidden");
    if (appContainer) appContainer.classList.remove("hidden");
}

safeAddEvent(showRegister, "click", function(event) {
    event.preventDefault();
    showRegisterPage();
});

safeAddEvent(showLogin, "click", function(event) {
    event.preventDefault();
    showLoginPage();
});

/* =========================================
   5. SHOW / HIDE PASSWORD
   ========================================= */

safeAddEvent(togglePassword, "click", function() {
    if (!loginPassword) return;

    if (loginPassword.type === "password") {
        loginPassword.type = "text";
        togglePassword.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        loginPassword.type = "password";
        togglePassword.classList.replace("fa-eye-slash", "fa-eye");
    }
});

/* =========================================
   6. LOGIN FUNCTION
   ========================================= */

safeAddEvent(loginForm, "submit", function(event) {
    event.preventDefault();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;
    const selectedRole = loginRole.value;

    const users = getData(STORAGE.users, []);

    const user = users.find(item =>
        String(item.email || "").toLowerCase() === email &&
        item.password === password &&
        normalizeRole(item.role) === selectedRole
    );

    if (!user) {
        loginMessage.textContent =
            "Invalid email, password or selected role.";
        return;
    }

    loginMessage.textContent = "";

    saveData(STORAGE.currentUser, {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: getStudentIdForUser(user)
    });

    startUserSession(user);
    loginForm.reset();
});

/* =========================================
   7. REGISTER FUNCTION
   ========================================= */

safeAddEvent(registerForm, "submit", function(event) {
    event.preventDefault();

    const name = getElement("registerName").value.trim();
    const email = getElement("registerEmail").value.trim().toLowerCase();
    const password = getElement("registerPassword").value;
    const role = getElement("registerRole").value;

    const users = getData(STORAGE.users, []);

    if (name.length < 2) {
        registerMessage.textContent = "Please enter a valid full name.";
        return;
    }

    if (password.length < 6) {
        registerMessage.textContent =
            "Password must contain at least 6 characters.";
        return;
    }

    const existingUser = users.some(
        user => user.email.toLowerCase() === email
    );

    if (existingUser) {
        registerMessage.textContent =
            "This email is already registered.";
        return;
    }

    const newUser = {
        id: "USR" + Date.now(),
        name,
        email,
        password,
        role: normalizeRole(role),
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    if (!saveData(STORAGE.users, users)) return;

    registerMessage.style.color = "#16A34A";
    registerMessage.textContent =
        "Account created successfully! Please login.";

    registerForm.reset();

    setTimeout(function() {
        showLoginPage();
        registerMessage.textContent = "";
        registerMessage.style.color = "";
    }, 1200);
});

/* =========================================
   8. USER SESSION
   ========================================= */

function startUserSession(user) {
    user.role = normalizeRole(user.role);
    showDashboard();

    const nameElement = getElement("loggedUserName");
    const roleElement = getElement("loggedUserRole");
    const profileImage = document.querySelector(".user-profile img");

    if (nameElement) nameElement.textContent = user.name;

    if (roleElement) {
        roleElement.textContent = formatRole(user.role);
    }

    if (profileImage) {
        profileImage.src =
            "https://ui-avatars.com/api/?name=" +
            encodeURIComponent(user.name) +
            "&background=f59e0b&color=fff";

        profileImage.alt = user.name;
    }

    applyRolePermissions(user.role);
    navigateToPage("dashboard");
    if (normalizeRole(user.role) === "student") {
        personalizeStudentDashboard();
    }

    createCharts();
    renderStudents();
    updateDashboardStats();
}

function normalizeRole(role) {
    return role === "parent" ? "student" : role;
}

function getStudentIdForUser(user) {
    if (!user || normalizeRole(user.role) !== "student") return "";

    const email = String(user.email || "").toLowerCase();
    const student = getStudents().find(item =>
        String(item.email || "").toLowerCase() === email
    );

    return student?.id || "";
}

function formatRole(role) {
    role = normalizeRole(role);
    const roles = {
        admin: "Administrator",
        teacher: "Teacher",
        student: "Student"
    };

    return roles[role] || "User";
}

function personalizeStudentDashboard() {
    const user = getCurrentUser();
    const student = getStudents().find(item =>
        item.id === user?.studentId ||
        String(item.email || "").toLowerCase() === String(user?.email || "").toLowerCase()
    );

    const bannerTag = document.querySelector("#dashboardPage .welcome-tag");
    const bannerTitle = document.querySelector("#dashboardPage .welcome-banner h1");
    const bannerText = document.querySelector("#dashboardPage .welcome-banner p");
    const quickButton = getElement("quickStudentButton");

    if (bannerTag) bannerTag.lastChild.textContent = " STUDENT PROFILE";
    if (bannerTitle) bannerTitle.textContent = student ? `Welcome, ${student.name}!` : "Welcome, Student!";
    if (bannerText) bannerText.textContent = student
        ? `Student ID: ${student.id} | Class ${student.className}-${student.section}`
        : "View your academic information and school fees.";
    if (quickButton) quickButton.style.display = "none";
}

/* =========================================
   9. ROLE-BASED NAVIGATION
   ========================================= */

function applyRolePermissions(role) {
    role = normalizeRole(role);
    const allLinks = document.querySelectorAll(".nav-link");
    allLinks.forEach(link => {
        link.style.display = "flex";
    });

    if (role === "teacher") {
        const teachersLink = document.querySelector('.nav-link[data-page="teachers"]');
        if (teachersLink) teachersLink.style.display = "none";
    }

    if (role === "student") {
        const allowed = [
            "dashboard",
            "attendance",
            "grades",
            "timetable",
            "exams",
            "parents",
            "fees",
            "settings"
        ];

        allLinks.forEach(link => {
            if (!allowed.includes(link.dataset.page)) {
                link.style.display = "none";
            }
        });
    }

    const studentAdminControls = document.querySelectorAll(
        "#addStudentButton, #studentAddFirstButton, #exportStudentsButton"
    );

    studentAdminControls.forEach(control => {
        control.style.display = role === "admin" ? "" : "none";
    });
}

function getCurrentUser() {
    return getData(STORAGE.currentUser, null);
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === "admin";
}

/* =========================================
   10. PAGE NAVIGATION
   ========================================= */

function navigateToPage(pageName) {
    const targetPage = getElement(pageName + "Page");

    if (!targetPage) return;

    document.querySelectorAll(".page-section").forEach(page => {
        page.classList.remove("active-page");
    });

    targetPage.classList.add("active-page");

    navigationLinks.forEach(link => {
        link.classList.remove("active");

        if (link.dataset.page === pageName) {
            link.classList.add("active");
        }
    });

    const activeLink = document.querySelector(
        `.nav-link[data-page="${pageName}"]`
    );

    if (pageTitle) {
        pageTitle.textContent = activeLink
            ? activeLink.querySelector("span")?.textContent || "Dashboard"
            : "Dashboard";
    }

    closeMobileSidebar();

    if (pageName === "students") {
        renderStudents();
    }

    if (pageName === "dashboard") {
        updateDashboardStats();
    }
}

navigationLinks.forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        if (link.style.display === "none") return;

        navigateToPage(link.dataset.page);
    });
});

/* =========================================
   11. MOBILE SIDEBAR
   ========================================= */

function openMobileSidebar() {
    if (sidebar) sidebar.classList.add("active");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
}

function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove("active");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
}

safeAddEvent(menuToggle, "click", openMobileSidebar);
safeAddEvent(sidebarClose, "click", closeMobileSidebar);
safeAddEvent(sidebarOverlay, "click", closeMobileSidebar);

/* =========================================
   12. LOGOUT
   ========================================= */

safeAddEvent(logoutButton, "click", function() {
    const confirmed = confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    localStorage.removeItem(STORAGE.currentUser);

    showLoginPage();

    if (loginMessage) loginMessage.textContent = "";

    closeMobileSidebar();
});

/* =========================================
   13. DARK MODE
   ========================================= */

const darkModeButton = getElement("darkModeButton");

function initializeDarkMode() {
    const isDark = getData(STORAGE.darkMode, false);

    document.body.classList.toggle("dark-mode", isDark);

    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    if (!darkModeButton) return;

    const icon = darkModeButton.querySelector("i");

    if (!icon) return;

    if (document.body.classList.contains("dark-mode")) {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
}

safeAddEvent(darkModeButton, "click", function() {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    saveData(STORAGE.darkMode, isDark);
    updateDarkModeIcon();
});

/* =========================================
   14. DASHBOARD CHARTS
   ========================================= */

let attendanceChartInstance = null;
let feeChartInstance = null;

function createCharts() {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js could not be loaded.");
        return;
    }

    createAttendanceChart();
    createFeeChart();
}

function createAttendanceChart() {
    const canvas = getElement("attendanceChart");

    if (!canvas) return;

    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
    }

    attendanceChartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",

        data: {
            labels: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ],

            datasets: [
                {
                    label: "Present",
                    data: [1150, 1180, 1165, 1200, 1181, 1100],
                    backgroundColor: "#F59E0B",
                    borderRadius: 6,
                    barThickness: 17
                },
                {
                    label: "Absent",
                    data: [100, 70, 85, 50, 69, 150],
                    backgroundColor: "#FDE68A",
                    borderRadius: 6,
                    barThickness: 17
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "top",
                    align: "end",
                    labels: {
                        boxWidth: 9,
                        boxHeight: 9,
                        usePointStyle: true,
                        font: { size: 10 }
                    }
                }
            },

            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                },

                y: {
                    beginAtZero: true,
                    grid: { color: "#F1F5F9" },
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

function createFeeChart() {
    const canvas = getElement("feeChart");

    if (!canvas) return;

    if (feeChartInstance) {
        feeChartInstance.destroy();
    }

    feeChartInstance = new Chart(canvas.getContext("2d"), {
        type: "doughnut",

        data: {
            labels: ["Paid", "Pending", "Overdue"],

            datasets: [
                {
                    data: [70, 20, 10],
                    backgroundColor: [
                        "#16A34A",
                        "#F59E0B",
                        "#EF4444"
                    ],
                    borderWidth: 3,
                    borderColor: "#FFFFFF",
                    hoverOffset: 8
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",

            plugins: {
                legend: { display: false }
            }
        }
    });
}

/* =========================================
   15. STUDENT MANAGEMENT
   ========================================= */

let selectedStudentPhoto = "";

function getStudents() {
    const students = getData(STORAGE.students, []);
    return Array.isArray(students) ? students : [];
}

function saveStudents(students) {
    return saveData(STORAGE.students, students);
}

function generateStudentId() {
    const students = getStudents();
    const year = new Date().getFullYear();

    const nextNumber = students.length + 1;

    return "STU-" + year + "-" +
        String(nextNumber).padStart(3, "0");
}

/* Find a form field using its possible IDs or name */

function findStudentField(possibleNames) {
    const form = getElement("studentForm");

    if (!form) return null;

    for (const name of possibleNames) {
        const field =
            form.querySelector("#" + name) ||
            form.querySelector(`[name="${name}"]`);

        if (field) return field;
    }

    return null;
}

function readStudentField(possibleNames) {
    const field = findStudentField(possibleNames);
    return field ? field.value.trim() : "";
}

function setStudentField(possibleNames, value) {
    const field = findStudentField(possibleNames);

    if (field) {
        field.value = value ?? "";
    }
}

/* Open Add Student Modal */

function openStudentModal(student = null) {
    const modal = getElement("studentModal");
    const form = getElement("studentForm");
    const heading = modal?.querySelector("h2, h3, .modal-title");

    if (!modal || !form) return;

    form.reset();
    selectedStudentPhoto = "";

    const recordId = getElement("studentRecordId");
    const photoPreview = getElement("studentPhotoPreview");

    if (recordId) {
        recordId.value = student ? student.id : "";
    }

    if (heading) {
        heading.textContent = student ? "Edit Student" : "Add New Student";
    }

    if (photoPreview) {
        photoPreview.src = student?.photo || "";
        photoPreview.style.display = student?.photo ? "block" : "none";
    }

    selectedStudentPhoto = student?.photo || "";

    setStudentField(["studentName", "studentFullName", "fullName", "name"], student?.name || "");
    setStudentField(["studentEmail", "email"], student?.email || "");
    setStudentField(["studentPhone", "phone", "studentMobile"], student?.phone || "");
    setStudentField(["studentGender", "gender"], student?.gender || "");
    setStudentField(["studentDob", "studentDOB", "dob", "dateOfBirth"], student?.dob || "");
    setStudentField(["studentAddress", "address"], student?.address || "");
    setStudentField(["studentClass", "class", "className"], student?.className || "");
    setStudentField(["studentSection", "section"], student?.section || "");
    setStudentField(["studentRoll", "roll", "rollNumber"], student?.roll || "");
    setStudentField(["studentAdmissionDate", "admissionDate"], student?.admissionDate || "");
    setStudentField(["studentStatus", "status"], student?.status || "Active");
    setStudentField(["parentName", "studentParentName", "guardianName"], student?.parentName || "");
    setStudentField(["parentPhone", "parentMobile", "guardianPhone"], student?.parentPhone || "");
    setStudentField(["parentEmail", "guardianEmail"], student?.parentEmail || "");

    modal.classList.add("show");
    modal.classList.remove("hidden");
    modal.style.display = "flex";
}

/* Close Student Modal */

function closeStudentModal() {
    const modal = getElement("studentModal");

    if (!modal) return;

    modal.classList.remove("show");
    modal.classList.add("hidden");
    modal.style.display = "none";
}

/* Add Student Buttons */

safeAddEvent(getElement("addStudentButton"), "click", function() {
    if (!isAdmin()) {
        alert("Only the administrator can add students.");
        return;
    }

    openStudentModal();
});

safeAddEvent(getElement("studentAddFirstButton"), "click", function() {
    if (!isAdmin()) {
        alert("Only the administrator can add students.");
        return;
    }

    openStudentModal();
});

safeAddEvent(getElement("closeStudentModal"), "click", closeStudentModal);
safeAddEvent(getElement("cancelStudentButton"), "click", closeStudentModal);

/* =========================================
   16. STUDENT PHOTO UPLOAD
   ========================================= */

const studentPhotoInput = getElement("studentPhoto");

safeAddEvent(studentPhotoInput, "change", function(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        event.target.value = "";
        return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
        alert("Please select an image smaller than 1.5 MB.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        selectedStudentPhoto = reader.result;

        const preview = getElement("studentPhotoPreview");

        if (preview) {
            preview.src = selectedStudentPhoto;
            preview.style.display = "block";
        }
    };

    reader.readAsDataURL(file);
});

/* =========================================
   17. SAVE STUDENT
   ========================================= */

safeAddEvent(getElement("studentForm"), "submit", function(event) {
    event.preventDefault();

    if (!isAdmin()) {
        alert("Only the administrator can save student records.");
        return;
    }

    const name = readStudentField([
        "studentName", "studentFullName", "fullName", "name"
    ]);

    const email = readStudentField(["studentEmail", "email"]);
    const phone = readStudentField([
        "studentPhone", "phone", "studentMobile"
    ]);

    const gender = readStudentField(["studentGender", "gender"]);
    const dob = readStudentField([
        "studentDob", "studentDOB", "dob", "dateOfBirth"
    ]);

    const address = readStudentField(["studentAddress", "address"]);

    const className = readStudentField([
        "studentClass", "class", "className"
    ]);

    const section = readStudentField(["studentSection", "section"]);

    const roll = readStudentField([
        "studentRoll", "roll", "rollNumber"
    ]);

    const admissionDate = readStudentField([
        "studentAdmissionDate", "admissionDate"
    ]);

    const status = readStudentField(["studentStatus", "status"]) || "Active";

    const parentName = readStudentField([
        "parentName", "studentParentName", "guardianName"
    ]);

    const parentPhone = readStudentField([
        "parentPhone", "parentMobile", "guardianPhone"
    ]);

    const parentEmail = readStudentField([
        "parentEmail", "guardianEmail"
    ]);

    const recordId = getElement("studentRecordId")?.value || "";

    if (name.length < 2) {
        showStudentFormMessage("Please enter the student's full name.");
        return;
    }

    if (!className) {
        showStudentFormMessage("Please select the student's class.");
        return;
    }

    if (!section) {
        showStudentFormMessage("Please select the student's section.");
        return;
    }

    if (!roll) {
        showStudentFormMessage("Please enter the roll number.");
        return;
    }

    const students = getStudents();

    const duplicateRoll = students.some(student =>
        student.roll === roll &&
        student.className === className &&
        student.section === section &&
        student.id !== recordId
    );

    if (duplicateRoll) {
        showStudentFormMessage(
            "This roll number already exists in the selected class and section."
        );
        return;
    }

    const studentData = {
        id: recordId || generateStudentId(),
        name,
        email,
        phone,
        gender,
        dob,
        address,
        className,
        section,
        roll,
        admissionDate,
        status,
        parentName,
        parentPhone,
        parentEmail,
        photo: selectedStudentPhoto,
        updatedAt: new Date().toISOString()
    };

    if (recordId) {
        const index = students.findIndex(student => student.id === recordId);

        if (index !== -1) {
            studentData.createdAt = students[index].createdAt;
            students[index] = studentData;
        }
    } else {
        studentData.createdAt = new Date().toISOString();
        students.push(studentData);
    }

    if (!saveStudents(students)) return;

    closeStudentModal();
    renderStudents();
    updateDashboardStats();

    alert(recordId
        ? "Student record updated successfully!"
        : "Student added successfully!"
    );
});

function showStudentFormMessage(message) {
    const messageElement = getElement("studentFormMessage") ||
        getElement("studentMessage");

    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = "#DC2626";
    } else {
        alert(message);
    }
}

/* =========================================
   18. DISPLAY STUDENTS IN TABLE
   ========================================= */

function renderStudents() {
    const tableBody = getElement("studentsTableBody");

    if (!tableBody) return;

    const students = getStudents();

    const searchInput = getElement("studentSearch");
    const classFilter = getElement("studentClassFilter");
    const sectionFilter = getElement("studentSectionFilter");
    const statusFilter = getElement("studentStatusFilter");

    const search = searchInput?.value.trim().toLowerCase() || "";
    const selectedClass = classFilter?.value || "";
    const selectedSection = sectionFilter?.value || "";
    const selectedStatus = statusFilter?.value || "";

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            (student.name || "").toLowerCase().includes(search) ||
            (student.id || "").toLowerCase().includes(search) ||
            (student.roll || "").toLowerCase().includes(search) ||
            (student.parentName || "").toLowerCase().includes(search);

        const matchesClass =
            !selectedClass || student.className === selectedClass;

        const matchesSection =
            !selectedSection || student.section === selectedSection;

        const matchesStatus =
            !selectedStatus || student.status === selectedStatus;

        return matchesSearch &&
            matchesClass &&
            matchesSection &&
            matchesStatus;
    });

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table-message">
                    No student records found.
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = filteredStudents.map(student => {
            const photo = student.photo
                ? `<img src="${student.photo}" alt="Student" class="student-avatar">`
                : `<span class="student-avatar-placeholder">
                       <i class="fa-solid fa-user"></i>
                   </span>`;

            const statusClass =
                student.status === "Inactive" ? "inactive" : "active";

            return `
                <tr>
                    <td>
                        <div class="student-cell">
                            ${photo}
                            <div>
                                <strong>${escapeHTML(student.name)}</strong>
                                <small>${escapeHTML(student.id)}</small>
                            </div>
                        </div>
                    </td>

                    <td>${escapeHTML(student.className)} - ${escapeHTML(student.section)}</td>
                    <td>${escapeHTML(student.roll)}</td>
                    <td>${escapeHTML(student.phone || "-")}</td>
                    <td>${escapeHTML(student.parentName || "-")}</td>

                    <td>
                        <span class="status-badge ${statusClass}">
                            ${escapeHTML(student.status)}
                        </span>
                    </td>

                    <td>
                        <div class="student-actions">
                            <button type="button" class="view-student-btn"
                                data-action="view" data-id="${escapeHTML(student.id)}"
                                title="View Student">
                                <i class="fa-solid fa-eye"></i>
                            </button>

                            ${isAdmin() ? `
                                <button type="button" class="edit-student-btn"
                                    data-action="edit" data-id="${escapeHTML(student.id)}"
                                    title="Edit Student">
                                    <i class="fa-solid fa-pen"></i>
                                </button>

                                <button type="button" class="delete-student-btn"
                                    data-action="delete" data-id="${escapeHTML(student.id)}"
                                    title="Delete Student">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            ` : ""}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    const resultCount = getElement("studentResultCount");

    if (resultCount) {
        resultCount.textContent =
            `Showing ${filteredStudents.length} of ${students.length} students`;
    }

    updateStudentStats(students);
}

/* =========================================
   19. STUDENT TABLE ACTIONS
   ========================================= */

safeAddEvent(getElement("studentsTableBody"), "click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const studentId = button.dataset.id;

    const student = getStudents().find(item => item.id === studentId);

    if (!student) return;

    if (action === "view") {
        openStudentDetails(student);
    }

    if (action === "edit") {
        if (!isAdmin()) {
            alert("Only the administrator can edit student records.");
            return;
        }

        openStudentModal(student);
    }

    if (action === "delete") {
        if (!isAdmin()) {
            alert("Only the administrator can delete student records.");
            return;
        }

        deleteStudent(studentId);
    }
});

/* =========================================
   20. DELETE STUDENT
   ========================================= */

function deleteStudent(studentId) {
    const confirmed = confirm(
        "Are you sure you want to delete this student record?"
    );

    if (!confirmed) return;

    const students = getStudents().filter(
        student => student.id !== studentId
    );

    if (!saveStudents(students)) return;

    renderStudents();
    updateDashboardStats();

    alert("Student record deleted successfully.");
}

/* =========================================
   21. STUDENT DETAILS
   ========================================= */

function openStudentDetails(student) {
    const modal = getElement("studentDetailsModal");
    const content = getElement("studentDetailsContent");

    if (!modal || !content) return;

    const photo = student.photo
        ? `<img src="${student.photo}" alt="Student Photo" class="student-detail-photo">`
        : `<div class="student-detail-photo-placeholder">
               <i class="fa-solid fa-user"></i>
           </div>`;

    content.innerHTML = `
        <div class="student-detail-header">
            ${photo}
            <div>
                <h3>${escapeHTML(student.name)}</h3>
                <p>${escapeHTML(student.id)}</p>
                <span class="status-badge ${student.status === "Inactive" ? "inactive" : "active"}">
                    ${escapeHTML(student.status)}
                </span>
            </div>
        </div>

        <div class="student-detail-grid">
            <div><strong>Class:</strong> ${escapeHTML(student.className)} - ${escapeHTML(student.section)}</div>
            <div><strong>Roll Number:</strong> ${escapeHTML(student.roll)}</div>
            <div><strong>Email:</strong> ${escapeHTML(student.email || "-")}</div>
            <div><strong>Phone:</strong> ${escapeHTML(student.phone || "-")}</div>
            <div><strong>Gender:</strong> ${escapeHTML(student.gender || "-")}</div>
            <div><strong>Date of Birth:</strong> ${escapeHTML(student.dob || "-")}</div>
            <div><strong>Admission Date:</strong> ${escapeHTML(student.admissionDate || "-")}</div>
            <div><strong>Address:</strong> ${escapeHTML(student.address || "-")}</div>
            <div><strong>Parent Name:</strong> ${escapeHTML(student.parentName || "-")}</div>
            <div><strong>Parent Phone:</strong> ${escapeHTML(student.parentPhone || "-")}</div>
            <div><strong>Parent Email:</strong> ${escapeHTML(student.parentEmail || "-")}</div>
        </div>
    `;

    const editButton = getElement("studentDetailsEditButton");

    if (editButton) {
        editButton.style.display = isAdmin() ? "inline-flex" : "none";

        editButton.onclick = function() {
            closeStudentDetails();
            openStudentModal(student);
        };
    }

    modal.classList.add("show");
    modal.style.display = "flex";
}

function closeStudentDetails() {
    const modal = getElement("studentDetailsModal");

    if (!modal) return;

    modal.classList.remove("show");
    modal.style.display = "none";
}

safeAddEvent(
    getElement("closeStudentDetailsModal"),
    "click",
    closeStudentDetails
);

safeAddEvent(
    getElement("studentDetailsCloseButton"),
    "click",
    closeStudentDetails
);

/* =========================================
   22. STUDENT SEARCH AND FILTERS
   ========================================= */

safeAddEvent(getElement("studentSearch"), "input", renderStudents);
safeAddEvent(getElement("studentClassFilter"), "change", renderStudents);
safeAddEvent(getElement("studentSectionFilter"), "change", renderStudents);
safeAddEvent(getElement("studentStatusFilter"), "change", renderStudents);

safeAddEvent(getElement("clearStudentFilters"), "click", function() {
    const search = getElement("studentSearch");
    const classFilter = getElement("studentClassFilter");
    const sectionFilter = getElement("studentSectionFilter");
    const statusFilter = getElement("studentStatusFilter");

    if (search) search.value = "";
    if (classFilter) classFilter.value = "";
    if (sectionFilter) sectionFilter.value = "";
    if (statusFilter) statusFilter.value = "";

    renderStudents();
});

/* =========================================
   23. STUDENT STATISTICS
   ========================================= */

function updateStudentStats(students = getStudents()) {
    const total = students.length;

    const active = students.filter(
        student => student.status !== "Inactive"
    ).length;

    const inactive = students.filter(
        student => student.status === "Inactive"
    ).length;

    const classCount = new Set(
        students.map(student => student.className).filter(Boolean)
    ).size;

    if (getElement("studentCountTotal")) {
        getElement("studentCountTotal").textContent = total;
    }

    if (getElement("studentCountActive")) {
        getElement("studentCountActive").textContent = active;
    }

    if (getElement("studentCountInactive")) {
        getElement("studentCountInactive").textContent = inactive;
    }

    if (getElement("studentClassCount")) {
        getElement("studentClassCount").textContent = classCount;
    }
}

/* =========================================
   24. EXPORT STUDENTS TO CSV
   ========================================= */

safeAddEvent(getElement("exportStudentsButton"), "click", exportStudentsCSV);

function exportStudentsCSV() {
    if (!isAdmin()) {
        alert("Only the administrator can export student records.");
        return;
    }

    const students = getStudents();

    if (students.length === 0) {
        alert("There are no student records to export.");
        return;
    }

    const headers = [
        "Student ID",
        "Name",
        "Email",
        "Phone",
        "Gender",
        "Date of Birth",
        "Class",
        "Section",
        "Roll Number",
        "Admission Date",
        "Status",
        "Parent Name",
        "Parent Phone",
        "Parent Email",
        "Address"
    ];

    const rows = students.map(student => [
        student.id,
        student.name,
        student.email,
        student.phone,
        student.gender,
        student.dob,
        student.className,
        student.section,
        student.roll,
        student.admissionDate,
        student.status,
        student.parentName,
        student.parentPhone,
        student.parentEmail,
        student.address
    ]);

    function csvValue(value) {
        return '"' + String(value ?? "").replace(/"/g, '""') + '"';
    }

    const csvContent = [
        headers.map(csvValue).join(","),
        ...rows.map(row => row.map(csvValue).join(","))
    ].join("\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "SchoolPro_Students.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/* =========================================
   25. DASHBOARD QUICK ACTIONS
   ========================================= */

safeAddEvent(getElement("quickStudentButton"), "click", function() {
    navigateToPage("students");
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", function() {
        navigateToPage(button.dataset.go);
    });
});

/* =========================================
   26. DASHBOARD STUDENT COUNTS
   ========================================= */

function updateDashboardStats() {
    const students = getStudents();

    if (getElement("totalStudents")) {
        getElement("totalStudents").textContent = students.length;
    }

    if (getElement("totalClasses")) {
        const classes = new Set(
            students.map(student => student.className).filter(Boolean)
        );

        getElement("totalClasses").textContent = classes.size;
    }

    const recentTable = getElement("recentStudentsTable");

    if (recentTable) {
        const recentStudents = [...students]
            .sort((a, b) =>
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            )
            .slice(0, 5);

        if (recentStudents.length === 0) {
            recentTable.innerHTML = `
                <tr>
                    <td colspan="5">No student records available yet.</td>
                </tr>
            `;
        } else {
            recentTable.innerHTML = recentStudents.map(student => `
                <tr>
                    <td>${escapeHTML(student.name)}</td>
                    <td>${escapeHTML(student.id)}</td>
                    <td>${escapeHTML(student.className)} - ${escapeHTML(student.section)}</td>
                    <td>${escapeHTML(student.phone || "-")}</td>
                    <td>${escapeHTML(student.status)}</td>
                </tr>
            `).join("");
        }
    }

    updateStudentStats(students);
}

/* =========================================
   27. NOTIFICATIONS
   ========================================= */

safeAddEvent(getElement("notificationButton"), "click", function() {
    const notifications = getData(STORAGE.notifications, []);

    if (notifications.length === 0) {
        alert("No notifications available.");
        return;
    }

    const notificationText = notifications.map(item =>
        item.title + "\n" + item.message
    ).join("\n\n");

    alert("SCHOOLPRO NOTIFICATIONS\n\n" + notificationText);

    notifications.forEach(item => {
        item.read = true;
    });

    saveData(STORAGE.notifications, notifications);

    const notificationDot = document.querySelector(".notification-dot");

    if (notificationDot) {
        notificationDot.style.display = "none";
    }
});

/* =========================================
   28. FORGOT PASSWORD
   ========================================= */

safeAddEvent(getElement("forgotPassword"), "click", function(event) {
    event.preventDefault();

    alert(
        "Please contact your school administrator " +
        "to reset your password."
    );
});

/* =========================================
   29. SUPPORT BUTTON
   ========================================= */

safeAddEvent(getElement("helpButton"), "click", function() {
    alert(
        "Welcome to SchoolPro Support!\n\n" +
        "Please contact your school administrator for assistance."
    );
});

/* =========================================
   30. GLOBAL SEARCH
   ========================================= */

const globalSearch = getElement("globalSearch");

safeAddEvent(globalSearch, "keydown", function(event) {
    if (event.key !== "Enter") return;

    const query = globalSearch.value.trim().toLowerCase();

    if (!query) return;

    const searchPages = {
        dashboard: ["dashboard", "home", "overview"],
        students: ["student", "students", "admission"],
        teachers: ["teacher", "teachers", "staff"],
        classes: ["class", "classes", "section"],
        attendance: ["attendance", "present", "absent"],
        grades: ["grade", "grades", "marks", "result"],
        timetable: ["timetable", "schedule"],
        exams: ["exam", "examination"],
        fees: ["fee", "fees", "payment"],
        parents: ["parent", "parents", "communication"],
        reports: ["report", "reports", "export"],
        settings: ["setting", "settings"]
    };

    let matchedPage = null;

    for (const [page, keywords] of Object.entries(searchPages)) {
        if (keywords.some(keyword => query.includes(keyword))) {
            matchedPage = page;
            break;
        }
    }

    if (!matchedPage) {
        alert("No matching section found.");
        return;
    }

    const link = document.querySelector(
        `.nav-link[data-page="${matchedPage}"]`
    );

    if (link && link.style.display !== "none") {
        navigateToPage(matchedPage);
        globalSearch.value = "";
    } else {
        alert("This section is not available for your role.");
    }
});

/* =========================================
   31. PROFILE MENU
   ========================================= */

safeAddEvent(getElement("userProfile"), "click", function() {
    const currentUser = getCurrentUser();

    if (!currentUser) return;

    alert(
        "MY PROFILE\n\n" +
        "Name: " + currentUser.name + "\n" +
        "Email: " + currentUser.email + "\n" +
        "Role: " + formatRole(currentUser.role)
    );
});

/* =========================================
   32. AUTOMATIC SESSION RESTORE
   ========================================= */

function restoreSession() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        showLoginPage();
        return;
    }

    const users = getData(STORAGE.users, []);

    const userExists = users.find(
        user => user.id === currentUser.id
    );

    if (!userExists) {
        localStorage.removeItem(STORAGE.currentUser);
        showLoginPage();
        return;
    }

    startUserSession(userExists);
}

/* =========================================
   33. APPLICATION START
   ========================================= */

initializeApp();
restoreSession();

console.log(
    "SchoolPro School Management System initialized successfully!"
);

/* ==========================================
   SCHOOLPRO - ALL REMAINING MODULES
   Teachers, Classes, Attendance, Grades,
   Timetable, Exams, Fees, Parents, Reports
========================================== */

(function () {
    "use strict";

    const SUBJECTS = [
        "Mathematics",
        "Science",
        "English",
        "Social Studies",
        "Computer Science",
        "Arts",
        "Physical Education"
    ];

    const FEE_CATEGORIES = [
        "Tuition Fee",
        "Transport Fee",
        "Library Fee",
        "Sports Fee",
        "Examination Fee"
    ];

    const MODULES = {
        teachers: {
            title: "Teacher Management",
            key: "schoolpro_teachers",
            fields: [
                ["name", "Teacher Name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["subject", "Subject"],
                ["qualification", "Qualification"],
                ["joiningDate", "Joining Date"]
            ]
        },
        classes: {
            title: "Class & Section Management",
            key: "schoolpro_classes",
            fields: [
                ["className", "Class"],
                ["section", "Section"],
                ["room", "Room Number"],
                ["classTeacher", "Class Teacher"],
                ["capacity", "Student Capacity"]
            ]
        },
        attendance: {
            title: "Attendance Management",
            key: "schoolpro_attendance",
            fields: [
                ["student", "Student Name"],
                ["className", "Class"],
                ["section", "Section"],
                ["date", "Date"],
                ["status", "Status"]
            ]
        },
        grades: {
            title: "Grade Management",
            key: "schoolpro_grades",
            fields: [
                ["student", "Student Name"],
                ["className", "Class"],
                ["subject", "Subject"],
                ["exam", "Exam"],
                ["marks", "Marks"],
                ["total", "Total Marks"]
            ]
        },
        timetable: {
            title: "Timetable Management",
            key: "schoolpro_timetable",
            fields: [
                ["className", "Class"],
                ["section", "Section"],
                ["day", "Day"],
                ["time", "Time"],
                ["subject", "Subject"],
                ["teacher", "Teacher"]
            ]
        },
        exams: {
            title: "Exam Schedule",
            key: "schoolpro_exams",
            fields: [
                ["examName", "Exam Name"],
                ["className", "Class"],
                ["subject", "Subject"],
                ["date", "Exam Date"],
                ["time", "Exam Time"],
                ["room", "Room"]
            ]
        },
        fees: {
            title: "Fee Management",
            key: "schoolpro_fees",
            fields: [
                ["student", "Student Name"],
                ["className", "Class"],
                ["category", "Fee Category"],
                ["amount", "Amount"],
                ["paid", "Paid Amount"],
                ["dueDate", "Due Date"],
                ["status", "Payment Status"]
            ]
        },
        parents: {
            title: "Parent Communication",
            key: "schoolpro_messages",
            fields: [
                ["parent", "Parent Name"],
                ["student", "Student Name"],
                ["email", "Parent Email"],
                ["subject", "Message Subject"],
                ["message", "Message"],
                ["date", "Date"]
            ]
        }
    };

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const escapeHTML = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);

    function read(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    }

    function save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getCurrentRole() {
        try {
            return JSON.parse(
                localStorage.getItem("schoolpro_current_user")
            )?.role || "admin";
        } catch {
            return "admin";
        }
    }

    function getLinkedStudent() {
        const currentUser = JSON.parse(
            localStorage.getItem("schoolpro_current_user") || "{}"
        );
        const students = read("schoolpro_students");
        return students.find(student =>
            student.id === currentUser.studentId ||
            String(student.email || "").toLowerCase() ===
                String(currentUser.email || "").toLowerCase()
        );
    }

    function isAdmin() {
        return getCurrentRole() === "admin";
    }

    function canManageModule(name) {
        const role = getCurrentRole();
        if (name === "parents") return role === "student";
        return role === "admin" || (
            role === "teacher" &&
            (name === "attendance" || name === "grades")
        ) || (
            role === "teacher" &&
            name === "fees"
        ) || (
            role === "student" &&
            (name === "parents" || name === "fees")
        );
    }

    function showNotice(message) {
        alert(message);
    }

    function modulePage(name) {
        return document.getElementById(name + "Page");
    }

    function makeButton(text, action, id, extraClass = "") {
        return `
            <button type="button"
                class="sp-action-btn ${extraClass}"
                data-action="${action}"
                data-module="${id || ""}">
                ${text}
            </button>
        `;
    }

    function createModuleLayout(name, config) {
        const page = modulePage(name);
        if (!page) return;

        if (name === "attendance") {
            page.innerHTML = `
                <div class="attendance-page">
                    <div class="attendance-heading">
                        <div>
                            <span class="sp-eyebrow">DAILY ATTENDANCE</span>
                            <h2>Attendance Management</h2>
                            <p>Select a class and section to view students and mark attendance.</p>
                        </div>
                    </div>
                    <div class="attendance-controls">
                        <div class="form-group">
                            <label for="attendanceClass">Class</label>
                            <select id="attendanceClass">
                                <option value="">Select class</option>
                                ${[1,2,3,4,5,6,7,8,9,10].map(value =>
                                    `<option value="${value}">Class ${value}</option>`
                                ).join("")}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="attendanceSection">Section</label>
                            <select id="attendanceSection">
                                <option value="">Select section</option>
                                <option value="A">Section A</option>
                                <option value="B">Section B</option>
                                <option value="C">Section C</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="attendanceDate">Date</label>
                            <input type="date" id="attendanceDate">
                        </div>
                    </div>
                    <div class="attendance-panel">
                        <div class="attendance-panel-heading">
                            <div>
                                <h3>Student Attendance</h3>
                                <p id="attendanceSelectionText">Select class, section and date.</p>
                            </div>
                        </div>
                        <div class="table-wrapper">
                            <table class="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Student ID</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="attendanceStudentBody"></tbody>
                            </table>
                        </div>
                        <p class="attendance-empty" id="attendanceEmpty">
                            Select a class and section to load students.
                        </p>
                    </div>
                </div>
            `;

            const attendanceDate = document.getElementById("attendanceDate");
            if (attendanceDate) {
                attendanceDate.value = new Date().toISOString().slice(0, 10);
            }
            renderAttendance();
            return;
        }

        page.innerHTML = `
            <div class="sp-module">

                <div class="sp-module-heading">
                    <div>
                        <span class="sp-eyebrow">SCHOOLPRO MANAGEMENT</span>
                        <h2>${config.title}</h2>
                        <p>Manage and organize your school records.</p>
                    </div>

                    <div class="sp-heading-actions">
                        ${makeButton("Export CSV", "export", name, "sp-secondary")}
                        ${canManageModule(name) ? makeButton(
                            getCurrentRole() === "student" && name === "fees"
                                ? "Pay Fee Online"
                                : "+ Add New",
                            "add",
                            name,
                            "sp-primary"
                        ) : ""}
                    </div>
                </div>

                <div class="sp-stats">
                    <div class="sp-stat">
                        <span>Total Records</span>
                        <strong id="${name}Total">0</strong>
                    </div>
                    <div class="sp-stat">
                        <span>Recently Added</span>
                        <strong id="${name}Recent">0</strong>
                    </div>
                    <div class="sp-stat">
                        <span>Last Updated</span>
                        <strong id="${name}Updated">—</strong>
                    </div>
                </div>

                <div class="sp-panel">
                    <div class="sp-panel-top">
                        <div>
                            <h3>${config.title} Records</h3>
                            <p>Search and manage saved information.</p>
                        </div>
                        <input type="search"
                            class="sp-search"
                            placeholder="Search records..."
                            id="${name}Search">
                    </div>

                    <div class="sp-table-wrap">
                        <table class="sp-table">
                            <thead>
                                <tr>
                                    ${config.fields.map(field =>
                                        `<th>${escapeHTML(field[1])}</th>`
                                    ).join("")}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="${name}Body"></tbody>
                        </table>
                    </div>

                    <p class="sp-empty hidden" id="${name}Empty">
                        No records found. Add your first record to get started.
                    </p>
                </div>

                <div class="sp-modal hidden" id="${name}Modal">
                    <div class="sp-modal-card">
                        <div class="sp-modal-heading">
                            <div>
                                <h3 id="${name}ModalTitle">Add Record</h3>
                                <p>Enter the required information below.</p>
                            </div>
                            <button type="button"
                                class="sp-modal-close"
                                data-action="close"
                                data-module="${name}">&times;</button>
                        </div>

                        <form id="${name}Form">
                            <input type="hidden" name="recordId">

                            <div class="sp-form-grid">
                                ${config.fields.map(field => `
                                    <div class="sp-field">
                                        <label>${escapeHTML(field[1])}</label>
                                        ${field[0] === "subject"
                                            ? `<select name="subject" required>
                                                <option value="">Select subject</option>
                                                ${SUBJECTS.map(subject => `<option value="${subject}">${subject}</option>`).join("")}
                                            </select>`
                                            : field[0] === "category"
                                                ? `<select name="category" required>
                                                    <option value="">Select fee category</option>
                                                    ${FEE_CATEGORIES.map(category => `<option value="${category}">${category}</option>`).join("")}
                                                </select>`
                                                : field[0] === "status"
                                                    ? `<select name="status" required>
                                                        <option value="Unpaid">Unpaid</option>
                                                        <option value="Paid">Paid</option>
                                                    </select>`
                                                    : `<input
                                                        name="${escapeHTML(field[0])}"
                                                        type="${field[0].toLowerCase().includes("date") ? "date" : "text"}"
                                                        placeholder="Enter ${escapeHTML(field[1].toLowerCase())}"
                                                        required>`}
                                    </div>
                                `).join("")}
                            </div>

                            <div class="sp-modal-buttons">
                                <button type="button"
                                    class="sp-action-btn sp-secondary"
                                    data-action="close"
                                    data-module="${name}">Cancel</button>

                                <button type="submit"
                                    class="sp-action-btn sp-primary">Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        `;

        renderModule(name);
    }

    function renderModule(name) {
        const config = MODULES[name];
        if (!config) return;

        if (name === "attendance") {
            renderAttendance();
            return;
        }

        let records = read(config.key);
        const body = document.getElementById(name + "Body");
        const search = document.getElementById(name + "Search");
        const empty = document.getElementById(name + "Empty");

        if (!body) return;

        const query = (search?.value || "").toLowerCase();

        const role = getCurrentRole();
        const linkedStudent = getLinkedStudent();

        if (role === "student" && linkedStudent) {
            records = records.filter(record => {
                const studentName = String(record.student || "").toLowerCase();
                const recordStudentId = String(record.studentId || "");
                const matchesStudent = recordStudentId === linkedStudent.id ||
                    studentName === String(linkedStudent.name || "").toLowerCase();

                if (["grades", "fees", "attendance"].includes(name) && matchesStudent) {
                    return true;
                }

                if (["timetable", "exams"].includes(name)) {
                    return String(record.className || "") === String(linkedStudent.className || "") &&
                        String(record.section || "") === String(linkedStudent.section || "");
                }

                if (name === "parents") {
                    const user = JSON.parse(localStorage.getItem("schoolpro_current_user") || "{}");
                    return String(record.email || "").toLowerCase() === String(user.email || "").toLowerCase() ||
                        matchesStudent;
                }

                return false;
            });
        }

        const filtered = records.filter(record =>
            config.fields.some(field =>
                String(record[field[0]] || "")
                    .toLowerCase()
                    .includes(query)
            )
        );

        body.innerHTML = filtered.map(record => `
            <tr>
                ${config.fields.map(field =>
                    `<td>${escapeHTML(record[field[0]] || "—")}</td>`
                ).join("")}

                <td class="sp-actions">
                    ${canManageModule(name) ? `
                        <button type="button"
                            data-action="edit"
                            data-module="${name}"
                            data-id="${escapeHTML(record.id)}"
                            title="Edit">Edit</button>
                        <button type="button"
                            class="sp-delete"
                            data-action="delete"
                            data-module="${name}"
                            data-id="${escapeHTML(record.id)}"
                            title="Delete">Delete</button>
                    ` : ""}
                </td>
            </tr>
        `).join("");

        if (empty) {
            empty.classList.toggle("hidden", filtered.length > 0);
        }

        const total = document.getElementById(name + "Total");
        const recent = document.getElementById(name + "Recent");
        const updated = document.getElementById(name + "Updated");

        if (total) total.textContent = records.length;
        if (recent) recent.textContent = records.filter(
            item => Date.now() - (item.createdAt || 0) < 86400000
        ).length;

        if (updated) {
            updated.textContent = records.length
                ? new Date(records[records.length - 1].createdAt || Date.now())
                    .toLocaleDateString()
                : "—";
        }
    }

    function renderAttendance() {
        const role = getCurrentRole();
        const linkedStudent = getLinkedStudent();
        if (role === "student" && linkedStudent) {
            const records = read(MODULES.attendance.key).filter(record =>
                record.studentId === linkedStudent.id ||
                String(record.student || "").toLowerCase() === String(linkedStudent.name || "").toLowerCase()
            );
            const body = document.getElementById("attendanceStudentBody");
            const empty = document.getElementById("attendanceEmpty");
            const selectionText = document.getElementById("attendanceSelectionText");
            const controls = document.querySelector(".attendance-controls");
            if (controls) controls.classList.add("hidden");
            if (selectionText) {
                selectionText.textContent =
                    `Class ${linkedStudent.className}-${linkedStudent.section}`;
            }
            if (!body || !empty) return;

            body.innerHTML = records.map(record => `
                <tr>
                    <td>${escapeHTML(record.student || linkedStudent.name)}</td>
                    <td>${escapeHTML(record.date || "—")}</td>
                    <td>${escapeHTML(record.status || "Not marked")}</td>
                </tr>
            `).join("");
            empty.classList.toggle("hidden", records.length > 0);
            if (!records.length) empty.textContent = "No attendance records found for your account.";
            return;
        }

        const className = document.getElementById("attendanceClass")?.value || "";
        const section = document.getElementById("attendanceSection")?.value || "";
        const date = document.getElementById("attendanceDate")?.value || "";
        const body = document.getElementById("attendanceStudentBody");
        const empty = document.getElementById("attendanceEmpty");
        const selectionText = document.getElementById("attendanceSelectionText");
        if (!body || !empty) return;

        if (!className || !section) {
            body.innerHTML = "";
            empty.classList.remove("hidden");
            empty.textContent = "Select a class and section to load students.";
            if (selectionText) selectionText.textContent = "Select class, section and date.";
            return;
        }

        const students = read("schoolpro_students").filter(student =>
            String(student.className || "") === className &&
            String(student.section || "") === section &&
            student.status !== "Inactive"
        );

        if (selectionText) {
            selectionText.textContent = `Class ${className}-${section}${date ? ` | ${date}` : ""}`;
        }

        empty.classList.toggle("hidden", students.length > 0);
        if (!students.length) {
            empty.textContent = "No active students found for this class and section.";
            body.innerHTML = "";
            return;
        }

        const records = read(MODULES.attendance.key);
        const teacherCanMark = getCurrentRole() === "teacher";

        body.innerHTML = students.map(student => {
            const saved = records.find(record =>
                record.studentId === student.id &&
                record.className === className &&
                record.section === section &&
                record.date === date
            );
            const status = saved?.status || "Not marked";
            const buttons = teacherCanMark ? `
                <button type="button" class="attendance-status present ${status === "Present" ? "selected" : ""}"
                    data-action="attendance-status" data-student-id="${escapeHTML(student.id)}"
                    data-status="Present">Present</button>
                <button type="button" class="attendance-status absent ${status === "Absent" ? "selected" : ""}"
                    data-action="attendance-status" data-student-id="${escapeHTML(student.id)}"
                    data-status="Absent">Absent</button>
            ` : "";

            return `<tr>
                <td>${escapeHTML(student.name || "—")}</td>
                <td>${escapeHTML(student.id || "—")}</td>
                <td>
                    <span class="attendance-current-status ${String(status).toLowerCase().replace(" ", "-")}">${escapeHTML(status)}</span>
                    ${buttons}
                </td>
            </tr>`;
        }).join("");
    }

    function openModuleForm(name, record = null) {
        const config = MODULES[name];
        const modal = document.getElementById(name + "Modal");
        const form = document.getElementById(name + "Form");

        if (!config || !modal || !form) return;

        form.reset();
        form.elements.recordId.value = record?.id || "";

        config.fields.forEach(field => {
            const input = form.elements[field[0]];
            if (input) input.value = record?.[field[0]] || "";
        });

        const title = document.getElementById(name + "ModalTitle");
        if (title) {
            title.textContent = record ? "Edit Record" : "Add New Record";
        }

        modal.classList.remove("hidden");
    }

    function closeModuleForm(name) {
        document.getElementById(name + "Modal")
            ?.classList.add("hidden");
    }

    function saveModuleForm(name, form) {
        const config = MODULES[name];
        if (!config) return;
        if (!canManageModule(name)) {
            showNotice("You do not have permission to manage this section.");
            return;
        }

        const formData = new FormData(form);
        const id = formData.get("recordId");
        const records = read(config.key);

        const record = {
            id: id || name.toUpperCase() + Date.now(),
            createdAt: Date.now()
        };

        config.fields.forEach(field => {
            record[field[0]] = String(formData.get(field[0]) || "").trim();
        });

        if (id) {
            const index = records.findIndex(item => item.id === id);
            if (index !== -1) {
                record.createdAt = records[index].createdAt || Date.now();
                records[index] = record;
            }
        } else {
            records.push(record);
        }

        save(config.key, records);
        closeModuleForm(name);
        renderModule(name);
        updateSchoolProReport();

        showNotice(id ? "Record updated successfully." : "Record added successfully.");
    }

    function deleteModuleRecord(name, id) {
        const config = MODULES[name];
        if (!config || !canManageModule(name)) return;

        if (!confirm("Are you sure you want to delete this record?")) return;

        const records = read(config.key).filter(item => item.id !== id);
        save(config.key, records);
        renderModule(name);
        updateSchoolProReport();
    }

    function exportModule(name) {
        const config = MODULES[name];
        if (!config) return;

        const records = read(config.key);
        if (!records.length) {
            showNotice("There are no records to export yet.");
            return;
        }

        const headings = config.fields.map(field => field[1]);

        const rows = records.map(record =>
            config.fields.map(field =>
                `"${String(record[field[0]] || "").replace(/"/g, '""')}"`
            )
        );

        const csv = [headings, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "SchoolPro-" + name + ".csv";
        link.click();

        URL.revokeObjectURL(url);
    }

    function createReportsPage() {
        const page = modulePage("reports");
        if (!page) return;

        page.innerHTML = `
            <div class="sp-module">
                <div class="sp-module-heading">
                    <div>
                        <span class="sp-eyebrow">SCHOOL ANALYTICS</span>
                        <h2>Reports & Analytics</h2>
                        <p>Overview of school records stored in this browser.</p>
                    </div>
                    <button class="sp-action-btn sp-primary"
                        data-action="export-all">Export Summary</button>
                </div>

                <div class="sp-report-grid" id="spReportGrid"></div>

                <div class="sp-panel">
                    <h3>Report Information</h3>
                    <p class="sp-report-note">
                        These reports are calculated from records entered in SchoolPro.
                        They are demo summaries and are not connected to a school server.
                    </p>
                    <div id="spReportDetails"></div>
                </div>
            </div>
        `;

        updateSchoolProReport();
    }

    function updateSchoolProReport() {
        const grid = document.getElementById("spReportGrid");
        if (!grid) return;

        const counts = [
            ["Students", read("schoolpro_students").length],
            ["Teachers", read(MODULES.teachers.key).length],
            ["Classes", read(MODULES.classes.key).length],
            ["Attendance Records", read(MODULES.attendance.key).length],
            ["Grade Records", read(MODULES.grades.key).length],
            ["Timetable Entries", read(MODULES.timetable.key).length],
            ["Scheduled Exams", read(MODULES.exams.key).length],
            ["Fee Records", read(MODULES.fees.key).length],
            ["Parent Messages", read(MODULES.parents.key).length]
        ];

        grid.innerHTML = counts.map(item => `
            <div class="sp-report-card">
                <span>${item[0]}</span>
                <strong>${item[1]}</strong>
            </div>
        `).join("");

        const fees = read(MODULES.fees.key);
        const totalFees = fees.reduce((sum, item) =>
            sum + (Number(item.amount) || 0), 0
        );
        const totalPaid = fees.reduce((sum, item) =>
            sum + (Number(item.paid) || 0), 0
        );

        const details = document.getElementById("spReportDetails");
        if (details) {
            details.innerHTML = `
                <div class="sp-report-summary">
                    <p><strong>Total Fee Amount:</strong> ₹${totalFees.toLocaleString("en-IN")}</p>
                    <p><strong>Total Paid:</strong> ₹${totalPaid.toLocaleString("en-IN")}</p>
                    <p><strong>Outstanding:</strong> ₹${Math.max(0, totalFees - totalPaid).toLocaleString("en-IN")}</p>
                </div>
            `;
        }
    }

    function exportAllReports() {
        const rows = [
            ["SchoolPro Report", "Total Records"],
            ["Students", read("schoolpro_students").length],
            ["Teachers", read(MODULES.teachers.key).length],
            ["Classes", read(MODULES.classes.key).length],
            ["Attendance", read(MODULES.attendance.key).length],
            ["Grades", read(MODULES.grades.key).length],
            ["Timetable", read(MODULES.timetable.key).length],
            ["Exams", read(MODULES.exams.key).length],
            ["Fees", read(MODULES.fees.key).length],
            ["Parent Messages", read(MODULES.parents.key).length]
        ];

        const csv = rows.map(row => row.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "SchoolPro-Complete-Report.csv";
        link.click();

        URL.revokeObjectURL(url);
    }

    function bindModuleEvents() {
        document.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) return;

            const action = button.dataset.action;
            const name = button.dataset.module;
            const id = button.dataset.id;

            if (action === "add") {
                if (!canManageModule(name)) {
                    return showNotice("You do not have permission to add records in this section.");
                }
                openModuleForm(name);
            }

            if (action === "close") closeModuleForm(name);

            if (action === "edit") {
                const config = MODULES[name];
                if (!canManageModule(name)) {
                    return showNotice("You do not have permission to edit records in this section.");
                }
                const record = read(config.key).find(item => item.id === id);
                if (record) openModuleForm(name, record);
            }

            if (action === "delete") deleteModuleRecord(name, id);

            if (action === "export") exportModule(name);

            if (action === "export-all") exportAllReports();
            if (action === "attendance-status") {
                if (getCurrentRole() !== "teacher") {
                    return showNotice("Only teachers can mark attendance.");
                }

                const studentId = button.dataset.studentId;
                const status = button.dataset.status;
                const student = read("schoolpro_students").find(item => item.id === studentId);
                const className = document.getElementById("attendanceClass")?.value || "";
                const section = document.getElementById("attendanceSection")?.value || "";
                const date = document.getElementById("attendanceDate")?.value || "";
                if (!student || !className || !section || !date) return;

                const records = read(MODULES.attendance.key);
                const existingIndex = records.findIndex(record =>
                    record.studentId === studentId && record.date === date
                );
                const record = {
                    id: existingIndex >= 0 ? records[existingIndex].id : "ATT" + Date.now(),
                    studentId,
                    student: student.name,
                    className,
                    section,
                    date,
                    status,
                    markedAt: new Date().toISOString()
                };

                if (existingIndex >= 0) records[existingIndex] = record;
                else records.push(record);

                save(MODULES.attendance.key, records);
                renderAttendance();
            }
        });

        ["attendanceClass", "attendanceSection", "attendanceDate"].forEach(id => {
            document.getElementById(id)?.addEventListener("change", renderAttendance);
        });

        document.addEventListener("submit", event => {
            const form = event.target;
            const name = Object.keys(MODULES).find(
                key => form.id === key + "Form"
            );

            if (!name) return;

            event.preventDefault();
            saveModuleForm(name, form);
        });

        Object.keys(MODULES).forEach(name => {
            document.getElementById(name + "Search")
                ?.addEventListener("input", () => renderModule(name));
        });
    }

    function initializeSchoolProModules() {
        Object.entries(MODULES).forEach(([name, config]) => {
            createModuleLayout(name, config);
        });

        createReportsPage();
        bindModuleEvents();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeSchoolProModules);
    } else {
        initializeSchoolProModules();
    }

})();
