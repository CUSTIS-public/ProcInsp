using System.Collections.Generic;
using System.Linq;
using System.Management;
using ProcInsp.Dtos;

namespace ProcInsp.Services
{
    public class ProcessInfoGetter
    {
        public IEnumerable<ProcInfo> GetInfos()
        {
            using var searcher = new ManagementObjectSearcher(ProcInfo.Query);
            using var objects = searcher.Get();
            var infos = new List<ProcInfo>();
            foreach (var obj in objects.Cast<ManagementBaseObject>())
            {
                try
                {
                    var info = ProcInfo.Create(obj);
                    if (info != null)
                    {
                        infos.Add(info);
                    }
                }
                finally
                {
                    obj.Dispose();
                }
            }


            return infos;
        }

        public static ProcInfo GetInfo(int pid)
        {
            using var searcher = new ManagementObjectSearcher(ProcInfo.QueryForPid(pid));
            using var objects = searcher.Get();

            using var obj = objects.Cast<ManagementBaseObject>().SingleOrDefault();

            if (obj != null)
            {
                return ProcInfo.Create(obj);
            }

            return null;
        }

        public IEnumerable<UsageInfo> GetUsage()
        {
            var result = new Dictionary<long, UsageInfo>();

            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PerfFormattedData_PerfProc_Process");
            using var objects = searcher.Get();
            foreach (ManagementObject obj in objects)
            {
                try
                {
                    var pidStr = obj["IDProcess"]?.ToString();
                    if (long.TryParse(pidStr, out var pid))
                    {
                        var ramUsage = long.Parse(obj["WorkingSet"]?.ToString());
                        var cpuUsage = int.Parse(obj["PercentProcessorTime"]?.ToString()) / 10;
                        if (result.ContainsKey(pid))
                        {
                            result[pid].CpuUsage += cpuUsage;
                            result[pid].RamUsage += ramUsage;
                        }
                        else
                        {
                            result[pid] = new UsageInfo(pid, ramUsage, cpuUsage);
                        }
                    }
                }
                finally
                {
                    obj.Dispose();
                }

            }

            return result.Values;
        }
    }
}