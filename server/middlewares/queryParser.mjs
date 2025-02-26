export const queryParser = (req, res, next) => {
// TODO -- NEED TO REFACTOR THIS TO LOCALSTORAGE

  //   req.session.gclid =
  //   req.session.fbclid =

  //   req.session.utmSource =
  //   req.session.utmMedium =
  //   req.session.utmCampaign =
  //   req.session.utmContent =
  //   req.session.utmTerm =
  //   req.session.placement =
  //   req.session.adset =
  //   req.session.campaignID =
  //   req.session.adsetID =
  //   req.session.adID =
  //   req.session.ttclid =

  // req.session.userAgent = req.headers['user-agent'];
  // req.session.ipAddress = req.headers['x-forwarded-for'] ?
  // req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress || req.ip;

  next();
};
