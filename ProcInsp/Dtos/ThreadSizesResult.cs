using System.Collections.Generic;
using ProcInsp.Threads;

namespace ProcInsp.Dtos
{
    public class ThreadSizesResult
    {
        public string ErrorMessage { get; set; }

        public IEnumerable<ThreadSizeInfo> Infos { get; set; }

    }
}