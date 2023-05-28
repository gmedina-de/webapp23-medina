import Movie, { MovieCategoryEL } from "../m/Movie.mjs";
import Person from "../m/Person.mjs";
import Director from "../m/Director.mjs";
import Actor from "../m/Actor.mjs";
import { displaySegmentFields, undisplayAllSegmentFields } from "./app.mjs";
import {
  createListFromMap, createIsoDateString,
  fillSelectWithOptions, createMultiSelectionWidget
}
  from "../../lib/util.mjs";

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
  Movie.saveAll();
});

document.getElementById("RetrieveAndListAll")
  .addEventListener("click", function () {
    const tableBodyEl = document.querySelector(
      "section#Movie-R > table > tbody"
    );
    // reset view table (drop its previous contents)
    tableBodyEl.innerHTML = "";
    // populate view table
    for (const key of Object.keys(Movie.instances)) {
      const movie = Movie.instances[key];
      const actorListEl = createListFromMap(movie.actors, "name");
      const row = tableBodyEl.insertRow();
      row.insertCell().textContent = movie.movieId;
      row.insertCell().textContent = movie.title;
      row.insertCell().textContent = createIsoDateString(movie.releaseDate);
      row.insertCell().textContent = movie.director.name;
      row.insertCell().appendChild(actorListEl);
      if (movie.category) {
        row.insertCell().textContent =
          MovieCategoryEL.labels[movie.category - 1];
        if (movie.category === MovieCategoryEL.TV_SERIES_EPISODE) {
          row.insertCell().textContent =
            "Episode No." + movie.episodeNo + ": " + movie.tvSeriesName;
        }
        if (movie.category === MovieCategoryEL.BIOGRAPHY) {
          row.insertCell().textContent = "about " + movie.about.name;
        }
      }
    }
    document.getElementById("Movie-M").style.display = "none";
    document.getElementById("Movie-R").style.display = "block";
  }
  );

const createFormEl = document.querySelector("section#Movie-C > form"),
  aboutEl = createFormEl["about"],
  directorEl = createFormEl["director"],
  actorsEl = createFormEl["actors"],
  createCategorySelectEl = createFormEl.category;
//----- set up event handler for menu item "Create" -----------
document.getElementById("Create").addEventListener("click", function () {
  fillSelectWithOptions(aboutEl,
    Person.instances, "personId", { displayProp: "name" });
  fillSelectWithOptions(directorEl,
    Director.instances, "personId", { displayProp: "name" });
  fillSelectWithOptions(actorsEl,
    Actor.instances, "personId", { displayProp: "name" });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-C").style.display = "block";
  undisplayAllSegmentFields(createFormEl, MovieCategoryEL.labels);
  createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.movieId.addEventListener("input", function () {
  createFormEl.movieId.setCustomValidity(
    Movie.checkMovieIdAsId(createFormEl.movieId.value).message);
});
createFormEl.title.addEventListener("input", function () {
  createFormEl.title.setCustomValidity(
    Movie.checkTitle(createFormEl["title"].value).message);
});
createFormEl.releaseDate.addEventListener("input", function () {
  createFormEl.releaseDate.setCustomValidity(
    Movie.checkReleaseDate(createFormEl["releaseDate"].value).message);
});
createFormEl.tvSeriesName.addEventListener("input", function () {
  createFormEl.tvSeriesName.setCustomValidity(
    Movie.checkTvSeriesName(createFormEl.tvSeriesName.value,
      parseInt(createFormEl.category.value) + 1).message);
});
createFormEl.episodeNo.addEventListener("input", function () {
  createFormEl.episodeNo.setCustomValidity(
    Movie.checkEpisodeNo(createFormEl.episodeNo.value,
      parseInt(createFormEl.category.value) + 1).message);
});
createFormEl.about.addEventListener("input", function () {
  createFormEl.about.setCustomValidity(
    Movie.checkAbout(createFormEl.about.value,
      parseInt(createFormEl.category.value) + 1).message);
});
createFormEl.director.addEventListener("input", function () {
  createFormEl.director.setCustomValidity(
    Movie.checkDirector(createFormEl["director"].value).message);
});

// set up the movie category selection list
fillSelectWithOptions(createCategorySelectEl, MovieCategoryEL.labels);
createCategorySelectEl.addEventListener("change",
  handleCategorySelectChangeEvent);

// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
  const categoryStr = createFormEl.category.value;
  const slots = {
    movieId: createFormEl.movieId.value,
    title: createFormEl.title.value,
    releaseDate: createFormEl.releaseDate.value,
    tvSeriesName: createFormEl.tvSeriesName.value,
    episodeNo: createFormEl.episodeNo.value,
    about: createFormEl.about.value,
    directorId: createFormEl.director.value,
    actorIdRefs: [],
  };
  // check all input fields and show error messages
  createFormEl.movieId.setCustomValidity(
    Movie.checkMovieIdAsId(slots.movieId).message);
  createFormEl.title.setCustomValidity(
    Movie.checkTitle(slots.title).message);
  createFormEl.releaseDate.setCustomValidity(
    Movie.checkReleaseDate(slots.releaseDate).message);
  if (categoryStr) {
    // enum literal indexes start with 1
    slots.category = parseInt(categoryStr) + 1;
    if (slots.category == MovieCategoryEL.TV_SERIES_EPISODE) {
      createFormEl.tvSeriesName.setCustomValidity(
        Movie.checkTvSeriesName(
          createFormEl.tvSeriesName.value, slots.category).message
      );
      createFormEl.episodeNo.setCustomValidity(
        Movie.checkEpisodeNo(
          createFormEl.episodeNo.value, slots.category).message
      );
    } else if (slots.category == MovieCategoryEL.BIOGRAPHY) {
      createFormEl.about.setCustomValidity(
        Movie.checkAbout(createFormEl.about.value, slots.category).message
      );
    }
  }
  createFormEl.director.setCustomValidity(
    Movie.checkDirector(slots.directorId).message);
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) {
    const selActorOptions = createFormEl.actors.selectedOptions;
    for (const opt of selActorOptions) {
      slots.actorIdRefs.push(opt.value);
    }
    Movie.add(slots);
    // un-render all segment/category-specific fields
    undisplayAllSegmentFields(createFormEl, MovieCategoryEL.labels);
  }
});

