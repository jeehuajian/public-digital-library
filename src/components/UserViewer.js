
import React, { Component } from 'react';
import ResourceViewer from './ResourceViewer' ;
import SettingsIcon from '@material-ui/icons/Settings'; 
import CheckIcon from '@material-ui/icons/Check'; 
import DeleteIcon from '@material-ui/icons/Delete'; 
import LibraryAddIcon from '@material-ui/icons/LibraryAdd';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import CancelIcon from '@material-ui/icons/CancelOutlined'; 
import CloseIcon from '@material-ui/icons/Close'; 
import InputAdornment from '@material-ui/core/InputAdornment';
import AccountCircle from '@material-ui/icons/AccountCircle';

//import {Translate, I18n} from 'react-redux-i18n';
import I18n from 'i18next';


import Popover from '@material-ui/core/Popover';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import bdrcApi from '../lib/api';
import {shortUri,fullUri} from './App'
import renderPatch, {basePublicProps} from "../lib/rdf-patch.js"

const bdg   = "http://purl.bdrc.io/graph/" ;
const bdgu  = "http://purl.bdrc.io/graph-nc/user/" ;
const bdgup = "http://purl.bdrc.io/graph-nc/user-private/" ;
const bdo   = "http://purl.bdrc.io/ontology/core/" ;
const bdou  = "http://purl.bdrc.io/ontology/ext/user/" ;
const bdr   = "http://purl.bdrc.io/resource/";
const bdu   = "http://purl.bdrc.io/resource-nc/user/" ;
const foaf  = "http://xmlns.com/foaf/0.1/" ;
const rdf   = "http://www.w3.org/1999/02/22-rdf-syntax-ns#" ;
const rdfs  = "http://www.w3.org/2000/01/rdf-schema#" ;
const skos  = "http://www.w3.org/2004/02/skos/core#";
const tmp   = "http://purl.bdrc.io/ontology/tmp/" ;
const xsd   = "http://www.w3.org/2001/XMLSchema#" ;

const api = new bdrcApi({...process.env.NODE_ENV === 'test' ? {server:"http://localhost:5555/test"}:{}});

let publicProps

const ontoTypes = {
    [xsd+"anyURI"]: "uri",
    [rdf+"PlainLiteral"]: "literal"
}


class UserViewer extends ResourceViewer
{
    _dontMatchProp = "mbox|type|isActive|hasUserProfile|(ext[/]user[/]image)" ;
    _timeOut ;
    _validators ; 
    _uuid ;
    
    constructor(props){
        super(props);
        this.togglePopover.bind(this)
        this.delValue.bind(this)
        this.valueChanged.bind(this)
        //this.validateURI.bind(this)
        //this.dataValidation.bind(this)

        this._validators = {
            [xsd+"anyURI"] : this.validateURI  
        }
    }
    
    static getDerivedStateFromProps(props,state) {

        let s 

        if(props.resources && props.resources[props.IRI] && props.resources[props.IRI][props.IRI] && (!state.resource || state.IRI !== props.IRI)) {
            let res = { ...props.resources[props.IRI][props.IRI] }
            
            if(res && !res[bdou+"image"] && props.authUser && props.authUser.picture) res[bdou+"image"] = [ { type: "uri", value:props.authUser.picture } ]

            if(res && !res[bdo+"personGender"]) res[bdo+"personGender"] = [ { type:"uri", value:bdr+"GenderNotSpecified" } ]

            if(!s) s = { ...state }
            s = { ...s, IRI:props.IRI, resource:res, ready:true }
        }

        if(!state.publicProps && props.userEditPolicies) {             
            if(!s) s = { ...state }
            s = { ...s, publicProps: props.userEditPolicies.publicProps }
        }

        console.log("gDsFp",state,s)

        if(s) return s
        else return null ;
    }
    
