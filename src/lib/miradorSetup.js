
let jQ ;

import("jquery")
.then((val) => {
   console.log("jQ",val)
   jQ = val.default ;

   console.log("jQ",jQ)
})
.catch((e) => {
   jQ = window.jQuery
})

export function miradorSetUI()
{

   let timerConf = setInterval( () => {

      console.log("miraconf...")

      jQ(".user-buttons.mirador-main-menu span.fa-bars").removeClass("fa-bars").addClass("fa-list");

      miradorAddZoomer();

      if(! jQ(".mirador-viewer .member-select-results li[data-index-number=0]").length) {

         jQ(".mirador-container .mirador-main-menu li a").addClass('on');
         jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").addClass('selec');

         let scrollTimer = setInterval( () => {
            if(jQ(".scroll-view").length)
            {
               //console.log(jQ(".mirador-container ul.scroll-listing-thumbs ").width(),jQ(window).width())
               jQ(".scroll-view")
                  .scrollLeft((jQ(".mirador-container ul.scroll-listing-thumbs ").width() - jQ(window).width()) / 2)
                  .scrollTop(1)

               miradorInitMenu()

               clearInterval(scrollTimer)
            }
         }, 1000);
      }
      else
      {
         jQ(".mirador-container .mirador-main-menu li a").removeClass('on');
         jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").addClass('on selec');

         clearInterval(timerConf);

         miradorAddClick();
         window.setMiradorClick();

         miradorAddZoom();

         miradorAddScroll();


         // open first volume ? or not
         //jQ(".mirador-viewer .member-select-results li[data-index-number=0]").click()
         //jQ('.mirador-viewer li.scroll-option').click()

      }

   }, 10 )
}

export function miradorConfig(data, manifest, canvasID)
{
   let config = {
      id:"viewer",
      data: [],
      showAddFromURLBox:false,
      //displayLayout:false,

      manifestsPanel: {
        name: "Collection Tree Manifests Panel",
        module: "CollectionTreeManifestsPanel",
        options: {
            labelToString: (label) => (!Array.isArray(label)?label:label.map( e => (e["@value"]?e["@value"]+"@"+e["@language"]:e)).join("; "))
        }
      },
      windowSettings: {
        sidePanelVisible: false
      },

      mainMenuSettings : {
         "buttons":[{"layout":"false"}],
         "userButtons": [
           { "label": "Reading View",
             "iconClass": "fa fa-align-center",
             "attributes" : { style:"", onClick : "eval('window.setMiradorScroll()')" }
          },
           { "label": " ",
             "iconClass": "fa fa-search"
          },
           { "label": "Page View",
             "iconClass": "fa fa-file-o",
             "attributes" : { style:"", onClick : "eval('window.setMiradorZoom()')" }
          },
           { "label": "Close Mirador",
             "iconClass": "fa fa-times",
             "attributes" : { onClick : "javascript:eval('window.closeViewer()')" }
            }
         ]
      }
   }
   if(!manifest) {

      config["openManifestsPage"] = true
      config["preserveManifestOrder"] = true
      config["windowObjects"] = []

      config["mainMenuSettings"]["userButtons"] =
      [
         {
            "label": "Browse Collection",
            "iconClass": "fa fa-bars",
            "attributes" : {
               onClick : "window.setMiradorClick(event)"
            },
         },
         ...config["mainMenuSettings"]["userButtons"]
      ]
   }
   else {
      config["windowObjects"] = [ {
         loadedManifest: manifest, //(this.props.collecManif?this.props.collecManif+"?continuous=true":this.props.imageAsset+"?continuous=true"),
         canvasID: canvasID,
         viewType: "ScrollView",
         availableViews: [ 'ImageView', 'ScrollView' ],
         displayLayout:false
      } ]
   }
   config.data = data

   return config ;
}

function miradorAddClick(){
   if(!window.setMiradorClick) {

      window.setMiradorClick = (e) => {

         console.log("cliked",e)

         if(jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").hasClass('selec')) {
            if(e) {
               e.stopPropagation()
               return ;
            }
         }

         jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
         jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").addClass('selec');

         let elem = jQ('.workspace-container > div > div > div.window > div.manifest-info > a.mirador-btn.mirador-icon-window-menu > ul > li.new-object-option > i') //,.addItemLink').first().click() ;
         elem.first().click()

         let clickTimer = setInterval(() => {
            console.log("click interval")
            let added = false
            jQ(".mirador-viewer .member-select-results li[data-index-number]").each( (i,e) => {
               let item = jQ(e)
               if(!item.hasClass("setClick")) {

                  item.find(".preview-images img").click( () => {

                     miradorInitMenu()

                     jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
                     jQ(".mirador-container .mirador-main-menu li a .fa-file-o").parent().addClass('selec');
                     jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").addClass('off')

                  })

                  item.addClass("setClick").click(() => {

                     jQ(".mirador-viewer li.scroll-option").click();
                     jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
                     jQ(".mirador-container .mirador-main-menu li a .fa-align-center").parent().addClass('selec');
                     jQ(".user-buttons.mirador-main-menu li.off").removeClass('off')


                     let scrollTimer = setInterval( () => {
                        if(jQ(".scroll-view").length)
                        {
                           //console.log(jQ(".mirador-container ul.scroll-listing-thumbs ").width(),jQ(window).width())
                           jQ(".scroll-view")
                              .scrollLeft((jQ(".mirador-container ul.scroll-listing-thumbs ").width() - jQ(window).width()) / 2)
                              .scrollTop(1)
                              .find("img.thumbnail-image").click(()=>{
                                 jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
                                 jQ(".mirador-container .mirador-main-menu li a .fa-file-o").parent().addClass('selec');
                                 jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").addClass('off')
                              })

                           miradorInitMenu()

                           clearInterval(scrollTimer)
                        }
                     }, 1000);
                  })
                  added = true ;
               }
            })
            if(!added) {
               clearInterval(clickTimer)
            }
         }, 10) ;
      }
   }
}

