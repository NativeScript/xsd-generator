import {FileWalker} from "./file-walker";
import {Tree, Class} from "./lang-elements";
import {IClassFilter} from "./i-class-filter";

export class ActionBarFilter implements IClassFilter{
    constructor() {
    }

    public shouldEmit(_class: Class): boolean {
        switch (_class.fullName) {
            case '"ui/action-bar".ActionBar':
            case '"ui/action-bar".ActionItem':
            case '"ui/action-bar".ActionItemBase':
            case '"ui/core/bindable".Bindable':
                return true;
            default:
                return false;
        }
    }
}
