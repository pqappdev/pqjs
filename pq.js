/**
 *@description Promoqube facebook jquery plugin
 *
 **/
PQ = {
    options: {
        id: null,
        userId: null,
        baseUrl: '',
        scope: '',
        appLink: '',
        appPageLink: '',
        pageLikeLink: '',
        pageId: null,
        loginUrl: '',
        signedRequest: '',
        pageLiked: false,
        accessToken: '',
        redirectUri: '',
        formUserExists: false,
        share: {
            name: 'Facebook Dialogs',
            link: 'http://developers.facebook.com/docs/reference/dialogs/',
            picture: 'http://fbrell.com/f8.jpg',
            caption: 'Reference Documentation',
            description: 'Dialogs provide a simple, consistent interface for applications to interface with users.'
        },
        afterUserSave: function() {
            PQ.reloadLocation();
        },
        loginResponse: {},
        me: {},
        fbLoginDialog: true,
        autoAuth: false,
        forcePermission: false,
        analyticsCode: '',
        debug: false
    },
    init: function() {
        if (this.options.debug) {
            console.log('PQ Debug Enabled');
        }
        //baseUrl düzenlemesi protocol
        this.options.baseUrl = document.location.protocol + this.options.baseUrl.replace(/http:/, '').replace(/https:/, '');
    },
    protocolCheck: function(link) {
        link = link || null;
        if ('https:' !== document.location.protocol) {
            this.changeLocation(link === null ? this.options.appLink : link);
        }
    },
    changeLocation: function(hrefLink) {
        top.location.href = hrefLink;
    },
    reloadLocation: function() {
        this.changeLocation(this.options.appLink);
    },
    config: function(settings) {
        this.options = $.extend(this.options, settings);
        this.init();
    },
    fbUserSave: function(postData) {
        $.ajax({
            url: this.options.baseUrl + '/User/FbSave',
            data: postData,
            dataType: 'json',
            type: 'post',
            success: function(json) {
                if ('r' in json) {
                    if (json.r) {
                        PQ.options.afterUserSave(json);
                    } else {
                        PQ.message('Kullanici kaydi yapilamadi!');
                    }
                }
            }
        });
    },
    appRequest: function(requestMessage) {
        requestMessage = requestMessage || '';
        FB.ui({
            method: 'apprequests',
            message: requestMessage
        }
        , function(response) {

        });
    },
    share: function(params) {
        params = params || false;

        if (!params) {
            params = this.options.share;
        }

        FB.ui({
            method: 'feed',
            name: params.name,
            link: params.link,
            picture: params.picture,
            caption: params.caption,
            description: params.description
        }, function(response) {
            if (response && response.post_id) {
                _gaq.push(['_trackEvent', 'share', 'send', 'paylaşıldı']);
            } else {
                _gaq.push(['_trackEvent', 'share', 'cancel', 'paylaşılmadı']);
            }
        });
    }
};

/** Uygulama kaydı */
PQ.beforeFbLogin=function(){};
PQ.afterFbLogin = function(response) {
    if (response.authResponse) {
        PQ.missingPermission(function(result){
            if(result){
                popup.message('Gerekli izinleri kabul etmelisiniz');    
            }else{
                PQ.fbUserSave('userId=' + response.authResponse.userID + '&access_token=' + response.authResponse.accessToken + '&signed_request=' + response.authResponse.signedRequest);            
            }
        });
    }    
};

PQ.fbLogin = function() {
    PQ.beforeFbLogin();
    FB.login(function(response) {
        if (response.authResponse) {
            loader.show("<p>Lütfen Bekleyiniz...</p>");
            PQ.log('FB.login');
            PQ.log(response);
            PQ.options.userId = response.authResponse.userID;
            PQ.options.accessToken = response.authResponse.accessToken;
            PQ.options.signedRequest = response.authResponse.signedRequest;
            PQ.options.loginResponse = response;
            PQ.afterFbLogin(response);
        }
    }, {
        scope: this.options.scope
    });
};

