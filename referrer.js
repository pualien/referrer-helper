if (typeof __referrer_helper === 'undefined') {
  __referrer_helper = {};
}

//Interval helper configuration
__referrer_helper.__firstSessionCookieName = 'utag__fs';
__referrer_helper.__returningSessionCookieName = 'utag__rs';

__referrer_helper.__reviveFirstSession = true; //Revive first session and avoids saving returning session
__referrer_helper.__customCampaignParam = 'wtk'; //Optional, precedes utm_campaign if declared
__referrer_helper.__intervalTimeout = 2 * 60 * 1000; //Refresh timeout for setInterval
__referrer_helper.__defaultCookieTimeout = 1800000; //Default cookie timeout 1800000
__referrer_helper.__customCookieTimeoutVariable = 'utag.cfg.session_timeout'; //Global cookie timeout variable


__referrer_helper.__getCookieTimeout = function () {
  //Get cookie timeout
  var customTimeoutVar = undefined;
  try {
    if (typeof __referrer_helper.__customCookieTimeoutVariable === 'string') {
      //Get timeout from global variable
      for (var i = 0; i < __referrer_helper.__customCookieTimeoutVariable.split('.').length; i++) {
        if (customTimeoutVar === undefined) {
          customTimeoutVar = window[__referrer_helper.__customCookieTimeoutVariable.split('.')[i]];
        } else {
          customTimeoutVar = customTimeoutVar[__referrer_helper.__customCookieTimeoutVariable.split('.')[i]];
        }

      }
    }
  } catch (e) {
    customTimeoutVar = undefined;
  }

  return customTimeoutVar || __referrer_helper.__defaultCookieTimeout;
};


__referrer_helper.__cookieExpiration = function () {
  //Set cookie expiration reading from Tealium Session Timeout or 30 minutes if utag is not defined
  var d = new Date();

  if (typeof __referrer_helper.__customCookieTimeout === 'undefined') {
    __referrer_helper.__customCookieTimeout = __referrer_helper.__getCookieTimeout();
  }
  // if (typeof utag === 'object' && utag.cfg) {
  //   timeout = utag.cfg.session_timeout;
  // }
  d.setTime(d.getTime() + __referrer_helper.__customCookieTimeout);
  return d.toGMTString();
};


__referrer_helper.__crumbleCookie = function (a) {
  //Read cookie in format "source:direct$medium:$campaign:$term:$content:$date:2019-11-26 11:44:17" and returning object (or undefined if cookie is not present)
  for (var d = document.cookie.split(";"), c = {}, b = 0; b < d.length; b++) {
    var e = d[b].substring(0, d[b].indexOf("=")).trim();
    c[e] = d[b].substring(d[b].indexOf("=") + 1, d[b].length).trim();
  }

  if (a && c[a]) {
    var ret_obj = {};

    for (var i = 0; i < c[a].split('$').length; i++) {
      if (c[a].split("$")[i].split(':').length >= 2) {
        if (c[a].split("$")[i].split(':')[1]) {
          ret_obj[c[a].split("$")[i].split(':')[0]] = c[a].split("$")[i].split(/:(.+)/)[1];
        }
      }
    }

    return ret_obj;
  }

  return undefined;
};

__referrer_helper.__bakeCookie = function (a, d, c, b, e, i) {
  //Set cookie
  document.cookie = a + "=" + d + (c ? ";expires=" + c : "") + (b ? ";path=" + b : "") + (e ? ";domain=" + e : "") + (i ? ";secure" : "");
};

__referrer_helper.__writeLogic = function (n,b) {
  //Get Traffic source and set cookie
  var a = __referrer_helper.__getTrafficSource(b);

  a = a.replace(/\|{2,}/g, "|");
  a = a.replace(/^\|/, "");
  a = unescape(a);

  __referrer_helper.__bakeCookie(n, a, __referrer_helper.__cookieExpiration(), "/", "", "");
};

