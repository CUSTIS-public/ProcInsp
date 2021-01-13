interface ConfigType {
    Version: string, //ProcInsp version
    InspServers: { [key: string]: string } //Servers to retrieve information from [serverName] = "webApiUrl"
    IisProcs: string[], //Proc names that should be displayed when "Only IIS" option is checked
    Kibana:{
        Procs: string, //URL to Kibana that displayes logs for scpecific process. Available placeholders: ${pid}, ${machineName}, ${machineNameLowercase}
        Threads: string //URL to Kibana that displayes logs for scpecific thread. Available placeholders: ${pid}, ${threadId}, ${machineName}, ${machineNameLowercase}
    },
    Entrypoint: {
        Contains: string[], //Entrypoint must contain one of these strings (ignore case)
        NotContains: string[] //Entrypoint must not contain no one of these string (ignore case)
    },
    Requests: { // config for Requests.tsx
        UrlInfo: RegExp //regexp to get main info from url
    }
}

declare const Config: ConfigType
