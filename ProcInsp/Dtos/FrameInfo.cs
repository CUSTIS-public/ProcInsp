using Microsoft.Diagnostics.Runtime;

namespace ProcInsp.Dtos
{
    public class FrameInfo
    {
        public FrameInfo(ClrStackFrame frame)
        {
            Frame = frame.ToString() ?? frame.Method?.Signature;
            Kind = frame.Kind.ToString();
        }

        public string Frame { get; set; }
        public string Kind { get; set; }
    }
}