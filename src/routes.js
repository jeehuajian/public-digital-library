// @flow
import Script from 'react-load-script';
import AppContainer from './containers/AppContainer';
import React, { Component } from 'react';
import { Switch, Route, Router } from 'react-router-dom';
import history from './history';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import indigo from '@material-ui/core/colors/indigo';
import { Provider } from 'react-redux';
import ResourceViewerContainer from './containers/ResourceViewerContainer'
import IIIFViewerContainer from './containers/IIIFViewerContainer'
import IIIFCookieLogin from './lib/IIIFCookieLogin';
import {miradorSetUI, miradorConfig, miradorInitView} from './lib/miradorSetup';
import { initiateApp } from './state/actions';

import store from './index';
import * as ui from './state/ui/actions'

import qs from 'query-string'

import Auth,{TestToken} from './Auth.js';
import UserViewerContainer from './containers/UserViewerContainer';
import ProfileContainer from './containers/ProfileContainer';
import Profile from './components/ProfileStatic';

import ClearCache from "react-clear-cache";

export const auth = new Auth();


// ignore hash changes made by UV
// (see https://stackoverflow.com/questions/45799823/react-router-ignore-hashchange)
let previousLocation;
const routerSetState = Router.prototype.setState;
Router.prototype.setState = function(...args) {

    const loc = this.props.history.location;

    //console.log("hash",JSON.stringify(previousLocation,null,3),JSON.stringify(loc,null,3),JSON.stringify(args,null,3))

    /* 
    if (loc.pathname === previousLocation.pathname &&
        loc.search   === previousLocation.search   &&
        loc.hash    !== previousLocation.hash // || loc.hash === previousLocation.hash )
    ) {
        previousLocation = {...loc};
        return;
    }
    */

    previousLocation = {...loc};
    return routerSetState.apply(this, args);
};
const routerDidMount = Router.prototype.componentDidMount;
Router.prototype.componentDidMount = function(...args) {
    previousLocation = {
        ...this.props.history.location,
    };
    if (typeof routerDidMount === 'function') {
        return routerDidMount.apply(this, args);
    }
};



// Auth test: ok
//auth.login();

const theme = createMuiTheme({
    palette: {
        primary: indigo,
        secondary: indigo
    }
});

/* // something missing here...
export class ScriptLoader extends Component
{
  _text : string = null ;

  async getText()
  {
    let fic = await fetch("/"+this.props.url)
    this._text = await fic.text()

    console.log("script",this.props,fic,this._text)
  }

  render()
  {
    if(!this._text) this.getText();
    return this._text ;
  }
}
*/

type Props = { history:{} }

export class Redirect404 extends Component<Props>
{
   constructor(props)
   {
      super(props);

      // console.log("props404",props)
      let to = "/"
      if(props.to) to = props.to

      setTimeout((function(that) { return function() { that.props.history.push(to) } })(this), 3000) ;
   }

   render()
   {
      let message = this.props.message ;
      if(!message) message = "Page not found: "+this.props.history.location.pathname ;


      return (<div style={{textAlign:"center",marginTop:"100px",fontSize:"22px"}}>
         { message }
         <br/>
         Redirecting...
      </div>)

   }
}


const handleAuthentication = (nextState, replace) => {
  if (/access_token|id_token|error/.test(nextState.location.hash)) {
    auth.handleAuthentication();
  }
}

