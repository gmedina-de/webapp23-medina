import Director from "../m/Director.mjs";
import Movie from "../m/Movie.mjs";
import Actor from "../m/Actor.mjs";
import Person from "../m/Person.mjs";
import { fillSelectWithOptions } from "../../lib/util.mjs";

Person.retrieveAll();
Movie.retrieveAll();

// set up back-to-menu buttons for all use cases
for (const btn of document.querySelectorAll("button.back-to-menu")) {
  btn.addEventListener("click", refreshManageDataUI);
}
// neutralize the submit event for all use cases
for (const frm of document.querySelectorAll("section > form")) {
  frm.addEventListener("submit", function (e) {
    e.preventDefault();
    frm.reset();
  });
}
// save data when leaving the page
window.addEventListener("beforeunload", function () {
  Director.saveAll();
});

document.getElementById("RetrieveAndListAll")
  .addEventListener("click", function () {
    const tableBodyEl = document.querySelector(
      "section#Director-R > table > tbody"
    );
    // reset view table (drop its previous contents)
    tableBodyEl.innerHTML = "";
    // populate view table
    for (const key of Object.keys(Director.instances)) {
      const director = Director.instances[key];
      const row = tableBodyEl.insertRow();
      row.insertCell().textContent = director.personId;
      row.insertCell().textContent = director.name;
    }
    document.getElementById("Director-M").style.display = "none";
    document.getElementById("Director-R").style.display = "block";
  });

const createFormEl = document.querySelector("section#Director-C > form");
//----- set up event handler for menu item "Create" -----------
document.getElementById("Create").addEventListener("click", function () {
  document.getElementById("Director-M").style.display = "none";
  document.getElementById("Director-C").style.display = "block";
  createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.personId.addEventListener("input", function () {
  createFormEl.personId.setCustomValidity(
    Person.checkPersonIdAsId(createFormEl.personId.value, Director).message);
});
createFormEl.name.addEventListener("input", function () {
  createFormEl.name.setCustomValidity(
    Person.checkName(createFormEl.name.value).message
  );
});

/**
 * handle save events
 */
createFormEl["commit"].addEventListener("click", function () {
  const slots = {
    personId: createFormEl.personId.value,
    name: createFormEl.name.value,
  };
  // check all input fields and show error messages
  createFormEl.personId.setCustomValidity(
    Person.checkPersonIdAsId(slots.personId).message, Director);
  createFormEl.name.setCustomValidity(
    Person.checkName(slots.name).message);
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) Director.add(slots);
});
// define event listener for pre-filling superclass attributes
createFormEl.personId.addEventListener("change", function () {
  const persId = createFormEl.personId.value;
  if (persId in Person.instances) {
    createFormEl.name.value = Person.instances[persId].name;
  }
});

const updateFormEl = document.querySelector("section#Director-U > form");
const updSelDirectorEl = updateFormEl.selectDirector;
// handle click event for the menu item "Update"
document.getElementById("Update").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  updSelDirectorEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(updSelDirectorEl, Director.instances,
    "personId", { displayProp: "name" });
  document.getElementById("Director-M").style.display = "none";
  document.getElementById("Director-U").style.display = "block";
  updateFormEl.reset();
});
// handle change events on actor select element
updSelDirectorEl.addEventListener("change", handleDirectorSelectChangeEvent);

// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const directorIdRef = updSelDirectorEl.value;
  if (!directorIdRef) return;
  const slots = {
    personId: updateFormEl.personId.value,
    name: updateFormEl.name.value,
  };
  // check all property constraints
  updateFormEl.name.setCustomValidity(
    Person.checkName(slots.name).message);
  // save the input data only if all of the form fields are valid
  if (updateFormEl.checkValidity()) {
    Director.update(slots);
    // update the director selection list's option element
    updSelDirectorEl.options[updSelDirectorEl.selectedIndex].text = slots.name;
  }
});
/**
 * handle director selection events
 * when a director is selected, 
 * populate the form with the data of the selected director
 */
function handleDirectorSelectChangeEvent() {
  const key = updSelDirectorEl.value;
  if (key) {
    const auth = Director.instances[key];
    updateFormEl.personId.value = auth.personId;
    updateFormEl.name.value = auth.name;
  } else {
    updateFormEl.reset();
  }
}

const deleteFormEl = document.querySelector("section#Director-D > form");
const delSelDirectorEl = deleteFormEl.selectDirector;
//----- set up event handler for Update button -------------------------
document.getElementById("Delete").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  delSelDirectorEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(delSelDirectorEl, Director.instances,
    "personId", { displayProp: "name" });
  document.getElementById("Director-M").style.display = "none";
  document.getElementById("Director-D").style.display = "block";
  deleteFormEl.reset();
});
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const personId = delSelDirectorEl.value;
  if (!personId) return;
  if (confirm("Do you really want to delete this director?")) {
    for (const actorId of Object.keys(Actor.instances)) {
      const actor = Actor.instances[actorId];
      // delete agent reference
      if (actor.agent && parseInt(personId) === actor.agent.personId) {
        actor.agent = null;
        console.log(`Deleted actor agent reference ${personId}`);
      }
    }
    Actor.saveAll();
    for (const movieId of Object.keys(Movie.instances)) {
      const movie = Movie.instances[movieId];
      // delete directedMovies on cascade
      if (parseInt(personId) === movie.director.personId) {
        delete Movie.instances[movieId];
        console.log(`Deleted movie ${movieId}`);
      }
      // delete actor references
      if (personId in movie.actors) {
        console.log(`Deleted movie actor reference ${personId}`);
        delete movie.actors[personId];
      }
    }
    Movie.saveAll();
    Director.destroy(personId);
    delSelDirectorEl.remove(delSelDirectorEl.selectedIndex);
  }
});

function refreshManageDataUI() {
  // show the manage director UI and hide the other UIs
  document.getElementById("Director-M").style.display = "block";
  document.getElementById("Director-R").style.display = "none";
  document.getElementById("Director-C").style.display = "none";
  document.getElementById("Director-U").style.display = "none";
  document.getElementById("Director-D").style.display = "none";
}

// Set up Manage Directors UI
refreshManageDataUI();
