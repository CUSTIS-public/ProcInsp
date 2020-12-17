using System.Threading;
using Microsoft.Diagnostics.Runtime;
using ProcInsp.Threads;

namespace ProcInsp.Dtos
{
    public class ThreadSizeInfo
    {
        public ThreadSizeInfo(ClrThread thread, CancellationToken token)
        {
            Id = thread.OSThreadId;
            HeapSize = new ThreadSize(thread, token).GetThreadSize();
            StackLimit = thread.StackLimit;
        }

        public ulong StackLimit { get; set; }

        public ulong HeapSize { get; set; }

        public uint Id { get; set; }
    }
}