document.addEventListener("DOMContentLoaded", function () {

    console.log("Dashboard is ready.");

    loadDashboard();

});


async function loadDashboard() {

    try {

        // TOTAL SCHOLARS
        const scholarResult =
            await supabaseClient
                .from("scholars")
                .select("*", {
                    count: "exact",
                    head: true
                });

        if (!scholarResult.error) {

            const element =
                document.getElementById("totalScholars");

            if (element) {
                element.textContent =
                    scholarResult.count || 0;
            }

        }


        // PENDING SUBMISSIONS
        const pendingResult =
            await supabaseClient
                .from("grades")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("status", "Pending");

        if (!pendingResult.error) {

            const element =
                document.getElementById(
                    "pendingSubmissions"
                );

            if (element) {
                element.textContent =
                    pendingResult.count || 0;
            }

        }


        // VERIFIED
        const verifiedResult =
            await supabaseClient
                .from("grades")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("status", "Verified");

        if (!verifiedResult.error) {

            const element =
                document.getElementById("verified");

            if (element) {
                element.textContent =
                    verifiedResult.count || 0;
            }

        }


        // COMPLIANT
        const compliantResult =
            await supabaseClient
                .from("compliance")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("status", "Complete");

        if (!compliantResult.error) {

            const element =
                document.getElementById("compliant");

            if (element) {
                element.textContent =
                    compliantResult.count || 0;
            }

        }


        // DEFICIENCY
        const deficiencyResult =
            await supabaseClient
                .from("compliance")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("status", "Pending");

        if (!deficiencyResult.error) {

            const element =
                document.getElementById("deficiency");

            if (element) {
                element.textContent =
                    deficiencyResult.count || 0;
            }

        }

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}