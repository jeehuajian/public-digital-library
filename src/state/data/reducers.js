// @flow
import type { Action } from '../actions';
import type {SearchAction,SearchFailedAction} from './actions';
import createReducer from '../../lib/createReducer';
import * as actions from './actions';

let reducers = {};

export type DataState = {
   iri?:string,
   resources?:{[string]:{}},
   assocResources?:{[string]:{}},
   facets?:{[string]:boolean|{}},
   keyword?:string,
   language?:string,
   searches:{[keyword:string]:{}|null},
   failures: {[string]: string},
   config?: { //[string]: {}},
      ldspdi:{
         endpoints:string[],
         index:number
      }
   },
   datatypes?:boolean|{},
   IIIFinfo:{
      [string]:{
         imageAsset?:{},
         firstImage?:string
      }
   }
}

const DEFAULT_STATE: DataState = {
   searches:{},
   failures:{},
   loading:{}
   //firstImage:"http://iiif.bdrc.io/image/v2/bdr:V22084_I0886::08860003.tif/full/full/0/default.jpg"
   //firstImage:"http://iiif.bdrc.io/image/v2/bdr:V1KG2788_I1KG3143::I1KG31430003.tif/full/full/0/default.jpg"
}

export const loadedConfig = (state: DataState, action: Action) => {
    return {
        ...state,
        config: action.payload
    }
}
reducers[actions.TYPES.loadedConfig] = loadedConfig;

export const loadedOntology = (state: DataState, action: Action) => {
    return {
        ...state,
        ontology: action.payload
    }
}
reducers[actions.TYPES.loadedOntology] = loadedOntology;


export const gotResource = (state: DataState, action: Action) => {
    return {
        ...state,
        "resources": {
           ...state.resources,
           [action.payload]:action.meta
       }
    }
}
reducers[actions.TYPES.gotResource] = gotResource;

export const noResource = (state: DataState, action: Action) => {
    return {
        ...state,
        failures:{...state.failures, [action.payload]:action.meta }
    }
}
reducers[actions.TYPES.noResource] = noResource;

export const gotAssocResources = (state: DataState, action: Action) => {



    state = {
        ...state,
        "assocResources": {
           ...state.assocResources,
           [action.payload]:action.meta.data
       }
    }

    console.log("assocR",state,action)

    return state ;
}
reducers[actions.TYPES.gotAssocResources] = gotAssocResources;


export const gotNextChunks = (state: DataState, action: Action) => {

   let res ;
   if(state && state.resources && state.resources[action.payload]
      && state.resources[action.payload]["http://purl.bdrc.io/resource/"+action.payload])
      {
         res = state.resources[action.payload]["http://purl.bdrc.io/resource/"+action.payload]         
         if(!res["http://purl.bdrc.io/ontology/core/eTextHasChunk"]) res["http://purl.bdrc.io/ontology/core/eTextHasChunk"] = []
         res["http://purl.bdrc.io/ontology/core/eTextHasChunk"] = res["http://purl.bdrc.io/ontology/core/eTextHasChunk"].concat(action.meta)

         //res["http://purl.bdrc.io/ontology/core/eTextHasChunk"] = [ { value:"machin",lang:"" } ]
      }


    state = {
        ...state,
        "resources": {
            ...state.resources,
            [action.payload]:{
               ["http://purl.bdrc.io/resource/"+action.payload]: res
            }
         }
      }


    console.log("nextC",state,action)

    return state ;
}
reducers[actions.TYPES.gotNextChunks] = gotNextChunks;


export const hostError = (state: DataState, action: actions.SearchFailedAction) => {
    return {
        ...state,
        failures: {
            ...state.failures,
            host: action.payload.error
        }
    }
}
reducers[actions.TYPES.hostError] = hostError;



export const chosenHost = (state: DataState, action: Action) => {

    state = {
        ...state,
        config:
        {
           ...state.config,
           ldspdi:
           {
             ...state.config.ldspdi,
             index:state.config.ldspdi.endpoints.indexOf(action.payload)
           }
        },
        /*
        failures: {
            ...state.failures,
            host: null
        }
        */
    }
    return state ;
}
reducers[actions.TYPES.chosenHost] = chosenHost;



