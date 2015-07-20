import * as should from "should";
import {Utils} from "../lib/globals";

// a dummy reference of the should variable so that is import gets included
// to the generated javascript:
var aDummyThing = should;

describe("Utils", () => {
    describe("ensureStartingUCase", () => {
        it("leaves first letter upper case", () => {
            Utils.ensureStartingUCase("Something").should.eql("Something");
        });
        it("makes first letter upper case", () => {
            Utils.ensureStartingUCase("something").should.eql("Something");
        });
    });
    describe("ensureStartingLCase", () => {
        it("leaves first letter lower case", () => {
            Utils.ensureStartingLCase("something").should.eql("something");
        });
        it("makes first letter lower case", () => {
            Utils.ensureStartingLCase("Something").should.eql("something");
        });
    });
});
