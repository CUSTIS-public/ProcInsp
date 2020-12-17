using System;
using System.Diagnostics;
using System.Linq;
using System.Management;

namespace ProcInsp.Dtos
{
    public class MachineInfo
    {
        public string Name { get; set; }
        public int CpuUsage { get; set; }

        public double? RamUsage { get; set; }

        /// <summary>Initializes a new instance of the <see cref="T:System.Object" /> class.</summary>
        public MachineInfo()
        {
            Name = Environment.MachineName;

            var cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total", Environment.MachineName);
            cpuCounter.NextValue();
            System.Threading.Thread.Sleep(500); //This avoid that answer always 0
            CpuUsage = (int) cpuCounter.NextValue();

            var wmiObject = new ManagementObjectSearcher("select * from Win32_OperatingSystem");

            var memoryValues = wmiObject.Get().Cast<ManagementObject>().Select(mo => new {
                FreePhysicalMemory = Double.Parse(mo["FreePhysicalMemory"].ToString()),
                TotalVisibleMemorySize = Double.Parse(mo["TotalVisibleMemorySize"].ToString())
            }).FirstOrDefault();

            if (memoryValues != null)
            {
                RamUsage = ((memoryValues.TotalVisibleMemorySize - memoryValues.FreePhysicalMemory) / memoryValues.TotalVisibleMemorySize) * 100;
            }
        }
    }
}