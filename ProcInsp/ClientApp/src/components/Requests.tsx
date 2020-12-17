import React, { useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, ColumnApi, GridApi, GridReadyEvent } from 'ag-grid-community';
import { ColumnTypes, defaultColDef, DefaultOptions, useGridRefresh } from '../utils/aggrid';
import GridContainer from './GridContainer';
import { msToHMS } from '../utils/time';


interface RequestsProps {
    pid: string,
    serverUrl: string
    onLoaded: () => void
}

const Requests = (props: RequestsProps) => {
    const [gridApi, setGridApi] = useState<GridApi>();
    const [columnApi, setGridColumnApi] = useState<ColumnApi>();
    const { loading, refresh } = useGridRefresh();
    const loadingRef = useRef(loading)
    loadingRef.current = loading;

    const columns: (ColDef | ColGroupDef)[] = [
        { headerName: "Id", field: "id", },
        { headerName: "Verb", field: "verb", },
        { headerName: "Url", field: "url", type: 'url' },
        {
            headerName: "Time elapsed", field: "timeElapsedMs", valueFormatter: (p) => msToHMS(p.value),
            sort: 'desc'
        },
        { headerName: "PipelineState", field: "pipelineState" },
    ];

    function onGridReady(params: GridReadyEvent) {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
        refreshData(params.api, params.columnApi);
    }

    const refreshData = async (gridApi: GridApi, columnApi: ColumnApi) => {
        try {
            await refresh(gridApi, columnApi, `http://${props.serverUrl}/Process/${props.pid}/requests`, 'id');
        } finally {
            props.onLoaded();
        }
    }

    return (
        <GridContainer
            header='Requests'
            gridApi={gridApi}
            columnApi={columnApi}
            onRefresh={() => refreshData(gridApi!, columnApi!)}
            loading={loading}
        >
            <AgGridReact
                {...DefaultOptions}
                onGridReady={onGridReady}
                columnDefs={columns}
                defaultColDef={{ ...defaultColDef }}
                columnTypes={ColumnTypes}
                getRowNodeId={data => data.id}                
            >
            </AgGridReact>
        </GridContainer>
    );
};

export default Requests;