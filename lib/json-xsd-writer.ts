import * as XmlWriter from "xml-writer";
import {Tree, Class, Property, Type} from "./lang-elements";
import {Validator, ValidatorFactory, Restriction} from "./xsd-elements";
import {Utils} from "./globals";

export class JsonXsdWriter {
    private _validatorFactory: ValidatorFactory;
    private excludedUIComponents: Map<string, boolean>;
    private layoutComponents: Map<string, boolean>;

    constructor(public version: string) {
        this._validatorFactory= new ValidatorFactory();
        this.excludedUIComponents = new Map<string, boolean>([]);
        [
            "View",
            "CustomLayoutView",
            "EditableTextBase",
            "LayoutBase",
            "Layout",
            "TextBase",
            "ActionItem",
            "ActionItemBase",
            "Bindable",
        ].forEach((excluded) => this.excludedUIComponents.set(excluded, true))

        this.layoutComponents = new Map<string, boolean>([]);
        [
            "StackLayout",
            "GridLayout",
            "WrapLayout",
            "DockLayout",
            "AbsoluteLayout",
        ].forEach((excluded) => this.layoutComponents.set(excluded, true))
    }

    public parse(rootName: string, tree: Tree, rootAttributes?: Map<string, string>): string {
        var writer = new (<any>XmlWriter)(true);
        writer.startDocument();
        this.writeVersion(writer);
        writer.startElement(rootName);

        if (rootAttributes) {
            rootAttributes.forEach((value, key) => {
                writer.writeAttribute(key, value);
            });
        }

        this.processClasses(writer, tree.Classes);
        this.writeValidators(writer, this.validatorFactory.getRegisteredValidators());
        this.writeUIComponents(writer, tree.Classes);
        this.writeUILayouts(writer, tree.Classes);
        writer.endDocument();
        return writer.toString();
    }

    public writeVersion(xmlWriter: any) {
        xmlWriter.writeComment(`SCHEMA VERSION: ${this.version}`);
    }

    private get validatorFactory(): ValidatorFactory{
        return this._validatorFactory;
    }

    public getClassWriters(classes: Class[]): ClassWriter[] {
        return classes.map((_class) => new ClassWriter(_class, this.validatorFactory));
    }

    private processClasses(writer: any, classes: Class[]) {
        this.getClassWriters(classes).forEach((classWriter) => {
            classWriter.write(writer);
        });
    }

    public getValidatorWriters(validators: Validator[]) {
        return validators.map((validator) =>  new ValidatorWriter(validator));
    }

    private writeValidators(writer: any, validators: Validator[]) {
        this.getValidatorWriters(validators).forEach((validatorWriter) => {
            validatorWriter.write(writer);
        });
    }

    public getUIComponentWriters(classes: Class[], isKebabCase?: boolean) {
        return classes.filter((_class) =>
            !this.excludedUIComponents.has(_class.name)).map((_class) =>
                new UIComponentWriter(_class, isKebabCase));
    }
    
    public getUILayoutWriters(classes: Class[]) {
        return classes.filter((_class) =>
            this.layoutComponents.has(_class.name)).map((_class) =>
                new UIComponentWriter(_class));
    }

    private writeUIComponents(writer: any, _classes: Class[]) {
        writer.startElement("xs:group");
        writer.writeAttribute("name", "UIComponents");
        writer.startElement("xs:choice");

        this.getUIComponentWriters(_classes).forEach((uiWriter) => {
            uiWriter.write(writer);
        });

        this.getUIComponentWriters(_classes, true).forEach((uiWriter) => {
            debugger;
            uiWriter.write(writer);
        });

        writer.endElement();
        writer.endElement();
    }

    private writeUILayouts(writer: any, _classes: Class[]) {
        writer.startElement("xs:group");
        writer.writeAttribute("name", "UILayouts");
        writer.startElement("xs:choice");

        this.getUILayoutWriters(_classes).forEach((uiWriter) => {
            uiWriter.write(writer);
        });

        writer.endElement();
        writer.endElement();
    }
}

export class UIComponentWriter {
    private isKebabCase: boolean;

    public constructor(public classDefinition: Class, isKebabCase? : boolean) {
        this.isKebabCase = isKebabCase;
    }

    public write(xmlWriter: any) {
        xmlWriter.startElement("xs:element");
        xmlWriter.writeAttribute("name", this.isKebabCase? this.classDefinition.kebabName : this.classDefinition.name);
        xmlWriter.writeAttribute("type", this.classDefinition.name);
        xmlWriter.endElement();
    }
}

