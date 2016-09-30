import React, {Component} from 'react';
import { Layout, Panel, Button, Input } from 'react-toolbox';
import Styles from '../sass/login/login';

export default class LoginForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            server: ''
        };

        this.onLogin = this.onLogin.bind(this);
    }

    onLogin(){
        const {login} = this.props;
        const {username, password} = this.state;

        if (login && typeof login === 'function') {
            login(username, password);
        }
    }

    onChangesInput(value, inputName) {
        this.setState({
            [inputName]: value
        });
    }

    render() {
        const {username, password, server} = this.state;

        return (
            <Layout>
                <Panel>
                    <div className={Styles.containerLogin}>
                        <h1>
                            Logo
                        </h1>

                        <div className={Styles.inputColor}>
                            <Input type='text' label='Username' value={username} icon='account_circle' onChange={(e) => {
                                this.onChangesInput(e, 'username');
                            }} />
                            <Input type='password' label='Password' value={password} icon='lock' onChange={(e) => {
                                this.onChangesInput(e, 'password');
                            }} />
                            <Input type='text' label='Custom Server' value={server} icon='cloud_queue' onChange={(e) => {
                                this.onChangesInput(e, 'server');
                            }} />
                            <Button label='Entrar' className={Styles.fullWidth} raised primary onClick={this.onLogin} />
                        </div>
                    </div>
                </Panel>
            </Layout>
        );
    }
};