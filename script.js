document.addEventListener("DOMContentLoaded", function () {

  let tourists = [
    {
      name: "Demo Tourist",
      age: 21,
      phone: "9876543210",
      location: "Current Location",
      status: "Safe"
    }
  ];

  let volunteers = [
    {
      name: "Arjun Sharma",
      distance: "1.2 km"
    },
    {
      name: "Priya Patil",
      distance: "2.4 km"
    },
    {
      name: "Rahul Singh",
      distance: "4.1 km"
    }
  ];

  let emergencyActive = false;


  /* -------------------------
     PAGE NAVIGATION
  ------------------------- */

  function showPage(page) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(function (p) {
      p.classList.add("hidden");
    });

    const selectedPage = document.getElementById(page);

    if (selectedPage) {
      selectedPage.classList.remove("hidden");
    }

    const titles = {
      dashboard: "Safety Dashboard",
      tourists: "Tourist Management",
      volunteers: "Volunteer Network",
      alerts: "Emergency Alerts",
      profile: "My Profile"
    };

    document.getElementById("pageTitle").innerText = titles[page];


    document.querySelectorAll(".nav").forEach(function (button) {
      button.classList.remove("active");
    });

  }


  /* -------------------------
     NAVIGATION BUTTONS
  ------------------------- */

  document.getElementById("navDashboard").onclick = function () {
    showPage("dashboard");
    this.classList.add("active");
  };


  document.getElementById("navTourists").onclick = function () {
    showPage("tourists");
    this.classList.add("active");
  };


  document.getElementById("navVolunteers").onclick = function () {
    showPage("volunteers");
    this.classList.add("active");
  };


  document.getElementById("navAlerts").onclick = function () {
    showPage("alerts");
    this.classList.add("active");
  };


  document.getElementById("navProfile").onclick = function () {
    showPage("profile");
    this.classList.add("active");
  };


  /* -------------------------
     REGISTRATION MODAL
  ------------------------- */

  const modal = document.getElementById("registrationModal");

  const registerButton =
    document.getElementById("registerTouristButton");

  const profileButton =
    document.getElementById("profileRegisterButton");

  const closeButton =
    document.getElementById("closeModalButton");


  function openRegistration() {

    modal.classList.remove("hidden");

  }


  function closeRegistration() {

    modal.classList.add("hidden");

  }


  registerButton.onclick = openRegistration;

  profileButton.onclick = openRegistration;

  closeButton.onclick = closeRegistration;


  /* -------------------------
     REGISTRATION FORM
  ------------------------- */

  const form =
    document.getElementById("registrationForm");


  form.onsubmit = function (event) {

    event.preventDefault();


    const name =
      document.getElementById("name").value.trim();

    const age =
      document.getElementById("age").value;

    const gender =
      document.getElementById("gender").value;

    const phone =
      document.getElementById("phone").value.trim();

    const emergency =
      document.getElementById("emergency").value.trim();

    const address =
      document.getElementById("address").value.trim();


    if (name === "") {
      alert("Please enter your name.");
      return;
    }

    if (age === "") {
      alert("Please enter your age.");
      return;
    }

    if (phone === "") {
      alert("Please enter your phone number.");
      return;
    }

    if (emergency === "") {
      alert("Please enter your emergency contact.");
      return;
    }


    const newTourist = {

      name: name,

      age: age,

      gender: gender,

      phone: phone,

      emergency: emergency,

      address: address,

      location: "Current Location",

      status: "Safe"

    };


    tourists.push(newTourist);


    updateDashboard();

    updateTouristTable();


    addActivity(
      "OK",
      name + " registered successfully",
      "Safety monitoring has been activated."
    );


    closeRegistration();


    form.reset();


    alert(
      "Registration successful. Your safety monitoring is now active."
    );

  };


  /* -------------------------
     DASHBOARD
  ------------------------- */

  function updateDashboard() {

    document.getElementById("touristCount").innerText =
      tourists.length;


    document.getElementById("volunteerCount").innerText =
      volunteers.length;


    document.getElementById("alertCount").innerText =
      emergencyActive ? 1 : 0;


    document.getElementById("locationCount").innerText =
      tourists.length;

  }


  /* -------------------------
     TOURIST TABLE
  ------------------------- */

  function updateTouristTable() {

    const table =
      document.getElementById("touristTable");


    table.innerHTML = "";


    tourists.forEach(function (tourist) {

      const row = document.createElement("tr");


      row.innerHTML = `

        <td>
          <strong>${tourist.name}</strong>
        </td>

        <td>
          ${tourist.age}
        </td>

        <td>
          ${tourist.phone}
        </td>

        <td>
          ${tourist.location}
        </td>

        <td>

          <span class="badge safe">
            ${tourist.status}
          </span>

        </td>

      `;


      table.appendChild(row);

    });

  }


  /* -------------------------
     VOLUNTEERS
  ------------------------- */

  function updateVolunteers() {

    const list =
      document.getElementById("volunteerList");


    list.innerHTML = "";


    volunteers.forEach(function (volunteer) {

      const div =
        document.createElement("div");


      div.className = "volunteer";


      div.innerHTML = `

        <div>

          <strong>
            ${volunteer.name}
          </strong>

          <p>
            ${volunteer.distance} away
          </p>

        </div>

        <button>
          Available
        </button>

      `;


      list.appendChild(div);

    });

  }


  /* -------------------------
     ACTIVITY
  ------------------------- */

  function addActivity(
    icon,
    title,
    description
  ) {

    const list =
      document.getElementById("activityList");


    const item =
      document.createElement("div");


    item.className = "activity";


    item.innerHTML = `

      <span class="activity-icon">
        ${icon}
      </span>

      <div>

        <strong>
          ${title}
        </strong>

        <p>
          ${description}
        </p>

      </div>

      <small>
        Now
      </small>

    `;


    list.prepend(item);

  }


  /* -------------------------
     EMERGENCY
  ------------------------- */

  document
    .getElementById("simulateEmergency")
    .onclick = function () {

      emergencyActive = true;


      document
        .getElementById("emergencyPopup")
        .classList.remove("hidden");


      document
        .getElementById("riskScore")
        .innerText = "91";


      document
        .getElementById("riskStatus")
        .innerText = "HIGH RISK";


      document
        .getElementById("riskStatus")
        .style.color = "#dc2626";


      document
        .getElementById("riskDescription")
        .innerText =
        "Unusual inactivity detected. Tourist may require assistance.";


      updateDashboard();


      addActivity(
        "ALERT",
        "Potential emergency detected",
        "Tourist has not moved for an unusual period."
      );

    };


  /* -------------------------
     HELP
  ------------------------- */

  document
    .getElementById("helpButton")
    .onclick = function () {

      document
        .getElementById("emergencyPopup")
        .classList.add("hidden");


      document
        .getElementById("rescueMode")
        .classList.remove("hidden");


      addActivity(
        "HELP",
        "Volunteer accepted rescue",
        "Navigation to victim activated."
      );

    };


  /* -------------------------
     DISMISS
  ------------------------- */

  document
    .getElementById("dismissButton")
    .onclick = function () {

      emergencyActive = false;


      document
        .getElementById("emergencyPopup")
        .classList.add("hidden");


      document
        .getElementById("riskScore")
        .innerText = "12";


      document
        .getElementById("riskStatus")
        .innerText = "LOW RISK";


      document
        .getElementById("riskStatus")
        .style.color = "#16a34a";


      document
        .getElementById("riskDescription")
        .innerText =
        "Tourist movement appears normal.";


      updateDashboard();

    };


  /* -------------------------
     CLOSE RESCUE
  ------------------------- */

  document
    .getElementById("closeRescueButton")
    .onclick = function () {

      document
        .getElementById("rescueMode")
        .classList.add("hidden");

    };


  /* -------------------------
     LOCATE VICTIM
  ------------------------- */

  document
    .getElementById("locateVictimButton")
    .onclick = function () {

      alert(
        "Victim locating signal activated."
      );


      addActivity(
        "LOCATE",
        "Victim locating signal activated",
        "Emergency locating signal triggered."
      );

    };


  /* -------------------------
     SIMULATED GPS
  ------------------------- */

  function updateGPS() {

    const latitude =
      19.0760 +
      (Math.random() - 0.5) * 0.002;


    const longitude =
      72.8777 +
      (Math.random() - 0.5) * 0.002;


    document.getElementById("latitude").innerText =
      latitude.toFixed(5);


    document.getElementById("longitude").innerText =
      longitude.toFixed(5);


    document.getElementById("lastUpdate").innerText =
      "Just now";

  }


  /* -------------------------
     START
  ------------------------- */

  updateDashboard();

  updateTouristTable();

  updateVolunteers();

  updateGPS();


  setInterval(
    updateGPS,
    5000
  );

});
