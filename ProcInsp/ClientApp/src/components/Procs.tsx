import React, { useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, ColumnApi, GridApi, GridReadyEvent, ICellRendererParams, RowNode } from 'ag-grid-community';
import { Button, message, Space, Spin, Switch } from 'antd';
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ColumnTypes, defaultColDef, DefaultOptions, FetchDict, UrlsWithKeys, useAsyncFetches, useGridRefresh } from '../utils/aggrid';
import GridContainer from './GridContainer';
import { delay, getAppPool, getServersOfInterest, kb, onlyUnique } from '../utils/utils';
import { Anchor, AnchorProps } from './Anchor';
import { CellWithProgress, CellWithProgressProps } from './CellWithProgress';
import { BytesWithProgressProps } from './Bytes';
import qs from 'query-string';
import { ReloadOutlined } from '@ant-design/icons';
import { replaceAll, Replacements } from '../utils/string';

const InspServers = Config.InspServers
const IisProcs = Config.IisProcs

const LinkToInfo = (props: ICellRendererParams) => {
    return <Link to={`/proc?server=${props.data.server}&pid=${props.data.id}`} >{props.value}</Link>;
}

interface ProcsPros {
    servers: string[],
    onlyIis: boolean,

    onOnlyIisChanged: (checked: boolean) => void
}

