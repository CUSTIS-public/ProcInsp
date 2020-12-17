import { ICellRendererParams } from "ag-grid-community";
import React from "react";
import { Link } from "react-router-dom";
import { CellWithProgressProps, withProgress } from "./CellWithProgress";

type AnchorText = string | ((data: any) => string)

export interface AnchorProps {
    text: AnchorText,
    href: ((data: any) => string | undefined | null),
    target: string
}

interface AnchorParams extends AnchorProps, ICellRendererParams { }

export const Anchor = (props: AnchorParams) => {
    let text: string;
    if (typeof props.text === 'string') {
        text = props.text
    } else {
        text = props.text(props.node.data)
    }

    let href = props.href(props.node.data)
    if (!href) {
        return <>{text}</>;
    }
    return <a href={href} target={props.target}>{text}</a>;
}

export interface AnchorWithProgressProps extends AnchorProps, CellWithProgressProps{}

export const AnchorWithProgress = withProgress(Anchor);