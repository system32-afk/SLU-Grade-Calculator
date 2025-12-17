

let subcategories = [];
function addSubcategories(parent_container) {
    const container = document.getElementById(parent_container);

    const div = document.createElement("div");
    div.classList.add("subcategory");

    div.innerHTML = `
        <input type="text" placeholder="subcategory name" class="subcatName">
        <input type="number" placeholder="Percentage" class="subcategory-input">
        <button class="delete-btn">🗑️</button>
    `;

    // Insert BEFORE the button container
    const buttonContainer = container.querySelector(".buttonContainer");
    container.insertBefore(div, buttonContainer);

    const nameInput = div.querySelector('input[type="text"]');

    nameInput.addEventListener("blur", () => {
        addOrUpdateSubcategory(nameInput);
    });

    nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        nameInput.blur();
    }
    });


    div.querySelector(".delete-btn").addEventListener("click", () => {
    const input = div.querySelector(".subcatName");
    const name = input.dataset.prevName;

    // Remove from global subcategories array
    if (name) {
        subcategories = subcategories.filter(sub => sub !== name);
        updateAllDropdowns();
        resetInvalidActivities(name); // optional but recommended
    }

        div.remove();
    });

}

function resetInvalidActivities(deletedName) {
    document
        .querySelectorAll('select[name="activityTypeDropdown"]')
        .forEach(select => {
            if (select.value === deletedName) {
                select.value = ""; // reset to "Select an option..."
            }
        });
}


// Helper function to add subcategory
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase()); // Quiz, Long Quiz, etc.
}

function addOrUpdateSubcategory(input) {
    const rawValue = input.value.trim();
    if (!rawValue) return;

    const normalized = normalizeName(rawValue);
    const previous = input.dataset.prevName;

    // Update input value visually
    input.value = normalized;

    // If name was changed
    if (previous && previous !== normalized) {
        const index = subcategories.indexOf(previous);
        if (index !== -1) {
            subcategories[index] = normalized;
        }
    }
    // If it's a new subcategory
    else if (!subcategories.includes(normalized)) {
        subcategories.push(normalized);
    }

    // Save current name for future edits
    input.dataset.prevName = normalized;

    updateAllDropdowns();
}


// Update all dropdowns whenever subcategories change
function updateAllDropdowns(){
    const allDropdowns = document.querySelectorAll('select[name="activityTypeDropdown"]');
    const optionsHTML = subcategories.map(sub => `<option value="${sub}">${sub}</option>`).join('');
    allDropdowns.forEach(dropdown => {
        dropdown.innerHTML = optionsHTML;
    });
}


function addActivity(){
    let container = document.getElementById("Activities");

    const actDiv = document.createElement("div");
    actDiv.classList.add("Activity");

    // Build dropdown options dynamically
    optionsHTML = subcategories.map(sub => `<option value="${sub}">${sub}</option>`).join('');

    actDiv.innerHTML = `
        <input type="text" placeholder="activity name" id="actName">
        <select name="activityTypeDropdown" id="selectAct">
         <option value="" selected >Select an option...</option>
            ${optionsHTML}
        </select>
        <input class ="CAL-Input" type="number">
        <input class ="CAL-Input" type="number">
        <button class="delete-btn">🗑️</button>
    `;
    const buttonContainer1 = document.getElementById("CAL-btnContainer");
    container.insertBefore(actDiv,buttonContainer1);

    // delete button logic
    actDiv.querySelector(".delete-btn").addEventListener("click", () => {
        actDiv.remove();
    });
}




function getCategoryPercents(){
    const percents = document.querySelectorAll("#grade_paramaters .percents");
    let CSpercent = parseFloat(percents[0].value) || 0;
    let EXpercent = parseFloat(percents[1].value) || 0;
    
    if (CSpercent  <= 0|| EXpercent <= 0){
        alert("Please input correct grade parameters!")
    }
    else if ((CSpercent+EXpercent) != 100){
        alert("Class standing and Examination percentage should equal to 100!")
    }
    console.log(CSpercent, EXpercent)
    return { CSpercent, EXpercent };
}

function getSubCategories() {
    let subcategories = [];

    document.querySelectorAll("#CS_subcategory .subcategory").forEach(div => {
        const name = div.querySelector(".subcatName").value.trim();
        const percent = parseFloat(div.querySelector(".subcategory-input").value);
        if (!name) return; // skip empty
        subcategories.push({ name, percent, category: "CS" });
    });

    document.querySelectorAll("#EX_subcategory .subcategory").forEach(div => {
        const name = div.querySelector(".subcatName").value.trim();
        const percent = parseFloat(div.querySelector(".subcategory-input").value);
        if (!name) return; // skip empty
        subcategories.push({ name, percent, category: "EX" });
    });

    return subcategories;
}


