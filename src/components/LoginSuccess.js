import React, { useEffect } from "react";
import qs from "qs";
import { history } from '../history'

function GoogleSuccess({ location }) {
  const loadGemsConfig = async () => {
    try {
      const queryParams = qs.parse(location.search, { ignoreQueryPrefix: true });
      const { token } = queryParams;
      localStorage.setItem("token", token);
      history.push("/recorder");
    } catch (error) {
      console.error("error received", error);
      history.push("/login");
    }
  };

  useEffect(() => {
    loadGemsConfig();
  }, []);


  return null
}

export default GoogleSuccess;
