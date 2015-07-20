import {Class} from "./lang-elements";

export interface IClassFilter {
    filter(classes: Class[]): Class[];
}

