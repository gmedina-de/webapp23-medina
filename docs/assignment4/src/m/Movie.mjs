/**
 * @fileOverview  The model class Movie with attribute definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 * @person Gerd Wagner
 */
import Person from "./Person.mjs";
import Publisher from "./Publisher.mjs";
import {cloneObject} from "../../lib/util.mjs";
import {NoConstraintViolation, MandatoryValueConstraintViolation,
  RangeConstraintViolation, PatternConstraintViolation, UniquenessConstraintViolation}
  from "../../lib/errorTypes.mjs";

/**
 * The class Movie
 * @class
 */
class Movie {
  // using a record parameter with ES6 function parameter destructuring
  constructor ({isbn, title, year, people, personIdRefs,
                 publisher, publisher_id}) {
    this.isbn = isbn;
    this.title = title;
    this.year = year;
    // assign object references or ID references (to be converted in setter)
    this.people = people || personIdRefs;
    if (publisher || publisher_id) {
      this.publisher = publisher || publisher_id;
    }
  }
  get isbn() {
    return this._isbn;
  }
  static checkIsbn( isbn) {
    if (!isbn) return new NoConstraintViolation();
    else if (typeof isbn !== "string" || isbn.trim() === "") {
      return new RangeConstraintViolation(
          "The ISBN must be a non-empty string!");
    } else if (!/\b\d{9}(\d|X)\b/.test( isbn)) {
      return new PatternConstraintViolation("The ISBN must be "+
          "a 10-digit string or a 9-digit string followed by 'X'!");
    } else {
      return new NoConstraintViolation();
    }
  }
  static checkIsbnAsId( isbn) {
    var validationResult = Movie.checkIsbn( isbn);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!isbn) {
        validationResult = new MandatoryValueConstraintViolation(
            "A value for the ISBN must be provided!");
      } else if (Movie.instances[isbn]) {
        validationResult = new UniquenessConstraintViolation(
            `There is already a movie record with ISBN ${isbn}`);
      } else {
        validationResult = new NoConstraintViolation();
      }
    }
    return validationResult;
  }
  set isbn( n) {
    const validationResult = Movie.checkIsbnAsId( n);
    if (validationResult instanceof NoConstraintViolation) {
      this._isbn = n;
    } else {
      throw validationResult;
    }
  }
  get title() {
    return this._title;
  }
  set title( t) {
    //SIMPLIFIED CODE: no validation with Movie.checkTitle
    this._title = t;
  }
  get year() {
    return this._year;
  }
  set year( y) {
    //SIMPLIFIED CODE: no validation with Movie.checkYear
    this._year = parseInt( y);
  }
  get publisher() {
    return this._publisher;
  }
  static checkPublisher( publisher_id) {
    var validationResult = null;
    if (!publisher_id) {
      validationResult = new NoConstraintViolation();  // optional
    } else {
      // invoke foreign key constraint check
      validationResult = Publisher.checkNameAsIdRef( publisher_id);
    }
    return validationResult;
  }
  set publisher( p) {
    if (!p) {  // unset publisher
      delete this._publisher;
    } else {
      // p can be an ID reference or an object reference
      const publisher_id = (typeof p !== "object") ? p : p.name;
      const validationResult = Movie.checkPublisher( publisher_id);
      if (validationResult instanceof NoConstraintViolation) {
        // create the new publisher reference
        this._publisher = Publisher.instances[ publisher_id];
      } else {
        throw validationResult;
      }
    }
  }
  get people() {
    return this._people;
  }
  static checkPerson( person_id) {
    var validationResult = null;
    if (!person_id) {
      // person(s) are optional
      validationResult = new NoConstraintViolation();
    } else {
      // invoke foreign key constraint check
      validationResult = Person.checkPersonIdAsIdRef( person_id);
    }
    return validationResult;
  }
  addPerson( a) {
    // a can be an ID reference or an object reference
    const person_id = (typeof a !== "object") ? parseInt( a) : a.personId;
    if (person_id) {
      const validationResult = Movie.checkPerson( person_id);
      if (person_id && validationResult instanceof NoConstraintViolation) {
        // add the new person reference
        const key = String( person_id);
        this._people[key] = Person.instances[key];
      } else {
        throw validationResult;
      }
    }
  }
  removePerson( a) {
    // a can be an ID reference or an object reference
    const person_id = (typeof a !== "object") ? parseInt( a) : a.personId;
    if (person_id) {
      const validationResult = Movie.checkPerson( person_id);
      if (validationResult instanceof NoConstraintViolation) {
        // delete the person reference
        delete this._people[String( person_id)];
      } else {
        throw validationResult;
      }
    }
  }
  set people( a) {
    this._people = {};
    if (Array.isArray(a)) {  // array of IdRefs
      for (const idRef of a) {
        this.addPerson( idRef);
      }
    } else {  // map of IdRefs to object references
      for (const idRef of Object.keys( a)) {
        this.addPerson( a[idRef]);
      }
    }
  }
  // Serialize movie object
  toString() {
    var movieStr = `Movie{ ISBN: ${this.isbn}, title: ${this.title}, year: ${this.year}`;
    if (this.publisher) movieStr += `, publisher: ${this.publisher.name}`;
    return `${movieStr}, people: ${Object.keys( this.people).join(",")} }`;
  }
  // Convert object to record with ID references
  toJSON() {  // is invoked by JSON.stringify in Movie.saveAll
    var rec = {};
    for (const p of Object.keys( this)) {
      // copy only property slots with underscore prefix
      if (p.charAt(0) !== "_") continue;
      switch (p) {
        case "_publisher":
          // convert object reference to ID reference
          if (this._publisher) rec.publisher_id = this._publisher.name;
          break;
        case "_people":
          // convert the map of object references to a list of ID references
          rec.personIdRefs = [];
          for (const personIdStr of Object.keys( this.people)) {
            rec.personIdRefs.push( parseInt( personIdStr));
          }
          break;
        default:
          // remove underscore prefix
          rec[p.substr(1)] = this[p];
      }
    }
    return rec;
  }
}
/***********************************************
*** Class-level ("static") properties **********
************************************************/
// initially an empty collection (in the form of a map)
Movie.instances = {};