interface SpecialCaseElementWriter {
    elementName: string;
    write(xmlWriter: any): any;
}

export class HardCodedItemsWriter implements SpecialCaseElementWriter {
    public elementName: string;

    public constructor(public className: string) {
        this.elementName = `${className}.items`;
    }

    public write(xmlWriter: any) {
        xmlWriter.startElement("xs:choice");
            xmlWriter.startElement("xs:element");
                xmlWriter.writeAttribute("name", this.elementName);
                xmlWriter.writeAttribute("maxOccurs", "1");

                xmlWriter.startElement("xs:complexType");
                    xmlWriter.startElement("xs:sequence");

                        xmlWriter.startElement("xs:element");
                            xmlWriter.writeAttribute("name", this.className + "Item");
                            xmlWriter.writeAttribute("maxOccurs", "unbounded");

                            xmlWriter.startElement("xs:complexType");
                                if (this.className === 'TabView') {
                                    this.tabViewItemWithChildView(xmlWriter);
                                } else {
                                    this.simpleTitleAttribute(xmlWriter);
                                }
                            xmlWriter.endElement();
                        xmlWriter.endElement();

                    xmlWriter.endElement();
                xmlWriter.endElement();

            xmlWriter.endElement();
        xmlWriter.endElement();
    }

    private simpleTitleAttribute(xmlWriter: any) {
        xmlWriter.startElement("xs:attribute");
            xmlWriter.writeAttribute("name", "title");
            xmlWriter.writeAttribute("type", "StringValidator");
        xmlWriter.endElement();
    }

    private tabViewItemWithChildView(xmlWriter: any) {
        xmlWriter.startElement("xs:complexContent")
            xmlWriter.startElement("xs:extension")
                xmlWriter.writeAttribute("base", "View");
                    xmlWriter.startElement("xs:all");
                        xmlWriter.startElement("xs:element");
                            xmlWriter.writeAttribute("name", "TabViewItem.view");
                            xmlWriter.writeAttribute("minOccurs", "0");
                            xmlWriter.writeAttribute("maxOccurs", "1");

                            xmlWriter.startElement("xs:complexType")
                                xmlWriter.startElement("xs:sequence");
                                    ClassWriter.writeUIComponentsChildGroup(xmlWriter, "1");
                                    ClassWriter.writeCustomComponentAllowance(xmlWriter);
                                xmlWriter.endElement();
                            xmlWriter.endElement()
                        xmlWriter.endElement();

                    xmlWriter.endElement();

                    xmlWriter.startElement("xs:attribute");
                        xmlWriter.writeAttribute("name", "title");
                        xmlWriter.writeAttribute("type", "StringValidator");
                    xmlWriter.endElement();
            xmlWriter.endElement();
        xmlWriter.endElement();
    }
}

export class ItemsWriter implements SpecialCaseElementWriter {
    public elementName: string;
    public layoutName: string;

    public constructor(public className: string, public hasItemTemplate: boolean, public hasItemsLayout: boolean) {
        this.elementName = `${className}.itemTemplate`;
        this.layoutName = `${className}.itemsLayout`;
    }

    public write(xmlWriter: any) {
        xmlWriter.startElement("xs:all");
            if (this.hasItemTemplate) {
                xmlWriter.startElement("xs:element");
                    xmlWriter.writeAttribute("name", this.elementName);
                    xmlWriter.writeAttribute("minOccurs", "0");
                    xmlWriter.writeAttribute("maxOccurs", "1");

                    xmlWriter.startElement("xs:complexType");
                        xmlWriter.startElement("xs:sequence");
                            ClassWriter.writeUIComponentsChildGroup(xmlWriter);
                            ClassWriter.writeCustomComponentAllowance(xmlWriter);
                        xmlWriter.endElement();
                    xmlWriter.endElement();
                xmlWriter.endElement();
            }

            if (this.hasItemsLayout) {
                xmlWriter.startElement("xs:element");
                    xmlWriter.writeAttribute("name", this.layoutName);
                    xmlWriter.writeAttribute("maxOccurs", "1");

                    xmlWriter.startElement("xs:complexType");
                        ClassWriter.writeUILayoutsChildGroup(xmlWriter);
                    xmlWriter.endElement();
                xmlWriter.endElement();
            }
        xmlWriter.endElement();
    }
}

export class PageActionBarWriter implements SpecialCaseElementWriter {
    public elementName: string;

    public constructor(public className: string) {
        this.elementName = `${className}.actionBar`;
    }

