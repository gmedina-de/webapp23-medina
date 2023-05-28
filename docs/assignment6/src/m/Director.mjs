import Person from "./Person.mjs";
import { cloneObject } from "../../lib/util.mjs";

class Director extends Person {

  constructor({ personId, name }) {
    super({ personId, name });  // invoke Person constructor
  }

  static instances = {};

  static add(slots) {
    var director = null;
    try {
      director = new Director(slots);
    } catch (e) {
      console.log(`${e.constructor.name + ": " + e.message}`);
      director = null;
    }
    if (director) {
      Director.instances[director.personId] = director;
      console.log(`Saved: ${director.name}`);
    }
  }
  static update({ personId, name }) {
    const director = Director.instances[personId],
      objectBeforeUpdate = cloneObject(director);
    var noConstraintViolated = true, updatedProperties = [];
    try {
      if (name && director.name !== name) {
        director.name = name;
        updatedProperties.push("name");
      }
    } catch (e) {
      console.log(e.constructor.name + ": " + e.message);
      noConstraintViolated = false;
      // restore object to its state before updating
      Director.instances[personId] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
      if (updatedProperties.length > 0) {
        let ending = updatedProperties.length > 1 ? "ies" : "y";
        console.log(
          `Propert${ending} ${updatedProperties.toString()} 
          modified for director ${name}`
        );
      } else {
        console.log(`No property value changed for director ${name}!`);
      }
    }
  }
  static destroy(personId) {
    const director = Director.instances[personId];
    delete Director.instances[personId];
    console.log(`Director ${director.name} deleted.`);
  }

  static retrieveAll() {
    var directors = {};
    if (!localStorage["directors"]) localStorage["directors"] = "{}";
    try {
      directors = JSON.parse(localStorage["directors"]);
    } catch (e) {
      console.log("Error when reading from Local Storage\n" + e);
    }
    for (const key of Object.keys(directors)) {
      try {  // convert record to (typed) object
        Director.instances[key] = new Director(directors[key]);
        // create superclass extension
        Person.instances[key] = Director.instances[key];
      } catch (e) {
        console.log(
          `${e.constructor.name}
           while deserializing director ${key}: ${e.message}`
        );
      }
    }
    console.log(
      `${Object.keys(Director.instances).length} Director records loaded.`
    );
  }
  static saveAll() {
    try {
      localStorage["directors"] = JSON.stringify(Director.instances);
      console.log(Object.keys(Director.instances).length + " directors saved.");
    } catch (e) {
      alert("Error when writing to Local Storage\n" + e);
    }
  }
}

export default Director;
// add Director to the list of Person subtypes
Person.subtypes.push(Director);
