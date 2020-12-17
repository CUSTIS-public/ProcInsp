import qs from 'query-string';

const InspServers = Config.InspServers


export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const kb = 1024;

export function isIterable(obj: any) {
    // checks for null and undefined
    if (!obj) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

export function onlyUnique<T>(value: T, index: number, array: T[]) {
    return array.indexOf(value) === index;
}

export function getServersOfInterest(search: string) {
    let params = qs.parse(search);
    let servers: string[];
    if (!params.servers) {
        return Object.keys(InspServers);
    } else if (typeof params.servers === 'string') {
        servers = params.servers.split(',');
    } else {
        servers = params.servers;
    }

    const result: string[] = [];
    for (let server of servers) {
        let srv = getServer(server);

        if (srv) result.push(srv)

    }
    return result;
}

export function getServer(server: string) {
    let srv = Object.keys(InspServers).find(v => v.toLowerCase() === server.toLowerCase());
    if (!srv) {
        console.error(`Server ${server} not found in config (${Object.keys(InspServers)})`);
    }
    return srv;
}

export function getAppPool(cmd: string): string {
    if (!cmd || cmd.toLowerCase().indexOf('w3wp') < 0) {
        return '';
    }

    const result = cmd.match(/-AP\s*"(.+?)"/i)
    return result && result[1] ? result[1] : '';
}

export function areEquivalent<T>(array1: T[], array2: T[]): boolean {
    const array2Sorted = array2.slice().sort();
    return array1.length === array2.length && array1.slice().sort().every(function (value, index) {
        return value === array2Sorted[index];
    });
}