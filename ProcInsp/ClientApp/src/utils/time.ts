export function msToHMS(ms: number): string {
    // 1- Convert to seconds:
    var seconds = ms / 1000;
    // 2- Extract hours:
    var hours = Math.floor(seconds / 3600); // 3,600 seconds in 1 hour
    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract minutes:
    var minutes = Math.floor(seconds / 60); // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = seconds % 60;
    return formatNum(hours) + ":" + formatNum(minutes) + ":" + formatNum(seconds);
}

function formatNum(n: number):string {
    return n.toLocaleString('ru-RU', {minimumIntegerDigits: 2, useGrouping:false})
}