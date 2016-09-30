import './sass/index.scss';
import React from 'react';
import {render} from 'react-dom';
import {Router, Route, IndexRoute} from 'react-router';
import {IntlProvider} from 'react-intl-redux';
import {Provider} from 'react-redux';
import {addLocaleData} from "react-intl";
import esLocaleData from "react-intl/locale-data/es";
import enLocaleData from "react-intl/locale-data/en";

import {syncHistoryWithStore} from 'react-router-redux';
import {browserHistory} from 'react-router';

import createStore from './store/store';

import MainContainer from './containers/Main';
import LoginContainer from './containers/Login';
import ChatContainer from './containers/Chat';
import RoomContainer from './containers/Room';

import {AppContainer} from 'react-hot-loader';

import Routes from './Routes';

const postProcessJSON = (obj, property = null, res = {}) => {
    const _res = res;

    if (obj instanceof Object) {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                postProcessJSON(obj[i], property ? `${property}.${i}` : i, _res);
            }
        }
    } else {
        _res[property] = obj;
    }

    return _res;
};

addLocaleData([
    ...esLocaleData,
    ...enLocaleData
]);

const AVAILABLES_LOCALES = ['es', 'en'];
const DEFAULT_LOCALE = 'es';

// create a tranlations global var into top level scope
window.translations = {
    current: DEFAULT_LOCALE
};

AVAILABLES_LOCALES.forEach((locale) => {
    const json = require(`json!yaml!./translations/${locale}.yml`);
    window.translations[locale] = postProcessJSON(json);
});

const root = document.getElementById('root');

const store = createStore({
    intl: {
        defaultLocale: DEFAULT_LOCALE,
        locale: DEFAULT_LOCALE,
        messages: window.translations[DEFAULT_LOCALE]
    }
});

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
            <IntlProvider>
                <Router history={history}>
                    <Route path={Routes.base} component={MainContainer} onEnter={checkUserLogged}>
                        <IndexRoute component={ChatContainer} />

                        <Route path={Routes.room} component={RoomContainer}/>
                    </Route>

                    <Route path={Routes.login} component={LoginContainer} />
                </Router>
            </IntlProvider>
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