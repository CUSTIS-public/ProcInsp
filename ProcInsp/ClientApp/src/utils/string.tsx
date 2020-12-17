export interface Replacements {[key: string] : string};

/**
 * Replace all ${key} tokens in str. For str = "my${str}", repl = {str: 'foo'} the result will be "myfoo"
 */
export function replaceAll(str: string, repl: Replacements): string {
    for(var r in repl) {
        str = str.replaceAll(`\$\{${r}\}`, repl[r])
    }
    return str
}