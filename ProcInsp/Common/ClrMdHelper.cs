using System;
using System.Diagnostics;
using System.Threading;
using Microsoft.Diagnostics.Runtime;

namespace ProcInsp.Common
{
    public class ClrMdHelper
    {
        public static DataTarget AttachToCurrentProcess()
        {
            using var process = Process.GetCurrentProcess();
            var pid = process.Id;
            return TasksHelper.DoWithInterrupt(() => DataTarget.AttachToProcess(pid, false));
        }

        public static DataTarget AttachToProcess(int pid)
        {
            using var process = Process.GetCurrentProcess();
            var currentPid = process.Id;
            return TasksHelper.DoWithInterrupt(() => DataTarget.AttachToProcess(pid, pid != currentPid));
        }
    }
}