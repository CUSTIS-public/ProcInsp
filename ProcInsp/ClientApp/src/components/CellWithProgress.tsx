import { LoadingOutlined } from "@ant-design/icons";
import { ICellRendererParams } from "ag-grid-community";
import { Space } from "antd";
import React from "react";

export interface CellWithProgressProps {
    showProgress: (data: any) => boolean
}

interface CellWithProgressParams extends CellWithProgressProps, ICellRendererParams { };

export const CellWithProgress = (props: CellWithProgressParams) => {
    if (props.showProgress(props.node.data)) {
        return <Space>{props.value ?? ''}<LoadingOutlined /></Space>;

    }
    return props.value ?? '';
}

export function withProgress(WrappedComponent: any) {
    return (props: any) => {
        const { showProgress, ...passThroughProps } = props;
        if (showProgress && showProgress(props.node.data))
            return <Space><WrappedComponent {...passThroughProps} /><LoadingOutlined /></Space>;
        return <WrappedComponent {...passThroughProps} />
    }
}