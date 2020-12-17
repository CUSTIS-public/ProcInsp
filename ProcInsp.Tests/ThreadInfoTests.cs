using System;
using System.Diagnostics;
using System.Threading;
using NUnit.Framework;
using ProcInsp.Common;
using ProcInsp.Dtos;
using ProcInsp.Tests.Common;

namespace ProcInsp.Tests
{
    public class ThreadInfoTests
    {
        [Test]
        public void ThreadInfo_ThreadWithException()
        {
            //Arrange
            var exceptionEvent = new EventWaitHandle(false, EventResetMode.ManualReset);
            var endEvent = new EventWaitHandle(false, EventResetMode.ManualReset);
            var thread = new Thread(() =>
            {
                try
                {
                    var i = 0;
                    var x = 1 / i;
                }
                catch
                {
                    exceptionEvent.Set();
                    endEvent.WaitOne();
                }
            });
            thread.Start();
            exceptionEvent.WaitOne();

            //Act
            using var dataTarget = ClrMdHelper.AttachToCurrentProcess();
            var info = new ThreadInfo(Process.GetCurrentProcess(), dataTarget.GetThread(thread.ManagedThreadId));
            endEvent.Set();

            //Assert
            Console.WriteLine("===Stacktrace===");
            info.Stacktrace.ForEach(f => Console.WriteLine(f.Frame));

            Assert.That(info.Exception, Is.Not.Null);
            Console.WriteLine("===Exception===");
            Console.WriteLine($"Type: {info.Exception.Type} Message: {info.Exception.Message} Trace:");
            info.Exception.Stacktrace.ForEach(f => Console.WriteLine(f.Frame));

            Assert.That(info.Stacktrace, Has.Count.AtLeast(2));
            Assert.That(info.Exception.Stacktrace, Has.Count.AtLeast(1));
        }
    }
}