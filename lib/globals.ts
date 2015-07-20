export class Utils {
    public static ensureStartingUCase(s: string): string {
        return s[0].toUpperCase() + s.substring(1);
    }
    public static ensureStartingLCase(s: string): string {
        return s[0].toLowerCase() + s.substring(1);
    }
}
