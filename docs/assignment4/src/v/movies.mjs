/**
 * @fileOverview  View code of UI for managing Movie data
 * @person Gerd Wagner
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Person from "../m/Person.mjs";
import Publisher from "../m/Publisher.mjs";
import Movie from "../m/Movie.mjs";
import { fillSelectWithOptions, createListFromMap, createMultiSelectionWidget }
    from "../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Person.retrieveAll();
Publisher.retrieveAll();
Movie.retrieveAll();

/***************************************************************
 Set up general, use-case-independent UI elements
 ***************************************************************/
// set up back-to-menu buttons for all CRUD UIs
for (const btn of document.querySelectorAll("button.back-to-menu")) {
  btn.addEventListener("click", refreshManageDataUI);
}
// neutralize the submit event for all CRUD UIs
for (const frm of document.querySelectorAll("section > form")) {
  frm.addEventListener("submit", function (e) {
    e.preventDefault();
    frm.reset();
  });
}
// save data when leaving the page
window.addEventListener("beforeunload", Movie.saveAll);

/**********************************************
 Use case Retrieve/List All Movies
 **********************************************/
document.getElementById("RetrieveAndListAll")
    .addEventListener("click", function () {
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-R").style.display = "block";
  const tableBodyEl = document.querySelector("section#Movie-R>table>tbody");
  tableBodyEl.innerHTML = "";  // drop old content
  for (const key of Object.keys( Movie.instances)) {
    const movie = Movie.instances[key];
    // create list of people for this movie
    const authListEl = createListFromMap( movie.people, "name");
    const row = tableBodyEl.insertRow();
    row.insertCell().textContent = movie.isbn;
    row.insertCell().textContent = movie.title;
    row.insertCell().textContent = movie.year;
    row.insertCell().appendChild( authListEl);
    // if the movie has a publisher, show its name
    row.insertCell().textContent =
        movie.publisher ? movie.publisher.name : "";
  }
});

/**********************************************
  Use case Create Movie
 **********************************************/
const createFormEl = document.querySelector("section#Movie-C > form"),
      selectPeopleEl = createFormEl["selectPeople"],
      selectPublisherEl = createFormEl["selectPublisher"];
document.getElementById("Create").addEventListener("click", function () {
  // set up a single selection list for selecting a publisher
  fillSelectWithOptions( selectPublisherEl, Publisher.instances, "name");
  // set up a multiple selection list for selecting people
  fillSelectWithOptions( selectPeopleEl, Person.instances,
      "personId", {displayProp: "name"});
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-C").style.display = "block";
  createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.isbn.addEventListener("input", function () {
  createFormEl.isbn.setCustomValidity(
      Movie.checkIsbnAsId( createFormEl["isbn"].value).message);
});
/* SIMPLIFIED/MISSING CODE: add event listeners for responsive
   validation on user input with Movie.checkTitle and checkYear */

// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
  const slots = {
    isbn: createFormEl["isbn"].value,
    title: createFormEl["title"].value,
    year: createFormEl["year"].value,
    personIdRefs: [],
    publisher_id: createFormEl["selectPublisher"].value
  };
  // check all input fields and show error messages
  createFormEl.isbn.setCustomValidity(
      Movie.checkIsbnAsId( slots.isbn).message);
  /* SIMPLIFIED CODE: no before-submit validation of name */
  // get the list of selected people
  const selAuthOptions = createFormEl.selectPeople.selectedOptions;
  // check the mandatory value constraint for people
  createFormEl.selectPeople.setCustomValidity(
      selAuthOptions.length > 0 ? "" : "No person selected!"
  );
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) {
    // construct a list of person ID references
    for (const opt of selAuthOptions) {
      slots.personIdRefs.push( opt.value);
    }
    Movie.add( slots);
  }
});

/**********************************************
 * Use case Update Movie
**********************************************/
const updateFormEl = document.querySelector("section#Movie-U > form"),
      updSelMovieEl = updateFormEl["selectMovie"];
document.getElementById("Update").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  updSelMovieEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions( updSelMovieEl, Movie.instances,
      "isbn", {displayProp: "title"});
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-U").style.display = "block";
  updateFormEl.reset();
});
/**
 * handle movie selection events: when a movie is selected,
 * populate the form with the data of the selected movie
 */
