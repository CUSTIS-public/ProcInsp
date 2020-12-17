using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using Microsoft.Diagnostics.Runtime;
using NUnit.Framework;
using ProcInsp.Common;
using ProcInsp.Tests.Common;
using ProcInsp.Threads;

namespace ProcInsp.Tests
{
    public class ThreadSizeTests
    {
        class A
        {
            public string str;
            public long l;
            public int i;
            public B b;
            public A a;
        }

        class B
        {
            public string str;
            public long l;
            public int i;
            public B b;
            public A a;
        }

        class  C
        {
            public long l;
        }

        [Test]
        public void GetThreadSize_OneThread()
        {
            //Arrange
            var ewh = new EventWaitHandle(false, EventResetMode.ManualReset);
            var thread1 = CreateThread(ewh);
            thread1.Start();

            using var dataTarget = ClrMdHelper.AttachToCurrentProcess();
            var thread = dataTarget.GetThread(thread1.ManagedThreadId);
            Console.WriteLine($"Thread {thread.OSThreadId:x} {thread.ManagedThreadId}");
            var walker = new TestWalker();

            //Act
            var size = new ThreadSize(thread, walker: walker).GetThreadSize();
            Console.WriteLine($"Thread {thread.ManagedThreadId} size = {size}");
            ewh.Set();

            //Assert
            Assert.That(walker.Sizes[GetName<C>()], Is.EqualTo(24));
            Assert.That(new [] { walker.Sizes[GetName<A>()], walker.Sizes[GetName<B>()]}, 
                Is.EquivalentTo(new[]{182, 90}));
        }

        [Test]
        public void GetThreadSize_TwoThreads()
        {
            //Arrange
            var ewh = new EventWaitHandle(false, EventResetMode.ManualReset);
            var thread1 = CreateThread(ewh);
            var thread2 = CreateThread(ewh);
            thread1.Start();
            thread2.Start();

            using var dataTarget = ClrMdHelper.AttachToCurrentProcess();
            var clrThread1 = dataTarget.GetThread(thread1.ManagedThreadId);
            Console.WriteLine($"Thread {clrThread1.OSThreadId:x} {clrThread1.ManagedThreadId}");
            var walker1 = new TestWalker();
            var clrThread2 = dataTarget.GetThread(thread2.ManagedThreadId);
            Console.WriteLine($"Thread {clrThread2.OSThreadId:x} {clrThread2.ManagedThreadId}");
            var walker2 = new TestWalker();

            //Act
            var size1 = new ThreadSize(clrThread1, walker: walker1).GetThreadSize();
            Console.WriteLine($"Thread {clrThread1.ManagedThreadId} size = {size1}");
            var size2 = new ThreadSize(clrThread2, walker: walker2).GetThreadSize();
            Console.WriteLine($"Thread {clrThread2.ManagedThreadId} size = {size2}");
            ewh.Set();

            //Assert
            Assert.That(walker1.Sizes[GetName<C>()], Is.EqualTo(24));
            Assert.That(new[] { walker1.Sizes[GetName<A>()], walker1.Sizes[GetName<B>()] },
                Is.EquivalentTo(new[] { 182, 90 }));
            Assert.That(walker2.Sizes[GetName<C>()], Is.EqualTo(24));
            Assert.That(new[] { walker2.Sizes[GetName<A>()], walker2.Sizes[GetName<B>()] },
                Is.EquivalentTo(new[] { 182, 90 }));
        }

        [Test]
        [Ignore("Launch w3wp")]
        public void GetThreadSize_RunningThreadInOtherApp()
        {
            //Arrange
            var pid = Process.GetProcessesByName("w3wp").Single().Id;
            using var dataTarget = DataTarget.AttachToProcess(pid, false);
            var walker = new TestWalker();

            //Act
            foreach (var thread in dataTarget.CreateRuntime().Threads)
            {
                Console.WriteLine($"Thread {thread.OSThreadId:x} {thread.ManagedThreadId}");
                var size = new ThreadSize(thread, walker: walker).GetThreadSize();
                Console.WriteLine($"Thread {thread.ManagedThreadId} size = {size}");
            }

            //Assert
            Assert.That(walker.Sizes.ContainsKey(GetName<C>()), Is.True);
        }

        [Test]
        public void GetThreadSize_RunningThread()
        {
            //Arrange
            var ewh = new EventWaitHandle(false, EventResetMode.ManualReset);
            var thread1 = new Thread(() =>
            {
                var list = new List<C>(100);
                while (true)
                {
                    list.Add(new C());
                    if (list.Count > 200)
                    {
                        ewh.Set();
                    }
                }
            });
            thread1.Start();

            using var dataTarget = ClrMdHelper.AttachToCurrentProcess();
            var thread = dataTarget.GetThread(thread1.ManagedThreadId);
            Console.WriteLine($"Thread {thread.OSThreadId:x} {thread.ManagedThreadId}");
            var walker = new TestWalker();
            ewh.WaitOne();

            //Act
            var size = new ThreadSize(thread, walker: walker).GetThreadSize();
            Console.WriteLine($"Thread {thread.ManagedThreadId} size = {size}");

            //Assert
            Assert.That(walker.Sizes.ContainsKey(GetName<C>()), Is.True);
        }

        private static Thread CreateThread(EventWaitHandle ewh)
        {
            return new Thread(() =>
            {
                var a = new A() {str = "string"};
                var b = new B() {str = "another"};
                a.a = a;
                a.b = b;
                b.a = a;
                b.b = b;
                var c = new C();
                ewh.WaitOne();
            });
        }

        private static string GetName<T>()
        {
            return $"ProcInsp.Tests.ThreadSizeTests+{typeof(T).Name}";
        }
    }
}