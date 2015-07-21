import * as should from "should";
import {JsonXsdWriter} from "../lib/json-xsd-writer";
import {Tree, Class, Property, Type} from "../lib/lang-elements";
import * as XmlWriter from "xml-writer";
import {Validator, ValidatorFactory} from "../lib/xsd-elements";
import {parseString} from "xml2js";

// a dummy reference of the should variable so that is import gets included
// to the generated javascript:
var aDummyThing = should;

describe("ValidatorFactory", () => {
    describe("getValidator method", () => {
        it("should return a StringValidator when the type of the property is string", () => {
            var factory = new ValidatorFactory();
            var propertyType = new Type("string");

            factory.getValidator(propertyType).name.should.eql("StringValidator");
        });
    });
});