    getResourceElem = (prop:string, IRI?:string) => { 
        
         IRI = this.props.IRI
             
         let longIRI = fullUri(IRI)

         if(!IRI || !this.props.resources || !this.props.resources[IRI]
            || !this.props.resources[IRI][longIRI]
            || !this.props.resources[IRI][longIRI][prop]) 
               return ;

        let elem ;        

        if(this.state.resource[prop]) elem = this.state.resource[prop]
        else elem = [ ...this.props.resources[IRI][this.expand(IRI)][prop] ]

        if(this.state.updates[prop]) elem = this.state.updates[prop]


        return elem
    }    

    validateURI = async (url) => {
        if(url && !url.match(/^https?:[/][/]/i)) return false

        try {
            let test = await api._fetch( url, { method:"GET", mode:"no-cors" } )            
            //console.log("valid",url,test)
            return true
        }
        catch(e) {
            return false;
        }
    }

    dataValidation = async (tag:string, value:string) => {
        let range = this.props.dictionary, isOk = true        
        if(range) range = range[tag]
        if(range) range = range[rdfs+"range"]
        if(range) for(let propType of range) isOk = isOk && (!this._validators[propType.value] || (await this._validators[propType.value](value)))
        return { isOk, range }
    }
 
    delValue = (event:Event, tag:string, index:integer) => {
        let state = { ...this.state }
        if(!state.updates[tag]) state.updates[tag] = [ ...state.resource[tag] ]
        state = this.delUpdate(state, tag, index);
        console.log("del",state,tag,index)
        this.setState(state);
    }

    delUpdate(state:State,tag:string,index:integer) {
        if(state.updates[tag]) {
            if(state.updates[tag][index]) delete state.updates[tag][index]
            state.updates[tag] = state.updates[tag].filter(e=>e)
            if(!state.updates[tag].length) { 
                delete state.updates[tag]
                if(!state.resource[tag].length) delete state.resource[tag] 
            }
        }
        return state
    }

    valueChanged = (event:Event, tag:string, index:integer, close:boolean = false, newVal:boolean = false) => {
        
        console.log("vCh",close,index)

        if(this._timeOut) clearTimeout(this._timeOut)

        this._timeOut = setTimeout(((event,tag,close,index) => async () => {             

            let value = "" 
            if(event && event.target) value = event.target.value
            let state = { ...this.state }
            let {isOk, range} = await this.dataValidation(tag, value)            

            let itag = tag 
            if(index !== undefined) itag += "_" + index
            else index = 0 

            if(!isOk || (!value && !newVal) ) { 
                state.errors = { ...state.errors, [tag] : true }
            } 
            else {            
                if(this.state.errors[tag]) delete this.state.errors[tag]
                 
                if(!state.resource[tag] || !state.resource[tag].length || state.resource[tag][0].value !== value || (state.updates[tag] && state.updates[tag] !== value) ) {                     
                    if(!state.updates[tag]) state.updates[tag] = []                  
                    if(!state.updates[tag].length) { 
                        if(state.resource[tag]) state.updates[tag] = [ ...state.resource[tag] ]
                        else state.resource[tag] = []
                    }

                    let type = "uri"
                    if(range && range.length && ontoTypes[range[0].value]) type = ontoTypes[range[0].value]
 
                    if(state.emptyPopover) state.updates[tag].push({ value, type, newVal:true })
                    else { 
                        if(state.updates[tag][index].newVal) delete state.updates[tag][index].newVal
                        state.updates[tag][index] = { ...state.updates[tag][index], value: value }
                    }
                }

                if(close) setTimeout( () => this.togglePopover(event, tag, index), 10) ;
            }

            // not working: "delete state.emptyPopover" (???)
            if(state.emptyPopover) state.emptyPopover = false ; 
            this.setState(state)

            this._timeOut = 0

        })({...event},tag,close,index),10); //!close?650:10) // shorter delay if popover is supposed to be closing

    }
    