/** uygulama izin kontrolü*/
PQ.missingPermissionBeforeSend = function() {

};
/**
 *  result dönen değer
 *  permissions istenen izinler
 *  missingPermission alınamayan izinler
 *  standartında izin alınamadı ise direk login auth sayfası çıkar!
 **/
PQ.missingPermissionAfterSend = function(result, permissions, missingPermissions) {
    PQ.log('missingPermissionAfterSend');
};
PQ.missingPermissionResult=false;
PQ.missingPermissionCustomAfterFunction=function(result){};
PQ.missingPermission = function(customAfterFunction) {
    PQ.log('missingPermission');
    PQ.missingPermissionCustomAfterFunction = customAfterFunction || function(result){};
    PQ.missingPermissionResult=false;
    try{
        
        if (PQ.options.userId === null) {
            throw "user login olmamış";
        }
        FB.api('/' + PQ.options.userId + '/permissions', function(response) {
            PQ.log('missingPermission cevap geldi');
            var permissionList = response.data[0],
                    scopes = PQ.options.scope.split(','),
                    missingPermissionList = new Array(),
                    permission = null;

            for (i in scopes) {
                permission = scopes[i];
                if (!(permission in permissionList)) {
                    missingPermissionList.push(permission);
                }
            }
            PQ.missingPermissionResult = missingPermissionList.length > 0 ? true : false;
            PQ.missingPermissionAfterSend(PQ.missingPermissionResult, scopes, missingPermissionList);
            PQ.missingPermissionCustomAfterFunction(PQ.missingPermissionResult);
    //      izin zorunluluğu var ise fblogin'e döner!  
            if (PQ.options.forcePermission && PQ.missingPermissionResult) {
                PQ.fbLogin();
            }

        });
    }catch(errorMessage){
        PQ.log('error: '+errorMessage);
    }
    return this;
};
/**
 * uygulama logları
 **/
PQ.log = function(text) {
    text = text || null;
    if (text === null || PQ.options.debug === false) {
        return false;
    }
    console.log(text);
    return true;
};
PQ.getLoginStatus = function(response) {
    if (response.status === 'connected') {
        //uygulama izinlerini kontrol et eksik var ise tekrardan izin ekranına yönlendir!
        PQ.options.userId = response.authResponse.userID;
        PQ.options.accessToken = response.authResponse.accessToken;
        PQ.options.signedRequest = response.authResponse.signedRequest;
        PQ.options.loginResponse = response;
        PQ.missingPermission();
//        PQ.missingPermissionResult
    } else {
        //uygulamaya kayıtlı değil ise izin al
        if (PQ.options.autoAuth) {
            PQ.fbLogin();
        }
    }
};
PQ.isPageLiked = function(pageId) {
    PQ.log('isPageLiked');
    if ('error' in PQ.options.loginResponse) {
        return false;
    }
    var $user = PQ.options.me
            , fqlQuery = "SELECT uid FROM page_fan WHERE page_id ='" + pageId + "' and uid = '" + $user.id + "'";
    PQ.log(fqlQuery);
    FB.api('/fql', 'GET', {
        'q': fqlQuery,
        'access_token': PQ.options.loginResponse.accessToken,
        'limit': '5000'
    }, function(response) {
//            console.log(response);
        var result = false;
        if ('error' in PQ.options.loginResponse) {
            return false;
        }

        if (response.data.length > 0 && 'uid' in response.data[0]) {
            result = true;
        }

        PQ.afterIsPageLiked(result, response);

        return result;
    });
};
PQ.fql = function(query, afterFqlSend) {
    afterFqlSend = afterFqlSend || null;
    if (typeof(afterFqlSend) !== 'function') {
        afterFqlSend = function() {
        };
    }
    FB.api('/fql', 'GET', {
        'q': query,
        'access_token': PQ.options.loginResponse.accessToken,
        'limit': '5000'
    }, afterFqlSend);
};
PQ.afterIsPageLiked = function(result, response) {
    console.log('afterIsPageLiked');
    console.log(result);
    console.log(response);
};
/**
 * @param string 
 * */
PQ.message = function(text) {
    alert(text);
};