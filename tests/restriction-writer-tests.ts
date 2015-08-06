import * as should from "should";
import * as XmlWriter from "xml-writer";
import {RestrictionWriter} from "../lib/json-xsd-writer";
import {Restriction} from "../lib/xsd-elements";



// a dummy reference of the should variable so that is import gets included
// to the generated javascript:
var aDummyThing = should;

describe("RestrictionWriter.write", () => {
    it("should throw an exception when run on a null or undefined value", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            should(() => {
                let writer = new RestrictionWriter(null);
                writer.write(xmlWriter);
            }).throw(/Restriction to be written is null or undefined/);
    });
    it("should write an empty tag when run on a Restriction with null properties", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction(null, null, null, null));
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction\/>/);

    });
    it("should write the base when has a value", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction("xs:string", null, null, null));
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction base="xs:string"\/>/);
    });
    it("should write the base and pattern when both have values", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction("xs:string", "\\w+", null, null));
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction base="xs:string">[\n\s]*<xs:pattern value="\\w\+"\/>[\n\s]*<\/xs:restriction>/);
    });
    it("should write the pattern when has value and others null", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction(null, "\\w+", null, null));
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction>[\n\s]*<xs:pattern value="\\w\+"\/>[\n\s]*<\/xs:restriction>/);
    });
    it("should write the whiteSpace when others null", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction(null, null, "collapse", null));
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction>[\n\s]*<xs:whiteSpace value="collapse"\/>[\n\s]*<\/xs:restriction>/);
    });
    it("should write the enumaration when others null", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction(null, null, null, ["Android", "iOS", "Windows"]))
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction>[\n\s]*<xs:enumeration value="Android"\/>[\n\s]*<xs:enumeration value="iOS"\/>[\n\s]*<xs:enumeration value="Windows"\/>[\n\s]*<\/xs:restriction>/);
    });
    it("should write the base and whiteSpace when both have values", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction("xs:string", null, "collapse", null));
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction base="xs:string">[\n\s]*<xs:whiteSpace value="collapse"\/>[\n\s]*<\/xs:restriction>/);
    });
    it("should write base, pattern and whiteSpace when all have values", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction("xs:string", "\\w+", "collapse", null));
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction base="xs:string">[\n\s]*<xs:pattern value="\\w\+"\/>[\n\s]*<xs:whiteSpace value="collapse"\/>[\n\s]*<\/xs:restriction>/);
    });
    it("should write all when all have values", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();

            let writer = new RestrictionWriter(new Restriction("xs:string", "\\w+", "collapse", ["Android", "iOS", "Windows"]));
            writer.write(xmlWriter);
            xmlWriter.toString().should.match(/<xs:restriction base="xs:string">[\n\s]*<xs:pattern value="\\w\+"\/>[\n\s]*<xs:whiteSpace value="collapse"\/>[\n\s]*<xs:enumeration value="Android"\/>[\n\s]*<xs:enumeration value="iOS"\/>[\n\s]*<xs:enumeration value="Windows"\/>[\n\s]*<\/xs:restriction>/);
    });
});
