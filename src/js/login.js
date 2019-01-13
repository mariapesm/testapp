import "../css/login.css";
import "bootstrap";

import React from "react";
import ReactDOM from "react-dom";

class Login extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return(
            <div>
                <a  className="btn btn-success" href="/auth/github">connect with github</a>
             <a className="logout btn btn-info" href="/">go back to home page</a>



            </div>
        );
    }
}
ReactDOM.render(<Login></Login>,document.getElementById("root"));
