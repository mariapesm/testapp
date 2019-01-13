import "../css/index.css";
import "bootstrap";
import request from "superagent";
import React from "react";
import ReactDOM from "react-dom";
import StackGrid from "react-stack-grid";

let brokenImageSrc="https://udemy-images.udemy.com/course/750x422/922484_52a1_5.jpg";


class Nav extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <nav className="navbar navbar-default">
                    <div className="container-fluid">
                        <div className="navbar-header">
                            <a className="navbar-brand">pinterest-clone</a>
                        </div>
                        <ul className="nav navbar-nav">
                            <li><a onClick={() => this.props.to("All")}>ALL WINS</a></li>
                            <li><a onClick={() => this.props.to("My")}>MY WINS</a></li>
                            <li><a onClick={() => this.props.to("Login")}>LOGIN /LOGOUT</a></li>

                        </ul>
                    </div>
                </nav>
            </div>
        );
    }
}

class All extends React.Component {
    constructor(props) {
        super(props);
        this.state = {wins: [], user: ""};
    }

    componentDidMount() {
        this.isMount = true;
        this.getAllWins();
    }

    componentWillUnmount() {
        this.isMount = false;
    }

    getAllWins() {
        console.log("get all wins");
        request.get("/api/get-all")
            .end((err, res) => {
                if (err | !res | !this.isMount) {
                    return;
                }
                if (res.statusCode === 200) {
                    let json = JSON.parse(res.text);
                    if (json.success) {
                        this.setState({wins: json.wins, user: json.user});
                    }
                }

            });
    }

    handleLike(winId){
        request.get("/api/like")
            .query({winId:winId})
            .end((err,res)=>{
            if(err |!res | !this.isMount) return;
            if(res.statusCode===200){
                let json=JSON.parse(res.text);
                if(json.success==="unauth"){
                    this.props.to("Login");
                    return;
                }
                if(json.success){
                    this.getAllWins();
                }

            }


            });
    }

    render() {
        let wins = [];
        if (this.state.wins) {
            let arr = this.state.wins;
            for (let i = 0; i < arr.length; i++) {
              let className="btn btn-default btn-sm";
              if(arr[i].liked.indexOf(this.state.user)!==-1){
                  className="btn btn-danger btn-sm";
              }
                wins.push(
                    <div key={i} className="grid-item grid-block">
                        <h4 className="title">{arr[i].title}</h4>
                        <div>
                            <img className="img" onError={(e)=>{e.target.src=brokenImageSrc}} src={arr[i].url} alt="image url broken"/>
                        </div>
                        <div className="star-block">
                            <button onClick={()=>this.handleLike(arr[i]._id)} type="button" className={className}>liked</button>
                                <span className="liked-number">{arr[i].liked.length}</span>
                        </div>
                    </div>
                );
            }
        }

        return (
            <div>
                <StackGrid columnWidth={200}>
                    {wins}
                </StackGrid>


            </div>
        );
    }
}

class My extends React.Component {
    constructor(props) {
        super(props);
        this.state = {wins:[],url: "", title: ""};
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        this.isMount = true;
        this.getMyWins();
    }

    componentWillUnmount() {
        this.isMount = false;
    }

    getMyWins() {
        console.log("get my wins");
        request.get("/api/get-my")
            .end((err, res) => {
                if (err | !res | !this.isMount) {
                    return;
                }
                if (res.statusCode === 200) {
                    let json = JSON.parse(res.text);
                    if(json.success==="unauth"){
                        this.props.to("Login");
                        return;
                    }
                    if (json.success) {
                        this.setState({wins: json.wins});
                    }
                }

            });
    }

    handleChange(e) {
        let name = e.target.name;
        let value = e.target.value;
        this.setState({[name]: value});
    }

