import React, { useState } from 'react';

import { Layout } from 'antd';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import { WhatsAppOnboarding } from './scenes/WhatsAppOnboarding';
import { TopNavBar } from './scenes/TopNavBar';
import { Sidebar } from './scenes/SideBar';
import { Accounts } from './scenes/Accounts';
import { Users } from './scenes/Users';
import { PartnerTokens } from './scenes/PartnerTokens';
import { Home } from './scenes/HomePage';
import { Me } from './types';
import { UsagePage } from './scenes/Usage';
import { EmbeddedClient } from './scenes/EmbeddedClient';
import { Audits } from './scenes/Audits';
import { Credentials } from './scenes/Credentials';
import { MigrationStatus } from './scenes/MigrationStatus';
import { Migration } from './scenes/Migration';
import { PartnerApiUsage } from './scenes/PartnerApiUsage';
import { PhoneNumbers } from './scenes/PhoneNumbers';

type Props = {
  me: null | Me;
};

const { Sider, Content } = Layout;

function Routes({ me }: Props): JSX.Element {
  const isLoggedIn = !!me;
  const email = me?.email || null;
  const isAdmin = me?.isAdmin || null;
  const partnerId = me?.partnerId || null;
  const userOnboardingStatus = me?.status || null;

  const [isCollapse, setIsCollapse] = useState(true);

  return (
    <Router>
      <Switch>
        <Route path="/wa-client">
          <EmbeddedClient userOnboardingStatus={userOnboardingStatus} email={email} />
        </Route>
        <Route path="/migrate">
          <Migration />
        </Route>
        <Route>
          <TopNavBar email={email} />
          <Layout style={{ minHeight: 'x90vh', overflow: 'hidden' }}>
            {isLoggedIn && (
              <Sider
                onMouseEnter={() => setIsCollapse(false)}
                onMouseLeave={() => setIsCollapse(true)}
                style={{ overflow: 'hidden' }}
                theme="light"
                collapsible
                collapsed={isCollapse}
                onCollapse={(collapse) => setIsCollapse(collapse)}
              >
                <Sidebar email={email} isAdmin={isAdmin} partnerId={partnerId} />
              </Sider>
            )}
            <Layout className="site-layout">
              <Content
                style={{ padding: '0 24px' }}
                className={isLoggedIn ? 'flex flex-jc-c' : 'flex flex-jc-c flex-ai-c'}
              >
                <Switch>
                  {isLoggedIn && (
                    <>
                      <Route path="/connect">
                        <WhatsAppOnboarding
                          userOnboardingStatus={userOnboardingStatus}
                          isAdmin={isAdmin}
                          partnerId={partnerId}
                        />
                      </Route>
                      <Route path="/accounts">
                        <Accounts isAdmin={isAdmin} partnerId={partnerId} />
                      </Route>
                      <Route path="/phoneNumbers">
                        <PhoneNumbers isAdmin={isAdmin} partnerId={partnerId} />
                      </Route>
                      {isAdmin && (
                        <>
                          <Route path="/users">
                            <Users isAdmin={isAdmin} />
                          </Route>
                          <Route path="/partner-api-usage">
                            <PartnerApiUsage />
                          </Route>
                          <Route path="/audits">
                            <Audits />
                          </Route>
                          <Route path="/migrations">
                            <MigrationStatus isAdmin={isAdmin} email={email} />
                          </Route>
                        </>
                      )}
                      {partnerId && (
                        <>
                          <Route path="/keys">
                            <PartnerTokens partnerId={partnerId} />
                          </Route>
                          <Route path="/credentials">
                            <Credentials />
                          </Route>
                          <Route path="/users">
                            <Users isAdmin={isAdmin} />
                          </Route>
                          <Route path="/migrations">
                            <MigrationStatus isAdmin={isAdmin} email={email} />
                          </Route>
                        </>
                      )}
                      <Route path="/usage">
                        <UsagePage />
                      </Route>
                      <Redirect to="/connect" />
                    </>
                  )}
                  <Route path="/home">
                    <Home />
                  </Route>
                  {!isLoggedIn && <Redirect to="/home" />}
                </Switch>
              </Content>
            </Layout>
          </Layout>
        </Route>
      </Switch>
    </Router>
  );
}

export default Routes;
