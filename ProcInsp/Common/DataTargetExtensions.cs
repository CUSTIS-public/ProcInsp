using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Microsoft.Diagnostics.Runtime;
using ProcInsp.Common;

namespace ProcInsp.Tests.Common
{
    public static class DataTargetExtensions
    {
        public static ClrThread GetThread(this DataTarget dataTarget, int managedThreadId)
        {
            var runtime = CreateRuntime(dataTarget);

            return runtime.Threads.Single(t => t.ManagedThreadId == managedThreadId);
        }

        public static ClrRuntime CreateRuntime(this DataTarget dataTarget)
        {
            return TasksHelper.DoWithInterrupt(() =>
            {
                var runtimeInfo = dataTarget.ClrVersions[0];
                return runtimeInfo.CreateRuntime();
            });
        }

        public static IEnumerable<ClrThread> EnumerateThreads(this DataTarget dataTarget, CancellationToken token)
        {
            var versions = TasksHelper.DoWithInterrupt(() => dataTarget.ClrVersions);
            foreach (var clrInfo in versions)
            {
                token.ThrowIfCancellationRequested();

                var threads = TasksHelper.DoWithInterrupt(() => clrInfo.CreateRuntime().Threads);
                foreach (var thread in threads)
                {
                    token.ThrowIfCancellationRequested();
                    yield return thread;
                }
            }
        }
    }
}