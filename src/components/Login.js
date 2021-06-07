import { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { history } from '../history';
import API_URL from '../config';

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
      <a href={`${API_URL}/auth/google`}>Sign In with Google</a>
    </div>
  );
}

export default Login;
