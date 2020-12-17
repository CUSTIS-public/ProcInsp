using System.Collections.Generic;
using System.Threading;
using Microsoft.Diagnostics.Runtime;

namespace ProcInsp.Dtos
{
    public class ThreadException
    {
        public ThreadException(ClrException exception, CancellationToken? token)
        {
            Type = exception.Type.Name;
            Message = exception.Message;
            Stacktrace = new List<FrameInfo>();
            foreach (var frame in exception.StackTrace)
            {
                token?.ThrowIfCancellationRequested();
                Stacktrace.Add(new FrameInfo(frame));
            }
        }

        public string Type { get; set; }
        public List<FrameInfo> Stacktrace { get; set; }

        public string? Message { get; set; }
    }
}