    togglePopover = (event:Event, tag:string, index:integer, clearMod:boolean=false, anchor:(Event)=>any, empty: boolean = false) => {

        if(this._timeOut) return ;

        let state = { ...this.state } //, collapse:{...this.state.collapse, [tag]:val}, anchorElPopover:anchor})
        let update 

        if(index === -1) {
            if(state.updates[tag]) index = state.updates[tag].length
            else if(state.resource[tag]) index = state.resource[tag].length
            else index = 0
        }

        let itag = tag 
        if(index !== undefined) itag += "_" + index
        else index = 0

        let val = !state.collapse[itag]

        console.log("toggle",val, event, tag, index, clearMod)

        if(val || !state.errors[tag] || clearMod) { 
            if(val) {
                if(!anchor) anchor = event.currentTarget.parentNode        
                else anchor = anchor(event)
        
                if( !state.resource[tag] || (!state.updates[tag] && index >= state.resource[tag].length) || (state.updates[tag] && index >= state.updates[tag].length) ) this.valueChanged(null, tag, index, false, true)
            }
            update = true ;
            let noErr = true ;
            if(state.updates[tag] && state.updates[tag][index] && !state.updates[tag][index].value) {                
                if(!val && !state.updates[tag][index].value ) {
                    if(!state.updates[tag][index].newVal) {
                        state.errors = { ...state.errors, [tag] : true }
                        noErr = false
                    }
                    else 
                        state = this.delUpdate(state, tag, index)
                }
            }
            if(noErr) {
                state.collapse[itag] = val
                state.anchorElPopover = anchor
                if(empty) state.emptyPopover = true
            }
        }
        
        if(!val)  {
            console.log("!val",tag,index,clearMod,empty)
            update = true ;
            if(clearMod) {
                if(state.errors[tag]) delete state.errors[tag]
                if(state.updates[tag] && state.updates[tag][index]) { 
                    state = this.delUpdate(state, tag, index)
                }
            }
        }


        if(update) { 
            console.log("upd",state)
            this.setState(state)
        }
    }

    popoverContent = (tag:string, info:string, value:any, index:integer=0) => {

        if(!value) {
            if(this.state.emptyPopover) value = ""
            else if(this.state.updates && this.state.updates[tag]) value = this.state.updates[tag]
            else if(this.state.resource && this.state.resource[tag]) value = this.state.resource[tag]
        }

        let elem
        if(Array.isArray(value) && value[index] ) { 
            value = value[index]
            if(value && value.value !== undefined) { 
                elem = value
                value = value.value
            }
        }

        //if(!value) index = -1

        let label, helper, error ;
        if(info) { 
            label = I18n.t(info+".label")
            helper = I18n.t(info+".helperText")
            error = I18n.t(info+".error")
        }
        else { 
            label = this.fullname(tag)
            helper = "helperText"
            error = "Error"
        }        

        console.log('popC',elem,value,label,tag,index)

        return (
            <TextField
                label={label}
                defaultValue={value}
                helperText={!this.state.errors[tag]?helper:error}
                onChange={(e) => this.valueChanged(e,tag,index)}
                onKeyPress={(e) => this.valueChanged(e,tag,index,e.key === "Enter")  }
                fullWidth
                { ...(!value && { defaultValue:''} ) }
                { ...(this.state.errors[tag] /*|| ( !value && elem & !elem.newVal) */ ) && { error:true } }
            />
        )
    }                
                
