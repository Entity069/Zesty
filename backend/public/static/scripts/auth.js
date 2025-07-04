function switchToRegister() {
    document.getElementById("login").classList.add("d-none")
    document.getElementById("forgot-password").classList.add("d-none")
    const registerForm = document.getElementById("register")
    registerForm.classList.remove("d-none")
    registerForm.classList.add("slide-in-right")

    setTimeout(() => {
        registerForm.classList.remove("slide-in-right")
    }, 500)
}

function switchToLogin() {
    document.getElementById("register").classList.add("d-none")
    document.getElementById("forgot-password").classList.add("d-none")
    const loginForm = document.getElementById("login")
    loginForm.classList.remove("d-none")
    loginForm.classList.add("slide-in-left")

    setTimeout(() => {
        loginForm.classList.remove("slide-in-left")
    }, 500)
}

function switchToForgotPassword() {
    document.getElementById("login").classList.add("d-none")
    document.getElementById("register").classList.add("d-none")
    const forgotForm = document.getElementById("forgot-password")
    forgotForm.classList.remove("d-none")
    forgotForm.classList.add("slide-in-right")

    setTimeout(() => {
        forgotForm.classList.remove("slide-in-right")
    }, 500)
}


function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePassword(password) {
  return password.length >= 8
}

async function login(email, password) {
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        })

        const data = await response.json()
        return data;
    } catch (error) {
        return { success: false, msg: "Request failed successfully." }
    }
}

async function register(regdata) {
    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(regdata),
        })

        const data = await response.json()
        return data;
    } catch (error) {
        return { success: false, msg: "Request failed successfully." }
    }
}

async function forgotPassword(email) {
    try {
        const response = await fetch(`/api/auth/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json()
        return data;
    } catch (error) {
        return { success: false, msg: "Request failed successfully." }
    }
}

async function resetPassword(password) {
    try {
        const token = new URLSearchParams(window.location.search).get("token");
        const response = await fetch(`/api/auth/reset-password?token=${token}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ password })
        })

        const data = await response.json()
        return data;
    } catch (error) {
        return { success: false, msg: "Request failed successfully." }
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("login-form")
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault()

            const email = document.getElementById("login-email").value
            const password = document.getElementById("login-password").value

            if (!validateEmail(email)) {
                shwErr("Invalid Email", "Please enter a valid email address.")
                return
            }

            if (!validatePassword(password)) {
                shwErr("Invalid Password", "Password must be at least 8 characters long.")
                return
            }

            const submitBtn = this.querySelector('button[type="submit"]')
            const originalText = submitBtn.innerHTML

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing in...'
            submitBtn.disabled = true

            const result = await login(email, password)
            console.log(result)
            if (result.success) {
                shwSucc("Login Successful!", result.msg)
                setTimeout(() => {
                    location.reload();
                }, 1500)
            } else {
                shwErr("Login Failed:", result.msg)
            }
            submitBtn.innerHTML = originalText
            submitBtn.disabled = false
        })
    }

    const registerForm = document.getElementById("register-form")
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault()

            const first_name = document.getElementById("first-name").value
            const last_name = document.getElementById("last-name").value
            const email = document.getElementById("register-email").value
            const address = document.getElementById("address").value
            const password = document.getElementById("register-password").value
            const confirmPassword = document.getElementById("confirm-password").value

            if (!validateEmail(email)) {
                shwErr("Invalid Email", "Please enter a valid email address.")
                return
            }

            if (!validatePassword(password)) {
                shwErr("Invalid Password", "Password must be at least 8 characters long.")
                return
            }

            if (password !== confirmPassword) {
                shwErr("Password Mismatch", "Passwords do not match! Please try again.")
                return
            }

            const submitBtn = this.querySelector('button[type="submit"]')
            const originalText = submitBtn.innerHTML

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating account...'
            submitBtn.disabled = true

            const result = await register({ first_name, last_name, email, password, address })
            console.log(result)
            if (result.success) {
                shwSucc("Registration Successful", result.msg)
                setTimeout(() => {
                    switchToLogin()
                }, 1500)
            } else {
                shwErr("Registration Failed", result.msg)
            }

            submitBtn.innerHTML = originalText
            submitBtn.disabled = false
        })
    }

    const newPwdForm = document.getElementById("new-pwd-form")
    if (newPwdForm) {
        newPwdForm.addEventListener("submit", async function (e) {
            e.preventDefault()

            const newPwd = document.getElementById("new-pwd").value
            const confirmNewPwd = document.getElementById("confirm-new-pwd").value
            const submitBtn = this.querySelector('button[type="submit"]')
            const originalText = submitBtn.innerHTML

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Changing Password...'
            submitBtn.disabled = true

            if (!validatePassword(newPwd)) {
                shwErr("Invalid Password", "Password must be at least 8 characters long.")
                return
            }

            if (newPwd !== confirmNewPwd) {
                shwErr("Password Mismatch", "Passwords do not match! Please try again.")
                return
            }

            const result = await resetPassword(newPwd)
            console.log(result.msg)
            if (result.success) {
                shwSucc("Password Updated!", result.msg)
                setTimeout(() => {
                    switchToLogin()
                }, 1500)
            } else {
                shwErr("Request Failed", result.msg)
            }

            submitBtn.innerHTML = originalText
            submitBtn.disabled = false
        })
    }

    const forgotPwdForm = document.getElementById("forgot-password-form")
    if (forgotPwdForm) {
        forgotPwdForm.addEventListener("submit", async function (e) {
            e.preventDefault()

            const email = document.getElementById("forgot-email").value
            const submitBtn = this.querySelector('button[type="submit"]')
            const originalText = submitBtn.innerHTML
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending reset link...'
            submitBtn.disabled = true

            if (!validateEmail(email)) {
                shwErr("Invalid email", "Please ener a valid email address.")
                return
            }

            const result = await forgotPassword(email)
            console.log(email, submitBtn, originalText, result)

            if (result.success) {
                shwSucc("Password reset link sent!", "An email has been sent to your email.")
                setTimeout(() => {
                    switchToLogin()
                }, 1500)
            } else {
                shwErr("Request Failed", result.msg)
            }

            submitBtn.innerHTML = originalText
            submitBtn.disabled = false
        })
    }
})
