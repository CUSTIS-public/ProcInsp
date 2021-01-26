using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading;
using Microsoft.Diagnostics.Runtime;

namespace ProcInsp.Dtos
{
    public class ThreadInfo
    {
        public ThreadInfo(Process proc, ClrThread thread, CancellationToken? token = null)
        {
            Id = thread.OSThreadId;
            ManagedThreadId = thread.ManagedThreadId;

            Stacktrace = new List<FrameInfo>();
            foreach (var frame in thread.EnumerateStackTrace())
            {
                token?.ThrowIfCancellationRequested();
                Stacktrace.Add(new FrameInfo(frame));
            }

            if (thread.CurrentException != null)
            {
                Exception = new ThreadException(thread.CurrentException, token);
            }

            var procThread = proc.Threads.Cast<ProcessThread>().SingleOrDefault(t => t.Id == thread.OSThreadId);
            if (procThread != null)
            {
                InitFromThread(procThread);
            }
        }

        public ThreadInfo(ProcessThread thread)
        {
            Id = thread.Id;
            InitFromThread(thread);
        }

        private void InitFromThread(ProcessThread thread)
        {
            try { StartTime = thread.StartTime; } catch  { }
            try
            {
                ThreadState = thread.ThreadState.ToString();
            } catch { }

            try
            {
                WaitReason = thread.ThreadState == System.Diagnostics.ThreadState.Wait 
                    ? thread.WaitReason.ToString()
                    : string.Empty;
            } catch { }

            try 
            {
                CpuTimeMs = thread.TotalProcessorTime.TotalMilliseconds;
            } catch { }
        }

        public double? CpuTimeMs { get; set; }

        public string WaitReason { get; set; }

        public int? ManagedThreadId { get; set; }

        public long Id { get; set; }
        public DateTime? StartTime { get; set; }

        public List<FrameInfo> Stacktrace { get; set; }
        public ThreadException Exception { get; set; }

        public string ThreadState { get; set; }
    }
}