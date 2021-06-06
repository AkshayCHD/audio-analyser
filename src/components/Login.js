import { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { history } from '../history';

const useStyles = makeStyles((theme) => ({
}));


function Login() {
    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log(token)
        if(token) {
            history.push('/recorder')
        }
    }, [])
  return (
    <div className="App">
      <a href="http://localhost:3001/auth/google">Sign In with Google</a>
    </div>
  );
}

export default Login;
