/**
 * @fileOverview  The model class Person with property definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 */
import { cloneObject, isNonEmptyString } from "../../lib/util.mjs";
import {
  NoConstraintViolation, MandatoryValueConstraintViolation,
  RangeConstraintViolation, UniquenessConstraintViolation,
  ReferentialIntegrityConstraintViolation
} from "../../lib/errorTypes.mjs";

/**
 * The class Person
 * @class
 * @param {object} slots - Object creation slots.
 */
class Person {
  // using a single record parameter with ES6 function parameter destructuring
  constructor({ personId, name }) {
    // assign properties by invoking implicit setters
    this.personId = personId;  // number (integer)
    this.name = name;  // string

    // derived inverse reference properties
    this._directedMovies = {};
    this._playedMovies = {};
  }

  get personId() {
    return this._personId;
  }
  static checkPersonId(id) {
    if (!id) {
      return new NoConstraintViolation();  // may be optional as an IdRef
    } else {
      id = parseInt(id);  // convert to integer
      if (isNaN(id) || !Number.isInteger(id) || id < 1) {
        return new RangeConstraintViolation("The person ID must be a positive integer!");
      } else {
        return new NoConstraintViolation();
      }
    }
  }
  static checkPersonIdAsId(id) {
    var constraintViolation = Person.checkPersonId(id);
    if ((constraintViolation instanceof NoConstraintViolation)) {
      // convert to integer
      id = parseInt(id);
      if (isNaN(id)) {
        return new MandatoryValueConstraintViolation(
          "A positive integer value for the person ID is required!");
      } else if (Person.instances[String(id)]) {  // convert to string if number
        constraintViolation = new UniquenessConstraintViolation(
          "There is already a person record with this person ID!"
        );
      } else {
        constraintViolation = new NoConstraintViolation();
      }
    }
    return constraintViolation;
  }
  static checkPersonIdAsIdRef(id) {
    var constraintViolation = Person.checkPersonId(id);
    if ((constraintViolation instanceof NoConstraintViolation) && id) {
      if (!Person.instances[String(id)]) {
        constraintViolation = new ReferentialIntegrityConstraintViolation(
          "There is no person record with this person ID!"
        );
      }
    }
    return constraintViolation;
  }
  set personId(id) {
    const constraintViolation = Person.checkPersonIdAsId(id);
    if (constraintViolation instanceof NoConstraintViolation) {
      this._personId = parseInt(id);
    } else {
      throw constraintViolation;
    }
  }

  get name() {
    return this._name;
  }
  static checkName(n) {
    if (!n) {
      return new MandatoryValueConstraintViolation("A name must be provided!");
    } else if (!isNonEmptyString(n)) {
      return new RangeConstraintViolation("The name must be a non-empty string!");
    } else {
      return new NoConstraintViolation();
    }
  }
  set name(n) {
    var validationResult = Person.checkName(n);
    if (validationResult instanceof NoConstraintViolation) {
      this._name = n;
    } else {
      throw validationResult;
    }
  }

  get directedMovies() {
    return this._directedMovies;
  }

  get playedMovies() {
    return this._playedMovies;
  }

  toString() {
    return `Person{ personId: ${this.personId}, name: ${this.name} }`;
  }

  toJSON() {  // is invoked by JSON.stringify in Publisher.saveAll
    var rec = {};
    // loop over all Publisher properties
    for (const p of Object.keys(this)) {
      // keep underscore-prefixed properties except "_publishedBooks"
      if (p.charAt(0) === "_" && p !== "_directedMovies" && p !== "_playedMovies") {
        // remove underscore prefix
        rec[p.substr(1)] = this[p];
      }
    }
    return rec;
  }

  // initially an empty collection (in the form of a map)
  static instances = {};
  /**
   *  Create a new person record/object
   */
  static add(slots) {
    try {
      const person = new Person(slots);
      Person.instances[person.personId] = person;
      console.log(`Saved: ${person.name}`);
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
    }
  }
  /**
   *  Update an existing person record/object
   */
  static update({ personId, name }) {
    const person = Person.instances[String(personId)],
      objectBeforeUpdate = cloneObject(person);
    var noConstraintViolated = true, ending = "", updatedProperties = [];
    try {
      if (name && person.name !== name) {
        person.name = name;
        updatedProperties.push("name");
      }
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
      noConstraintViolated = false;
      // restore object to its state before updating
      Person.instances[String(personId)] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
      if (updatedProperties.length > 0) {
        ending = updatedProperties.length > 1 ? "ies" : "y";
        console.log(`Propert${ending} ${updatedProperties.toString()} modified for person ${name}`);
      } else {
        console.log(`No property value changed for person ${name}!`);
      }
    }
  }
  /**
   *  Delete an existing person record
   *  Since both person-movie associations are bidirectional, 
   *  an actor can be directly deleted from the movie's actors, 
   *  instead of doing a linear search on all movies as required for the case of a unidirectional association.
   *  Moreover, the deletion of a director implies the deletion of his or her directed movies.
   */
  static destroy(personId) {
    const person = Person.instances[personId];
    // delete all dependent movie records
    for (const movieId of Object.keys(person.playedMovies)) {
      let movie = person.playedMovies[movieId];
      if (movie.actors[personId]) delete movie.actors[personId];
    }
    // delete the person object
    delete Person.instances[personId];
    console.log(`Person ${person.name} deleted.`);
  }
  /**
   *  Load all person records and convert them to objects
   */
  static retrieveAll() {
    var people = {};
    if (!localStorage["people"]) localStorage["people"] = "{}";
    try {
      people = JSON.parse(localStorage["people"]);
    } catch (e) {
      console.log("Error when reading from Local Storage\n" + e);
      people = {};
    }
    for (const key of Object.keys(people)) {
      try {
        // convert record to (typed) object
        Person.instances[key] = new Person(people[key]);
      } catch (e) {
        console.log(`${e.constructor.name} while deserializing person ${key}: ${e.message}`);
      }
    }
    console.log(`${Object.keys(people).length} person records loaded.`);
  }
  /**
   *  Save all person objects as records
   */
  static saveAll() {
    const nmrOfPeople = Object.keys(Person.instances).length;
    try {
      localStorage["people"] = JSON.stringify(Person.instances);
      console.log(`${nmrOfPeople} person records saved.`);
    } catch (e) {
      alert("Error when writing to Local Storage\n" + e);
    }
  }
}

export default Person;
