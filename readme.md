ProcInsp is windows process and stack explorer with web UI. ProcInsp shows list of running processes on multiple (remote) servers. You can drill down into the CLR-process and watch running threads with their stacktraces. ProcInsp also allows to watch current executing requests on IIS AppPools (w3wp workers).

# Servers and procs #

![Servers and processes info](./img/Procs.png)

## Features ##

* Displays RAM and CPU usage of connected servers
* Displays info about running processes on all connected servers (RAM, CPU, start time etc)
* For IIS processes - the name of apppool is displayed
* Kibana integration - user can view logs of desired process (logs are filtered by host name and process id; Kibana url in configurable)

# Threads and requests #

![Threads and requests info](./img/Threads.png)

## Features ##

* Displays currently running requests (only for IIS processes)
* Displays all running threads of process
* App's entry point in stacktrace is shown as thread's name (which frame should be considered as entry point is configurable)
* If exception in thread occured, exception info is displayed (exception type, message and stacktrace)
* Kibana integration - user can view logs of desired thread (logs are filtered by host name, process and thread ids; Kibana url in configurable)

# Stacktrace #

![Stacktrace info](./img/Stacktrace.png)

## Features ##

* Highlight app's entry point in stacktrace (which frame should be considered as entry point is configurable)

# API #
ProcInsp has public API, which returns results in JSON.

| Verb | URL | Description |
|-|-|-|
| GET | /Process | Get the list of running processes |
| GET | /Process/{pid} | Get information about specific process |
| GET | /Process/usage | Get resource usages (CPU/RAM) by processes |
| GET | /Process/machine | Get total resource usage (CPU/RAM) on machine |
| GET | /Process/{pid}/threads | Get threads of CLR process |
| GET | /Process/{pid}/threadSizes | Calculate threads' sizes of CLR process (WARNING: doesn't work correct) |
| GET | /Process/{pid}/requests | Get web-requests serving by specific process. Works only if process is w3wp worker (IIS AppPool) |

Full documentation is available at /swagger/index.html (after app is started).

# Known limitations #
* Shows threads and stacktraces only for CLR processes with the same bitness as running web api server
* Shows only thread IDs and some other basic info for non CLR processes
* Web-requests are shown only for IIS web server

# Repository structure #
* ProcInsp - web application and api's
* ProcInsp.Tests - tests
* Other projects are just for testing purposes

# Run #
* You can run application from VS Code (F5)
* Or dotnet run .ProcInsp/ProcInsp.csporj

# Publish #
* Change version in globalConfig.js
* Run from git root directory:
  * dotnet publish ProcInsp\ProcInsp.csproj
  * npm i
  * npm run zip
* Create new release at GitHub

# Deploy #
* Prerequsites
  * IIS 
  * dotnet core 3.1
* Download latest release from https://github.com/CUSTIS-public/ProcInsp/releases
* Unzip
* Change config in \ClientApp\build\config.js (all available settings are described in https://github.com/CUSTIS-public/ProcInsp/blob/main/ProcInsp/ClientApp/src/globals.d.ts)
* Deploy to IIS (apppool should be managed by admin user)
