import { Row, Col } from "antd";
import React, { useEffect, useState } from "react";
import { RouteComponentProps, useHistory, useLocation, withRouter } from "react-router-dom";
import { areEquivalent, getServersOfInterest } from "../utils/utils";
import Procs from "./Procs";
import Servers from "./Servers";
import qs from 'query-string';
import { useOnce } from "../utils/hooks";

const InspServers = Config.InspServers


interface ServersAndProcs {
    onLocationChanged: (patch: URLSearchParams) => void
}

const ServersAndProcs = (props: ServersAndProcs) => {
    const location = useLocation()
    let serversUrl: string[] = getServersOfInterest(location.search);

    let params = qs.parse(location.search);

    const [servers, setServers] = useState(serversUrl);
    const [onlyIis, setOnlyIis] = useState(params.onlyIis === '1' || params.onlyIis === 'true');

    useEffect(() => {
        const params = new URLSearchParams();
        if (servers.length < Object.keys(InspServers).length) {
            params.append('servers', `${servers}`);
        }

        if (onlyIis) {
            params.append('onlyIis', 'true')
        }

        props.onLocationChanged(params)
    }, [servers, onlyIis])

    useEffect(() => {
        if (document.title !== 'ProcInsp') {
            document.title = `ProcInsp`
        }
    })

    return <div style={{ height: '100%' }}>
        <Row style={{ height: '100%' }}>
            <Col span={6} key='Servers' style={{ height: '100%' }}><Servers servers={servers} onSelectionChanged={(sel) => {
                const newServers = sel.length > 0 ? sel : Object.keys(InspServers)

                if (!areEquivalent(servers, newServers)) {
                    setServers(newServers)
                }
            }}
            />
            </Col>
            <Col span={18} key='Procs' style={{ height: '100%' }}><Procs servers={servers} onlyIis={onlyIis}
                onOnlyIisChanged={checked => {
                    setOnlyIis(checked)
                }} />
            </Col>
        </Row>
    </div>;
}

export default ServersAndProcs;