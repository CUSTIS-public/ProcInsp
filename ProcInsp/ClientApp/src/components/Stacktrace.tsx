import { InfoCircleOutlined, InfoCircleTwoTone } from "@ant-design/icons";
import { ICellRendererParams } from "ag-grid-community";
import { Popover, Button, Space } from "antd";
import React, { useMemo } from "react";

interface FrameInfo {
    frame: string,
    kind: string
}

interface TraceInfo {
    entrypoint: string,
    uitrace: JSX.Element[]
}

const Stacktrace = (props: ICellRendererParams) => {
    const getTrace = (): TraceInfo | undefined => {
        if (!props.value || !Array.isArray(props.value)) {
            return undefined;
        }
        const trace = [... (props.value as FrameInfo[])];

        if (!trace || trace.length == 0) {
            return undefined;
        }

        const style: React.CSSProperties = { textIndent: '-2em', paddingLeft: '2em' }

        const uiTrace: JSX.Element[] = [];
        let entrypoint: (string | undefined);
        for (let i = trace.length - 1; i >= 0; i--) {
            const frame = trace[i].frame?.toLowerCase() ?? 'null';

            if (typeof entrypoint === 'undefined'
                && Config.Entrypoint.Contains.find(s => frame.indexOf(s.toLowerCase()) >= 0)
                && !Config.Entrypoint.NotContains.find(s => frame.indexOf(s.toLowerCase()) >= 0)) {
                uiTrace.unshift(<div style={style} key={i}><b>{trace[i].frame}</b> {trace[i].kind}<br /></div>)
                entrypoint = trace[i].frame
            } else {
                uiTrace.unshift(<div style={style} key={i}>{trace[i].frame} {trace[i].kind}<br /></div>)
            }
        }

        if (typeof entrypoint === 'undefined') {
            entrypoint = trace[trace.length - 1].frame ?? trace[trace.length - 1].kind
        }

        const methodName = /(\w*\.\w*)\(/
        const result = entrypoint.match(methodName)

        return {
            entrypoint: result && result[1] ? result[1] : entrypoint,
            uitrace: uiTrace
        }
    }

    const traceInfo = useMemo(() => getTrace(), [props.data])

    if (!traceInfo) {
        return '';
    }

    const style: React.CSSProperties = {
        fontFamily: "Lucida Console, monospace", 
        width: '90vw',
        maxHeight: '80vh',
        overflow: 'auto'
    }

    return <>
        <Popover content={<div style={style}>{traceInfo.uitrace}</div>} title="Stacktrace" trigger="click">
            <Button icon={<InfoCircleTwoTone />} size="small" shape="circle" type="link" style={{ color: 'var(--ag-data-color, var(--ag-foreground-color, #F5F5F5))' }} >{traceInfo.entrypoint}</Button>
        </Popover>
    </>
}

export default Stacktrace;