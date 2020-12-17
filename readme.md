Web application to check running processes on windows machines. Allows to get information from multiple servers. Allows to watch thread stacks of running CLR processes. Allows to watch current executing requests on w3wp workers.

Known limitations:
* Can only inspect processes of same bitness as running web api server

Repository structure:
* ProcInsp - web application and api's
* ProcInsp.Tests - tests
* Other projects are just for testing purposes

Publish
* Change version in globalConfig.js
* Run:
** dotnet publish ProcInsp\ProcInsp.csproj
** npm run zip
* Upload ProcInsp.zip to GitHub
* Set tag 