    public write(xmlWriter: any) {
        xmlWriter.startElement("xs:sequence");
            xmlWriter.startElement("xs:element");
                xmlWriter.writeAttribute("name", this.elementName);
                xmlWriter.writeAttribute("minOccurs", "0");
                xmlWriter.writeAttribute("maxOccurs", "1");

                xmlWriter.startElement("xs:complexType");
                    xmlWriter.startElement("xs:sequence");
                        xmlWriter.startElement("xs:element");
                            xmlWriter.writeAttribute("name", "ActionBar");
                            xmlWriter.writeAttribute("type", "ActionBar");
                            xmlWriter.writeAttribute("maxOccurs", "1");
                        xmlWriter.endElement();
                    xmlWriter.endElement();
                xmlWriter.endElement();

            xmlWriter.endElement();
            ClassWriter.writeUIComponentsChildGroup(xmlWriter, "1");
            ClassWriter.writeCustomComponentAllowance(xmlWriter);
        xmlWriter.endElement();
    }
}

export class ActionItemsWriter implements SpecialCaseElementWriter {
    public elementName: string;

    public constructor(public className: string) {
        this.elementName = `${className}.actionItems`;
    }

    public write(xmlWriter: any) {
        xmlWriter.startElement("xs:choice");
            xmlWriter.startElement("xs:element");
                xmlWriter.writeAttribute("name", this.elementName);
                xmlWriter.writeAttribute("maxOccurs", "1");

                xmlWriter.startElement("xs:complexType");
                    xmlWriter.startElement("xs:sequence");

                        xmlWriter.startElement("xs:element");
                            xmlWriter.writeAttribute("name", "ActionItem");
                            xmlWriter.writeAttribute("type", "ActionItem");
                            xmlWriter.writeAttribute("maxOccurs", "unbounded");
                        xmlWriter.endElement();

                    xmlWriter.endElement();
                xmlWriter.endElement();

            xmlWriter.endElement();
        xmlWriter.endElement();
    }
}

export class ClassWriter {
    public specialCaseWriter: SpecialCaseElementWriter = null;

    public constructor(public classDefinition: Class, public validatorFactory: ValidatorFactory) {
        let properties: Property[] = this.classDefinition.properties || [];
        let hasItemTemplate = false;
        let hasItemsLayout = false;

        properties.forEach((property) => {
            if (property.name == 'itemTemplate') {
                hasItemTemplate = true;
            }
            if (property.name == 'itemsLayout') {
                hasItemsLayout = true;
            }
        });

        if (hasItemTemplate || hasItemsLayout) {
            this.specialCaseWriter = new ItemsWriter(this.classDefinition.name, hasItemTemplate, hasItemsLayout);
        }

        if (!this.specialCaseWriter) {
            if (classDefinition.name == 'TabView' || classDefinition.name == 'SegmentedBar') {
                this.specialCaseWriter = new HardCodedItemsWriter(this.classDefinition.name);
            } else if (classDefinition.name == 'Page') {
                this.specialCaseWriter = new PageActionBarWriter(this.classDefinition.name);
            } else if (classDefinition.name == 'ActionBar') {
                this.specialCaseWriter = new ActionItemsWriter(this.classDefinition.name);
            }
        }
    }

    public write(xmlWriter: any) {
        this._addClassType(xmlWriter);
        this._addClassElement(xmlWriter);
        this._addClassElement(xmlWriter, true);
    }

    private getBaseClass(): string {
        if (this.classDefinition.name === "Page") {
            // Skip the ContentView intermediate class to make the XSD schema work
            // Duplicate its UIComponents group ref element
            // emitted by PageActionBarWriter
            return "View";
        }
        return this.classDefinition.baseClassNames[0].name;
    }

    private _addClassType(writer: any) {
        this._addClassProperties(writer);

        writer.startElement("xs:complexType");
        writer.writeAttribute("name", this.classDefinition.name);

        //TODO: Extract the logic of knowing about the "View" class somewhere outside?
        if (this.classDefinition.fullName !== '"ui/core/view".View' &&
            this.classDefinition.fullName !== '"ui/core/bindable".Bindable') {
            writer.startElement("xs:complexContent");
            writer.startElement("xs:extension");

            writer.writeAttribute("base", this.getBaseClass());

            //TODO: The ContentView and Layout classes are special classes that can have content (and such are their inheritors like Page, ScrollView, StackLayout, etc).
            // This might be done in a better manner - create a special class with specific rendering for example?
            if (this.classDefinition.fullName === '"ui/content-view".ContentView' ||
                this.classDefinition.fullName === '"ui/layouts/layout".Layout' ||
                this.classDefinition.fullName === '"ui/core/view".CustomLayoutView'
                ) {
                writer.startElement("xs:sequence");
                if (this.classDefinition.fullName === '"ui/content-view".ContentView') {
                    ClassWriter.writeUIComponentsChildGroup(writer, "1");
                } else {
                    ClassWriter.writeUIComponentsChildGroup(writer, "unbounded");
                }
                ClassWriter.writeCustomComponentAllowance(writer);
                writer.endElement();
            }
            if (this.specialCaseWriter) {
                this.specialCaseWriter.write(writer);
            }
            this._addClassAttributeGroup(writer);

            writer.endElement();
            writer.endElement();
        } else {
            this._addClassAttributeGroup(writer);
        }


        writer.endElement();
    }

