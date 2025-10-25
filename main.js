
var btnClick = document.getElementById("button");
var petName;

document.getElementById("new-pet-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const selection = document.getElementById("pet-species").value;
    petName = document.getElementById("pet-name").value;

    if (selection === "dog") {
        window.location.href = "dog.html";
    }
});
