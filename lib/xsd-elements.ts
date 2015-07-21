import {Utils} from "./globals";
import {Type} from "./lang-elements";

/// TODO: This class is both a validator factory and a validator bag. Shall we split it?
export class ValidatorFactory {
    private _registeredValidators: Map<string, Validator>;
    private _validatorIndex: Map<string, Validator>;

    public constructor() {
        this._registeredValidators = new Map<string, Validator>();
        this._validatorIndex = new Map<string, Validator>();
debugger;
        //Register the initial validators that are core type-dependent:
        this.getValidator(new Type("Binding"));
    }

    public getValidator(type: Type): Validator {
        if (!this.registeredValidators.has(type.fullName)) {
            var newValidator = this._createValidator(type);
            this.registeredValidators.set(type.fullName, newValidator);
            return this.getValidator(type);
        }

        return this.registeredValidators.get(type.fullName);
    }

    public getRegisteredValidators(): Validator[] {
        var returnValue = <Validator[]>[];
        var allRegisteredValidatorTypes = this.validatorsIndex.forEach((validator) => {
            returnValue.push(validator);
        });
        return returnValue;
    }

    private get validatorsIndex(): Map<string, Validator>{
        return this._validatorIndex;
    }

    private _retrieveValidator(validatorName: string, validatorCreator: Func0<Validator>): Validator {
        if (this.validatorsIndex.has(validatorName)) {
            return this.validatorsIndex.get(validatorName);
        }
        this.validatorsIndex.set(validatorName, validatorCreator());
        return this.validatorsIndex.get(validatorName);
    }

    private get registeredValidators(): Map<string, Validator> {
        return this._registeredValidators;
    }

    //TODO: Make this more intelligent:
    private _createValidator(type: Type): Validator {
        switch (type.fullName) {
            case "number":
                return this._retrieveValidator("NumberValidator", () => { return new NumberValidator() });
            case "Binding":
                return this._retrieveValidator("BindingValidator", () => { return new BindingValidator() });
            case '"color".Color':
                return this._retrieveValidator("ColorValidator", () => { return new ColorValidator() });
            case "boolean":
                return this._retrieveValidator("BooleanValidator", () => { return new BooleanValidator() });
            case '"ui/layouts/layout".Layout':
                return this._retrieveValidator("LayoutNamesValidator", () => { return new LayoutNamesValidator() });
            case "string":
            case "style":
            case '"text/formatted-string".FormattedString':
            case '"ui/styling".Style':
            case 'Date':
            case 'Array':
            case '"ui/page".OptionsMenu':
    //TODO: THIS IS A BUG! THE ActionButton property is a complex property, it is not declared as a simple attribute!
            case '"ui/action-bar".NavigationButton':
            case '"ui/action-bar".ActionItems':
            case '"ui/page".Page':
                return this._retrieveValidator("StringValidator", () => { return new StringValidator() });
            default:
                throw new Error(`No validator for type ${type.fullName}!`);
        }
    }
}

export class Group {

    constructor(name: string) {
    }
}

export class Restriction {
    private _base: string;
    private _pattern: string;
    private _whiteSpace: string;
    private _enumValues: string[];

    constructor(base: string, pattern: string, whiteSpace: string, enumValues: string[]) {
        this._base = base;
        this._pattern = pattern;
        this._whiteSpace = whiteSpace;
        this._enumValues = enumValues;
    }

    public get base(): string {
        return this._base;
    }

    public get pattern(): string {
        return this._pattern;
    }

    public get enumValues(): string[] {
        return this._enumValues;
    }

    public get whiteSpace(): string {
        return this._whiteSpace;
    }
}

export class Validator {
    private _validatedType: Type;
    private _unionMemberTypes: string[];
    private _restriction: Restriction;

    constructor(validatedType: Type, unionMemberTypes: string[], restriction: Restriction) {
        this._validatedType= validatedType;
        this._unionMemberTypes = unionMemberTypes;
        this._restriction = restriction;
    }

    public get name(): string {
        var validatedTypeName = Utils.ensureStartingUCase(this.validatedType.name);
        return `${validatedTypeName}Validator`;
    }

    public get validatedType(): Type {
        return this._validatedType;
    }

    public get unionMemberTypes(): string[] {
        return this._unionMemberTypes;
    }

    public get restriction(): Restriction {
        return this._restriction;
    }

}

class BindingValidator extends Validator {
    constructor() {
        super(new Type("Binding"), null, new Restriction("xs:string", "\\{\\{.*?\\}\\}", "collapse", null));
    }
}

