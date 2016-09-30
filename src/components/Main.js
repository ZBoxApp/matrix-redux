import React, {Component} from 'react';
import { AppBar, Drawer, List, ListItem, ProgressBar, Layout } from 'react-toolbox';
import Styles from '../sass/global/index';
import DevTools from '../containers/DevTools';

const isDev = process.env.NODE_ENV === 'development' ? true : false;

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            show: false
        };

        this.onClickMenu = this.onClickMenu.bind(this);
    }

    onClickMenu() {
        const {show} = this.state;

        this.setState({
            show: !show
        });
    }

    render () {
        const {children} = this.props;
        const {show} = this.state;

        return (
            <Layout>
                <AppBar fixed title={'Hola, Juorder Gonzalez'} leftIcon={'menu'} onLeftIconClick={this.onClickMenu} flat={true}>
                    <Drawer active={show} onOverlayClick={this.handleToggle} onOverlayClick={this.onClickMenu} >
                        <List selectable ripple>
                            <ListItem caption='Edit Profile' leftIcon='home' />
                            <ListItem caption='Edit Profile' leftIcon='settings' />
                        </List>
                    </Drawer>
                    <ProgressBar type='circular' mode='indeterminate' className={Styles.loaderSize} multicolor />
                </AppBar>
                {children}
                {isDev && (
                    <DevTools/>
                )}
            </Layout>
        );
    }
};