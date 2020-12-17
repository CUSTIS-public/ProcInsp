import React, { useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, ColumnApi, GridApi, GridReadyEvent } from 'ag-grid-community';
import { ColumnTypes, defaultColDef, DefaultOptions, useGridRefresh } from '../utils/aggrid';
import GridContainer from './GridContainer';
import { Button, message, Skeleton, Switch } from 'antd';
import { Anchor, AnchorProps } from './Anchor';
import { delay, getAppPool } from '../utils/utils';
import { BytesWithProgressProps } from './Bytes';
import { ReloadOutlined } from '@ant-design/icons';
import { replaceAll, Replacements } from '../utils/string';
import { msToHMS } from '../utils/time';
import { ProcInfo } from '../dtos/ProcInfo';
import MachineInfo from '../dtos/machineInfo';

interface ThreadsProps {
    serverUrl: string
    pid: string
    headerInfo: string
    procInfo: ProcInfo | undefined,
    machineInfo: MachineInfo | undefined
    waitLoading: boolean
}

const Threads = (props: ThreadsProps) => {
    const [gridApi, setGridApi] = useState<GridApi>();
    const [columnApi, setGridColumnApi] = useState<ColumnApi>();
    const { loading, refresh } = useGridRefresh();
    const loadingRef = useRef(loading)
    loadingRef.current = loading;
    const [loadingSize, setloadingSize] = useState(true)
    const loadingSizeRef = useRef(loadingSize);
    loadingSizeRef.current = loadingSize
    const machineInfoRef = useRef(props.machineInfo);
    machineInfoRef.current = props.machineInfo;

    const [showAll, setShowAll] = useState(false)
    const showAllRef = useRef(showAll)
    showAllRef.current = showAll

    const server = props.serverUrl
    const pid = props.pid
    const procInfo = props.procInfo
    const machineInfo = props.machineInfo
    const headerInfo = props.headerInfo

    const refreshSize = async (gridApi: GridApi) => {
        const url = `http://${server}/Process/${pid}/threadSizes`;
        try {
            setloadingSize(true);
            const resp = await fetch(url)
            const data = await resp.json();
            while (loadingRef.current) {
                await delay(100);
            }
            let updated = [];
            for (let size of data) {
                let row = gridApi?.getRowNode(`${size.id}`);
                if (row) {
                    updated.push({ ...row.data, heapSize: size.heapSize })
                }
            }
            gridApi.applyTransactionAsync({ update: updated })
        } catch (err) {
            message.error(`Error while data fetch ${url}: ${err}`)
        } finally {
            setloadingSize(false);
        }
    }

    function onGridReady(params: GridReadyEvent) {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
        if (!props.waitLoading) {
            refreshData(params.api, params.columnApi);
        }
    }

    const refreshData = async (gridApi: GridApi, columnApi: ColumnApi) => {
        refresh(gridApi, columnApi, `http://${server}/Process/${pid}/threads`, 'id');
        refreshSize(gridApi)
    }

    const hasStacktrace = (stacktrace: any): boolean => {
        return stacktrace && Array.isArray(stacktrace) && stacktrace.length > 1
    }

    useEffect(() => {
        gridApi?.refreshCells({ columns: ['Kibana'], force: true })
    }, [machineInfo])

    useEffect(() => {
        gridApi?.refreshCells({ columns: ['HeapSize'], force: true })
    }, [loadingSize])

    useEffect(() => {
        gridApi?.onFilterChanged();
    }, [showAll]);

    useEffect(() => {
        if (props.waitLoading || !gridApi || !columnApi) {
            return;
        }
        refreshData(gridApi, columnApi)
    }, [props.waitLoading])

    const showProgress = () => { return loadingSizeRef.current }

    const columns: (ColDef | ColGroupDef)[] = [
        { headerName: "Id", field: "id", pinned: 'left' },
        { headerName: "ManagedId", field: "managedThreadId", pinned: 'left' },
        {
            headerName: 'State', children: [
                { headerName: "ThreadState", field: "threadState", },
                { headerName: "WaitReason", field: "waitReason", columnGroupShow: 'open', },
            ]
        },
        { headerName: "Stacktrace", field: 'stacktrace', type: 'stacktrace' },
        {
            headerName: 'Exception', children: [
                { headerName: "Type", field: 'exception.type' },
                { headerName: "Message", field: 'exception.message', columnGroupShow: 'open' },
                { headerName: "Stacktrace", field: 'exception.stacktrace', type: 'stacktrace', columnGroupShow: 'open' },
            ]
        },
        { headerName: "CpuTime", field: "cpuTimeMs", valueFormatter: (p) => msToHMS(p.value), sort: 'desc' },
        { headerName: "StartTime", field: "startTime", type: 'dateTime' },
        {
            colId: 'HeapSize', headerName: 'HeapSize (?)', field: 'heapSize', type: 'bytes',
            cellRendererParams: { showProgress: showProgress } as BytesWithProgressProps,
            headerTooltip: 'Approximately size of objects used in thread. It\'s calculated as a sum of all objects that are accessible from thread\'s stack roots. If object is used in many threads, it\'s size will be calculated in all these threads. Due to performance issues, only object that have <= 50 depth from stack root are considered. If object references other objects, only first 100 refs are considered.'
        },
        {
            colId: 'Kibana',
            headerName: "Kibana",
            cellRendererFramework: Anchor,
            cellRendererParams: {
                text: 'Kibana',
                href: (data) => {
                    if (!machineInfoRef.current) {
                        return '';
                    }
                    const replacement: Replacements = {
                        machineNameLowercase: machineInfoRef.current?.name.toLowerCase(),
                        machineName: machineInfoRef.current?.name,
                        threadId: data.managedThreadId,
                        pid: pid
                    }
                    return replaceAll(Config.Kibana.Threads, replacement);
                },
                target: '_blank'
            } as AnchorProps
        }
    ];

    let header = `Threads ${headerInfo}`
    header = header.replaceAll(' ', '\u00A0');
    return (
        <GridContainer
            header={header}
            gridApi={gridApi}
            columnApi={columnApi}
            onRefresh={() => refreshData(gridApi!, columnApi!)}
            loading={loading || props.waitLoading}
            leftPanel={
                <>
                    Show all <Switch checked={showAll} onChange={(checked) => {
                        setShowAll(checked)
                    }} />
                </>
            }
            rightPanel={<Button icon={<ReloadOutlined />} disabled={!gridApi} loading={loadingSize || props.waitLoading}
                onClick={() => refreshSize(gridApi!)}>Refresh sizes</Button>}
            infoPanel={
                procInfo
                    ? <><br />CMD: {procInfo?.cmd}</>
                    : <Skeleton active={true} paragraph={{ rows: 0, width: 100 }} title={{ width: 500 }} />}
        >
            <AgGridReact
                {...DefaultOptions}
                onGridReady={onGridReady}
                columnDefs={columns}
                defaultColDef={{ ...defaultColDef, autoHeight: true }}
                columnTypes={ColumnTypes}
                getRowNodeId={data => data.id}

                isExternalFilterPresent={() => !showAllRef.current}
                doesExternalFilterPass={(node) => {
                    return showAllRef.current || hasStacktrace(node.data?.stacktrace) || hasStacktrace(node.data?.exception?.stacktrace)
                        || node.data?.threadState === 'Running'
                }}

                onColumnGroupOpened={() => gridApi!.resetRowHeights()}
            >
            </AgGridReact>
        </GridContainer>
    );
};

export default Threads;