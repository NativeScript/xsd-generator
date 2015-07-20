declare module "xml-writer" {
    export function startDocument();
    export function startElement(name: string);
    export function startElementNS(prefix: string, name: string, uri: string);
    export function writeAttribute(name: string, value: any);
    export function writeAttributeNS(prefix: string, name: string, uri: string, value: any);
    export function writeCData(content: string);
    export function text(text: string);
    export function endElement();
    export function endDocument();
    export function toString(): string;
}
