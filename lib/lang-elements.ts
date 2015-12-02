export class Type {
    private _fullName: string;
    private _name: string;

    constructor(fullName: string) {
        this._fullName = fullName;
    }

    public get fullName(): string {
        return this._fullName;
    }

    public get name(): string {
        if (this._name == null) {
            this._name = this._getName(this.fullName);
        }
        return this._name;
    }

    private _getName(fullName: string) {
        var localFullName = fullName;
        if (typeof(localFullName) === "undefined" || localFullName === null) {
            return null;
        }

        if (localFullName === ".") {
            return localFullName;
        }

        if (localFullName.length > 0 && localFullName.lastIndexOf(".") === localFullName.length - 1) {
            localFullName = localFullName.substring(0, localFullName.length - 1);
        }
        return localFullName.replace(/(.*)\./, "");
    }
}

export class Property {
    private _name: string;
    private _type: Type;

    constructor(name: string, type: Type) {
        this._name = name;
        this._type = type;
    }

    public get name(): string {
        return this._name;
    }

    public get type(): Type {
        return this._type;
    }
}

export class Class {
    private _name: string;
    private _properties: Property[];
    private _fullName: string;
    private _classComments: string;
    private _baseClassNames: Type[];

    constructor(name: string, fullName: string, classComments: string, baseClassNames: Type[]) {
        this._name = name;
        this._fullName = fullName;
        this._classComments = classComments;
        this._properties = [];
        this._baseClassNames = baseClassNames || [];
    }

    public get name(): string {
        return this._name;
    }
    
    public get kebabName(): string {
        return this._name.split(/(?=[A-Z])/).join("-").toLowerCase();
    }

    public get fullName(): string {
        return this._fullName;
    }

    public get classComments(): string {
        return this._classComments;
    }

    public get properties(): Property[] {
        return this._properties;
    }

    public get baseClassNames(): Type[] {
        return this._baseClassNames;
    }
}

export class Tree {
    private _classes: Class[];

    constructor() {
        this._classes = [];
    }

    /// Do not push to these classes! There is validation to happen.
    ///   Use the addClass method instead!
    public get Classes(): Class[] {
        return this._classes;
    }

    public addClass(_class: Class) {
        var containedClasses = this.Classes.filter((containedChecked) => {
            return containedChecked.fullName === _class.fullName;
        });
        if (containedClasses.length > 0) {
            throw new Error(`A class with the fully qualified name of '${_class.fullName}' already exists in the tree! Either remove it or update the program accordingly!`);
        }
        this.Classes.push(_class);
    }
}
