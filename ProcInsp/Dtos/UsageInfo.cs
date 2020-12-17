using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace ProcInsp.Dtos
{
    public class UsageInfo
    {
        public UsageInfo(long pid, long ramUsage, int cpuUsage)
        {
            Pid = pid;
            RamUsage = ramUsage;
            CpuUsage = cpuUsage;
            MachineName = Environment.MachineName;
        }

        public UsageInfo() { }

        public long Pid { get; set; }
        public string MachineName { get; set; }
        public int CpuUsage { get; set; }
        public long RamUsage { get; set; }

        public static async Task<UsageInfo> GetUsageInfo(string name)
        {
            using var processId = new PerformanceCounter("Process", "ID Process", name, true);
            using var cpu = new PerformanceCounter("Process", "% Processor Time", name, true);
            using var ram = new PerformanceCounter("Process", "Private Bytes", name, true);

            // Getting first initial values
            cpu.NextValue();
            ram.NextValue();

            // Creating delay to get correct values of CPU usage during next query
            await Task.Delay(500);
            
            return new UsageInfo
            {
                Pid = (int)processId.RawValue,
                MachineName = Environment.MachineName,
                // If system has multiple cores, that should be taken into account
                CpuUsage = (int)(cpu.NextValue() / Environment.ProcessorCount),
                // Returns number of MB consumed by application
                RamUsage = (long)(ram.NextValue())
            };
        }
    }
}