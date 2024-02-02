document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("dateInput");
  const incrementDateBtn = document.getElementById("incrementDate");
  const decrementDateBtn = document.getElementById("decrementDate");
  const levelContainer = document.querySelector(".level-container"); // Select the container for the rafts
  const appPresentDayDisplay = document.getElementById("appPresentDayDisplay");
  const goButton = document.getElementById("goButton"); // Get the Go button

  let additionsLog = [];
  let removalsLog = [];

  // Initialize the view date to today's date
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const viewDate = today.toISOString().substring(0, 10);
  dateInput.value = viewDate;

  // Function to check if the selected date is the current date and disable the decrement button if it is
  // Also checks if the app present day is in the future compared to the view date and disables the Go button
  function checkDateAndDisableButton() {
    const selectedDate = new Date(dateInput.value);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Normalize current date to start of day for comparison

    // Disable the decrement button if the selected date is the current date or in the future
    decrementDateBtn.disabled = selectedDate.getTime() <= currentDate.getTime();

    // Additionally, disable the Go button if the app present day is in the future compared to the view date
    const appPresentDay = new Date(appPresentDayDisplay.textContent);
    goButton.disabled = appPresentDay.getTime() > selectedDate.getTime();
  }

  // Call this function initially to set the correct state of the decrement and Go buttons
  checkDateAndDisableButton();

  // Initialize the state of the system with the view date as the top-level date
  let systemState = {
    [viewDate]: {
      levels: [
        {
          levelNumber: 1,
          rafts: [
            { plantType: "Empty", transferDate: viewDate },
            { plantType: "Empty", transferDate: viewDate },
            { plantType: "Empty", transferDate: viewDate },
            { plantType: "Empty", transferDate: viewDate },
            { plantType: "Empty", transferDate: viewDate },
          ],
        },
      ],
      fallenOffRafts: [],
    },
  };

  // Add a variable to track the most advanced view date seen
  let mostAdvancedViewDate = viewDate; // Initialize with today's date

  // Function to find and update the most advanced view date
  function updateMostAdvancedViewDate() {
    const dates = Object.keys(systemState);
    const mostAdvancedDate = dates.reduce((a, b) =>
      new Date(a) > new Date(b) ? a : b
    );
    mostAdvancedViewDate = mostAdvancedDate; // Update the most advanced view date

    // Update the "App Present Day" display
    appPresentDayDisplay.textContent = mostAdvancedViewDate;
  }
  // Call this function initially to set up the "App Present Day" display
  updateMostAdvancedViewDate();

  // Function to update the view based on the selected date
  function updateView(date) {
    const stateForDate = systemState[date];
    if (!stateForDate) {
      console.log("No state found for this date:", date);
      return;
    }

    // Clear the current view
    levelContainer.innerHTML = "";

    // Populate the view with rafts for the selected date
    stateForDate.levels[0].rafts.forEach((raft) => {
      const raftElement = document.createElement("div");
      raftElement.className = "raft"; // Base class for all rafts

      // Assign additional class based on plantType
      switch (raft.plantType) {
        case "Rubella":
          raftElement.classList.add("Rubella-raft");
          break;
        case "Greenleaf":
          raftElement.classList.add("Greenleaf-raft");
          break;
        case "Romaine":
          raftElement.classList.add("Romaine-raft");
          break;
        case "Empty":
          raftElement.classList.add("empty-raft");
          break;
        // Add more cases as needed for other plant types
      }

      raftElement.innerHTML = `<div>${raft.plantType}</div><div class="raft-date">${raft.transferDate}</div>`;
      levelContainer.appendChild(raftElement);
    });

    // After updating the view
    updateTablesForDate(date); // Populate tables for the updated view date
  }

  // Call updateView initially to set up the initial view
  updateView(viewDate);

  // Function to update the state and log the change
  function updateSystemState(date, newState) {
    // Update the specific date entry in the system state
    systemState[date] = newState;

    // Log the updated state to the console
    console.log(`State updated for ${date}:`, systemState);
  }

  // Adjust the view date and update the view when buttons are clicked
  function adjustDate(days) {
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + days);
    const newViewDate = currentDate.toISOString().substring(0, 10);
    dateInput.value = newViewDate;

    // Check if the state for the newViewDate exists, if not, initialize it
    if (!systemState[newViewDate]) {
      // Find the previous date's state to use as a template
      const previousDate = new Date(currentDate);
      previousDate.setDate(previousDate.getDate() - 1); // Adjust to get the previous day
      const previousViewDate = previousDate.toISOString().substring(0, 10);

      // Use the previous day's state as a base, ensuring fallenOffRafts is always empty for the new state
      const newStateForDate = {
        ...systemState[previousViewDate],
        fallenOffRafts: [], // Ensure this is always empty for a new date
      };

      // Copy the levels' raft transfer dates without changing them
      newStateForDate.levels = newStateForDate.levels.map((level) => ({
        ...level,
        rafts: level.rafts.map((raft) => ({
          ...raft,
          // Do not update transferDate here, keep it as it was
        })),
      }));

      // Use updateSystemState to update the state and log the change
      updateSystemState(newViewDate, newStateForDate);
      updateMostAdvancedViewDate();
    }

    // Update the view with the new date
    updateView(newViewDate);
    checkDateAndDisableButton(); // Check the date and disable the button if necessary
  }

  incrementDateBtn.addEventListener("click", () => adjustDate(1));
  decrementDateBtn.addEventListener("click", () => adjustDate(-1));

  const inputForm = document.getElementById("inputForm");

  // Initialize logs for additions and removals

  inputForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const plantType = document.getElementById("plantType").value;
    const numberOfRafts = parseInt(document.getElementById("rafts").value, 10);
    const levelNumber = parseInt(document.getElementById("level").value, 10);
    const viewDate = dateInput.value;

    // Ensure the state for the view date exists
    if (!systemState[viewDate]) {
      systemState[viewDate] = {
        levels: [{ levelNumber: 1, rafts: [] }],
        fallenOffRafts: [],
      };
    }

    // Find the level in the state
    let level = systemState[viewDate].levels.find(
      (l) => l.levelNumber === levelNumber
    );
    if (!level) {
      level = { levelNumber, rafts: [] };
      systemState[viewDate].levels.push(level);
    }

    // Add new rafts to the level
    for (let i = 0; i < numberOfRafts; i++) {
      level.rafts.unshift({ plantType, transferDate: viewDate }); // Add to the left
    }

    // Ensure only 5 rafts can exist in a level at any time, remove extras
    while (level.rafts.length > 5) {
      const fallenRaft = level.rafts.pop(); // Remove the rightmost raft
      systemState[viewDate].fallenOffRafts.push({
        plantType: fallenRaft.plantType,
        levelNumber,
      }); // Add to fallen off rafts
      logRemoveAction(viewDate, fallenRaft.plantType, 1, levelNumber); // Log the removal action
    }

    // Log the action of adding rafts in the "Added" table
    logAddAction(viewDate, plantType, numberOfRafts, levelNumber);

    updateView(viewDate); // Refresh the view to reflect the updated state
    console.log(`State updated for ${viewDate}:`, systemState[viewDate]); // Log the updated state
  });

  // Function to log the action of adding rafts
  function logAddAction(date, plantType, numberOfRafts, levelNumber) {
    // Add the action to the additionsLog array
    additionsLog.push({ date, plantType, numberOfRafts, levelNumber });
    // Log the current state of additionsLog to the console
    console.log("Additions Log:", additionsLog);
  }

  // Function to log the action of removing rafts
  function logRemoveAction(date, plantType, numberOfRafts, levelNumber) {
    // Add the action to the removalsLog array
    removalsLog.push({ date, plantType, numberOfRafts, levelNumber });
    // Log the current state of removalsLog to the console
    console.log("Removals Log:", removalsLog);
  }

  // Function to clear and populate tables with log data for the selected view date
  function updateTablesForDate(viewDate) {
    // Clear existing table data
    document.getElementById("addedTable").querySelector("tbody").innerHTML = "";
    document.getElementById("removedTable").querySelector("tbody").innerHTML =
      "";

    // Filter and add log entries to the "Added" table
    additionsLog.forEach((log) => {
      if (log.date === viewDate) {
        const row = `<tr><td>${log.date}</td><td>${log.plantType}</td><td>${log.numberOfRafts}</td><td>${log.levelNumber}</td></tr>`;
        document
          .getElementById("addedTable")
          .querySelector("tbody").innerHTML += row;
      }
    });

    // Filter and add log entries to the "Removed" table
    removalsLog.forEach((log) => {
      if (log.date === viewDate) {
        const row = `<tr><td>${log.date}</td><td>${log.plantType}</td><td>${log.numberOfRafts}</td><td>${log.levelNumber}</td></tr>`;
        document
          .getElementById("removedTable")
          .querySelector("tbody").innerHTML += row;
      }
    });
  }
});
