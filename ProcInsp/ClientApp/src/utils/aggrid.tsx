import { GridApi, ColumnApi, ColDef, ValueFormatterParams, GridOptions, FirstDataRenderedEvent } from "ag-grid-community";
import { message } from "antd";
import moment from "moment";
import { useRef, useState } from "react";
import { BytesWithProgress } from "../components/Bytes";
import Stacktrace from "../components/Stacktrace";
import Url from "../components/Url";
import { isIterable } from "./utils";

export interface GridRefresh {
    loading: boolean,
    loadingUrls: LoadingUrls,
    data: [],
    setData: React.Dispatch<React.SetStateAction<[] | undefined>>,
    refresh: (gridApi: GridApi, columnApi: ColumnApi, dataurl: DataUrl, dataid: DataId) => Promise<void>
}

type DataId = string | ((data: any) => string);

export type UrlsWithKeys = { [key: string]: string }

type DataUrl = string | UrlsWithKeys;

type LoadingUrls = string[]

export interface Fetch {
    fetchPromise: Promise<void>,
    controller: AbortController
}

export type FetchDict = { [key: string]: Fetch }

interface RefreshParams {
    gridApi: GridApi,
    columnApi: ColumnApi,
    dataurl: DataUrl,
    dataid: DataId,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    setData: React.Dispatch<React.SetStateAction<[] | undefined>>
    setLoadingUrls: React.Dispatch<React.SetStateAction<LoadingUrls>>
    dataRef: React.MutableRefObject<[] | undefined>
    asyncFetches: AsyncFetches
}

interface AsyncFetches {
    fetchAsync: (keys: string[], fetch: (key: string, signal: AbortSignal) => Promise<void>) => Promise<void>
}

export function useAsyncFetches(): AsyncFetches {
    const [fetches, setFetches] = useState<FetchDict>({});
    const fetchesRef = useRef(fetches)
    fetchesRef.current = fetches

    const fetchAsync = async (keys: string[], fetch: (key: string, signal: AbortSignal) => Promise<void>) => {
        for (let fetch in fetchesRef.current) {
            if (!keys.includes(fetch)) {
                fetchesRef.current[fetch].controller.abort();
            }
        }

        const tasks: Promise<void>[] = [];
        const fetches: FetchDict = {}
        for (let key of keys) {
            const oldFetch = fetchesRef.current[key];
            if (oldFetch) {
                tasks.push(oldFetch.fetchPromise)
                fetches[key] = { controller: oldFetch.controller, fetchPromise: oldFetch.fetchPromise }
            } else {
                const controller = new AbortController()
                const task = fetch(key, controller.signal)
                    .then(() => setFetches((old) => { delete old[key]; return old }));
                tasks.push(task)
                fetches[key] = { controller, fetchPromise: task }
            }
        }
        setFetches(fetches)
        await Promise.all(tasks)
    }

    return { fetchAsync }
}

export function useGridRefresh(): GridRefresh {
    const [loading, setLoading] = useState(true);
    const [loadingUrls, setLoadingUrls] = useState([] as LoadingUrls);
    const [data, setData] = useState<[]>();
    const dataRef = useRef(data);
    dataRef.current = data
    const asyncFetches = useAsyncFetches();

    return {
        data: data as [],
        setData,
        loading: loading,
        loadingUrls,
        refresh: async (gridApi: GridApi, columnApi: ColumnApi, dataurl: DataUrl, dataid: DataId) => await refreshGridData({
            gridApi, columnApi, dataurl, setLoading, setData, dataid, dataRef, setLoadingUrls,
            asyncFetches
        })
    }
}

async function refreshGridData(params: RefreshParams) {
    const oldData = params.dataRef.current
    try {
        params.setLoading(true);
        params.setData(undefined)
        params.gridApi.showLoadingOverlay()

        const urls = typeof params.dataurl === 'string' ? { [params.dataurl]: params.dataurl } : params.dataurl;

        await params.asyncFetches.fetchAsync(Object.keys(urls), async (key, signal) =>
            fetchUrl(key, urls[key], signal, oldData, params));
    } catch (err) {
        message.error(`Error while data fetch: ${err}`)
    }
}

async function fetchUrl(key: string, url: string, signal: AbortSignal, oldData: [] | undefined, params: RefreshParams) {
    try {
        params.setLoadingUrls((oldurls) => oldurls.concat(key))
        const resp = await fetch(url, { signal });
        let data = await resp.json();

        if (!isIterable(data)) {
            if(data.errorMessage) {
                message.error(data.errorMessage);
            }
    
            if(data.infos) {
                data = isIterable(data.infos) ? data.infos : [data.infos]
            } else {
                data = [data]
            }
        }

        let add = [];
        let update = [];
        let remove: any[] = [];
        let ids: string[] = [];
        for (let newdata of data) {
            newdata.server = key
            const id = getId(params, newdata);
            ids.push(id);
            if (!params.gridApi.getRowNode(id)) {
                add.push(newdata);
            } else {
                update.push(newdata)
            }
        }
        if (oldData) {
            for (let r of (oldData as any[]).filter(d => d.server === key)) {
                if (!ids.find(x => x === getId(params, r))) {
                    remove.push(r);
                }
            }
        }

        if (!signal.aborted) {
            params.gridApi.applyTransactionAsync({ add, update, remove }, () => {
                excludeUrl(params, key);
            })

            params.setData((olddata) => {
                const d = olddata ?? [];
                const dataarr = data as [];
                return d.concat(dataarr) as []
            });
        }
    } catch (err) {
        if (!signal.aborted) {
            message.error(`Error while data fetch ${url}: ${err}`)
            excludeUrl(params, key);
        }
    } finally {
        if (!signal.aborted) {
            params.setLoading(false);
            params.gridApi.hideOverlay()
        } else {
            excludeUrl(params, key);
        }
    }
}

export const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    maxWidth: 1000,
}

function excludeUrl(params: RefreshParams, key: string) {
    params.setLoadingUrls((oldurls) => oldurls.filter(k => k !== key));
}

export async function fetchMany(urls: string[]) {
    let fetches: Promise<Response>[] = [];
    for (let url of urls) {
        fetches.push(fetch(url));
    }
    const responses = await Promise.all(fetches);
    let datas: Promise<any>[] = [];
    for (let resp of responses) {
        datas.push(resp.json());
    }
    const data = (await Promise.all(datas)).flatMap(x => x);
    return data;
}

function getId(params: RefreshParams, data: any): string {
    if (typeof params.dataid === 'string') {
        return data[params.dataid];
    } else {
        return params.dataid(data);
    }
}

export function dateTimeFormatter(params: (ValueFormatterParams | string)) {
    if (!params) {
        return params;
    }
    let value = (typeof params === 'string') ? params : params.value;
    return value ? moment(value).format('DD.MM.YYYY HH:mm:ss') : value;
}

export const ColumnTypes: { [key: string]: ColDef; } = {
    'bytes': {
        cellRendererFramework: BytesWithProgress
    },
    'dateTime': {
        valueFormatter: dateTimeFormatter,
        minWidth: 130
    },
    'stacktrace': {
        cellRendererFramework: Stacktrace,
        minWidth: 250,
    },
    'url': {
        cellRendererFramework: Url,
    }
}

export const DefaultOptions: GridOptions = {
    onFirstDataRendered: (event: FirstDataRenderedEvent) => event.columnApi.autoSizeAllColumns()
}