function getActivities() {
    const activities = [];
    document.querySelectorAll(".Activity").forEach(row => {
        const selects = row.querySelector("select");
        const inputs = row.querySelectorAll(".CAL-Input");

        activities.push({
            type: selects.value,
            score: parseFloat(inputs[0].value),
            total: parseFloat(inputs[1].value)
        });
    });

    return activities;
}


function computeRealWeights(subcats, CSpercent, EXpercent,) {

    const realWeights = {};

    // Separate subcategories by major
    const CS_sub = subcats.filter(s => s.major === "CS");
    const EX_sub = subcats.filter(s => s.major === "EX");

    // Compute total points if point-based
    const CS_totalPoints = CS_sub.reduce((sum, s) => pointSystems.CS_system === "Point" ? sum + s.percent : sum, 0);
    const EX_totalPoints = EX_sub.reduce((sum, s) => pointSystems.EX_system === "Point" ? sum + s.percent : sum, 0);

    subcats.forEach(s => {

        // ----- CLASS STANDING -----
        if (s.major === "CS") {
            
            // point-based inside major category
            realWeights[s.name] = (s.percent / CS_totalPoints) * (CSpercent / 100);
            
        }

        // ----- EXAMINATIONS -----
        else if (s.major === "EX") {
            realWeights[s.name] = (s.percent / EX_totalPoints) * (EXpercent / 100);
        }

    });

    return realWeights;
}


function CalculateGrade() {
    const activities = getActivities(); // [{type, score, total}, ...]
    const subcats = getSubCategories(); // [{name, percent, category}, ...]
    const { CSpercent, EXpercent } = getCategoryPercents();
    // Group activities by subcategory
    const subcatTotals = {};

    subcats.forEach(s => {
        subcatTotals[s.name] = { score: 0, total: 0, category: s.category, weight: s.percent };
    });

    activities.forEach(a => {
        if (subcatTotals[a.type]) {
            subcatTotals[a.type].score += a.score;
            subcatTotals[a.type].total += a.total;
        }
    });

    console.log(subcatTotals);

    // Calculate final score per major
    const majorScores = { CS: 0, EX: 0 };

    subcats.forEach(s => {
        const data = subcatTotals[s.name];
        if (data.total === 0) return; // skip empty subcategories
        const ratio = data.score / data.total;
        const weightedScore = ratio * 55;
        const finalSubcatScore = weightedScore + 45;

        // Multiply by subcategory weight (percent / 100)
        majorScores[data.category] += finalSubcatScore * (data.weight / 100);
    });

    // Final grade: average of the two majors
    const finalEXGrade = (EXpercent/100) * majorScores.EX;
    const finalCSGrade = (CSpercent/100) * majorScores.CS;
    const finalGrade = finalCSGrade + finalEXGrade;

    alert("Final Grade: " + finalGrade.toFixed(2));
}





function EstimatePassing(){
    let total = document.getElementById("total").value;
    let RAWPercent = document.getElementById("PassPercent").value;
    let PassingPercent = RAWPercent/100;

    if(total == 0){
        alert("Please input a total item!");
        return;
    }

    if(RAWPercent == 0){
        alert("Please input a passing percentage!");
        return;
    }

    let passingScore = (total * PassingPercent).toFixed(2);
    
    alert(`You need ${passingScore}! to pass`);
}

//load 3 subcategories and 3 activities to be filled up
document.addEventListener("DOMContentLoaded", () => {
    for (let i = 0; i < 3; i++) addSubcategories("CS_subcategory");
    for (let i = 0; i < 3; i++) addSubcategories("EX_subcategory");
    for (let i = 0; i < 3; i++) addActivity();

})

function sendFeedback() {
    const feedback = document.getElementById("userFeedback").value.trim();

    if (!feedback) {
        alert("Please write some feedback first!");
        return;
    }

    const subject = encodeURIComponent("Grade Calculator Feedback");
    const body = encodeURIComponent(
        `Hi,\n\nHere is my feedback:\n${feedback}\n`
    );

    window.location.href = `mailto:johngabrielsalamera@gmail.com?subject=${subject}&body=${body}`;
}
