export const queryParser = (req, res, next) => {
  req.session.gclid = req.session.gclid ? req.session.gclid : req.query.gclid;
  req.session.fbclid = req.session.fbclid ? req.session.fbclid : req.query.fbclid;

  req.session.utmSource = req.session.utmSource ? req.session.utmSource : req.query.utm_source;
  req.session.utmMedium = req.session.utmMedium ? req.session.utmMedium : req.query.utm_medium;
  req.session.utmCampaign = req.session.utmCampaign ? req.session.utmCampaign : req.query.utm_campaign;
  req.session.utmContent = req.session.utmContent ? req.session.utmContent : req.query.utm_content;
  req.session.utmTerm = req.session.utmTerm ? req.session.utmTerm : req.query.utm_term;
  req.session.placement = req.session.placement ? req.session.placement : req.query.placement;
  req.session.adset = req.session.adset ? req.session.adset : req.query.adset;
  req.session.campaignID = req.session.campaignID ? req.session.campaignID : req.query.campaignID;
  req.session.adsetID = req.session.adsetID ? req.session.adsetID : req.query.adsetID;
  req.session.adID = req.session.adID ? req.session.adID : req.query.adID;
  req.session.ttclid = req.session.ttclid ? req.session.ttclid : req.query.ttclid;

  req.session.userAgent = req.headers['user-agent'];
  req.session.ipAddress = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress || req.ip;

  next();
};
