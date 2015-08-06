import * as XmlWriter from "xml-writer";
import {Tree, Class, Property, Type} from "./lang-elements";
import {Validator, ValidatorFactory, Restriction} from "./xsd-elements";
import {Utils} from "./globals";

export class JsonXsdWriter {
    private _validatorFactory: ValidatorFactory;

    constructor() {
        this._validatorFactory= new ValidatorFactory();
    }

    public parse(rootName: string, tree: Tree, rootAttributes?: Map<string, string>): string {
        var writer = new (<any>XmlWriter)(true);
        writer.startDocument();
        writer.startElement(rootName);

        if (rootAttributes) {
            rootAttributes.forEach((value, key) => {
                writer.writeAttribute(key, value);
            });
        }

        this.processClasses(writer, tree.Classes);
        this.writeValidators(writer, this.validatorFactory.getRegisteredValidators());
        this.writeUIComponents(writer, tree.Classes);
        writer.endDocument();
        return writer.toString();
    }

    private get validatorFactory(): ValidatorFactory{
        return this._validatorFactory;
    }

    private processClasses(writer: any, classes: Class[]) {
        classes.forEach((_class) => {
            this._addClassType(writer, _class);
            this._addClassElement(writer, _class);
        });
    }

    private _addClassProperties(writer: any, _class: Class) {
        writer.startElement("xs:attributeGroup");
        writer.writeAttribute("name", this._getClassAttributesRefName(_class));
        _class.properties.forEach((property) => {
            if (!this._checkOverridenProperty(property, _class)) {
                writer.startElement("xs:attribute");
                writer.writeAttribute("name", property.name);
                writer.writeAttribute("type", this.validatorFactory.getValidator(property.type).name);
                writer.endElement();
            }
        });
        writer.endElement();
    }

    private writeValidators(writer: any, validators: Validator[]) {
        validators.forEach((validator) => {
            let validatorWriter = new ValidatorWriter(validator);
            validatorWriter.write(writer);
        });
    }

    private writeUIComponents(writer: any, _classes: Class[]) {
        writer.startElement("xs:group");
        writer.writeAttribute("name", "UIComponents");
        writer.startElement("xs:choice");

        _classes.forEach((_class) => {
            writer.startElement("xs:element");
            writer.writeAttribute("name", _class.name);
            writer.writeAttribute("type", _class.name);
            writer.endElement();
        });

        writer.endElement();
        writer.endElement();
    }

    // TODO: There are properties, that are declared in both the parent and child type.
    //  These are handled via a restriction tag (http://stackoverflow.com/questions/13952721/how-to-override-xsd-element-inside-of-parent-extended-element),
    //  however, they are the same in our situation. Simply remove them for the time being:
    private _checkOverridenProperty(prop: Property, _class: Class): boolean {
        if ((prop.name === "borderColor" || prop.name === "borderWidth") && _class.fullName === '"ui/border".Border') {
            return true;
        }
        if ((prop.name === "paddingBottom" || prop.name === "paddingTop"
                    || prop.name === "paddingLeft" || prop.name === "paddingRight") && _class.fullName === '"ui/layouts/layout".Layout') {
            return true;
        }
        return false;
    }

    private _addClassType(writer: any, _class: Class) {
        this._addClassProperties(writer, _class);

        writer.startElement("xs:complexType");
        writer.writeAttribute("name", _class.name);

        //TODO: Extract the logic of knowing about the "View" class somewhere outside?
        if (_class.fullName !== '"ui/core/view".View') {
            writer.startElement("xs:complexContent");
            writer.startElement("xs:extension");

            writer.writeAttribute("base", _class.baseClassNames[0].name);

            //TODO: The ContentView and Layout classes are special classes that can have content (and such are their inheritors like Page, ScrollView, StackLayout, etc).
            // This might be done in a better manner - create a special class with specific rendering for example?
            if (_class.fullName === '"ui/content-view".ContentView' ||
                _class.fullName === '"ui/layouts/layout".Layout' ||
                _class.fullName === '"ui/core/view".CustomLayoutView'
                ) {
                writer.startElement("xs:sequence");
                writer.startElement("xs:group");

                writer.writeAttribute("ref", "UIComponents");
                if (_class.fullName === '"ui/content-view".ContentView') {
                    writer.writeAttribute("maxOccurs", "1");
                } else {
                    writer.writeAttribute("maxOccurs", "unbounded");
                }

                writer.endElement();
                writer.endElement();
            }
            this._addClassAttributeGroup(writer, _class);

            writer.endElement();
            writer.endElement();
        } else {
            this._addClassAttributeGroup(writer, _class);
        }


        writer.endElement();
    }

    private _addClassAttributeGroup(writer: any, _class: Class) {
        writer.startElement("xs:attributeGroup");
        writer.writeAttribute("ref", this._getClassAttributesRefName(_class));
        writer.endElement();
    }

    private _addClassElement(writer:any, _class: Class) {
        writer.startElement("xs:element");
        writer.writeAttribute("name", _class.name);
        writer.writeAttribute("type", _class.name);
        writer.endElement();
    }

    private _getClassAttributesRefName(_class: Class): string {
        var className = _class.name;
        return Utils.ensureStartingLCase(className) + "Attributes";
    }
}

export class ValidatorWriter {
    private restrictionWriter: RestrictionWriter;

    public constructor(public validator: Validator){
        if (this.validator.restriction) {
            this.restrictionWriter = new RestrictionWriter(this.validator.restriction);
        }
    }

    public write(xmlWriter: any) {
        xmlWriter.startElement("xs:simpleType");
        xmlWriter.writeAttribute("name", this.validator.name);
        if (this.validator.unionMemberTypes && this.validator.unionMemberTypes.length > 0) {
            xmlWriter.startElement("xs:union");
            xmlWriter.writeAttribute("memberTypes", this.validator.unionMemberTypes.join(" "));
            xmlWriter.startElement("xs:simpleType");
            if (this.restrictionWriter) {
                this.restrictionWriter.write(xmlWriter);
            }
            xmlWriter.endElement();
            xmlWriter.endElement();
        } else {
            if (this.restrictionWriter) {
                this.restrictionWriter.write(xmlWriter);
            }
        }
        xmlWriter.endElement();
    }
}

export class RestrictionWriter {
    public constructor(public restriction: Restriction) {
    }

    public write(xmlWriter: any) {
        if (!this.restriction) {
            throw new Error("Restriction to be written is null or undefined!");
        }
        xmlWriter.startElement("xs:restriction");
        if (this.restriction.base) {
            xmlWriter.writeAttribute("base", this.restriction.base);
        }
        if (this.restriction.pattern) {
            xmlWriter.startElement("xs:pattern");
            xmlWriter.writeAttribute("value", this.restriction.pattern);
            xmlWriter.endElement();
        }
        if (this.restriction.whiteSpace) {
            xmlWriter.startElement("xs:whiteSpace");
            xmlWriter.writeAttribute("value", this.restriction.whiteSpace);
            xmlWriter.endElement();
        }
        if (this.restriction.enumValues) {
            this.restriction.enumValues.forEach((enumValue) => {
                xmlWriter.startElement("xs:enumeration");
                xmlWriter.writeAttribute("value", enumValue);
                xmlWriter.endElement();
            });
        }
        xmlWriter.endElement();
    }
}

