import { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Router, Route, Switch } from "react-router-dom";
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Login from './components/Login';
import Recorder from './components/Recorder';
import LoginSuccess from './components/LoginSuccess';
import { history } from './history';
import PrivateRoute from './components/PrivateRoute';
const useStyles = makeStyles((theme) => ({
  appbar: {
    alignItems: 'center',
    flexDirection: "row",
    justifyContent: "space-between",
  }

}));

function App() {
  const classes = useStyles();
  const [loggedIn, setLoggedIn] = useState(false); 
  const logout = () => {
    localStorage.clear();
    history.push('/');
    setLoggedIn(false);
  }
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log(token)
    if(token) {
      setLoggedIn(true);
      return;
    }
    setLoggedIn(false);
  }, [])

  return (
    <div>
        <div className={classes.root}>
          <AppBar position="static"  className={classes.appbar}>
            <Typography variant="h6" className={classes.title}>
              Audio Analyser
            </Typography>
            <Toolbar>
              { loggedIn ? <Button color="inherit" onClick={logout}>Logout</Button> : null }
            </Toolbar>
          </AppBar>
        </div>
      <Router history={history}>
        <Switch>
          <PrivateRoute exact path="/recorder" component={Recorder} />
          <Route path="/login-success" component={LoginSuccess} />
          <Route exact path="/" component={Login} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
