declare module "named-parameters" {
    interface ParameterNormalizer {
    //        parse(args: any): ParameterNormalizer;
        coerce(argname: string, type: string): ParameterNormalizer;
        require(argname: string, type: string): ParameterNormalizer;
        values(): any;
    }

    export function parse(args: any) : ParameterNormalizer;
}
