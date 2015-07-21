import * as should from "should";
import {Type} from "../lib/lang-elements"

// a dummy reference of the should variable so that is import gets included
// to the generated javascript:
var aDummyThing = should;

describe("Type.name", function(){
    describe("created by a non-dotted string", function(){
        it("should return the full string", function(){
            var myType = new Type("ATypeName");
            myType.name.should.equal("ATypeName");
        });
    });
    describe("created with an undefined value", function(){
        it("should return null", function(){
            var myType = new Type(void 0);
            should.not.exist(myType.name);
        });
    });
    describe("created with a null value", function(){
        it("should return null", function(){
            var myType = new Type(null);
            should.not.exist(myType.name);
        });
    });
    describe("created with a dot as a value", function(){
        it("should return dot", function(){
            var myType = new Type(".");
            myType.name.should.equal(".");
        });
    });
    describe("created with an empty string as a value", function(){
        it("should return empty string", function(){
            var myType = new Type("");
            myType.name.should.equal("");
        });
    });
    describe("created with a string with dots", function(){
        it("should return the remainder after the last dot", function(){
            var myType = new Type("some.very.deeply.namespaced.TypeName");
            myType.name.should.equal("TypeName");
        });
    });
    describe("created with a string ending with a dot", function(){
        it("should return the string before the last dot", function(){
            var myType = new Type("some.very.deeply.namespaced.TypeName.");
            myType.name.should.equal("TypeName");
        });
    });
});
