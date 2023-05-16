/**
 * @fileOverview  The model class Movie with attribute definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 */
import Person from "./Person.mjs";
import { cloneObject, isNonEmptyString } from "../../lib/util.mjs";
import {
  NoConstraintViolation, MandatoryValueConstraintViolation,
  RangeConstraintViolation, UniquenessConstraintViolation,
  ReferentialIntegrityConstraintViolation
} from "../../lib/errorTypes.mjs";

/**
 * The class Movie
 * @class
 */
class Movie {
  // using a record parameter with ES6 function parameter destructuring
  constructor({ movieId, title, releaseDate, director, directorId, actors, actorIdRefs }) {
    this.movieId = movieId;
    this.title = title;
    this.releaseDate = releaseDate;
    // assign object references or ID references (to be converted in setter)
    this.director = director || directorId;
    this.actors = actors || actorIdRefs;
  }

  get movieId() {
    return this._movieId;
  }
  static checkMovieId(id) {
    id = parseInt(id);  // convert to integer
    if (isNaN(id) || !Number.isInteger(id) || id < 1) {
      return new RangeConstraintViolation("The movie ID must be a positive integer!");
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
  static checkMovieIdAsIdRef(id) {
    var constraintViolation = Movie.checkMovieId(id);
    if ((constraintViolation instanceof NoConstraintViolation) && id) {
      if (!Movie.instances[String(id)]) {
        constraintViolation = new ReferentialIntegrityConstraintViolation(
          "There is no movie record with this movie ID!"
        );
      }
    }
    return constraintViolation;
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
      return new RangeConstraintViolation("The title must be a non-empty string!");
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
      return new MandatoryValueConstraintViolation("A release date must be provided!");
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

  get director() {
    return this._director;
  }
  static checkDirector(d) {
    if (!d) {
      return new MandatoryValueConstraintViolation("A director must be provided!");
    }
    return Person.checkPersonIdAsIdRef(d);
  }
  set director(d) {
    // d can be an ID reference or an object reference
    const id = (typeof d !== "object") ? parseInt(d) : d.personId;
    const validationResult = Movie.checkDirector(id);
    if (validationResult instanceof NoConstraintViolation) {
      // delete the obsolete inverse reference
      if (this._director) {
        delete this._director.directedMovies[this._movieId];
      }
      // create the new director reference
      this._director = Person.instances[id];
      // add the new inverse reference
      this._director.directedMovies[this._movieId] = this;
    } else {
      throw validationResult;
    }
  }

  get actors() {
    return this._actors;
  }
  static checkActor(a) {
    var validationResult = null;
    if (!a) {
      // actor(s) are optional
      validationResult = new NoConstraintViolation();
    } else {
      // invoke foreign key constraint check
      validationResult = Person.checkPersonIdAsIdRef(a);
    }
    return validationResult;
  }
  addActor(a) {
    // a can be an ID reference or an object reference
    const id = (typeof a !== "object") ? parseInt(a) : a.actorId;
    if (id) {
      const validationResult = Movie.checkActor(id);
      if (id && validationResult instanceof NoConstraintViolation) {
        const key = String(id);
        // add the new actor reference
        this._actors[key] = Person.instances[key];
        // automatically add the derived inverse reference
        this._actors[key].playedMovies[this._movieId] = this;
      } else {
        throw validationResult;
      }
    }
  }
  removeActor(a) {
    // a can be an ID reference or an object reference
    const actor_id = (typeof a !== "object") ? parseInt(a) : a.actorId;
    if (actor_id) {
      const validationResult = Movie.checkActor(actor_id);
      if (validationResult instanceof NoConstraintViolation) {
        // automatically delete the derived inverse reference
        delete this._actors[String(actor_id)].playedMovies[this._movieId];
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

  // Serialize movie object
  toString() {
    var movieStr = `Movie{ movieId: ${this.movieId}, title: ${this.title}, releaseDate: ${this.releaseDate}, director: ${this.director.name}`;
    return `${movieStr}, actors: ${Object.keys(this.actors).join(",")} }`;
  }
  // Convert object to record with ID references
  toJSON() {  // is invoked by JSON.stringify in Movie.saveAll
    var rec = {};
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

  // initially an empty collection (in the form of a map)
  static instances = {};
  /**
   *  Create a new movie record/object
   */
  static add(slots) {
    try {
      const movie = new Movie(slots);
      Movie.instances[movie.movieId] = movie;
      console.log(`Movie record ${movie.toString()} created!`);
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
    }
  }
  /**
   *  Update an existing Movie record/object
   */
  static update({ movieId, title, releaseDate, actorIdRefsToAdd, actorIdRefsToRemove, directorId }) {
    const movie = Movie.instances[movieId], objectBeforeUpdate = cloneObject(movie);
    var noConstraintViolated = true, updatedProperties = [];
    try {
      if (title && movie.title !== title) {
        movie.title = title;
        updatedProperties.push("title");
      }
      if (releaseDate && movie.releaseDate.getTime() !== new Date(releaseDate).getTime()) {
        movie.releaseDate = releaseDate;
        updatedProperties.push("releaseDate");
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
      // restore object to its state before updating
      Movie.instances[movieId] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
      if (updatedProperties.length > 0) {
        let ending = updatedProperties.length > 1 ? "ies" : "y";
        console.log(`Propert${ending} ${updatedProperties.toString()} modified for movie ${movieId}`);
      } else {
        console.log(`No property value changed for movie ${movie.movieId}!`);
      }
    }
  }
  /**
   *  Delete an existing Movie record/object
   */
  static destroy(movieId) {
    const movie = Movie.instances[movieId];
    if (movie) {
      console.log(`${movie.toString()} deleted!`);

      // remove inverse reference from movie.director
      if (movie.director) {
        delete movie.director.directedMovies[movieId];
      }

      // remove inverse references from all movie.actors
      for (const actorId of Object.keys(movie.actors)) {
        delete movie.actors[actorId].playedMovies[movieId];
      }

      delete Movie.instances[movieId];
    } else {
      console.log(`There is no movie with movieId ${movieId} in the database!`);
    }
  }
  /**
   *  Load all movie table rows and convert them to objects 
   *  Precondition: directors and actors must be loaded first
   */
  static retrieveAll() {
    var movies = {};
    try {
      if (!localStorage["movies"]) localStorage["movies"] = "{}";
      else {
        movies = JSON.parse(localStorage["movies"]);
        console.log(`${Object.keys(movies).length} movie records loaded.`);
      }
    } catch (e) {
      alert("Error when reading from Local Storage\n" + e);
    }
    for (const movieId of Object.keys(movies)) {
      try {
        Movie.instances[movieId] = new Movie(movies[movieId]);
      } catch (e) {
        console.log(`${e.constructor.name} while deserializing movie ${movieId}: ${e.message}`);
      }
    }
  }
  /**
   *  Save all movie objects
   */
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
