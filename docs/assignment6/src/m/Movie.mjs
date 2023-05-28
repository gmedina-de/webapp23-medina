import Person from "./Person.mjs";
import Director from "./Director.mjs";
import Actor from "./Actor.mjs";

import {
  cloneObject, isNonEmptyString, isIntegerOrIntegerString
} from "../../lib/util.mjs";
import {
  ConstraintViolation, FrozenValueConstraintViolation,
  MandatoryValueConstraintViolation, NoConstraintViolation,
  RangeConstraintViolation, UniquenessConstraintViolation,
} from "../../lib/errorTypes.mjs";
import { Enumeration } from "../../lib/Enumeration.mjs";

const MovieCategoryEL = new Enumeration(["TV Series Episode", "Biography"]);

class Movie {

  constructor({
    movieId, title, releaseDate, category, tvSeriesName, episodeNo,
    about, aboutId, director, directorId, actors, actorIdRefs
  }) {
    this.movieId = movieId;
    this.title = title;
    this.releaseDate = releaseDate;
    // sub-typing using Class Hierarchy Merge
    if (category) this.category = category;
    if (tvSeriesName) this.tvSeriesName = tvSeriesName;
    if (episodeNo) this.episodeNo = episodeNo;
    // assign object references or ID references (to be converted in setter)
    this.about = about || aboutId;
    this.director = director || directorId;
    this.actors = actors || actorIdRefs;
  }