const Procs = (props: ProcsPros) => {
    const [gridApi, setGridApi] = useState<GridApi>();
    const [columnApi, setGridColumnApi] = useState<ColumnApi>();
    const { refresh, loadingUrls } = useGridRefresh();
    const loadingUrlsRef = useRef(loadingUrls);
    loadingUrlsRef.current = loadingUrls;
    const [loadingUsage, setLoadingUsage] = useState([] as string[])
    const loadingUsageRef = useRef(loadingUsage);
    loadingUsageRef.current = loadingUsage
    const asyncUsageFetches = useAsyncFetches();
    const onlyIisRef = useRef(props.onlyIis)
    onlyIisRef.current = props.onlyIis

    const servers = props.servers;

    useEffect(() => {
        gridApi?.onFilterChanged();
    }, [props.onlyIis])

    const getDataId = (data: any) => {
        return `${data.machineName} ${data.id}`
    }

    const showProgress = (data: any) => {
        return loadingUsageRef.current.includes(data.server)
    }

    const showProgressMain = (data: any) => {
        return loadingUrlsRef.current.includes(data.server)
    }

    useEffect(() => {
        gridApi?.refreshCells({ columns: ['id'], force: true })
    }, [loadingUrls]);

    useEffect(() => {
        gridApi?.refreshCells({ columns: ['cpuUsage', 'ramUsage'], force: true })
    }, [loadingUsage]);

    useEffect(() => {
        if (gridApi && columnApi) {
            refreshData(gridApi, columnApi)

            const remove: any[] = [];
            gridApi.forEachNode((node) => {
                if (!props.servers.includes(node.data.server)) {
                    remove.push(node.data)
                }
            })
            gridApi.applyTransactionAsync({ remove });
        }
    }, [props.servers])

    const columns: (ColDef | ColGroupDef)[] = [
        {
            headerName: "App", pinned: 'left', children: [
                {
                    colId: 'id',
                    headerName: "Id", field: "id",
                    cellRendererFramework: CellWithProgress,
                    cellRendererParams: { showProgress: showProgressMain } as CellWithProgressProps, pinned: 'left'
                },
                {
                    headerName: "Name", field: "name",
                    cellRendererFramework: LinkToInfo, pinned: 'left',
                },
                {
                    headerName: "AppPool",
                    valueGetter: (params) => getAppPool(params.data.cmd)
                    , pinned: 'left'
                },
                { headerName: "Cmd", field: "cmd", tooltipField: "cmd", columnGroupShow: 'open', pinned: 'left' },
            ]
        },

        { headerName: "MachineName", field: "machineName", pinned: 'left' },

        {
            headerName: "Memory", children: [
                {
                    colId: "ramUsage",
                    headerName: "RAM usage", field: "ramUsage", type: 'bytes', sort: 'desc', sortIndex: 1,
                    cellRendererParams: { showProgress: showProgress } as BytesWithProgressProps,
                },
                { headerName: "PeakWorkingSet64", field: "peakWorkingSet64", type: 'bytes', columnGroupShow: 'open' },
            ]
        },
        {
            colId: "cpuUsage",
            headerName: "CPU usage", field: "cpuUsage", sort: 'desc', sortIndex: 2,
            cellRendererFramework: CellWithProgress,
            cellRendererParams: { showProgress: showProgress } as CellWithProgressProps,
        },

        { headerName: "StartTime", field: "startTime", type: 'dateTime' },
        { headerName: "Is64", field: "is64" },
        { headerName: "Status", field: "status" },
        {
            colId: 'Kibana',
            headerName: "Kibana",
            cellRendererFramework: Anchor,
            cellRendererParams: {
                text: 'Kibana',
                href: (data) => {
                    const replacement: Replacements = {
                        machineNameLowercase: data.machineName.toLowerCase(),
                        machineName: data.machineName,
                        pid: data.id
                    };
                    return replaceAll(Config.Kibana.Procs, replacement);
                },
                target: '_blank'
            } as AnchorProps
        }
    ];

    function onGridReady(params: GridReadyEvent) {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
        refreshData(params.api, params.columnApi);
    }

    const refreshData = async (gridApi: GridApi, columnApi: ColumnApi) => {
        let urls: UrlsWithKeys = {};
        for (let server of servers) {
            urls[server] = `http://${InspServers[server]}/Process`;
        }
        refresh(gridApi, columnApi, urls, getDataId);
        refreshUsage(gridApi, columnApi);
    }

    const refreshUsageOnServer = async (key: string, serverUrl: string, signal: AbortSignal, gridApi: GridApi) => {
        const url = `http://${serverUrl}/Process/usage`;
        try {
            setLoadingUsage((old) => old.concat(key))
            const resp = await fetch(url, { signal })
            const data = await resp.json();
            while (loadingUrlsRef.current.includes(key) && !signal.aborted) {
                await delay(100);
            }
            let updated = [];
            for (let usage of data) {
                let row = gridApi.getRowNode(`${usage.machineName} ${usage.pid}`);
                if (row) {
                    updated.push({ ...row.data, cpuUsage: usage.cpuUsage, ramUsage: usage.ramUsage })
                }
            }
            if (!signal.aborted) {
                gridApi.applyTransactionAsync({ update: updated })
            }
        } catch (err) {
            if (!signal.aborted) {
                message.error(`Error while data fetch ${url}: ${err}`)
            }
        } finally {
            setLoadingUsage((old) => old.filter(s => s !== key))
        }
    }

    const refreshUsage = async (gridApi: GridApi, columnApi: ColumnApi) => {
        asyncUsageFetches.fetchAsync(servers, (key, signal) =>
            refreshUsageOnServer(key, InspServers[key], signal, gridApi));
    }

    const rowStyle = (params: any) => {
        if (params.data.name === 'Idle' || params.data.name === 'System Idle Process') {
            return;
        }
        if (params.data.ramUsage && params.data.ramUsage > kb * kb * kb
            || params.data.cpuUsage && params.data.cpuUsage > 25) {
            return { background: params.node.rowIndex % 2 == 0 ? '#db3e00' : '#E15C28' }
        }
    }

    return (
        <GridContainer
            header={`Processes`}
            gridApi={gridApi}
            columnApi={columnApi}
            onRefresh={() => refreshData(gridApi!, columnApi!)}
            loading={loadingUrls.length > 0}
            leftPanel={<>
                Only IIS <Switch checked={props.onlyIis} onChange={(checked) => props.onOnlyIisChanged(checked)} />
                {loadingUrls.concat(loadingUsage).filter(onlyUnique).map(u => <Spin key={u}>{u}</Spin>)}
            </>}
            rightPanel={<Button icon={<ReloadOutlined />} disabled={!gridApi} loading={loadingUsage.length > 0}
                onClick={() => refreshUsage(gridApi!, columnApi!)}>Refresh CPU/RAM</Button>}
        >
            <AgGridReact
                {...DefaultOptions}
                onGridReady={onGridReady}
                columnDefs={columns}
                defaultColDef={defaultColDef}
                columnTypes={ColumnTypes}
                getRowNodeId={getDataId}
                getRowStyle={rowStyle}
                isExternalFilterPresent={() => onlyIisRef.current}
                doesExternalFilterPass={(node) => {
                    return !onlyIisRef.current || typeof IisProcs.find(p => (node.data.name as string).indexOf(p) >= 0) !== 'undefined'
                }}
            >
            </AgGridReact>
        </GridContainer>
    );
};
export default Procs;