/********************************************************
*** Class-level ("static") storage management methods ***
*********************************************************/
/**
 *  Create a new movie record/object
 */
Movie.add = function (slots) {
  try {
    const movie = new Movie( slots);
    Movie.instances[movie.isbn] = movie;
    console.log(`Movie record ${movie.toString()} created!`);
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
  }
};
/**
 *  Update an existing Movie record/object
 */
Movie.update = function ({isbn, title, year,
    personIdRefsToAdd, personIdRefsToRemove, publisher_id}) {
  const movie = Movie.instances[isbn],
        objectBeforeUpdate = cloneObject( movie);
  var noConstraintViolated=true, updatedProperties=[];
  try {
    if (title && movie.title !== title) {
      movie.title = title;
      updatedProperties.push("title");
    }
    if (year && movie.year !== parseInt( year)) {
      movie.year = year;
      updatedProperties.push("year");
    }
    if (personIdRefsToAdd) {
      updatedProperties.push("people(added)");
      for (const personIdRef of personIdRefsToAdd) {
        movie.addPerson( personIdRef);
      }
    }
    if (personIdRefsToRemove) {
      updatedProperties.push("people(removed)");
      for (const person_id of personIdRefsToRemove) {
        movie.removePerson( person_id);
      }
    }
    // publisher_id may be the empty string for unsetting the optional property
    if (publisher_id && (!movie.publisher && publisher_id ||
        movie.publisher && movie.publisher.name !== publisher_id)) {
      movie.publisher = publisher_id;
      updatedProperties.push("publisher");
    }
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
    noConstraintViolated = false;
    // restore object to its state before updating
    Movie.instances[isbn] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      let ending = updatedProperties.length > 1 ? "ies" : "y";
      console.log(`Propert${ending} ${updatedProperties.toString()} modified for movie ${isbn}`);
    } else {
      console.log(`No property value changed for movie ${movie.isbn}!`);
    }
  }
};
/**
 *  Delete an existing Movie record/object
 */
Movie.destroy = function (isbn) {
  if (Movie.instances[isbn]) {
    console.log(`${Movie.instances[isbn].toString()} deleted!`);
    delete Movie.instances[isbn];
  } else {
    console.log(`There is no movie with ISBN ${isbn} in the database!`);
  }
};
/**
 *  Load all movie table rows and convert them to objects 
 *  Precondition: publishers and people must be loaded first
 */
Movie.retrieveAll = function () {
  var movies = {};
  try {
    if (!localStorage["movies"]) localStorage["movies"] = "{}";
    else {
      movies = JSON.parse( localStorage["movies"]);
      console.log(`${Object.keys( movies).length} movie records loaded.`);
    }
  } catch (e) {
    alert( "Error when reading from Local Storage\n" + e);
  }
  for (const isbn of Object.keys( movies)) {
    try {
      Movie.instances[isbn] = new Movie( movies[isbn]);
    } catch (e) {
      console.log(`${e.constructor.name} while deserializing movie ${isbn}: ${e.message}`);
    }
  }
};
/**
 *  Save all movie objects
 */
Movie.saveAll = function () {
  const nmrOfMovies = Object.keys( Movie.instances).length;
  try {
    localStorage["movies"] = JSON.stringify( Movie.instances);
    console.log(`${nmrOfMovies} movie records saved.`);
  } catch (e) {
    alert( "Error when writing to Local Storage\n" + e);
  }
};

export default Movie;
