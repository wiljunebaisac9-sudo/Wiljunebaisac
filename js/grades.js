let gradeRecords = [];
let scholarList = [];

document.addEventListener("DOMContentLoaded", async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    await loadUser(session.user);
    await loadScholars();
    await loadGrades();

    document
        .getElementById("gradeForm")
        .addEventListener("submit", submitGrades);

    document
        .getElementById("gradeStatusFilter")
        .addEventListener("change", renderGrades);
});


async function loadUser(user) {

    const { data } = await supabaseClient
        .from("profiles")
        .select("full_name")
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


async function loadScholars() {

    const { data, error } = await supabaseClient
        .from("scholars")
        .select("id, student_id, full_name")
        .order("full_name");

    if (error) {

        console.error(error);

        return;
    }

    scholarList = data || [];

    const select =
        document.getElementById("gradeScholar");

    scholarList.forEach(scholar => {

        select.innerHTML += `
            <option value="${scholar.id}">
                ${escapeHtml(scholar.student_id)}
                - ${escapeHtml(scholar.full_name)}
            </option>
        `;

    });
}


async function loadGrades() {

    const { data, error } = await supabaseClient
        .from("grade_submissions")
        .select(`
            *,
            scholars (
                student_id,
                full_name
            )
        `)
        .order("submitted_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        return;
    }

    gradeRecords = data || [];

    renderGrades();
}


function renderGrades() {

    const filter =
        document.getElementById("gradeStatusFilter").value;

    const filtered =
        gradeRecords.filter(item =>
            !filter ||
            item.submission_status === filter
        );


    const table =
        document.getElementById("gradesTable");


    if (!filtered.length) {

        table.innerHTML = `
            <tr>
                <td colspan="9">

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            ▤
                        </div>

                        No grade submissions found.

                    </div>

                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        filtered.map(item => {

            const statusClass =
                item.submission_status === "Verified"
                    ? "badge-verified"
                    : "badge-pending";


            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                item.scholars?.full_name || "Unknown"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(item.academic_year)}
                    </td>

                    <td>
                        ${escapeHtml(item.semester)}
                    </td>

                    <td>
                        ${item.gwa}
                    </td>

                    <td>
                        ${item.units_enrolled}
                    </td>

                    <td>
                        ${item.failed_subjects}
                    </td>

                    <td>
                        ${item.incomplete_subjects}
                    </td>

                    <td>

                        <span class="badge ${statusClass}">
                            ${escapeHtml(item.submission_status)}
                        </span>

                    </td>

                    <td>

                        ${
                            item.submission_status === "Pending"
                                ? `
                                    <button
                                        class="btn btn-success"
                                        onclick="verifyGrade(${item.id})"
                                    >
                                        Verify
                                    </button>
                                  `
                                : `
                                    <span style="color:#64748b;">
                                        Completed
                                    </span>
                                  `
                        }

                    </td>

                </tr>
            `;

        }).join("");
}


function openGradeModal() {

    document.getElementById("gradeForm").reset();

    document.getElementById("gradeMessage").textContent = "";

    document
        .getElementById("gradeModal")
        .classList.add("show");
}


function closeGradeModal() {

    document
        .getElementById("gradeModal")
        .classList.remove("show");
}


async function submitGrades(event) {

    event.preventDefault();


    const message =
        document.getElementById("gradeMessage");


    const scholarId =
        document.getElementById("gradeScholar").value;

    const academicYear =
        document.getElementById("academicYear").value.trim();

    const semester =
        document.getElementById("semester").value;

    const gwa =
        Number(document.getElementById("gwa").value);

    const units =
        Number(document.getElementById("unitsEnrolled").value);

    const failed =
        Number(document.getElementById("failedSubjects").value);

    const incomplete =
        Number(document.getElementById("incompleteSubjects").value);


    if (!scholarId) {

        message.textContent =
            "Please select a scholar.";

        message.style.color = "#dc2626";

        return;
    }


    if (gwa < 1 || gwa > 5) {

        message.textContent =
            "GWA must be between 1.00 and 5.00.";

        message.style.color = "#dc2626";

        return;
    }


    if (units < 0 || failed < 0 || incomplete < 0) {

        message.textContent =
            "Units and subject counts cannot be negative.";

        message.style.color = "#dc2626";

        return;
    }


    const record = {

        scholar_id: Number(scholarId),

        academic_year: academicYear,

        semester: semester,

        gwa: gwa,

        units_enrolled: units,

        failed_subjects: failed,

        incomplete_subjects: incomplete,

        submission_status: "Pending"

    };


    const { error } =
        await supabaseClient
            .from("grade_submissions")
            .insert([record]);


    if (error) {

        console.error(error);

        message.textContent =
            error.message;

        message.style.color = "#dc2626";

        return;
    }


    message.textContent =
        "Grade submission saved as Pending.";

    message.style.color = "#16a34a";


    await loadGrades();


    setTimeout(() => {

        closeGradeModal();

    }, 700);
}


/* =========================
   VERIFY
========================= */

async function verifyGrade(id) {

    const confirmed =
        confirm(
            "Verify this grade submission?"
        );

    if (!confirmed) return;


    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    if (!session) {

        window.location.href =
            "index.html";

        return;
    }


    const { error } =
        await supabaseClient
            .from("grade_submissions")
            .update({

                submission_status: "Verified",

                verified_by: session.user.id,

                verified_at: new Date().toISOString()

            })
            .eq("id", id);


    if (error) {

        alert(error.message);

        return;
    }


    alert(
        "Grade submission verified successfully."
    );


    await loadGrades();
}


async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href =
        "index.html";
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}