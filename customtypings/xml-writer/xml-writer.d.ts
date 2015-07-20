declare module "xml-writer" {
    export function startDocument(): void;
    export function startElement(name: string): void;
    export function startElementNS(prefix: string, name: string, uri: string): void;
    export function writeAttribute(name: string, value: any): void;
    export function writeAttributeNS(prefix: string, name: string, uri: string, value: any): void;
    export function writeCData(content: string): void;
    export function text(text: string): void;
    export function endElement(): void;
    export function endDocument(): void;
    export function toString(): string;
}
