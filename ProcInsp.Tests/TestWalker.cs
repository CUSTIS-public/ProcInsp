using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Diagnostics.Runtime;
using ProcInsp.Threads;

namespace ProcInsp.Tests
{
    class TestWalker : IThreadSizeWalker
    {
        private const string LogName = "log.log";

        /// <summary>Initializes a new instance of the <see cref="T:System.Object" /> class.</summary>
        public TestWalker()
        {
            //File.Delete(LogName);
        }

        public Dictionary<string, ulong> Sizes { get; set; } = new Dictionary<string, ulong>();

        public void OnTouchedObject(ClrObject obj, int depth)
        {
            WriteMsg($"{GetIndent(depth)}Object type {obj.Type?.Name} size {obj.Size}: already touched");
        }

        private static void WriteMsg(string msg)
        {
            Console.WriteLine(msg);
            //File.AppendAllText(LogName, msg + Environment.NewLine);
        }

        private static string GetIndent(int depth)
        {
            return new string(' ', depth * 4);
        }

        public void OnNewObject(ClrObject obj, int depth)
        {
            WriteMsg($"{GetIndent(depth)}Object type {obj.Type?.Name} size {obj.Size}: ");

        }

        public void OnSizeRetrieved(ClrObject obj, ulong size, int depth)
        {
            WriteMsg($"{GetIndent(depth)}size with refs: {size}");

            if(obj.Type?.Name == null)
            {
                return;
            }
            if(!Sizes.ContainsKey(obj.Type?.Name))
            {
                Sizes[obj.Type?.Name] = size;
            }
            else
            {
                Sizes[obj.Type?.Name] += size;
            }
        }
    }
}