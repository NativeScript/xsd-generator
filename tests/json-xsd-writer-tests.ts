import * as should from "should";
import {JsonXsdWriter, ValidatorWriter} from "../lib/json-xsd-writer";
import {Tree, Class, Property, Type} from "../lib/lang-elements";
import * as XmlWriter from "xml-writer";
import {Validator, Restriction} from "../lib/xsd-elements";
import {parseString} from "xml2js";

// a dummy reference of the should variable so that is import gets included
// to the generated javascript:
var aDummyThing = should;

describe("JsonXsdWriter", () => {
    describe("run on a simple class", () => {
        it("should add a complexTypeNode with an attributeGroup named after the class name with first letter of the attribute ref name small case", (done) => {
            var writer = new JsonXsdWriter();

            var newClass = new Class("Class1Name", "Class1FullName", "Class1Comments", [new Type("Class1BaseClass1")]);

            var tree = new Tree();
            tree.addClass(newClass);

            var content = writer.parse("rootName", tree);
            content.should.not.eql(null);

            parseString(content, (err, data) => {
                data.rootName["xs:complexType"].length.should.eql(1);
                data.rootName["xs:complexType"][0].$.name.should.eql("Class1Name");
                data.rootName["xs:attributeGroup"].length.should.eql(1);
                data.rootName["xs:attributeGroup"][0].$.name.should.eql("class1NameAttributes");
                data.rootName["xs:element"].length.should.eql(1);
                data.rootName["xs:element"][0].$.name.should.eql("Class1Name");
                data.rootName["xs:element"][0].$.type.should.eql("Class1Name");
                done();
            });
        });
        it("Should exclude base types from UIComponents list", (done) => {
            var goodClass = new Class("Class1Name", "Class1FullName", "Class1Comments", [new Type("Class1BaseClass1")]);
            var tree = new Tree();
            tree.addClass(goodClass);

            let baseClasses = [
                "View",
                "CustomLayoutView",
                "EditableTextBase",
                "LayoutBase",
                "Layout",
                "TextBase",
            ]
            baseClasses.forEach((className) => {
                var badClass = new Class(className, "FullName" + className, "Class1Comments", [new Type("Class1BaseClass1")]);
                tree.addClass(badClass);
            })

            var writer = new JsonXsdWriter();
            let uiWriters = writer.getUIComponentWriters(tree.Classes);

            uiWriters.length.should.eql(1);
            done()
        })
        it("should create an attribute group with the properties of the class", () => {
            var writer = new JsonXsdWriter();

            var newClass = new Class("Class1Name", "Class1FullName", "Class1Comments", [new Type("Class1BaseClass1")]);

            newClass.properties.push(new Property("Prop1Name", new Type("string")));

            var tree = new Tree();
            tree.addClass(newClass);

            var content = writer.parse("rootName", tree);
            content.should.match(/.*<xs:attributeGroup name="class1NameAttributes">[\n\s]*<xs:attribute name="Prop1Name" type="[^"]*"\/>[\n\s]*<\/xs:attributeGroup>.*/mg);
        });
        it("should create an attribute group with the properties of the class and the proper validator", () => {
            var writer = new JsonXsdWriter();

            var newClass = new Class("Class1Name", "Class1FullName", "Class1Comments", [new Type("Class1BaseClass1")]);

            newClass.properties.push(new Property("Prop1Name", new Type("string")));

            var tree = new Tree();
            tree.addClass(newClass);

            var content = writer.parse("rootName", tree);
            content.should.match(/.*<xs:attributeGroup name="class1NameAttributes">[\n\s]*<xs:attribute name="Prop1Name" type="StringValidator"\/>[\n\s]*<\/xs:attributeGroup>.*/mg);
        });
        it("should create an element along with the type", (done) => {
            var writer = new JsonXsdWriter();

            var newClass = new Class("Class1Name", "Class1FullName", "Class1Comments", [new Type("Class1BaseClass1")]);

            var tree = new Tree();
            tree.addClass(newClass);

            var content = writer.parse("rootName", tree);

            parseString(content, (err, data) => {
                data.rootName["xs:complexType"].length.should.eql(1);
                data.rootName["xs:complexType"][0].$.name.should.eql("Class1Name");
                data.rootName["xs:attributeGroup"].length.should.eql(1);
                data.rootName["xs:attributeGroup"][0].$.name.should.eql("class1NameAttributes");
                data.rootName["xs:element"].length.should.eql(1);
                data.rootName["xs:element"][0].$.name.should.eql("Class1Name");
                data.rootName["xs:element"][0].$.type.should.eql("Class1Name");
                done();
            });

        });
    });
});
describe("ValidatorWriter", () => {
    describe("write method", () => {
        it("should write its simplest form when all properties null", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();
            xmlWriter.startElement("root");

            let writer = new ValidatorWriter(new Validator(new Type("string"), null, null));
            writer.write(xmlWriter);

            xmlWriter.endElement();
            xmlWriter.endDocument();

            xmlWriter.toString().should.match(/.*<xs:simpleType name="StringValidator"\/>.*/m);
        });
        it("should write its simplest form when unionMemberTypes empty and other props null", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();
            xmlWriter.startElement("root");

            let writer = new ValidatorWriter(new Validator(new Type("string"), <string[]>[], null));
            writer.write(xmlWriter);

            xmlWriter.endElement();
            xmlWriter.endDocument();

            xmlWriter.toString().should.match(/.*<xs:simpleType name="StringValidator"\/>.*/m);
        });
        it("should populate the unionMemberTypes when provided", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();
            xmlWriter.startElement("root");

            var writer = new ValidatorWriter(new Validator(new Type("string"), ["SomeValidator", "OtherValidator"], null));
            writer.write(xmlWriter);

            xmlWriter.endElement();
            xmlWriter.endDocument();

            xmlWriter.toString().should.match(/.*<xs:simpleType name="StringValidator">[\n\s]*<xs:union memberTypes="SomeValidator OtherValidator">[\n\s]*<xs:simpleType\/>[\n\s]*<\/xs:union>[\n\s]*<\/xs:simpleType>.*/m);
        });
        it("should populate the restriction when base provided inside a union if such exists", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();
            xmlWriter.startElement("root");

            var writer = new ValidatorWriter(new Validator(new Type("string"), ["SomeValidator", "OtherValidator"], new Restriction("xs:string", null, null, null)));
            writer.write(xmlWriter);

            xmlWriter.endElement();
            xmlWriter.endDocument();

            xmlWriter.toString().should.match(/.*<xs:simpleType name="StringValidator">[\n\s]*<xs:union memberTypes="SomeValidator OtherValidator">[\n\s]*<xs:simpleType>[\n\s]*<xs:restriction base="xs:string"\/>[\n\s]*<\/xs:simpleType>[\n\s]*<\/xs:union>[\n\s]*<\/xs:simpleType>.*/m);
        });
        it("should populate the restriction when base provided if no union exists", () => {
            var xmlWriter = new (<any>XmlWriter)(true);
            xmlWriter.startDocument();
            xmlWriter.startElement("root");

            var writer = new ValidatorWriter(new Validator(new Type("string"), null, new Restriction("xs:string", null, null, null)));
            writer.write(xmlWriter);

            xmlWriter.endElement();
            xmlWriter.endDocument();

            xmlWriter.toString().should.match(/.*<xs:simpleType name="StringValidator">[\n\s]*<xs:restriction base="xs:string"\/>[\n\s]*<\/xs:simpleType>.*/m);
        });
    });
});
