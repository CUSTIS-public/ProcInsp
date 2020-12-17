import { InfoCircleOutlined, InfoCircleTwoTone } from "@ant-design/icons";
import { ICellRendererParams } from "ag-grid-community";
import { Popover, Button, Space } from "antd";
import React, { useMemo } from "react";

const Url = (props: ICellRendererParams) => {
    const getInfo = (): string | undefined => {
        if (!props.value || typeof props.value !== 'string') {
            return undefined;
        }

        const url: string = props.value;
        const result = url.match(Config.Requests.UrlInfo);
        return result && result[1] ? result[1] : url;
    }

    const urlInfo = useMemo(() => getInfo(), [props.value])

    if (!urlInfo) {
        return '';
    }

    const style: React.CSSProperties = {
        fontFamily: "Lucida Console, monospace", 
        maxHeight: '80vh',
        overflow: 'auto'
    }

    return <>
        <Popover content={<div style={style}>{props.value}</div>} title="Url" trigger="click">
            <Button icon={<InfoCircleTwoTone />} size="small" shape="circle" type="link" style={{ color: 'var(--ag-data-color, var(--ag-foreground-color, #F5F5F5))' }} >{urlInfo}</Button>
        </Popover>
    </>
}

export default Url;