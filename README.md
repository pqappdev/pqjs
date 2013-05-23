pqjs
====

social sdk js class 

<pre><code>
  PQ.config({
      id: "facebook appid",
      scope: "facebook permission scopes",
      baseUrl: "application base url",
      appLink: "application link",
      appPageLink: "application page link",
      pageLikeLink: "application page like link",
      pageId: "application page id",
      pageLiked:bool, //application liked? is coming from backend signed_request parse
      redirectUri: "application url redirect uri for fblogin",
      formUserExists: bool, //generally applications are using user form for user details is it exists?
      share: {json}, //facebook general share data {name,description,picture,caption} check developers.facebook.com  
      analyticsCode: "" //google analytics code
  });
</code></pre>
