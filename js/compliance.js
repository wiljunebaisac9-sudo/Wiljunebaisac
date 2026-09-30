let complianceRecords = [];

document.addEventListener("DOMContentLoaded", async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    await loadUser(session.user);
    await loadCompliance();
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


async function loadCompliance() {

    const { data, error } = await supabaseClient
        .from("grade_submissions")
        .select(`
            *,
            scholars (
                id,
                student_id,
                full_name,
                scholarship_id,
                scholarship_programs (
                    program_name,
                    required_gwa,
                    min_units,
                    allow_failing_grade
                )
            )
        `)
        .eq("submission_status", "Verified")
        .order("verified_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        document.getElementById("complianceTable").innerHTML = `
            <tr>
                <td colspan="10">

                    <div class="empty-state">
                        Unable to load compliance records.
                    </div>

                </td>
            </tr>
        `;

        return;
    }


    complianceRecords = data || [];

    renderCompliance();
}


function renderCompliance() {

    const table =
        document.getElementById("complianceTable");


    if (!complianceRecords.length) {

        table.innerHTML = `
            <tr>

                <td colspan="10">

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            ✓
                        </div>

                        No verified submissions available
                        for compliance evaluation.

                    </div>

                </td>

            </tr>
        `;

        return;
    }


    table.innerHTML =
        complianceRecords.map(record => {


            const scholar =
                record.scholars;

            const program =
                scholar?.scholarship_programs;


            if (!scholar || !program) {
                return "";
            }


            /*
                IMPORTANT:
                This assumes LOWER GWA is better,
                which is common for a 1.00-best grading
                scale.

                Your laboratory says students should
                document/adapt the comparison direction
                to their institution's grading system.
            */

            const gwaPass =
                Number(record.gwa) <=
                Number(program.required_gwa);


            const unitsPass =
                Number(record.units_enrolled) >=
                Number(program.min_units);


            const failingPass =
                program.allow_failing_grade ||
                Number(record.failed_subjects) === 0;


            const compliant =
                gwaPass &&
                unitsPass &&
                failingPass;


            const result =
                compliant
                    ? "Compliant"
                    : "With Deficiency";


            const badge =
                compliant
                    ? "badge-compliant"
                    : "badge-deficiency";


            return `
                <tr>

                    <td>
                        ${escapeHtml(scholar.student_id)}
                    </td>

                    <td>
                        <strong>
                            ${escapeHtml(scholar.full_name)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(program.program_name)}
                    </td>

                    <td>
                        ${record.gwa}
                    </td>

                    <td>
                        ${program.required_gwa}
                    </td>

                    <td>
                        ${record.units_enrolled}
                    </td>

                    <td>
                        ${program.min_units}
                    </td>

                    <td>
                        ${record.failed_subjects}
                    </td>

                    <td>

                        <span class="badge ${badge}">
                            ${result}
                        </span>

                    </td>

                    <td>

                        <button
                            class="btn ${
                                compliant
                                    ? "btn-success"
                                    : "btn-danger"
                            }"
                            onclick="saveCompliance(
                                ${scholar.id},
                                '${result}'
                            )"
                        >
                            Update Status
                        </button>

                    </td>

                </tr>
            `;

        }).join("");
}


async function saveCompliance(
    scholarId,
    result
) {

    const { error } =
        await supabaseClient
            .from("scholars")
            .update({
                status: result
            })
            .eq("id", scholarId);


    if (error) {

        alert(error.message);

        return;
    }


    alert(
        `Scholar status updated to ${result}.`
    );
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