import './sass/index.scss';
import React from 'react';
import {render} from 'react-dom';
import {Router, Route, IndexRoute} from 'react-router';
import {Provider} from 'react-redux';

import {syncHistoryWithStore} from 'react-router-redux';
import {browserHistory} from 'react-router';

import createStore from './store/store';

import MainContainer from './containers/Main';
import LoginContainer from './containers/Login';
import ChatContainer from './containers/Chat';
import RoomContainer from './containers/Room';

import {AppContainer} from 'react-hot-loader';

import Routes from './Routes';

const root = document.getElementById('root');
const store = createStore({});
const history = syncHistoryWithStore(browserHistory, store);

function checkUserLogged(nextState, replace, callback) {
    return callback();

    replace({
        pathname: Routes.login
    });

    return callback();
}

render(
    <AppContainer>
        <Provider store={store}>
            <Router history={history}>
                <Route path={Routes.base} component={MainContainer} onEnter={checkUserLogged}>
                    <IndexRoute component={RoomContainer || ChatContainer} />

                    <Route path={Routes.room} component={RoomContainer}/>
                </Route>

                <Route path={Routes.login} component={LoginContainer} />
            </Router>
        </Provider>
    </AppContainer>,
    root
);

if (module.hot) {
    module.hot.accept('./containers/Main', () => {
        const NextRoot = require('./containers/Main').default;
        render(
            <AppContainer>
                <Provider store={store}>
                    <Router history={history}>
                        <Route path='/' component={NextRoot}/>
                    </Router>
                </Provider>
            </AppContainer>,
            root
        );
    });
}