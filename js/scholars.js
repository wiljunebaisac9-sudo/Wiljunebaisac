let scholars = [];
let scholarships = [];

document.addEventListener("DOMContentLoaded", async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    await loadUser(session.user);
    await loadScholarships();
    await loadScholars();

    document
        .getElementById("scholarForm")
        .addEventListener("submit", saveScholar);

    document
        .getElementById("searchInput")
        .addEventListener("input", renderScholars);

    document
        .getElementById("statusFilter")
        .addEventListener("change", renderScholars);

    document
        .getElementById("scholarshipFilter")
        .addEventListener("change", renderScholars);
});


/* =========================
   USER
========================= */

async function loadUser(user) {

    const { data } = await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

    if (data) {

        document.getElementById("userName").textContent =
            data.full_name || "User";

        document.querySelector(".user-avatar").textContent =
            (data.full_name || "U")
                .charAt(0)
                .toUpperCase();
    }
}


/* =========================
   SCHOLARSHIPS
========================= */

async function loadScholarships() {

    const { data, error } = await supabaseClient
        .from("scholarship_programs")
        .select("*")
        .eq("active", true)
        .order("program_name");

    if (error) {

        console.error(error);

        alert("Unable to load scholarship programs.");

        return;
    }

    scholarships = data || [];

    const scholarshipSelect =
        document.getElementById("scholarshipId");

    const scholarshipFilter =
        document.getElementById("scholarshipFilter");


    scholarships.forEach(program => {

        scholarshipSelect.innerHTML += `
            <option value="${program.id}">
                ${escapeHtml(program.program_name)}
            </option>
        `;

        scholarshipFilter.innerHTML += `
            <option value="${program.id}">
                ${escapeHtml(program.program_name)}
            </option>
        `;

    });
}


/* =========================
   LOAD SCHOLARS
========================= */