const updateFormEl = document.querySelector("section#Movie-U > form"),
  updateSelectMovieEl = updateFormEl["selectMovie"],
  updateSelectCategoryEl = updateFormEl["category"];
undisplayAllSegmentFields(updateFormEl, MovieCategoryEL.labels);
// handle click event for the menu item "Update"
document.getElementById("Update").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  updateSelectMovieEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(updateSelectMovieEl, Movie.instances,
    "movieId", { displayProp: "title" });
  fillSelectWithOptions(updateFormEl["about"],
    Person.instances, "personId", { displayProp: "name" });
  fillSelectWithOptions(updateFormEl["director"],
    Director.instances, "personId", { displayProp: "name" });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-U").style.display = "block";
  updateFormEl.reset();
});

updateSelectMovieEl.addEventListener("change",
  function handleMovieSelectChangeEvent() {
    const movieId = updateFormEl.selectMovie.value,
      selectActorsWidget = updateFormEl.querySelector(".MultiSelectionWidget");
    if (movieId) {
      const movie = Movie.instances[movieId];
      updateFormEl.movieId.value = movie.movieId;
      updateFormEl.title.value = movie.title;
      updateFormEl.releaseDate.value = createIsoDateString(movie.releaseDate);
      updateFormEl.director.value = movie.director.personId;
      // set up the associated actors selection widget
      createMultiSelectionWidget(selectActorsWidget, movie.actors,
        Actor.instances, "personId", "name", 0);
      if (movie.category) {
        updateFormEl.category.selectedIndex = movie.category;
        // disable category selection (category is frozen)
        updateFormEl.category.disabled = "disabled";
        // show category-dependent fields
        displaySegmentFields(updateFormEl,
          MovieCategoryEL.labels, movie.category);
        switch (movie.category) {
        case MovieCategoryEL.TV_SERIES_EPISODE:
          updateFormEl.tvSeriesName.value = movie.tvSeriesName;
          updateFormEl.episodeNo.value = movie.episodeNo;
          updateFormEl.about.value = "";
          break;
        case MovieCategoryEL.BIOGRAPHY:
          updateFormEl.about.value = movie.about.personId;
          updateFormEl.episodeNo.value = "";
          updateFormEl.tvSeriesName.value = "";
          break;
        }
      } else {  // movie has no value for category
        updateFormEl.category.value = "";
        updateFormEl.category.disabled = "";   // enable category selection
        updateFormEl.tvSeriesName.value = "";
        updateFormEl.episodeNo.value = "";
        updateFormEl.about.value = "";
        undisplayAllSegmentFields(updateFormEl, MovieCategoryEL.labels);
      }
    } else {
      updateFormEl.reset();
    }
  }
);

// set up the movie category selection list
fillSelectWithOptions(updateSelectCategoryEl, MovieCategoryEL.labels);
updateSelectCategoryEl.addEventListener("change",
  handleCategorySelectChangeEvent
);

// responsive validation of form fields for segment properties
updateFormEl.title.addEventListener("input", function () {
  updateFormEl.title.setCustomValidity(
    Movie.checkTitle(updateFormEl["title"].value).message);
});
updateFormEl.releaseDate.addEventListener("input", function () {
  updateFormEl.releaseDate.setCustomValidity(
    Movie.checkReleaseDate(updateFormEl["releaseDate"].value).message);
});
updateFormEl.tvSeriesName.addEventListener("input", function () {
  updateFormEl.tvSeriesName.setCustomValidity(
    Movie.checkTvSeriesName(updateFormEl.tvSeriesName.value,
      parseInt(updateFormEl.category.value) + 1).message);
});
updateFormEl.episodeNo.addEventListener("input", function () {
  updateFormEl.episodeNo.setCustomValidity(
    Movie.checkEpisodeNo(updateFormEl.episodeNo.value,
      parseInt(updateFormEl.category.value) + 1).message);
});
updateFormEl.about.addEventListener("input", function () {
  updateFormEl.about.setCustomValidity(
    Movie.checkAbout(updateFormEl.about.value,
      parseInt(updateFormEl.category.value) + 1).message);
});

// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const categoryStr = updateFormEl.category.value,
    selectActorsWidget = updateFormEl.querySelector(".MultiSelectionWidget"),
    selectedActorsListEl = selectActorsWidget.firstElementChild,
    movieIdRef = updateSelectMovieEl.value;
  if (!movieIdRef) return;
  var slots = {
    movieId: updateFormEl.movieId.value,
    title: updateFormEl.title.value,
    releaseDate: updateFormEl.releaseDate.value,
    tvSeriesName: updateFormEl.tvSeriesName.value,
    episodeNo: updateFormEl.episodeNo.value,
    about: updateFormEl.about.value,
    directorId: updateFormEl.director.value,
    actorIdRefs: [],
  };
  // check all input fields and show error messages
  updateFormEl.title.setCustomValidity(
    Movie.checkTitle(slots.title).message);
  updateFormEl.releaseDate.setCustomValidity(
    Movie.checkReleaseDate(slots.releaseDate).message);
  if (categoryStr) {
    slots.category = parseInt(categoryStr) + 1;
    if (slots.category == MovieCategoryEL.TV_SERIES_EPISODE) {
      updateFormEl.tvSeriesName.setCustomValidity(
        Movie.checkTvSeriesName(
          updateFormEl.tvSeriesName.value, slots.category).message
      );
      updateFormEl.episodeNo.setCustomValidity(
        Movie.checkEpisodeNo(
          updateFormEl.episodeNo.value, slots.category).message
      );
    } else if (slots.category == MovieCategoryEL.BIOGRAPHY) {
      updateFormEl.about.setCustomValidity(
        Movie.checkAbout(updateFormEl.about.value, slots.category).message
      );
    }
  }
  updateFormEl.director.setCustomValidity(
    Movie.checkDirector(slots.directorId).message);

  // save the input data only if all form fields are valid
  if (updateFormEl.checkValidity()) {
    // construct ToAdd/ToRemove lists
    const actorIdRefsToAdd = [], actorIdRefsToRemove = [];
    for (const actorItemEl of selectedActorsListEl.children) {
      if (actorItemEl.classList.contains("removed")) {
        actorIdRefsToRemove.push(actorItemEl.getAttribute("data-value"));
      }
      if (actorItemEl.classList.contains("added")) {
        actorIdRefsToAdd.push(actorItemEl.getAttribute("data-value"));
      }
    }
    // if the add/remove list is non-empty, create a corresponding slot
    if (actorIdRefsToRemove.length > 0) {
      slots.actorIdRefsToRemove = actorIdRefsToRemove;
    }
    if (actorIdRefsToAdd.length > 0) {
      slots.actorIdRefsToAdd = actorIdRefsToAdd;
    }
    Movie.update(slots);
    // un-render all segment/category-specific fields
    undisplayAllSegmentFields(updateFormEl, MovieCategoryEL.labels);
    // update the movie selection list's option element
    updateSelectMovieEl.options[updateSelectMovieEl.selectedIndex].text =
      slots.title;
    selectActorsWidget.innerHTML = "";
  }
});

const deleteFormEl = document.querySelector("section#Movie-D > form");
const delSelMovieEl = deleteFormEl.selectMovie;
// set up event handler for Update button
document.getElementById("Delete").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  delSelMovieEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(delSelMovieEl, Movie.instances,
    "movieId", { displayProp: "title" });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-D").style.display = "block";
  deleteFormEl.reset();
});
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const movieIdRef = delSelMovieEl.value;
  if (!movieIdRef) return;
  if (confirm("Do you really want to delete this movie?")) {
    Movie.destroy(movieIdRef);
    delSelMovieEl.remove(delSelMovieEl.selectedIndex);
  }
});

function refreshManageDataUI() {
  // show the manage movie UI and hide the other UIs
  document.getElementById("Movie-M").style.display = "block";
  document.getElementById("Movie-R").style.display = "none";
  document.getElementById("Movie-C").style.display = "none";
  document.getElementById("Movie-U").style.display = "none";
  document.getElementById("Movie-D").style.display = "none";
}

function handleCategorySelectChangeEvent(e) {
  const formEl = e.currentTarget.form,
    // the array index of MovieCategoryEL.labels
    categoryIndexStr = formEl.category.value;
  if (categoryIndexStr) {
    displaySegmentFields(formEl, MovieCategoryEL.labels,
      parseInt(categoryIndexStr) + 1);
  } else {
    undisplayAllSegmentFields(formEl, MovieCategoryEL.labels);
  }
}

// Set up Manage Movies UI
refreshManageDataUI();
