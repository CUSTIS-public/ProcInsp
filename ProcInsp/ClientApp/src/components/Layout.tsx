import { DashboardOutlined, DashboardTwoTone } from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import React, { Component, useState } from 'react';
import { dropByCacheKey } from 'react-router-cache-route';
import { Link, NavLink, useHistory, useLocation } from 'react-router-dom';
import { useOnce } from '../utils/hooks';
const { Header, Content, Footer } = Layout;

export interface AppLayoutApi {
  setMainPath: (path: string) => void
}

interface AppLayoutPros {
  appReady: (api: AppLayoutApi) => void
  children: any
}

export const AppLayout = (props: AppLayoutPros) => {
  const [mainPath, setMainPath] = useState('/')

  useOnce(() => {
    setTimeout(() =>
      props.appReady({ setMainPath: (path) => setMainPath(path) }), 0);
  })

  return <Layout className="layout">
    <Header>
      <div className="logo" style={{ float: 'left', margin: '10px 24px 06px 0px', lineHeight: '40px' }} >
        <DashboardTwoTone style={{ fontSize: '40px' }} />
      </div>
      <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
        <Menu.Item key="1"><NavLink to={mainPath}>Main</NavLink></Menu.Item>
      </Menu>
    </Header>
    <Content style={{ padding: '0 0px' }}>
      <div className="site-layout-content" style={{height: 'calc(100vh - 100px)'}}>
        {props.children}
      </div>
    </Content>
    <Footer style={{ textAlign: 'center', padding: '0px 25px' }}>CustIS ©2020</Footer>
  </Layout>
}