class StringValidator extends Validator {
    constructor() {
        //TODO: The reference to a different type can be improved and can be beneficial to adding the binding validator!
        super(new Type("string"), ["BindingValidator"], new Restriction("xs:string", null, null, null));
    }
}

class NumberValidator extends Validator {
    constructor() {
        super(new Type("number"), ["BindingValidator"], new Restriction("xs:integer", null, null, null));
    }
}

class BooleanValidator extends Validator {
    constructor() {
        super(new Type("boolean"), ["BindingValidator"], new Restriction("xs:boolean", null, null, null));
    }
}

//TODO: Import the layouts and fill in all the inheritor names instead of having them written here!
class LayoutNamesValidator extends Validator {
    constructor() {
        var layouts = ["StackLayout", "GridLayout", "AbsoluteLayout", "DockLayout", "WrapLayout"];
        super(new Type('"ui/layouts/layout".Layout'), ["BindingValidator"], new Restriction("xs:string", null, null, layouts));
    }
}

class ColorValidator extends Validator {
    constructor() {
        //TODO: Import the known-Colors module from the NativeScript repo and use it!
        var knownColors = [
            "Transparent",
            "AliceBlue",
            "AntiqueWhite",
            "Aqua",
            "Aquamarine",
            "Azure",
            "Beige",
            "Bisque",
            "Black",
            "BlanchedAlmond",
            "Blue",
            "BlueViolet",
            "Brown",
            "BurlyWood",
            "CadetBlue",
            "Chartreuse",
            "Chocolate",
            "Coral",
            "CornflowerBlue",
            "Cornsilk",
            "Crimson",
            "Cyan",
            "DarkBlue",
            "DarkCyan",
            "DarkGoldenRod",
            "DarkGray",
            "DarkGreen",
            "DarkKhaki",
            "DarkMagenta",
            "DarkOliveGreen",
            "DarkOrange",
            "DarkOrchid",
            "DarkRed",
            "DarkSalmon",
            "DarkSeaGreen",
            "DarkSlateBlue",
            "DarkSlateGray",
            "DarkTurquoise",
            "DarkViolet",
            "DeepPink",
            "DeepSkyBlue",
            "DimGray",
            "DodgerBlue",
            "FireBrick",
            "FloralWhite",
            "ForestGreen",
            "Fuchsia",
            "Gainsboro",
            "GhostWhite",
            "Gold",
            "GoldenRod",
            "Gray",
            "Green",
            "GreenYellow",
            "HoneyDew",
            "HotPink",
            "IndianRed",
            "Indigo",
            "Ivory",
            "Khaki",
            "Lavender",
            "LavenderBlush",
            "LawnGreen",
            "LemonChiffon",
            "LightBlue",
            "LightCoral",
            "LightCyan",
            "LightGoldenRodYellow",
            "LightGray",
            "LightGreen",
            "LightPink",
            "LightSalmon",
            "LightSeaGreen",
            "LightSkyBlue",
            "LightSlateGray",
            "LightSteelBlue",
            "LightYellow",
            "Lime",
            "LimeGreen",
            "Linen",
            "Magenta",
            "Maroon",
            "MediumAquaMarine",
            "MediumBlue",
            "MediumOrchid",
            "MediumPurple",
            "MediumSeaGreen",
            "MediumSlateBlue",
            "MediumSpringGreen",
            "MediumTurquoise",
            "MediumVioletRed",
            "MidnightBlue",
            "MintCream",
            "MistyRose",
            "Moccasin",
            "NavajoWhite",
            "Navy",
            "OldLace",
            "Olive",
            "OliveDrab",
            "Orange",
            "OrangeRed",
            "Orchid",
            "PaleGoldenRod",
            "PaleGreen",
            "PaleTurquoise",
            "PaleVioletRed",
            "PapayaWhip",
            "PeachPuff",
            "Peru",
            "Pink",
            "Plum",
            "PowderBlue",
            "Purple",
            "Red",
            "RosyBrown",
            "RoyalBlue",
            "SaddleBrown",
            "Salmon",
            "SandyBrown",
            "SeaGreen",
            "SeaShell",
            "Sienna",
            "Silver",
            "SkyBlue",
            "SlateBlue",
            "SlateGray",
            "Snow",
            "SpringGreen",
            "SteelBlue",
            "Tan",
            "Teal",
            "Thistle",
            "Tomato",
            "Turquoise",
            "Violet",
            "Wheat",
            "White",
            "WhiteSmoke",
            "Yellow",
            "YellowGreen"
        ];
        super(new Type('"color".Color'), ["BindingValidator"], new Restriction("xs:string", "#\d\d\d(\d\d\d)?", null, knownColors));
    }
}




