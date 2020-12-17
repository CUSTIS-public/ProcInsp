using Microsoft.Web.Administration;

namespace ProcInsp.Dtos
{
    public class RequestInfo
    {
        public RequestInfo(Request request)
        {
            Verb = request.Verb;
            Url = request.Url;
            TimeElapsedMs = request.TimeElapsed;
            Id = request.RequestId;
            PipelineState = request.PipelineState.ToString();
        }

        public string Id { get; set; }

        public string Verb { get; set; }

        public string Url { get; set; }
        public int TimeElapsedMs { get; set; }
        public string PipelineState { get; set; }
    }
}