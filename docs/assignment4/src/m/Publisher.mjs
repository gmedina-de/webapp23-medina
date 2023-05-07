/**
 * @fileOverview  The model class Publisher with property definitions, (class-level) check methods, 
 *                setter methods, and the special methods saveAll and retrieveAll
 * @person Gerd Wagner
 */
import Movie from "./Movie.mjs";
import { cloneObject } from "../../lib/util.mjs";
import { NoConstraintViolation, MandatoryValueConstraintViolation, RangeConstraintViolation,
  UniquenessConstraintViolation, ReferentialIntegrityConstraintViolation }
  from "../../lib/errorTypes.mjs";

/**
 * The class Publisher
 * @class
 * @param {object} slots - Object creation slots.
 */
class Publisher {
  // using a single record parameter with ES6 function parameter destructuring
  constructor ({name, address}) {
    // assign properties by invoking implicit setters
    this.name = name;
    this.address = address;
  }
  get name() {
    return this._name;
  }
  static checkName( n) {
    if (!n) {
      return new NoConstraintViolation();  // not mandatory
    } else {
      if (typeof n !== "string" || n.trim() === "") {
        return new RangeConstraintViolation(
		    "The name must be a non-empty string!");
      } else {
        return new NoConstraintViolation();
      }
    }
  }
  static checkNameAsId( n) {
    var validationResult = Publisher.checkName(n);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!n) {
        return new MandatoryValueConstraintViolation(
            "A publisher name is required!");
      } else if (Publisher.instances[n]) {
        return new UniquenessConstraintViolation(
            "There is already a publisher record with this name!");
      }
    }
    return validationResult;
  }
  static checkNameAsIdRef( n) {
    var validationResult = Publisher.checkName( n);
    if ((validationResult instanceof NoConstraintViolation) && n) {
      if (!Publisher.instances[n]) {
        validationResult = new ReferentialIntegrityConstraintViolation(
          "There is no publisher record with this name!");
      }
    }
    return validationResult;
  }
  set name( n) {
    var constraintViolation = Publisher.checkName( n);
    if (constraintViolation instanceof NoConstraintViolation) {
      this._name = n;
    } else {
      throw constraintViolation;
    }
  }
  get address() {
    return this._address;
  }
  //SIMPLIFIED CODE:  Publisher.checkAddress has not been defined
  set address( a) {
    //SIMPLIFIED/MISSING CODE:  invoke Publisher.checkAddress
    this._address = a;
  }
  toString() {
    return `Publisher{ name: ${this.name}, address: ${this.address} }`;
  }
  toJSON() {  // is invoked by JSON.stringify
    var rec = {};
    for (const p of Object.keys( this)) {
      // remove underscore prefix
      if (p.charAt(0) === "_") rec[p.substr(1)] = this[p];
    }
    return rec;
  }
}
/***********************************************
*** Class-level ("static") properties **********
************************************************/
// initially an empty collection (in the form of a map)
Publisher.instances = {};

/****************************************************
*** Class-level ("static") methods ******************
*****************************************************/
/**
 *  Create a new publisher record/object
 */
Publisher.add = function (slots) {
  try {
    const publisher = new Publisher( slots);
    Publisher.instances[publisher.name] = publisher;
    console.log(`${publisher.toString()} created!`);
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
  }
};
/**
 *  Update an existing Publisher record/object
 */
Publisher.update = function (slots) {
  const publisher = Publisher.instances[slots.name],
        objectBeforeUpdate = cloneObject( publisher);
  var noConstraintViolated = true,
      ending = "", updatedProperties = [];
  try {
    if ("address" in slots && publisher.address !== slots.address) {
      publisher.address = slots.address;
      updatedProperties.push("address");
    }
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
    noConstraintViolated = false;
    // restore object to its state before updating
    Publisher.instances[slots.name] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      ending = updatedProperties.length > 1 ? "ies" : "y";
      console.log(`Propert${ending} ${updatedProperties.toString()} modified for publisher ${publisher.name}`);
    } else {
      console.log(`No property value changed for publisher ${publisher.name}!`);
    }
  }
};
/**
 *  Delete an existing Publisher record/object
 */
Publisher.destroy = function (name) {
  // delete all references to this publisher in movie objects
  for (const key of Object.keys( Movie.instances)) {
    const movie = Movie.instances[key];
    if (movie.publisher?.name === name) {  // publisher is optional
      delete movie._publisher;  // delete the slot
    }
  }
  // delete the publisher object
  delete Publisher.instances[name];
  console.log(`Publisher ${name} deleted.`);
};
/**
 *  Load all publisher records and convert them to objects
 */
Publisher.retrieveAll = function () {
  var publishers = {};
  if (!localStorage["publishers"]) localStorage["publishers"] = "{}";
  try {
    publishers = JSON.parse( localStorage["publishers"]);
  } catch (e) {
    console.log( "Error when reading from Local Storage\n" + e);
    return;
  }
  for (const publName of Object.keys( publishers)) {
    try {
      Publisher.instances[publName] = new Publisher( publishers[publName]);
    } catch (e) {
      console.log(`${e.constructor.name} while deserializing publisher ${publName}: ${e.message}`);
    }
  }
  console.log(`${Object.keys( publishers).length} publisher records loaded.`);
};
/**
 *  Save all publisher objects as rows
 */
Publisher.saveAll = function () {
  const nmrOfPubl = Object.keys( Publisher.instances).length;
  try {
    localStorage["publishers"] = JSON.stringify( Publisher.instances);
    console.log(`${nmrOfPubl} publisher records saved.`);
  } catch (e) {
    console.error( "Error when writing to Local Storage\n" + e);
  }
};

export default Publisher;
