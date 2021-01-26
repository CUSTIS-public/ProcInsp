using System;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using ProcInsp.Common;

namespace ProcInsp.Tests
{
    public class TaskHelperTests
    {
        [Test]
        public void DoWithInterrupt_ExceptionThrown_Rethrows()
        {
            //Arrange

            //Act & assert
            var ex = Assert.Throws<AggregateException>(() => TasksHelper.DoWithInterrupt(() =>
            {
                var x = 1;
                if (x == 1)
                {
                    throw new Exception("Some exception");
                }

                return x;
            }));
            Assert.That(ex.InnerExceptions[0].Message, Is.EqualTo("Some exception"));
        }

        [Test]
        public void DoWithInterrupt_WaitTimeExceeded_Throws()
        {
            //Arrange

            //Act & assert
            var ex = Assert.Throws<Exception>(() => TasksHelper.DoWithInterrupt(() =>
            {
                Thread.Sleep(TasksHelper.WaitTime * 2);

                return 1;
            }));
            Assert.That(ex.Message, Is.EqualTo("Wait time exceeded"));
        }
    }
}