using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace w3wp
{
    class C
    {
        public long l;
    }

    class Program
    {
        static void Main(string[] args)
        {
            /*for (int i = 0; i < 10; i++)
            {
                new Thread((ParameterizedThreadStart)DoWork2).Start(i.ToString());
            }

            new Timer((s) => Console.WriteLine(DateTime.Now), null, 1000, 1000);

            Console.ReadKey();*/

            while (true)
            {
                for (int i = 0; i < 10; i++)
                {
                    new Thread((ParameterizedThreadStart) DoWork).Start(i.ToString());
                }

                Thread.Sleep(1000);
            }

            Console.ReadKey();
        }

        private static void DoWork(object o)
        {
            try
            {
                if (o.ToString() == "0")
                {
                    throw new Exception("My exception");
                }

                int x = 0;
                Console.WriteLine(
                    $"{DateTime.Now} {o} {x++} ThreadID: {Thread.CurrentThread.ManagedThreadId} {AppDomain.GetCurrentThreadId()}");
                Thread.Sleep(2000);
            }
            catch
            {
                Thread.Sleep(2000);
            }
        }

        private static void DoWork2(object o)
        {
            var c = new C();
            var str = "str";
            var list = new List<C>();
            while (true)
            {
                list.Add(new C());
                if (list.Count > 10)
                {
                    var index = list.Count - 10;
                    list[index].l++;
                }
                if (list.Count > 20)
                {
                    var index = list.Count - 10;
                    var index2 = list.Count - 20;
                    list[index].l = list[index2].l;
                }
            }
        }
    }
}
