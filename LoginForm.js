function setFormMessage(formElement, type, message) {
    const messageElement = formElement.querySelector(".form__message");

    messageElement.textContent = message;
    messageElement.classList.remove("form__message--success", "form__message--error");
    messageElement.classList.add(`form__message--${type}`);
}

function setInputError(inputElement, message) {
    inputElement.classList.add("form__input--error");
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = message;
}

function clearInputError(inputElement) {
    inputElement.classList.remove("form__input--error");
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = "";
}
document.addEventListener("DOMContentLoaded", () => {
    let loginForm = document.querySelector("#login");
    let createAccountForm = document.querySelector("#createAccount");

    document.querySelector("#linkCreateAccount").addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.add("form--hidden");
        createAccountForm.classList.remove("form--hidden");
    });

    document.querySelector("#linkLogin").addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.remove("form--hidden");
        createAccountForm.classList.add("form--hidden");
    });

    document.querySelectorAll(".form__input").forEach(inputElement => {
        inputElement.addEventListener("blur", e => {
            if (e.target.id === "signupUsername" && e.target.value.length > 0 && e.target.value.length < 10) {
                setInputError(inputElement, "Username must be at least 10 characters in length");
            }
        });

        inputElement.addEventListener("input", e => {
            clearInputError(inputElement);
        });
    });
});

    loginForm.addEventListener("submit", e => {
        e.preventDefault();

        // Get the username and password from the form
        const username = loginForm.elements.username.value;
        const password = loginForm.elements.password.value;

        // Create the request body
        const requestBody = JSON.stringify({ username, password });

        // Send a POST request to the /login route
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: requestBody
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // If the login was successful, redirect to the dashboard
                    window.location.href = '/Dashboard.html';
                } else {
                    // If there was an error, display it on the form
                    setFormMessage(loginForm, "error", data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                setFormMessage(loginForm, "error", "An error occurred while logging in");
            });
    });

