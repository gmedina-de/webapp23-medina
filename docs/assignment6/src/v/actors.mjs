import Actor from "../m/Actor.mjs";
import Movie from "../m/Movie.mjs";
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
  Actor.saveAll();
});

document.getElementById("RetrieveAndListAll").addEventListener("click",
  function () {
    const tableBodyEl = document.querySelector("section#Actor-R>table>tbody");
    // reset view table (drop its previous contents)
    tableBodyEl.innerHTML = "";
    // populate view table
    for (const key of Object.keys(Actor.instances)) {
      const actor = Actor.instances[key];
      const row = tableBodyEl.insertRow();
      row.insertCell().textContent = actor.personId;
      row.insertCell().textContent = actor.name;
      if (actor.agent) {
        row.insertCell().textContent = actor.agent.name;
      }
    }
    document.getElementById("Actor-M").style.display = "none";
    document.getElementById("Actor-R").style.display = "block";
  }
);

const createFormEl = document.querySelector("section#Actor-C > form"),
  selectAgentEl = createFormEl["selectAgent"];
//----- set up event handler for menu item "Create" -----------
document.getElementById("Create").addEventListener("click", function () {
  fillSelectWithOptions(selectAgentEl,
    Person.instances, "personId", { displayProp: "name" });
  document.getElementById("Actor-M").style.display = "none";
  document.getElementById("Actor-C").style.display = "block";
  createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.personId.addEventListener("input", function () {
  createFormEl.personId.setCustomValidity(
    Person.checkPersonIdAsId(createFormEl.personId.value, Actor).message);
});
createFormEl.name.addEventListener("input", function () {
  createFormEl.name.setCustomValidity(
    Person.checkName(createFormEl.name.value).message
  );
});
createFormEl.selectAgent.addEventListener("input", function () {
  createFormEl.selectAgent.setCustomValidity(
    Actor.checkAgent(createFormEl["selectAgent"].value).message);
});


// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
  const slots = {
    personId: createFormEl.personId.value,
    name: createFormEl.name.value,
    agentId: createFormEl.selectAgent.value
  };
  // check all input fields and show error messages
  createFormEl.personId.setCustomValidity(
    Person.checkPersonIdAsId(slots.personId).message, Actor);
  createFormEl.name.setCustomValidity(
    Person.checkName(slots.name).message);
  createFormEl.selectAgent.setCustomValidity(
    Actor.checkAgent(slots.agentId).message);
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) Actor.add(slots);
});
// define event listener for pre-filling superclass attributes
createFormEl.personId.addEventListener("change", function () {
  const persId = createFormEl.personId.value;
  if (persId in Person.instances) {
    createFormEl.name.value = Person.instances[persId].name;
  }
});

const updateFormEl = document.querySelector("section#Actor-U > form"),
  updSelActorEl = updateFormEl.selectActor;
//----- set up event handler for menu item "Update" -----------
document.getElementById("Update").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  updSelActorEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(updSelActorEl, Actor.instances,
    "personId", { displayProp: "name" });
  const selectAgentEl = updateFormEl["selectAgent"];
  fillSelectWithOptions(selectAgentEl, Person.instances, "personId",
    { displayProp: "name" });
  document.getElementById("Actor-M").style.display = "none";
  document.getElementById("Actor-U").style.display = "block";
  updateFormEl.reset();
});
// handle change events on actor select element
updSelActorEl.addEventListener("change", handleActorSelectChangeEvent);

// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const actorIdRef = updSelActorEl.value;
  if (!actorIdRef) return;
  const slots = {
    personId: updateFormEl.personId.value,
    name: updateFormEl.name.value,
    agentId: updateFormEl.selectAgent.value,
  };
  // check all property constraints
  updateFormEl.name.setCustomValidity(
    Person.checkName(slots.name).message);
  updateFormEl.selectAgent.setCustomValidity(
    Actor.checkAgent(slots.agentId).message);
  // save the input data only if all of the form fields are valid
  if (updateFormEl.checkValidity()) {
    Actor.update(slots);
    // update the agent selection list's option element
    updSelActorEl.options[updSelActorEl.selectedIndex].text = slots.name;
  }
});
/**
 * handle actor selection events
 * on selection, populate the form with the data of the selected actor
 */
function handleActorSelectChangeEvent() {
  const key = updateFormEl.selectActor.value;
  if (key) {
    const actor = Actor.instances[key];
    updateFormEl.personId.value = actor.personId;
    updateFormEl.name.value = actor.name;
    if (actor.agent) updateFormEl.selectAgent.value = actor.agent.personId;
  } else {
    updateFormEl.reset();
  }
}

const deleteFormEl = document.querySelector("section#Actor-D > form");
const delSelActorEl = deleteFormEl.selectActor;
//----- set up event handler for menu item "Delete" -----------
document.getElementById("Delete").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  delSelActorEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(delSelActorEl, Actor.instances,
    "personId", { displayProp: "name" });
  document.getElementById("Actor-M").style.display = "none";
  document.getElementById("Actor-D").style.display = "block";
  deleteFormEl.reset();
});
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const personId = delSelActorEl.value;
  if (!personId) return;
  if (confirm("Do you really want to delete this actor?")) {
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
    Actor.destroy(personId);
    delSelActorEl.remove(delSelActorEl.selectedIndex);
  }
});

function refreshManageDataUI() {
  // show the manage actor UI and hide the other UIs
  document.getElementById("Actor-M").style.display = "block";
  document.getElementById("Actor-R").style.display = "none";
  document.getElementById("Actor-C").style.display = "none";
  document.getElementById("Actor-U").style.display = "none";
  document.getElementById("Actor-D").style.display = "none";
}

// Set up Manage Actors UI
refreshManageDataUI();
