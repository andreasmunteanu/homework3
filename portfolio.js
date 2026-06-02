(function () {
    "use strict";

    const form = document.getElementById("project-form");
    const tableBody = document.getElementById("projects-tbody");
    const tableSection = document.getElementById("projects-table-section");
    const emptyState = document.getElementById("empty-state");
    const tableWrapper = document.getElementById("table-wrapper");
    const projectCountBadge = document.getElementById("project-count");
    const statSubmitted = document.getElementById("stat-submitted");

    const fields = [
        {
            id: "project-name",
            validate(val) {
                if (!val.trim()) return "Project name is required.";
                if (val.trim().length < 2) return "Name must be at least 2 characters.";
                return "";
            }
        },
        {
            id: "project-desc",
            validate(val) {
                if (!val.trim()) return "Please provide a project description.";
                if (val.trim().length < 10) return "Description must be at least 10 characters.";
                return "";
            }
        },
        {
            id: "project-url",
            validate(val) {
                if (!val.trim()) return "Project URL is required.";
                try {
                    const url = new URL(val.trim());
                    if (!["http:", "https:"].includes(url.protocol)) {
                        return "URL must start with http:// or https://.";
                    }
                } catch {
                    return "Please enter a valid URL (e.g. https://example.com).";
                }
                return "";
            }
        },
        {
            id: "project-tech",
            validate(val) {
                if (!val.trim()) return "Please select a technology.";
                return "";
            }
        },
        {
            id: "project-date",
            validate(val) {
                if (!val) return "Completion date is required.";
                const d = new Date(val);
                if (isNaN(d.getTime())) return "Please enter a valid date.";
                return "";
            }
        }
    ];
    function showError(fieldEl, message) {
        fieldEl.classList.add("field-error");
        fieldEl.setAttribute("aria-invalid", "true");

        let errEl = fieldEl.parentNode.querySelector(".error-message");
        if (!errEl) {
            errEl = document.createElement("span");
            errEl.className = "error-message";
            errEl.setAttribute("role", "alert");
            errEl.id = fieldEl.id + "-error";
            fieldEl.setAttribute("aria-describedby", errEl.id);
            fieldEl.parentNode.appendChild(errEl);
        }
        errEl.textContent = message;
    }

    function clearError(fieldEl) {
        fieldEl.classList.remove("field-error");
        fieldEl.removeAttribute("aria-invalid");
        const errEl = fieldEl.parentNode.querySelector(".error-message");
        if (errEl) errEl.remove();
    }


    fields.forEach(function (f) {
        const el = document.getElementById(f.id);
        if (!el) return;

        el.addEventListener("blur", function () {
            const msg = f.validate(el.value);
            if (msg) {
                showError(el, msg);
            } else {
                clearError(el);
            }
        });

        el.addEventListener("input", function () {
            clearError(el);
        });
    });

    function validateImage() {
        const fileInput = document.getElementById("project-image");
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
            if (!allowed.includes(file.type)) {
                showError(fileInput, "Please select a valid image (JPEG, PNG, GIF, WebP, or SVG).");
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                showError(fileInput, "Image must be smaller than 5 MB.");
                return false;
            }
        }
        clearError(document.getElementById("project-image"));
        return true;
    }

    function validateAll() {
        let firstErrorEl = null;
        let valid = true;

        fields.forEach(function (f) {
            const el = document.getElementById(f.id);
            const msg = f.validate(el.value);
            if (msg) {
                showError(el, msg);
                if (!firstErrorEl) firstErrorEl = el;
                valid = false;
            } else {
                clearError(el);
            }
        });

        if (!validateImage()) {
            if (!firstErrorEl) firstErrorEl = document.getElementById("project-image");
            valid = false;
        }

        if (firstErrorEl) {
            firstErrorEl.focus();
        }

        return valid;
    }

    function readFileAsDataURL(file) {
        return new Promise(function (resolve) {
            if (!file) {
                resolve("");
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                resolve(e.target.result);
            };
            reader.onerror = function () {
                resolve("");
            };
            reader.readAsDataURL(file);
        });
    }

    let projectIndex = 0;

    function addProjectRow(data) {
        projectIndex++;

        if (emptyState) emptyState.hidden = true;
        if (tableWrapper) tableWrapper.hidden = false;

        const tr = document.createElement("tr");
        tr.setAttribute("data-project-index", projectIndex);

        const tdName = document.createElement("td");
        tdName.textContent = data.name;
        tr.appendChild(tdName);

        const tdDesc = document.createElement("td");
        tdDesc.textContent = data.description.length > 80
            ? data.description.substring(0, 80) + "…"
            : data.description;
        tdDesc.setAttribute("title", data.description);
        tr.appendChild(tdDesc);

        const tdUrl = document.createElement("td");
        const link = document.createElement("a");
        link.href = data.url;
        link.textContent = new URL(data.url).hostname;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.color = "#5c3d2e";
        link.style.fontWeight = "600";
        tdUrl.appendChild(link);
        tr.appendChild(tdUrl);

        const tdTech = document.createElement("td");
        const tagsDiv = document.createElement("div");
        tagsDiv.className = "tech-tags";
        data.technologies.forEach(function (tech) {
            const span = document.createElement("span");
            span.className = "tech-tag";
            span.textContent = tech;
            tagsDiv.appendChild(span);
        });
        tdTech.appendChild(tagsDiv);
        tr.appendChild(tdTech);

        const tdImg = document.createElement("td");
        if (data.imageDataUrl) {
            const img = document.createElement("img");
            img.src = data.imageDataUrl;
            img.alt = data.name + " thumbnail";
            img.className = "project-thumb";
            img.loading = "lazy";
            img.width = 56;
            img.height = 56;
            tdImg.appendChild(img);
        } else {
            const placeholder = document.createElement("span");
            placeholder.className = "no-thumb";
            placeholder.setAttribute("aria-label", "No image");
            placeholder.textContent = "📷";
            tdImg.appendChild(placeholder);
        }
        tr.appendChild(tdImg);


        const tdDate = document.createElement("td");
        const dateObj = new Date(data.date + "T00:00:00");
        tdDate.textContent = dateObj.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        tr.appendChild(tdDate);

        const tdAction = document.createElement("td");
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "delete-btn";
        delBtn.textContent = "Remove";
        delBtn.setAttribute("aria-label", "Remove project " + data.name);
        delBtn.addEventListener("click", function () {
            tr.remove();
            updateCount(-1);
            if (tableBody.children.length === 0) {
                if (emptyState) emptyState.hidden = false;
                if (tableWrapper) tableWrapper.hidden = true;
            }
        });
        tdAction.appendChild(delBtn);
        tr.appendChild(tdAction);

        tableBody.appendChild(tr);
        updateCount(1);
    }

    let totalProjects = 0;

    function updateCount(delta) {
        totalProjects += delta;
        if (projectCountBadge) {
            projectCountBadge.textContent = totalProjects;
        }
        if (statSubmitted) {
            statSubmitted.textContent = totalProjects;
        }
    }

    function showToast(message) {
        const existing = document.querySelector(".toast");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function () {
            if (toast.parentNode) toast.remove();
        }, 3000);
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!validateAll()) return;

        const name = document.getElementById("project-name").value.trim();
        const description = document.getElementById("project-desc").value.trim();
        const url = document.getElementById("project-url").value.trim();
        const techSelect = document.getElementById("project-tech");
        const selectedOptions = Array.from(techSelect.selectedOptions);
        const technologies = selectedOptions.map(function (opt) { return opt.textContent; });
        const date = document.getElementById("project-date").value;
        const fileInput = document.getElementById("project-image");
        const file = fileInput.files[0] || null;

        readFileAsDataURL(file).then(function (imageDataUrl) {
            addProjectRow({
                name: name,
                description: description,
                url: url,
                technologies: technologies,
                date: date,
                imageDataUrl: imageDataUrl
            });

            showToast("Project \"" + name + "\" added successfully!");

            form.reset();

            fields.forEach(function (f) {
                clearError(document.getElementById(f.id));
            });
            clearError(fileInput);

            tableSection.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    form.addEventListener("reset", function () {
        setTimeout(function () {
            fields.forEach(function (f) {
                clearError(document.getElementById(f.id));
            });
            clearError(document.getElementById("project-image"));
        }, 10);
    });
})();
