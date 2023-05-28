import { cloneObject, isNonEmptyString } from "../../lib/util.mjs";
import {
  NoConstraintViolation, MandatoryValueConstraintViolation,
  RangeConstraintViolation, UniquenessConstraintViolation,
  ReferentialIntegrityConstraintViolation
}
  from "../../lib/errorTypes.mjs";

class Person {

  constructor({ personId, name }) {
    this.personId = personId;
    this.name = name;
  }

  get personId() {
    return this._personId;
  }
  static checkPersonId(id) {
    if (!id) {
      return new NoConstraintViolation();  // may be optional as an IdRef
    } else {
      // convert to integer
      id = parseInt(id);
      if (isNaN(id) || !Number.isInteger(id) || id < 1) {
        return new RangeConstraintViolation(
          "The person ID must be a positive integer!"
        );
      } else {
        return new NoConstraintViolation();
      }
    }
  }
  static checkPersonIdAsId(id, DirectType) {
    if (!DirectType) DirectType = Person;  // default
    id = parseInt(id);
    if (isNaN(id)) {
      return new MandatoryValueConstraintViolation(
        "A positive integer value for the person ID is required!"
      );
    }
    let validationResult = Person.checkPersonId(id);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (DirectType.instances[id]) {
        validationResult = new UniquenessConstraintViolation(
          `There is already a ${DirectType.name} 
          record with this person ID! ${id}`
        );
      } else {
        validationResult = new NoConstraintViolation();
      }
    }
    return validationResult;
  }
  static checkPersonIdAsIdRef(id, DirectType) {
    if (!DirectType) DirectType = Person;  // default
    var validationResult = Person.checkPersonId(id);
    if ((validationResult instanceof NoConstraintViolation) && id) {
      if (!DirectType.instances[id]) {
        validationResult = new ReferentialIntegrityConstraintViolation(
          `There is no person record with this person ID! ${id}`);
      }
    }
    return validationResult;
  }
  set personId(id) {
    // this.constructor may be Person or any category of it
    var validationResult = Person.checkPersonIdAsId(id, this.constructor);
    if (validationResult instanceof NoConstraintViolation) {
      this._personId = parseInt(id);
    } else {
      throw validationResult;
    }
  }

  get name() {
    return this._name;
  }
  static checkName(n) {
    if (!n) {
      return new MandatoryValueConstraintViolation(
        "A name must be provided!"
      );
    } else if (!isNonEmptyString(n)) {
      return new RangeConstraintViolation(
        "The name must be a non-empty string!"
      );
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

  toString() {
    return `Person{ personID: ${this.personId}, name: ${this.name} }`;
  }
  toJSON() {
    const rec = {};
    for (const p of Object.keys(this)) {
      // remove underscore prefix
      if (p.charAt(0) === "_") rec[p.substr(1)] = this[p];
    }
    return rec;
  }

  static instances = {}; // initially an empty collection (map)
  static subtypes = [];  // initially an empty collection (list)

  static add(slots) {
    var person = null;
    try {
      person = new Person(slots);
    } catch (e) {
      console.log(`${e.constructor.name + ": " + e.message}`);
      person = null;
    }
    if (person) {
      Person.instances[person.personId] = person;
      console.log(`Saved: ${person.name}`);
    }
  }
  static update({ personId, name }) {
    const person = Person.instances[personId],
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
      Person.instances[personId] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
      if (updatedProperties.length > 0) {
        ending = updatedProperties.length > 1 ? "ies" : "y";
        console.log(
          `Propert${ending} ${updatedProperties.toString()} 
        modified for person ${name}`
        );
      } else {
        console.log(`No property value changed for person ${name}!`);
      }
    }
  }
  static destroy(personId) {
    const person = Person.instances[personId];
    // also delete this person from subtype populations
    for (const Subtype of Person.subtypes) {
      if (personId in Subtype.instances) {
        delete Subtype.instances[personId];
      }
    }
    delete Person.instances[personId];
    console.log(`Person ${person.name} deleted.`);
  }

  static retrieveAll() {
    var people = {};
    if (!localStorage["people"]) localStorage["people"] = "{}";
    try {
      people = JSON.parse(localStorage["people"]);
    } catch (e) {
      console.log("Error when reading from Local Storage\n" + e);
    }
    for (const key of Object.keys(people)) {
      try {  // convert record to (typed) object
        Person.instances[key] = new Person(people[key]);
      } catch (e) {
        console.log(
          `${e.constructor.name} while 
          deserializing person ${key}: ${e.message}`
        );
      }
    }
    // add all instances of all subtypes to Person.instances
    for (const Subtype of Person.subtypes) {
      Subtype.retrieveAll();
      for (const key of Object.keys(Subtype.instances)) {
        Person.instances[key] = Subtype.instances[key];
      }
    }
    console.log(
      `${Object.keys(Person.instances).length} Person records loaded.`
    );
  }
  static saveAll() {
    const people = {};
    for (const key of Object.keys(Person.instances)) {
      const person = Person.instances[key];
      // save only direct instances (no directors, no actors)
      if (person.constructor === Person) people[key] = person;
    }
    try {
      localStorage["people"] = JSON.stringify(people);
      console.log(`${Object.keys(people).length} people saved.`);
    } catch (e) {
      alert("Error when writing to Local Storage\n" + e);
    }
  }
}

export default Person;