  get movieId() {
    return this._movieId;
  }
  static checkMovieId(id) {
    id = parseInt(id);  // convert to integer
    if (isNaN(id) || !Number.isInteger(id) || id < 1) {
      return new RangeConstraintViolation(
        "The movie ID must be a positive integer!"
      );
    } else {
      return new NoConstraintViolation();
    }
  }
  static checkMovieIdAsId(id) {
    var validationResult = Movie.checkMovieId(id);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!id) {
        validationResult = new MandatoryValueConstraintViolation(
          "A value for the movieId must be provided!");
      } else if (Movie.instances[id]) {
        validationResult = new UniquenessConstraintViolation(
          `There is already a movie record with movieId ${id}`);
      } else {
        validationResult = new NoConstraintViolation();
      }
    }
    return validationResult;
  }
  set movieId(n) {
    const validationResult = Movie.checkMovieIdAsId(n);
    if (validationResult instanceof NoConstraintViolation) {
      this._movieId = n;
    } else {
      throw validationResult;
    }
  }

  get title() {
    return this._title;
  }
  static checkTitle(t) {
    if (!t) {
      return new MandatoryValueConstraintViolation("A title must be provided!");
    } else if (!isNonEmptyString(t)) {
      return new RangeConstraintViolation(
        "The title must be a non-empty string!"
      );
    } else {
      return new NoConstraintViolation();
    }
  }
  set title(t) {
    var validationResult = Movie.checkTitle(t);
    if (validationResult instanceof NoConstraintViolation) {
      this._title = t;
    } else {
      throw validationResult;
    }
  }

  get releaseDate() {
    return this._releaseDate;
  }
  static checkReleaseDate(d) {
    if (!d || d === "") {
      return new MandatoryValueConstraintViolation(
        "A release date must be provided!"
      );
    }
    return new NoConstraintViolation();
  }
  set releaseDate(d) {
    var validationResult = Movie.checkReleaseDate(d);
    if (validationResult instanceof NoConstraintViolation) {
      if (typeof (d) === "string") {
        d = new Date(d);
      }
      this._releaseDate = d;
    } else {
      throw validationResult;
    }
  }

  get category() { return this._category; }
  static checkCategory(c) {
    if (c === undefined) {
      return new NoConstraintViolation();  // category is optional
    } else if (!isIntegerOrIntegerString(c) || parseInt(c) < 1 ||
      parseInt(c) > MovieCategoryEL.MAX) {
      return new RangeConstraintViolation(
        `Invalid value for category: ${c}`);
    } else {
      return new NoConstraintViolation();
    }
  }
  set category(c) {
    var validationResult = null;
    if (this.category) {  // already set/assigned
      validationResult = new FrozenValueConstraintViolation(
        "The category cannot be changed!");
    } else {
      validationResult = Movie.checkCategory(c);
    }
    if (validationResult instanceof NoConstraintViolation) {
      this._category = parseInt(c);
    } else {
      throw validationResult;
    }
  }

  get tvSeriesName() {
    return this._tvSeriesName;
  }
  static checkTvSeriesName(n, c) {
    const category = parseInt(c);
    if (category === MovieCategoryEL.TV_SERIES_EPISODE && !n) {
      return new MandatoryValueConstraintViolation(
        "A TV series name must be provided for a TV series episode!");
    } else if (category !== MovieCategoryEL.TV_SERIES_EPISODE && n) {
      return new ConstraintViolation(
        "A TV series name must not " +
        "be provided if the movie is not a TV series episode!"
      );
    } else if (n &&
      (typeof (n) !== "string" || n.trim() === "")) {
      return new RangeConstraintViolation(
        "The TV series name must be a non-empty string!");
    } else {
      return new NoConstraintViolation();
    }
  }
  set tvSeriesName(n) {
    const validationResult = Movie.checkTvSeriesName(n, this.category);
    if (validationResult instanceof NoConstraintViolation) {
      this._tvSeriesName = n;
    } else {
      throw validationResult;
    }
  }

  get episodeNo() {
    return this._episodeNo;
  }
  static checkEpisodeNo(e, c) {
    const category = parseInt(c);
    e = parseInt(e);
    if (category === MovieCategoryEL.TV_SERIES_EPISODE && !e) {
      return new MandatoryValueConstraintViolation(
        "An episode number must be provided for a TV series episode!");
    } else if (category !== MovieCategoryEL.TV_SERIES_EPISODE && e) {
      return new ConstraintViolation("An episode number must not " +
        "be provided if the movie is not a TV series episode!"
      );
    } if (isNaN(e) || !Number.isInteger(e) || e < 1) {
      return new RangeConstraintViolation(
        "The episode number must be a positive integer!"
      );
    } else {
      return new NoConstraintViolation();
    }
  }
  set episodeNo(e) {
    e = parseInt(e);
    const validationResult = Movie.checkEpisodeNo(e, this.category);
    if (validationResult instanceof NoConstraintViolation) {
      this._episodeNo = e;
    } else {
      throw validationResult;
    }
  }

  get about() {
    return this._about;
  }
  static checkAbout(p, c) {
    const category = parseInt(c);
    if (category === MovieCategoryEL.BIOGRAPHY && !p) {
      return new MandatoryValueConstraintViolation(
        "An 'about' must be provided for a biography!");
    } else if (category !== MovieCategoryEL.BIOGRAPHY && p) {
      return new ConstraintViolation("An 'about' number must not " +
        "be provided if the movie is not a biography!"
      );
    }
    return Person.checkPersonIdAsIdRef(p);
  }
  set about(p) {
    const id = (typeof p !== "object") ? parseInt(p) : p.personId;
    const validationResult = Movie.checkAbout(id, this.category);
    if (validationResult instanceof NoConstraintViolation) {
      this._about = Person.instances[id];
    } else {
      throw validationResult;
    }
  }

  get director() {
    return this._director;
  }
  static checkDirector(d) {
    if (!d) {
      return new MandatoryValueConstraintViolation(
        "A director must be provided!"
      );
    }
    return Person.checkPersonIdAsIdRef(d, Director);
  }
  set director(d) {
    // d can be an ID reference or an object reference
    const id = (typeof d !== "object") ? parseInt(d) : d.personId;
    const validationResult = Movie.checkDirector(id);
    if (validationResult instanceof NoConstraintViolation) {
      // set the new director reference
      this._director = Director.instances[id];
    } else {
      throw validationResult;
    }
  }

  get actors() {
    return this._actors;
  }
  static checkActor(a) {
    if (!a) {
      // actor(s) are optional
      return new NoConstraintViolation();
    }
    return Person.checkPersonIdAsIdRef(a, Actor);
  }
  addActor(a) {
    // a can be an ID reference or an object reference
    const id = (typeof a !== "object") ? parseInt(a) : a.personId;
    if (id) {
      const validationResult = Movie.checkActor(id);
      if (id && validationResult instanceof NoConstraintViolation) {
        const key = String(id);
        // add the new actor reference
        this._actors[key] = Actor.instances[key];
      } else {
        throw validationResult;
      }
    }
  }
  removeActor(a) {
    // a can be an ID reference or an object reference
    const actor_id = (typeof a !== "object") ? parseInt(a) : a.personId;
    if (actor_id) {
      const validationResult = Movie.checkActor(actor_id);
      if (validationResult instanceof NoConstraintViolation) {
        // delete the actor reference
        delete this._actors[String(actor_id)];
      } else {
        throw validationResult;
      }
    }
  }
  set actors(a) {
    this._actors = {};
    if (Array.isArray(a)) {  // array of IdRefs
      for (const idRef of a) {
        this.addActor(idRef);
      }
    } else {  // map of IdRefs to object references
      for (const idRef of Object.keys(a)) {
        this.addActor(a[idRef]);
      }
    }
  }

  toString() {
    var movieStr = `Movie{ movieId: ${this.movieId}, title: ${this.title}, 
    releaseDate: ${this.releaseDate}, category: ${this.category}`;
    switch (this.category) {
    case MovieCategoryEL.TV_SERIES_EPISODE:
      movieStr += `, TV_SERIES_EPISODE.tvSeriesName: ${this.tvSeriesName}`
        + `, TV_SERIES_EPISODE.episodeNo: ${this.episodeNo}`;
      break;
    case MovieCategoryEL.BIOGRAPHY:
      movieStr += `, BIOGRAPHY.about: ${this.about}`;
      break;
    }
    return `${movieStr}, 
    director: ${this.director.name}, 
    actors: ${Object.keys(this.actors).join(",")} }`;
  }
  toJSON() {
    const rec = {};
    for (const p of Object.keys(this)) {
      // copy only property slots with underscore prefix
      if (p.charAt(0) !== "_") continue;
      switch (p) {
      case "_director":
        // convert object reference to ID reference
        if (this._director) rec.directorId = this._director.personId;
        break;
      case "_actors":
        // convert the map of object references to a list of ID references
        rec.actorIdRefs = [];
        for (const actorIdStr of Object.keys(this.actors)) {
          rec.actorIdRefs.push(parseInt(actorIdStr));
        }
        break;
      default:
        // remove underscore prefix
        rec[p.substr(1)] = this[p];
      }
    }
    return rec;
  }

  static instances = {};

  static add(slots) {
    var movie = null;
    try {
      movie = new Movie(slots);
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
      movie = null;
    }
    if (movie) {
      Movie.instances[movie.movieId] = movie;
      console.log(`${movie.toString()} created!`);
    }
  }
  static update({ movieId, title, releaseDate,
    category, tvSeriesName, episodeNo,
    about, actorIdRefsToAdd, actorIdRefsToRemove, directorId }) {
    const movie = Movie.instances[movieId],
      objectBeforeUpdate = cloneObject(movie);
    var noConstraintViolated = true, updatedProperties = [];
    try {
      if (title && movie.title !== title) {
        movie.title = title;
        updatedProperties.push("title");
      }
      if (releaseDate && movie.releaseDate.getTime() !==
        new Date(releaseDate).getTime()) {
        movie.releaseDate = releaseDate;
        updatedProperties.push("releaseDate");
      }
      if (category) {
        if (movie.category === undefined) {
          movie.category = category;
          updatedProperties.push("category");
        } else if (category !== movie.category) {
          throw new FrozenValueConstraintViolation(
            "The movie category must not be changed!");
        }
      } else if (category === "" && "category" in movie) {
        throw new FrozenValueConstraintViolation(
          "The movie category must not be unset!");
      }
      if (tvSeriesName && movie.tvSeriesName !== tvSeriesName) {
        movie.tvSeriesName = tvSeriesName;
        updatedProperties.push("tvSeriesName");
      }
      if (episodeNo && movie.episodeNo !== episodeNo) {
        movie.episodeNo = episodeNo;
        updatedProperties.push("episodeNo");
      }
      if (about && movie.about !== about) {
        movie.about = about;
        updatedProperties.push("about");
      }
      if (directorId && movie.director.personId !== parseInt(directorId)) {
        movie.director = directorId;
        updatedProperties.push("director");
      }
      if (actorIdRefsToAdd) {
        updatedProperties.push("actors(added)");
        for (const actorIdRef of actorIdRefsToAdd) {
          movie.addActor(actorIdRef);
        }
      }
      if (actorIdRefsToRemove) {
        updatedProperties.push("actors(removed)");
        for (const actorId of actorIdRefsToRemove) {
          movie.removeActor(actorId);
        }
      }
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
      noConstraintViolated = false;
      // restore object to its previous state (before updating)
      Movie.instances[movieId] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
      if (updatedProperties.length > 0) {
        let ending = updatedProperties.length > 1 ? "ies" : "y";
        console.log(`Propert${ending} ${updatedProperties.toString()} 
        modified for movie ${movieId}`);
      } else {
        console.log(`No property value changed for movie ${movie.toString()}!`);
      }
    }
  }
  static destroy(movieId) {
    if (Movie.instances[movieId]) {
      console.log(`${Movie.instances[movieId].toString()} deleted!`);
      delete Movie.instances[movieId];
    } else {
      console.log(`There is no movie with movieId ${movieId} in the database!`);
    }
  }

  static retrieveAll() {
    var movies = {};
    try {
      if (!localStorage["movies"]) localStorage.setItem("movies", "{}");
      else {
        movies = JSON.parse(localStorage["movies"]);
        console.log(Object.keys(movies).length + " movies loaded.");
      }
    } catch (e) {
      alert("Error when reading from Local Storage\n" + e);
    }
    for (const movieId of Object.keys(movies)) {
      Movie.instances[movieId] = Movie.convertRec2Obj(movies[movieId]);
    }
  }
  static convertRec2Obj(movieRow) {
    var movie = null;
    try {
      movie = new Movie(movieRow);
    } catch (e) {
      console.log(`${e.constructor.name} 
      while deserializing a movie record: ${e.message}`);
      console.trace();
    }
    return movie;
  }
  static saveAll() {
    const nmrOfMovies = Object.keys(Movie.instances).length;
    try {
      localStorage["movies"] = JSON.stringify(Movie.instances);
      console.log(`${nmrOfMovies} movie records saved.`);
    } catch (e) {
      alert("Error when writing to Local Storage\n" + e);
    }
  }
}
export default Movie;
export { MovieCategoryEL };
