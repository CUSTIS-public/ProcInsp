import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham-dark.css';
import React, { ReactFragment } from 'react';
import { ColumnApi, GridApi } from 'ag-grid-community';
import { Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface GridContainerProps {
    header: string,
    loading: boolean,
    gridApi: GridApi | undefined,
    columnApi: ColumnApi | undefined,
    leftPanel?: ReactFragment,
    rightPanel?: ReactFragment,
    infoPanel?: ReactFragment,

    children: ReactFragment,

    onRefresh: () => void,
}

export default function GridContainer(props: GridContainerProps) {
    const gridHeight = props.infoPanel ? 'calc(100% - 100px)' : 'calc(100% - 50px)'
    return (<React.Fragment>
        <div style={{ margin: 15, padding: 15, height: '100%' }}>
            <div style={{ height: '25px' }}>
                <Space style={{ maxWidth: '80%' }}>
                    <h3>{props.header}</h3>
                    {props.leftPanel}
                </Space>
                <Space className="float-right" >
                    {props.rightPanel}
                    <Button type='primary' icon={<ReloadOutlined />} disabled={!props.gridApi} loading={props.loading} onClick={props.onRefresh}>Refresh</Button>
                </Space>
            </div>
            {props.infoPanel ? <div style={{height: '50px'}}>{props.infoPanel}</div> : null}
            <div className="ag-theme-balham-dark" style={{ height: gridHeight, width: '100%', marginTop: 20 }}>
                {props.children}
            </div>
        </div>
    </React.Fragment>);
}
