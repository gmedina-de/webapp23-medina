import Person from "./Person.mjs";
import { cloneObject } from "../../lib/util.mjs";
import {
  NoConstraintViolation,
} from "../../lib/errorTypes.mjs";

class Actor extends Person {

  constructor({ personId, name, agent, agentId }) {
    super({ personId, name }); // invoke Person constructor
    // assign additional properties
    if (agent || agentId) this.agent = agent || agentId;
  }

  get agent() {
    return this._agent;
  }
  static checkAgent(a) {
    if (!a) {
      return new NoConstraintViolation();
    }
    return Person.checkPersonIdAsIdRef(a);
  }
  set agent(a) {
    // can be an ID reference or an object reference
    const id = (typeof d !== "object") ? parseInt(a) : a.personId;
    const validationResult = Actor.checkAgent(id);
    if (validationResult instanceof NoConstraintViolation) {
      if (!a) {
        delete this._agent;
      } else {
        this._agent = Person.instances[id];
      }
    } else {
      throw validationResult;
    }
  }

  toString() {
    var result = `Actor { personID: ${this.personId}, name: ${this.name}`;
    if (this.agent) result += `, agent: ${this.agent}`;
    return `${result} }`;
  }
  toJSON() {
    const rec = {};
    for (const p of Object.keys(this)) {
      // copy only property slots with underscore prefix
      if (p.charAt(0) !== "_") continue;
      switch (p) {
      case "_agent":
        // convert object reference to ID reference
        if (this._agent) rec.agentId = this._agent.personId;
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
    var actor = null;
    try {
      actor = new Actor(slots);
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
      actor = null;
    }
    if (actor) {
      Actor.instances[actor.personId] = actor;
      console.log(`${actor.toString()} created!`);
    }
  }
  static update({ personId, name, agentId }) {
    const actor = Actor.instances[personId],
      objectBeforeUpdate = cloneObject(actor);
    var noConstraintViolated = true, updatedProperties = [];
    try {
      if (name && actor.name !== name) {
        actor.name = name;
        updatedProperties.push("name");
      }


      if (agentId && 
        (!actor.agent || actor.agent.personId !== parseInt(agentId))) {
        actor.agent = agentId;
        updatedProperties.push("agent");
      }
    } catch (e) {
      console.log(e.constructor.name + ": " + e.message);
      noConstraintViolated = false;
      // restore object to its state before updating
      Actor.instances[personId] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
      if (updatedProperties.length > 0) {
        const ending = updatedProperties.length > 1 ? "ies" : "y";
        console.log(
          `Propert${ending} ${updatedProperties.toString()}
           modified for actor ${name}`
        );
      } else {
        console.log(`No property value changed for Actor ${actor.name}!`);
      }
    }
  }
  static destroy(personId) {
    const name = Actor.instances[personId].name;
    delete Actor.instances[personId];
    console.log(`Actor ${name} deleted.`);
  }

  static retrieveAll() {
    var actors = {};
    if (!localStorage["actors"]) localStorage["actors"] = "{}";
    try {
      actors = JSON.parse(localStorage["actors"]);
    } catch (e) {
      console.log("Error when reading from Local Storage\n" + e);
    }
    for (const key of Object.keys(actors)) {
      try {  // convert record to (typed) object
        Actor.instances[key] = new Actor(actors[key]);
        // create superclass extension
        Person.instances[key] = Actor.instances[key];
      } catch (e) {
        console.log(`${e.constructor.name} 
        while deserializing actor ${key}: ${e.message}`);
      }
    }
    console.log(`${Object.keys(Actor.instances).length} Actor records loaded.`);
  }
  static saveAll() {
    try {
      localStorage["actors"] = JSON.stringify(Actor.instances);
      console.log(Object.keys(Actor.instances).length + " actors saved.");
    } catch (e) {
      alert("Error when writing to Local Storage\n" + e);
    }
  }
}
// add Actor to the list of Person subtypes
Person.subtypes.push(Actor);

export default Actor;