    public static writeUIComponentsChildGroup(writer: any, maxOccurs: string = "1") {
        writer.startElement("xs:group");
        writer.writeAttribute("ref", "UIComponents");
        writer.writeAttribute("minOccurs", "0");
        writer.writeAttribute("maxOccurs", maxOccurs);
        writer.endElement();
    }

    public static writeCustomComponentAllowance(writer: any) {
        writer.startElement("xs:any");
        writer.writeAttribute("processContents", "lax");
        writer.writeAttribute("maxOccurs", "unbounded");
        writer.endElement();
    }

    public static writeUILayoutsChildGroup(writer: any, maxOccurs: string = "1") {
        writer.startElement("xs:group");
        writer.writeAttribute("ref", "UILayouts");
        writer.writeAttribute("maxOccurs", maxOccurs);
        writer.endElement();
    }

    public getProperties(): Property[] {
        let result = this.classDefinition.properties;
        if (this.classDefinition.name === "GridLayout") {
            result = result.concat([
                new Property("rows", new Type("string")),
                new Property("columns", new Type("string")),
            ]);
        } else if (this.classDefinition.name === "View") {
            result = result.concat([
                new Property("row", new Type("number")),
                new Property("col", new Type("number")),
                new Property("rowSpan", new Type("number")),
                new Property("colSpan", new Type("number")),
                new Property("left", new Type("number")),
                new Property("top", new Type("number")),
                new Property("dock", new Type("string")),
                new Property("class", new Type("string")),
            ]);
        } else if (this.classDefinition.name === "Image") {
            result = result.concat([
                new Property("src", new Type("string")),
            ]);
        } else if (this.classDefinition.name === "ListView") {
            result = result.concat([
                new Property("items", new Type("string")),
            ]);
        }
        return result;
    }

    private _addClassProperties(writer: any) {
        writer.startElement("xs:attributeGroup");
        writer.writeAttribute("name", this._getClassAttributesRefName());
        this.getProperties().forEach((property) => {
            if (!this._checkOverridenProperty(property)) {
                writer.startElement("xs:attribute");
                writer.writeAttribute("name", property.name);
                writer.writeAttribute("type", this.validatorFactory.getValidator(property.type).name);
                writer.endElement();
            }
        });
        writer.endElement();
    }


    private _addClassElement(writer:any, isKebabCase? : boolean) {
        writer.startElement("xs:element");
        writer.writeAttribute("name", isKebabCase ? this.classDefinition.kebabName : this.classDefinition.name);
        writer.writeAttribute("type", this.classDefinition.name);
        writer.endElement();
    }

    private _addClassAttributeGroup(writer: any) {
        writer.startElement("xs:attributeGroup");
        writer.writeAttribute("ref", this._getClassAttributesRefName());
        writer.endElement();
    }

    private _getClassAttributesRefName(): string {
        var className = this.classDefinition.name;
        return Utils.ensureStartingLCase(className) + "Attributes";
    }

    // TODO: There are properties, that are declared in both the parent and child type.
    //  These are handled via a restriction tag (http://stackoverflow.com/questions/13952721/how-to-override-xsd-element-inside-of-parent-extended-element),
    //  however, they are the same in our situation. Simply remove them for the time being:
    private _checkOverridenProperty(prop: Property): boolean {
        if ((prop.name === "borderColor" || prop.name === "borderWidth") && this.classDefinition.fullName === '"ui/border".Border') {
            return true;
        }
        if ((prop.name === "paddingBottom" || prop.name === "paddingTop"
                    || prop.name === "paddingLeft" || prop.name === "paddingRight") && this.classDefinition.fullName === '"ui/layouts/layout".Layout') {
            return true;
        }
        return false;
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

