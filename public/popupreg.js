const pop=document.getElementById("popup")
window.onload =generatepopUp();
function generatepopUp(data) {
    axios
      .post("/register", data)
      .then((res) => {
        if (res.data.status === 200) {
          alert("Registration successful! Please check your email for verification.");
          // Optionally redirect or perform other actions here
          pop.classList.add("open-popup")
        }
      })
      .catch((error) => {
        console.error("There was an error with the registration request:", error);
        alert("Registration failed. Please try again.");
      });
}