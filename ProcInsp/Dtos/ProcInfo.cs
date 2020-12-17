using System;
using System.Diagnostics;
using System.Linq;
using System.Management;
using System.Runtime.InteropServices;

namespace ProcInsp.Dtos
{
    public class ProcInfo
    {
        private ProcInfo()
        {
        }

        public long PeakWorkingSet64 { get; set; }

        private static bool IsWin64Emulator(IntPtr processHandle)
        {
            if ((Environment.OSVersion.Version.Major > 5)
                || ((Environment.OSVersion.Version.Major == 5) && (Environment.OSVersion.Version.Minor >= 1)))
            {
                bool retVal;

                return NativeMethods.IsWow64Process(processHandle, out retVal) && retVal;
            }

            return false; // not on 64-bit Windows Emulator
        }

        public DateTime? StartTime { get; set; }

        public string Cmd { get; set; }

        public string Status { get; set; }

        public string MachineName { get; set; }
        public string Name { get; set; }
        public long Id { get; set; }
        public bool? Is64 { get; set; }

        public const string Query = "SELECT ProcessId, CreationDate, CommandLine, Name, PeakWorkingSetSize, Status, ThreadCount, Handle FROM Win32_Process";

        public static string QueryForPid(int pid)
        {
            return $"{Query} WHERE ProcessId = {pid}";
        }

        public static ProcInfo Create(ManagementBaseObject obj)
        {
            var pidStr = obj["ProcessId"]?.ToString();
            if (!Int64.TryParse(pidStr, out var pid))
            {
                return null;
            }

            return new ProcInfo
            {
                Id = pid,
                Cmd = obj["CommandLine"]?.ToString(),
                StartTime = ManagementDateTimeConverter.ToDateTime(obj["CreationDate"].ToString()),
                Name = obj["Name"].ToString(),
                PeakWorkingSet64 = (UInt32) obj["PeakWorkingSetSize"],
                Status = obj["Status"]?.ToString(),
                Is64 = IsWin64Emulator(new IntPtr(Int32.Parse(obj["Handle"]?.ToString()))),
                MachineName = Environment.MachineName,
            };
        }
    }

    internal static class NativeMethods
    {
        [DllImport("kernel32.dll", SetLastError = true, CallingConvention = CallingConvention.Winapi)]
        [return: MarshalAs(UnmanagedType.Bool)]
        internal static extern bool IsWow64Process([In] IntPtr process, [Out] out bool wow64Process);
    }
}