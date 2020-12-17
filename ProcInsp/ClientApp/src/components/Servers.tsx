import React, { useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, ColumnApi, GridApi, GridReadyEvent } from 'ag-grid-community';
import { defaultColDef, DefaultOptions, UrlsWithKeys, useGridRefresh } from '../utils/aggrid';
import GridContainer from './GridContainer';
import { CellWithProgress, CellWithProgressProps } from './CellWithProgress';

const InspServers = Config.InspServers


interface ServersProps {
    servers: string[],
    onSelectionChanged: (servers: string[]) => void
}

const Servers = (props: ServersProps) => {
    const [gridApi, setGridApi] = useState<GridApi>();
    const [columnApi, setGridColumnApi] = useState<ColumnApi>();
    const { refresh, loadingUrls, data } = useGridRefresh();
    const loadingUrlsRef = useRef(loadingUrls);
    loadingUrlsRef.current = loadingUrls;
    const needCheckRef = useRef(false)

    const getDataId = (data: any) => {
        return `${data.name}`
    }

    const showProgressMain = (data: any) => {
        return loadingUrlsRef.current.includes(data.server)
    }

    useEffect(() => {
        gridApi?.refreshCells({ columns: ['ram', 'cpu'], force: true })
    }, [loadingUrls]);

    const setChecked = () => {
        if(!needCheckRef.current) return;
        if(props.servers.length === Object.keys(InspServers).length) return

        gridApi?.forEachNode((node) => {
            if (props.servers.includes(node.data.server)) {
                node.setSelected(true)
            }
        })

        needCheckRef.current = false;
    };

    const columns: (ColDef | ColGroupDef)[] = [
        {
            colId: 'name',
            headerName: "Name",
            field: 'name',
            checkboxSelection: true,
            headerCheckboxSelection: true,
            pinned: 'left'
        },
        {
            colId: 'ram',
            headerName: "Ram%",
            valueGetter: (params) => params.data.ramUsage ? Math.round(params.data.ramUsage) : '',
            cellRendererFramework: CellWithProgress,
            cellRendererParams: { showProgress: showProgressMain, } as CellWithProgressProps,
            sort: 'desc'
        },
        {
            colId: 'cpu',
            headerName: "Cpu%", field: "cpuUsage",
            cellRendererFramework: CellWithProgress,
            cellRendererParams: { showProgress: showProgressMain, } as CellWithProgressProps,
            sort: 'desc'
        },
    ];

    function onGridReady(params: GridReadyEvent) {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
        refreshData(params.api, params.columnApi);
    }

    const refreshData = async (gridApi: GridApi, columnApi: ColumnApi) => {
        let urls: UrlsWithKeys = {};
        for (let server in InspServers) {
            urls[server] = `http://${InspServers[server]}/Process/machine`;
        }
        await refresh(gridApi, columnApi, urls, getDataId);
        needCheckRef.current = true;
    }

    const rowStyle = (params: any) => {
        if (params.data.ramUsage && params.data.ramUsage > 80
            || params.data.cpuUsage && params.data.cpuUsage > 80) {
            return { background: params.node.rowIndex % 2 == 0 ? '#db3e00' : '#E15C28' }
        }
    }

    return (
        <GridContainer
            header={`Servers`}
            gridApi={gridApi}
            columnApi={columnApi}
            onRefresh={() => refreshData(gridApi!, columnApi!)}
            loading={loadingUrls.length > 0}
        >
            <AgGridReact
                {...DefaultOptions}
                onGridReady={onGridReady}
                columnDefs={columns}
                defaultColDef={defaultColDef}
                getRowNodeId={getDataId}
                getRowStyle={rowStyle}
                rowSelection='multiple'

                onSelectionChanged={(params) => { props.onSelectionChanged(params.api.getSelectedNodes().map(n => n.data.server)) }}
                onRowDataUpdated={setChecked}
            >
            </AgGridReact>
        </GridContainer>
    );
};

export default Servers;