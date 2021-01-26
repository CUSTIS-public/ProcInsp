import { Row, Col, message } from 'antd';
import qs from 'query-string';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import MachineInfo from '../dtos/machineInfo';
import { ProcInfo } from '../dtos/ProcInfo';
import { useOnce } from '../utils/hooks';
import { getAppPool, getServer } from '../utils/utils';
import Requests from './Requests';
import Threads from './Threads';


const ProcessInfo = () => {
    const location = useLocation();

    let params = qs.parse(location.search);
    const pid = params.pid as string;
    const serverUrl = Config.InspServers[getServer(params.server as string) as string];

    const [procInfo, setProcInfo] = useState<ProcInfo>();
    const [machineInfo, setMachineInfo] = useState<MachineInfo>();

    const [waitThreadsLoading, setWaitThreadsLoading] = useState(true)

    const headerInfo = `${pid}${procInfo ? ` ${procInfo.appPool ?? procInfo.name} (${procInfo.machineName})` : ''}`
    useEffect(() => {
        document.title = `ProcInsp - ${headerInfo}`
    }, [headerInfo])


    const updateProcInfo = async () => {
        const NoContent = 204;
        const response = await fetch(`http://${serverUrl}/Process/${pid}`);
        if(response.status === NoContent) {
            message.error(`No process found with ID ${pid}`)
            return
        }
        const data = await response.json();
        const info: ProcInfo = { ...data, appPool: getAppPool(data.cmd) };
        info.isW3wp = info.appPool ? true : false
        if (!info.isW3wp) {
            setWaitThreadsLoading(false)
        }
        setProcInfo(info);
    }

    const refreshMahineInfo = async () => {
        try {
            const response = await fetch(`http://${serverUrl}/Process/machine`);
            const data = await response.json();
            setMachineInfo(data);
        } catch (err) {
            console.error(`Error while data fetch: ${err}`)
        }
    }

    useOnce(async () => updateProcInfo());

    useOnce(async () => refreshMahineInfo());

    const isW3wp = procInfo && procInfo.isW3wp
    const height = isW3wp ? '50%' : '100%'

    return <>
        <Row key='Threads' style={{ height: height }}>
            <Col span={24} style={{ height: '100%' }} >
                <div style={{ height: '100%' }}>
                    <Threads machineInfo={machineInfo} procInfo={procInfo} serverUrl={serverUrl} pid={pid} headerInfo={headerInfo}
                        waitLoading={waitThreadsLoading} />
                </div>
            </Col>
        </Row>
        <Row hidden={!isW3wp} key='Requests' style={{ height: height }}>
            <Col span={24} style={{ height: '100%' }}>
                <div style={{ height: '100%' }}>
                    {isW3wp
                        ? <Requests serverUrl={serverUrl} pid={pid} onLoaded={() => { setWaitThreadsLoading(false) }} />
                        : null}
                </div>
            </Col>
        </Row>
    </>

}

export default ProcessInfo;