    handleSubmit(e) {
        e.preventDefault();
        this.refs.dismiss.click();
        console.log("handle submit run");

        if (!this.state.title.trim() | !this.state.url.trim()) {
            return;
        }
        request.get("/api/add-win")
            .query({title: this.state.title, url: this.state.url})
            .end((err, res) => {
                console.log(res);
                if (err | !res) return;
                if (res.statusCode === 200) {
                    let json = JSON.parse(res.text);
                    if (json.success === "unauth") {
                        this.props.to("Login");
                        return;
                    }
                    if (json.success) {
                        this.setState({url: "", title: ""});
                        //request all data
                       this.getMyWins();
                    }
                }
            });


    }

    deleteByWinId(id){
        request.get("/api/delete")
            .query({winId:id})
            .end((err,res)=>{
            if(err|!res|!this.isMount) return;
            if(res.statusCode===200){
                let json=JSON.parse(res.text);
                if(json.success==="unauth") {
                    this.props.to("Login");
                    return;
                }
                if(json.success){
                    this.getMyWins();
                }
            }

            });
    }

    render() {
        let wins = [];
        if (this.state.wins) {
            let arr = this.state.wins;
            for (let i = 0; i < arr.length; i++) {
                wins.push(
                    <div key={i} className="grid-item grid-block">
                        <h4 className="title">{arr[i].title}</h4>
                        <div>
                            <img onError={(e)=>{e.target.src=brokenImageSrc}}  className="img" src={arr[i].url} alt="image url broken"/>
                        </div>
                        <div >
                            <button onClick={()=>this.deleteByWinId(arr[i]._id) } type="button" className="btn btn-default">delete</button>

                        </div>
                    </div>
                );
            }
        }

        return (
            <div>
                <div className="container">
                    <button type="button" className="btn btn-info " data-toggle="modal" data-target="#myModal">Add A
                        Win
                    </button>
                    <div className="modal fade" id="myModal" role="dialog">
                        <div className="modal-dialog">

                            <div className="modal-content">
                                <div className="modal-header">
                                    <button ref="dismiss" type="button" className="close"
                                            data-dismiss="modal">&times;</button>
                                    <h4 className="modal-title">Add A Win</h4>
                                </div>
                                <div className="modal-body">
                                    <div>
                                        <img className="module-img" src={this.state.url}
                                             alt="Your image will show here"/>
                                    </div>

                                    <form onSubmit={this.handleSubmit}>

                                        <div className="form-group">
                                            <label htmlFor="title">Title</label>
                                            <input required value={this.state.title} onChange={this.handleChange}
                                                   name="title"
                                                   type="text" className="form-control" id="title"
                                                   aria-describedby="emailHelp" placeholder="enter  title here"/>

                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="url">URL</label>
                                            <input required value={this.state.url} onChange={this.handleChange}
                                                   name="url"
                                                   type="url" className="form-control" id="url"
                                                   placeholder="enter image picture url"/>
                                        </div>

                                        <div className="modal-footer">
                                            <input type="submit" className="btn btn-default" value="Submit"/>

                                        </div>
                                    </form>

                                </div>

                            </div>

                        </div>
                    </div>

                </div>
                <div>
                    <StackGrid columnWidth={200}>
                        {wins}
                    </StackGrid>
                </div>
            </div>
        );
    }
}

class Login extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <a className="btn btn-default" href="/login">click here to login page</a>
            </div>
        );
    }
}


class Page extends React.Component {
    constructor(props) {
        super(props);
        this.state = {body: "All"}
        this.to = this.to.bind(this);
    }

    to(body) {
        this.setState({body: body});
    }

    render() {
        let componets = {
            All: <All to={this.to}></All>,
            My: <My to={this.to}></My>,
            Login: <Login to={this.to}></Login>

        };

        let body = componets[this.state.body]

        return (
            <div >

                <Nav to={this.to}></Nav>
                {body}

            </div>
        );
    }
}

ReactDOM.render(<Page></Page>, document.getElementById("root"));
