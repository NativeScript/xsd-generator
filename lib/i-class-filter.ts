import {Class} from "./lang-elements";

export interface IClassFilter {
    shouldEmit(class_: Class): boolean;
}

