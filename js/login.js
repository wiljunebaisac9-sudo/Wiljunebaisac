document.addEventListener("DOMContentLoaded", async () => {

    // Check if already logged in
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {
        window.location.href = "dashboard.html";
        return;
    }


    document
        .getElementById("loginForm")
        .addEventListener("submit", loginUser);

});


async function loginUser(event) {

    event.preventDefault();

    const loginBtn =
        document.getElementById("loginBtn");

    const email =
        document.getElementById("email")
            .value
            .trim();

    const password =
        document.getElementById("password")
            .value;


    const message =
        document.getElementById("loginMessage");


    if (!email || !password) {

        message.textContent =
            "Please enter your email and password.";

        message.style.color = "#dc2626";

        return;
    }


    message.textContent =
        "Signing in...";

    message.style.color = "#64748b";
    loginBtn.disabled = true;


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


    if (error) {

        console.error(error);

        message.textContent =
            "Login failed: " + error.message;

        message.style.color = "#dc2626";
        loginBtn.disabled = false;

        return;
    }


    message.textContent =
        "Login successful. Redirecting...";

    message.style.color = "#16a34a";


    setTimeout(() => {

        window.location.href =
            "dashboard.html";

    }, 500);
}