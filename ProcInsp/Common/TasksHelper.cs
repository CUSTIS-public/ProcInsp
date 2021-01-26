using System;
using System.Threading;
using System.Threading.Tasks;

namespace ProcInsp.Common
{
    public class TasksHelper
    {
        public const int WaitTime = 10_000;
        private const string WaitTimeExceededMsg = "Wait time exceeded";

        public static Task DoWithInterrupt(Action action, CancellationToken token)
        {
            return Task.Factory.StartNew(() =>
            {
                var done = 0L;
                var toAbort = Thread.CurrentThread;
                token.Register(() =>
                {
                    if(Interlocked.Read(ref done) == 0) toAbort.Interrupt();
                });
                token.ThrowIfCancellationRequested();
                
                action();
                
                token.ThrowIfCancellationRequested();
                Interlocked.Increment(ref done);
            }, token);
        }

        public static T DoWithInterrupt<T>(Func<T> f, CancellationToken? token = null)
        {
            using var tokenSource = new CancellationTokenSource();
            token ??= tokenSource.Token;

            var result = default(T);
            var t = DoWithInterrupt(() => { result = f(); }, token.Value);
            tokenSource.CancelAfter(WaitTime);
            try
            {
                if (!t.Wait(WaitTime))
                {
                    throw new Exception(WaitTimeExceededMsg);
                }
            }
            catch (AggregateException e) when (e.InnerException is ThreadInterruptedException)
            {
                throw new Exception(WaitTimeExceededMsg);
            }
            return result;
        }
    }
}