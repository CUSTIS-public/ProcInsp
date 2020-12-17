const Config = {
    ...GlobalConfig,
    "Entrypoint": {
        "Contains": [ "procinsp"],
        "NotContains": ["ContextTransitionFrame"]
    },
    "InspServers": {
        "localhost": "localhost:5000",
    },
    "Kibana": {
        "Procs": "https://my.kibana/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now%2Fd,to:now%2Fd))&_a=(columns:!(Properties.ProcessId,Properties.RenderedMessage),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:f7705060-d8b3-11ea-a409-d3f65bf6d253,key:Properties.ProcessId,negate:!f,params:(query:${pid}),type:phrase),query:(match_phrase:(Properties.ProcessId:${pid}))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:f7705060-d8b3-11ea-a409-d3f65bf6d253,key:host.hostname,negate:!f,params:(query:${machineNameLowercase}),type:phrase),query:(match_phrase:(host.hostname:${machineNameLowercase})))),index:f7705060-d8b3-11ea-a409-d3f65bf6d253,interval:auto,query:(language:kuery,query:''),sort:!())",
        "Threads": "https://my.kibana/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now%2Fd,to:now%2Fd))&_a=(columns:!(Properties.ProcessId,Properties.ThreadId,Properties.RenderedMessage),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:f7705060-d8b3-11ea-a409-d3f65bf6d253,key:Properties.ProcessId,negate:!f,params:(query:${pid}),type:phrase),query:(match_phrase:(Properties.ProcessId:${pid}))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:f7705060-d8b3-11ea-a409-d3f65bf6d253,key:host.hostname,negate:!f,params:(query:${machineNameLowercase}),type:phrase),query:(match_phrase:(host.hostname:${machineNameLowercase}))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:f7705060-d8b3-11ea-a409-d3f65bf6d253,key:Properties.ThreadId,negate:!f,params:(query:${threadId}),type:phrase),query:(match_phrase:(Properties.ThreadId:${threadId})))),index:f7705060-d8b3-11ea-a409-d3f65bf6d253,interval:auto,query:(language:kuery,query:''),sort:!())"
    },
}