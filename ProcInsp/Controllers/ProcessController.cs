using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Management;
using System.Runtime.Intrinsics.X86;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Diagnostics.Runtime;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Web.Administration;
using ProcInsp.Common;
using ProcInsp.Dtos;
using ProcInsp.Services;
using ProcInsp.Tests.Common;
using ProcInsp.Threads;

namespace ProcInsp.Controllers
{
    /// <summary>
    /// Information about machine, processes and threads
    /// </summary>
    [Produces("application/json")]
    [ApiController]
    [Route("[controller]")]
    public class ProcessController : ControllerBase
    {
        private readonly ProcessInfoGetter _processInfoGetter;

        public ProcessController(ProcessInfoGetter processInfoGetter)
        {
            _processInfoGetter = processInfoGetter;
        }

        #region Process

        /// <summary>
        /// Get the list of running processes
        /// </summary>
        [HttpGet]
        public IEnumerable<ProcInfo> Get()
        {
            return _processInfoGetter.GetInfos();
        }

        /// <summary>
        /// Get information about specific process
        /// </summary>
        /// <param name="pid">Process ID</param>
        [HttpGet("{pid}")]
        public ProcInfo Get(int pid)
        {
            return ProcessInfoGetter.GetInfo(pid);
        }

        /// <summary>
        /// Get resource usages (CPU/RAM) by processes
        /// </summary>
        [HttpGet("usage")]
        public IEnumerable<UsageInfo> GetUsage()
        {
            return _processInfoGetter.GetUsage();
        }

        #endregion

        #region Machine

        /// <summary>
        /// Get total resource usage (CPU/RAM) on machine
        /// </summary>
        [HttpGet("machine")]
        public MachineInfo GetMachine()
        {
            return new MachineInfo();
        }

        #endregion

        #region Threads

        /// <summary>
        /// Get threads of CLR process
        /// </summary>
        /// <param name="pid">Process ID</param>
        [HttpGet("{pid}/threads")]
        public IEnumerable<ThreadInfo> GetThreads(int pid)
        {
            var infos = new ConcurrentBag<ThreadInfo>();
            try
            {
                infos = GetThreadsFromClrMd(pid);
            }
            catch { }

            using var tokenSource = new CancellationTokenSource();
            var token = tokenSource.Token;
            var tasks = new List<Task>();
            var touched = new HashSet<long>(infos.Select(i => i.Id));
            using var proc = Process.GetProcessById(pid);
            foreach (var thread in proc.Threads.Cast<ProcessThread>())
            {
                if (touched.Contains(thread.Id))
                {
                    continue;
                }
                touched.Add(thread.Id);
                var t = TasksHelper.DoWithInterrupt(() =>
                {
                    var threadInfo = new ThreadInfo(thread);
                    token.ThrowIfCancellationRequested();
                    infos.Add(threadInfo);
                }, token);
                tasks.Add(t);
            }
            tokenSource.CancelAfter(TasksHelper.WaitTime);
            try
            {
                Task.WaitAll(tasks.ToArray(), TasksHelper.WaitTime);
            }
            catch { }

            return infos;
        }

        private static ConcurrentBag<ThreadInfo> GetThreadsFromClrMd(int pid)
        {
            var infos = new ConcurrentBag<ThreadInfo>();
            using var tokenSource = new CancellationTokenSource();
            var token = tokenSource.Token;

            using var proc = Process.GetProcessById(pid);
            using var dataTarget = ClrMdHelper.AttachToProcess(pid);

            var tasks = new List<Task>();
            foreach (var thread in dataTarget.EnumerateThreads(token))
            {
                if (!thread.IsAlive)
                    continue;

                var t = TasksHelper.DoWithInterrupt(() =>
                {
                    var threadInfo = new ThreadInfo(proc, thread, token);
                    token.ThrowIfCancellationRequested();
                    infos.Add(threadInfo);
                }, token);
                tasks.Add(t);
            }

            tokenSource.CancelAfter(TasksHelper.WaitTime);
            try
            {
                Task.WaitAll(tasks.ToArray(), TasksHelper.WaitTime);
            }
            catch { }

            return infos;
        }

        /// <summary>
        /// Calculate threads' sizes of CLR process (WARNING: doesn't work correct)
        /// </summary>
        /// <param name="pid">Process ID</param>
        [HttpGet("{pid}/threadSizes")]
        public IEnumerable<ThreadSizeInfo> GetThreadSizes(int pid)
        {
            var infos = new ConcurrentBag<ThreadSizeInfo>();
            
            using var dataTarget = ClrMdHelper.AttachToProcess(pid);

            var tasks = new List<Task>();
            using var tokenSource = new CancellationTokenSource();
            var token = tokenSource.Token;

            foreach (var thread in dataTarget.EnumerateThreads(token))
            {
                if (!thread.IsAlive)
                    continue;

                var t = TasksHelper.DoWithInterrupt(() =>
                {
                    var threadInfo = new ThreadSizeInfo(thread, token);
                    token.ThrowIfCancellationRequested();
                    infos.Add(threadInfo);
                }, token);
                tasks.Add(t);
            }

            tokenSource.CancelAfter(TasksHelper.WaitTime);
            try
            {
                Task.WaitAll(tasks.ToArray(), TasksHelper.WaitTime);
            }
            catch { }

            return infos;
        }

        #endregion

        #region Requests

        /// <summary>
        /// Get web-requests serving by specific process. Works only if process is w3wp worker (IIS AppPool)
        /// </summary>
        /// <param name="pid">Process ID</param>
        [HttpGet("{pid}/requests")]
        public IEnumerable<RequestInfo> GetRequests(int pid)
        {
            var infos = new ConcurrentBag<RequestInfo>();

            using var tokenSource = new CancellationTokenSource();
            var token = tokenSource.Token;
            var task = TasksHelper.DoWithInterrupt(() =>
            {
                using var manager = new ServerManager();

                var requests = manager.WorkerProcesses.Single(p => p.ProcessId == pid)
                    .GetRequests(10);
                foreach (var request in requests)
                {
                    infos.Add(new RequestInfo(request));
                }
            }, token);

            tokenSource.CancelAfter(TasksHelper.WaitTime);
            task.Wait(TasksHelper.WaitTime);

            return infos;
        }

        #endregion
    }
}
