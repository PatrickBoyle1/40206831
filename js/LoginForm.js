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
            if (e.target.id === "signupEmail" && !e.target.value.includes("@")) {
                setInputError(inputElement, "Email must include '@'");
            }

            if (e.target.id === "signupPassword" && !/\d/.test(e.target.value)) {
                setInputError(inputElement, "Password must include a number");
            }
        });

        inputElement.addEventListener("input", e => {
            clearInputError(inputElement);
        });
    });
});

loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const email = loginForm.elements.email.value;
    const password = loginForm.elements.password.value;

    if (!email.includes("@")) {
        setInputError(loginForm.elements.email, "Email must include '@'");
        return;
    }

    if (!/\d/.test(password)) {
        setInputError(loginForm.elements.password, "Password must include a number");
        return;
    }

    const requestBody = JSON.stringify({ email, password });

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
                window.location.href = '/Dashboard.html';
            } else {
                setFormMessage(loginForm, "error", data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            setFormMessage(loginForm, "error", "An error occurred while logging in");
        });
});


