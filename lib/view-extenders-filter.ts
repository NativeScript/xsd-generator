import {FileWalker} from "./file-walker";
import {Tree, Class} from "./lang-elements";
import {IClassFilter} from "./i-class-filter";

export class ViewExtendersFilter implements IClassFilter{
    constructor() {
    }

    public filter(classes: Class[]): Class[]{
        return classes.filter((_class) => {
            // Filter //@private's:
            if (_class.classComments.indexOf("//@private") === 0) {
                return false;
            }


            // Filter classes that do not have View in their list of base classes:
            var viewClassName = '"ui/core/view".View';
            var viewContainingBaseClasses = _class.baseClassNames.filter((baseClassName) => {
                return baseClassName.fullName === viewClassName;
            });
            if (_class.fullName !== viewClassName && viewContainingBaseClasses.length === 0) {
                return false;
            }

            switch (_class.fullName) {
                case '"ui/frame".Frame':
                    return false;
                default:
                    return true;
            }

            return true;
        });
    }
}
