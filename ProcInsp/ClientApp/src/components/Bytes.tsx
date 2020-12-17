import { LoadingOutlined } from "@ant-design/icons";
import { ICellRendererParams } from "ag-grid-community";
import React from "react";
import { kb } from "../utils/utils";
import { CellWithProgressProps, withProgress } from "./CellWithProgress";

interface BytesProps {}

interface BytesParams extends BytesProps, ICellRendererParams { };

const Bytes = (props: BytesParams) => {
    if (typeof props.value !== 'number') {
        return ''
    }
    const bytes = props.value as number;
    if (bytes < kb) {
        return `${bytes} B`
    }
    if (bytes < kb * kb) {
        return `${Math.round(bytes / kb * 10) / 10} KB`
    }
    if (bytes < kb * kb * kb) {
        return `${Math.round(bytes / kb / kb * 10) / 10} MB`
    }
    return `${Math.round(bytes / kb / kb / kb * 10) / 10} GB`
}
 
export interface BytesWithProgressProps extends BytesProps, CellWithProgressProps{}

export const BytesWithProgress = withProgress(Bytes);