async function loadScholars() {

    const { data, error } = await supabaseClient
        .from("scholars")
        .select(`
            *,
            scholarship_programs (
                program_name
            )
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        document.getElementById("scholarsTable").innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        Unable to load scholars.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    scholars = data || [];

    renderScholars();
}


/* =========================
   RENDER
========================= */

function renderScholars() {

    const search =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();

    const status =
        document.getElementById("statusFilter").value;

    const scholarship =
        document.getElementById("scholarshipFilter").value;


    const filtered = scholars.filter(scholar => {

        const matchesSearch =
            !search ||
            scholar.student_id
                .toLowerCase()
                .includes(search) ||
            scholar.full_name
                .toLowerCase()
                .includes(search);

        const matchesStatus =
            !status ||
            scholar.status === status;

        const matchesScholarship =
            !scholarship ||
            String(scholar.scholarship_id) === String(scholarship);

        return (
            matchesSearch &&
            matchesStatus &&
            matchesScholarship
        );
    });


    document.getElementById("scholarCount").textContent =
        `${filtered.length} Scholar${filtered.length === 1 ? "" : "s"}`;


    const table =
        document.getElementById("scholarsTable");


    if (!filtered.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">

                        <div class="empty-state-icon">
                            ♙
                        </div>

                        No scholars found.

                    </div>
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = filtered.map(scholar => {

        const statusClass =
            getStatusClass(scholar.status);

        const scholarshipName =
            scholar.scholarship_programs?.program_name ||
            "Not Assigned";


        return `
            <tr>

                <td>
                    <strong>
                        ${escapeHtml(scholar.student_id)}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(scholar.full_name)}
                </td>

                <td>
                    ${escapeHtml(scholar.degree_program)}
                </td>

                <td>
                    Year ${scholar.year_level}
                </td>

                <td>
                    ${escapeHtml(scholarshipName)}
                </td>

                <td>

                    <span class="badge ${statusClass}">
                        ${escapeHtml(scholar.status)}
                    </span>

                </td>

                <td>

                    <button
                        class="btn btn-secondary"
                        onclick="editScholar(${scholar.id})"
                    >
                        Edit
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


/* =========================
   ADD / EDIT MODAL
========================= */

function openScholarModal() {

    document.getElementById("modalTitle").textContent =
        "Add Scholar";

    document.getElementById("scholarForm").reset();

    document.getElementById("scholarId").value = "";

    document.getElementById("formMessage").textContent = "";

    document
        .getElementById("scholarModal")
        .classList.add("show");
}


function closeScholarModal() {

    document
        .getElementById("scholarModal")
        .classList.remove("show");
}


function editScholar(id) {

    const scholar =
        scholars.find(item => item.id === id);

    if (!scholar) return;


    document.getElementById("modalTitle").textContent =
        "Edit Scholar";

    document.getElementById("scholarId").value =
        scholar.id;

    document.getElementById("studentId").value =
        scholar.student_id;

    document.getElementById("fullName").value =
        scholar.full_name;

    document.getElementById("degreeProgram").value =
        scholar.degree_program;

    document.getElementById("yearLevel").value =
        scholar.year_level;

    document.getElementById("scholarshipId").value =
        scholar.scholarship_id || "";

    document.getElementById("scholarStatus").value =
        scholar.status;

    document.getElementById("formMessage").textContent = "";

    document
        .getElementById("scholarModal")
        .classList.add("show");
}


/* =========================
   SAVE
========================= */

async function saveScholar(event) {

    event.preventDefault();


    const message =
        document.getElementById("formMessage");


    const studentId =
        document.getElementById("studentId")
            .value
            .trim();

    const fullName =
        document.getElementById("fullName")
            .value
            .trim();

    const degreeProgram =
        document.getElementById("degreeProgram")
            .value
            .trim();

    const yearLevel =
        document.getElementById("yearLevel")
            .value;

    const scholarshipId =
        document.getElementById("scholarshipId")
            .value;

    const status =
        document.getElementById("scholarStatus")
            .value;

    const scholarId =
        document.getElementById("scholarId")
            .value;


    if (!studentId) {

        message.textContent =
            "Student ID is required.";

        message.style.color = "#dc2626";

        return;
    }


    if (!fullName) {

        message.textContent =
            "Full Name is required.";

        message.style.color = "#dc2626";

        return;
    }


    if (!degreeProgram) {

        message.textContent =
            "Degree Program is required.";

        message.style.color = "#dc2626";

        return;
    }


    if (!yearLevel) {

        message.textContent =
            "Please select year level.";

        message.style.color = "#dc2626";

        return;
    }


    if (!scholarshipId) {

        message.textContent =
            "Please select a scholarship.";

        message.style.color = "#dc2626";

        return;
    }


    const record = {

        student_id: studentId,
        full_name: fullName,
        degree_program: degreeProgram,
        year_level: Number(yearLevel),
        scholarship_id: Number(scholarshipId),
        status: status

    };


    message.textContent = "Saving...";
    message.style.color = "#64748b";


    let result;


    if (scholarId) {

        result = await supabaseClient
            .from("scholars")
            .update(record)
            .eq("id", scholarId);

    } else {

        result = await supabaseClient
            .from("scholars")
            .insert([record]);

    }


    if (result.error) {

        console.error(result.error);

        message.textContent =
            result.error.message;

        message.style.color = "#dc2626";

        return;
    }


    message.textContent =
        "Scholar saved successfully.";

    message.style.color = "#16a34a";


    await loadScholars();


    setTimeout(() => {

        closeScholarModal();

    }, 600);
}


/* =========================
   STATUS CLASS
========================= */

function getStatusClass(status) {

    const classes = {

        "Active": "badge-active",

        "Pending Submission":
            "badge-pending",

        "For Verification":
            "badge-for-verification",

        "Compliant":
            "badge-compliant",

        "With Deficiency":
            "badge-deficiency",

        "Probationary":
            "badge-probationary",

        "For Renewal":
            "badge-for-renewal",

        "Renewed":
            "badge-renewed",

        "Disqualified":
            "badge-disqualified"

    };

    return classes[status] || "badge-active";
}


/* =========================
   LOGOUT
========================= */

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";
}


/* =========================
   SECURITY HELPER
========================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}