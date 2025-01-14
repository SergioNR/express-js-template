!(function (t, e) { let o; let n; let p; let r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { const o = e.split('.'); o.length == 2 && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }(p = t.createElement('script')).type = 'text/javascript', p.crossOrigin = 'anonymous', p.async = !0, p.src = `${s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com')}/static/array.js`, (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r); let u = e; for (void 0 !== a ? u = e[a] = [] : a = 'posthog', u.people = u.people || [], u.toString = function (t) { let e = 'posthog'; return a !== 'posthog' && (e += `.${a}`), t || (e += ' (stub)'), e; }, u.people.toString = function () { return `${u.toString(1)}.people (stub)`; }, o = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId'.split(' '), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]); }, e.__SV = 1); }(document, window.posthog || []));

posthog.init('phc_o6Irh4IJIejYBaZCnS115xMx05UMMLekRsQjZSbJ4O8', {
  api_host: 'https://eu.i.posthog.com',
  person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
});

//* FORM TRACKING EVENTS

export const postHogFormImpression = (formName) => {
  posthog.capture(
    'formStepImpression',
    { formName: formName },
  );
};

export const postHogFormSubmit = (formName) => {
  posthog.capture(
    'formSubmit',
    { formName: formName },
  );
};

//* FORM FIELD TRACKING EVENTS

export const postHogFormStepImpression = (formName, formStep) => {
  posthog.capture(
    'formStepImpression',
    {
      formName: formStep,
      formStep: formStep || 'formStep not defined',
    },
  );
};

export const postHogFormFieldInteraction = (formName, fieldName) => {
  posthog.capture(
    'formFieldInteraction',
    {
      formName: formName,
      fieldName: fieldName,
    },
  );
};

export const postHogFormStepSubmit = (formName, formStep) => {
  posthog.capture(
    'formSubmit',
    {
      formName: formName,
      formStep: formStep || 'formStep not defined',
    },
  );
};

//* UI ELEMENT TRACKING EVENTS

export const posthogUiElementInteraction = (elementInnerText, elementGroup) => {
  posthog.capture(
    'uiElementInteraction',
    {
      elementName: elementInnerText,
      elementGroup: elementGroup || 'elementGroup not defined',
    },
  );
};
