let programs = [];

document.addEventListener("DOMContentLoaded", async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    await loadUser(session.user);
    await loadPrograms();

    document
        .getElementById("programForm")
        .addEventListener("submit", saveProgram);
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


async function loadPrograms() {

    const { data, error } = await supabaseClient
        .from("scholarship_programs")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        document.getElementById("programTable").innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        Unable to load programs.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    programs = data || [];

    renderPrograms();
}


function renderPrograms() {

    const table =
        document.getElementById("programTable");


    if (!programs.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        No scholarship programs yet.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = programs.map(program => {

        return `
            <tr>

                <td>
                    <strong>
                        ${escapeHtml(program.program_name)}
                    </strong>
                </td>

                <td>
                    ${program.required_gwa}
                </td>

                <td>
                    ${program.min_units}
                </td>

                <td>
                    ${
                        program.allow_failing_grade
                            ? `<span class="badge badge-compliant">Allowed</span>`
                            : `<span class="badge badge-deficiency">Not Allowed</span>`
                    }
                </td>

                <td>

                    ${
                        program.active
                            ? `<span class="badge badge-active">Active</span>`
                            : `<span class="badge badge-deficiency">Inactive</span>`
                    }

                </td>

                <td>

                    <button
                        class="btn btn-secondary"
                        onclick="editProgram(${program.id})"
                    >
                        Edit
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


function openProgramModal() {

    document.getElementById("programModalTitle").textContent =
        "Add Scholarship Program";

    document.getElementById("programForm").reset();

    document.getElementById("programId").value = "";

    document.getElementById("programMessage").textContent = "";

    document
        .getElementById("programModal")
        .classList.add("show");
}


function closeProgramModal() {

    document
        .getElementById("programModal")
        .classList.remove("show");
}


function editProgram(id) {

    const program =
        programs.find(item => item.id === id);

    if (!program) return;


    document.getElementById("programModalTitle").textContent =
        "Edit Scholarship Program";

    document.getElementById("programId").value =
        program.id;

    document.getElementById("programName").value =
        program.program_name;

    document.getElementById("requiredGwa").value =
        program.required_gwa;

    document.getElementById("minUnits").value =
        program.min_units;

    document.getElementById("allowFailing").value =
        String(program.allow_failing_grade);

    document.getElementById("programActive").value =
        String(program.active);

    document.getElementById("programMessage").textContent = "";

    document
        .getElementById("programModal")
        .classList.add("show");
}


async function saveProgram(event) {

    event.preventDefault();


    const message =
        document.getElementById("programMessage");


    const name =
        document.getElementById("programName")
            .value
            .trim();

    const gwa =
        Number(
            document.getElementById("requiredGwa").value
        );

    const units =
        Number(
            document.getElementById("minUnits").value
        );

    const allowFailing =
        document.getElementById("allowFailing").value === "true";

    const active =
        document.getElementById("programActive").value === "true";

    const id =
        document.getElementById("programId").value;


    if (!name) {

        message.textContent =
            "Program name is required.";

        message.style.color = "#dc2626";

        return;
    }


    if (gwa < 1 || gwa > 5) {

        message.textContent =
            "GWA must be between 1.00 and 5.00.";

        message.style.color = "#dc2626";

        return;
    }


    if (units < 0) {

        message.textContent =
            "Units cannot be negative.";

        message.style.color = "#dc2626";

        return;
    }


    const record = {

        program_name: name,
        required_gwa: gwa,
        min_units: units,
        allow_failing_grade: allowFailing,
        active: active

    };


    let result;


    if (id) {

        result = await supabaseClient
            .from("scholarship_programs")
            .update(record)
            .eq("id", id);

    } else {

        result = await supabaseClient
            .from("scholarship_programs")
            .insert([record]);

    }


    if (result.error) {

        message.textContent =
            result.error.message;

        message.style.color = "#dc2626";

        return;
    }


    message.textContent =
        "Scholarship program saved.";

    message.style.color = "#16a34a";


    await loadPrograms();


    setTimeout(() => {

        closeProgramModal();

    }, 600);
}


async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}