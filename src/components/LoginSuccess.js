import React, { useEffect } from "react";
import qs from "qs";
import { history } from '../history'

function GoogleSuccess({ location }) {
  const loadGemsConfig = async () => {
    try {
      const queryParams = qs.parse(location.search, { ignoreQueryPrefix: true });
      const { token, approvalStatus } = queryParams;
      console.log(queryParams)
      if(approvalStatus === "Approved") {
        localStorage.setItem("token", token);
        history.push("/recorder");
      }
    } catch (error) {
      console.error("error received", error);
      history.push("/login");
    }
  };

  useEffect(() => {
    loadGemsConfig();
  }, []);


    return (
        <div className="App">
            <a href="http://localhost:3001/auth/google">Sign In with Google</a>
            <p>Your email is not approved yet, please try again when the admin approves it</p>
        </div>
    );
}

export default GoogleSuccess;
