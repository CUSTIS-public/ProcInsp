import React, { Component, useState } from 'react';
import { Route, useHistory } from 'react-router';
import { AppLayout, AppLayoutApi } from './components/Layout';
import Procs from './components/Procs';
import 'antd/dist/antd.css';
import './custom.css'
import Threads from './components/Threads';
import ServersAndProcs from './components/ServersAndProcs';
import CacheRoute from 'react-router-cache-route';
import ProcessInfo from './components/ProcessInfo';

const App = () => {
  const history = useHistory();
  const [appLayoutApi, setAppLayoutApi] = useState<AppLayoutApi>();

  const onLocationChanged = (params: URLSearchParams) => {
    let path = params.toString();
    if (path) {
      path = `/?${path}`;
    } else {
      path = '/'
    }
    history.push(path);

    appLayoutApi?.setMainPath(path)
  }

  return (
    <AppLayout appReady={(api) => setAppLayoutApi(api)}>
      <CacheRoute exact path='/' render={(props) => <ServersAndProcs {...props} onLocationChanged={onLocationChanged} />} className="fullHeight"/>
      <Route path='/proc' component={ProcessInfo} />
    </AppLayout>
  );

}

export default App;