__referrer_helper.__getParam = function (s, q) {
  //Take query string param
  try {
    var match = s.match('[?&]' + q + '=([^&]+)');
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
};

__referrer_helper.__calculateTrafficSource = function (b) {
  //Get traffic source from referrers
  var source = '',
    medium = '',
    campaign = '',
    term = '',
    content = '';
  var search_engines = [['bing', 'q'], ['google', 'q'], ['yahoo', 'q'], ['baidu', 'q'], ['yandex', 'q'], ['ask', 'q']]; //List of search engines names and search terms

  var social_providers = [['twitter', 't.co'], ['facebook', 'facebook.com'], ['youtube', 'youtube.com'], ['instagram', 'instagram.com'], ['whatsapp', 'whatsapp.com']]; //List of social providers names and domains
  var ref = '';
  if (typeof b === 'object' && b.app_rdns) {
    if (b.da_referrer_domain || b.da_referrer_app_rdns) {
      //Precedes custom referrers in case of app
      ref = b.da_referrer_domain || b.da_referrer_app_rdns;
    }
  } else {
    ref = document.referrer;
    ref = ref.substr(ref.indexOf('//') + 2);
  }

  var url_search = '';
  if (typeof b === 'object' && b.app_rdns) {
    if (b.da_location_href) {
      //Precedes custom href in case of app
      url_search = b.da_location_href;
    }
  } else {
    url_search = document.location.search;
  }


  var ref_domain = ref;
  var ref_path = '/';
  var ref_search = '';

  if (url_search.indexOf('utm_source') > -1) {
    //Check for campaign parameters
    source = __referrer_helper.__getParam(url_search, 'utm_source');
    medium = __referrer_helper.__getParam(url_search, 'utm_medium');
    campaign = __referrer_helper.__getParam(url_search, 'utm_campaign');
    term = __referrer_helper.__getParam(url_search, 'utm_term');
    content = __referrer_helper.__getParam(url_search, 'utm_content');
  } else if (__referrer_helper.__getParam(url_search, 'gclid')) {
    source = 'google';
    medium = 'cpc';
    campaign = '';
  } else if (__referrer_helper.__getParam(url_search, 'dclid')) {
    source = 'google';
    medium = 'cpm';
    campaign = '';
  } else if (__referrer_helper.__getParam(url_search, 'fbclid')) {
    source = 'facebook';
    medium = 'social';
    campaign = '';
  } else if (ref) {
    //Separate domain, path and query parameter
    if (ref.indexOf('/') > -1) {
      ref_domain = ref.substr(0, ref.indexOf('/'));
      ref_path = ref.substr(ref.indexOf('/'));

      if (ref_path.indexOf('?') > -1) {
        ref_search = ref_path.substr(ref_path.indexOf('?') + 1);
        ref_path = ref_path.substr(0, ref_path.indexOf('?'));
      }
    }

    medium = 'referral';
    source = ref_domain;

    for (var i = 0; i < search_engines.length; i++) {
      if (ref_domain.indexOf(search_engines[i][0]) > -1) {
        //Check if search engine
        medium = 'organic';
        source = search_engines[i][0];
        term = __referrer_helper.__getParam(ref_search, search_engines[i][1]) || '';
        break;
      }
    }

    for (var j = 0; j < social_providers.length; j++) {
      //Check if social
      if (ref_domain.indexOf(social_providers[j][1]) > -1 || ref_domain.indexOf(social_providers[j][0]) > -1) {
        medium = 'social';
        source = social_providers[j][0];
        break;
      }
    }
  }

  if (__referrer_helper.__customCampaignParam && __referrer_helper.__customCampaignParam.length) {
    //Check for custom campaign parameter
    campaign = campaign.length ? campaign : unescape(__referrer_helper.__getParam(url_search, __referrer_helper.__customCampaignParam));
    if (campaign.length) {
      if(campaign.indexOf('autopromo') >= 0){
        medium = 'autopromo'
      }
      else{
        medium = 'paid generic';
      }
    }
  }

  return {
    'source': source,
    'medium': medium,
    'campaign': campaign,
    'term': term,
    'content': content
  };
};

__referrer_helper.__getTrafficSource = function (b) {
  //Get traffic source in string format
  var trafficSources = {};

  if (__referrer_helper.__reviveFirstSession && __referrer_helper.__reviveFirstSession === true) {
    trafficSources = __referrer_helper.__crumbleCookie(__referrer_helper.__firstSessionCookieName) || __referrer_helper.__calculateTrafficSource(b);
  } else {
    trafficSources = __referrer_helper.__calculateTrafficSource(b);
  }

  var source = (typeof trafficSources.source === 'undefined' || trafficSources.source.length === 0) ? 'direct' : trafficSources.source;
  var medium = (typeof trafficSources.medium === 'undefined' || trafficSources.medium.length === 0) ? '' : trafficSources.medium;
  var campaign = (typeof trafficSources.campaign === 'undefined' || trafficSources.campaign.length === 0) ? '' : trafficSources.campaign;
  var content = (typeof trafficSources.content === 'undefined' || trafficSources.content.length === 0) ? '' : trafficSources.content;
  var term = (typeof trafficSources.term === 'undefined' || trafficSources.term.length === 0) ? '' : trafficSources.term;
  var rightNow = new Date();
  return 'source:' + source + '$medium:' + medium + '$campaign:' + campaign + '$term:' + term + '$content:' + content + '$date:' + rightNow.toISOString().slice(0, 19).replace(/T/g, " ");
};

__referrer_helper.getTrafficSourceFromCookie = function () {
  //Get traffic source from cookie in object format, empty object is returned if cookie empty or not present
  function isEmpty(obj) {
    if (typeof obj === 'object' && obj !== null) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }

      return JSON.stringify(obj) === JSON.stringify({});
    } else {
      return true;
    }
  }

  return (__referrer_helper.__crumbleCookie(__referrer_helper.__returningSessionCookieName) && !isEmpty(__referrer_helper.__crumbleCookie(__referrer_helper.__returningSessionCookieName)) ? __referrer_helper.__crumbleCookie(__referrer_helper.__returningSessionCookieName) : __referrer_helper.__crumbleCookie(__referrer_helper.__firstSessionCookieName)) || {};
};

__referrer_helper.setTrafficSource = function (b) {
  //Set traffic source in cookie, depending on configuration
  if (__referrer_helper.__firstSessionCookieName && __referrer_helper.__firstSessionCookieName.length) {
    var session = __referrer_helper.__crumbleCookie(__referrer_helper.__firstSessionCookieName);
    if (typeof session == 'undefined') {
      //First time session
      __referrer_helper.__writeLogic(__referrer_helper.__firstSessionCookieName,b);
    } else {
      if (__referrer_helper.__reviveFirstSession && __referrer_helper.__reviveFirstSession === true) {
        //Revive first session
        __referrer_helper.__writeLogic(__referrer_helper.__firstSessionCookieName,b);
      } else {
        //Returning session
        if (__referrer_helper.__returningSessionCookieName && __referrer_helper.__returningSessionCookieName.length) {
          __referrer_helper.__writeLogic(__referrer_helper.__returningSessionCookieName,b);
        }
      }
    }
  }
};