    renderPopover = (tag:string, info:string, value:any, index:integer) => {

        let content = this.popoverContent(tag, info, value, index) ;        

        let itag = tag 
        if(index !== undefined) itag += "_" + index
        else index = 0
        
        return (
            <Popover anchorEl={this.state.anchorElPopover }  open={this.state.collapse[itag]} onClose={(e) => this.togglePopover(e,tag,index)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'left'}} transformOrigin={{ vertical: 'top', horizontal: 'left'}} //style={{marginLeft:"calc(50px + "+(value?-50:0)+"px)"}}
            >
                <div class="userPopoverContent">
                    { content }
                    { (this.state.updates[tag] || this.state.errors[tag]) && 
                        <div class="buttons bottom">
                            { !this.state.errors[tag] && this.state.updates[tag][index] && this.state.updates[tag][index].value &&
                                <a title="Update" onClick={(e) => this.togglePopover(e,tag,index) } ><CheckIcon /></a> }
                            <a title="Reset" onClick={(e) => this.togglePopover(e,tag,index,true) } ><CloseIcon /></a>
                        </div> 
                    }
                </div>
            </Popover>
        )
    }    
    
    preprop = (k:string,i:integer=0,maxN:integer) => {

        let newP = k === "newProperty"
        if(newP) k = skos+"altLabel" ; //this.state.newProperty

        if(!k || !this.state.publicProps) return ;

        let isPublic = this.state.publicProps.indexOf(k) !== -1
        let isBasePublic = basePublicProps.indexOf(k) === -1
        let isUnique = false

        let showSet = !maxN || (maxN === 1)
        let canDel  = (k !== skos+"prefLabel" || !maxN ) 

        if(k === bdo+"personGender") { 
            isUnique = true
            canDel = false
        }

        return (
            <div class="preprop">
                <div class="menu">
                    { ( canDel && !newP ) &&
                        <a title={I18n.t("user.edit.del")}
                           onClick={(e) => this.delValue(e, k, i) }>
                            <DeleteIcon/>
                        </a> }
                    { ( !isUnique || newP )  && 
                        <a title={I18n.t("user.edit.add")}
                           onClick={(e) => this.togglePopover(e, k, -1, false, (e) => e?e.currentTarget.parentNode.parentNode.parentNode:null, true ) }>
                            <LibraryAddIcon/>
                        </a> }
                    { ( showSet && !newP ) && 
                        <a title={I18n.t("user.edit.set")}  
                           onClick={(e) => this.togglePopover(e, k, i, false, (e) => e.currentTarget.parentNode.parentNode.parentNode ) }>
                            <SettingsIcon/>
                        </a> }
                    { ( false && isBasePublic && isPublic && !newP ) && 
                        <a title={I18n.t("user.edit.hide")}><VisibilityOffIcon/></a>  }
                    { ( false && !isPublic && !newP) && 
                        <a title={I18n.t("user.edit.show")}><VisibilityIcon/></a> }
                </div>
                { !newP && this.renderPopover(k,null,null,i)}
            </div>
        )
    }

    insertPreprop = (tag,n,ret) => { 
        if(n > 1) ret = ret.reduce( (acc,e,i) => [ ...acc, ...(e !== " " ? [ e, this.preprop(tag,i) ] : [e]) ], [] ).filter(e=>e)
        return ret
    }

    getH2 = () => {
        let email,picUrl,pic
        if(this.state.resource) {
            if(this.state.resource[foaf+"mbox"]) {
                email = this.state.resource[foaf+"mbox"]
                console.log("email",email)
                if(email.length) email = email[0].value
            }
            if(this.state.resource[bdou+"image"]) {
                picUrl = this.state.resource[bdou+"image"]
                if(this.state.updates[bdou+"image"]) picUrl = this.state.updates[bdou+"image"]
                if(picUrl.length) picUrl = picUrl[0].value
                pic = 
                    <div id="avatar">
                        <a class="hover" onClick={(e) => this.togglePopover(e, bdou+"image", 0)} title={I18n.t("user.photo.hover")}><SettingsIcon/></a>
                        <img src={picUrl} width="80"/>
                        { this.renderPopover(bdou+"image", "user.photo", picUrl, 0) }
                    </div>
            }
        }
        return <h2>{pic}{email}</h2>
    }


    renderPostData = () => {
        let mods = Object.keys(this.state.updates)
        let id = shortUri(this.props.IRI).split(':')[1]
        let patch = renderPatch(this,mods,id)

        return ( 
            [   this.state.resource?
                <div>               
                    <h3><span>{this.proplink("newProperty","add another property")}</span>...&nbsp;</h3>
                    {this.preprop("newProperty",0,0)}
                </div>:null
            ,

                patch?<pre id="patch" contentEditable="true">
                    {patch}
                </pre>:null
            ]

        )
    }
}

export default UserViewer ;