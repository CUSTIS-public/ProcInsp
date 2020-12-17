using Microsoft.Diagnostics.Runtime;

namespace ProcInsp.Threads
{
    public interface IThreadSizeWalker
    {
        void OnTouchedObject(ClrObject obj, int depth);
        void OnNewObject(ClrObject obj, int depth);

        void OnSizeRetrieved(ClrObject obj, ulong size, int depth);
    }
}