function miradorAddZoom()
{
   if(!window.setMiradorZoom) {
      window.setMiradorZoom = () => {

         if(jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").hasClass('selec')) {
            let elem = jQ('.workspace-container > div > div > div.window > div.manifest-info > a.mirador-btn.mirador-icon-window-menu > ul > li.new-object-option > i')
            elem.first().click()
         }

         jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
         jQ(".mirador-container .mirador-main-menu li a .fa-file-o").parent().addClass('selec');
         jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").addClass('off')

         let found = false
         jQ('.scroll-view > ul > li').each((i,e) => {
            let item = jQ(e)
            let o = item.offset()
            if(o.top > 0 && !found) {
               item.find("img").click()
               found = true;
            }
         })
      }
   }
}

function miradorAddScroll()
{
   if(!window.setMiradorScroll) {
      window.setMiradorScroll = () => {

         if(jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").hasClass('selec')) {
            let elem = jQ('.workspace-container > div > div > div.window > div.manifest-info > a.mirador-btn.mirador-icon-window-menu > ul > li.new-object-option > i')
            elem.first().click()
         }

         jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
         jQ(".mirador-container .mirador-main-menu li a .fa-align-center").parent().addClass('selec');
         jQ(".user-buttons.mirador-main-menu li.off").removeClass('off')

         let id = jQ(".panel-listing-thumbs li.highlight img")
         if(!id.length) jQ(".mirador-viewer li.scroll-option").click();
         else {
            jQ(".mirador-viewer li.scroll-option").click();
            setTimeout(() => {
               let imgY = jQ(".scroll-view img[data-image-id='"+id.attr("data-image-id")+"']").parent().offset().top + jQ(".scroll-view").scrollTop()
               console.log(imgY)
               jQ(".scroll-view").animate({scrollTop:imgY-100}
                  //,"scrollLeft": (jQ(".mirador-container ul.scroll-listing-thumbs ").width() - jQ(window).width()) / 2}
                  ,100, () => { jQ("input#zoomer").trigger("input") })


            }, 250)
         }
      }
   }
}

function miradorAddZoomer() {

   if(!jQ(".mirador-main-menu #zoomer").length) {

      jQ(".user-buttons.mirador-main-menu li:nth-last-child(2)").before('<li><input oninput="javascript:eval(\'window.setZoom(this.value)\');" type="range" min="0" max="1" step="0.01" value="0" id="zoomer"/></li>')

      window.setZoom = (val) => {

         if(!window.maxW) return ;

         let scrollT = jQ(".mirador-container ul.scroll-listing-thumbs")
         let scrollV = jQ(".scroll-view")

         // val = 1 => w =  1 * W
         // val = 0 => w =  x * W <=> x = dMin

         let dMin = scrollV.innerWidth() / window.maxW
         let coef = 1 - (1 - dMin) * (1 - val)

         let oldH = scrollT[0].getBoundingClientRect().height;

         scrollT.css({"transform":"scale("+coef+")"})
         scrollV.scrollLeft((window.maxW*coef - scrollV.innerWidth() + 20) / 2)

         let nuH = scrollT[0].getBoundingClientRect().height;

         scrollV.scrollTop(scrollV.scrollTop() + (nuH - oldH)*(scrollV.scrollTop()/oldH))

         //console.log("h",oldH,nuH)
      }

   }
}


function miradorInitMenu() {

      jQ(".user-buttons.mirador-main-menu li:nth-last-child(n-5):nth-last-child(n+2)").addClass("on")
      window.maxW = jQ(".mirador-container ul.scroll-listing-thumbs ").width()
      if(window.maxW < jQ(".scroll-view").innerWidth())
      {
         window.maxW = 0
         jQ(".mirador-container ul.scroll-listing-thumbs ").css("width","auto");
         jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").removeClass("on").hide()
      }
      jQ("input#zoomer").trigger("input")
   }

export function miradorEvents()
{

}