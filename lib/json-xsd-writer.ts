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
            writer.startElement("xs:attribute");
            writer.writeAttribute("name", property.name);
            writer.writeAttribute("type", this._getPropertyValidatorName(property.type));
            writer.endElement();
        });
        writer.endElement();
    }

    private writeValidators(writer: any, validators: Validator[]) {
        validators.forEach((validator) => {
            this.writeValidator(writer, validator);
        });
    }

    private writeValidator(writer: any, validator: Validator) {
        ValidatorWriter.write(writer, validator);
    }

    private _getPropertyValidatorName(propertyType: Type): string {
        var validator = this.validatorFactory.getValidator(propertyType);
        return validator.name;
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
    public static write(xmlWriter: any, validator: Validator) {
        xmlWriter.startElement("xs:simpleType");
        xmlWriter.writeAttribute("name", validator.name);
        if (validator.unionMemberTypes && validator.unionMemberTypes.length > 0) {
            xmlWriter.startElement("xs:union");
            xmlWriter.writeAttribute("memberTypes", validator.unionMemberTypes.join(" "));
            xmlWriter.startElement("xs:simpleType");
            if (validator.restriction) {
                RestrictionWriter.write(xmlWriter, validator.restriction);
            }
            xmlWriter.endElement();
            xmlWriter.endElement();
        } else {
            if (validator.restriction) {
                RestrictionWriter.write(xmlWriter, validator.restriction);
            }
        }
        xmlWriter.endElement();
    }
}

export class RestrictionWriter {
    public static write(xmlWriter: any, restriction: Restriction) {
        if (!restriction) {
            throw new Error("Restriction to be written is null or undefined!");
        }
        xmlWriter.startElement("xs:restriction");
        if (restriction.base) {
            xmlWriter.writeAttribute("base", restriction.base);
        }
        if (restriction.pattern) {
            xmlWriter.startElement("xs:pattern");
            xmlWriter.writeAttribute("value", restriction.pattern);
            xmlWriter.endElement();
        }
        if (restriction.whiteSpace) {
            xmlWriter.startElement("xs:whiteSpace");
            xmlWriter.writeAttribute("value", restriction.whiteSpace);
            xmlWriter.endElement();
        }
        if (restriction.enumValues) {
            restriction.enumValues.forEach((enumValue) => {
                xmlWriter.startElement("xs:enumeration");
                xmlWriter.writeAttribute("value", enumValue);
                xmlWriter.endElement();
            });
        }
        xmlWriter.endElement();
    }
}

