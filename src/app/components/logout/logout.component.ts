/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.profileButton') && !event.target.matches('.profileImage')) {
    var dropdowns = document.getElementsByClassName("dropdownMenu-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

//redirect user to login page when you click on logout in dropdown menu
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("logoutPage").addEventListener("click", function () {
    window.location.href = "login.html"; // Redirects only when Logout is clicked
  });
});
