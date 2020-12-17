using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Microsoft.Diagnostics.Runtime;

namespace ProcInsp.Threads
{
    public class ThreadSize
    {
        private const int MaxDepth = 50;
        private const int MaxRefs = 100;
        private readonly ClrThread _thread;
        private readonly CancellationToken? _token;
        private readonly IThreadSizeWalker _walker;
        private int _depth = 0;
        private readonly HashSet<ulong> _touched = new HashSet<ulong>();


        public ThreadSize(ClrThread thread, CancellationToken? token = null, IThreadSizeWalker walker = null)
        {
            _thread = thread;
            _token = token;
            _walker = walker;
        }

        private ulong GetObjectSize(ClrObject obj)
        {
            _token?.ThrowIfCancellationRequested();
            if (_depth > MaxDepth)
            {
                return 0;
            }

            _depth += 1;
            ulong size = 0;
            try
            {
                if (_touched.Contains(obj.Address))
                {
                    _walker?.OnTouchedObject(obj, _depth);
                    return 0;
                }

                _walker?.OnNewObject(obj, _depth);

                _touched.Add(obj.Address);
                size = obj.Size;
                var refs = obj.EnumerateReferences().Take(MaxRefs).ToArray();
                foreach (var refer in refs)
                {
                    _token?.ThrowIfCancellationRequested();
                    size += GetObjectSize(refer);
                }

                _walker?.OnSizeRetrieved(obj, size, _depth);
            }
            catch
            {
                // Sometimes System.InvalidOperationException is thrown
            }
            finally
            {
                _depth -= 1;
            }

            return size;
        }

        public ulong GetThreadSize()
        {
            ulong size = 0;
            var roots = _thread.EnumerateStackRoots().ToArray();
            foreach (var root in roots)
            {
                _token?.ThrowIfCancellationRequested();
                size += GetObjectSize(root.Object);
            }

            return size;
        }
    }
}