const makeMainRoutes = () => {

   return (
      
        <Provider store={store}>
           <MuiThemeProvider theme={theme}>
              <Router history={history}>
                <Switch>
                     <Route path="/testToken" render={(props) => {

                        store.dispatch(initiateApp());

                        return (<TestToken auth={auth} history={history} />)

                     } }/>
                     <Route path="/auth/callback" render={(props) => {
                        store.dispatch(initiateApp(null,null,props));
                        store.dispatch(ui.logEvent(true));
                        return (
                           <div style={{textAlign:"center",marginTop:"100px",fontSize:"22px"}}>
                              Redirecting...
                           </div>
                        )
                     }}/>
                     { 
                        <Route exact path="/user" render={(props) => {

                           store.dispatch(initiateApp(qs.parse(history.location.search)));

                           return (
                              <ClearCache auto={true} duration={20*60*1000}>
                                 {({ isLatestVersion, emptyCacheStorage }) => (<ProfileContainer auth={auth} history={history} />)}
                              </ClearCache>
                           )
                        } } />
                     }
                     { 
                        <Route exact path="/testUser" render={(props) => {

                           store.dispatch(initiateApp(qs.parse(history.location.search)));

                           return (
                              <ClearCache auto={true}  duration={20*60*1000}>
                                 {({ isLatestVersion, emptyCacheStorage }) => (<UserViewerContainer auth={auth} history={history} />)}
                              </ClearCache>
                           )
                        } } />
                     }
                     {/*
                     <Route exact path="/scripts/:URL" render={(props) => {
                        return (<ScriptLoader url={props.match.params.URL}/>)
                     } } />
                     */}
                     <Route exact path="/iiifcookielogin" render={(props) => {
                        return (<IIIFCookieLogin auth={auth} history={history} get={qs.parse(history.location.search)}/>)
                     } } />
                     <Route exact path="/iiiftoken" render={(props) => {
                        let get = qs.parse(history.location.search), messageId = get["messageId"], origin = get["origin"],
                           isAuth = auth.isAuthenticated()

                        if(isAuth && messageId && origin)
                        {
                           window.parent.postMessage(
                           {
                             messageId,
                             "accessToken": localStorage.getItem('id_token'),
                             "expiresIn": 3600
                           },
                              origin
                           );
                        }
                        else {
                           //console.error(window.location.href)
                           let error, description
                           if(!origin || !messageId) {
                              error = "invalidRequest"
                              description = "argument missing:"
                              if(!origin) description += "origin"
                              if(!messageId) description += (description.match(/:$/)?'':', ')+"messageId"
                              if(!origin) origin = window.location.href
                           }
                           else if(!isAuth) {
                              error = "unavailable"
                              description = "no valid token available"
                           }
                           window.parent.postMessage( { error, description }, origin );
                        }
                        return (<div/>)
                     }}/>
                     <Route exact path="/logout" render={(props) => {
                        auth.logout(this.props.history.location,1000);
                        return (
                           <div style={{textAlign:"center",marginTop:"100px",fontSize:"22px"}}>
                              You have been logged out <br/>
                              Redirecting...
                           </div>
                        )
                     }}/>
                     <Route exact path="/" render={(props) => {
                        store.dispatch(initiateApp(qs.parse(history.location.search)));
                        return ( 
                           <ClearCache auto={true}  duration={20*60*1000}>
                              {({ isLatestVersion, emptyCacheStorage }) => (<AppContainer history={history} auth={auth}/> )}
                           </ClearCache>
                        )}}/>
                     <Route path="/search" render={(props) => {
                        let get = qs.parse(history.location.search)
                        //if(!store.getState().data.ontology)
                        {
                           console.log("new route",props,store.getState())
                           //if(!store.getState().ui.loading)
                           store.dispatch(initiateApp(qs.parse(history.location.search)))
                        }
                        return ( 
                           <ClearCache auto={true}  duration={20*60*1000}>
                              {({ isLatestVersion, emptyCacheStorage }) => (<AppContainer history={history} auth={auth}/> )}
                           </ClearCache>
                        )}}/>
                     <Route path="/latest" render={(props) => {
                        let get = qs.parse(history.location.search)
                        //if(!store.getState().data.ontology)
                        {
                           console.log("new route",props,store.getState())
                           //if(!store.getState().ui.loading)
                           store.dispatch(initiateApp(qs.parse(history.location.search), null, null, "latest"))
                        }
                        return ( 
                           <ClearCache auto={true}  duration={20*60*1000}>
                              {({ isLatestVersion, emptyCacheStorage }) => (<AppContainer history={history} auth={auth} latest={true}/> )}
                           </ClearCache>
                        )}}/>
                     <Route path="/view/:IRI" render={(props) =>
                        {
                           let get = qs.parse(history.location.search)
                           console.log("props",props,get)
                           let lang = get["lang"] || localStorage.getItem('lang')  || "bo-x-ewts,sa-x-ewts"
                           let uilang = get["uilang"] || localStorage.getItem('uilang') || "en"
                           if(lang) lang = lang.split(",")
                           let callerURI = get["callerURI"]

                           miradorInitView(props.match.params.IRI,lang,callerURI,uilang);


                           return [
                                    <div id="viewer" class={"view " + (callerURI?" hasCallerURI":"")}></div>,
                                    <link rel="stylesheet" type="text/css" href="../scripts/mirador/css/mirador-combined.css"/>,
                                    <link rel="stylesheet" type="text/css" href="../scripts/src/lib/mirador.css"/>,
                                    <Script url={"../scripts/mirador/mirador.js"} onLoad={(e)=>{ require("@dbmdz/mirador-keyboardnavigation");  }} />,
                                 ]
                        }
                     }/>
                     <Route path="/show/:IRI" render={(props) => {
                        //if(!store.getState().data.resources || !store.getState().data.resources[props.match.params.IRI]
                        //   || !store.getState().data.assocResources || !store.getState().data.assocResources[props.match.params.IRI])
                        
                        let IRI = props.match.params.IRI
                        let get = qs.parse(history.location.search)
                        if(get.part && get.part !== IRI) {
                           get.root = IRI
                           //IRI = get.part
                        }
                        store.dispatch(initiateApp(get,IRI));
                     
                        return (
                           <ClearCache auto={true} duration={20*60*1000}>
                              {({ isLatestVersion, emptyCacheStorage }) => (<ResourceViewerContainer  auth={auth} history={history} IRI={IRI}/> )}
                           </ClearCache>
                        )}}/>
                     <Route render={(props) =>
                        <Redirect404  history={history}  auth={auth}/>}/>
                     <Route path="/scripts/" onEnter={() => window.location.reload(true)} />
                  </Switch>
               </Router>
            </MuiThemeProvider>
         </Provider>
  );
}



export default makeMainRoutes ;