updSelMovieEl.addEventListener("change", function () {
  const saveButton = updateFormEl["commit"],
    selectPeopleWidget = updateFormEl.querySelector(".MultiSelectionWidget"),
    selectPublisherEl = updateFormEl["selectPublisher"],
    isbn = updateFormEl["selectMovie"].value;
  if (isbn) {
    const movie = Movie.instances[isbn];
    updateFormEl["isbn"].value = movie.isbn;
    updateFormEl["title"].value = movie.title;
    updateFormEl["year"].value = movie.year;
    // set up the associated publisher selection list
    fillSelectWithOptions( selectPublisherEl, Publisher.instances, "name");
    // set up the associated people selection widget
    createMultiSelectionWidget( selectPeopleWidget, movie.people,
        Person.instances, "personId", "name", 1);  // minCard=1
    // assign associated publisher as the selected option to select element
    if (movie.publisher) updateFormEl["selectPublisher"].value = movie.publisher.name;
    saveButton.disabled = false;
  } else {
    updateFormEl.reset();
    updateFormEl["selectPublisher"].selectedIndex = 0;
    selectPeopleWidget.innerHTML = "";
    saveButton.disabled = true;
  }
});
// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const movieIdRef = updSelMovieEl.value,
    selectPeopleWidget = updateFormEl.querySelector(".MultiSelectionWidget"),
    selectedPeopleListEl = selectPeopleWidget.firstElementChild;
  if (!movieIdRef) return;
  const slots = {
    isbn: updateFormEl["isbn"].value,
    title: updateFormEl["title"].value,
    year: updateFormEl["year"].value,
    publisher_id: updateFormEl["selectPublisher"].value
  };
  // add event listeners for responsive validation
  /* MISSING CODE */
  // commit the update only if all form field values are valid
  if (updateFormEl.checkValidity()) {
    // construct personIdRefs-ToAdd/ToRemove lists
    const personIdRefsToAdd=[], personIdRefsToRemove=[];
    for (const personItemEl of selectedPeopleListEl.children) {
      if (personItemEl.classList.contains("removed")) {
        personIdRefsToRemove.push( personItemEl.getAttribute("data-value"));
      }
      if (personItemEl.classList.contains("added")) {
        personIdRefsToAdd.push( personItemEl.getAttribute("data-value"));
      }
    }
    // if the add/remove list is non-empty, create a corresponding slot
    if (personIdRefsToRemove.length > 0) {
      slots.personIdRefsToRemove = personIdRefsToRemove;
    }
    if (personIdRefsToAdd.length > 0) {
      slots.personIdRefsToAdd = personIdRefsToAdd;
    }
    Movie.update( slots);
    // update the movie selection list's option element
    updSelMovieEl.options[updSelMovieEl.selectedIndex].text = slots.title;
    // drop widget content
    selectPeopleWidget.innerHTML = "";
  }
});

/**********************************************
 * Use case Delete Movie
**********************************************/
const deleteFormEl = document.querySelector("section#Movie-D > form");
const delSelMovieEl = deleteFormEl["selectMovie"];
document.getElementById("Delete").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  delSelMovieEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions( delSelMovieEl, Movie.instances,
      "isbn", {displayProp: "title"});
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-D").style.display = "block";
  deleteFormEl.reset();
});
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const movieIdRef = delSelMovieEl.value;
  if (!movieIdRef) return;
  if (confirm("Do you really want to delete this movie?")) {
    Movie.destroy( movieIdRef);
    // remove deleted movie from select options
    delSelMovieEl.remove( delSelMovieEl.selectedIndex);
  }
});

/**********************************************
 * Refresh the Manage Movies Data UI
 **********************************************/
function refreshManageDataUI() {
  // show the manage movie UI and hide the other UIs
  document.getElementById("Movie-M").style.display = "block";
  document.getElementById("Movie-R").style.display = "none";
  document.getElementById("Movie-C").style.display = "none";
  document.getElementById("Movie-U").style.display = "none";
  document.getElementById("Movie-D").style.display = "none";
}

// Set up Manage Movie UI
refreshManageDataUI();