export const searchingKeyword = (state: DataState, action: SearchAction) => {
    return {
        ...state,
        //datatypes:null,
        facets:null,
        //keyword:action.payload.keyword,
        //language:action.payload.language,
        searches:{
           ...state.searches,
           ... action.payload ? {[action.payload.keyword+"@"+action.payload.language]:null}:{}
        }
    }
}
reducers[actions.TYPES.searchingKeyword] = searchingKeyword;


export const getOneDatatype = (state: DataState, action: Action) => {

console.log("get1DT")

    return {
        ...state,
    }
}
reducers[actions.TYPES.getOneDatatype] = getOneDatatype;


export const getDatatypes = (state: DataState, action: Action) => {

   console.log("getDTs")

    return {
        ...state,
        datatypes:true
    }
}
reducers[actions.TYPES.getDatatypes] = getDatatypes;

export const getFacetInfo = (state: DataState, action: actions.SearchAction) => {
    return {
        ...state,
        facets:{ ...state.facets, [action.payload.property]:true }
    }
}
reducers[actions.TYPES.getFacetInfo] = getFacetInfo;

export const notGettingDatatypes = (state: DataState, action: Action) => {
    return {
        ...state,
        datatypes:null
    }
}
reducers[actions.TYPES.notGettingDatatypes] = notGettingDatatypes;


export const foundResults = (state: DataState, action: actions.FoundResultsAction) => {

   let searches

   if(!action.payload.datatype || action.payload.datatype.indexOf("Any") !== -1)
   {
      searches = {
            ...state.searches,
            [action.payload.keyword + "@" + action.payload.language]: action.payload.results
            }
   }
   else {
      searches = {
            ...state.searches,
            [action.payload.datatype[0]] : {
               ...state.searches[action.payload.datatype[0]],
               [action.payload.keyword + "@" + action.payload.language]: action.payload.results
            }
      }
   }

      return {
      ...state,

      keyword:action.payload.keyword,
      language:action.payload.language,
      searches: searches
   }
}
reducers[actions.TYPES.foundResults] = foundResults;

export const foundDatatypes = (state: DataState, action: actions.FoundResultsAction) => {

      return {
      ...state,
      datatypes : action.payload.results
   }
}
reducers[actions.TYPES.foundDatatypes] = foundDatatypes;


export const foundFacetInfo = (state: DataState, action: actions.FoundResultsAction) => {

   let key = action.payload.keyword + "@" + action.payload.language ;
   let t = action.payload.datatype[0]
   if(t == "Any") {
      if(action.payload.results["gender"]) t = "Person" ;
      else if(action.payload.results["license"]) t = "Work" ;
   }
   let searches = {
         ...state.searches,
         [t] : {
            ...state.searches&&state.searches[t]?state.searches[t]:{},
            [key]: {
               ...state.searches&&state.searches[t]?state.searches[t][key]:{},
               metadata : action.payload.results
            }
         }
   }

   return {
      ...state,

      keyword:action.payload.keyword,
      language:action.payload.language,
      searches: searches
   }
}
reducers[actions.TYPES.foundFacetInfo] = foundFacetInfo;

export const getManifest = (state: DataState, action: Action) => {

   //console.log("getMa",action)

    state = {
        ...state,
        IIIFinfo:{ ...state.IIIFinfo,
           [action.meta]:{ ...state.IIIFinfo?state.IIIFinfo[action.meta]:{},
             imageAsset:action.payload
            }
         }
    }
    return state ;
}
reducers[actions.TYPES.getManifest] = getManifest;

export const manifestError = (state: DataState, action: SearchFailedAction) => {

    state = {
        ...state,
        IIIFinfo:{ ...state.IIIFinfo,
           [action.meta]:{ ...state.IIIFinfo?state.IIIFinfo[action.meta]:{},
             manifestError:{ url:action.payload.keyword, error:action.payload.error }
            }
         }
    }
    return state ;
}
reducers[actions.TYPES.manifestError] = manifestError;


export const firstImage = (state: DataState, action: Action) => {

   //console.log("1im",action)

    state = {
        ...state,
        IIIFinfo:{ ...state.IIIFinfo,
           [action.meta]:{ ...state.IIIFinfo?state.IIIFinfo[action.meta]:{},
             firstImage:action.payload.replace(/full[/]0/,",600/0")
            }
         }
    }
    return state ;
}
reducers[actions.TYPES.firstImage] = firstImage;



// Data Reducer
const reducer = createReducer(DEFAULT_STATE, reducers);
export default reducer;
