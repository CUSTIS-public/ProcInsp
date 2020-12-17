using System;
using System.Linq;
using System.Management;
using NUnit.Framework;
using ProcInsp.Services;

namespace ProcInsp.Tests
{
    public class ProcessInfoGetterTests
    {
        [Test]
        public void GetInfos()
        {
            //Arrange
            var getter = new ProcessInfoGetter();
            
            //Act
            var infos = getter.GetInfos().ToArray();

            //Assert
            Assert.That(infos, Has.Length.AtLeast(1));
            foreach (var info in infos)
            {
                Console.WriteLine($"PID {info.Id} CMD {info.Cmd} Status {info.Status}");
            }
        }

        [Test]
        public void GetUsage()
        {
            //Arrange
            var getter = new ProcessInfoGetter();

            //Act
            var infos = getter.GetUsage().Result.ToArray();

            //Assert
            Assert.That(infos, Has.Length.AtLeast(1));
            foreach (var info in infos.OrderByDescending(i => i.CpuUsage))
            {
                Console.WriteLine($"PID {info.Pid} CPU {info.CpuUsage} RAM {info.RamUsage}");
            }
        }
    }
}