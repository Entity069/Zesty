function toggleTheme() {
    const htmlElement = document.documentElement;
    const theme = htmlElement.getAttribute('data-bs-theme');
    const nTheme = theme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-bs-theme', nTheme);
    localStorage.setItem('theme', nTheme);

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        if (nTheme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

function setTheme() {
    const htmlElement = document.documentElement;
    const theme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('theme-icon');

    if (theme) {
        htmlElement.setAttribute('data-bs-theme', theme);
        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    } else {
        htmlElement.setAttribute('data-bs-theme', 'light');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar")
    if (sidebar) {
        sidebar.classList.toggle("show")
    }
}

function shwSucc(title, message) {
    const successToast = document.getElementById("succ-toast")
    if (successToast) {
        document.getElementById("succ-toast-tit").textContent = title
        document.getElementById("succ-toast-msg").textContent = message

        const toast = new window.bootstrap.Toast(successToast, {
            autohide: true,
            delay: 5000,
        })
        toast.show()
    }
}

function shwErr(title, message) {
    const errToast = document.getElementById("err-toast")
    if (errToast) {
        document.getElementById("err-toast-tit").textContent = title
        document.getElementById("err-toast-msg").textContent = message

        const toast = new window.bootstrap.Toast(errToast, {
            autohide: true,
            delay: 5000,
        })
        toast.show()
    }
}

function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId)
    const toggleButton = passwordInput.nextElementSibling.nextElementSibling
    const toggleIcon = toggleButton.querySelector("i")
    console.log(toggleButton);
    if (passwordInput.type === "password") {
        passwordInput.type = "text"
        toggleIcon.classList.remove("fa-eye")
        toggleIcon.classList.add("fa-eye-slash")
    } else {
        passwordInput.type = "password"
        toggleIcon.classList.remove("fa-eye-slash")
        toggleIcon.classList.add("fa-eye")
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTheme();
    document.addEventListener("click", (event) => {
        const sidebar = document.getElementById("sidebar")
        const sidebarToggler = document.querySelector(".sidebar-toggler")

        if (
            sidebar &&
            sidebarToggler &&
            window.innerWidth <= 992 &&
            !sidebar.contains(event.target) &&
            !sidebarToggler.contains(event.target) &&
            sidebar.classList.contains("show")
        ) {
            sidebar.classList.remove("show")
        }
    })
});
