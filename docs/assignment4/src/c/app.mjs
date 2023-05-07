/**
 * @fileOverview  Auxiliary data management procedures
 * @person Gerd Wagner
 */
import Person from "../m/Person.mjs";
import Publisher from "../m/Publisher.mjs";
import Movie from "../m/Movie.mjs";

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 *  Create and save test data
 */
function generateTestData() {
  try {
    Person.instances["1"] = new Person({
      personId: 1,
      name: "Daniel Dennett"
    });
    Person.instances["2"] = new Person({
      personId: 2,
      name: "Douglas Hofstadter"
    });
    Person.instances["3"] = new Person({
      personId: 3,
      name: "Immanuel Kant"
    });
    Person.saveAll();
    Publisher.instances["Bantam Movies"] = new Publisher({
      name: "Bantam Movies",
      address: "New York, USA"
    });
    Publisher.instances["Basic Movies"] = new Publisher({
      name: "Basic Movies",
      address: "New York, USA"
    });
    Publisher.saveAll();
    Movie.instances["0553345842"] = new Movie({
      isbn: "0553345842",
      title: "The Mind's I",
      year: 1982,
      personIdRefs: [1,2],
      publisher_id: "Bantam Movies"
    });
    Movie.instances["1463794762"] = new Movie({
      isbn: "1463794762",
      title: "The Critique of Pure Reason",
      year: 2011,
      personIdRefs: [3]
    });
    Movie.instances["1928565379"] = new Movie({
      isbn: "1928565379",
      title: "The Critique of Practical Reason",
      year: 2009,
      personIdRefs: [3]
    });
    Movie.instances["0465030793"] = new Movie({
      isbn: "0465030793",
      title: "I Am A Strange Loop",
      year: 2000,
      personIdRefs: [2],
      publisher_id: "Basic Movies"
    });
    Movie.saveAll();
  } catch (e) {
    console.log( `${e.constructor.name}: ${e.message}`);
  }
}
/**
 * Clear data
 */
function clearData() {
  if (confirm( "Do you really want to delete the entire database?")) {
    try {
      Person.instances = {};
      localStorage["people"] = "{}";
      Publisher.instances = {};
      localStorage["publishers"] = "{}";
      Movie.instances = {};
      localStorage["movies"] = "{}";
      console.log("All data cleared.");
    } catch (e) {
      console.log( `${e.constructor.name}: ${e.message}`);
    }
  }
}

export { generateTestData, clearData };
