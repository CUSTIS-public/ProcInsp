using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using Microsoft.Diagnostics.Runtime;
using Microsoft.Web.Administration;

namespace ProcessInfo
{
    class Program
    {
        public static void GetUsage(int pid)
        {
            // Preparing variable for application instance name
            var name = string.Empty;
            var proc = Process.GetProcessById(pid);

            foreach (var instance in new PerformanceCounterCategory("Process").GetInstanceNames())
            {
                if (instance.StartsWith(proc.ProcessName))
                {
                    using (var processId = new PerformanceCounter("Process", "ID Process", instance, true))
                    {
                        if (pid == (int)processId.RawValue)
                        {
                            name = instance;
                            break;
                        }
                    }
                }
            }

            var cpu = new PerformanceCounter("Process", "% Processor Time", name, true);
            var ram = new PerformanceCounter("Process", "Private Bytes", name, true);

            // Getting first initial values
            cpu.NextValue();
            ram.NextValue();

            // Creating delay to get correct values of CPU usage during next query
            Thread.Sleep(500);


            // If system has multiple cores, that should be taken into account
            var CPU = Math.Round(cpu.NextValue() / Environment.ProcessorCount, 2);
            // Returns number of MB consumed by application
            var RAM = Math.Round(ram.NextValue() / 1024 / 1024, 2);

            Console.WriteLine($"PID: {proc.Id} NAME: {proc.ProcessName} CPU: ${CPU} RAM: {RAM}");
        }

        static void Main(string[] args)
        {
            var pid1 = GetPid();
            using (ServerManager manager = new ServerManager())
            {
                while (true)
                {
                    var requests = manager.ApplicationPools
                        .SelectMany(pool => pool.WorkerProcesses.Where(p => p.ProcessId == pid1))
                        .SelectMany(wp => wp.GetRequests(10));

                    foreach (var request in requests)
                    {
                        Console.WriteLine($"{request.Verb} {request.Url} TimeElapsed {request.TimeElapsed}");
                    }

                    Console.ReadLine();
                }
            }

            while (true)
            {
                int pid = 0;
                try
                {
                    while (true)
                    {
                        pid = GetPid();

                        foreach (var thread in Process.GetProcessById(pid).Threads.Cast<ProcessThread>().OrderBy(t => t.StartTime))
                        {
                            Console.WriteLine($"{thread.Id:000000} {thread.StartTime}");
                        }

                        Console.ReadLine();
                    }

                    foreach (var proc in Process.GetProcesses())
                    {
                        GetUsage(proc.Id);
                    }
                    Console.WriteLine("=====END");
                    Console.ReadKey();
                }
                catch { }

                using (var dataTarget = DataTarget.AttachToProcess(pid, false))
                {
                    ClrInfo runtimeInfo = dataTarget.ClrVersions[0];
                    var runtime = runtimeInfo.CreateRuntime();

                    var heap = runtime.Heap;



                    foreach (ClrThread thread in runtime.Threads)
                    {
                        foreach (var root in thread.EnumerateStackRoots())
                        {
                            Console.WriteLine($"Root {root.Address} {root.RootKind}" +
                                              $"Frame {root.StackFrame.FrameName} Size");
                        }

                        if (!thread.IsAlive)
                            continue;

                        
                        Console.WriteLine($"Thread {thread.OSThreadId:x}:");

                        foreach (ClrStackFrame frame in thread.EnumerateStackTrace())
                            Console.WriteLine($"    {frame.StackPointer:x12} {frame.InstructionPointer:x12} {frame}");

                        Console.WriteLine();
                    }
                }

                Console.WriteLine();
            }

        }



        private static int GetPid()
        {
            Console.WriteLine("PID: ");
            var pidStr = Console.ReadLine();
            if (!string.IsNullOrEmpty(pidStr))
            {
                return int.Parse(pidStr);
            }
            else
            {
                return Process.GetProcessesByName("w3wp").FirstOrDefault().Id;
            }
        }
    }


}



//StackTrace st = new StackTrace(true);
//for (int i = 0; i < st.FrameCount; i++)
//{
//    // Note that high up the call stack, there is only
//    // one stack frame.
//    StackFrame sf = st.GetFrame(i);
//    Console.WriteLine();
//    Console.WriteLine("High up the call stack, Method: {0}",
//        sf.GetMethod());

//    Console.WriteLine("High up the call stack, Line Number: {0}",
//        sf.GetFileLineNumber());
//}
