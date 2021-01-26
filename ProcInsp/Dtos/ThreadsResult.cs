using System.Collections.Generic;

namespace ProcInsp.Dtos
{
    public class ThreadsResult
    {
        public string ErrorMessage { get; set; }

        public IEnumerable<ThreadInfo> Infos { get; set; }
    }
}